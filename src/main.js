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
import { initProfile, renderProfile } from './modules/profile.js';

// ── Tab routing ───────────────────────────────────────────────────────

const pages = document.querySelectorAll('.m-page');
const navBtns = document.querySelectorAll('.m-nav-btn');

function switchTab(targetPage) {
    pages.forEach(p => p.classList.toggle('active', p.dataset.page === targetPage));
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.page === targetPage));

    const profileHeaderBtn = document.getElementById('btn-profile-header');
    if (profileHeaderBtn) {
        profileHeaderBtn.classList.toggle('active', targetPage === 'profile');
    }

    if (targetPage === 'profile') {
        renderProfile();
    }

    // Scroll page to top on switch
    const activePage = document.getElementById(`page-${targetPage}`);
    if (activePage) activePage.scrollTop = 0;
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.page);
    });
});

const profileHeaderBtn = document.getElementById('btn-profile-header');
if (profileHeaderBtn) {
    profileHeaderBtn.addEventListener('click', () => {
        switchTab('profile');
    });
}

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
initProfile();

// ── Start on Events tab ───────────────────────────────────────────────
switchTab('events');
