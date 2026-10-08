const bridge = window.cef;
function closeDialog() { if (!bridge || typeof bridge.emit !== 'function') return; if (typeof bridge.set_focus === 'function') bridge.set_focus(false); if (typeof bridge.hide === 'function') bridge.hide(true); bridge.emit('dialog:action', 'close'); }
if (bridge && typeof bridge.on === 'function') bridge.on('dialog:show', payload => { const text = String(payload); const bar = text.indexOf('|'); document.getElementById('title').textContent = bar < 0 ? 'Сообщение' : text.slice(0, bar); document.getElementById('body').textContent = bar < 0 ? text : text.slice(bar + 1); });
else { document.getElementById('body').textContent = 'Предпросмотр CEF-диалога'; }
document.getElementById('ok').addEventListener('click', closeDialog);
document.getElementById('close').addEventListener('click', closeDialog);
window.addEventListener('keydown', event => { if (event.key === 'Escape' || event.key === 'Enter') closeDialog(); });
