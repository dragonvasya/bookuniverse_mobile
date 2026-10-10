/**
 * supabase.js — Сервис интеграции с Supabase и авторизации.
 * Поддерживает переменные окружения (.env), ручную настройку через UI,
 * авторизацию по Email/Паролю, Magic Link, и Telegram Auth (Widget & WebApp).
 */

import { createClient } from '@supabase/supabase-js';

const STORAGE_CONFIG_KEY = 'bookuniverse_custom_supabase_config';
const TELEGRAM_AUTH_DUMMY_SECRET = 'tg_app_bku_secret_salt_2026';

let supabaseClient = null;

// ── Получение и сохранение конфигурации ─────────────────────────────────────

export function getSupabaseConfig() {
    let custom = null;
    try {
        const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
        if (raw) custom = JSON.parse(raw);
    } catch (_) {}

    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const envBot = import.meta.env.VITE_TELEGRAM_BOT_NAME || '';

    return {
        url: custom?.url || envUrl,
        anonKey: custom?.anonKey || envKey,
        botName: custom?.botName || envBot,
        isCustom: !!(custom?.url && custom?.anonKey)
    };
}

export function saveSupabaseConfig(url, anonKey, botName) {
    try {
        if (!url && !anonKey) {
            localStorage.removeItem(STORAGE_CONFIG_KEY);
        } else {
            localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({
                url: (url || '').trim(),
                anonKey: (anonKey || '').trim(),
                botName: (botName || '').trim()
            }));
        }
        supabaseClient = null; // сброс инстанса для реинициализации
        initSupabase();
        return true;
    } catch (e) {
        console.error('Ошибка сохранения конфигурации Supabase:', e);
        return false;
    }
}

export function isSupabaseConfigured() {
    const { url, anonKey } = getSupabaseConfig();
    return Boolean(url && anonKey && url.startsWith('http'));
}

// ── Инициализация клиента ───────────────────────────────────────────────────

export function getSupabase() {
    if (supabaseClient) return supabaseClient;
    return initSupabase();
}

function cleanSupabaseUrl(url) {
    if (!url) return '';
    return String(url)
        .trim()
        .replace(/\/rest\/v1\/?$/, '')
        .replace(/\/+$/, '');
}

export function initSupabase() {
    let { url, anonKey } = getSupabaseConfig();
    url = cleanSupabaseUrl(url);

    if (!url || !anonKey || !url.startsWith('http')) {
        supabaseClient = null;
        return null;
    }

    try {
        supabaseClient = createClient(url, anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        return supabaseClient;
    } catch (err) {
        console.warn('Не удалось инициализировать Supabase:', err);
        supabaseClient = null;
        return null;
    }
}

// ── Методы авторизации ──────────────────────────────────────────────────────

export async function getCurrentSession() {
    const sb = getSupabase();
    if (!sb) return null;
    try {
        const { data: { session }, error } = await sb.auth.getSession();
        if (error) throw error;
        return session;
    } catch (err) {
        console.warn('Ошибка получения сессии Supabase:', err);
        return null;
    }
}

export async function getCurrentUser() {
    const session = await getCurrentSession();
    return session?.user || null;
}

export function onAuthStateChange(callback) {
    const sb = getSupabase();
    if (!sb) return () => {};
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    return () => subscription.unsubscribe();
}

/** Регистрация по Email и паролю */
export async function signUpWithEmail(email, password, username = '') {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase не настроен');

    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await sb.auth.signUp({
        email: cleanEmail,
        password,
        options: {
            data: {
                username: username.trim() || cleanEmail.split('@')[0],
                avatar: '📚'
            }
        }
    });

    if (error) throw error;
    return data;
}

/** Вход по Email и паролю */
export async function signInWithEmail(email, password) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase не настроен');

    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await sb.auth.signInWithPassword({
        email: cleanEmail,
        password
    });

    if (error) throw error;
    return data;
}

/** Вход по Magic Link без пароля */
export async function signInWithOtp(email) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase не настроен');

    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await sb.auth.signInWithOtp({
        email: cleanEmail,
        options: {
            emailRedirectTo: window.location.origin
        }
    });

    if (error) throw error;
    return data;
}

/** 
 * Вход через данные Telegram (виджет или WebApp).
 * Создает или авторизует аккаунт в Supabase на базе telegram id.
 */
