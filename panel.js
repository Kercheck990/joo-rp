const bridge = window.cef;
const content = document.getElementById('content');
const caption = document.getElementById('caption');
const carCatalog = [
  [410, 'Manana', 12000], [466, 'Glendale', 22000], [496, 'Blista Compact', 16000],
  [400, 'Landstalker', 38000], [562, 'Elegy', 68000], [402, 'Buffalo', 75000],
  [468, 'Sanchez', 19000],
];
let carView = 'garage';

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

const clientPrefs = {
  scale: { values: [80, 100, 120, 140], label: 'Масштаб HUD', suffix: '%' },
  opacity: { values: [40, 60, 80, 100], label: 'Прозрачность HUD', suffix: '%' },
  speedometer: { values: [1, 0], label: 'Спидометр', names: ['включён', 'выключен'] },
  effects: { values: [1, 0], label: 'Анимации интерфейса', names: ['включены', 'выключены'] },
  engineVolume: { values: [0, 25, 50, 75, 100], label: 'Звук Минска', suffix: '%' }
};

function renderClientPrefs() {
  const target = document.getElementById('client-prefs');
  if (!target) return;
  target.replaceChildren();
  for (const [key, setting] of Object.entries(clientPrefs)) {
    const raw = localStorage.getItem(`joo.${key}`);
    const stored = raw === null ? NaN : Number(raw);
    const index = setting.values.includes(stored) ? setting.values.indexOf(stored) : (key === 'engineVolume' ? 3 : key === 'opacity' ? 3 : key === 'scale' ? 1 : 0);
    const value = setting.names ? setting.names[index] : `${setting.values[index]}${setting.suffix}`;
    const item = button(`${setting.label}: ${value}`, '');
    item.onclick = () => {
      const next = setting.values[(index + 1) % setting.values.length];
      localStorage.setItem(`joo.${key}`, String(next));
      renderClientPrefs();
    };
    item.dataset.preference = key;
    target.appendChild(item);
  }
}

function render(payload) {
  const state = String(payload).split('|');
  const [mode, name, id, skin, level, xp, cash, bank, admin, moped, chat, hints, weather, time,
    adminPasswordSet = '0', punishments = '0', adminSeconds = '0', houseId = '0', housePrice = '0', carModel = '0', job = '0', taxiPhase = '0', faction = '0', factionRank = '0'] = state;
  const access = Number(admin);

  switch (Number(mode)) {
    case 1:
      heading('Анимации', 'Выбери действие. Остановить можно здесь или командой /anim.');
      row(button('Помахать', 'wave'), button('Сесть', 'sit'), button('Танцевать', 'dance'), button('Остановить', 'stop'));
      break;
    case 2: {
      carView = 'garage';
      heading('Мои автомобили', 'Выбери свою машину для управления. Купить новую можно в автосалоне.');
      const body = document.createElement('div'); body.id = 'car-view'; content.appendChild(body);
      renderCarView();
      break;
    }
    case 12: {
      carView = 'shop';
      heading('Автосалон Joo RP', 'Выбери автомобиль. Покупка доступна только здесь.');
      const body = document.createElement('div'); body.id = 'car-view'; content.appendChild(body);
      renderCarView();
      row(button('Мои автомобили', 'dealer-garage'));
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
        const model = field('Модель транспорта: 400–612', 'number');
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
      for (const text of [`Скин: ${skin}`, `Уровень: ${level} · XP: ${xp}/${Number(level) * 5}`, `Наличные: $${cash} · Банк: $${bank}`, `Фракция: ${['Нет','Полиция','Скорая помощь','FBI','Мэрия ЛС'][Number(faction)] || 'Нет'}${faction === '4' ? ` · ранг ${factionRank}/10` : ''}`, `Админ: ${admin} · Мопед: ${moped === '1' ? 'есть' : 'нет'}`]) {
        const element = document.createElement('div');
        element.className = 'stat';
        element.textContent = text;
        content.appendChild(element);
      }
      break;
    }
    case 6:
      heading('Настройки', 'Время и погода сохраняются на сервере. Графика интерфейса и звук сохраняются на этом устройстве.');
      row(button(`Локальный чат: ${chat === '1' ? 'вкл' : 'выкл'}`, 'chat'), button(`Подсказки: ${hints === '1' ? 'вкл' : 'выкл'}`, 'hints'));
      row(button(`Погода: ${['обычная', 'ясно', 'туман'][Number(weather)] || 'обычная'}`, 'weather'), button(`Время: ${['обычное', 'день', 'ночь'][Number(time)] || 'обычное'}`, 'time'));
      const clientSettings = document.createElement('div');
      clientSettings.id = 'client-prefs';
      clientSettings.className = 'row';
      content.appendChild(clientSettings);
      renderClientPrefs();
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
    case 10: {
      heading('Мои дома', 'Выбери дом, чтобы открыть управление. Покупать можно несколько домов.');
      const list = document.createElement('div');
      list.id = 'house-list';
      list.className = 'house-list';
      list.textContent = 'Загружаем дома…';
      content.appendChild(list);
      const pages = document.createElement('div');
      pages.id = 'house-pages';
      pages.className = 'row';
      content.appendChild(pages);
      break;
    }
    case 11: {
      heading('Управление домом', 'Твой дом. Отметь его на карте или продай государству. Новый интерьер готовится.');
      const info = document.createElement('div');
      info.id = 'house-detail';
      info.className = 'stat';
      info.textContent = 'Загружаем сведения…';
      content.appendChild(info);
      row(button('Отметить на карте', 'house-pin'), button('К списку', 'house-back'));
      const sell = button('Продать государству', '', 'Возврат 70% стоимости');
      sell.classList.add('danger-tile');
      sell.onclick = () => {
        if (window.confirm('Продать этот дом государству за 70% стоимости?')) send('house-sell');
      };
      content.appendChild(sell);
      break;
    }
    case 13: {
      heading('GPS · Лос-Сантос', 'Выбери место — на карте появится зелёная отметка. Рабочий маршрут сохранится.');
      const locations = [
        ['Спавн', 'gps:spawn', 'Точка появления твоего уровня'],
        ['Мэрия', 'gps:cityhall', 'Работа курьера, уборщика и таксиста'],
        ['Автосалон', 'gps:dealer', 'Покупка автомобилей'],
        ['Больница', 'gps:hospital', 'Больница Лос-Сантоса'],
        ['Банк', 'gps:bank', 'Счёт и наличные'],
        ['Мопеды', 'gps:moped', 'Покупка и выдача мопеда'],
        ['Заправка', 'gps:fuel', 'Топливо для транспорта'],
        ['Все дома', 'gps:houses', 'Свободные и занятые дома сервера']
      ];
      const list = document.createElement('div'); list.className = 'gps-list';
      for (const [title, action, description] of locations) list.appendChild(button(title, action, description));
      content.appendChild(list);
      row(button('Убрать метку', 'gps:clear'));
      break;
    }
    case 14: {
      heading('GPS · дома', 'Выбери дом — его адрес появится на карте. Зелёный дом свободен, красный занят.');
      const list = document.createElement('div'); list.id = 'gps-houses'; list.className = 'gps-list';
      list.textContent = 'Загружаем дома…'; content.appendChild(list);
      const pages = document.createElement('div'); pages.id = 'gps-house-pages'; pages.className = 'row';
      content.appendChild(pages);
      row(button('← Все места', 'gps:back'));
      break;
    }
  }
}

