'use strict';

document.addEventListener('contextmenu', e => e.preventDefault());

const $ = (id) => document.getElementById(id);
const els = {
  chests:$('chests'), mats:$('mats'),
  enemyName:$('enemyName'), enemyTag:$('enemyTag'), enemyImg:$('enemyImg'), enemyCard:$('enemyCard'), enemyHpFill:$('enemyHpFill'), enemyHpText:$('enemyHpText'),
  heroCard:$('heroCard'), heroHpFill:$('heroHpFill'), heroHpText:$('heroHpText'), heroLevel:$('heroLevel'), deathDanceStatus:$('deathDanceStatus'),
  enemyEffectLayer:$('enemyEffectLayer'), enemyFloats:$('enemyFloats'), levelEffect:$('levelEffect'), centerBanner:$('centerBanner'), deathAura:$('deathAura'), downOverlay:$('downOverlay'), downCount:$('downCount'),
  statLv:$('statLv'), statXp:$('statXp'), statXpNext:$('statXpNext'), statXpGain:$('statXpGain'), statAtk:$('statAtk'), statDef:$('statDef'), statFireRes:$('statFireRes'), statThunderRes:$('statThunderRes'),
  equipList:$('equipList'), upgradeBtn:$('upgradeBtn'), inventory:$('inventory'), tooltip:$('tooltip'), log:$('log'),
  equipToggleBtn:$('equipToggleBtn'), sidePanel:document.querySelector('.side-panel'), muteBtn:$('muteBtn'), debugChestBtn:$('debugChestBtn'), openOneBtn:$('openOneBtn'), openTenBtn:$('openTenBtn'), bestEquipBtn:$('bestEquipBtn'), sellCommonBtn:$('sellCommonBtn')
};

const ENEMIES = [
  {id:'slime', name:'スライム', type:'雑魚', img:'assets/enemy_slime.jpg', element:'normal', hp:1200, atk:28, def:5, xp:22, gold:25, weight:'normal'},
  {id:'goblin', name:'ゴブリン', type:'雑魚', img:'assets/enemy_goblin.jpg', element:'normal', hp:980, atk:42, def:8, xp:26, gold:32, weight:'normal'},
  {id:'lizard', name:'リザード', type:'雑魚', img:'assets/enemy_lizard.jpg', element:'normal', hp:1450, atk:38, def:18, xp:32, gold:42, weight:'normal'},
  {id:'fire_spirit', name:'火の精霊', type:'雑魚', img:'assets/enemy_fire_spirit.jpg', element:'fire', hp:1100, atk:55, def:10, xp:38, gold:55, weight:'normal', fireAbsorb:true, enemySkill:'フレイム'},
  {id:'slime_king', name:'スライムキング', type:'ボス', img:'assets/enemy_slime_king.jpg', element:'normal', hp:5600, atk:75, def:30, xp:150, gold:220, bossChance:0.06},
  {id:'orc', name:'オーク', type:'ボス', img:'assets/enemy_orc.jpg', element:'normal', hp:7400, atk:115, def:35, xp:230, gold:360, bossChance:0.03},
  {id:'dragon', name:'ドラゴン', type:'ボス', img:'assets/enemy_dragon.jpg', element:'fire', hp:11800, atk:155, def:45, xp:480, gold:900, bossChance:0.005, fireResist:.5, enemySkill:'炎のブレス'},
  {id:'fire_king', name:'火の精霊王', type:'ボス', img:'assets/enemy_fire_king.jpg', element:'fire', hp:14500, atk:180, def:50, xp:620, gold:1200, bossChance:0.005, fireAbsorb:true, enemySkill:'フレイムテンペスト'},
];
const normals = ENEMIES.filter(e => e.weight === 'normal');
const bosses = ENEMIES.filter(e => e.type === 'ボス');

