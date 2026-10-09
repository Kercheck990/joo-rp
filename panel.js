const bridge = window.cef;
const content = document.getElementById('content');
const caption = document.getElementById('caption');
let state = [];
function send(action) {
  if (!bridge || typeof bridge.emit !== 'function') return;
  if (action === 'close' && typeof bridge.set_focus === 'function') bridge.set_focus(false);
  bridge.emit('panel:action', action);
}
function button(label, action, small = '') {
  const b = document.createElement('button'); b.className = 'tile'; b.textContent = label;
  if (small) { const s = document.createElement('small'); s.textContent = small; b.appendChild(s); }
  b.addEventListener('click', () => send(action)); return b;
}
function heading(title, desc) {
  content.replaceChildren(); const h = document.createElement('h1'); h.textContent = title; content.appendChild(h);
  if (desc) { const p = document.createElement('p'); p.textContent = desc; content.appendChild(p); }
  caption.textContent = title;
}
function row(...elements) { const div = document.createElement('div'); div.className = 'row'; div.append(...elements); content.appendChild(div); }
function field(placeholder, type = 'text') { const el = document.createElement('input'); el.className = 'field'; el.placeholder = placeholder; el.type = type; content.appendChild(el); return el; }
function render(payload) {
  state = String(payload).split('|'); const [mode,name,id,skin,level,xp,cash,bank,admin,moped,chat,hints,weather,time] = state;
  switch (Number(mode)) {
    case 1:
      heading('Анимации', 'Выбери действие. Остановить можно здесь или командой /anim.');
      row(button('Помахать', 'wave'), button('Сесть', 'sit'), button('Танцевать', 'dance'), button('Остановить', 'stop')); break;
    case 2:
      heading('Транспорт', 'Личный мопед — отдельный транспорт, игровые модели не заменяются.');
      row(button('Купить Faggio', 'buy', '$2500 у маркера'), button('Забрать мопед', 'spawn', moped === '1' ? 'Принадлежит тебе' : 'Пока не куплен')); break;
    case 3: {
      heading('Вход в админку', 'Подтверди пароль аккаунта.'); const input = field('Пароль', 'password');
      const error = document.createElement('p'); error.className = 'error'; content.appendChild(error);
      const b = button('Войти', ''); b.onclick = () => { if (input.value) send(`auth|${input.value}`); input.value = ''; }; content.appendChild(b);
      if (bridge && bridge.on) bridge.on('panel:error', text => { error.textContent = String(text); }); break;
    }
    case 4: {
      heading('Админ-панель', `Уровень доступа: ${admin}. Действия записываются сервером.`);
      const input = field('ID игрока или модель авто', 'number');
      row(...[['К игроку','goto'],['Игрок ко мне','gethere'],['Заморозить','freeze'],['Разморозить','unfreeze'],['Кикнуть','kick'],['Создать авто','vehicle']].map(([label,cmd]) => {
        const b = button(label, ''); b.onclick = () => { if (/^\d+$/.test(input.value)) send(`${cmd}|${input.value}`); }; return b;
      })); row(button('Выйти из админки','logout')); break;
    }
    case 5: {
      heading('Персонаж', `${name} (#${id})`);
      const avatar = document.createElement('div'); avatar.className = 'skin';
      const image = document.createElement('img'); image.src = `https://assets.open.mp/assets/images/skins/${Number(skin)}.png`; image.alt = `Скин ${skin}`; image.onerror = () => { image.replaceWith(document.createTextNode(`Скин ${skin}`)); }; avatar.appendChild(image); content.appendChild(avatar);
      for (const text of [`Скин: ${skin}`,`Уровень: ${level} · XP: ${xp}/${Number(level)*5}`,`Наличные: $${cash} · Банк: $${bank}`,`Админ: ${admin} · Мопед: ${moped==='1'?'есть':'нет'}`]) {
        const div = document.createElement('div'); div.className = 'stat'; div.textContent = text; content.appendChild(div);
      } break;
    }
    case 6:
      heading('Настройки', 'Параметры игры, которыми можно управлять на сервере.');
      row(button(`Локальный чат: ${chat==='1'?'вкл':'выкл'}`,'chat'), button(`Подсказки: ${hints==='1'?'вкл':'выкл'}`,'hints'));
      row(button(`Погода: ${['обычная','ясно','туман'][Number(weather)] || 'обычная'}`,'weather'), button(`Время: ${['обычное','день','ночь'][Number(time)] || 'обычное'}`,'time'));
      break;
    case 7: {
      heading('Написать админам', 'Опиши проблему одним сообщением.'); const input = field('Что случилось?'); input.maxLength = 95;
      const error = document.createElement('p'); error.className = 'error'; content.appendChild(error);
      if (bridge && bridge.on) bridge.on('panel:error', text => { error.textContent = String(text); });
      const b = button('Отправить', ''); b.onclick = () => { const value = input.value.trim().replace(/[|\r\n]/g,' '); if (value) send(`report|${value}`); }; content.appendChild(b); break;
    }
  }
}
if (bridge && bridge.on) bridge.on('panel:state', render); else render('5|Игрок|3|78|1|0|500|0|0|0|1|1');
document.getElementById('close').addEventListener('click', () => send('close'));
window.addEventListener('keydown', event => { if (event.key === 'Escape') send('close'); });
