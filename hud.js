const fields={online:document.getElementById('online'),static:document.getElementById('static'),id:document.getElementById('id'),health:document.getElementById('health'),hunger:document.getElementById('hunger'),weapon:document.getElementById('weapon'),safe:document.getElementById('safe'),healthbar:document.getElementById('healthbar'),hungerbar:document.getElementById('hungerbar'),money:document.getElementById('money')};
function update(value){const [online,staticId,playerId,health,hunger,weapon,safe,money]=String(value).split('|');const hp=Math.max(0,Math.min(100,Number(health)||0));const food=Math.max(0,Math.min(100,Number(hunger)||0));fields.online.textContent=`${online} онлайн`;fields.static.textContent=`#${staticId}`;fields.id.textContent=`ID ${playerId}`;fields.health.textContent=String(hp);fields.hunger.textContent=String(food);fields.money.textContent=`$${(Number(money)||0).toLocaleString('ru-RU')}`;fields.weapon.textContent=weapon||'Кулаки';fields.healthbar.style.width=`${hp}%`;fields.hungerbar.style.width=`${food}%`;fields.safe.hidden=safe!=='1'}
const minskIdle=new Audio('audio/minsk-idle.mp3');
const minskGas=new Audio('audio/minsk-gaz.mp3');
for(const sound of [minskIdle,minskGas]){sound.loop=true;sound.preload='auto'}
function preference(key,fallback){const raw=localStorage.getItem(`joo.${key}`);return raw===null?fallback:Number(raw)}
function applyPreferences(){
  const scale=Math.max(80,Math.min(140,preference('scale',100)))/100;
  const opacity=Math.max(40,Math.min(100,preference('opacity',100)))/100;
  const speedometer=preference('speedometer',1)!==0;
  document.getElementById('hud').style.transform=`scale(${scale})`;
  document.getElementById('hud').style.opacity=String(opacity);
  const meter=document.getElementById('speedometer');
  meter.style.transform=`scale(${scale})`;
  meter.style.opacity=String(opacity);
  meter.style.display=speedometer?'':'none';
  document.documentElement.classList.toggle('reduced-motion',preference('effects',1)===0);
  const volume=Math.max(0,Math.min(100,preference('engineVolume',75)))/100;
  minskIdle.volume=minskMode==='idle'?volume*0.7:0;
  minskGas.volume=minskMode==='gas'?volume*0.9:0;
}
let minskMode='off';
function minskSound(mode){
  if(mode===minskMode)return;
  minskMode=mode;
  if(mode==='off'){
    for(const sound of [minskIdle,minskGas]){sound.pause();sound.currentTime=0}
    return;
  }
  applyPreferences();
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
window.addEventListener('storage',event=>{if(event.key&&event.key.startsWith('joo.'))applyPreferences()});
window.addEventListener('pagehide',()=>minskSound('off'));
applyPreferences();
