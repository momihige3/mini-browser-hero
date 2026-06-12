'use strict';
const $ = id => document.getElementById(id);
const SAVE_KEY = 'mini-browser-hero-v16';
const OLD_KEYS = ['mini-browser-hero-v15','mini-browser-hero-v13','mini-browser-hero-v12','mini-browser-hero-v7'];
const KILLS_TO_CLEAR = 5;
const RARITIES = [
  ['common','コモン',5200,1],['rare','レア',2600,1.35],['epic','エピック',1300,1.85],['legendary','レジェンダリー',650,2.6],
  ['divine','ディヴァイン',180,3.5],['celestial','セレスティアル',55,4.4],['arcana','アルカナ',12,5.4],['beyond','ビヨンド',3,6.8],['cosmic','コズミック',1,8.5]
];
const SLOTS = { weapon:'武器', shield:'盾', helm:'兜', armor:'鎧', gloves:'腕', boots:'足', ring:'リング', amulet:'アミュレット' };
const ICON = { weapon:'⚔️', shield:'🛡️', helm:'⛑️', armor:'🥋', gloves:'🧤', boots:'🥾', ring:'💍', amulet:'🔱' };
const SLOT_GROUP = { weapon:'weapon', shield:'armor', helm:'armor', armor:'armor', gloves:'armor', boots:'armor', ring:'ring', amulet:'ring' };
const MAT_NAME = { weapon:'武器石', armor:'防具石', ring:'装飾石' };
const PROP_DEFS = {
  healOnAttack: { name:'攻撃時HP回復', unit:'%', desc:v=>`攻撃時HP${v}%回復` },
  nullify: { name:'被ダメージ無効', unit:'%', desc:v=>`被ダメージ無効${v}%` },
  drain: { name:'ダメージ吸収', unit:'%', desc:v=>`攻撃時ダメージの${v}%回復` },
  doubleHit: { name:'追撃', unit:'%', desc:v=>`攻撃時${v}%で追撃` },
  chestBonus: { name:'宝箱発見', unit:'%', desc:v=>`宝箱ドロップ率+${v}%` }
};
const WEAPON_SKILLS = {
  multi: { name:'連続攻撃', chance:22, desc:v=>`攻撃時${v}%で連続攻撃`, effect:'multi' },
  heavy: { name:'大攻撃', chance:18, desc:v=>`攻撃時${v}%で大攻撃`, effect:'heavy' },
  fire: { name:'炎斬り', chance:20, desc:v=>`攻撃時${v}%で炎斬り`, effect:'fire' },
  thunder: { name:'雷撃', chance:18, desc:v=>`攻撃時${v}%で雷撃`, effect:'thunder' }
};
let bulkSellOpen = false;

const defaultState = { lv:1, exp:0, gold:0, hp:104, world:1, area:1, maxStage:1, kills:0, chests:0, materials:{weapon:0,armor:0,ring:0}, inventory:[], equipped:{weapon:null,shield:null,helm:null,armor:null,gloves:null,boots:null,ring:null,amulet:null}, sound:{muted:false,volume:.35}, debug:false };
let state = load();
let enemy = makeEnemy();
let dying = false, spawning = true, selectedEquipSlot = null;
let lastHeroAttack = performance.now(), lastEnemyAttack = performance.now(), lastSave = performance.now(), audioCtx = null;

