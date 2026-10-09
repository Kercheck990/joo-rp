const bridge = window.cef;
const content = document.getElementById('content');
const caption = document.getElementById('caption');

function send(action) {
  if (!bridge || typeof bridge.emit !== 'function') return;
  if (action === 'close' && typeof bridge.set_focus === 'function') bridge.set_focus(false);
  bridge.emit('panel:action', action);
}

function button(label, action, small = '') {
  const element = document.createElement('button');
  element.className = 'tile';
  element.textContent = label;
  if (small) {
    const hint = document.createElement('small');
    hint.textContent = small;
    element.appendChild(hint);
  }
  if (action) element.addEventListener('click', () => send(action));
  return element;
}

function heading(title, description) {
  content.replaceChildren();
  const titleElement = document.createElement('h1');
  titleElement.textContent = title;
  content.appendChild(titleElement);
  if (description) {
    const text = document.createElement('p');
    text.textContent = description;
    content.appendChild(text);
  }
  caption.textContent = title;
}

function row(...elements) {
  const element = document.createElement('div');
  element.className = 'row';
  element.append(...elements);
  content.appendChild(element);
}

function field(placeholder, type = 'text') {
  const element = document.createElement('input');
  element.className = 'field';
  element.placeholder = placeholder;
  element.type = type;
  content.appendChild(element);
  return element;
}

function errorBox() {
  const element = document.createElement('p');
  element.className = 'error';
  content.appendChild(element);
  return element;
}