let carState = { page: 0, total: 0, selectedId: 0, active: false, cars: [] };

function carName(model) {
  return carCatalog.find(item => item[0] === Number(model))?.[1] || `Модель ${model}`;
}

function carPhoto(model, title) {
  const photo = document.createElement('img');
  photo.src = Number(model) === 612 ? 'minsk.jpg' : `https://assets.open.mp/assets/images/vehiclePictures/Vehicle_${model}.jpg`;
  photo.alt = title;
  photo.loading = 'lazy';
  photo.onerror = () => { photo.style.display = 'none'; };
  return photo;
}

function renderCarView() {
  const body = document.getElementById('car-view');
  if (!body) return;
  body.replaceChildren();
  if (carView === 'shop') {
    const note = document.createElement('p'); note.textContent = 'Купленная машина навсегда появится в разделе «Мои автомобили».'; body.appendChild(note);
    const catalog = document.createElement('div'); catalog.className = 'car-catalog';
    for (const [model, title, price] of carCatalog) {
      const card = document.createElement('div'); card.className = 'car-card';
      const label = document.createElement('strong'); label.textContent = `${title} · $${price.toLocaleString('ru-RU')}`;
      card.append(carPhoto(model, title), label, button('Купить', `car-buy|${model}`)); catalog.appendChild(card);
    }
    body.appendChild(catalog);
    return;
  }
  const summary = document.createElement('p');
  summary.textContent = `Машин в гараже: ${carState.total}. Выбери машину для управления.`;
  body.appendChild(summary);
  const list = document.createElement('div'); list.className = 'car-garage';
  for (const car of carState.cars) {
    const tile = button(`#${car.id} · ${carName(car.model)}`, `car-select|${car.id}`,
      `Пробег: ${car.mileage} км · Топливо: ${car.fuel} л`);
    tile.classList.toggle('selected', car.id === carState.selectedId);
    list.appendChild(tile);
  }
  if (!carState.total) list.textContent = 'Автомобилей пока нет. Купить машину можно в автосалоне Лос-Сантоса.';
  body.appendChild(list);
  const pages = document.createElement('div'); pages.className = 'row car-pages';
  if (carState.page > 0) pages.appendChild(button('← Назад', `car-page|${carState.page - 1}`));
  if ((carState.page + 1) * 8 < carState.total) pages.appendChild(button('Дальше →', `car-page|${carState.page + 1}`));
  body.appendChild(pages);
  body.appendChild(button('Забрать свой мопед', 'spawn'));
  if (!carState.selectedId) return;
  const selected = carState.cars.find(car => car.id === carState.selectedId);
  const status = document.createElement('div'); status.className = 'stat';
  status.textContent = `Выбрана: ${selected ? carName(selected.model) : `машина #${carState.selectedId}`} · ${carState.active ? 'на улице' : 'в гараже'}`;
  body.appendChild(status);
  const actions = document.createElement('div'); actions.className = 'row car-actions';
  actions.append(button('Выдать рядом', 'car-spawn'), button('Отметить на карте', 'car-pin'), button('Припарковать', 'car-park'));
  body.appendChild(actions);
  const sell = button('Продать государству', '', 'Возврат 50% стоимости'); sell.classList.add('danger-tile');
  sell.onclick = () => { if (window.confirm('Продать выбранный автомобиль государству за половину цены?')) send('car-sell'); };
  body.appendChild(sell);
}