const slots = ['武器','盾','兜','鎧','腕','足','リング','アミュレット'];
const rarities = [
  {id:'common', name:'Common', mult:1, color:'#aaa'},
  {id:'rare', name:'Rare', mult:1.45, color:'#4fa2ff'},
  {id:'epic', name:'Epic', mult:2.1, color:'#be63ff'},
  {id:'legendary', name:'Legendary', mult:3.2, color:'#ffad31'},
];
const equipNames = {
  武器:['鉄の剣','雷の剣','炎の剣','黒鋼の剣'], 盾:['守りの盾','竜鱗の盾','炎除けの盾'], 兜:['革の兜','黒鉄の兜','火除けの兜'], 鎧:['旅人の鎧','騎士の鎧','炎耐性の鎧'], 腕:['革の手袋','鋼の腕甲','雷封じの腕甲'], 足:['革のブーツ','疾風のブーツ','竜鱗の靴'], リング:['銀のリング','生命のリング','火守りのリング'], アミュレット:['勇気の護符','不屈のアミュレット','雷避けの護符']
};

const state = {
  auto:true, muted:false, selectedEquip:null, uiOpen:false, lastXpGain:0,
  level:1, xp:0, xpNext:80, chests:8, mats:3,
  base:{hp:520, atk:48, def:14}, hp:520, enemy:null, enemyHp:1,
  inventory:[], equip:{}, down:false, downUntil:0, deathDance:false, deathDanceUntil:0, lastHeroAttack:0, lastEnemyAttack:0,
  log:[], audio:null, bgmTimer:null
};

function init(){
  slots.forEach(slot => state.equip[slot]=null);
  state.equip['武器'] = makeItem('武器', rarities[1]);
  state.equip['鎧'] = makeItem('鎧', rarities[0]);
  for(let i=0;i<10;i++) state.inventory.push(makeRandomItem());
  bind();
  spawnEnemy();
  renderAll();
  log('ゲーム開始。騎士が自動で戦闘を開始。');
  requestAnimationFrame(loop);
}

function bind(){
  els.equipToggleBtn.onclick = () => { state.uiOpen=!state.uiOpen; els.sidePanel.classList.toggle('open', state.uiOpen); els.equipToggleBtn.textContent=state.uiOpen?'閉じる':'装備'; startAudio(); };
  els.muteBtn.onclick = () => {state.muted=!state.muted; els.muteBtn.textContent=state.muted?'MUTE ON':'MUTE OFF'; if(!state.muted) startAudio();};
  document.addEventListener('pointerdown', startAudio, {once:true});
  els.debugChestBtn.onclick = () => {state.chests+=10; renderAll(); log('宝箱を10個追加した。','good')};
  els.openOneBtn.onclick = () => openChests(1);
  els.openTenBtn.onclick = () => openChests(10);
  els.bestEquipBtn.onclick = bestEquip;
  els.sellCommonBtn.onclick = sellCommon;
  els.upgradeBtn.onclick = upgradeSelected;
}

function calcStats(){
  let s={hp:state.base.hp + (state.level-1)*45, atk:state.base.atk + (state.level-1)*8, def:state.base.def + (state.level-1)*4, fireRes:0, thunderRes:0, lifeSteal:0, guard:0, crit:.08};
  Object.values(state.equip).filter(Boolean).forEach(it=>{
    s.hp += it.hp||0; s.atk += it.atk||0; s.def += it.def||0;
    s.fireRes += it.fireRes||0; s.thunderRes += it.thunderRes||0; s.lifeSteal += it.lifeSteal||0; s.guard += it.guard||0; s.crit += it.crit||0;
  });
  s.fireRes=Math.min(.75,s.fireRes); s.thunderRes=Math.min(.75,s.thunderRes); s.guard=Math.min(.45,s.guard); s.crit=Math.min(.55,s.crit);
  return s;
}
function maxHp(){return calcStats().hp}

function pickEnemy(){
  let r=Math.random(), acc=0;
  for(const b of bosses){ acc += b.bossChance; if(r < acc) return {...b}; }
  return {...normals[Math.floor(Math.random()*normals.length)]};
}
function spawnEnemy(){
  const e=pickEnemy();
  const scale=1+state.level*.025;
  e.maxHp=Math.floor(e.hp*scale); e.atk=Math.floor(e.atk*scale); e.def=Math.floor(e.def*scale);
  state.enemy=e; state.enemyHp=e.maxHp;
  els.enemyImg.src=e.img; els.enemyCard.className='card enemy-card enter';
  setTimeout(()=>els.enemyCard.classList.remove('enter'),600);
  renderBattle();
  log(`${e.name} が現れた。${e.type==='ボス'?'ボス出現！':''}`, e.type==='ボス'?'danger':'');
}