function render(payload) {
  const state = String(payload).split('|');
  const [mode, name, id, skin, level, xp, cash, bank, admin, moped, chat, hints, weather, time,
    adminPasswordSet = '0', punishments = '0', adminSeconds = '0', houseId = '0', housePrice = '0', carModel = '0', job = '0', taxiPhase = '0'] = state;
  const access = Number(admin);

  switch (Number(mode)) {
    case 1:
      heading('Анимации', 'Выбери действие. Остановить можно здесь или командой /anim.');
      row(button('Помахать', 'wave'), button('Сесть', 'sit'), button('Танцевать', 'dance'), button('Остановить', 'stop'));
      break;
    case 2: {
      heading('Автосалон Joo RP', 'Машины покупаются и выдаются у автосалона в Лос-Сантосе. Купленная модель сохраняется в базе.');
      const catalog = document.createElement('div'); catalog.className = 'car-catalog';
      for (const [model,title,price] of [[410,'Manana',12000],[466,'Glendale',22000],[402,'Buffalo',75000]]) {
        const card = document.createElement('div'); card.className = 'car-card';
        const photo = document.createElement('img'); photo.src = `https://assets.open.mp/assets/images/vehiclePictures/Vehicle_${model}.jpg`; photo.alt = title; photo.loading = 'lazy';
        const label = document.createElement('strong'); label.textContent = `${title} · $${price.toLocaleString('ru-RU')}`;
        const buy = button('Купить', `car-buy|${model}`); buy.disabled = carModel !== '0';
        card.append(photo,label,buy); catalog.appendChild(card);
      }
      content.appendChild(catalog);
      row(button('Забрать мою машину', 'car-spawn', carModel === '0' ? 'Пока не куплена' : `Модель ${carModel}`));
      row(button('Купить Faggio', 'buy', '$2500'), button('Забрать мопед', 'spawn', moped === '1' ? 'Твой' : 'Пока не куплен'));
      break;
    }
    case 3: {
      const hasPassword = adminPasswordSet === '1';
      heading(hasPassword ? 'Вход в админку' : 'Создание админского пароля',
        hasPassword
          ? 'Войди один раз. Авторизация сохранится до выхода с сервера.'
          : 'Создай пароль один раз. Затем снова введи /admin и войди с ним.');
      const password = field('Пароль: 6–32 латинских букв или цифр', 'password');
      password.maxLength = 32;
      const confirmation = hasPassword ? null : field('Повтори пароль', 'password');
      if (confirmation) confirmation.maxLength = 32;
      const error = errorBox();
      const submit = button(hasPassword ? 'Войти' : 'Создать пароль', '');
      submit.classList.add('primary-tile');
      const setPending = pending => {
        submit.disabled = pending;
        submit.textContent = pending ? (hasPassword ? 'Проверяем…' : 'Сохраняем…') : (hasPassword ? 'Войти' : 'Создать пароль');
      };
      submit.onclick = () => {
        error.textContent = '';
        const value = password.value;
        if (!/^[A-Za-z0-9]{6,32}$/.test(value)) {
          error.textContent = 'Пароль должен содержать 6–32 латинских буквы или цифры.';
          return;
        }
        if (!hasPassword && value !== confirmation.value) {
          error.textContent = 'Пароли не совпадают.';
          return;
        }
        setPending(true);
        if (hasPassword) send(`auth|${value}`);
        else send(`setup|${value}|${confirmation.value}`);
      };
      const submitOnEnter = event => { if (event.key === 'Enter' && !submit.disabled) submit.click(); };
      password.addEventListener('keydown', submitOnEnter);
      if (confirmation) confirmation.addEventListener('keydown', submitOnEnter);
      content.appendChild(submit);
      if (bridge && bridge.on) bridge.on('panel:error', text => {
        error.textContent = String(text);
        setPending(false);
        password.focus();
      });
      setTimeout(() => password.focus(), 0);
      break;
    }
    case 4: {
      const seconds = Math.max(0, Number(adminSeconds) || 0);
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      heading('Админ-панель', `Уровень доступа: ${access}. Доступные функции зависят от уровня.`);
      const statistics = document.createElement('div');
      statistics.className = 'admin-stats';
      statistics.innerHTML = `<div><b>${punishments}</b><span>наказаний выдано</span></div><div><b>${hours} ч ${minutes} мин</b><span>наиграно в админке</span></div>`;
      content.appendChild(statistics);

      const target = field('ID игрока', 'number');
      const actions = [];
      if (access >= 1) actions.push(['К игроку', 'goto'], ['Игрок ко мне', 'gethere'], ['Заморозить', 'freeze'], ['Разморозить', 'unfreeze']);
      if (access >= 2) actions.push(['Кикнуть', 'kick']);
      row(...actions.map(([label, command]) => {
        const element = button(label, '');
        element.onclick = () => { if (/^\d+$/.test(target.value)) send(`${command}|${target.value}`); };
        return element;
      }));

      if (access >= 3) {
        const model = field('Модель транспорта: 400–611', 'number');
        const createVehicle = button('Создать транспорт', '', 'Доступно с 3 уровня');
        createVehicle.onclick = () => { if (/^\d+$/.test(model.value)) send(`vehicle|${model.value}`); };
        content.appendChild(createVehicle);
      }
      if (access >= 4) {
        const houseHelp = document.createElement('div');
        houseHelp.className = 'stat';
        houseHelp.textContent = 'Дома: /addhouse стоимость — создать на своей позиции; /deletehouse — удалить ближайший.';
        content.appendChild(houseHelp);
      }
      if (access >= 5) {
        const adminTarget = field('ID нового администратора', 'number');
        const adminLevel = field('Уровень: 0–5', 'number');
        const setAdmin = button('Изменить уровень', '', 'Только 5 уровень');
        setAdmin.onclick = () => {
          if (/^\d+$/.test(adminTarget.value) && /^[0-5]$/.test(adminLevel.value)) send(`setadmin|${adminTarget.value}|${adminLevel.value}`);
        };
        content.appendChild(setAdmin);
      }
      row(button('Закрыть панель', 'close', 'Авторизация сохранится до выхода из игры'));
      break;
    }
    case 5: {
      heading('Персонаж', `${name} (#${id})`);
      const avatar = document.createElement('div');
      avatar.className = 'skin';
      const image = document.createElement('img');
      image.src = `https://assets.open.mp/assets/images/skins/${Number(skin)}.png`;
      image.alt = `Скин ${skin}`;
      image.onerror = () => image.replaceWith(document.createTextNode(`Скин ${skin}`));
      avatar.appendChild(image);
      content.appendChild(avatar);
      for (const text of [`Скин: ${skin}`, `Уровень: ${level} · XP: ${xp}/${Number(level) * 5}`, `Наличные: $${cash} · Банк: $${bank}`, `Админ: ${admin} · Мопед: ${moped === '1' ? 'есть' : 'нет'}`]) {
        const element = document.createElement('div');
        element.className = 'stat';
        element.textContent = text;
        content.appendChild(element);
      }
      break;
    }
    case 6:
      heading('Настройки', 'Параметры игры, которыми можно управлять на сервере.');
      row(button(`Локальный чат: ${chat === '1' ? 'вкл' : 'выкл'}`, 'chat'), button(`Подсказки: ${hints === '1' ? 'вкл' : 'выкл'}`, 'hints'));
      row(button(`Погода: ${['обычная', 'ясно', 'туман'][Number(weather)] || 'обычная'}`, 'weather'), button(`Время: ${['обычное', 'день', 'ночь'][Number(time)] || 'обычное'}`, 'time'));
      break;
    case 7: {
      heading('Написать админам', 'Опиши проблему одним сообщением.');
      const input = field('Что случилось?');
      input.maxLength = 95;
      const error = errorBox();
      if (bridge && bridge.on) bridge.on('panel:error', text => { error.textContent = String(text); });
      const submit = button('Отправить', '');
      submit.onclick = () => {
        const value = input.value.trim().replace(/[|\r\n]/g, ' ');
        if (value) send(`report|${value}`);
      };
      content.appendChild(submit);
      break;
    }
    case 8:
      heading(`Покупка дома №${houseId}`, `Стоимость: $${housePrice}. После покупки вход будет доступен по ALT.`);
      row(button('Купить дом', 'house-buy', `$${housePrice}`), button('Отмена', 'house-cancel'));
      break;
    case 9: {
      heading('Телефон', 'Joo RP · работа и связь');
      const text = document.createElement('div'); text.className = 'stat';
      text.textContent = job === '3' ? (taxiPhase === '1' ? 'Заказчик отмечен на карте. Останови такси рядом с ним.' : 'Маршрут пассажира отмечен на карте.') : 'Активного заказа такси нет. Начать смену: /work taxi у мэрии.';
      content.appendChild(text);
      if (job === '3' && taxiPhase === '1') {
        const error = errorBox();
        if (bridge && bridge.on) bridge.on('panel:error', value => { error.textContent = String(value); });
        row(button('Я на месте', 'taxi-arrived', 'Заказчик ждёт у метки'));
      }
      row(button('Закрыть телефон', 'close'));
      break;
    }
  }
}

if (bridge && bridge.on) bridge.on('panel:state', render);
else render('4|developer|1|78|1|0|500|0|5|0|1|1|0|0|1|3|7260|0|0');

document.getElementById('close').addEventListener('click', () => send('close'));
window.addEventListener('keydown', event => { if (event.key === 'Escape') send('close'); });
