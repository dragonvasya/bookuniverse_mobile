/**
 * map.js — Вкладка «Карта».
 * Яндекс Карты JS API v3. Маркеры мест встреч клубов.
 */

import { getDB } from '@db';

const YANDEX_API_KEY = 'd101f5c4-678b-423e-aee2-54dd8b6250c3';

// ── Места встреч (захардкоженные координаты) ──────────────────────────
const VENUES = [
    {
        id: 'sok_msk',
        name: 'SOK Rybakov Tower',
        address: 'Москва, Ленинградский проспект, 36с11',
        room: '103 переговорная',
        lat: 55.7883,
        lng: 37.5679,
        clubIds: ['cl1'],
    },
    {
        id: 'tower_a',
        name: 'БЦ Tower A',
        address: 'Москва, Бумажный проезд, 19с1',
        room: 'ауд. 807 / 911',
        lat: 55.7895,
        lng: 37.5856,
        clubIds: ['cl14'],
    },
    {
        id: 'sok_spb',
        name: 'SOK Достоевский',
        address: 'Санкт-Петербург, Щербаков пер., 17/3с2',
        room: '2 этаж, 201 переговорная',
        lat: 59.9288,
        lng: 30.3413,
        clubIds: ['cl18'],
    },
    {
        id: 'seno',
        name: 'Пространство SENO',
        address: 'Санкт-Петербург, Гороховая ул., 49',
        lat: 59.9254,
        lng: 30.3208,
        clubIds: ['cl9'],
    },
    {
        id: 'lib172',
        name: 'Лекторий Библиотеки №172',
        address: 'Москва, ул. Новаторов, 14 к.1',
        lat: 55.6881,
        lng: 37.5207,
        clubIds: ['cl17'],
    },
    {
        id: 'lib16',
        name: 'Библиотека №16',
        address: 'Москва, Новоспасский пер., 5',
        lat: 55.7406,
        lng: 37.6573,
        clubIds: ['cl23'],
    },
    {
        id: 'ekb',
        name: 'SOK Екатеринбург',
        address: 'Екатеринбург, ул. Декабристов, 69',
        lat: 56.8389,
        lng: 60.5951,
        clubIds: ['cl7'],
    },
    {
        id: 'skolkovo',
        name: 'Технопарк «Сколково»',
        address: 'Москва, Большой бульвар, 42, стр. 1',
        room: 'Капсула №2',
        lat: 55.6851,
        lng: 37.3351,
        clubIds: ['cl10'],
    },
    {
        id: 'lama',
        name: 'Книжный клуб «Лама»',
        address: 'Москва, 2-й Троицкий переулок, 6А, стр. 3',
        lat: 55.7752,
        lng: 37.6226,
        clubIds: ['cl24'],
    },
    {
        id: 'investoro',
        name: 'Investoro (Skolkovo Alumni)',
        address: 'Москва, Новинский бульвар, 31',
        lat: 55.7578,
        lng: 37.5826,
        clubIds: ['cl11'],
    },
    {
        id: 'chekhov',
        name: 'Чехов и компания',
        address: 'Москва, Гончарная ул., 26, к. 1',
        lat: 55.7429,
        lng: 37.6492,
        clubIds: ['cl32'],
    },
    {
        id: 'gromko',
        name: 'Громко сказано',
        address: 'Москва, Бауманская ул., 58/25, с. 14',
        room: 'Библиотека им. Н.А. Некрасова, 5 этаж',
        lat: 55.7671,
        lng: 37.6786,
        clubIds: ['cl28'],
    },
    {
        id: 'georges',
        name: 'George’s',
        address: 'Ереван, ул. Сарьяна, 19',
        lat: 40.1859,
        lng: 44.5079,
        clubIds: ['cl31'],
    },
    {
        id: 'noda',
        name: 'Noda Space',
        address: 'Kralja Milana 4, Beograd',
        lat: 44.8043,
        lng: 20.4644,
        clubIds: ['cl25'],
    },
];

