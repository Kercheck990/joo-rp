(function () {
  function init() {
    const panel = document.querySelector('[data-drag-window]');
    const handle = document.querySelector('[data-drag-handle]');
    if (!panel || !handle) return;
    let x = 0, y = 0, startX = 0, startY = 0, originX = 0, originY = 0, dragging = false;
    handle.style.touchAction = 'none';
    handle.style.cursor = 'move';
    function point(event) {
      const source = event.touches && event.touches[0] || event.changedTouches && event.changedTouches[0] || event;
      return {x: source.clientX, y: source.clientY};
    }
    function start(event) {
      if (event.target.closest('button, input, a, select, textarea')) return;
      const p = point(event);
      dragging = true; startX = p.x; startY = p.y; originX = x; originY = y;
      event.preventDefault();
    }
    function move(event) {
      if (!dragging) return;
      const p = point(event);
      const rect = panel.getBoundingClientRect();
      const nextX = originX + p.x - startX, nextY = originY + p.y - startY;
      x = Math.max(-rect.left + x, Math.min(window.innerWidth - rect.right + x, nextX));
      y = Math.max(-rect.top + y, Math.min(window.innerHeight - rect.bottom + y, nextY));
      panel.style.transform = `translate(${x}px, ${y}px)`;
      event.preventDefault();
    }
    function end() { dragging = false; }
    handle.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    handle.addEventListener('touchstart', start, {passive: false});
    window.addEventListener('touchmove', move, {passive: false});
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
