const bridge = window.cef;
const grid = document.getElementById('grid');
const details = document.getElementById('details');
function send(action) {
  if (!bridge || typeof bridge.emit !== 'function') return;
  if (action === 'close' || action.startsWith('nav:')) if (typeof bridge.set_focus === 'function') bridge.set_focus(false);
  bridge.emit('inventory:action', action);
}
const slots = [];
for (let i=0;i<30;i++) { const slot=document.createElement('div'); slot.className='slot'; grid.appendChild(slot); slots.push(slot); }
function show(payload) {
  const [waterText,snackText,phoneText,name,skin,ownedSkin,baseSkin] = String(payload).split('|');
  const [water,snack,phone] = [waterText,snackText,phoneText].map(Number);
  if (name) document.getElementById('player-name').textContent = name;
  if (skin && /^\d+$/.test(skin)) { const image = document.getElementById('skin-image'); image.src = `https://assets.open.mp/assets/images/skins/${skin}.png`; image.alt = `Скин ${skin}`; }
  const items=[['Вода','◈',water,'water'],['Перекус','◆',snack,'snack'],['Телефон','▣',phone,'phone']];
  slots.forEach(slot => { slot.replaceChildren(); slot.className='slot'; slot.onclick=null; });
  items.forEach(([label,icon,count,action],index) => { if (!count) return; const slot=slots[index]; slot.classList.add('owned'); slot.textContent=icon;
    const small=document.createElement('small'); small.textContent=label; slot.appendChild(small);
    const qty=document.createElement('strong'); qty.textContent=`x${count}`; slot.appendChild(qty);
    slot.onclick=()=>{ details.textContent=`${label}: использовать`; send(action); };
  });
  if (ownedSkin && Number(ownedSkin) >= 0) {
    const slot = slots[3]; const equipped = Number(skin) === Number(ownedSkin);
    slot.classList.add('owned','skin-slot');
    const image = document.createElement('img'); image.src = `https://assets.open.mp/assets/images/skins/${Number(ownedSkin)}.png`; image.alt = `Скин ${ownedSkin}`; slot.appendChild(image);
    const label = document.createElement('small'); label.textContent = equipped ? `Скин ${ownedSkin} · надет` : `Скин ${ownedSkin} · надеть`; slot.appendChild(label);
    slot.onclick = () => { details.textContent = equipped ? `Снять и вернуть скин ${baseSkin}` : `Надеть скин ${ownedSkin}`; send(equipped ? 'skin:remove' : 'skin:equip'); };
  }
}
if (bridge && bridge.on) bridge.on('inventory:state',show); else show('2|1|1');
document.querySelectorAll('[data-nav]').forEach(button=>button.addEventListener('click',()=>send(`nav:${button.dataset.nav}`)));
document.getElementById('close').addEventListener('click',()=>send('close'));
window.addEventListener('keydown',event=>{if(event.key==='Escape')send('close')});
