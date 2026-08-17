/**
 * search.js — Вкладка «Найти книгу».
 * Адаптация search.js: searchBooks() + findExactResult().
 * Убраны: буккроссинг Telegram, лист ожидания email.
 */

import { getDB } from '@db';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// ── Helpers (адаптированы из search.js) ─────────────────────────────

function parseDate(dateStr) {
    if (!dateStr) return null;
    const clean = dateStr.trim().split(' ')[0];
    const parts = clean.split('-').map(Number);
    if (parts.length < 2 || isNaN(parts[0])) return null;
    return new Date(parts[0], parts[1] - 1, parts[2] || 1);
}

function isPast(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return false;
    const hasDay = dateStr.trim().split(' ')[0].split('-').length >= 3;
    if (!hasDay) { const last = new Date(d.getFullYear(), d.getMonth()+1, 0); return last < TODAY; }
    return d < TODAY;
}

function getCityName(db, cityId) {
    const city = db.cities.find(c => c.id === cityId);
    return city ? city.name : '';
}

function isOnlineClub(db, club) {
    const city = db.cities.find(c => c.id === club.cityId);
    return city && city.name === 'Онлайн';
}

// ── Search logic (из search.js) ──────────────────────────────────────

function searchBooks(query) {
    const db = getDB();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const found = {};
    db.books.forEach(book => {
        if (
            (book.title  && book.title.toLowerCase().includes(q)) ||
            (book.author && book.author.toLowerCase().includes(q))
        ) {
            const key = book.title.toLowerCase();
            if (!found[key]) {
                found[key] = { title: book.title, author: book.author, coverUrl: book.coverUrl || '', clubs: [], upcoming: [] };
            }
            const club = db.clubs.find(c => c.id === book.clubId);
            if (club && !found[key].clubs.find(c => c.id === club.id)) {
                const cityName = getCityName(db, club.cityId);
                const online = isOnlineClub(db, club);
                found[key].clubs.push({ ...club, cityName, online });
            }
            // Upcoming events for this book
            if (book.meetingDate && !isPast(book.meetingDate)) {
                found[key].upcoming.push(book);
            }
        }
    });
    return Object.values(found);
}

// ── Card builder ──────────────────────────────────────────────────────

function buildResultCard(result) {
    const card = document.createElement('div');
    card.className = 'm-search-result-card';

    const head = document.createElement('div');
    head.className = 'm-search-result-head';

    // Cover
    const cover = document.createElement('div');
    cover.className = 'm-search-result-cover';
    if (result.coverUrl && !result.coverUrl.startsWith('data:image/svg')) {
        const img = document.createElement('img');
        img.src = result.coverUrl;
        img.alt = result.title;
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => { img.replaceWith(document.createTextNode('📖')); };
        cover.appendChild(img);
    } else {
        cover.textContent = '📖';
    }
    head.appendChild(cover);

    // Info
    const info = document.createElement('div');
    info.className = 'm-search-result-info';
    info.innerHTML = `
        <div class="m-search-result-title">${result.title}</div>
        ${result.author ? `<div class="m-search-result-author">${result.author}</div>` : ''}`;

    // Club chips
    if (result.clubs.length > 0) {
        const label = document.createElement('div');
        label.className = 'm-search-clubs-label';
        label.textContent = 'Читают в:';
        info.appendChild(label);

        const chipsWrap = document.createElement('div');
        result.clubs.forEach(club => {
            const chip = document.createElement('span');
            chip.className = 'm-search-club-chip';
            chip.innerHTML = `<i class="ph ph-planet"></i> ${club.name}${club.cityName ? ' · ' + club.cityName : ''}`;
            chipsWrap.appendChild(chip);
        });
        info.appendChild(chipsWrap);
    }

    head.appendChild(info);
    card.appendChild(head);

    // Upcoming events for this book
    if (result.upcoming.length > 0) {
        const db = getDB();
        const evSection = document.createElement('div');
        evSection.style.cssText = 'border-top: 1px solid var(--border); padding: 10px 14px;';
        evSection.innerHTML = '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);margin-bottom:8px">📅 Предстоящие встречи</div>';

        result.upcoming.sort((a,b) => (a.meetingDate||'').localeCompare(b.meetingDate||'')).forEach(book => {
            const club = db.clubs.find(c => c.id === book.clubId);
            const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
            const d = parseDate(book.meetingDate);
            const dateLabel = d ? `${d.getDate()} ${MONTHS[d.getMonth()]}${book.meetingTime ? ', '+book.meetingTime : ''}` : book.meetingDate;

            const evRow = document.createElement(book.registerUrl ? 'a' : 'div');
            evRow.style.cssText = 'display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);text-decoration:none;color:inherit';
            if (book.registerUrl) { evRow.href = book.registerUrl; evRow.target = '_blank'; evRow.rel = 'noopener noreferrer'; }
            evRow.innerHTML = `
                <div style="font-size:12px;font-weight:700;color:var(--accent3);flex-shrink:0;min-width:64px">${dateLabel}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${club?.name || ''}</div>
                    ${book.location ? `<div style="font-size:11px;color:var(--text3)">${book.location}</div>` : ''}
                </div>
                ${book.registerUrl ? '<i class="ph ph-arrow-right" style="color:var(--text3);font-size:14px;flex-shrink:0"></i>' : ''}`;
            evSection.appendChild(evRow);
        });
        card.appendChild(evSection);
    }

    return card;
}

// ── Debounce ──────────────────────────────────────────────────────────
function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Main init ─────────────────────────────────────────────────────────
export function initSearch() {
    const input = document.getElementById('search-input');
    const resultsEl = document.getElementById('search-results');
    if (!input || !resultsEl) return;

    const renderHint = () => {
        resultsEl.innerHTML = `
            <div class="m-search-hint">
                <i class="ph ph-books"></i>
                <p>Введите название книги или имя автора</p>
            </div>`;
    };

    const renderResults = (query) => {
        const results = searchBooks(query);
        resultsEl.innerHTML = '';

        if (results.length === 0) {
            resultsEl.innerHTML = `<div class="m-search-no-result">По запросу «${query}» ничего не найдено</div>`;
            return;
        }

        const list = document.createElement('div');
        list.className = 'm-search-list';
        results.forEach(r => list.appendChild(buildResultCard(r)));
        resultsEl.appendChild(list);
    };

    const onInput = debounce(() => {
        const q = input.value.trim();
        if (!q) { renderHint(); return; }
        renderResults(q);
    }, 280);

    input.addEventListener('input', onInput);

    // Clear on search cancel
    input.addEventListener('search', () => {
        if (!input.value) renderHint();
    });

    renderHint();
}
