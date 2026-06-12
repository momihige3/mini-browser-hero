'use strict';
const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'mini-browser-hero-v7';
const KILLS_TO_CLEAR = 5;
const RARITIES = [
  ['common','コモン',5200,1.00],['rare','レア',2600,1.35],['epic','エピック',1300,1.85],
  ['legendary','レジェンダリー',650,2.6],['divine','ディヴァイン',180,3.5],['celestial','セレスティアル',55,4.4],
  ['arcana','アルカナ',12,5.4],['beyond','ビヨンド',3,6.8],['cosmic','コズミック',1,8.5]
];
const SLOTS = {weapon:'武器', armor:'防具', ring:'指輪'};
const ICON = {weapon:'⚔️', armor:'🛡️', ring:'🔮'};
const defaultState = {
  lv:1, exp:0, gold:0, hp:100,
  world:1, area:1, maxStage:1, kills:0,
  weaponLv:1, armorLv:1, ringLv:1,
  chests:0, inventory:[], equipped:{weapon:null, armor:null, ring:null},
  sound:{muted:false, volume:0.35}
};
let state = load();
let enemy = makeEnemy();
let dying = false;
let spawning = true;
let lastHeroAttack = performance.now();
let lastEnemyAttack = performance.now();
let lastSave = performance.now();
let audioCtx = null;

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return clone(defaultState);
    const s = {...clone(defaultState), ...JSON.parse(raw)};
    s.equipped = {...defaultState.equipped, ...(s.equipped||{})};
    s.sound = {...defaultState.sound, ...(s.sound||{})};
    s.inventory = Array.isArray(s.inventory) ? s.inventory : [];
    return s;
  }catch(e){ return clone(defaultState); }
}
function save(show=false){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); if(show) addLog('保存した！'); }
function stageNo(){ return (state.world-1)*10+state.area; }
function stageText(){ return `${state.world}-${state.area}`; }
function setStageByNo(n){ state.world = Math.floor((n-1)/10)+1; state.area = ((n-1)%10)+1; }
function maxStageNo(){ return state.maxStage || 1; }
function nextStage(){ const n=stageNo()+1; setStageByNo(n); state.maxStage=Math.max(maxStageNo(),n); state.kills=0; pop('stageClear'); addLog(`<b>ステージ ${stageText()} 開放！</b>`); refreshStageSelect(); }
function bonus(){
  const b={atk:0,def:0,hp:0,speed:0,leech:0,reduce:0,crit:0};
  Object.values(state.equipped).forEach(i=>{ if(!i)return; Object.keys(b).forEach(k=>b[k]+=i[k]||0); });
  return b;
}
function stats(){
  const b=bonus();
  return {
    maxHp: 90 + state.lv*14 + state.armorLv*20 + b.hp,
    atk: 8 + state.lv*3 + state.weaponLv*7 + b.atk,
    def: Math.floor(state.lv*0.8 + state.armorLv*2.2 + b.def),
    interval: Math.max(320, 1100 - state.ringLv*35 - state.lv*5 - b.speed),
    leech: Math.min(30,b.leech), reduce: Math.min(75,b.reduce), crit: Math.min(.55,.08+b.crit/100)
  };
}
function expNeed(){ return 60 + state.lv*32; }
function cost(key){ return Math.floor(35*Math.pow(state[key],1.55)); }
function makeEnemy(){
  const n=stageNo();
  const boss = state.area===10 || state.kills===KILLS_TO_CLEAR-1;
  const base = 36 + n*18 + Math.pow(n,1.18)*8;
  const hp = Math.floor(base*(boss?2.7:1));
  return {name: boss?`ボス ${stageText()}`:`スライム ${stageText()}`, boss, hp, maxHp:hp, atk:Math.floor((5+n*1.7)*(boss?1.65:1)), gold:Math.floor((10+n*4)*(boss?3:1)), exp:Math.floor((14+n*6)*(boss?3:1))};
}
function heroAttack(){
  if(dying||spawning) return;
  const s=stats();
  const crit=Math.random()<s.crit;
  const dmg=Math.max(1, Math.floor(s.atk*(crit?1.8:1)*(0.85+Math.random()*0.3)));
  enemy.hp-=dmg;
  if(s.leech>0) state.hp=Math.min(s.maxHp, state.hp+Math.ceil(dmg*s.leech/100));
  showSlash(); showDamage((crit?'CRIT ':'')+dmg); flash('enemy'); play(crit?'crit':'hit');
  if(enemy.hp<=0) defeatEnemy();
}
function enemyAttack(){
  if(dying||spawning) return;
  const s=stats();
  const dmg=Math.max(1, Math.floor(Math.max(1, enemy.atk-s.def+rand(0,3))*(1-s.reduce/100)));
  state.hp-=dmg; flash('hero');
  if(state.hp<=0){ state.hp=Math.ceil(s.maxHp*.45); state.gold=Math.max(0,Math.floor(state.gold*.9)); play('down'); addLog('倒れた！Goldを少し落として復活'); }
}
function defeatEnemy(){
  if(dying) return; dying=true; enemy.hp=0;
  const dead={...enemy};
  const el=$('enemy'); el.classList.remove('enter','walking','hit'); void el.offsetWidth; el.classList.add('dead');
  play(dead.boss?'boss':'win');
  setTimeout(()=>{
    state.gold+=dead.gold; state.exp+=dead.exp; state.kills++;
    addLog(`${dead.name}を倒した！ +${dead.gold} Gold / +${dead.exp} EXP`);
    rollChest(dead.boss); levelCheck();
    if(state.kills>=KILLS_TO_CLEAR) nextStage();
    enemy=makeEnemy(); dying=false; spawnEnemy(); renderAll();
  },560);
}
function spawnEnemy(){
  spawning=true;
  const el=$('enemy');
  $('enemyName').textContent=enemy.name;
  el.className='unit enemy walking';
  if(enemy.boss) el.classList.add('boss');
  void el.offsetWidth; el.classList.add('enter');
  setTimeout(()=>{spawning=false; lastHeroAttack=performance.now(); lastEnemyAttack=performance.now();},760);
}
function levelCheck(){
  let up=false;
  while(state.exp>=expNeed()){ state.exp-=expNeed(); state.lv++; state.hp=stats().maxHp; up=true; addLog(`レベルアップ！ Lv${state.lv}`); }
  if(up){ pop('levelUp'); play('level'); }
}
function rollChest(boss){ if(boss||Math.random()<.14){ state.chests++; pop('chestAnim'); play('chest'); addLog(boss?'ボス宝箱が落ちた！':'宝箱が落ちた！'); } }
function openChest(){
  if(state.chests<=0) return addLog('宝箱がないよ');
  state.chests--; const n=stageNo(); const gold=rand(20+n*5,55+n*10); const exp=rand(10+state.lv*5,38+state.lv*8);
  state.gold+=gold; state.exp+=exp; let msg=`宝箱を開けた！ +${gold} Gold / +${exp} EXP`;
  if(Math.random()<.6){ const item=makeItem(); state.inventory.unshift(item); state.inventory=state.inventory.slice(0,49); msg += `<br>装備：<b class="${item.cls}">${item.name}</b>`; play('drop'); }
  pop('chestAnim'); play('open'); addLog(msg); levelCheck(); renderAll(); save();
}
function pickRarity(){ let total=RARITIES.reduce((a,r)=>a+r[2],0), roll=Math.random()*total; for(const r of RARITIES){ roll-=r[2]; if(roll<=0) return r; } return RARITIES[0]; }
function makeItem(){
  const slot=['weapon','armor','ring'][rand(0,2)], r=pickRarity(), n=stageNo();
  const power=Math.max(1,Math.floor((state.lv+n*1.5)*r[3]));
  const i={id:Date.now().toString(36)+Math.random().toString(36).slice(2), slot, cls:r[0], rarity:r[1], atk:0,def:0,hp:0,speed:0,leech:0,reduce:0,crit:0};
  if(slot==='weapon'){ i.atk=power+rand(1,6); i.crit=rand(0,Math.floor(power/3)); }
  if(slot==='armor'){ i.def=Math.floor(power/2)+rand(1,5); i.hp=power*4+rand(8,24); i.reduce=rand(0,Math.floor(power/4)); }
  if(slot==='ring'){ i.atk=rand(0,Math.floor(power/2)); i.hp=rand(0,power*2); i.speed=20+Math.floor(power*2.2); i.leech=rand(0,Math.floor(power/4)); }
  const base={weapon:'ソード',armor:'アーマー',ring:'オーブ'}[slot];
  const prefix={cosmic:'次元の',beyond:'超越の',arcana:'秘奥の',celestial:'星天の',divine:'神威の'}[i.cls] || i.rarity;
  i.name=prefix+base; return i;
}
function power(i){ return i?((i.atk||0)+(i.def||0)+Math.floor((i.hp||0)/4)+Math.floor((i.speed||0)/12)+(i.leech||0)*2+(i.reduce||0)*2+(i.crit||0)):0; }
function itemText(i){ return `${SLOTS[i.slot]} / 攻撃+${i.atk||0} 防御+${i.def||0} HP+${i.hp||0} 速度+${i.speed||0} 吸収+${i.leech||0}% 軽減+${i.reduce||0}% クリ+${i.crit||0}%`; }
function equipItem(id){ const idx=state.inventory.findIndex(i=>i.id===id); if(idx<0)return; const item=state.inventory.splice(idx,1)[0]; const old=state.equipped[item.slot]; if(old) state.inventory.unshift(old); state.equipped[item.slot]=item; hideTip(); hideMenu(); hideDetail(); play('equip'); addLog(`<b class="${item.cls}">${item.name}</b>を装備した`); renderAll(); save(); }
function sellItem(id){ const idx=state.inventory.findIndex(i=>i.id===id); if(idx<0)return; const item=state.inventory.splice(idx,1)[0]; const g=Math.max(5,power(item)*4); state.gold+=g; hideTip(); hideMenu(); hideDetail(); play('sell'); addLog(`${item.name}を売却 +${g} Gold`); renderAll(); save(); }
function upgrade(key){ const c=cost(key); if(state.gold<c) return addLog(`${c} Gold必要`); state.gold-=c; state[key]++; state.hp=Math.min(stats().maxHp,state.hp+20); play('equip'); renderAll(); save(); }
function heal(){ const c=Math.max(10,Math.floor(stats().maxHp*.25)); if(state.gold<c) return addLog(`回復には${c} Gold必要`); state.gold-=c; state.hp=stats().maxHp; play('heal'); renderAll(); save(); }
function changeStage(){ const n=Number($('stageSelect').value||1); setStageByNo(n); state.kills=0; enemy=makeEnemy(); addLog(`ステージ ${stageText()} へ移動`); spawnEnemy(); renderAll(); save(); }
function refreshStageSelect(){ const sel=$('stageSelect'); const cur=stageNo(); sel.innerHTML=''; for(let n=1;n<=maxStageNo();n++){ const w=Math.floor((n-1)/10)+1,a=((n-1)%10)+1; const op=document.createElement('option'); op.value=n; op.textContent=`${w}-${a}`; if(n===cur)op.selected=true; sel.appendChild(op); } }
function renderAll(){
  const s=stats(); state.hp=Math.min(state.hp,s.maxHp);
  $('lv').textContent=state.lv; $('gold').textContent=state.gold; $('stage').textContent=stageText(); $('battleStage').textContent=stageText(); $('chests').textContent=state.chests; $('openChestCount').textContent=state.chests;
  $('heroHpText').textContent=`${state.hp}/${s.maxHp}`; $('enemyHpText').textContent=`${Math.max(0,enemy.hp)}/${enemy.maxHp}`; $('expText').textContent=`${state.exp}/${expNeed()}`;
  $('heroHpBar').style.width=(state.hp/s.maxHp*100)+'%'; $('enemyHpBar').style.width=(Math.max(0,enemy.hp)/enemy.maxHp*100)+'%'; $('expBar').style.width=(state.exp/expNeed()*100)+'%';
  $('atk').textContent=s.atk; $('def').textContent=s.def; $('maxHp').textContent=s.maxHp; $('speed').textContent=(1000/s.interval).toFixed(2)+'回/秒'; $('kills').textContent=`${state.kills}/${KILLS_TO_CLEAR}`;
  ['weapon','armor','ring'].forEach(slot=>{});
  $('weaponLv').textContent=state.weaponLv; $('armorLv').textContent=state.armorLv; $('ringLv').textContent=state.ringLv;
  $('weaponCost').textContent=cost('weaponLv')+' Gold'; $('armorCost').textContent=cost('armorLv')+' Gold'; $('ringCost').textContent=cost('ringLv')+' Gold';
  $('weaponUp').disabled=state.gold<cost('weaponLv'); $('armorUp').disabled=state.gold<cost('armorLv'); $('ringUp').disabled=state.gold<cost('ringLv'); $('openChestBtn').disabled=state.chests<=0;
  $('muteBtn').textContent=state.sound.muted?'🔇 SE OFF':'🔊 SE ON'; $('volume').value=Math.round(state.sound.volume*100);
  renderEquips(); renderInventory(); refreshStageSelect();
}
function renderEquips(){ const box=$('equips'); box.innerHTML=Object.keys(SLOTS).map(slot=>{ const i=state.equipped[slot]; return `<div class="equip"><div class="equip-icon ${i?i.cls:''}">${i?ICON[slot]:'□'}</div><div><b>${SLOTS[slot]}</b><br>${i?`<span class="${i.cls}">${i.name}</span><small>${itemText(i)}</small>`:'<span class="muted">未装備</span>'}</div></div>`; }).join(''); }
function renderInventory(){
  const box=$('inventory'); box.innerHTML='';
  for(let n=0;n<49;n++){
    const i=state.inventory[n];
    const b=document.createElement('button');
    b.className='slot '+(i?i.cls:'empty');
    if(i){
      b.innerHTML=`${ICON[i.slot]}<small>${power(i)}</small>`;
      b.onclick=(e)=>{ e.stopPropagation(); showMenu(i,e.clientX,e.clientY); };
      b.oncontextmenu=(e)=>{ e.preventDefault(); e.stopPropagation(); showDetail(i,e.clientX,e.clientY); };
      b.onmouseenter=(e)=>showTip(i,e.clientX,e.clientY);
      b.onmousemove=(e)=>moveTip(e.clientX,e.clientY);
      b.onmouseleave=hideTip;
    }
    box.appendChild(b);
  }
}
function statRows(i,eq){
  const keys=[['atk','攻撃'],['def','防御'],['hp','HP'],['speed','速度'],['crit','会心']];
  return keys.filter(([k])=>(i[k]||0)||(eq&&eq[k])).map(([k,label])=>{
    const v=i[k]||0, ev=eq?eq[k]||0:0, d=v-ev;
    const sign=k==='speed'?'%':'';
    const cls=d>=0?'diff-plus':'diff-minus';
    return `<div>${label}</div><div><b>${v}${sign}</b> <span class="${cls}">(${d>=0?'+':''}${d}${sign})</span></div>`;
  }).join('');
}
function showTip(i,x,y){
  const eq=state.equipped[i.slot];
  const diff=power(i)-power(eq);
  const t=$('tooltip');
  t.innerHTML=`<div class="tip-title ${i.cls}">${ICON[i.slot]} ${i.name}</div>
    <div>${i.rarity} / ${SLOTS[i.slot]}</div>
    <div>${itemText(i)}</div><hr>
    <div>現在装備：${eq?`<span class="${eq.cls}">${eq.name}</span>`:'なし'}</div>
    <div class="compare-grid">${statRows(i,eq)||'<div class="muted">比較なし</div><div></div>'}</div>
    <div class="${diff>=0?'diff-plus':'diff-minus'}">総合戦力差 ${diff>=0?'+':''}${diff}</div>
    <div class="muted">クリックで装備/売却メニュー</div>`;
  t.classList.add('show'); moveTip(x,y);
}
function showMenu(i,x,y){
  hideTip();
  const m=$('itemMenu');
  const sellGold=Math.max(5,power(i)*4);
  m.innerHTML=`<div class="item-menu-title ${i.cls}">${ICON[i.slot]} ${i.name}</div>
    <button class="btn" onclick="equipItem('${i.id}')">装備する</button>
    <button class="btn danger" onclick="sellItem('${i.id}')">売却する +${sellGold} Gold</button>
    <button class="btn" onclick="hideMenu()">閉じる</button>`;
  m.classList.add('show'); moveMenu(x,y);
}
function detailEl(){
  let d=$('itemDetail');
  if(!d){ d=document.createElement('div'); d.id='itemDetail'; d.className='item-detail'; document.body.appendChild(d); }
  return d;
}
function showDetail(i,x,y){
  hideTip(); hideMenu();
  const eq=state.equipped[i.slot];
  const diff=power(i)-power(eq);
  const sellGold=Math.max(5,power(i)*4);
  const d=detailEl();
  d.innerHTML=`<div class="detail-title ${i.cls}">${ICON[i.slot]} ${i.name}</div>
    <div class="detail-sub">${i.rarity} / ${SLOTS[i.slot]}</div>
    <div>${itemText(i)}</div><hr>
    <div>現在装備：${eq?`<span class="${eq.cls}">${eq.name}</span>`:'なし'}</div>
    <div class="compare-grid">${statRows(i,eq)||'<div class="muted">比較なし</div><div></div>'}</div>
    <div class="${diff>=0?'diff-plus':'diff-minus'}">総合戦力差 ${diff>=0?'+':''}${diff}</div>
    <div class="detail-actions">
      <button class="btn" onclick="equipItem('${i.id}')">装備する</button>
      <button class="btn danger" onclick="sellItem('${i.id}')">売却 +${sellGold} Gold</button>
      <button class="btn" onclick="hideDetail()">閉じる</button>
    </div>
    <div class="muted detail-note">右クリック詳細 / 左クリック操作</div>`;
  d.classList.add('show'); moveDetail(x,y);
}
function moveDetail(x,y){ const d=detailEl(); d.style.left=Math.min(innerWidth-390,Math.max(8,x+12))+'px'; d.style.top=Math.min(innerHeight-330,Math.max(8,y+12))+'px'; }
function hideDetail(){ const d=$('itemDetail'); if(d) d.classList.remove('show'); }
function moveMenu(x,y){ const m=$('itemMenu'); m.style.left=Math.min(innerWidth-190,Math.max(8,x+12))+'px'; m.style.top=Math.min(innerHeight-170,Math.max(8,y+12))+'px'; }
function moveTip(x,y){ const t=$('tooltip'); t.style.left=Math.min(innerWidth-370,Math.max(8,x+16))+'px'; t.style.top=Math.min(innerHeight-260,Math.max(8,y-18))+'px'; }
function hideTip(){ $('tooltip').classList.remove('show'); }
function hideMenu(){ $('itemMenu').classList.remove('show'); }
function showSlash(){ const e=$('slash'); e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function showDamage(txt){ const e=$('damageText'); e.textContent=txt; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function flash(id){ const e=$(id); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
function pop(id){ const e=$(id); e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function addLog(html){ const l=$('log'); const d=document.createElement('div'); d.innerHTML=html; l.prepend(d); while(l.children.length>80) l.lastChild.remove(); }
function rand(a,b){ return Math.floor(a+Math.random()*(b-a+1)); }
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }
function play(type){ if(state.sound.muted||state.sound.volume<=0)return; try{ ensureAudio(); const map={hit:[250,.05],crit:[560,.08],win:[660,.09],boss:[170,.18],chest:[850,.12],open:[730,.14],drop:[980,.16],level:[1050,.22],equip:[430,.08],sell:[320,.06],heal:[620,.12],down:[120,.22]}; const [f,d]=map[type]||map.hit, now=audioCtx.currentTime, o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type==='down'?'sawtooth':'square'; o.frequency.setValueAtTime(f,now); o.frequency.exponentialRampToValueAtTime(Math.max(60,f*.55),now+d); g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(state.sound.volume*.12,now+.01); g.gain.exponentialRampToValueAtTime(.0001,now+d); o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now+d+.02); }catch(e){} }
function loop(now){
  const s=stats();
  if(!dying&&!spawning&&now-lastHeroAttack>s.interval){ heroAttack(); lastHeroAttack=now; }
  if(!dying&&!spawning&&now-lastEnemyAttack>1300){ enemyAttack(); lastEnemyAttack=now; }
  if(now-lastSave>5000){ save(); lastSave=now; }
  renderBarsOnly(); requestAnimationFrame(loop);
}
function renderBarsOnly(){ const s=stats(); state.hp=Math.min(state.hp,s.maxHp); $('heroHpText').textContent=`${state.hp}/${s.maxHp}`; $('enemyHpText').textContent=`${Math.max(0,enemy.hp)}/${enemy.maxHp}`; $('expText').textContent=`${state.exp}/${expNeed()}`; $('heroHpBar').style.width=(state.hp/s.maxHp*100)+'%'; $('enemyHpBar').style.width=(Math.max(0,enemy.hp)/enemy.maxHp*100)+'%'; $('expBar').style.width=(state.exp/expNeed()*100)+'%'; }
function sortInventory(){ state.inventory.sort((a,b)=>power(b)-power(a)); renderAll(); save(); }
function reset(){ if(!confirm('本当にリセットする？')) return; localStorage.removeItem(SAVE_KEY); state=clone(defaultState); enemy=makeEnemy(); addLog('リセットした'); spawnEnemy(); renderAll(); }

$('openChestBtn').onclick=openChest; $('sortBtn').onclick=sortInventory; $('weaponUp').onclick=()=>upgrade('weaponLv'); $('armorUp').onclick=()=>upgrade('armorLv'); $('ringUp').onclick=()=>upgrade('ringLv'); $('healBtn').onclick=heal; $('saveBtn').onclick=()=>save(true); $('resetBtn').onclick=reset; $('goStage').onclick=changeStage;
$('muteBtn').onclick=()=>{state.sound.muted=!state.sound.muted; play('equip'); renderAll(); save();};
$('volume').oninput=(e)=>{state.sound.volume=Number(e.target.value)/100; state.sound.muted=state.sound.volume===0; renderAll(); save();};
window.addEventListener('pointerdown', ensureAudio, {once:true});
// ブラウザ標準の右クリックメニューは出さず、ゲーム内操作だけにする
// アイテム上の右クリックは詳細固定表示、それ以外の右クリックは何も起きない
window.addEventListener('contextmenu', (e)=>{ e.preventDefault(); });
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.slot') && !e.target.closest('#itemMenu')) hideMenu();
  if(!e.target.closest('.slot') && !e.target.closest('#itemDetail')) hideDetail();
});
addLog('冒険開始！敵は左、英雄は右。自動で戦うよ。');
refreshStageSelect(); spawnEnemy(); renderAll(); requestAnimationFrame(loop);