const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function parseDate(s) {
    if (!s) return null;
    const p = s.trim().split(' ')[0].split('-').map(Number);
    if (p.length < 2 || isNaN(p[0])) return null;
    return new Date(p[0], p[1] - 1, p[2] || 1);
}

function isPast(s) {
    const d = parseDate(s);
    if (!d) return false;
    const parts = s.trim().split(' ')[0].split('-');
    if (parts.length < 3) {
        return new Date(d.getFullYear(), d.getMonth() + 1, 0) < TODAY;
    }
    return d < TODAY;
}

function formatEventDate(dateStr, timeStr) {
    const d = parseDate(dateStr);
    if (!d) return '';
    const day = d.getDate();
    const mon = MONTHS_SHORT[d.getMonth()];
    return `${day} ${mon}${timeStr ? ' · ' + timeStr : ''}`;
}

// ── Загрузка Яндекс Карты ─────────────────────────────────────────────

let ymapsReady = false;
let ymapsCallbacks = [];

function loadYmaps() {
    return new Promise((resolve) => {
        if (ymapsReady) { resolve(); return; }
        ymapsCallbacks.push(resolve);
        if (document.getElementById('ymaps-script')) return; // уже грузится

        const script = document.createElement('script');
        script.id = 'ymaps-script';
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
        script.onload = () => {
            ymaps.ready(() => {
                ymapsReady = true;
                ymapsCallbacks.forEach(cb => cb());
                ymapsCallbacks = [];
            });
        };
        document.head.appendChild(script);
    });
}

// ── Popup builder ─────────────────────────────────────────────────────

function buildPopup(venue, clubs, db) {
    const venueClubs = venue.clubIds
        .map(id => clubs.find(c => c.id === id))
        .filter(Boolean);

    // Ближайшее событие для каждого клуба
    const upcomingByClub = venueClubs.map(club => {
        const next = db.books
            .filter(b => b.clubId === club.id && b.meetingDate && !isPast(b.meetingDate))
            .sort((a, b) => (a.meetingDate || '').localeCompare(b.meetingDate || ''))[0];
        return { club, next };
    });

    const clubsHtml = upcomingByClub.map(({ club, next }) => {
        const dot = `<span class="m-map-popup-dot" style="background:${club.color}"></span>`;
        const eventHtml = next
            ? `<div class="m-map-popup-event">
                 <span class="m-map-popup-date">${formatEventDate(next.meetingDate, next.meetingTime)}</span>
                 <span class="m-map-popup-book">«${next.title}»</span>
               </div>
               ${next.registerUrl
                 ? `<a class="m-map-popup-btn" href="${next.registerUrl}" target="_blank" rel="noopener">Записаться →</a>`
                 : ''}`
            : `<div class="m-map-popup-noevents">Нет ближайших событий</div>`;

        return `<div class="m-map-popup-club">
            <div class="m-map-popup-clubname">${dot}${club.name}</div>
            ${eventHtml}
          </div>`;
    }).join('');

    return `<div class="m-map-popup">
        <div class="m-map-popup-venue">${venue.name}</div>
        <div class="m-map-popup-addr">${venue.address}${venue.room ? ' · ' + venue.room : ''}</div>
        <div class="m-map-popup-clubs">${clubsHtml}</div>
      </div>`;
}

function getLogoSrc(club) {
    const logoMap = {
        cl1:  '/sok-logo.png',
        cl6:  '/chebykina-logo.png',
        cl7:  '/sok-ekb-logo.jpg',
        cl8:  '/svk-logo.jpg',
        cl9:  '/vsmysle-logo.png',
        cl12: '/dumay-logo.jpg',
        cl13: '/career-logo.png',
        cl15: '/sync-logo.jpg',
        cl16: '/m-logo.jpg',
        cl17: '/mgu-logo.jpg',
        cl18: '/sok-spb-logo.jpg',
        cl20: '/logo-friend-book.jpg',
        cl21: '/vlasenko-logo.jpg',
        cl22: '/chityli-logo.png',
        cl23: '/book-events-logo.jpg',
        cl24: '/lama-logo.jpg',
        cl25: '/bukva.jpg',
        cl26: '/bookz.jpg',
        cl27: '/dubai.jpg',
        cl28: '/gromko-logo.jpg',
        cl30: '/shrift-logo.jpg',
        cl31: '/alla-logo.jpg',
        cl32: '/chekhov-logo.jpg',
        cl33: '/almaty-logo.jpg',
    };
    return logoMap[club.id] || null;
}

