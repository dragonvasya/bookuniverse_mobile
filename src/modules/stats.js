/**
 * stats.js — Вкладка «Статистика».
 * Топ авторов (в скольких клубах) + топ книг (в скольких клубах).
 */

import { getDB } from '@db';
import { openBookStatusPicker, getBookStatus } from './profile.js';

const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня',
                   'июля','августа','сентября','октября','ноября','декабря'];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// ── Helpers ──────────────────────────────────────────────────────────

function pluralize(count, forms) {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
}

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
    if (!hasDay) {
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return lastDay < TODAY;
    }
    return d < TODAY;
}

function formatDateFull(dateStr, timeStr) {
    const d = parseDate(dateStr);
    if (!d) return dateStr || '';
    const parts = dateStr.trim().split(' ')[0].split('-');
    let s = '';
    if (parts.length >= 3) s = `${d.getDate()} `;
    s += MONTHS_RU[d.getMonth()];
    if (d.getFullYear() !== TODAY.getFullYear()) {
        s += ` ${d.getFullYear()}`;
    }
    if (timeStr) s += `, ${timeStr}`;
    return s;
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

function normalizeTitle(title) {
    if (!title) return '';
    return title.trim().toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/["""''«»\u2018\u2019\u201c\u201d\u00ab\u00bb]/g, '')
        .replace(/\s+/g, ' ').trim();
}

function calculateOverlaps(db) {
    const authorMap = {};
    db.books.forEach(book => {
        const author = book.author ? book.author.trim() : '';
        if (!author) return;
        const club = db.clubs.find(c => c.id === book.clubId);
        if (!club) return;
        if (!authorMap[author]) authorMap[author] = { clubs: new Set(), books: new Set() };
        authorMap[author].clubs.add(club);
        const norm = normalizeTitle(book.title);
        if (norm) authorMap[author].books.add(norm);
    });

    const result = [];
    for (const author in authorMap) {
        const { clubs, books } = authorMap[author];
        if (clubs.size > 1) {
            result.push({ author, totalClubs: clubs.size, totalBooks: books.size, clubs: Array.from(clubs) });
        }
    }
    return result.sort((a, b) => b.totalClubs !== a.totalClubs ? b.totalClubs - a.totalClubs : b.totalBooks - a.totalBooks);
}

function calculatePopularBooks(db) {
    const titleMap = {};
    db.books.forEach(book => {
        if (!book.title) return;
        const club = db.clubs.find(c => c.id === book.clubId);
        if (!club) return;
        const norm = normalizeTitle(book.title);
        if (!norm) return;
        if (!titleMap[norm]) {
            titleMap[norm] = { title: book.title.trim(), years: new Set(), clubs: [], coverUrl: book.coverUrl || '', author: book.author || '' };
        } else if (!titleMap[norm].coverUrl && book.coverUrl) {
            titleMap[norm].coverUrl = book.coverUrl;
        }
        if (book.year) titleMap[norm].years.add(book.year);
        const city = db.cities.find(c => c.id === club.cityId);
        if (!titleMap[norm].clubs.find(e => e.club.id === club.id)) {
            titleMap[norm].clubs.push({ club, city });
        }
    });

    return Object.values(titleMap)
        .filter(item => item.clubs.length >= 2)
        .map(item => ({ ...item, year: [...item.years].sort().join('–') }))
        .sort((a, b) => b.clubs.length - a.clubs.length);
}

// ── Author Books Data & Modal ─────────────────────────────────────────

function getAuthorBooksData(db, authorName) {
    const authorNorm = authorName.trim().toLowerCase();
    const matching = db.books.filter(b => (b.author || '').trim().toLowerCase() === authorNorm);

    const titleMap = new Map();

    matching.forEach(b => {
        const club = db.clubs.find(c => c.id === b.clubId);
        const city = club ? db.cities.find(c => c.id === club.cityId) : null;
        const normTitle = normalizeTitle(b.title);
        if (!normTitle) return;

        if (!titleMap.has(normTitle)) {
            titleMap.set(normTitle, {
                title: (b.title || '').trim(),
                coverUrl: b.coverUrl && !b.coverUrl.startsWith('data:image/svg') ? b.coverUrl : null,
                discussions: []
            });
        }
        const entry = titleMap.get(normTitle);
        // Prefer coverUrl and title containing 'ё' if present
        if (b.title && b.title.includes('ё') && !entry.title.includes('ё')) {
            entry.title = b.title.trim();
        }
        if (!entry.coverUrl && b.coverUrl && !b.coverUrl.startsWith('data:image/svg')) {
            entry.coverUrl = b.coverUrl;
        }
        entry.discussions.push({
            book: b,
            club,
            city,
            isUpcoming: !!b.meetingDate && !isPast(b.meetingDate),
            meetingDate: b.meetingDate,
            meetingTime: b.meetingTime,
            location: b.location,
            registerUrl: b.registerUrl,
            year: b.year
        });
    });

    const books = Array.from(titleMap.values()).map(item => {
        const upcoming = item.discussions
            .filter(d => d.isUpcoming)
            .sort((a, b) => (a.meetingDate > b.meetingDate ? 1 : -1));
        return {
            title: item.title,
            coverUrl: item.coverUrl,
            discussions: item.discussions,
            upcomingDiscussions: upcoming
        };
    });

    // Sort books: upcoming first, then by discussions count
    books.sort((a, b) => {
        if (a.upcomingDiscussions.length > 0 && b.upcomingDiscussions.length === 0) return -1;
        if (a.upcomingDiscussions.length === 0 && b.upcomingDiscussions.length > 0) return 1;
        return b.discussions.length - a.discussions.length;
    });

    const clubsSet = new Set();
    matching.forEach(b => {
        const club = db.clubs.find(c => c.id === b.clubId);
        if (club) clubsSet.add(club);
    });

    return {
        author: authorName,
        books,
        totalBooks: books.length,
        totalClubs: clubsSet.size,
        clubs: Array.from(clubsSet)
    };
}

let currentModalEl = null;

function closeModal() {
    if (!currentModalEl) return;
    currentModalEl.classList.remove('open');
    setTimeout(() => {
        if (currentModalEl && currentModalEl.parentNode) {
            currentModalEl.parentNode.removeChild(currentModalEl);
        }
        currentModalEl = null;
        document.body.style.overflow = '';
    }, 280);
}

function openAuthorModal(db, authorName) {
    closeModal();

    const data = getAuthorBooksData(db, authorName);
    const bookWord = pluralize(data.totalBooks, ['книга', 'книги', 'книг']);
    const clubWord = pluralize(data.totalClubs, ['клуб', 'клуба', 'клубов']);

    const backdrop = document.createElement('div');
    backdrop.className = 'm-author-modal-backdrop';
    currentModalEl = backdrop;

    const cardsHtml = data.books.map(book => {
        const hasUpcoming = book.upcomingDiscussions.length > 0;
        const coverHtml = book.coverUrl
            ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}" class="m-author-book-cover" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<div class=\\'m-author-book-fallback\\'>📖</div>'" />`
            : `<div class="m-author-book-fallback">📖</div>`;

        // Unique clubs for this book
        const uniqueClubsMap = new Map();
        book.discussions.forEach(d => {
            if (d.club && !uniqueClubsMap.has(d.club.id)) {
                uniqueClubsMap.set(d.club.id, { club: d.club, city: d.city });
            }
        });
        const chipsHtml = Array.from(uniqueClubsMap.values()).map(({ club, city }) => {
            const color = club.color || 'var(--accent)';
            const cityText = city && city.name !== 'Онлайн' ? ` · ${escapeHtml(city.name)}` : '';
            return `<span class="m-author-club-chip" style="border-color:${color}44; color:${color}">
                <span class="chip-dot" style="background:${color}"></span>
                ${escapeHtml(club.name)}${cityText}
            </span>`;
        }).join('');

        // Upcoming discussions
        let upcomingHtml = '';
        if (hasUpcoming) {
            upcomingHtml = book.upcomingDiscussions.map(u => {
                const dateText = formatDateFull(u.meetingDate, u.meetingTime);
                const clubName = u.club ? u.club.name : '';
                const cityName = u.city ? u.city.name : '';
                return `
                <div class="m-author-upcoming-box">
                    <div class="m-author-upcoming-header">
                        <i class="ph ph-sparkle"></i> Ближайшее обсуждение
                    </div>
                    <div class="m-author-upcoming-date">
                        <i class="ph ph-calendar-check"></i> ${escapeHtml(dateText)}
                    </div>
                    <div class="m-author-upcoming-meta">
                        <div class="m-author-upcoming-meta-item">
                            <i class="ph ph-planet"></i> ${escapeHtml(clubName)}${cityName ? ` (${escapeHtml(cityName)})` : ''}
                        </div>
                        ${u.location ? `<div class="m-author-upcoming-meta-item"><i class="ph ph-map-pin"></i> ${escapeHtml(u.location)}</div>` : ''}
                    </div>
                    ${u.registerUrl ? `<a href="${u.registerUrl}" target="_blank" rel="noopener noreferrer" class="m-author-upcoming-reg"><i class="ph ph-ticket"></i> Записаться на встречу</a>` : ''}
                </div>`;
            }).join('');
        }

        const status = getBookStatus({ title: book.title, author: data.author });
        const markIcon = status === 'read' ? 'ph-fill ph-check-circle' : (status === 'want' ? 'ph-fill ph-bookmark-simple' : 'ph ph-bookmark-simple');
        const markTitle = status === 'read' ? 'Прочитано' : (status === 'want' ? 'В планах' : 'Отметить книгу');

        return `
        <div class="m-author-book-card ${hasUpcoming ? 'has-upcoming' : ''}">
            <div class="m-author-book-cover-wrap">
                ${coverHtml}
            </div>
            <div class="m-author-book-info">
                <div class="m-author-book-header-row">
                    <div class="m-author-book-title">${escapeHtml(book.title)}</div>
                    <button type="button" class="m-author-book-mark-btn ${status ? 'is-' + status : ''}" data-title="${escapeHtml(book.title)}" data-author="${escapeHtml(data.author)}" title="${markTitle}">
                        <i class="${markIcon}"></i>
                    </button>
                </div>
                <div class="m-author-book-clubs-wrap">
                    <div class="m-author-book-clubs-label">Обсуждали в клубах:</div>
                    <div class="m-author-book-clubs-chips">${chipsHtml}</div>
                </div>
                ${upcomingHtml}
            </div>
        </div>`;
    }).join('');

    backdrop.innerHTML = `
    <div class="m-author-modal-sheet">
        <div class="m-author-modal-handle"></div>
        <div class="m-author-modal-header">
            <div class="m-author-modal-header-info">
                <div class="m-author-modal-sub">Книги автора</div>
                <div class="m-author-modal-title">${escapeHtml(data.author)}</div>
                <div class="m-author-modal-meta">${data.totalBooks} ${bookWord} · ${data.totalClubs} ${clubWord}</div>
            </div>
            <button type="button" class="m-author-modal-close" aria-label="Закрыть">
                <i class="ph ph-x"></i>
            </button>
        </div>
        <div class="m-author-modal-body">
            ${cardsHtml || '<div style="text-align:center;color:var(--text3);padding:24px;">Нет данных о книгах</div>'}
        </div>
    </div>`;

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    // Event listeners
    backdrop.querySelector('.m-author-modal-close').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
    });

    backdrop.querySelectorAll('.m-author-book-mark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const title = btn.dataset.title;
            const author = btn.dataset.author;
            const targetBook = data.books.find(b => b.title === title);
            openBookStatusPicker({
                title,
                author,
                coverUrl: targetBook?.coverUrl || null
            });
        });
    });

    // Animate in
    requestAnimationFrame(() => {
        backdrop.classList.add('open');
    });
}

// Global escape key listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ── Counters ─────────────────────────────────────────────────────────

function calculateCounters(db) {
    const totalBooks = db.books.length;
    const totalClubs = db.clubs.length;
    const totalCities = new Set(db.clubs.map(c => c.cityId)).size;
    const totalAuthors = new Set(db.books.map(b => b.author).filter(Boolean)).size;
    return { totalBooks, totalClubs, totalCities, totalAuthors };
}

// ── Render ────────────────────────────────────────────────────────────

function renderCounters(db) {
    const { totalBooks, totalClubs, totalCities, totalAuthors } = calculateCounters(db);
    return `
    <div class="m-stats-counters">
        <div class="m-stats-counter">
            <div class="m-stats-counter-value">${totalBooks}</div>
            <div class="m-stats-counter-label">книг</div>
        </div>
        <div class="m-stats-counter">
            <div class="m-stats-counter-value">${totalClubs}</div>
            <div class="m-stats-counter-label">клубов</div>
        </div>
        <div class="m-stats-counter">
            <div class="m-stats-counter-value">${totalCities}</div>
            <div class="m-stats-counter-label">${pluralize(totalCities, ['город', 'города', 'городов'])}</div>
        </div>
        <div class="m-stats-counter">
            <div class="m-stats-counter-value">${totalAuthors}</div>
            <div class="m-stats-counter-label">авторов</div>
        </div>
    </div>`;
}

function renderTopAuthors(db) {
    const sorted = calculateOverlaps(db);
    let cutoff = 10;
    if (sorted.length > 10) {
        const thresholdClubs = sorted[9].totalClubs;
        const thresholdBooks = sorted[9].totalBooks;
        while (cutoff < sorted.length && sorted[cutoff].totalClubs === thresholdClubs && sorted[cutoff].totalBooks === thresholdBooks) {
            cutoff++;
        }
    }
    const list = sorted.slice(0, cutoff);
    if (list.length === 0) return '';

    const items = list.map((item, i) => {
        const clubWord = pluralize(item.totalClubs, ['клуб', 'клуба', 'клубов']);
        const bookWord = pluralize(item.totalBooks, ['книга', 'книги', 'книг']);
        return `
        <li class="m-stats-author-item" data-author="${escapeHtml(item.author)}">
            <span class="m-stats-rank">${i + 1}</span>
            <div class="m-stats-author-info">
                <div class="m-stats-author-name">${escapeHtml(item.author)}</div>
                <div class="m-stats-author-meta">
                    <span class="m-stats-clubs-count">${item.totalClubs} ${clubWord}</span>
                    <span class="m-stats-sep">·</span>
                    <button type="button" class="m-stats-books-link" data-author="${escapeHtml(item.author)}" title="Посмотреть книги автора">
                        <i class="ph ph-books"></i>
                        <span>${item.totalBooks} ${bookWord}</span>
                        <i class="ph ph-arrow-up-right"></i>
                    </button>
                </div>
            </div>
        </li>`;
    }).join('');

    return `
    <section class="m-stats-section">
        <h3 class="m-stats-section-title"><i class="ph ph-trend-up"></i> Топ авторов</h3>
        <ul class="m-stats-author-list">${items}</ul>
    </section>`;
}

function renderTopBooks(db) {
    const list = calculatePopularBooks(db).slice(0, 10);
    if (list.length === 0) return '';

    const items = list.map((item, i) => {
        const clubWord = pluralize(item.clubs.length, ['клуб', 'клуба', 'клубов']);
        const isSvg = item.coverUrl && item.coverUrl.startsWith('data:image/svg');
        const coverHtml = item.coverUrl && !isSvg
            ? `<img src="${item.coverUrl}" alt="${escapeHtml(item.title)}" class="m-stats-book-cover" referrerpolicy="no-referrer" onerror="this.style.display='none'" />`
            : `<div class="m-stats-book-cover-placeholder"></div>`;

        return `
        <li class="m-stats-book-item">
            ${coverHtml}
            <div class="m-stats-book-info">
                <div class="m-stats-book-header">
                    <span class="m-stats-rank">${i + 1}</span>
                    <span class="m-stats-book-title">${escapeHtml(item.title)}</span>
                </div>
                ${item.author ? `<div class="m-stats-book-author">${escapeHtml(item.author)}</div>` : ''}
                <div class="m-stats-book-clubs">${item.clubs.length} ${clubWord}</div>
            </div>
        </li>`;
    }).join('');

    return `
    <section class="m-stats-section">
        <h3 class="m-stats-section-title"><i class="ph ph-books"></i> Топ книг</h3>
        <ul class="m-stats-book-list">${items}</ul>
    </section>`;
}

// ── Init ──────────────────────────────────────────────────────────────

export function initStats() {
    const container = document.getElementById('stats-content');
    if (!container) return;

    const db = getDB();

    container.innerHTML =
        renderCounters(db) +
        renderTopAuthors(db) +
        renderTopBooks(db);

    // Event delegation for author clicks
    const authorList = container.querySelector('.m-stats-author-list');
    if (authorList) {
        authorList.addEventListener('click', (e) => {
            const btn = e.target.closest('.m-stats-books-link') || e.target.closest('.m-stats-author-item');
            if (!btn) return;
            const author = btn.dataset.author;
            if (author) {
                openAuthorModal(db, author);
            }
        });
    }
}