function renderCarList(payload) {
  const [page, total, selectedId, active, rows = ''] = String(payload).split('|');
  carState = {
    page: Math.max(0, Number(page) || 0), total: Math.max(0, Number(total) || 0),
    selectedId: Number(selectedId) || 0, active: active === '1',
    cars: rows.split(';').filter(Boolean).map(row => {
      const [id, model, mileage, fuel] = row.split(',').map(Number);
      return { id, model, mileage, fuel };
    }).filter(car => Number.isInteger(car.id) && car.id > 0)
  };
  renderCarView();
}

function renderHouseList(payload) {
  const [pageText, totalText, rows = ''] = String(payload).split('|');
  const list = document.getElementById('house-list');
  const pages = document.getElementById('house-pages');
  if (!list || !pages) return;
  list.replaceChildren(); pages.replaceChildren();
  const page = Math.max(0, Number(pageText) || 0);
  const total = Math.max(0, Number(totalText) || 0);
  if (!total) { list.textContent = 'У тебя пока нет домов. Свободный дом можно купить у зелёной метки клавишей N.'; return; }
  for (const entry of rows.split(';').filter(Boolean)) {
    const [id, price, x, y] = entry.split(',');
    const card = button(`Дом №${id}`, `house-select|${id}`, `Цена $${Number(price).toLocaleString('ru-RU')} · ${x}, ${y}`);
    list.appendChild(card);
  }
  if (page > 0) pages.appendChild(button('← Назад', `house-page|${page - 1}`));
  if ((page + 1) * 8 < total) pages.appendChild(button('Дальше →', `house-page|${page + 1}`));
  const count = document.createElement('span');
  count.className = 'house-count'; count.textContent = `Всего домов: ${total}`;
  pages.appendChild(count);
}

function renderHouseDetail(payload) {
  const detail = document.getElementById('house-detail');
  if (!detail) return;
  const [id, price, x, y, z] = String(payload).split('|');
  detail.textContent = `Дом №${id} · стоимость $${Number(price).toLocaleString('ru-RU')} · координаты ${x}, ${y}, ${z}`;
}

function renderGpsHouses(payload) {
  const [pageText, totalText, rows = ''] = String(payload).split('|');
  const list = document.getElementById('gps-houses');
  const pages = document.getElementById('gps-house-pages');
  if (!list || !pages) return;
  list.replaceChildren(); pages.replaceChildren();
  const page = Math.max(0, Number(pageText) || 0);
  const total = Math.max(0, Number(totalText) || 0);
  if (!total) { list.textContent = 'Домов на сервере пока нет.'; return; }
  for (const entry of rows.split(';').filter(Boolean)) {
    const [id, price, occupied] = entry.split(',');
    list.appendChild(button(`Дом №${id}`, `gps:house|${id}`,
      `${occupied === '1' ? 'Занят' : 'В продаже'} · $${Number(price).toLocaleString('ru-RU')}`));
  }
  if (page > 0) pages.appendChild(button('← Назад', `gps:house-page|${page - 1}`));
  if ((page + 1) * 8 < total) pages.appendChild(button('Дальше →', `gps:house-page|${page + 1}`));
  const count = document.createElement('span'); count.className = 'house-count';
  count.textContent = `Всего домов: ${total}`; pages.appendChild(count);
}

if (bridge && bridge.on) {
  bridge.on('panel:state', render);
  bridge.on('house:list', renderHouseList);
  bridge.on('house:detail', renderHouseDetail);
  bridge.on('gps:houses', renderGpsHouses);
  bridge.on('cars:list', renderCarList);
}
else render('4|developer|1|78|1|0|500|0|5|0|1|1|0|0|1|3|7260|0|0');

document.getElementById('close').addEventListener('click', () => send('close'));
window.addEventListener('keydown', event => { if (event.key === 'Escape') send('close'); });
