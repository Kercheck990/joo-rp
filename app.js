const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const submit = document.getElementById('submit');
const form = document.getElementById('form');
const password = document.getElementById('password');
const error = document.getElementById('error');
const referral = document.getElementById('referral');
const registerOptions = document.getElementById('register-options');
let mode = null;

function setMode(next) {
  mode = next === 'login' ? 'login' : 'register';
  title.textContent = mode === 'login' ? 'С возвращением!' : 'Создать аккаунт';
  subtitle.textContent = mode === 'login'
    ? 'Введи пароль и заходи в игру.'
    : 'Придумай пароль, выбери скин — и можно играть.';
  registerOptions.hidden = mode === 'login';
  submit.textContent = mode === 'login' ? 'Войти' : 'Создать аккаунт';
  submit.disabled = false;
  error.textContent = '';
  password.focus();
}

if (window.cef && typeof window.cef.on === 'function') {
  window.cef.on('auth:mode', setMode);
  window.cef.on('auth:error', message => {
    error.textContent = String(message || 'Ошибка входа. Повторите попытку.');
    submit.disabled = false;
    password.value = '';
    password.focus();
  });
  window.cef.on('auth:success', () => {
    // The focused CEF view must give input back to GTA before it is destroyed.
    if (typeof window.cef.set_focus === 'function') window.cef.set_focus(false);
    if (typeof window.cef.hide === 'function') window.cef.hide(true);
  });
} else {
  setMode('register');
  subtitle.textContent = 'Предпросмотр интерфейса. Для игры откройте страницу через SA-MP CEF.';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  error.textContent = '';
  if (!/^[A-Za-z0-9]{6,32}$/.test(password.value)) {
    error.textContent = 'Пароль: 6–32 латинских букв или цифр.';
    return;
  }
  if (mode === 'register' && !/^[A-Za-z0-9_]{0,23}$/.test(referral.value.trim())) {
    error.textContent = 'Промокод: ник игрока латиницей, без пробелов.';
    return;
  }
  if (!window.cef || typeof window.cef.emit !== 'function') {
    error.textContent = 'Предпросмотр: подключение к игровому серверу недоступно.';
    return;
  }
  submit.disabled = true;
  const selectedSkin = document.querySelector('input[name="skin"]:checked')?.value || '78';
  const payload = mode === 'login' ? password.value : `${password.value}|${referral.value.trim()}|${selectedSkin}`;
  window.cef.emit(mode === 'login' ? 'auth:login' : 'auth:register', payload);
});
