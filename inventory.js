const bridge = window.cef;
function release() { if (bridge && typeof bridge.set_focus === 'function') bridge.set_focus(false); if (bridge && typeof bridge.hide === 'function') bridge.hide(true); }
function send(action) { if (!bridge || typeof bridge.emit !== 'function') return; if (action === 'close' || action === 'phone') release(); bridge.emit('inventory:action', action); }
function show(payload) {
  const [water, snack, phone] = String(payload).split('|').map(Number);
  for (const [item, count] of Object.entries({water, snack, phone})) {
    document.getElementById(`${item}-count`).textContent = Number.isFinite(count) ? count : '0';
    document.querySelector(`[data-use="${item}"]`).disabled = !count;
  }
}
if (bridge && typeof bridge.on === 'function') bridge.on('inventory:state', show); else show('2|1|1');
document.querySelectorAll('[data-use]').forEach(button => button.addEventListener('click', () => send(button.dataset.use)));
document.getElementById('close').addEventListener('click', () => send('close'));
window.addEventListener('keydown', event => { if (event.key === 'Escape') send('close'); });
