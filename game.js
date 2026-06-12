'use strict';
const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'mini-browser-hero-v12';
const KILLS_TO_CLEAR = 5;
const RARITIES = [
  ['common','コモン',5200,1.00],['rare','レア',2600,1.35],['epic','エピック',1300,1.85],
  ['legendary','レジェンダリー',650,2.6],['divine','ディヴァイン',180,3.5],['celestial','セレスティアル',55,4.4],
  ['arcana','アルカナ',12,5.4],['beyond','ビヨンド',3,6.8],['cosmic','コズミック',1,8.5]
];
const SLOTS = {weapon:'武器', shield:'盾', helm:'兜', armor:'鎧', gloves:'腕', boots:'足', ring:'リング', amulet:'アミュレット'};
const SLOT_GROUP = {weapon:'weapon', shield:'armor', helm:'armor', armor:'armor', gloves:'armor', boots:'armor', ring:'ring', amulet:'ring'};
const ICON = {weapon:'⚔️', shield:'🛡️', helm:'⛑️', armor:'🥋', gloves:'🧤', boots:'🥾', ring:'💍', amulet:'📿'};
const MAT_NAME = {weapon:'武器石', armor:'防具石', ring:'装飾石'};
const defaultState = {
  lv:1, exp:0, gold:0, hp:100,
  world:1, area:1, maxStage:1, kills:0,
  chests:0, materials:{weapon:0, armor:0, ring:0}, inventory:[],
  equipped:{weapon:null, shield:null, helm:null, armor:null, gloves:null, boots:null, ring:null, amulet:null},
  sound:{muted:false, volume:0.35},
  debug:false
};
let state = load();
let enemy = makeEnemy();
let dying = false, spawning = true;
let lastHeroAttack = performance.now(), lastEnemyAttack = performance.now(), lastSave = performance.now();
let audioCtx = null;
let selectedEquipSlot = null;

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem('mini-browser-hero-v7');
    if(!raw) return clone(defaultState);
    const old = JSON.parse(raw);
    const s = {...clone(defaultState), ...old};
    s.equipped = {...defaultState.equipped, ...(old.equipped||{})};
    if(old.equipped && old.equipped.armor && !old.equipped.shield) s.equipped.armor = old.equipped.armor;
    if(old.equipped && old.equipped.ring) s.equipped.ring = old.equipped.ring;
    s.sound = {...defaultState.sound, ...(old.sound||{})};
    s.debug = !!old.debug;
    s.materials = {...defaultState.materials, ...(old.materials||{})};
    s.inventory = Array.isArray(old.inventory) ? old.inventory.map(normalizeItem) : [];
    Object.keys(s.equipped).forEach(k=>{ if(s.equipped[k]) s.equipped[k]=normalizeItem(s.equipped[k], k); });
    return s;
  }catch(e){ return clone(defaultState); }
}
function normalizeItem(i, fallbackSlot){
  if(!i) return i;
  i = {...i};
  if(i.slot === 'ring' && /オーブ/.test(i.name||'')) i.name = (i.name||'').replace('オーブ','リング');
  if(i.slot === 'armor' && fallbackSlot && ['shield','helm','armor','gloves','boots'].includes(fallbackSlot)) i.slot=fallbackSlot;
  if(!SLOTS[i.slot]) i.slot = fallbackSlot || 'weapon';
  i.upgrade = i.upgrade || 0;
  return i;
}
function save(show=false){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); if(show) addLog('保存した！'); }
function stageNo(){ return (state.world-1)*10+state.area; }
function stageText(){ return `${state.world}-${state.area}`; }
function setStageByNo(n){ state.world = Math.floor((n-1)/10)+1; state.area = ((n-1)%10)+1; }
function maxStageNo(){ return state.maxStage || 1; }
function nextStage(){ const n=stageNo()+1; setStageByNo(n); state.maxStage=Math.max(maxStageNo(),n); state.kills=0; pop('stageClear'); addLog(`<b>ステージ ${stageText()} 開放！</b>`); refreshStageSelect(); }
function itemBonusValue(i,k){ if(!i) return 0; const up=i.upgrade||0; return Math.floor((i[k]||0)*(1+up*.12)) + (k==='atk'||k==='def'?up*2:0) + (k==='hp'?up*8:0) + (k==='speed'?up*8:0); }
function bonus(){
  const b={atk:0,def:0,hp:0,speed:0,leech:0,reduce:0,crit:0};
  Object.values(state.equipped).forEach(i=>{ if(!i)return; Object.keys(b).forEach(k=>b[k]+=itemBonusValue(i,k)); });
  return b;
}
function stats(){
  const b=bonus();
  return {maxHp:90+state.lv*14+b.hp, atk:8+state.lv*3+b.atk, def:Math.floor(state.lv*.8+b.def), interval:Math.max(320,1100-state.lv*5-b.speed), leech:Math.min(30,b.leech), reduce:Math.min(75,b.reduce), crit:Math.min(.55,.08+b.crit/100)};
}
function expNeed(){ return 60 + state.lv*32; }
function makeEnemy(){ const n=stageNo(), boss=state.area===10||state.kills===KILLS_TO_CLEAR-1, base=36+n*18+Math.pow(n,1.18)*8, hp=Math.floor(base*(boss?2.7:1)); return {name:boss?`ボス ${stageText()}`:`スライム ${stageText()}`, boss, hp, maxHp:hp, atk:Math.floor((5+n*1.7)*(boss?1.65:1)), gold:Math.floor((10+n*4)*(boss?3:1)), exp:Math.floor((14+n*6)*(boss?3:1))}; }
function heroAttack(){ if(dying||spawning)return; const s=stats(), crit=Math.random()<s.crit, dmg=Math.max(1,Math.floor(s.atk*(crit?1.8:1)*(.85+Math.random()*.3))); enemy.hp-=dmg; if(s.leech>0) state.hp=Math.min(s.maxHp,state.hp+Math.ceil(dmg*s.leech/100)); showSlash(); showDamage((crit?'CRIT ':'')+dmg); flash('enemy'); play(crit?'crit':'hit'); if(enemy.hp<=0) defeatEnemy(); }
function enemyAttack(){ if(dying||spawning)return; const s=stats(), dmg=Math.max(1,Math.floor(Math.max(1,enemy.atk-s.def+rand(0,3))*(1-s.reduce/100))); state.hp-=dmg; flash('hero'); if(state.hp<=0){ state.hp=Math.ceil(s.maxHp*.45); state.gold=Math.max(0,Math.floor(state.gold*.9)); play('down'); addLog('倒れた！Goldを少し落として復活'); } }
function defeatEnemy(){ if(dying)return; dying=true; enemy.hp=0; const dead={...enemy}; const el=$('enemy'); el.classList.remove('enter','walking','hit'); void el.offsetWidth; el.classList.add('dead'); play(dead.boss?'boss':'win'); setTimeout(()=>{ state.gold+=dead.gold; state.exp+=dead.exp; state.kills++; addLog(`${dead.name}を倒した！ +${dead.gold} Gold / +${dead.exp} EXP`); rollChest(dead.boss); levelCheck(); if(state.kills>=KILLS_TO_CLEAR) nextStage(); enemy=makeEnemy(); dying=false; spawnEnemy(); renderAll(); },560); }
function spawnEnemy(){ spawning=true; const el=$('enemy'); $('enemyName').textContent=enemy.name; el.className='unit enemy walking'; if(enemy.boss) el.classList.add('boss'); void el.offsetWidth; el.classList.add('enter'); setTimeout(()=>{spawning=false; lastHeroAttack=performance.now(); lastEnemyAttack=performance.now();},760); }
function levelCheck(){ let up=false; while(state.exp>=expNeed()){ state.exp-=expNeed(); state.lv++; state.hp=stats().maxHp; up=true; addLog(`レベルアップ！ Lv${state.lv}`); } if(up){ pop('levelUp'); play('level'); } }
function rollChest(boss){ if(boss||Math.random()<.14){ state.chests++; pop('chestAnim'); play('chest'); addLog(boss?'ボス宝箱が落ちた！':'宝箱が落ちた！'); } }
function toggleDebug(){ state.debug=!state.debug; addLog(state.debug?'デバッグモードON':'デバッグモードOFF'); renderAll(); save(); }
function debugAddChests(){ if(!state.debug) return addLog('デバッグモードをONにしてね'); state.chests+=10; pop('chestAnim'); play('chest'); addLog('デバッグ：宝箱 +10'); renderAll(); save(); }
function openChest(){
  if(state.chests<=0) return addLog('宝箱がないよ');
  state.chests--; const n=stageNo(), gold=rand(20+n*5,55+n*10), exp=rand(10+state.lv*5,38+state.lv*8);
  state.gold+=gold; state.exp+=exp; let msg=`宝箱を開けた！ +${gold} Gold / +${exp} EXP`;
  const matType=['weapon','armor','ring'][rand(0,2)], matQty=rand(1,3)+(Math.random()<.16?rand(2,5):0);
  state.materials[matType]+=matQty; msg += `<br>素材：${MAT_NAME[matType]} +${matQty}`;
  if(Math.random()<.6){ const item=makeItem(); state.inventory.unshift(item); state.inventory=state.inventory.slice(0,49); msg += `<br>装備：<b class="${item.cls}">${item.name}</b>`; play('drop'); }
  pop('chestAnim'); play('open'); addLog(msg); levelCheck(); renderAll(); save();
}
function pickRarity(){ let total=RARITIES.reduce((a,r)=>a+r[2],0), roll=Math.random()*total; for(const r of RARITIES){ roll-=r[2]; if(roll<=0)return r; } return RARITIES[0]; }
function makeItem(){
  const slots=['weapon','shield','helm','armor','gloves','boots','ring','amulet'];
  const slot=slots[rand(0,slots.length-1)], r=pickRarity(), n=stageNo(), powerBase=Math.max(1,Math.floor((state.lv+n*1.5)*r[3]));
  const i={id:Date.now().toString(36)+Math.random().toString(36).slice(2), slot, cls:r[0], rarity:r[1], upgrade:0, atk:0,def:0,hp:0,speed:0,leech:0,reduce:0,crit:0};
  if(slot==='weapon'){ i.atk=powerBase+rand(1,6); i.crit=rand(0,Math.floor(powerBase/3)); }
  else if(SLOT_GROUP[slot]==='armor'){ i.def=Math.floor(powerBase/2)+rand(1,5); i.hp=powerBase*4+rand(8,24); i.reduce=rand(0,Math.floor(powerBase/4)); if(slot==='shield')i.def+=rand(1,5); if(slot==='boots')i.speed=rand(5,Math.floor(powerBase)); if(slot==='gloves')i.atk=rand(0,Math.floor(powerBase/3)); }
  else { i.atk=rand(0,Math.floor(powerBase/2)); i.hp=rand(0,powerBase*2); i.speed=20+Math.floor(powerBase*2.2); i.leech=rand(0,Math.floor(powerBase/4)); if(slot==='amulet')i.crit=rand(0,Math.floor(powerBase/3)); }
  const base={weapon:'ソード',shield:'シールド',helm:'ヘルム',armor:'アーマー',gloves:'ガントレット',boots:'ブーツ',ring:'リング',amulet:'アミュレット'}[slot];
  const prefix={cosmic:'次元の',beyond:'超越の',arcana:'秘奥の',celestial:'星天の',divine:'神威の'}[i.cls] || i.rarity;
  i.name=prefix+base; return i;
}
function power(i){ return i?((itemBonusValue(i,'atk'))+(itemBonusValue(i,'def'))+Math.floor(itemBonusValue(i,'hp')/4)+Math.floor(itemBonusValue(i,'speed')/12)+(itemBonusValue(i,'leech'))*2+(itemBonusValue(i,'reduce'))*2+(itemBonusValue(i,'crit'))):0; }
function itemText(i){ return `${SLOTS[i.slot]} / +${i.upgrade||0} / 攻撃+${itemBonusValue(i,'atk')} 防御+${itemBonusValue(i,'def')} HP+${itemBonusValue(i,'hp')} 速度+${itemBonusValue(i,'speed')} 吸収+${itemBonusValue(i,'leech')}% 軽減+${itemBonusValue(i,'reduce')}% クリ+${itemBonusValue(i,'crit')}%`; }
function equipItem(id){ const idx=state.inventory.findIndex(i=>i.id===id); if(idx<0)return; const item=state.inventory.splice(idx,1)[0]; const old=state.equipped[item.slot]; if(old) state.inventory.unshift(old); state.equipped[item.slot]=item; hideTip(); hideMenu(); hideDetail(); play('equip'); addLog(`<b class="${item.cls}">${item.name}</b>を装備した`); renderAll(); save(); }
function sellItem(id){ const idx=state.inventory.findIndex(i=>i.id===id); if(idx<0)return; const item=state.inventory.splice(idx,1)[0]; const g=Math.max(5,power(item)*4); state.gold+=g; hideTip(); hideMenu(); hideDetail(); play('sell'); addLog(`${item.name}を売却 +${g} Gold`); renderAll(); save(); }
function bulkSell(){ if(state.inventory.length===0)return addLog('売却する装備がないよ'); if(!confirm('倉庫内の装備をすべて売却する？'))return; let g=0,c=0; state.inventory.forEach(i=>{g+=Math.max(5,power(i)*4); c++;}); state.inventory=[]; state.gold+=g; hideTip(); hideMenu(); hideDetail(); play('sell'); addLog(`一括売却：${c}個 / +${g} Gold`); renderAll(); save(); }
function upgradeSelected(){
  if(!selectedEquipSlot || !state.equipped[selectedEquipSlot]) return addLog('強化する装備を選んでね');
  const item = state.equipped[selectedEquipSlot];
  const group = SLOT_GROUP[selectedEquipSlot];
  const need = (item.upgrade || 0) + 1;
  if(state.materials[group] < need) return addLog(`${MAT_NAME[group]}が${need}個必要`);
  state.materials[group] -= need;
  item.upgrade = (item.upgrade || 0) + 1;
  state.hp = Math.min(stats().maxHp, state.hp + 20);
  play('equip');
  pop('upgradePop');
  addLog(`<b class="${item.cls}">${item.name}</b>を+${item.upgrade}に強化！`);
  renderAll(); save();
}
function selectEquip(slot){
  if(!state.equipped[slot]){ selectedEquipSlot = null; addLog(`${SLOTS[slot]}は未装備だよ`); }
  else { selectedEquipSlot = slot; play('equip'); }
  renderAll();
}
function heal(){ const c=Math.max(10,Math.floor(stats().maxHp*.25)); if(state.gold<c)return addLog(`回復には${c} Gold必要`); state.gold-=c; state.hp=stats().maxHp; play('heal'); renderAll(); save(); }
function changeStage(){ const n=Number($('stageSelect').value||1); setStageByNo(n); state.kills=0; enemy=makeEnemy(); addLog(`ステージ ${stageText()} へ移動`); spawnEnemy(); renderAll(); save(); }
function refreshStageSelect(){ const sel=$('stageSelect'), cur=stageNo(); sel.innerHTML=''; for(let n=1;n<=maxStageNo();n++){ const w=Math.floor((n-1)/10)+1,a=((n-1)%10)+1,op=document.createElement('option'); op.value=n; op.textContent=`${w}-${a}`; if(n===cur)op.selected=true; sel.appendChild(op); } }
function matText(){ return `武${state.materials.weapon}/防${state.materials.armor}/装${state.materials.ring}`; }
function renderAll(){
  const s=stats(); state.hp=Math.min(state.hp,s.maxHp);
  $('lv').textContent=state.lv; $('gold').textContent=state.gold; $('stage').textContent=stageText(); $('battleStage').textContent=stageText(); $('chests').textContent=state.chests; $('materialsTop').textContent=matText(); $('materialText').textContent=matText(); $('openChestCount').textContent=state.chests; $('matWeapon').textContent=state.materials.weapon; $('matArmor').textContent=state.materials.armor; $('matRing').textContent=state.materials.ring;
  $('heroHpText').textContent=`${state.hp}/${s.maxHp}`; $('enemyHpText').textContent=`${Math.max(0,enemy.hp)}/${enemy.maxHp}`; $('expText').textContent=`${state.exp}/${expNeed()}`;
  $('heroHpBar').style.width=(state.hp/s.maxHp*100)+'%'; $('enemyHpBar').style.width=(Math.max(0,enemy.hp)/enemy.maxHp*100)+'%'; $('expBar').style.width=(state.exp/expNeed()*100)+'%';
  $('atk').textContent=s.atk; $('def').textContent=s.def; $('maxHp').textContent=s.maxHp; $('speed').textContent=(1000/s.interval).toFixed(2)+'回/秒'; $('kills').textContent=`${state.kills}/${KILLS_TO_CLEAR}`;
  const selectedItem = selectedEquipSlot ? state.equipped[selectedEquipSlot] : null;
  if($('upgradeBtn')){ $('upgradeBtn').disabled=!selectedItem; $('upgradeBtn').textContent=selectedItem ? `強化：${SLOTS[selectedEquipSlot]} +${selectedItem.upgrade||0} → +${(selectedItem.upgrade||0)+1}（${MAT_NAME[SLOT_GROUP[selectedEquipSlot]]}×${(selectedItem.upgrade||0)+1}）` : '強化'; }
  $('openChestBtn').disabled=state.chests<=0; if($('debugModeBtn')) $('debugModeBtn').textContent=state.debug?'デバッグON':'デバッグOFF'; if($('debugChestBtn')) $('debugChestBtn').style.display=state.debug?'inline-flex':'none';
  $('muteBtn').textContent=state.sound.muted?'🔇 SE OFF':'🔊 SE ON'; $('volume').value=Math.round(state.sound.volume*100);
  renderEquips(); renderInventory(); refreshStageSelect();
}
function renderEquips(){ const box=$('equips'); box.innerHTML=Object.keys(SLOTS).map(slot=>{ const i=state.equipped[slot], selected=selectedEquipSlot===slot; return `<button class="equip ${selected?'selected':''}" onclick="selectEquip('${slot}')"><div class="equip-icon ${i?i.cls:''}">${i?ICON[slot]:'□'}</div><div><b>${SLOTS[slot]}</b><br>${i?`<span class="${i.cls}">${i.name} +${i.upgrade||0}</span><small>${itemText(i)}</small>`:'<span class="muted">未装備</span>'}</div></button>`; }).join(''); }
function renderInventory(){
  const box=$('inventory'); box.innerHTML='';
  for(let n=0;n<49;n++){
    const i=state.inventory[n], b=document.createElement('button'); b.className='slot '+(i?i.cls:'empty');
    if(i){ b.innerHTML=`${ICON[i.slot]}<small>${power(i)}</small>`; b.onclick=(e)=>{e.stopPropagation(); equipItem(i.id);}; b.oncontextmenu=(e)=>{e.preventDefault();e.stopPropagation();showDetail(i,e.clientX,e.clientY);}; b.onmouseenter=(e)=>{ if(!$('itemDetail')?.classList.contains('show')) showTip(i,e.clientX,e.clientY); }; b.onmousemove=(e)=>{ if(!$('itemDetail')?.classList.contains('show')) moveTip(e.clientX,e.clientY); }; b.onmouseleave=hideTip; }
    box.appendChild(b);
  }
}
function statRows(i,eq){ const keys=[['atk','攻撃'],['def','防御'],['hp','HP'],['speed','速度'],['crit','会心']]; return keys.filter(([k])=>itemBonusValue(i,k)||(eq&&itemBonusValue(eq,k))).map(([k,label])=>{ const v=itemBonusValue(i,k), ev=eq?itemBonusValue(eq,k):0, d=v-ev, cls=d>=0?'diff-plus':'diff-minus'; return `<div>${label}</div><div><b>${v}</b> <span class="${cls}">(${d>=0?'+':''}${d})</span></div>`; }).join(''); }
function showTip(i,x,y){ const eq=state.equipped[i.slot], diff=power(i)-power(eq), t=$('tooltip'); t.innerHTML=`<div class="tip-title ${i.cls}">${ICON[i.slot]} ${i.name} +${i.upgrade||0}</div><div>${i.rarity} / ${SLOTS[i.slot]}</div><div>${itemText(i)}</div><hr><div>現在装備：${eq?`<span class="${eq.cls}">${eq.name} +${eq.upgrade||0}</span>`:'なし'}</div><div class="compare-grid">${statRows(i,eq)||'<div class="muted">比較なし</div><div></div>'}</div><div class="${diff>=0?'diff-plus':'diff-minus'}">総合戦力差 ${diff>=0?'+':''}${diff}</div>`; t.classList.add('show'); moveTip(x,y); }
function showMenu(){/* 左クリックメニュー廃止 */}
function detailEl(){ let d=$('itemDetail'); if(!d){ d=document.createElement('div'); d.id='itemDetail'; d.className='item-detail'; document.body.appendChild(d); } return d; }
function showDetail(i,x,y){ hideTip(); hideMenu(); const eq=state.equipped[i.slot], diff=power(i)-power(eq), sellGold=Math.max(5,power(i)*4), d=detailEl(); d.innerHTML=`<div class="detail-title ${i.cls}">${ICON[i.slot]} ${i.name} +${i.upgrade||0}</div><div class="detail-sub">${i.rarity} / ${SLOTS[i.slot]}</div><div>${itemText(i)}</div><hr><div>現在装備：${eq?`<span class="${eq.cls}">${eq.name} +${eq.upgrade||0}</span>`:'なし'}</div><div class="compare-grid">${statRows(i,eq)||'<div class="muted">比較なし</div><div></div>'}</div><div class="${diff>=0?'diff-plus':'diff-minus'}">総合戦力差 ${diff>=0?'+':''}${diff}</div><div class="detail-actions"><button class="btn" onclick="equipItem('${i.id}')">装備する</button><button class="btn danger" onclick="sellItem('${i.id}')">売却 +${sellGold} Gold</button><button class="btn" onclick="hideDetail()">閉じる</button></div>`; d.classList.add('show'); moveDetail(x,y); }
function moveDetail(x,y){ const d=detailEl(); d.style.left=Math.min(innerWidth-390,Math.max(8,x+12))+'px'; d.style.top=Math.min(innerHeight-300,Math.max(8,y+12))+'px'; }
function hideDetail(){ const d=$('itemDetail'); if(d)d.classList.remove('show'); }
function moveMenu(x,y){ const m=$('itemMenu'); if(!m)return; m.style.left=Math.min(innerWidth-190,Math.max(8,x+12))+'px'; m.style.top=Math.min(innerHeight-170,Math.max(8,y+12))+'px'; }
function moveTip(x,y){ const t=$('tooltip'); t.style.left=Math.min(innerWidth-370,Math.max(8,x+16))+'px'; t.style.top=Math.min(innerHeight-260,Math.max(8,y-18))+'px'; }
function hideTip(){ $('tooltip').classList.remove('show'); }
function hideMenu(){ $('itemMenu').classList.remove('show'); }
function showSlash(){ const e=$('slash'); e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function showDamage(txt){ const e=$('damageText'); e.textContent=txt; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function flash(id){ const e=$(id); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
function pop(id){ let e=$(id); if(!e && id==='upgradePop'){ e=document.createElement('div'); e.id='upgradePop'; e.className='center-pop upgrade-pop'; e.textContent='強化成功！'; document.querySelector('.battle-panel').appendChild(e); } if(!e)return; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function addLog(html){ const l=$('log'); const d=document.createElement('div'); d.innerHTML=html; l.prepend(d); while(l.children.length>80) l.lastChild.remove(); }
function rand(a,b){ return Math.floor(a+Math.random()*(b-a+1)); }
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }
function play(type){ if(state.sound.muted||state.sound.volume<=0)return; try{ ensureAudio(); const map={hit:[250,.05],crit:[560,.08],win:[660,.09],boss:[170,.18],chest:[850,.12],open:[730,.14],drop:[980,.16],level:[1050,.22],equip:[430,.08],sell:[320,.06],heal:[620,.12],down:[120,.22]}; const [f,d]=map[type]||map.hit, now=audioCtx.currentTime, o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type==='down'?'sawtooth':'square'; o.frequency.setValueAtTime(f,now); o.frequency.exponentialRampToValueAtTime(Math.max(60,f*.55),now+d); g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(state.sound.volume*.12,now+.01); g.gain.exponentialRampToValueAtTime(.0001,now+d); o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now+d+.02); }catch(e){} }
function loop(now){ const s=stats(); if(!dying&&!spawning&&now-lastHeroAttack>s.interval){ heroAttack(); lastHeroAttack=now; } if(!dying&&!spawning&&now-lastEnemyAttack>1300){ enemyAttack(); lastEnemyAttack=now; } if(now-lastSave>5000){ save(); lastSave=now; } renderBarsOnly(); requestAnimationFrame(loop); }
function renderBarsOnly(){ const s=stats(); state.hp=Math.min(state.hp,s.maxHp); $('heroHpText').textContent=`${state.hp}/${s.maxHp}`; $('enemyHpText').textContent=`${Math.max(0,enemy.hp)}/${enemy.maxHp}`; $('expText').textContent=`${state.exp}/${expNeed()}`; $('heroHpBar').style.width=(state.hp/s.maxHp*100)+'%'; $('enemyHpBar').style.width=(Math.max(0,enemy.hp)/enemy.maxHp*100)+'%'; $('expBar').style.width=(state.exp/expNeed()*100)+'%'; }
function sortInventory(){ state.inventory.sort((a,b)=>power(b)-power(a)); renderAll(); save(); }
function reset(){ if(!confirm('本当にリセットする？'))return; localStorage.removeItem(SAVE_KEY); state=clone(defaultState); enemy=makeEnemy(); addLog('リセットした'); spawnEnemy(); renderAll(); }

$('openChestBtn').onclick=openChest; $('sortBtn').onclick=sortInventory; $('bulkSellBtn').onclick=bulkSell; if($('debugModeBtn')) $('debugModeBtn').onclick=toggleDebug; if($('debugChestBtn')) $('debugChestBtn').onclick=debugAddChests; if($('upgradeBtn')) $('upgradeBtn').onclick=upgradeSelected; $('healBtn').onclick=heal; $('saveBtn').onclick=()=>save(true); $('resetBtn').onclick=reset; $('goStage').onclick=changeStage;
$('muteBtn').onclick=()=>{state.sound.muted=!state.sound.muted; play('equip'); renderAll(); save();};
$('volume').oninput=(e)=>{state.sound.volume=Number(e.target.value)/100; state.sound.muted=state.sound.volume===0; renderAll(); save();};
window.addEventListener('pointerdown', ensureAudio, {once:true});
window.addEventListener('contextmenu', (e)=>{ e.preventDefault(); });
document.addEventListener('click', (e)=>{ if(!e.target.closest('.slot') && !e.target.closest('#itemMenu')) hideMenu(); if(!e.target.closest('.slot') && !e.target.closest('#itemDetail')) hideDetail(); });
addLog('冒険開始！敵は左、英雄は右。自動で戦うよ。');
refreshStageSelect(); spawnEnemy(); renderAll(); requestAnimationFrame(loop);
