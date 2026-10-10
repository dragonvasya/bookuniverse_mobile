/**
 * authModal.js — Модальное окно авторизации читателя.
 * Включает:
 *  - Вход через Telegram в 1 клик (официальный виджет и Telegram WebApp);
 *  - Вход / Регистрацию по Email и паролю;
 *  - Вход по ссылке (Magic Link).
 */

import {
    getSupabaseConfig,
    signInWithEmail,
    signUpWithEmail,
    signInWithOtp,
    signInWithTelegramData
} from '../services/supabase.js';

let authModalEl = null;

export function openAuthModal(onSuccessCallback = null) {
    if (authModalEl) authModalEl.remove();

    const config = getSupabaseConfig();
    const tmaUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;

    const modal = document.createElement('div');
    modal.id = 'm-auth-modal';
    modal.className = 'm-action-sheet-backdrop';

    // По умолчанию открываем Telegram если доступен TMA или указан бот, иначе Email
    let activeTab = (tmaUser || config.botName) ? 'telegram' : 'email';

    function renderModalContent() {
        modal.innerHTML = `
        <div class="m-action-sheet m-auth-sheet">
            <div class="m-action-sheet-handle"></div>
            
            <div class="m-action-sheet-header">
                <div class="m-auth-sheet-title-group">
                    <div class="m-action-sheet-title">Синхронизация и аккаунт</div>
                    <div class="m-action-sheet-author">Сохраняйте личную полку между устройствами</div>
                </div>
                <button type="button" class="m-action-sheet-close"><i class="ph ph-x"></i></button>
            </div>

            <!-- Верхние вкладки: Telegram и Email -->
            <div class="m-auth-tabs">
                <button type="button" class="m-auth-tab ${activeTab === 'email' ? 'active' : ''}" data-tab="email">
                    <i class="ph ph-envelope-simple"></i> Email
                </button>
                <button type="button" class="m-auth-tab ${activeTab === 'telegram' ? 'active' : ''}" data-tab="telegram">
                    <i class="ph-fill ph-telegram-logo"></i> Telegram
                </button>
            </div>

            <div class="m-auth-body">
                <!-- Ошибка/Уведомление -->
                <div id="m-auth-alert" class="m-auth-alert hidden"></div>

                ${renderTabBody()}
            </div>
        </div>`;

        attachEvents();
    }

    function renderTabBody() {
        if (activeTab === 'telegram') {
            let tgContentHtml = '';

            if (tmaUser) {
                // Запущено внутри Telegram WebApp (Mini App)
                const fullName = [tmaUser.first_name, tmaUser.last_name].filter(Boolean).join(' ');
                tgContentHtml = `
                <div class="m-tg-tma-card">
                    <div class="m-tg-tma-icon"><i class="ph-fill ph-telegram-logo"></i></div>
                    <div class="m-tg-tma-info">
                        <div class="m-tg-tma-name">${escapeHtml(fullName)}</div>
                        <div class="m-tg-tma-sub">${tmaUser.username ? '@' + escapeHtml(tmaUser.username) : 'Telegram User'}</div>
                    </div>
                </div>
                <button type="button" id="m-btn-tma-login" class="m-tg-login-btn">
                    <i class="ph-fill ph-telegram-logo"></i> Войти как ${escapeHtml(tmaUser.first_name)}
                </button>`;
            } else if (config.botName) {
                // Официальный виджет Telegram
                tgContentHtml = `
                <div class="m-tg-widget-intro">
                    Нажмите кнопку ниже, чтобы авторизоваться через Telegram в 1 клик. Ваша полка сохранится в аккаунте.
                </div>
                <div class="m-tg-widget-container" id="m-tg-widget-box">
                    <div class="m-tg-loading-spinner"><i class="ph ph-spinner-gap ph-spin"></i> Загрузка виджета Telegram...</div>
                </div>`;
            } else {
                // Бот ещё не привязан для веб-виджета
                tgContentHtml = `
                <div class="m-tg-widget-intro">
                    Вход через Telegram доступен при открытии Book Universe внутри Telegram-бота или через вкладку <b>Email</b>.
                </div>
                <div class="m-tg-demo-box">
                    <div class="m-tg-demo-text">
                        Чтобы войти прямо сейчас без пароля, воспользуйтесь вкладкой <b>Email</b> &rarr; <i>«Без пароля (Magic Link)»</i>.
                    </div>
                    <button type="button" class="m-auth-submit-btn" id="m-btn-switch-email">
                        <i class="ph ph-envelope-simple"></i> Перейти ко входу по почте
                    </button>
                </div>`;
            }

            return `
            <div class="m-auth-tg-pane">
                ${tgContentHtml}
            </div>`;
        }

        // Email вкладка (Вход / Регистрация / Без пароля)
        return `
        <div class="m-auth-email-pane">
            <div class="m-auth-subtabs">
                <button type="button" class="m-auth-subtab active" data-subtab="login">Вход</button>
                <button type="button" class="m-auth-subtab" data-subtab="register">Регистрация</button>
                <button type="button" class="m-auth-subtab" data-subtab="magic">Без пароля</button>
            </div>

            <!-- Форма входа / регистрации -->
            <form id="m-auth-email-form" class="m-auth-form">
                <div class="m-auth-field" id="m-field-username" style="display:none;">
                    <label class="m-auth-label">Ваше имя читателя</label>
                    <input type="text" id="m-auth-name" class="m-auth-input" placeholder="Александр" />
                </div>
                <div class="m-auth-field">
                    <label class="m-auth-label">Электронная почта</label>
                    <input type="email" id="m-auth-email" class="m-auth-input" placeholder="reader@example.com" required autocomplete="email" />
                </div>
                <div class="m-auth-field" id="m-field-password">
                    <div class="m-auth-label-row">
                        <label class="m-auth-label">Пароль</label>
                    </div>
                    <div class="m-auth-input-wrap">
                        <input type="password" id="m-auth-pass" class="m-auth-input" placeholder="Минимум 6 символов" required autocomplete="current-password" />
                        <button type="button" class="m-auth-show-pass-btn" id="m-btn-toggle-pass"><i class="ph ph-eye"></i></button>
                    </div>
                </div>
                <div class="m-auth-btn-row">
                    <button type="submit" class="m-auth-submit-btn" id="m-btn-submit-email">
                        <i class="ph ph-sign-in"></i> <span id="m-submit-text">Войти</span>
                    </button>
                </div>
            </form>
        </div>`;
    }

    function showAlert(msg, isError = true) {
        const el = modal.querySelector('#m-auth-alert');
        if (!el) return;
        el.textContent = msg;
        el.className = `m-auth-alert ${isError ? 'error' : 'success'}`;
        el.classList.remove('hidden');
    }

    function clearAlert() {
        const el = modal.querySelector('#m-auth-alert');
        if (el) {
            el.textContent = '';
            el.classList.add('hidden');
        }
    }

    function close() {
        modal.classList.remove('open');
        setTimeout(() => {
            modal.remove();
            authModalEl = null;
        }, 250);
    }

    function attachEvents() {
        modal.querySelector('.m-action-sheet-close')?.addEventListener('click', close);
        modal.addEventListener('click', e => {
            if (e.target === modal) close();
        });

        // Переключение между Telegram и Email
        modal.querySelectorAll('.m-auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                activeTab = tab.dataset.tab;
                renderModalContent();
            });
        });

        modal.querySelector('#m-btn-switch-email')?.addEventListener('click', () => {
            activeTab = 'email';
            renderModalContent();
        });

        // Telegram WebApp 1-click
        modal.querySelector('#m-btn-tma-login')?.addEventListener('click', async () => {
            const btn = modal.querySelector('#m-btn-tma-login');
            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Авторизация...';
            try {
                await signInWithTelegramData(tmaUser);
                showAlert('Успешный вход через Telegram!', false);
                setTimeout(() => {
                    close();
                    if (onSuccessCallback) onSuccessCallback();
                }, 800);
            } catch (err) {
                showAlert('Ошибка входа через Telegram: ' + (err.message || 'Попробуйте снова'));
                btn.disabled = false;
                btn.innerHTML = '<i class="ph-fill ph-telegram-logo"></i> Войти как ' + escapeHtml(tmaUser.first_name);
            }
        });

        // Монтирование официального виджета Telegram если есть botName
        if (activeTab === 'telegram' && config.botName && !tmaUser) {
            mountTelegramWidget();
        }

        // Сабтабы Email (Вход / Регистрация / Без пароля)
        let emailMode = 'login'; // 'login' | 'register' | 'magic'
        modal.querySelectorAll('.m-auth-subtab').forEach(st => {
            st.addEventListener('click', () => {
                modal.querySelectorAll('.m-auth-subtab').forEach(b => b.classList.remove('active'));
                st.classList.add('active');
                emailMode = st.dataset.subtab;
                clearAlert();

                const userField = modal.querySelector('#m-field-username');
                const passField = modal.querySelector('#m-field-password');
                const submitText = modal.querySelector('#m-submit-text');
                const submitBtnIcon = modal.querySelector('#m-btn-submit-email i');

                if (emailMode === 'login') {
                    if (userField) userField.style.display = 'none';
                    if (passField) passField.style.display = 'block';
                    if (submitText) submitText.textContent = 'Войти';
                    if (submitBtnIcon) submitBtnIcon.className = 'ph ph-sign-in';
                } else if (emailMode === 'register') {
                    if (userField) userField.style.display = 'block';
                    if (passField) passField.style.display = 'block';
                    if (submitText) submitText.textContent = 'Зарегистрироваться';
                    if (submitBtnIcon) submitBtnIcon.className = 'ph ph-user-plus';
                } else if (emailMode === 'magic') {
                    if (userField) userField.style.display = 'none';
                    if (passField) passField.style.display = 'none';
                    if (submitText) submitText.textContent = 'Отправить ссылку для входа';
                    if (submitBtnIcon) submitBtnIcon.className = 'ph ph-paper-plane-tilt';
                }
            });
        });

        // Показать/скрыть пароль
        modal.querySelector('#m-btn-toggle-pass')?.addEventListener('click', () => {
            const passInput = modal.querySelector('#m-auth-pass');
            const icon = modal.querySelector('#m-btn-toggle-pass i');
            if (passInput) {
                if (passInput.type === 'password') {
                    passInput.type = 'text';
                    icon.className = 'ph ph-eye-slash';
                } else {
                    passInput.type = 'password';
                    icon.className = 'ph ph-eye';
                }
            }
        });

        // Отправка формы Email
        modal.querySelector('#m-auth-email-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            clearAlert();

            const email = modal.querySelector('#m-auth-email')?.value.trim();
            const pass = modal.querySelector('#m-auth-pass')?.value;
            const username = modal.querySelector('#m-auth-name')?.value.trim();
            const submitBtn = modal.querySelector('#m-btn-submit-email');

            if (!email) {
                showAlert('Укажите корректный email');
                return;
            }

            submitBtn.disabled = true;
            const origHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Загрузка...';

            try {
                if (emailMode === 'login') {
                    if (!pass) throw new Error('Введите пароль');
                    await signInWithEmail(email, pass);
                    showAlert('Вход выполнен успешно!', false);
                } else if (emailMode === 'register') {
                    if (!pass || pass.length < 6) throw new Error('Пароль должен содержать от 6 символов');
                    await signUpWithEmail(email, pass, username);
                    showAlert('Регистрация прошла успешно!', false);
                } else if (emailMode === 'magic') {
                    await signInWithOtp(email);
                    showAlert('Ссылка для входа отправлена на ' + email, false);
                }

                setTimeout(() => {
                    close();
                    if (onSuccessCallback) onSuccessCallback();
                }, 1000);
            } catch (err) {
                console.error(err);
                showAlert(mapAuthErrorMessage(err.message));
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        });
    }

    function mountTelegramWidget() {
        const box = modal.querySelector('#m-tg-widget-box');
        if (!box) return;

        window.onTelegramAuth = async function (user) {
            clearAlert();
            box.innerHTML = '<div class="m-tg-loading-spinner"><i class="ph ph-spinner-gap ph-spin"></i> Входим через Telegram...</div>';
            try {
                await signInWithTelegramData(user);
                showAlert(`Добро пожаловать, ${user.first_name}!`, false);
                setTimeout(() => {
                    close();
                    if (onSuccessCallback) onSuccessCallback();
                }, 800);
            } catch (err) {
                showAlert('Ошибка авторизации через Telegram: ' + (err.message || 'Попробуйте снова'));
                mountTelegramWidget();
            }
        };

        box.innerHTML = '';
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', config.botName.replace(/^@/, ''));
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '12');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        box.appendChild(script);
    }

    renderModalContent();
    document.body.appendChild(modal);
    authModalEl = modal;

    requestAnimationFrame(() => modal.classList.add('open'));
}

function mapAuthErrorMessage(msg) {
    if (!msg) return 'Произошла ошибка при авторизации';
    if (msg.includes('Invalid login credentials')) return 'Неверный email или пароль';
    if (msg.includes('User already registered')) return 'Пользователь с таким email уже зарегистрирован';
    if (msg.includes('Password should be at least')) return 'Пароль должен содержать не менее 6 символов';
    if (msg.includes('rate limit')) return 'Слишком много попыток. Подождите пару минут';
    return msg;
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