function loop(now){
  if(state.deathDance && now > state.deathDanceUntil) endDeathDance();
  if(state.down){
    const left=Math.max(0, Math.ceil((state.downUntil-now)/1000));
    els.downCount.textContent=left;
    if(now >= state.downUntil) revive();
    requestAnimationFrame(loop); return;
  }
  if(state.enemy){
    const interval = state.deathDance ? 360 : 1150;
    if(now - state.lastHeroAttack > interval){ heroAttack(now); }
    if(!state.deathDance && now - state.lastEnemyAttack > enemyInterval()){ enemyAttack(now); }
  }
  if(state.deathDance){
    const target=maxHp()*0.5;
    if(state.hp < target){ state.hp=Math.min(target, state.hp + maxHp()/600); renderBattle(); }
  }
  requestAnimationFrame(loop);
}
function enemyInterval(){ return state.enemy?.type==='ボス' ? 1350 : 1700; }

function heroAttack(now){
  state.lastHeroAttack=now;
  const skill = state.deathDance ? 'deathdance' : 'slash';
  els.heroCard.classList.remove('attack'); void els.heroCard.offsetWidth; els.heroCard.classList.add('attack');
  setTimeout(()=>els.heroCard.classList.remove('attack'),360);
  const hits = skill==='deathdance' ? 3 : 1;
  for(let i=0;i<hits;i++) setTimeout(()=>applyHeroHit(skill), i*120);
  if(!state.deathDance){
    const extra = getWeaponSkill();
    if(extra && Math.random() < extra.chance){
      setTimeout(()=>triggerWeaponSkill(extra), 180);
    }
  }
}

function getWeaponSkill(){
  const w=state.equip['武器'];
  return w && w.skill ? w.skill : null;
}
function triggerWeaponSkill(skill){
  log(`武器スキル「${skill.name}」発動！`, 'skilllog');
  if(skill.id==='multi'){
    for(let i=0;i<3;i++) setTimeout(()=>applyHeroHit('multi'), i*95);
    return;
  }
  applyHeroHit(skill.id);
}

