/**
 * main.js — Mobile entry point.
 * Tab-based SPA: Events | Clubs | Quiz | Search
 * Единый источник данных: ../../book-club-universe/src/data/db.js (через alias @db)
 */

import { initEvents } from './modules/events.js';
import { initClubs } from './modules/clubs.js';
import { initQuiz } from './modules/quiz.js';
import { initSearch } from './modules/search.js';
import { initStats } from './modules/stats.js';

// ── Tab routing ───────────────────────────────────────────────────────

const pages = document.querySelectorAll('.m-page');
const navBtns = document.querySelectorAll('.m-nav-btn');

function switchTab(targetPage) {
    pages.forEach(p => p.classList.toggle('active', p.dataset.page === targetPage));
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.page === targetPage));

    // Scroll page to top on switch
    const activePage = document.getElementById(`page-${targetPage}`);
    if (activePage) activePage.scrollTop = 0;
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.page);
    });
});

// Allow clubs tab back button to work
document.getElementById('nav-clubs').addEventListener('click', () => {
    // If in detail view, stay on clubs (detail view handles its own back)
});

// ── Init all modules ──────────────────────────────────────────────────

initEvents();
initClubs();
initQuiz();
initSearch();
initStats();

// ── Start on Events tab ───────────────────────────────────────────────
switchTab('events');
