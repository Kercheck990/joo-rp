const fields={online:document.getElementById('online'),static:document.getElementById('static'),id:document.getElementById('id'),health:document.getElementById('health'),hunger:document.getElementById('hunger'),weapon:document.getElementById('weapon'),safe:document.getElementById('safe'),healthbar:document.getElementById('healthbar'),hungerbar:document.getElementById('hungerbar'),money:document.getElementById('money')};
function update(value){const [online,staticId,playerId,health,hunger,weapon,safe,money]=String(value).split('|');const hp=Math.max(0,Math.min(100,Number(health)||0));const food=Math.max(0,Math.min(100,Number(hunger)||0));fields.online.textContent=`${online} онлайн`;fields.static.textContent=`#${staticId}`;fields.id.textContent=`ID ${playerId}`;fields.health.textContent=String(hp);fields.hunger.textContent=String(food);fields.money.textContent=`$${(Number(money)||0).toLocaleString('ru-RU')}`;fields.weapon.textContent=weapon||'Кулаки';fields.healthbar.style.width=`${hp}%`;fields.hungerbar.style.width=`${food}%`;fields.safe.hidden=safe!=='1'}
const minskIdle=new Audio('audio/minsk-idle.mp3');
const minskGas=new Audio('audio/minsk-gaz.mp3');
for(const sound of [minskIdle,minskGas]){sound.loop=true;sound.preload='auto'}
let minskMode='off';
function minskSound(mode){
  if(mode===minskMode)return;
  minskMode=mode;
  if(mode==='off'){
    for(const sound of [minskIdle,minskGas]){sound.pause();sound.currentTime=0}
    return;
  }
  minskIdle.volume=mode==='idle'?0.52:0;
  minskGas.volume=mode==='gas'?0.68:0;
  for(const sound of [minskIdle,minskGas])if(sound.paused)sound.play().catch(()=>{});
}
function vehicle(value){
  const box=document.getElementById('speedometer');
  if(value==='off'){box.hidden=true;minskSound('off');return}
  const [speed,fuel,mileage,engine,model,accelerating]=String(value).split('|');
  box.hidden=false;
  document.getElementById('speed').textContent=speed;
  document.getElementById('fuel').textContent=fuel;
  document.getElementById('mileage').textContent=mileage;
  document.getElementById('engine').textContent=engine==='1'?'Двигатель заведён · N /key':'Двигатель выключен · N /key';
  minskSound(model==='612'&&engine==='1'?(accelerating==='1'?'gas':'idle'):'off');
}
function minskThrottle(value){if(minskMode!=='off')minskSound(value==='1'?'gas':'idle')}
if(window.cef&&typeof window.cef.on==='function'){window.cef.on('hud:state',update);window.cef.on('vehicle:state',vehicle);window.cef.on('minsk:throttle',minskThrottle)}
window.addEventListener('pagehide',()=>minskSound('off'));
