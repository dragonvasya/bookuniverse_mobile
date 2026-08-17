/**
 * stats.js — Вкладка «Статистика».
 * Топ авторов (в скольких клубах) + топ книг (в скольких клубах).
 */

import { getDB } from '@db';

// ── Helpers ──────────────────────────────────────────────────────────

function pluralize(count, forms) {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
}

function calculateOverlaps(db) {
    const authorMap = {};
    db.books.forEach(book => {
        const author = book.author ? book.author.trim() : '';
        if (!author) return;
        if (!authorMap[author]) authorMap[author] = { clubs: new Set(), books: new Set() };
        const club = db.clubs.find(c => c.id === book.clubId);
        if (club) {
            authorMap[author].clubs.add(club);
            authorMap[author].books.add(book.title.trim());
        }
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
        const norm = book.title.trim().toLowerCase()
            .replace(/["""''«»\u2018\u2019\u201c\u201d\u00ab\u00bb]/g, '')
            .replace(/\s+/g, ' ').trim();
        if (!titleMap[norm]) {
            titleMap[norm] = { title: book.title.trim(), years: new Set(), clubs: [], coverUrl: book.coverUrl || '', author: book.author || '' };
        } else if (!titleMap[norm].coverUrl && book.coverUrl) {
            titleMap[norm].coverUrl = book.coverUrl;
        }
        if (book.year) titleMap[norm].years.add(book.year);
        const club = db.clubs.find(c => c.id === book.clubId);
        if (!club) return;
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

// ── Counters ─────────────────────────────────────────────────────────

function calculateCounters(db) {
    const totalBooks = db.books.length;
    const totalClubs = db.clubs.filter(c => !c.tickerOnly).length;
    const totalCities = new Set(db.clubs.filter(c => !c.tickerOnly).map(c => c.cityId)).size;
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
    const list = calculateOverlaps(db).slice(0, 10);
    if (list.length === 0) return '';

    const items = list.map((item, i) => {
        const clubWord = pluralize(item.totalClubs, ['клуб', 'клуба', 'клубов']);
        const bookWord = pluralize(item.totalBooks, ['книга', 'книги', 'книг']);
        return `
        <li class="m-stats-author-item">
            <span class="m-stats-rank">${i + 1}</span>
            <div class="m-stats-author-info">
                <div class="m-stats-author-name">${item.author}</div>
                <div class="m-stats-author-meta">${item.totalClubs} ${clubWord} · ${item.totalBooks} ${bookWord}</div>
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
            ? `<img src="${item.coverUrl}" alt="${item.title}" class="m-stats-book-cover" referrerpolicy="no-referrer" onerror="this.style.display='none'" />`
            : `<div class="m-stats-book-cover-placeholder"></div>`;

        return `
        <li class="m-stats-book-item">
            ${coverHtml}
            <div class="m-stats-book-info">
                <div class="m-stats-book-header">
                    <span class="m-stats-rank">${i + 1}</span>
                    <span class="m-stats-book-title">${item.title}</span>
                </div>
                ${item.author ? `<div class="m-stats-book-author">${item.author}</div>` : ''}
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
}
