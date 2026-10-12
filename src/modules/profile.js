/**
 * profile.js — Личный профиль читателя (Этап 1: Local-First + Supabase Cloud Sync).
 * Хранение отметок «Прочитано» и «В планах» в localStorage и Supabase.
 * Вход в 1 клик через Telegram и Email, расчёт совместимости с клубами.
 */

import { getDB } from '@db';
import {
    getCurrentUser,
    fetchCloudShelf,
    fetchCloudProfile,
    syncLocalShelfToCloud,
    syncClubToCloud,
    saveCloudBookStatus,
    removeCloudBookStatus,
    updateCloudProfile,
    signOut as supabaseSignOut,
    onAuthStateChange,
    isSupabaseConfigured
} from '../services/supabase.js';
import { openAuthModal } from './authModal.js';

const STORAGE_KEY = 'bookuniverse_local_profile_v1';

let currentCloudUser = null;
let isCloudSyncing = false;

// ── Helpers ──────────────────────────────────────────────────────────

function normalizeTitle(title) {
    if (!title) return '';
    return title.trim().toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/["""''«»\u2018\u2019\u201c\u201d\u00ab\u00bb]/g, '')
        .replace(/\s+/g, ' ').trim();
}

export function getBookKey(book) {
    if (!book) return '';
    const a = (book.author || '').trim().toLowerCase();
    const t = normalizeTitle(book.title || '');
    return `${a}::${t}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function pluralize(count, forms) {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
}

// ── State Management ──────────────────────────────────────────────────

const DEFAULT_PROFILE = {
    user: {
        name: 'Читатель',
        avatar: '📚',
        bio: 'Исследую книжные миры',
        joinedDate: new Date().toISOString().split('T')[0]
    },
    books: {} // { [bookKey]: { status: 'read'|'want', dateAdded, title, author, coverUrl } }
};

export function getProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                user: { ...DEFAULT_PROFILE.user, ...(parsed.user || {}) },
                books: parsed.books || {}
            };
        }
    } catch (_) {}
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
}

function saveProfile(profile) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
    } catch (_) {}
}

export function getBookStatus(book) {
    const key = getBookKey(book);
    if (!key) return null;
    const profile = getProfile();
    return profile.books[key]?.status || null;
}

export function setBookStatus(book, status) {
    const key = getBookKey(book);
    if (!key) return;
    const profile = getProfile();

    if (!status) {
        delete profile.books[key];
        if (currentCloudUser) {
            removeCloudBookStatus(key);
        }
    } else {
        const bookData = {
            status,
            title: (book.title || '').trim(),
            author: (book.author || '').trim(),
            coverUrl: book.coverUrl && !book.coverUrl.startsWith('data:image/svg') ? book.coverUrl : null,
            dateAdded: new Date().toISOString()
        };
        profile.books[key] = bookData;
        if (currentCloudUser) {
            saveCloudBookStatus(key, bookData);
        }
    }

    saveProfile(profile);
}

export function updateUserProfile(userData) {
    const profile = getProfile();
    profile.user = { ...profile.user, ...userData };
    saveProfile(profile);
    if (currentCloudUser) {
        updateCloudProfile(userData);
    }
}

/** Двусторонняя синхронизация с облаком Supabase */
export async function syncWithCloud(silent = false) {
    if (!currentCloudUser) return;
    if (isCloudSyncing) return;
    isCloudSyncing = true;
    try {
        if (!silent) showToast('Синхронизация...', 'ph-arrows-clockwise');

        // 1. Подгружаем метаданные профиля из облака
        const cloudProfile = await fetchCloudProfile();
        const localProfile = getProfile();

        if (cloudProfile) {
            if (cloudProfile.username) localProfile.user.name = cloudProfile.username;
            if (cloudProfile.avatar) localProfile.user.avatar = cloudProfile.avatar;
            if (cloudProfile.bio) localProfile.user.bio = cloudProfile.bio;
        }

        // 1b. Синхронизация выбранного клуба (из profiles или user_metadata)
        try {
            const localClub = getSelectedClub();
            const metaClub = currentCloudUser?.user_metadata?.my_club;
            let cloudClub = null;
            if (cloudProfile && cloudProfile.my_club_id) {
                const cloudSavedAt = cloudProfile.my_club_saved_at
                    ? new Date(cloudProfile.my_club_saved_at).getTime()
                    : Date.now();
                cloudClub = parseCloudClubId(cloudProfile.my_club_id, cloudSavedAt);
            } else if (metaClub && (metaClub.clubId || metaClub.customName)) {
                cloudClub = metaClub.clubId && String(metaClub.clubId).startsWith('custom::') && !metaClub.isCustom
                    ? parseCloudClubId(metaClub.clubId, metaClub.savedAt)
                    : metaClub;
            }

            if (cloudClub && (!localClub || (cloudClub.savedAt || 0) > (localClub.savedAt || 0))) {
                localStorage.setItem('bookuniverse_my_club_v1', JSON.stringify(cloudClub));
            } else if (localClub && !cloudClub) {
                syncClubToCloud(localClub).catch(() => {});
            }
        } catch (_) {}

        // 2. Подгружаем книги из облака
        const cloudBooks = await fetchCloudShelf();
        if (cloudBooks) {
            // Объединяем локальные и облачные отметки
            const mergedBooks = { ...localProfile.books, ...cloudBooks };
            localProfile.books = mergedBooks;
            saveProfile(localProfile);

            // Отправляем в облако те локальные книги, которых там еще не было
            await syncLocalShelfToCloud(mergedBooks);
        } else {
            // Если в облаке еще нет записей, выгружаем туда все локальные
            await syncLocalShelfToCloud(localProfile.books);
        }

        if (!silent) showToast('Синхронизировано с облаком', 'ph-cloud-check');
        renderProfile();
    } catch (err) {
        console.error('Ошибка синхронизации с Supabase:', err);
        if (!silent) showToast('Ошибка синхронизации', 'ph-warning');
    } finally {
        isCloudSyncing = false;
    }
}

// ── Club Matches Algorithm ───────────────────────────────────────────

export function calculateClubMatches(db) {
    const profile = getProfile();
    const readEntries = Object.entries(profile.books).filter(([_, b]) => b.status === 'read');
    if (readEntries.length === 0) return [];

    const readKeys = new Set(readEntries.map(([k]) => k));

    const matches = [];

    db.clubs.forEach(club => {
        const clubBooks = db.books.filter(b => b.clubId === club.id);
        const matched = [];
        const seenTitles = new Set();

        clubBooks.forEach(b => {
            const k = getBookKey(b);
            const normT = normalizeTitle(b.title);
            if (readKeys.has(k) && !seenTitles.has(normT)) {
                seenTitles.add(normT);
                matched.push(b);
            }
        });

        if (matched.length > 0) {
            const city = db.cities.find(c => c.id === club.cityId);
            matches.push({
                club,
                city,
                matchedBooks: matched,
                matchCount: matched.length
            });
        }
    });

    return matches.sort((a, b) => b.matchCount - a.matchCount);
}

// ── Toast Notification ───────────────────────────────────────────────

export function showToast(message, icon = 'ph-check-circle') {
    let toast = document.getElementById('m-app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'm-app-toast';
        toast.className = 'm-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="ph ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('visible');
    }, 2400);
}

// ── Quick Book Status Picker (Action Sheet) ───────────────────────────

export function openBookStatusPicker(book) {
    const currentStatus = getBookStatus(book);
    const existing = document.getElementById('m-book-action-sheet');
    if (existing) existing.remove();

    const sheet = document.createElement('div');
    sheet.id = 'm-book-action-sheet';
    sheet.className = 'm-action-sheet-backdrop';

    const coverHtml = book.coverUrl && !book.coverUrl.startsWith('data:image/svg')
        ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}" class="m-action-sheet-cover" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode('📖'))" />`
        : `<div class="m-action-sheet-cover-fallback">📖</div>`;

    sheet.innerHTML = `
    <div class="m-action-sheet">
        <div class="m-action-sheet-handle"></div>
        <div class="m-action-sheet-header">
            ${coverHtml}
            <div class="m-action-sheet-info">
                <div class="m-action-sheet-title">${escapeHtml(book.title)}</div>
                ${book.author ? `<div class="m-action-sheet-author">${escapeHtml(book.author)}</div>` : ''}
            </div>
            <button type="button" class="m-action-sheet-close"><i class="ph ph-x"></i></button>
        </div>
        <div class="m-action-sheet-actions">
            <button type="button" class="m-action-btn ${currentStatus === 'read' ? 'active' : ''}" data-status="read">
                <i class="ph-fill ph-check-circle"></i>
                <div class="m-action-btn-text">
                    <span class="m-action-btn-title">Прочитано</span>
                    <span class="m-action-btn-sub">Добавить в прочитанные книги</span>
                </div>
                ${currentStatus === 'read' ? '<i class="ph ph-check m-action-btn-check"></i>' : ''}
            </button>
            <button type="button" class="m-action-btn ${currentStatus === 'want' ? 'active' : ''}" data-status="want">
                <i class="ph-fill ph-bookmark-simple"></i>
                <div class="m-action-btn-text">
                    <span class="m-action-btn-title">В планах</span>
                    <span class="m-action-btn-sub">Хочу прочитать и обсудить</span>
                </div>
                ${currentStatus === 'want' ? '<i class="ph ph-check m-action-btn-check"></i>' : ''}
            </button>
            ${currentStatus ? `
            <button type="button" class="m-action-btn remove" data-status="remove">
                <i class="ph ph-trash"></i>
                <div class="m-action-btn-text">
                    <span class="m-action-btn-title">Убрать из профиля</span>
                    <span class="m-action-btn-sub">Удалить отметку</span>
                </div>
            </button>` : ''}
        </div>
    </div>`;

    document.body.appendChild(sheet);

    function close() {
        sheet.classList.remove('open');
        setTimeout(() => sheet.remove(), 250);
    }

    sheet.querySelector('.m-action-sheet-close').addEventListener('click', close);
    sheet.addEventListener('click', e => {
        if (e.target === sheet) close();
    });

    sheet.querySelectorAll('.m-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.status;
            if (action === 'remove') {
                setBookStatus(book, null);
                showToast('Удалено из профиля', 'ph-trash');
            } else if (action === 'read') {
                setBookStatus(book, 'read');
                showToast('Отмечено как прочитанное ✓', 'ph-check-circle');
            } else if (action === 'want') {
                setBookStatus(book, 'want');
                showToast('Добавлено в планы 🔖', 'ph-bookmark-simple');
            }
            close();
        });
    });

    requestAnimationFrame(() => sheet.classList.add('open'));
}

// ── Profile Screen Rendering ──────────────────────────────────────────

const AVAILABLE_AVATARS = ['📚', '☕', '🦉', '🪐', '📖', '✨', '🦊', '🐉', '🎨', '🦁', '🌿', '🧭'];

let activeProfileTab = 'read'; // 'read' | 'want' | 'clubs'
// ── Club Selector ────────────────────────────────────────────────────────────

const CLUB_COOLDOWN_DAYS = 7;

function parseCloudClubId(rawClubId, savedAt) {
    if (!rawClubId) return null;
    if (String(rawClubId).startsWith('custom::')) {
        const parts = String(rawClubId).split('::');
        return {
            clubId: rawClubId,
            isCustom: true,
            customName: parts[1] || 'Мой клуб',
            customContact: parts[2] || '',
            status: parts[3] || 'pending',
            savedAt: savedAt || Date.now()
        };
    }
    return {
        clubId: rawClubId,
        isCustom: false,
        savedAt: savedAt || Date.now()
    };
}

function getSelectedClub() {
    try {
        const raw = localStorage.getItem('bookuniverse_my_club_v1');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.clubId && String(parsed.clubId).startsWith('custom::') && !parsed.isCustom) {
                return parseCloudClubId(parsed.clubId, parsed.savedAt);
            }
            if (parsed && (parsed.clubId || parsed.customName)) {
                return parsed;
            }
        }
    } catch (_) {}

    // Fallback to Supabase user_metadata if available
    try {
        const metaClub = currentCloudUser?.user_metadata?.my_club;
        if (metaClub && (metaClub.clubId || metaClub.customName)) {
            const normalized = metaClub.clubId && String(metaClub.clubId).startsWith('custom::') && !metaClub.isCustom
                ? parseCloudClubId(metaClub.clubId, metaClub.savedAt)
                : metaClub;
            if (normalized) {
                localStorage.setItem('bookuniverse_my_club_v1', JSON.stringify(normalized));
                return normalized;
            }
        }
    } catch (_) {}

    return null;
}

function saveSelectedClubData(payload) {
    const data = typeof payload === 'string'
        ? { clubId: payload, isCustom: false, savedAt: Date.now() }
        : { ...payload, savedAt: Date.now() };
    try {
        localStorage.setItem('bookuniverse_my_club_v1', JSON.stringify(data));
    } catch (_) {}
    return data;
}

function canChangeClub(savedClub) {
    if (!savedClub || !savedClub.savedAt) return true;
    const diffMs = Date.now() - savedClub.savedAt;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= CLUB_COOLDOWN_DAYS;
}

function isOnlineCityObj(city) {
    if (!city || !city.name) return false;
    return city.name.trim().toLowerCase() === 'онлайн';
}

function getOnlineCityIds(db) {
    return (db.cities || [])
        .filter(c => isOnlineCityObj(c))
        .map(c => c.id);
}

function buildClubHeroBadgeHtml(db) {
    const myClub = getSelectedClub();
    if (!myClub || (!myClub.clubId && !myClub.customName)) {
        return '';
    }

    const changeDate = new Date((myClub.savedAt || Date.now()) + CLUB_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const changeDateStr = changeDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const cooldownLocked = !canChangeClub(myClub);

    if (myClub.isCustom || String(myClub.clubId || '').startsWith('custom::')) {
        const customName = myClub.customName || String(myClub.clubId).split('::')[1] || 'Мой клуб';
        const statusLabel = myClub.status === 'verified' ? 'Подтверждён' : 'На проверке';
        const statusClass = myClub.status === 'verified' ? 'is-verified' : 'is-pending';
        return `
        <div class="m-profile-club-hero-badge">
            <div class="m-profile-club-chip ${statusClass}" style="--club-color: #fbbf24">
                <i class="ph-fill ph-clock-countdown m-profile-club-chip-icon"></i>
                <span class="m-profile-club-chip-name">${escapeHtml(customName)}</span>
                <span class="m-profile-club-status-pill">${statusLabel}</span>
            </div>
            ${cooldownLocked ? `<div class="m-profile-club-cooldown-hint">Сменить клуб можно ${changeDateStr}</div>` : ''}
        </div>`;
    }

    const club = (db.clubs || []).find(c => c.id === myClub.clubId);
    const clubName = club?.name || myClub.clubName;
    if (!clubName) return '';

    const clubColor = club?.color || myClub.clubColor || '#a78bfa';
    const onlineCityIds = getOnlineCityIds(db);
    let cityName = myClub.cityName || '';
    if (club) {
        const isOnline = club.isOnline || club.online || club.cityId === 'online' || onlineCityIds.includes(club.cityId);
        const cityObj = isOnline ? { name: 'Онлайн' } : (db.cities || []).find(c => c.id === club.cityId);
        if (cityObj?.name) cityName = cityObj.name;
    }

    return `
    <div class="m-profile-club-hero-badge">
        <div class="m-profile-club-chip" style="--club-color: ${escapeHtml(clubColor)}">
            <i class="ph-fill ph-users-three m-profile-club-chip-icon"></i>
            <span class="m-profile-club-chip-name">${escapeHtml(clubName)}</span>
            ${cityName ? `<span class="m-profile-club-chip-city">· ${escapeHtml(cityName)}</span>` : ''}
        </div>
        ${cooldownLocked ? `<div class="m-profile-club-cooldown-hint">Сменить клуб можно ${changeDateStr}</div>` : ''}
    </div>`;
}

function buildClubSelectorHtml(db) {
    const myClub = getSelectedClub();
    const badgeHtml = buildClubHeroBadgeHtml(db);
    if (myClub && badgeHtml && !canChangeClub(myClub)) {
        // Filters disappear completely once saved and badge is active
        return '';
    }

    const ONLINE_ID = '__online__';
    const onlineCityIds = getOnlineCityIds(db);

    // Offline cities (with clubs) deduplicated from "Онлайн"
    const offlineCities = (db.cities || []).filter(c =>
        !isOnlineCityObj(c) && (db.clubs || []).some(cl => cl.cityId === c.id)
    );

    const hasOnlineClubs = (db.clubs || []).some(cl =>
        cl.isOnline || cl.online || cl.cityId === 'online' || onlineCityIds.includes(cl.cityId)
    );

    const cities = [...offlineCities];
    if (hasOnlineClubs) {
        cities.push({ id: ONLINE_ID, name: 'Онлайн' });
    }

    const cityOptions = cities.map(c =>
        `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`
    ).join('');

    return `
    <div class="m-profile-club-section" id="m-club-picker-section">
        <div class="m-profile-club-header-row">
            <div class="m-profile-club-label"><i class="ph-fill ph-users-three"></i> Мой книжный клуб</div>
            <button type="button" class="m-profile-club-toggle-custom" id="m-btn-toggle-custom-club">
                Нет моего клуба? Добавить
            </button>
        </div>

        <!-- Режим 1: Выбор из списка -->
        <div id="m-club-list-mode">
            <div class="m-profile-club-selects">
                <select class="m-profile-club-select" id="m-club-city-select">
                    <option value="">— выберите город —</option>
                    ${cityOptions}
                </select>
                <select class="m-profile-club-select" id="m-club-club-select" disabled>
                    <option value="">— сначала выберите город —</option>
                </select>
            </div>
            <button type="button" class="m-profile-club-save-btn" id="m-club-save-btn" disabled>
                <i class="ph ph-floppy-disk"></i> Сохранить
            </button>
        </div>

        <!-- Режим 2: Ручное добавление клуба (на проверку) -->
        <div id="m-club-custom-mode" style="display: none;">
            <div class="m-profile-club-custom-fields">
                <input type="text" class="m-profile-club-input" id="m-custom-club-name"
                    placeholder="Название клуба или ссылка на Telegram" maxlength="80" />
                <input type="text" class="m-profile-club-input" id="m-custom-club-contact"
                    placeholder="Город, сайт или соцсеть (если без Telegram)" maxlength="120" />
                <div class="m-profile-club-custom-note">
                    <i class="ph ph-info"></i> Заявка получит статус «На проверке» — мы проверим клуб вручную.
                </div>
            </div>
            <button type="button" class="m-profile-club-save-btn" id="m-custom-club-save-btn" disabled>
                <i class="ph ph-paper-plane-tilt"></i> Сохранить
            </button>
        </div>
    </div>`;
}

function attachClubSelectorListeners(container, db) {
    const ONLINE_ID = '__online__';
    const onlineCityIds = getOnlineCityIds(db);

    const citySelect = container.querySelector('#m-club-city-select');
    const clubSelect = container.querySelector('#m-club-club-select');
    const saveBtn = container.querySelector('#m-club-save-btn');

    const toggleBtn = container.querySelector('#m-btn-toggle-custom-club');
    const listMode = container.querySelector('#m-club-list-mode');
    const customMode = container.querySelector('#m-club-custom-mode');
    const customNameInput = container.querySelector('#m-custom-club-name');
    const customContactInput = container.querySelector('#m-custom-club-contact');
    const customSaveBtn = container.querySelector('#m-custom-club-save-btn');

    if (toggleBtn && listMode && customMode) {
        let isCustomOpen = false;
        toggleBtn.addEventListener('click', () => {
            isCustomOpen = !isCustomOpen;
            listMode.style.display = isCustomOpen ? 'none' : 'block';
            customMode.style.display = isCustomOpen ? 'block' : 'none';
            toggleBtn.textContent = isCustomOpen ? '← Выбрать из списка' : 'Нет моего клуба? Добавить';
        });
    }

    if (customNameInput && customSaveBtn) {
        const updateCustomBtnState = () => {
            const hasVal = Boolean(customNameInput.value.trim() || (customContactInput && customContactInput.value.trim()));
            customSaveBtn.disabled = !hasVal;
        };
        customNameInput.addEventListener('input', updateCustomBtnState);
        customNameInput.addEventListener('change', updateCustomBtnState);
        if (customContactInput) {
            customContactInput.addEventListener('input', updateCustomBtnState);
            customContactInput.addEventListener('change', updateCustomBtnState);
        }

        customSaveBtn.addEventListener('click', async () => {
            const customName = customNameInput.value.trim() || (customContactInput?.value || '').trim();
            if (!customName) return;
            const customContact = (customContactInput?.value || '').trim();
            const serializedId = `custom::${customName}::${customContact}::pending`;

            const data = saveSelectedClubData({
                clubId: serializedId,
                isCustom: true,
                customName,
                customContact,
                status: 'pending'
            });
            syncClubToCloud(data).catch(() => {});
            showToast('Клуб отправлен на проверку!', 'ph-clock-countdown');
            renderProfile();
        });
    }

    if (!citySelect || !clubSelect || !saveBtn) return;

    citySelect.addEventListener('change', () => {
        const cityId = citySelect.value;
        clubSelect.innerHTML = '';
        if (!cityId) {
            clubSelect.innerHTML = '<option value="">— сначала выберите город —</option>';
            clubSelect.disabled = true;
            saveBtn.disabled = true;
            return;
        }
        let clubs;
        if (cityId === ONLINE_ID) {
            clubs = (db.clubs || []).filter(c =>
                c.isOnline || c.online || c.cityId === 'online' || onlineCityIds.includes(c.cityId)
            );
        } else {
            clubs = (db.clubs || []).filter(c => c.cityId === cityId);
        }
        clubSelect.innerHTML = '<option value="">— выберите клуб —</option>' +
            clubs.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
        clubSelect.disabled = false;
        saveBtn.disabled = true;
    });

    clubSelect.addEventListener('change', () => {
        saveBtn.disabled = !clubSelect.value;
    });

    saveBtn.addEventListener('click', async () => {
        const clubId = clubSelect.value;
        if (!clubId) return;
        const clubObj = (db.clubs || []).find(c => c.id === clubId);
        const isOnline = clubObj && (clubObj.isOnline || clubObj.online || clubObj.cityId === 'online' || onlineCityIds.includes(clubObj.cityId));
        const cityObj = clubObj ? (isOnline ? { name: 'Онлайн' } : (db.cities || []).find(c => c.id === clubObj.cityId)) : null;

        const data = saveSelectedClubData({
            clubId,
            clubName: clubObj?.name || '',
            clubColor: clubObj?.color || '#a78bfa',
            cityName: cityObj?.name || '',
            isCustom: false
        });
        syncClubToCloud(data).catch(() => {});
        showToast('Клуб сохранён!', 'ph-users-three');
        renderProfile();
    });
}

export async function checkAndSyncSession() {
    try {
        const user = await getCurrentUser();
        if (user) {
            currentCloudUser = user;
            await syncWithCloud(true);
        }
    } catch (_) {}
}

export function renderProfile() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    const db = getDB();
    const profile = getProfile();

    const readBooks = Object.values(profile.books).filter(b => b.status === 'read');
    const wantBooks = Object.values(profile.books).filter(b => b.status === 'want');
    const clubMatches = calculateClubMatches(db);

    const clubHeroBadgeHtml = buildClubHeroBadgeHtml(db);
    const clubSelectorHtml = buildClubSelectorHtml(db);

    const totalRead = readBooks.length;
    const totalWant = wantBooks.length;

    // Cloud session check & user display
    let displayName = profile.user.name;
    let userSub = profile.user.bio;
    if (currentCloudUser) {
        const meta = currentCloudUser.user_metadata || {};
        if (meta.username) displayName = meta.username;
        if (meta.telegram_username) userSub = '@' + meta.telegram_username + ' · Авторизован через Telegram';
        else if (currentCloudUser.email && !currentCloudUser.email.includes('@telegram.bookuniverse')) userSub = currentCloudUser.email + ' · Облачный профиль';
        else if (meta.telegram_id) userSub = 'Telegram ID: ' + meta.telegram_id + ' · Синхронизировано';
    }

    // Header & User Info
    const heroHtml = `
    <div class="m-profile-hero">
        <div class="m-profile-avatar-wrap">
            <button type="button" class="m-profile-avatar" id="btn-change-avatar" title="Сменить аватар">
                ${profile.user.avatar || '📚'}
                <span class="m-avatar-edit-icon"><i class="ph ph-pencil-simple"></i></span>
            </button>
        </div>
        <div class="m-profile-user-info">
            <div class="m-profile-name-row">
                <span class="m-profile-name" id="profile-name-display">${escapeHtml(displayName)}</span>
                ${currentCloudUser ? '<span class="m-profile-badge-auth" title="Авторизован"><i class="ph-fill ph-check-circle"></i></span>' : ''}
                <button type="button" class="m-profile-edit-name-btn" id="btn-edit-name" title="Изменить имя">
                    <i class="ph ph-pencil-simple"></i>
                </button>
            </div>
            <div class="m-profile-bio">${escapeHtml(userSub)}</div>
            ${clubHeroBadgeHtml}
        </div>
    </div>

    ${clubSelectorHtml}

    <!-- Counters -->
    <div class="m-profile-stats-row">
        <div class="m-profile-stat-box ${activeProfileTab === 'read' ? 'active' : ''}" data-tab="read">
            <div class="m-profile-stat-val">${totalRead}</div>
            <div class="m-profile-stat-lbl">${pluralize(totalRead, ['прочитана', 'прочитано', 'прочитано'])}</div>
        </div>
        <div class="m-profile-stat-box ${activeProfileTab === 'want' ? 'active' : ''}" data-tab="want">
            <div class="m-profile-stat-val">${totalWant}</div>
            <div class="m-profile-stat-lbl">${pluralize(totalWant, ['в планах', 'в планах', 'в планах'])}</div>
        </div>
    </div>

    <!-- Tabs switcher -->
    <div class="m-profile-tabs">
        <button type="button" class="m-profile-tab ${activeProfileTab === 'read' ? 'active' : ''}" data-tab="read">
            <i class="ph-fill ph-check-circle"></i> Прочитано (${totalRead})
        </button>
        <button type="button" class="m-profile-tab ${activeProfileTab === 'want' ? 'active' : ''}" data-tab="want">
            <i class="ph-fill ph-bookmark-simple"></i> В планах (${totalWant})
        </button>
    </div>`;

    // Tab content
    let tabContentHtml = '';

    if (activeProfileTab === 'read') {
        if (totalRead === 0) {
            tabContentHtml = `
            <div class="m-profile-empty">
                <div class="m-profile-empty-icon">📖</div>
                <div class="m-profile-empty-title">Полка пока пуста</div>
                <div class="m-profile-empty-desc">
                    Отмечайте прочитанные книги с помощью кнопки <i class="ph ph-bookmark-simple"></i> в карточках событий, клубов или поиске.
                </div>
            </div>`;
        } else {
            const items = readBooks.map(book => {
                const coverHtml = book.coverUrl
                    ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}" class="m-shelf-cover" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode('📖'))" />`
                    : `<div class="m-shelf-cover-fallback">📖</div>`;
                return `
                <div class="m-shelf-item" data-title="${escapeHtml(book.title)}" data-author="${escapeHtml(book.author)}">
                    <div class="m-shelf-cover-wrap">
                        ${coverHtml}
                        <button type="button" class="m-shelf-status-btn is-read" title="Изменить статус">
                            <i class="ph-fill ph-check-circle"></i>
                        </button>
                    </div>
                    <div class="m-shelf-info">
                        <div class="m-shelf-title">${escapeHtml(book.title)}</div>
                        ${book.author ? `<div class="m-shelf-author">${escapeHtml(book.author)}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
            tabContentHtml = `<div class="m-shelf-grid">${items}</div>`;
        }
    } else if (activeProfileTab === 'want') {
        if (totalWant === 0) {
            tabContentHtml = `
            <div class="m-profile-empty">
                <div class="m-profile-empty-icon">🔖</div>
                <div class="m-profile-empty-title">Список планов пуст</div>
                <div class="m-profile-empty-desc">
                    Добавляйте книги, которые хотите прочитать и обсудить на встречах книжных клубов.
                </div>
            </div>`;
        } else {
            const items = wantBooks.map(book => {
                const coverHtml = book.coverUrl
                    ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}" class="m-shelf-cover" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode('📖'))" />`
                    : `<div class="m-shelf-cover-fallback">📖</div>`;
                return `
                <div class="m-shelf-item" data-title="${escapeHtml(book.title)}" data-author="${escapeHtml(book.author)}">
                    <div class="m-shelf-cover-wrap">
                        ${coverHtml}
                        <button type="button" class="m-shelf-status-btn is-want" title="Изменить статус">
                            <i class="ph-fill ph-bookmark-simple"></i>
                        </button>
                    </div>
                    <div class="m-shelf-info">
                        <div class="m-shelf-title">${escapeHtml(book.title)}</div>
                        ${book.author ? `<div class="m-shelf-author">${escapeHtml(book.author)}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
            tabContentHtml = `<div class="m-shelf-grid">${items}</div>`;
        }
    }

    // Cloud Sync Card (Supabase + Telegram)
    let syncCardHtml = '';
    const configured = isSupabaseConfigured();

    if (currentCloudUser) {
        const meta = currentCloudUser.user_metadata || {};
        const isTelegram = meta.telegram_id || currentCloudUser.email?.includes('@telegram.bookuniverse');
        const userIdentifier = isTelegram 
            ? (meta.telegram_username ? `@${escapeHtml(meta.telegram_username)}` : (meta.username || 'Telegram читатель'))
            : escapeHtml(currentCloudUser.email || 'Пользователь');

        syncCardHtml = `
        <div class="m-profile-sync-teaser is-connected">
            <div class="m-sync-icon success"><i class="ph-fill ph-cloud-check"></i></div>
            <div class="m-sync-text">
                <div class="m-sync-title-row">
                    <div class="m-sync-title">Облачная синхронизация активна</div>
                    <span class="m-sync-badge-live">Live</span>
                </div>
                <div class="m-sync-desc">
                    ${isTelegram ? '<i class="ph-fill ph-telegram-logo"></i> ' : '<i class="ph ph-envelope-simple"></i> '}
                    <strong>${userIdentifier}</strong>
                </div>
                <div class="m-sync-actions">
                    <button type="button" class="m-sync-btn secondary" id="btn-cloud-sync-now" ${isCloudSyncing ? 'disabled' : ''}>
                        <i class="ph ph-arrows-clockwise ${isCloudSyncing ? 'ph-spin' : ''}"></i> Синхронизировать
                    </button>
                    <button type="button" class="m-sync-btn logout" id="btn-cloud-logout">
                        <i class="ph ph-sign-out"></i> Выйти
                    </button>
                </div>
            </div>
        </div>`;
    } else {
        syncCardHtml = `
        <div class="m-profile-sync-teaser">
            <div class="m-sync-icon"><i class="ph ph-cloud-arrow-up"></i></div>
            <div class="m-sync-text">
                <div class="m-sync-title">Облачная синхронизация</div>
                <div class="m-sync-desc">
                    Войдите в 1 клик через Telegram или Email, чтобы сохранить полку между устройствами.
                </div>
                <div class="m-sync-actions">
                    <button type="button" class="m-sync-btn primary" id="btn-cloud-login">
                        <i class="ph-fill ph-telegram-logo"></i> Войти или синхронизировать
                    </button>
                </div>
            </div>
        </div>`;
    }

    container.innerHTML = heroHtml + tabContentHtml + syncCardHtml;

    // Attach listeners
    // Tab switching
    container.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            activeProfileTab = btn.dataset.tab;
            renderProfile();
        });
    });

    // Cloud sync buttons
    container.querySelector('#btn-cloud-login')?.addEventListener('click', () => {
        openAuthModal(() => {
            syncWithCloud(false);
        });
    });

    container.querySelector('#btn-cloud-setup')?.addEventListener('click', () => {
        openAuthModal();
    });

    container.querySelector('#btn-cloud-sync-now')?.addEventListener('click', () => {
        syncWithCloud(false);
    });

    container.querySelector('#btn-cloud-logout')?.addEventListener('click', async () => {
        if (confirm('Вы действительно хотите выйти из аккаунта на этом устройстве?')) {
            await supabaseSignOut();
            currentCloudUser = null;
            showToast('Вы вышли из аккаунта', 'ph-sign-out');
            renderProfile();
        }
    });

    // Edit Name
    const editNameBtn = container.querySelector('#btn-edit-name');
    if (editNameBtn) {
        editNameBtn.addEventListener('click', () => {
            const current = profile.user.name || 'Читатель';
            const newName = prompt('Введите ваше имя читателя:', current);
            if (newName && newName.trim()) {
                updateUserProfile({ name: newName.trim() });
                renderProfile();
                showToast('Имя обновлено', 'ph-user');
            }
        });
    }

    // Change Avatar
    const avatarBtn = container.querySelector('#btn-change-avatar');
    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => {
            openAvatarPicker(profile.user.avatar);
        });
    }

    // Shelf item clicking to change status
    container.querySelectorAll('.m-shelf-item').forEach(el => {
        el.addEventListener('click', () => {
            const title = el.dataset.title;
            const author = el.dataset.author;
            const bookObj = Object.values(profile.books).find(b => b.title === title && b.author === author);
            if (bookObj) {
                openBookStatusPicker(bookObj);
            }
        });
    });

    // Club selector listeners
    attachClubSelectorListeners(container, db);
}

// ── Avatar Picker Modal ───────────────────────────────────────────────

function openAvatarPicker(currentAvatar) {
    const existing = document.getElementById('m-avatar-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'm-avatar-modal';
    modal.className = 'm-action-sheet-backdrop';

    const emojisHtml = AVAILABLE_AVATARS.map(em => `
        <button type="button" class="m-avatar-choice-btn ${em === currentAvatar ? 'selected' : ''}" data-emoji="${em}">
            ${em}
        </button>
    `).join('');

    modal.innerHTML = `
    <div class="m-action-sheet" style="max-width: 380px;">
        <div class="m-action-sheet-handle"></div>
        <div class="m-action-sheet-header">
            <div class="m-action-sheet-title">Выберите аватар читателя</div>
            <button type="button" class="m-action-sheet-close"><i class="ph ph-x"></i></button>
        </div>
        <div class="m-avatar-choices-grid">
            ${emojisHtml}
        </div>
    </div>`;

    document.body.appendChild(modal);

    function close() {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 250);
    }

    modal.querySelector('.m-action-sheet-close').addEventListener('click', close);
    modal.addEventListener('click', e => {
        if (e.target === modal) close();
    });

    modal.querySelectorAll('.m-avatar-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const em = btn.dataset.emoji;
            updateUserProfile({ avatar: em });
            close();
            renderProfile();
            showToast('Аватар обновлен', 'ph-sparkle');
        });
    });

    requestAnimationFrame(() => modal.classList.add('open'));
}

// ── Header Profile Badge ──────────────────────────────────────────────

export function updateHeaderProfileBadge() {
    const badge = document.getElementById('profile-badge-count');
    const profile = getProfile();
    const count = Object.values(profile.books).filter(b => b.status === 'read' || b.status === 'want').length;
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// ── Init ──────────────────────────────────────────────────────────────

export async function initProfile() {
    renderProfile();
    updateHeaderProfileBadge();

    // Первичная проверка активной сессии Supabase
    try {
        currentCloudUser = await getCurrentUser();
        if (currentCloudUser) {
            await syncWithCloud(true);
            renderProfile();
        }
    } catch (_) {}

    // Подписка на изменения состояния авторизации (вход / выход)
    onAuthStateChange(async (event, session) => {
        const prevUser = currentCloudUser;
        currentCloudUser = session?.user || null;

        if (event === 'SIGNED_IN' && currentCloudUser) {
            await syncWithCloud(false);
            renderProfile();
        } else if (event === 'SIGNED_OUT') {
            currentCloudUser = null;
            renderProfile();
        } else if (prevUser?.id !== currentCloudUser?.id) {
            renderProfile();
        }
    });

    window.addEventListener('profileUpdated', () => {
        updateHeaderProfileBadge();
        const profilePage = document.getElementById('page-profile');
        if (profilePage && profilePage.classList.contains('active')) {
            renderProfile();
        }
    });
}