function clone(o){ return JSON.parse(JSON.stringify(o)); }
function rand(a,b){ return Math.floor(a + Math.random() * (b-a+1)); }
function load(){
  try{
    let raw = localStorage.getItem(SAVE_KEY);
    if(!raw){ for(const k of OLD_KEYS){ raw = localStorage.getItem(k); if(raw) break; } }
    if(!raw) return clone(defaultState);
    const old = JSON.parse(raw), s = {...clone(defaultState), ...old};
    s.sound = {...defaultState.sound, ...(old.sound||{})};
    s.materials = {...defaultState.materials, ...(old.materials||{})};
    s.equipped = {...defaultState.equipped, ...(old.equipped||{})};
    s.inventory = Array.isArray(old.inventory) ? old.inventory.map(normalizeItem).slice(0,50) : [];
    Object.keys(s.equipped).forEach(k=>{ if(s.equipped[k]) s.equipped[k] = normalizeItem(s.equipped[k], k); });
    return s;
  }catch(e){ return clone(defaultState); }
}
function normalizeItem(i,fallback){
  i = {...i};
  if(i.slot === 'ring' && /オーブ/.test(i.name||'')) i.name = i.name.replace('オーブ','リング');
  if(i.slot === 'armor' && fallback && fallback !== 'armor') i.slot = fallback;
  if(!SLOTS[i.slot]) i.slot = fallback || 'weapon';
  i.upgrade = i.upgrade || 0;
  i.props = i.props || [];
  i.skills = i.skills || [];
  ['atk','def','hp','speed','leech','reduce','crit'].forEach(k=>i[k]=Number(i[k]||0));
  return i;
}
function save(show=false){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); if(show) addLog('保存した！'); }
function stageNo(){ return (state.world-1)*10 + state.area; }
function stageText(){ return `${state.world}-${state.area}`; }
function setStageByNo(n){ state.world = Math.floor((n-1)/10)+1; state.area = ((n-1)%10)+1; }
function maxStageNo(){ return state.maxStage || 1; }
function expNeed(){ return 60 + state.lv * 32; }
function itemBonusValue(i,k){ if(!i) return 0; const up=i.upgrade||0; return Math.floor((i[k]||0)*(1+up*.13)) + (k==='atk'||k==='def'?up*2:0) + (k==='hp'?up*8:0) + (k==='speed'?up*8:0); }
function bonus(){
  const b = {atk:0,def:0,hp:0,speed:0,leech:0,reduce:0,crit:0,healOnAttack:0,nullify:0,drain:0,doubleHit:0,chestBonus:0};
  Object.values(state.equipped).forEach(i=>{ if(!i) return; ['atk','def','hp','speed','leech','reduce','crit'].forEach(k=>b[k]+=itemBonusValue(i,k)); (i.props||[]).forEach(p=>b[p.key]=(b[p.key]||0)+p.value); });
  return b;
}
function stats(){ const b=bonus(); return { maxHp:90+state.lv*14+b.hp, atk:8+state.lv*3+b.atk, def:Math.floor(state.lv*.8+b.def), interval:Math.max(320,1100-state.lv*5-b.speed), leech:Math.min(30,b.leech), reduce:Math.min(75,b.reduce), crit:Math.min(.55,.08+b.crit/100), healOnAttack:b.healOnAttack, nullify:Math.min(70,b.nullify), drain:Math.min(80,b.drain), doubleHit:Math.min(70,b.doubleHit), chestBonus:b.chestBonus }; }
function makeEnemy(){ const n=stageNo(), boss=state.area===10||state.kills===KILLS_TO_CLEAR-1, base=36+n*18+Math.pow(n,1.18)*8, hp=Math.floor(base*(boss?2.7:1)); return {name:boss?`ボス ${stageText()}`:`スライム ${stageText()}`, boss, hp, maxHp:hp, atk:Math.floor((5+n*1.7)*(boss?1.65:1)), gold:Math.floor((10+n*4)*(boss?3:1)), exp:Math.floor((14+n*6)*(boss?3:1))}; }