export async function signInWithTelegramData(tgUser) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase не настроен');
    if (!tgUser || !tgUser.id) throw new Error('Некорректные данные Telegram');

    const tgId = String(tgUser.id);
    const pseudoEmail = `tg_${tgId}@telegram.bookuniverse.internal`;
    const pseudoPassword = `tg_bku_${tgId}_${TELEGRAM_AUTH_DUMMY_SECRET}`;
    const displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || `Читатель #${tgId.slice(-4)}`;

    try {
        // Пробуем войти под существующим аккаунтом
        const { data, error } = await sb.auth.signInWithPassword({
            email: pseudoEmail,
            password: pseudoPassword
        });

        if (!error && data?.user) {
            // Успешный вход — обновляем профиль свежими данными
            await syncTelegramProfileData(data.user.id, tgUser, displayName);
            return data;
        }

        // Если пользователя еще нет, регистрируем его
        const signUpRes = await sb.auth.signUp({
            email: pseudoEmail,
            password: pseudoPassword,
            options: {
                data: {
                    username: displayName,
                    telegram_id: tgUser.id,
                    telegram_username: tgUser.username || null,
                    avatar: tgUser.photo_url || '📚'
                }
            }
        });

        if (signUpRes.error) throw signUpRes.error;

        // Если требуется подтверждение email (на случай если в настройках Supabase включено confirm email),
        // попробуем войти или вернуть пользователя
        if (signUpRes.data?.user) {
            await syncTelegramProfileData(signUpRes.data.user.id, tgUser, displayName);
        }

        return signUpRes.data;
    } catch (err) {
        console.error('Ошибка авторизации через Telegram в Supabase:', err);
        throw err;
    }
}

async function syncTelegramProfileData(userId, tgUser, displayName) {
    const sb = getSupabase();
    if (!sb || !userId) return;

    try {
        await sb.from('profiles').upsert({
            id: userId,
            username: displayName,
            telegram_id: tgUser.id,
            telegram_username: tgUser.username || null,
            avatar: tgUser.photo_url || '📚',
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (err) {
        console.warn('Не удалось обновить Telegram метаданные в profiles:', err);
    }
}

/** Выход из аккаунта */
export async function signOut() {
    const sb = getSupabase();
    if (!sb) return;
    try {
        await sb.auth.signOut();
    } catch (err) {
        console.error('Ошибка выхода из Supabase:', err);
    }
}

// ── Синхронизация полок и профиля с облаком ──────────────────────────────────

/** Загрузка всей полки пользователя из облака */
export async function fetchCloudShelf() {
    const sb = getSupabase();
    if (!sb) return null;

    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const { data, error } = await sb
            .from('user_books')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;

        // Преобразуем массив в формат { [bookKey]: { status, title, author, coverUrl, dateAdded } }
        const booksMap = {};
        (data || []).forEach(row => {
            booksMap[row.book_key] = {
                status: row.status,
                title: row.title,
                author: row.author,
                coverUrl: row.cover_url,
                dateAdded: row.date_added
            };
        });

        return booksMap;
    } catch (err) {
        console.error('Ошибка загрузки полки из облака:', err);
        return null;
    }
}

/** Загрузка данных профиля пользователя из таблицы profiles */
export async function fetchCloudProfile() {
    const sb = getSupabase();
    if (!sb) return null;

    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const { data, error } = await sb
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (err) {
        console.warn('Ошибка загрузки профиля из облака:', err);
        return null;
    }
}

/** Сохранение одной книги в облаке (добавление или обновление статуса) */
export async function saveCloudBookStatus(bookKey, bookData) {
    const sb = getSupabase();
    if (!sb) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    try {
        const { error } = await sb
            .from('user_books')
            .upsert({
                user_id: user.id,
                book_key: bookKey,
                status: bookData.status,
                title: bookData.title,
                author: bookData.author,
                cover_url: bookData.coverUrl || null,
                date_added: bookData.dateAdded || new Date().toISOString()
            }, { onConflict: 'user_id,book_key' });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Ошибка сохранения книги в Supabase:', err);
        return false;
    }
}

/** Удаление книги из облака */
export async function removeCloudBookStatus(bookKey) {
    const sb = getSupabase();
    if (!sb) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    try {
        const { error } = await sb
            .from('user_books')
            .delete()
            .match({ user_id: user.id, book_key: bookKey });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Ошибка удаления книги из Supabase:', err);
        return false;
    }
}

/** Синхронизация: отправка всех локальных книг в облако (upsert) */
export async function syncLocalShelfToCloud(localBooks) {
    const sb = getSupabase();
    if (!sb) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    const entries = Object.entries(localBooks || {});
    if (entries.length === 0) return true;

    try {
        const rows = entries.map(([key, b]) => ({
            user_id: user.id,
            book_key: key,
            status: b.status,
            title: b.title || '',
            author: b.author || '',
            cover_url: b.coverUrl || null,
            date_added: b.dateAdded || new Date().toISOString()
        }));

        const { error } = await sb
            .from('user_books')
            .upsert(rows, { onConflict: 'user_id,book_key' });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Ошибка полной синхронизации полок с Supabase:', err);
        return false;
    }
}

/** Обновление профиля в таблице profiles */
export async function updateCloudProfile(profileData) {
    const sb = getSupabase();
    if (!sb) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    try {
        const payload = {
            id: user.id,
            updated_at: new Date().toISOString()
        };
        if (profileData.username !== undefined) payload.username = profileData.username;
        if (profileData.avatar !== undefined) payload.avatar = profileData.avatar;
        if (profileData.bio !== undefined) payload.bio = profileData.bio;

        const { error } = await sb
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Ошибка обновления профиля в Supabase:', err);
        return false;
    }
}

// Первичная инициализация при импорте
initSupabase();