function elementName(element){
  if(element==='fire') return '火';
  if(element==='thunder') return '雷';
  if(element==='physical') return '物理';
  return '通常';
}
function applyHeroHit(skill){
  if(!state.enemy) return;
  const st=calcStats(); let mult=1, element='physical', fx='slash', label='斬撃';
  // 属性仕様：通常斬撃/連続攻撃/大攻撃は物理。炎斬りは火、雷撃は雷。
  if(skill==='fire'){mult=1.45;element='fire';fx='fire';label='炎斬り'}
  if(skill==='thunder'){mult=1.35;element='thunder';fx='thunder';label='雷撃'}
  if(skill==='multi'){mult=.72;element='physical';fx='slash';label='連続攻撃'}
  if(skill==='heavy'){mult=2.25;element='physical';fx='heavy';label='大攻撃'}
  if(skill==='deathdance'){mult=0.95;element='physical';fx='slash';label='死線の剣舞'}
  let dmg=Math.max(1, Math.floor((st.atk*mult + rand(0,st.atk*.45)) - state.enemy.def*.45));
  const crit=Math.random()<st.crit;
  if(crit) dmg=Math.floor(dmg*1.85);
  let absorbed=false, resisted=false;
  if(element==='fire' && state.enemy.fireAbsorb){ state.enemyHp=Math.min(state.enemy.maxHp, state.enemyHp + dmg); absorbed=true; }
  else {
    if(element==='fire' && state.enemy.fireResist){dmg=Math.floor(dmg*(1-state.enemy.fireResist)); resisted=true;}
    state.enemyHp=Math.max(0, state.enemyHp - dmg);
  }
  showFx(fx); playSfx(skill==='fire'?'fire':skill==='thunder'?'thunder':skill==='heavy'?'heavy':'slash');
  // 炎斬り/雷撃は色違い斬撃1個だけ表示する。追加爆発・雷柱は出さない。
  if(skill==='heavy') { document.querySelector('.battle-panel')?.classList.add('shake'); setTimeout(()=>document.querySelector('.battle-panel')?.classList.remove('shake'),260); }
  if(absorbed){ showFloat(`吸収 +${dmg}`,'heal'); log(`${state.enemy.name} は火属性を吸収した！`,'danger'); }
  else { showFloat(`${crit?'CRIT! ':''}${dmg}${resisted?' 半減':''}`, crit?'crit':skill==='fire'?'fire':skill==='thunder'?'thunder':'damage'); }
  if(!absorbed){
    els.enemyCard.classList.remove('hit'); void els.enemyCard.offsetWidth; els.enemyCard.classList.add('hit');
    setTimeout(()=>els.enemyCard.classList.remove('hit'),220);
  }
  if(!absorbed && (skill==='fire'||skill==='thunder'||skill==='heavy'||skill==='deathdance')) log(`${label}（${elementName(element)}）！ ${dmg}ダメージ`, 'skilllog');
  if(st.lifeSteal && !absorbed){
    const heal=Math.floor(dmg*st.lifeSteal); if(heal>0){state.hp=Math.min(maxHp(),state.hp+heal); showHeroFloat(`+${heal}`,'heal')}
  }
  if(state.enemyHp<=0){ enemyDefeated(); }
  renderBattle();
}
function enemyAttack(now){
  state.lastEnemyAttack=now;
  const e=state.enemy, st=calcStats();
  let element=e.element==='fire' && Math.random()<.55 ? 'fire':'normal';
  let name=e.enemySkill && element==='fire' ? e.enemySkill:'攻撃';
  if(Math.random()<st.guard){ showHeroFloat('GUARD','guard'); playSfx('guard'); log(`${e.name} の${name}をGUARD！`,'good'); return; }
  let dmg=Math.max(1, Math.floor(e.atk - st.def*.55 + rand(0,e.atk*.35)));
  if(element==='fire') dmg=Math.floor(dmg*(1-st.fireRes));
  if(state.deathDance){ showHeroFloat('GUARD','guard'); return; }
  if(state.hp - dmg <= 0){
    if(Math.random()<.10){ startDeathDance(); return; }
    state.hp=0; renderBattle(); startDown(); return;
  }
  state.hp=Math.max(0,state.hp-dmg);
  els.heroCard.classList.remove('hit'); void els.heroCard.offsetWidth; els.heroCard.classList.add('hit');
  setTimeout(()=>els.heroCard.classList.remove('hit'),220);
  showHeroFloat(dmg, element==='fire'?'fire':'damage'); playSfx('hit');
  log(`${e.name} の${name}！ ${dmg}ダメージ`, element==='fire'?'danger':'');
  renderBattle();
}
function enemyDefeated(){
  const e=state.enemy; state.enemy=null;
  els.enemyCard.classList.add('dead');
  const gainXp=e.xp;
  state.lastXpGain = gainXp; state.xp += gainXp; if(Math.random()<.33) state.chests++;
  if(Math.random()<.18){ const it=makeRandomItem(); state.inventory.unshift(it); log(`${it.name} を獲得。`,'good'); }
  log(`${e.name} を撃破！ 経験値+${gainXp}`,'good'); playSfx('win');
  checkLevelUp(); renderAll();
  setTimeout(spawnEnemy,850);
}
function checkLevelUp(){
  while(state.xp>=state.xpNext){ state.xp-=state.xpNext; state.level++; state.xpNext=Math.floor(state.xpNext*1.42+40); state.hp=maxHp(); showLevelUp(); log(`LEVEL UP！ Lv.${state.level}`,'good'); }
}
function showLevelUp(){ els.levelEffect.classList.remove('hidden'); playSfx('level'); setTimeout(()=>els.levelEffect.classList.add('hidden'),1150); }
function startDown(){
  state.down=true; state.downUntil=performance.now()+5000; els.heroCard.classList.add('down'); els.downOverlay.classList.remove('hidden');
  banner('DOWN...'); playSfx('down'); log('騎士は倒れた。5秒後に復活。','danger');
}
function revive(){
  state.down=false; els.heroCard.classList.remove('down'); els.downOverlay.classList.add('hidden'); state.hp=Math.floor(maxHp()*0.5); renderBattle(); banner('復活'); log('騎士はHP50%で復活した。','good');
}
function startDeathDance(){
  state.deathDance=true; state.deathDanceUntil=performance.now()+10000; state.hp=1; els.heroCard.classList.add('deathdance'); els.deathAura.classList.remove('hidden'); els.deathDanceStatus.classList.remove('hidden'); banner('死線の剣舞！'); playSfx('dance'); log('死線の剣舞発動！ 10秒間無敵で連撃。','skilllog'); renderBattle();
}
function endDeathDance(){
  state.deathDance=false; els.heroCard.classList.remove('deathdance'); els.deathAura.classList.add('hidden'); els.deathDanceStatus.classList.add('hidden'); banner('死線の剣舞 終了'); log('死線の剣舞が終了。','skilllog');
}