// ── Custom placemark layout ───────────────────────────────────────────

function buildPlacemarkHtml(club) {
    const logoUrl = getLogoSrc(club);
    const content = logoUrl
        ? `<img class="m-map-pin-logo" src="${logoUrl}" alt="${club.name}" />`
        : `<i class="ph ph-book-open"></i>`;

    return `<div class="m-map-pin" style="background:${club.color};border-color:${club.color};box-shadow:0 3px 10px rgba(0,0,0,0.45)">
               ${content}
             </div>`;
}

// ── Инициализация ─────────────────────────────────────────────────────

let mapInstance = null;

export async function initMap() {
    // Грузим API только при первом открытии вкладки
    await loadYmaps();

    if (mapInstance) return; // уже инициализировали

    const container = document.getElementById('map-container');
    if (!container) return;

    const db = getDB();
    const clubs = db.clubs;

    // Центр карты — Москва по умолчанию
    const map = new ymaps.Map('map-container', {
        center: [55.7522, 37.6156],
        zoom: 5,
        controls: ['zoomControl', 'geolocationControl'],
    }, {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true,
    });

    mapInstance = map;

    // Стилизация под тёмную тему
    map.panes.get('ground').getElement().style.filter = 'invert(1) hue-rotate(180deg) brightness(0.85) saturate(1.2)';

    // Добавляем маркеры
    VENUES.forEach(venue => {
        const venueClubs = venue.clubIds.map(id => clubs.find(c => c.id === id)).filter(Boolean);
        if (!venueClubs.length) return;

        const primaryClub = venueClubs[0];

        // Кастомный layout
        const PinLayout = ymaps.templateLayoutFactory.createClass(
            buildPlacemarkHtml(primaryClub)
        );

        const placemark = new ymaps.Placemark(
            [venue.lat, venue.lng],
            {
                hintContent: venue.name,
                balloonContent: buildPopup(venue, clubs, db),
            },
            {
                iconLayout: PinLayout,
                iconShape: { type: 'Circle', coordinates: [19, 19], radius: 19 },
                iconOffset: [-19, -19],
                balloonPanelMaxMapArea: 0,
            }
        );

        map.geoObjects.add(placemark);
    });

    // Кнопки фильтра городов
    initCityFilter(map, clubs);
}

// ── Фильтр по городам ─────────────────────────────────────────────────

function initCityFilter(map, clubs) {
    const btns = document.querySelectorAll('.m-map-city-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const city = btn.dataset.city;
            if (!city) {
                // Показать всё
                map.setCenter([55.7522, 37.6156], 5, { duration: 400 });
                return;
            }

            // Найти первый venue в нужном городе и центрировать
            const target = VENUES.find(v => {
                if (city === 'msk') return v.id === 'sok_msk' || v.id === 'tower_a' || v.id === 'lib172' || v.id === 'lib16' || v.id === 'skolkovo' || v.id === 'lama' || v.id === 'investoro' || v.id === 'chekhov' || v.id === 'gromko';
                if (city === 'spb') return v.id === 'sok_spb' || v.id === 'seno';
                if (city === 'ekb') return v.id === 'ekb';
                if (city === 'bel') return v.id === 'noda';
                if (city === 'evn') return v.id === 'georges';
                return false;
            });
            if (target) {
                map.setCenter([target.lat, target.lng], 13, { duration: 400 });
            }
        });
    });
}
