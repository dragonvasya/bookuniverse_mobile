/**
 * clubs.js — Вкладка «Клубы».
 * Список клубов → детальная страница клуба (архетип + книги + события).
 * Переиспользует: данные club.archetype из db.js
 */

import { getDB } from '@db';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// ── Helpers ──────────────────────────────────────────────────────────

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
    if (!d) return dateStr;
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    const parts = dateStr.trim().split(' ')[0].split('-');
    let s = '';
    if (parts.length >= 3) s = `${d.getDate()} `;
    s += months[d.getMonth()];
    if (timeStr) s += `, ${timeStr}`;
    return s;
}

function getLogoSrc(club) {
    // Не зависим от флага hasLogo в db.js — просто смотрим по ID
    const logoMap = {
        cl1:  '/sok-logo.png',
        cl6:  '/chebykina-logo.png',
        cl7:  '/sok-ekb-logo.jpg',
        cl8:  '/svk-logo.jpg',       // Школа Великих книг
        cl9:  '/vsmysle-logo.png',
        cl12: '/dumay-logo.jpg',
        cl13: '/career-logo.png',    // Институт карьерного роста
        cl15: '/sync-logo.jpg',
        cl16: '/m-logo.jpg',         // Шалость удалась — карта Мародёров
        cl17: '/mgu-logo.jpg',
        cl18: '/sok-spb-logo.jpg',
        cl20: '/logo-friend-book.jpg',
        cl21: '/vlasenko-logo.jpg',
        cl22: '/chityli-logo.png',
        cl23: '/book-events-logo.jpg',
        cl24: '/lama-logo.jpg',
    };
    return logoMap[club.id] || null;
}

// ── Render club list ─────────────────────────────────────────────────

function buildClubCard(club, city, hasUpcoming) {
    const card = document.createElement('div');
    card.className = 'm-club-card';
    card.dataset.clubId = club.id;

    // Logo
    const logo = document.createElement('div');
    logo.className = 'm-club-logo';
    const logoSrc = getLogoSrc(club);
    if (logoSrc) {
        const img = document.createElement('img');
        img.src = logoSrc;
        img.alt = club.name;
        img.loading = 'lazy';
        img.onerror = () => { img.replaceWith(document.createTextNode('🪐')); };
        logo.appendChild(img);
    } else {
        logo.textContent = '🪐';
    }
    logo.style.background = club.color ? `${club.color}22` : '';
    logo.style.boxShadow = club.color ? `0 0 0 2px ${club.color}55` : '';
    card.appendChild(logo);

    // Info
    const info = document.createElement('div');
    info.className = 'm-club-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'm-club-name';
    nameEl.textContent = club.name;
    info.appendChild(nameEl);

    const metaParts = [];
    if (city) metaParts.push(city.name);
    if (club.members > 0) {
        const label = club.memberLabel || 'участников';
        metaParts.push(`${club.members.toLocaleString('ru')} ${label}`);
    }
    if (metaParts.length) {
        const metaEl = document.createElement('div');
        metaEl.className = 'm-club-meta';
        metaEl.textContent = metaParts.join(' · ');
        info.appendChild(metaEl);
    }
    card.appendChild(info);

    // Upcoming badge
    if (hasUpcoming) {
        const badge = document.createElement('div');
        badge.className = 'm-tag accent';
        badge.textContent = '📅';
        badge.title = 'Есть предстоящие встречи';
        card.appendChild(badge);
    }

    // Arrow
    const arrow = document.createElement('i');
    arrow.className = 'ph ph-caret-right m-club-arrow';
    card.appendChild(arrow);

    return card;
}

// ── Render club detail ───────────────────────────────────────────────