function showFx(type){
  const div=document.createElement('div'); div.className=`effect ${type}`; els.enemyEffectLayer.appendChild(div); setTimeout(()=>div.remove(),520);
}
function showFloat(text, cls='damage'){
  const div=document.createElement('div'); div.className=`float ${cls}`; div.textContent=text; els.enemyFloats.appendChild(div); setTimeout(()=>div.remove(),950);
}
function showHeroFloat(text, cls='damage'){
  const layer=els.heroCard.querySelector('.float-layer') || (()=>{const l=document.createElement('div'); l.className='float-layer'; els.heroCard.appendChild(l); return l;})();
  const div=document.createElement('div'); div.className=`float ${cls}`; div.textContent=text; layer.appendChild(div); setTimeout(()=>div.remove(),950);
}
function banner(text){ els.centerBanner.textContent=text; els.centerBanner.classList.remove('hidden'); setTimeout(()=>els.centerBanner.classList.add('hidden'),950); }


function randomWeaponSkill(rarity){
  const base = rarity.id==='legendary' ? .34 : rarity.id==='epic' ? .27 : rarity.id==='rare' ? .21 : .16;
  const list=[
    {id:'fire', name:'炎斬り', chance:base, element:'fire'},
    {id:'thunder', name:'雷撃', chance:base, element:'thunder'},
    {id:'multi', name:'連続攻撃', chance:base*.85, element:'physical'},
    {id:'heavy', name:'大攻撃', chance:base*.7, element:'physical'},
  ];
  return {...list[Math.floor(Math.random()*list.length)]};
}
function startAudio(){
  if(state.muted) return;
  try{
    if(state.audio){ if(state.audio.state==='suspended') state.audio.resume(); playBgm(); return; }
    const C=window.AudioContext||window.webkitAudioContext;
    state.audio=new C();
    if(state.audio.state==='suspended') state.audio.resume();
    playBgm();
  }catch(e){ console.warn(e); }
}
function tone(freq=440, dur=.08, type='sine', vol=.05){
  if(state.muted || !state.audio) return;
  const ctx=state.audio, o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.value=freq; g.gain.value=0;
  o.connect(g); g.connect(ctx.destination);
  const t=ctx.currentTime;
  g.gain.linearRampToValueAtTime(vol,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.start(t); o.stop(t+dur+.02);
}
function playSfx(kind){
  if(state.muted) return;
  startAudio();
  const map={slash:[640,.06,'triangle',.055],fire:[220,.14,'sawtooth',.055],thunder:[90,.09,'square',.04],heavy:[120,.18,'sawtooth',.06],hit:[180,.05,'square',.035],guard:[520,.08,'triangle',.045],win:[880,.12,'sine',.04],level:[660,.2,'triangle',.055],down:[110,.28,'sawtooth',.05],dance:[360,.22,'sawtooth',.06]};
  const a=map[kind]||map.slash; tone(...a);
  if(kind==='slash'||kind==='fire'||kind==='thunder'||kind==='dance') setTimeout(()=>tone(a[0]*1.42,a[1]*.8,a[2],a[3]*.65),55);
}
function playBgm(){
  if(state.muted || !state.audio || state.bgmTimer) return;
  const seq=[196,246.94,293.66,246.94,220,261.63,329.63,293.66]; let i=0;
  state.bgmTimer=setInterval(()=>{ if(!state.muted) tone(seq[i++%seq.length],.28,'sine',.018); },360);
}

function makeRandomItem(){
  const slot=slots[Math.floor(Math.random()*slots.length)];
  const r=Math.random(); const rarity = r<.62?rarities[0]:r<.84?rarities[1]:r<.96?rarities[2]:rarities[3];
  return makeItem(slot, rarity);
}
function makeItem(slot, rarity){
  const lv=Math.max(1,state?.level||1); const name=(equipNames[slot]||[slot])[Math.floor(Math.random()*(equipNames[slot]||[slot]).length)];
  const m=rarity.mult, it={id:crypto.randomUUID?.()||String(Math.random()), slot, rarity:rarity.id, rarityName:rarity.name, name, level:0, atk:0, def:0, hp:0, fireRes:0, thunderRes:0, crit:0, lifeSteal:0, guard:0};
  if(slot==='武器'){ it.atk=Math.floor((18+lv*4)*m); if(Math.random()<.35) it.crit=.03; if(Math.random()<.72) it.skill=randomWeaponSkill(rarity); }
  else if(slot==='リング'||slot==='アミュレット'){ it.hp=Math.floor((55+lv*12)*m); if(Math.random()<.28) it.lifeSteal=.03; if(Math.random()<.22) it.guard=.03; }
  else { it.def=Math.floor((8+lv*3)*m); it.hp=Math.floor((25+lv*8)*m); if(Math.random()<.5) it.fireRes=+(Math.random()*.08+.02).toFixed(3); if(Math.random()<.35) it.thunderRes=+(Math.random()*.07+.015).toFixed(3); }
  return it;
}
function itemPower(it){return (it.atk||0)*3 + (it.def||0)*2 + (it.hp||0)*.25 + (it.fireRes||0)*400 + (it.thunderRes||0)*350 + (it.crit||0)*500 + (it.lifeSteal||0)*600 + (it.guard||0)*500 + it.level*15;}
function equipItem(it){
  const idx=state.inventory.findIndex(x=>x.id===it.id); if(idx>=0) state.inventory.splice(idx,1);
  if(state.equip[it.slot]) state.inventory.unshift(state.equip[it.slot]);
  state.equip[it.slot]=it; state.hp=Math.min(state.hp,maxHp()); log(`${it.name} を装備。`,'good'); renderAll();
}
function bestEquip(){
  let changed=0;
  [...state.inventory].forEach(it=>{ if(!state.equip[it.slot] || itemPower(it)>itemPower(state.equip[it.slot])){ equipItem(it); changed++; } });
  log(`最強装備を一括装備（${changed}件）。`,'good'); renderAll();
}
function sellCommon(){ const before=state.inventory.length; state.inventory=state.inventory.filter(it=>it.rarity!=='common'); log(`Common装備を${before-state.inventory.length}個売却。`); renderAll(); }
function openChests(n){
  const count=Math.min(n,state.chests); if(count<=0){log('宝箱がない。','danger');return;}
  for(let i=0;i<count;i++){ state.chests--; if(Math.random()<.55) state.inventory.unshift(makeRandomItem()); else state.mats+=randInt(1,3); }
  log(`宝箱を${count}個開封。`,'good'); renderAll();
}
function upgradeSelected(){
  const slot=state.selectedEquip; if(!slot || !state.equip[slot]) return;
  if(state.mats<=0){ log('強化石が足りない。','danger'); return; }
  const it=state.equip[slot]; state.mats--; it.level++; it.atk=Math.floor((it.atk||0)*1.08)+(it.slot==='武器'?3:0); it.def=Math.floor((it.def||0)*1.08)+(it.slot!=='武器'?2:0); it.hp=Math.floor((it.hp||0)*1.06); log(`${it.name} +${it.level} に強化。`,'good'); renderAll();
}

function renderAll(){ renderBattle(); renderStats(); renderEquip(); renderInventory(); }
function renderBattle(){
  const mh=maxHp(); els.heroLevel.textContent=`Lv.${state.level}`; els.heroHpFill.style.width=`${Math.max(0,state.hp/mh*100)}%`; els.heroHpText.textContent=`${Math.floor(state.hp)} / ${Math.floor(mh)}`;
  if(state.enemy){ els.enemyName.textContent=state.enemy.name; els.enemyTag.textContent=state.enemy.type==='ボス'?'BOSS':''; els.enemyHpFill.style.width=`${Math.max(0,state.enemyHp/state.enemy.maxHp*100)}%`; els.enemyHpText.textContent=`${Math.floor(state.enemyHp)} / ${state.enemy.maxHp}`; }
  els.chests.textContent=state.chests; els.mats.textContent=state.mats;
  if(state.deathDance){ els.deathDanceStatus.textContent = `死線の剣舞 残り${Math.max(0, Math.ceil((state.deathDanceUntil-performance.now())/1000))}秒`; }
}
function renderStats(){ const st=calcStats(); els.statLv.textContent=state.level; els.statXp.textContent=`${state.xp} / ${state.xpNext}`; els.statXpNext.textContent=state.xpNext; els.statXpGain.textContent=`+${state.lastXpGain}`; els.statAtk.textContent=Math.floor(st.atk); els.statDef.textContent=Math.floor(st.def); els.statFireRes.textContent=`${Math.round(st.fireRes*100)}%`; els.statThunderRes.textContent=`${Math.round(st.thunderRes*100)}%`; }
function renderEquip(){
  els.equipList.innerHTML='';
  slots.forEach(slot=>{ const it=state.equip[slot]; const div=document.createElement('div'); div.className='equip'+(state.selectedEquip===slot?' selected':''); div.innerHTML=it?`<b>${slot}: ${it.name}+${it.level}</b><small>${itemSummary(it)}</small>`:`<b>${slot}: 未装備</b>`; div.onclick=()=>{state.selectedEquip=slot; renderEquip();}; els.equipList.appendChild(div); });
  const it=state.selectedEquip && state.equip[state.selectedEquip]; els.upgradeBtn.disabled=!it; els.upgradeBtn.textContent=it?`${it.name}+${it.level} を強化`:'装備を選択して強化';
}
function renderInventory(){
  els.inventory.innerHTML='';
  state.inventory.slice(0,30).forEach(it=>{ const div=document.createElement('div'); div.className=`item ${it.rarity}`; div.innerHTML=`<b>${it.name}</b><br><span>${it.slot} ${it.rarityName}</span>`; div.onclick=()=>equipItem(it); div.onmousemove=(e)=>showTip(e,it); div.onmouseleave=()=>els.tooltip.classList.add('hidden'); els.inventory.appendChild(div); });
}
function itemSummary(it){
  const arr=[]; if(it.atk)arr.push(`攻+${it.atk}`); if(it.def)arr.push(`防+${it.def}`); if(it.hp)arr.push(`HP+${it.hp}`); if(it.fireRes)arr.push(`火軽減${Math.round(it.fireRes*100)}%`); if(it.thunderRes)arr.push(`雷軽減${Math.round(it.thunderRes*100)}%`); if(it.lifeSteal)arr.push(`吸収${Math.round(it.lifeSteal*100)}%`); if(it.guard)arr.push(`GUARD+${Math.round(it.guard*100)}%`); if(it.crit)arr.push(`会心+${Math.round(it.crit*100)}%`); if(it.skill)arr.push(`武器スキル:${it.skill.name} ${Math.round(it.skill.chance*100)}%`); return arr.join(' / ');
}
function showTip(e,it){
  const current=state.equip[it.slot]; let html=`<b style="color:#ffd76b">${it.name}+${it.level}</b><br>${it.slot} / ${it.rarityName}<br>${itemSummary(it)}<hr>`;
  html+= current ? `現在: ${current.name}+${current.level}<br>戦力差: ${Math.round(itemPower(it)-itemPower(current))}` : '現在: 未装備';
  els.tooltip.innerHTML=html; els.tooltip.style.left=(e.clientX+14)+'px'; els.tooltip.style.top=(e.clientY+14)+'px'; els.tooltip.classList.remove('hidden');
}
function log(msg, cls=''){ const time=new Date().toLocaleTimeString('ja-JP',{hour12:false}); state.log.unshift({time,msg,cls}); state.log=state.log.slice(0,80); els.log.innerHTML=state.log.map(l=>`<div class="${l.cls}">[${l.time}] ${l.msg}</div>`).join(''); }
function rand(a,b){ return Math.random()*(b-a)+a; }
function randInt(a,b){ return Math.floor(rand(a,b+1)); }

init();
