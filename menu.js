const bridge = window.cef;
const stats = document.getElementById('stats');

function act(action) {
  if (!bridge || typeof bridge.emit !== 'function') return;
  if (typeof bridge.set_focus === 'function') bridge.set_focus(false);
  if (typeof bridge.hide === 'function') bridge.hide(true);
  bridge.emit('menu:action', action);
}

if (bridge && typeof bridge.on === 'function') {
  bridge.on('menu:stats', value => { stats.textContent = String(value); });
} else {
  stats.textContent = 'Предпросмотр интерфейса';
}

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => act(button.dataset.action));
});
document.getElementById('close').addEventListener('click', () => act('close'));
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') act('close');
});