function heroAttack(extra=false, forcedSkill=null){
  if(dying || spawning) return;
  const s=stats(), weapon=state.equipped.weapon;
  let skill = forcedSkill;
  if(!extra && !skill && weapon && weapon.skills && weapon.skills.length){
    for(const sk of weapon.skills){ if(Math.random()*100 < (sk.chance||WEAPON_SKILLS[sk.key]?.chance||0)){ skill=sk; break; } }
  }
  const crit = Math.random() < s.crit;
  let mult = crit ? 1.8 : 1;
  if(skill?.key==='heavy') mult *= 2.25;
  if(skill?.key==='fire') mult *= 1.55;
  if(skill?.key==='thunder') mult *= 1.75;
  if(extra) mult *= .68;
  const dmg = Math.max(1, Math.floor((s.atk + rand(0,4)) * mult));
  enemy.hp -= dmg;
  const heal = Math.ceil(s.maxHp * (s.healOnAttack||0) / 100) + Math.ceil(dmg * ((s.leech||0)+(s.drain||0)) / 100);
  if(heal>0){ state.hp = Math.min(s.maxHp, state.hp + heal); showDamage('+'+heal,'heal'); }
  const effect = skill ? (WEAPON_SKILLS[skill.key]?.effect||'') : (extra?'multi':'');
  showSlash(effect); if(skill && !extra) showSkillName(WEAPON_SKILLS[skill.key]?.name || 'スキル');
  showDamage((crit?'CRIT ':'') + dmg, crit?'crit':(skill?'skill':'')); flash('enemy'); play(crit?'crit':'hit');
  if(enemy.hp <= 0){ defeatEnemy(); return; }
  if(skill?.key==='multi' && !extra){ setTimeout(()=>heroAttack(true,{key:'multi'}), 90); setTimeout(()=>heroAttack(true,{key:'multi'}), 180); return; }
  if(!extra && Math.random()*100 < s.doubleHit) setTimeout(()=>heroAttack(true), 140);
}
function enemyAttack(){
  if(dying || spawning) return;
  const s=stats();
  if(Math.random()*100 < s.nullify){ showDamage('GUARD','guard'); flash('hero'); play('equip'); return; }
  const dmg = Math.max(1, Math.floor(Math.max(1, enemy.atk - s.def + rand(0,3)) * (1 - s.reduce/100)));
  state.hp -= dmg; flash('hero'); play('hit');
  if(state.hp <= 0){ state.hp = Math.ceil(s.maxHp*.45); state.gold = Math.max(0, Math.floor(state.gold*.9)); play('down'); addLog('倒れた！Goldを少し落として復活'); }
}
function defeatEnemy(){
  if(dying) return; dying=true; enemy.hp=0;
  const dead = {...enemy}; const el=$('enemy'); el.className='unit enemy dead' + (dead.boss?' boss':''); play(dead.boss?'boss':'win');
  setTimeout(()=>{ state.gold+=dead.gold; state.exp+=dead.exp; state.kills++; addLog(`${dead.name}を倒した！ +${dead.gold} Gold / +${dead.exp} EXP`); rollChest(dead.boss); levelCheck(); if(state.kills>=KILLS_TO_CLEAR) nextStage(); enemy=makeEnemy(); dying=false; spawnEnemy(); renderAll(); }, 560);
}
function spawnEnemy(){ spawning=true; const el=$('enemy'); $('enemyName').textContent=enemy.name; el.className='unit enemy walking enter' + (enemy.boss?' boss':''); setTimeout(()=>{ spawning=false; lastHeroAttack=performance.now(); lastEnemyAttack=performance.now(); }, 760); }
function nextStage(){ const n=stageNo()+1; setStageByNo(n); state.maxStage=Math.max(maxStageNo(),n); state.kills=0; pop('stageClear'); addLog(`ステージ ${stageText()} 開放！`); refreshStageSelect(); }
function levelCheck(){ let up=false; while(state.exp>=expNeed()){ state.exp-=expNeed(); state.lv++; state.hp=stats().maxHp; up=true; addLog(`レベルアップ！ Lv${state.lv}`); } if(up){ pop('levelUp'); play('level'); } }
function rollChest(boss){ const s=stats(); if(boss || Math.random() < .14 + s.chestBonus/100){ state.chests++; pop('chestAnim'); play('chest'); addLog(boss?'ボス宝箱が落ちた！':'宝箱が落ちた！'); } }
function openChest(){
  if(state.chests<=0) return addLog('宝箱がないよ');
  state.chests--; const n=stageNo(), gold=rand(20+n*5,55+n*10), exp=rand(10+state.lv*5,38+state.lv*8);
  state.gold+=gold; state.exp+=exp;
  const mt=['weapon','armor','ring'][rand(0,2)], mq=rand(1,3)+(Math.random()<.16?rand(2,5):0); state.materials[mt]+=mq;
  let msg=`宝箱を開けた！ +${gold} Gold / +${exp} EXP / ${MAT_NAME[mt]} +${mq}`;
  if(Math.random()<.66 && state.inventory.length<50){ const item=makeItem(); state.inventory.unshift(item); msg += ` / 装備：${item.name}`; play('drop'); }
  pop('chestAnim'); play('open'); addLog(msg); levelCheck(); renderAll(); save();
}
function open10(){ const count=Math.min(10,state.chests); if(count<=0) return addLog('宝箱がないよ'); for(let i=0;i<count;i++) openChest(); addLog(`10個開封：${count}個開けた！`); }
function pickRarity(){ let total=RARITIES.reduce((a,r)=>a+r[2],0), roll=Math.random()*total; for(const r of RARITIES){ roll-=r[2]; if(roll<=0) return r; } return RARITIES[0]; }
function makeItem(){
  const slots=Object.keys(SLOTS), slot=slots[rand(0,slots.length-1)], r=pickRarity(), n=stageNo(), p=Math.max(1,Math.floor((state.lv+n*1.5)*r[3]));
  const i={id:Date.now().toString(36)+Math.random().toString(36).slice(2),slot,cls:r[0],rarity:r[1],upgrade:0,atk:0,def:0,hp:0,speed:0,leech:0,reduce:0,crit:0,props:[]};
  if(slot==='weapon'){ i.atk=p+rand(1,6); i.crit=rand(0,Math.floor(p/3)); }
  else if(SLOT_GROUP[slot]==='armor'){ i.def=Math.floor(p/2)+rand(1,5); i.hp=p*4+rand(8,24); i.reduce=rand(0,Math.floor(p/4)); if(slot==='shield')i.def+=rand(1,5); if(slot==='boots')i.speed=rand(5,Math.max(6,p)); if(slot==='gloves')i.atk=rand(0,Math.floor(p/3)); }
  else { i.atk=rand(0,Math.floor(p/2)); i.hp=rand(0,p*2); i.speed=20+Math.floor(p*2.2); i.leech=rand(0,Math.floor(p/4)); if(slot==='amulet')i.crit=rand(0,Math.floor(p/3)); }
  if(Math.random() < .18 + (r[3]-1)*.025){ const keys=Object.keys(PROP_DEFS); const key=keys[rand(0,keys.length-1)]; i.props.push({key,value:rand(3, key==='drain'?12:8)}); }
  if(['arcana','beyond','cosmic'].includes(i.cls) && Math.random()<.35){ const keys=Object.keys(PROP_DEFS); const key=keys[rand(0,keys.length-1)]; if(!i.props.some(p=>p.key===key)) i.props.push({key,value:rand(5,14)}); }
  if(slot==='weapon' && Math.random() < .48 + Math.min(.28, r[3]*.035)){
    const keys=Object.keys(WEAPON_SKILLS); const key=keys[rand(0,keys.length-1)];
    i.skills.push({key, chance: rand(14, Math.min(38, 16 + Math.floor(r[3]*5)))});
    if(['divine','celestial','arcana','beyond','cosmic'].includes(i.cls) && Math.random()<.35){
      const key2=keys[rand(0,keys.length-1)]; if(!i.skills.some(sk=>sk.key===key2)) i.skills.push({key:key2, chance:rand(16,42)});
    }
  }
  const base={weapon:'ソード',shield:'シールド',helm:'ヘルム',armor:'アーマー',gloves:'ガントレット',boots:'ブーツ',ring:'リング',amulet:'アミュレット'}[slot];
  const prefix={cosmic:'次元の',beyond:'超越の',arcana:'秘奥の',celestial:'星天の',divine:'神威の'}[i.cls] || i.rarity;
  i.name = prefix + base; return i;
}
function power(i){ return i ? itemBonusValue(i,'atk')+itemBonusValue(i,'def')+Math.floor(itemBonusValue(i,'hp')/4)+Math.floor(itemBonusValue(i,'speed')/12)+itemBonusValue(i,'leech')*2+itemBonusValue(i,'reduce')*2+itemBonusValue(i,'crit')+(i.props||[]).reduce((a,p)=>a+p.value*6,0)+(i.skills||[]).reduce((a,sk)=>a+(sk.chance||0)*5,0) : 0; }
function equipItem(id){ const idx=state.inventory.findIndex(i=>i.id===id); if(idx<0)return; const item=state.inventory.splice(idx,1)[0], old=state.equipped[item.slot]; if(old) state.inventory.unshift(old); state.equipped[item.slot]=item; hideTip(); hideDetail(); play('equip'); addLog(`${item.name}を装備した`); renderAll(); save(); }
function sellItem(id){ const idx=state.inventory.findIndex(i=>i.id===id); if(idx<0)return; const item=state.inventory.splice(idx,1)[0], g=Math.max(5,power(item)*4); state.gold+=g; hideTip(); hideDetail(); play('sell'); addLog(`${item.name}を売却 +${g} Gold`); renderAll(); save(); }
function selectedSellClasses(){
  const boxes=[...document.querySelectorAll('[data-sell-rarity]')];
  const set=new Set();
  boxes.forEach(b=>{
    if(!b.checked) return;
    const v=b.dataset.sellRarity;
    if(v==='divine') ['divine','celestial','arcana','beyond','cosmic'].forEach(x=>set.add(x));
    else set.add(v);
  });
  return set;
}
function updateBulkSellPreview(){
  const el=$('bulkSellPreview'); if(!el) return;
  const set=selectedSellClasses(); let g=0,c=0;
  state.inventory.forEach(i=>{ if(set.has(i.cls)){ c++; g+=Math.max(5,power(i)*4); } });
  el.textContent=`売却予定 ${c}個 / ${g} Gold`;
}
function toggleBulkSell(){ bulkSellOpen=!bulkSellOpen; const p=$('bulkSellPanel'); if(p) p.classList.toggle('show', bulkSellOpen); updateBulkSellPreview(); }
function bulkSell(){
  if(!state.inventory.length) return addLog('売却する装備がないよ');
  const set=selectedSellClasses(); let g=0,c=0, keep=[];
  state.inventory.forEach(i=>{ if(set.has(i.cls)){ c++; g+=Math.max(5,power(i)*4); } else keep.push(i); });
  if(c<=0) return addLog('売却対象がないよ');
  state.inventory=keep; state.gold+=g; hideTip(); hideDetail(); play('sell');
  addLog(`一括売却：${c}個 / +${g} Gold`); renderAll(); save();
}
function bestEquip(){
  let changed=0; const all=[...state.inventory]; Object.values(state.equipped).forEach(i=>{if(i)all.push(i)});
  Object.keys(SLOTS).forEach(slot=>{ const best=all.filter(i=>i.slot===slot).sort((a,b)=>power(b)-power(a))[0]||null; state.equipped[slot]=best; });
  const eqIds=new Set(Object.values(state.equipped).filter(Boolean).map(i=>i.id)); state.inventory=all.filter(i=>!eqIds.has(i.id)).slice(0,50); changed=eqIds.size;
  addLog(`最強装備を一括装備：${changed}部位`); play('equip'); renderAll(); save();
}
function sortInventory(){ state.inventory.sort((a,b)=>power(b)-power(a)); renderAll(); save(); }
function selectEquip(slot){ if(!state.equipped[slot]){ selectedEquipSlot=null; addLog(`${SLOTS[slot]}は未装備だよ`); } else { selectedEquipSlot=slot; play('equip'); } renderAll(); }
function upgradeSelected(){ const item=selectedEquipSlot && state.equipped[selectedEquipSlot]; if(!item) return addLog('強化する装備を選んでね'); const group=SLOT_GROUP[selectedEquipSlot], need=(item.upgrade||0)+1; if(state.materials[group] < need) return addLog(`${MAT_NAME[group]}が足りない！ 必要 ${need}`); state.materials[group]-=need; item.upgrade=(item.upgrade||0)+1; pop('levelUp'); play('level'); addLog(`${item.name} を +${item.upgrade} に強化！`); renderAll(); save(); }
function heal(){ state.hp=stats().maxHp; play('heal'); addLog('全回復した！'); renderAll(); save(); }
function toggleDebug(){ state.debug=!state.debug; addLog(state.debug?'デバッグモードON':'デバッグモードOFF'); renderAll(); save(); }
function debugAddChests(){ if(!state.debug) return addLog('デバッグモードをONにしてね'); state.chests+=10; pop('chestAnim'); play('chest'); addLog('デバッグ：宝箱 +10'); renderAll(); save(); }
function changeStage(){ const n=Number($('stageSelect').value); setStageByNo(n); state.kills=0; enemy=makeEnemy(); spawnEnemy(); addLog(`ステージ ${stageText()} へ移動`); renderAll(); save(); }
function refreshStageSelect(){ const sel=$('stageSelect'); sel.innerHTML=''; for(let n=1;n<=maxStageNo();n++){ const o=document.createElement('option'); o.value=n; o.textContent=`${Math.floor((n-1)/10)+1}-${((n-1)%10)+1}`; if(n===stageNo())o.selected=true; sel.appendChild(o); } }