function buildClubDetail(club, db) {
    const container = document.getElementById('club-detail-content');
    container.innerHTML = '';

    const city = db.cities.find(c => c.id === club.cityId);
    const books = db.books.filter(b => b.clubId === club.id);
    const upcomingBooks = books.filter(b => b.meetingDate && !isPast(b.meetingDate))
        .sort((a, b) => (a.meetingDate || '').localeCompare(b.meetingDate || ''));

    // Hero
    const hero = document.createElement('div');
    hero.className = 'm-club-hero';

    const logoEl = document.createElement('div');
    logoEl.className = 'm-club-hero-logo';
    const logoSrc = getLogoSrc(club);
    if (logoSrc) {
        const img = document.createElement('img');
        img.src = logoSrc;
        img.alt = club.name;
        img.onerror = () => { img.replaceWith(document.createTextNode('🪐')); };
        logoEl.appendChild(img);
    } else {
        logoEl.textContent = '🪐';
    }
    if (club.color) {
        logoEl.style.background = `${club.color}22`;
        logoEl.style.boxShadow = `0 0 0 2px ${club.color}55`;
    }
    hero.appendChild(logoEl);

    const heroInfo = document.createElement('div');
    heroInfo.className = 'm-club-hero-info';

    const heroName = document.createElement('div');
    heroName.className = 'm-club-hero-name';
    heroName.textContent = club.name;
    heroInfo.appendChild(heroName);

    const tags = document.createElement('div');
    tags.className = 'm-club-hero-tags';
    if (city) {
        const t = document.createElement('span');
        t.className = 'm-tag';
        t.innerHTML = `<i class="ph ph-map-pin"></i> ${city.name}`;
        tags.appendChild(t);
    }
    if (club.members > 0) {
        const t = document.createElement('span');
        t.className = 'm-tag accent';
        const label = club.memberLabel || 'участников';
        t.textContent = `${club.members.toLocaleString('ru')} ${label}`;
        tags.appendChild(t);
    }
    if (club.founded) {
        const t = document.createElement('span');
        t.className = 'm-tag';
        t.textContent = `с ${club.founded}`;
        tags.appendChild(t);
    }
    if (club.organizer) {
        const t = document.createElement('span');
        t.className = 'm-tag';
        t.textContent = `орг.: ${club.organizer}`;
        tags.appendChild(t);
    }
    heroInfo.appendChild(tags);
    hero.appendChild(heroInfo);
    container.appendChild(hero);

    // Archetype (collapsible)
    if (club.archetype) {
        const block = document.createElement('div');
        block.className = 'm-archetype-block';

        const header = document.createElement('div');
        header.className = 'm-archetype-header';
        header.innerHTML = `
            <div class="m-archetype-title">🧬 ${club.archetype.title}</div>
            <i class="ph ph-caret-down m-archetype-caret"></i>`;
        block.appendChild(header);

        const body = document.createElement('div');
        body.className = 'm-archetype-body';
        body.innerHTML = club.archetype.description;
        block.appendChild(body);

        header.addEventListener('click', () => {
            block.classList.toggle('expanded');
        });

        container.appendChild(block);
    }

    // Upcoming events for this club
    if (upcomingBooks.length > 0) {
        const secTitle = document.createElement('div');
        secTitle.className = 'm-section-title';
        secTitle.innerHTML = `<i class="ph ph-calendar-check"></i> Предстоящие встречи`;
        container.appendChild(secTitle);

        const eventsWrap = document.createElement('div');
        eventsWrap.className = 'm-club-events';
        upcomingBooks.forEach(book => {
            const link = document.createElement(book.registerUrl ? 'a' : 'div');
            link.className = 'm-mini-event';
            if (book.registerUrl) {
                link.href = book.registerUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
            const dateEl = document.createElement('div');
            dateEl.className = 'm-mini-event-date';
            dateEl.textContent = formatDateFull(book.meetingDate, book.meetingTime);
            link.appendChild(dateEl);

            const infoEl = document.createElement('div');
            infoEl.className = 'm-mini-event-info';
            infoEl.innerHTML = `
                <div class="m-mini-event-title">${book.title}</div>
                ${book.location ? `<div class="m-mini-event-location">${book.location}</div>` : ''}`;
            link.appendChild(infoEl);

            const arrow = document.createElement('i');
            arrow.className = 'ph ph-arrow-right m-mini-event-arrow';
            link.appendChild(arrow);
            eventsWrap.appendChild(link);
        });
        container.appendChild(eventsWrap);
    }

    // Book list
    const allYears = [...new Set(books.map(b => b.year).filter(Boolean))].sort((a, b) => b - a);
    let activeYear = 'all';

    const booksSecTitle = document.createElement('div');
    booksSecTitle.className = 'm-section-title';
    booksSecTitle.innerHTML = `<i class="ph ph-books"></i> Книги клуба`;
    container.appendChild(booksSecTitle);

    // Year pills
    if (allYears.length > 1) {
        const pillsWrap = document.createElement('div');
        pillsWrap.className = 'm-year-pills';

        const allPill = document.createElement('button');
        allPill.className = 'm-pill active';
        allPill.textContent = 'Все';
        allPill.dataset.year = 'all';
        pillsWrap.appendChild(allPill);

        allYears.forEach(y => {
            const pill = document.createElement('button');
            pill.className = 'm-pill';
            pill.textContent = String(y);
            pill.dataset.year = String(y);
            pillsWrap.appendChild(pill);
        });

        container.appendChild(pillsWrap);

        pillsWrap.addEventListener('click', e => {
            const pill = e.target.closest('.m-pill');
            if (!pill) return;
            pillsWrap.querySelectorAll('.m-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeYear = pill.dataset.year;
            renderBooksGrid();
        });
    }

    const booksGrid = document.createElement('div');
    booksGrid.className = 'm-books-grid';
    container.appendChild(booksGrid);

    function renderBooksGrid() {
        booksGrid.innerHTML = '';
        const filtered = activeYear === 'all'
            ? books
            : books.filter(b => String(b.year) === activeYear);

        if (filtered.length === 0) {
            booksGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:16px">Нет книг</div>';
            return;
        }

        filtered.forEach(book => {
            const item = document.createElement('div');
            item.className = 'm-book-item';
            item.title = `${book.title}${book.author ? ' — ' + book.author : ''}`;
            item.style.background = book.color || 'var(--surface2)';

            if (book.coverUrl && !book.coverUrl.startsWith('data:image/svg')) {
                const img = document.createElement('img');
                img.src = book.coverUrl;
                img.alt = book.title;
                img.loading = 'lazy';
                img.onerror = () => { img.replaceWith(buildFallback(book)); };
                item.appendChild(img);
            } else {
                item.appendChild(buildFallback(book));
            }
            booksGrid.appendChild(item);
        });
    }

    renderBooksGrid();
}

function buildFallback(book) {
    const fb = document.createElement('div');
    fb.className = 'm-book-fallback';
    fb.innerHTML = `
        <div class="m-book-fallback-title">${book.title}</div>
        ${book.author ? `<div class="m-book-fallback-author">${book.author}</div>` : ''}`;
    return fb;
}

// ── Main init ────────────────────────────────────────────────────────

export function initClubs() {
    const db = getDB();
    const listEl = document.getElementById('clubs-list');
    const listView = document.getElementById('clubs-list-view');
    const detailView = document.getElementById('club-detail-view');
    const backBtn = document.getElementById('btn-clubs-back');

    // Only show clubs that have actual books (not tickerOnly)
    const visibleClubs = db.clubs.filter(c => !c.tickerOnly);

    // Group by city
    const byCityId = {};
    visibleClubs.forEach(club => {
        if (!byCityId[club.cityId]) byCityId[club.cityId] = [];
        byCityId[club.cityId].push(club);
    });

    // Build upcoming set for fast lookup
    const upcomingClubIds = new Set(
        db.books
            .filter(b => b.meetingDate && !isPast(b.meetingDate))
            .map(b => b.clubId)
    );

    // Render city groups
    db.cities.forEach(city => {
        const clubs = byCityId[city.id];
        if (!clubs || clubs.length === 0) return;

        const cityHeader = document.createElement('div');
        cityHeader.className = 'm-city-header';
        cityHeader.textContent = city.name;
        listEl.appendChild(cityHeader);

        clubs.forEach(club => {
            const card = buildClubCard(club, city, upcomingClubIds.has(club.id));
            card.addEventListener('click', () => showDetail(club));
            listEl.appendChild(card);
        });
    });

    // Navigation: list → detail
    function showDetail(club) {
        listView.classList.add('hidden');
        detailView.classList.remove('hidden');
        buildClubDetail(club, db);
        detailView.scrollTop = 0;
    }

    function showList() {
        detailView.classList.add('hidden');
        listView.classList.remove('hidden');
    }

    backBtn.addEventListener('click', showList);
}
