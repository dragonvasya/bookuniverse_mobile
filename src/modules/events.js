/**
 * events.js — Вкладка «События».
 * Адаптация events-panel.js + ticker.js логики.
 * Переиспользует: parseDate, buildRow, isUpcoming, makeGoogleCalendarUrl.
 */

import { getDB } from '@db';

const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня',
                   'июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// ── Helpers (переиспользованы из events-panel.js / ticker.js) ──────

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

function isUpcoming(book) {
    return !!book.meetingDate && !isPast(book.meetingDate);
}

function isSoon(book) {
    if (!book.meetingDate) return false;
    const d = parseDate(book.meetingDate);
    if (!d) return false;
    const diff = d - TODAY;
    return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function formatDay(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    const parts = dateStr.trim().split(' ')[0].split('-');
    if (parts.length < 3) return '';
    return String(d.getDate());
}

function formatMonth(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    return MONTHS_RU[d.getMonth()];
}

function formatMonthShort(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    return MONTHS_SHORT[d.getMonth()];
}

export function makeGoogleCalendarUrl(book, club, city) {
    const title = encodeURIComponent(`Книжный клуб: ${book.title} (${club.name})`);
    const loc = encodeURIComponent(book.location || (city?.name === 'Онлайн' ? 'Онлайн' : city?.name || ''));
    const details = encodeURIComponent(
        `Обсуждение книги "${book.title}"\nАвтор: ${book.author}\nКлуб: ${club.name}\n\n` +
        (book.registerUrl ? `Регистрация: ${book.registerUrl}` : '')
    );
    let datesParam = '';
    if (book.meetingDate) {
        const d = parseDate(book.meetingDate);
        if (book.meetingTime) {
            const m = book.meetingTime.match(/(\d{1,2}):(\d{2})/);
            if (m && d) {
                d.setHours(parseInt(m[1]), parseInt(m[2]), 0);
                const end = new Date(d.getTime() + 2 * 60 * 60 * 1000);
                const fmt = (dt) => dt.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
                datesParam = `${fmt(d)}/${fmt(end)}`;
            }
        }
        if (!datesParam && d) {
            const ds = book.meetingDate.replace(/-/g,'');
            datesParam = `${ds}/${ds}`;
        }
    }
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${loc}`;
}

// ── Card builder (адаптирован из events-panel.js buildRow) ───────────

function buildCard(book, club, city) {
    const soon = isSoon(book);
    const hasReg = !!book.registerUrl;

    // Outer link или div
    const card = document.createElement(hasReg ? 'a' : 'div');
    card.className = 'm-ev-card' + (soon ? ' is-soon' : '');
    if (hasReg) {
        card.href = book.registerUrl;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
    }

    // ── Date stripe ──
    const dateCol = document.createElement('div');
    dateCol.className = 'm-ev-date';
    const day = formatDay(book.meetingDate);
    const mon = formatMonthShort(book.meetingDate);
    const time = book.meetingTime || '';
    if (day) {
        const dayEl = document.createElement('div');
        dayEl.className = 'm-ev-day';
        dayEl.textContent = day;
        dateCol.appendChild(dayEl);
    }
    if (mon) {
        const monEl = document.createElement('div');
        monEl.className = 'm-ev-month';
        monEl.textContent = mon;
        dateCol.appendChild(monEl);
    }
    if (time) {
        const timeEl = document.createElement('div');
        timeEl.className = 'm-ev-time';
        timeEl.textContent = time;
        dateCol.appendChild(timeEl);
    }
    card.appendChild(dateCol);

    // ── Cover ──
    const coverWrap = document.createElement('div');
    coverWrap.className = 'm-ev-cover';
    if (book.coverUrl && !book.coverUrl.startsWith('data:image/svg')) {
        const img = document.createElement('img');
        img.src = book.coverUrl;
        img.alt = book.title;
        img.loading = 'lazy';
        img.onerror = () => { img.replaceWith(makePlaceholder()); };
        coverWrap.appendChild(img);
    } else {
        coverWrap.appendChild(makePlaceholder());
    }
    card.appendChild(coverWrap);

    // ── Info ──
    const info = document.createElement('div');
    info.className = 'm-ev-info';

    if (club) {
        const clubEl = document.createElement('div');
        clubEl.className = 'm-ev-club';
        clubEl.textContent = club.name;
        info.appendChild(clubEl);
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'm-ev-title';
    titleEl.textContent = book.title;
    info.appendChild(titleEl);

    if (book.author) {
        const authorEl = document.createElement('div');
        authorEl.className = 'm-ev-author';
        authorEl.textContent = book.author;
        info.appendChild(authorEl);
    }

    const meta = document.createElement('div');
    meta.className = 'm-ev-meta';

    const locationText = book.location || (club?.isCentral ? 'Онлайн' : city?.name || null);
    if (locationText) {
        const locEl = document.createElement('div');
        locEl.className = 'm-ev-location';
        locEl.innerHTML = `<i class="ph ph-map-pin"></i> ${locationText}`;
        meta.appendChild(locEl);
    }

    if (hasReg) {
        const regEl = document.createElement('div');
        regEl.className = 'm-ev-register';
        regEl.innerHTML = `<i class="ph ph-arrow-right"></i> Записаться`;
        meta.appendChild(regEl);
    }

    if (book.price) {
        const priceEl = document.createElement('div');
        priceEl.className = 'm-ev-price';
        priceEl.textContent = book.price;
        meta.appendChild(priceEl);
    }

    info.appendChild(meta);
    card.appendChild(info);

    return card;
}

function makePlaceholder() {
    const el = document.createElement('div');
    el.className = 'm-ev-cover-ph';
    el.textContent = '📖';
    return el;
}

// ── Filter helpers ───────────────────────────────────────────────────

function getMonthKey(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthOption(key) {
    const [y, m] = key.split('-');
    return `${MONTHS_RU[parseInt(m) - 1]} ${y}`;
}

// ── Main init ────────────────────────────────────────────────────────

export function initEvents() {
    const db = getDB();
    const listEl = document.getElementById('events-list');
    const citySelect = document.getElementById('filter-city');
    const monthSelect = document.getElementById('filter-month');

    // All upcoming events sorted by date
    const allEvents = db.books
        .filter(b => b.meetingDate && !b.statsOnly && !isPast(b.meetingDate))
        .sort((a, b) => {
            const da = (a.meetingDate || '').split(' ')[0].padEnd(10, '-01');
            const db2 = (b.meetingDate || '').split(' ')[0].padEnd(10, '-01');
            return da.localeCompare(db2);
        });

    // Update events badge in nav
    const badge = document.getElementById('nav-events-badge');
    if (badge) {
        badge.textContent = allEvents.length;
        badge.classList.toggle('hidden', allEvents.length === 0);
    }

    // Populate city filter
    const cities = new Map();
    allEvents.forEach(book => {
        const club = db.clubs.find(c => c.id === book.clubId);
        if (club) {
            const city = db.cities.find(c => c.id === club.cityId);
            if (city && !cities.has(city.id)) cities.set(city.id, city.name);
        }
    });
    cities.forEach((name, id) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        citySelect.appendChild(opt);
    });

    // Populate month filter
    const months = new Set(allEvents.map(b => getMonthKey(b.meetingDate)).filter(Boolean));
    months.forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = formatMonthOption(key);
        monthSelect.appendChild(opt);
    });

    // Render function
    function render() {
        const selCity = citySelect.value;
        const selMonth = monthSelect.value;

        const filtered = allEvents.filter(book => {
            const club = db.clubs.find(c => c.id === book.clubId);
            if (selCity) {
                if (!club || club.cityId !== selCity) return false;
            }
            if (selMonth) {
                if (getMonthKey(book.meetingDate) !== selMonth) return false;
            }
            return true;
        });

        listEl.innerHTML = '';

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'm-empty';
            empty.innerHTML = `<i class="ph ph-calendar-x"></i><p>Нет событий по выбранным фильтрам</p>`;
            listEl.appendChild(empty);
            return;
        }

        filtered.forEach(book => {
            const club = db.clubs.find(c => c.id === book.clubId);
            const city = club ? db.cities.find(c => c.id === club.cityId) : null;
            listEl.appendChild(buildCard(book, club, city));
        });
    }

    citySelect.addEventListener('change', render);
    monthSelect.addEventListener('change', render);

    render();
}