function renderAll(){
  document.body.classList.toggle('debug', state.debug); const s=stats(); state.hp=Math.min(state.hp,s.maxHp);
  $('topStats').innerHTML = [`Lv ${state.lv}`,`Gold ${state.gold}`,`Stage ${stageText()}`,`宝箱 ${state.chests}`,`素材 ${state.materials.weapon}/${state.materials.armor}/${state.materials.ring}`].map(x=>`<span>${x}</span>`).join('');
  $('stageLabel').textContent=stageText(); $('openChestBtn').textContent=`宝箱を開ける ×${state.chests}`; $('muteBtn').textContent=state.sound.muted?'SE OFF':'SE ON'; $('volume').value=Math.round(state.sound.volume*100); $('debugModeBtn').textContent=state.debug?'デバッグON':'デバッグOFF';
  $('heroStats').innerHTML = `攻撃力 ${s.atk}<br>防御力 ${s.def}<br>最大HP ${s.maxHp}<br>攻撃速度 ${Math.round(1000/s.interval*100)/100}/秒<br>撃破 ${state.kills}/${KILLS_TO_CLEAR}<br>特殊 ${specialText(s)}`;
  renderEquipped(); renderInventory(); renderMaterials(); renderUpgradeButton(); renderBarsOnly(); updateBulkSellPreview();
}
function specialText(s){ const a=[]; if(s.healOnAttack)a.push(`攻撃HP${s.healOnAttack}%`); if(s.nullify)a.push(`無効${s.nullify}%`); if(s.drain)a.push(`吸収${s.drain}%`); if(s.doubleHit)a.push(`追撃${s.doubleHit}%`); if(s.chestBonus)a.push(`宝箱+${s.chestBonus}%`); return a.join(' / ') || 'なし'; }
function renderEquipped(){
  const e=$('equipped'); e.innerHTML = Object.keys(SLOTS).map(slot=>{ const i=state.equipped[slot]; return `<button class="equip-card ${selectedEquipSlot===slot?'selected':''}" data-slot="${slot}"><div class="eq-title">${i?ICON[slot]:'□'} ${SLOTS[slot]}</div><div class="eq-name">${i?`${i.name} +${i.upgrade||0}`:'未装備'}</div><div class="eq-power">${i?`戦力 ${power(i)}`:'クリック不可'}</div></button>`; }).join('');
  e.querySelectorAll('.equip-card').forEach(el=>{ const slot=el.dataset.slot; el.onclick=()=>selectEquip(slot); el.onmouseenter=ev=>{ const i=state.equipped[slot]; if(i) showTip(i,ev.clientX,ev.clientY,true); }; el.onmousemove=ev=>{ if($('tooltip').classList.contains('show')) moveTip(ev.clientX,ev.clientY); }; el.onmouseleave=hideTip; });
}
function renderMaterials(){ $('materials').innerHTML = `<div><span>${MAT_NAME.weapon}</span><b>${state.materials.weapon}</b></div><div><span>${MAT_NAME.armor}</span><b>${state.materials.armor}</b></div><div><span>${MAT_NAME.ring}</span><b>${state.materials.ring}</b></div>`; }
function renderUpgradeButton(){ const b=$('upgradeBtn'), item=selectedEquipSlot && state.equipped[selectedEquipSlot]; if(!item){ b.disabled=true; b.textContent='装備を選択して強化'; b.onmouseenter=null; b.onmouseleave=null; return; } b.disabled=false; b.textContent=`${item.name} +${item.upgrade||0} を強化`; b.onmouseenter=e=>showUpgradeTip(item,e.clientX,e.clientY); b.onmousemove=e=>moveTip(e.clientX,e.clientY); b.onmouseleave=hideTip; }
function renderInventory(){
  const box=$('inventory'); box.innerHTML='';
  for(let n=0;n<50;n++){ const i=state.inventory[n], b=document.createElement('button'); b.className='slot '+(i?i.cls:'empty');
    if(i){ b.innerHTML=`<span>${ICON[i.slot]}</span><b>${power(i)}</b>`; b.onclick=e=>{e.stopPropagation(); equipItem(i.id);}; b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();showDetail(i,e.clientX,e.clientY);}; b.onmouseenter=e=>{ if(!$('itemDetail').classList.contains('show')) showTip(i,e.clientX,e.clientY); }; b.onmousemove=e=>{ if(!$('itemDetail').classList.contains('show')) moveTip(e.clientX,e.clientY); }; b.onmouseleave=hideTip; }
    box.appendChild(b);
  }
}
function statRows(i,eq){ const keys=[['atk','攻撃'],['def','防御'],['hp','HP'],['speed','速度'],['leech','吸収'],['reduce','軽減'],['crit','会心']]; const rows=keys.filter(([k])=>itemBonusValue(i,k)||(eq&&itemBonusValue(eq,k))).map(([k,l])=>{ const v=itemBonusValue(i,k), ev=eq?itemBonusValue(eq,k):0, d=v-ev, cls=d>=0?'tip-plus':'tip-minus'; return `<div class="tip-row"><span>${l}</span><b>${v} <em class="${cls}">(${d>=0?'+':''}${d})</em></b></div>`; }).join(''); return rows || '<div class="tip-row"><span>比較</span><b>なし</b></div>'; }
function propRows(i){ return (i.props||[]).map(p=>`<div class="tip-row prop"><span>特殊</span><b>${PROP_DEFS[p.key]?.desc(p.value)||`${p.key}+${p.value}`}</b></div>`).join('') + (i.skills||[]).map(sk=>`<div class="tip-row prop"><span>武器スキル</span><b>${WEAPON_SKILLS[sk.key]?.desc(sk.chance)||sk.key}</b></div>`).join(''); }
function tipHTML(i,eqOverride){ const eq = eqOverride===undefined ? state.equipped[i.slot] : eqOverride; const diff=power(i)-power(eq); return `<div class="tip-title">${ICON[i.slot]} ${i.name} +${i.upgrade||0}</div><div>${i.rarity} / ${SLOTS[i.slot]}</div>${statRows(i,eq)}${propRows(i)}<div class="tip-row"><span>現在装備</span><b>${eq?`${eq.name} +${eq.upgrade||0}`:'なし'}</b></div><div class="tip-row"><span>総合戦力差</span><b class="${diff>=0?'tip-plus':'tip-minus'}">${diff>=0?'+':''}${diff}</b></div>`; }
function showTip(i,x,y,noCompare=false){ const t=$('tooltip'); t.innerHTML=tipHTML(i, noCompare?null:undefined); t.classList.add('show'); moveTip(x,y); }
function showUpgradeTip(item,x,y){ const group=SLOT_GROUP[selectedEquipSlot], need=(item.upgrade||0)+1, before=clone(item), after=clone(item); after.upgrade=(after.upgrade||0)+1; const t=$('tooltip'); t.innerHTML = `<div class="tip-title">強化予定：${item.name} +${item.upgrade||0} → +${after.upgrade}</div>${statRows(after,before)}${propRows(after)}<div class="tip-row"><span>必要</span><b>${MAT_NAME[group]} ×${need}</b></div><div class="tip-row"><span>所持</span><b>${state.materials[group]}</b></div>`; t.classList.add('show'); moveTip(x,y); }
function showDetail(i,x,y){ hideTip(); const d=$('itemDetail'), sellGold=Math.max(5,power(i)*4); d.innerHTML = tipHTML(i) + `<div class="detail-actions"><button onclick="equipItem('${i.id}')">装備する</button><button onclick="sellItem('${i.id}')">売却 +${sellGold}</button><button onclick="hideDetail()">閉じる</button></div>`; d.classList.add('show'); moveDetail(x,y); }
function moveTip(x,y){ const t=$('tooltip'); t.style.left=Math.min(innerWidth-340,Math.max(8,x+16))+'px'; t.style.top=Math.min(innerHeight-240,Math.max(8,y-18))+'px'; }
function moveDetail(x,y){ const d=$('itemDetail'); d.style.left=Math.min(innerWidth-340,Math.max(8,x+12))+'px'; d.style.top=Math.min(innerHeight-300,Math.max(8,y+12))+'px'; }
function hideTip(){ $('tooltip').classList.remove('show'); }
function hideDetail(){ $('itemDetail').classList.remove('show'); }
function showSlash(type=''){ const e=$('slash'); e.className='slash'; if(type) e.classList.add(type); void e.offsetWidth; e.classList.add('show'); }
function showDamage(txt,type=''){ const e=$('damageText'); e.textContent=txt; e.className='damage-text'; if(type) e.classList.add(type); void e.offsetWidth; e.classList.add('show'); }
function showSkillName(txt){ const e=$('skillName'); if(!e)return; e.textContent=txt; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function flash(id){ const e=$(id); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
function pop(id){ const e=$(id); if(!e)return; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
function addLog(html){ const l=$('log'), d=document.createElement('div'); const tm=new Date().toLocaleTimeString('ja-JP',{hour12:false}); d.textContent = `[${tm}] ` + String(html).replace(/<[^>]+>/g,''); l.prepend(d); while(l.children.length>120) l.lastChild.remove(); }
function renderBarsOnly(){ const s=stats(); state.hp=Math.min(state.hp,s.maxHp); $('heroHpText').textContent=`${state.hp}/${s.maxHp}`; $('enemyHpText').textContent=`${Math.max(0,enemy.hp)}/${enemy.maxHp}`; $('expText').textContent=`${state.exp}/${expNeed()}`; $('heroHpBar').style.width=(state.hp/s.maxHp*100)+'%'; $('enemyHpBar').style.width=(Math.max(0,enemy.hp)/enemy.maxHp*100)+'%'; $('expBar').style.width=(Math.min(1,state.exp/expNeed())*100)+'%'; }
function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function play(type){ if(state.sound.muted || state.sound.volume<=0) return; try{ ensureAudio(); const map={hit:[250,.05],crit:[560,.08],win:[660,.09],boss:[170,.18],chest:[850,.12],open:[730,.14],drop:[980,.16],level:[1050,.22],equip:[430,.08],sell:[320,.06],heal:[620,.12],down:[120,.22]}; const [f,d]=map[type]||map.hit, now=audioCtx.currentTime, o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type==='down'?'sawtooth':'square'; o.frequency.setValueAtTime(f,now); o.frequency.exponentialRampToValueAtTime(Math.max(60,f*.55),now+d); g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(state.sound.volume*.12,now+.01); g.gain.exponentialRampToValueAtTime(.0001,now+d); o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now+d+.02); }catch(e){} }
function loop(now){ const s=stats(); if(!dying && !spawning && now-lastHeroAttack > s.interval){ heroAttack(); lastHeroAttack=now; } if(!dying && !spawning && now-lastEnemyAttack > 1300){ enemyAttack(); lastEnemyAttack=now; } if(now-lastSave>5000){ save(); lastSave=now; } renderBarsOnly(); requestAnimationFrame(loop); }
function reset(){ if(!confirm('本当にリセットする？'))return; localStorage.removeItem(SAVE_KEY); state=clone(defaultState); enemy=makeEnemy(); selectedEquipSlot=null; addLog('リセットした'); spawnEnemy(); refreshStageSelect(); renderAll(); }

$('openChestBtn').onclick=openChest; $('open10Btn').onclick=open10; $('bestEquipBtn').onclick=bestEquip; $('sortBtn').onclick=sortInventory; $('toggleBulkSellBtn').onclick=toggleBulkSell; $('bulkSellRunBtn').onclick=bulkSell; document.querySelectorAll('[data-sell-rarity]').forEach(x=>x.onchange=updateBulkSellPreview); $('debugModeBtn').onclick=toggleDebug; $('debugChestBtn').onclick=debugAddChests; $('upgradeBtn').onclick=upgradeSelected; $('healBtn').onclick=heal; $('saveBtn').onclick=()=>save(true); $('resetBtn').onclick=reset; $('goStage').onclick=changeStage;
$('muteBtn').onclick=()=>{ state.sound.muted=!state.sound.muted; renderAll(); save(); };
$('volume').oninput=e=>{ state.sound.volume=Number(e.target.value)/100; state.sound.muted=state.sound.volume===0; renderAll(); save(); };
window.addEventListener('pointerdown',ensureAudio,{once:true}); window.addEventListener('contextmenu',e=>e.preventDefault()); document.addEventListener('click',e=>{ if(!e.target.closest('.slot')&&!e.target.closest('#itemDetail')) hideDetail(); });
addLog('冒険開始！敵は左、英雄は右。自動で戦うよ。'); refreshStageSelect(); spawnEnemy(); renderAll(); requestAnimationFrame(loop);
