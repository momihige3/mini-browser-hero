'use strict';

document.addEventListener('contextmenu', e => e.preventDefault());

const $ = (id) => document.getElementById(id);
const els = {
  chests:$('chests'), mats:$('mats'), volumeSlider:$('volumeSlider'), muteBtn:$('muteBtn'), expLabel:$('expLabel'), expGainLabel:$('expGainLabel'), expFill:$('expFill'),
  enemyName:$('enemyName'), enemyLevel:$('enemyLevel'), enemyTag:$('enemyTag'), enemyImg:$('enemyImg'), enemyCard:$('enemyCard'), enemyHpFill:$('enemyHpFill'), enemyHpText:$('enemyHpText'),
  heroCard:$('heroCard'), heroHpFill:$('heroHpFill'), heroHpText:$('heroHpText'), heroLevel:$('heroLevel'), deathDanceStatus:$('deathDanceStatus'),
  enemyEffectLayer:$('enemyEffectLayer'), enemyFloats:$('enemyFloats'), levelEffect:$('levelEffect'), centerBanner:$('centerBanner'), dropToast:$('dropToast'), audioHint:$('audioHint'), deathAura:$('deathAura'), downOverlay:$('downOverlay'), downCount:$('downCount'),
  statLv:$('statLv'), statXp:$('statXp'), statXpNext:$('statXpNext'), statXpGain:$('statXpGain'), statAtk:$('statAtk'), statDef:$('statDef'), statFireRes:$('statFireRes'),
  equipList:$('equipList'), upgradeBtn:$('upgradeBtn'), inventory:$('inventory'), tooltip:$('tooltip'), log:$('log'),
  equipToggleBtn:$('equipToggleBtn'), sidePanel:document.querySelector('.side-panel'), volumeSlider:$('volumeSlider'), volumeText:$('volumeText'), debugBtn:$('debugBtn'), debugPanel:$('debugPanel'), debugAddChests:$('debugAddChests'), debugResetData:$('debugResetData'), debugBestSword:$('debugBestSword'), debugBestAccessory:$('debugBestAccessory'), debugKillEnemy:$('debugKillEnemy'), debugKillHero:$('debugKillHero'), debugClose:$('debugClose'), openAllBtn:$('openAllBtn'), bestEquipBtn:$('bestEquipBtn'), sellSelectedBtn:$('sellSelectedBtn'), sellNormalChk:$('sellNormalChk'), sellRareChk:$('sellRareChk'), sellLegendaryChk:$('sellLegendaryChk')
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
  {id:'normal', name:'ノーマル', mult:1, color:'#f2f2f2'},
  {id:'rare', name:'レア', mult:1.65, color:'#4fa2ff'},
  {id:'legendary', name:'レジェンダリー', mult:3.2, color:'#ffad31'},
];
const equipNames = {
  武器:['鉄の剣','雷の剣','炎の剣','黒鋼の剣'], 盾:['守りの盾','竜鱗の盾','炎除けの盾'], 兜:['革の兜','黒鉄の兜','火除けの兜'], 鎧:['旅人の鎧','騎士の鎧','炎耐性の鎧'], 腕:['革の手袋','鋼の腕甲','炎守りの腕甲'], 足:['革のブーツ','疾風のブーツ','竜鱗の靴'], リング:['銀のリング','生命のリング','火守りのリング'], アミュレット:['勇気の護符','不屈のアミュレット','剣舞の護符']
};

const state = {
  auto:true, selectedEquip:null, uiOpen:false, lastXpGain:0, volume:1.0,
  level:1, xp:0, xpNext:80, chests:0, mats:3, defeated:0,
  base:{hp:520, atk:48, def:14}, hp:520, enemy:null, enemyHp:1,
  inventory:[], equip:{}, down:false, downUntil:0, deathDance:false, deathDanceUntil:0, lastHeroAttack:0, lastEnemyAttack:0,
  log:[], debug:{killEnemy:false, killHero:false}, audio:null, masterGain:null, bgmGain:null, bgmTimer:null, audioUnlocked:false, mobileMuted:false, menuPage:'stats', inventoryMenuItemId:null
};

const SAVE_KEY = 'mini-browser-hero-save-v36';
let isResettingUserData = false;
let saveTimer = null;


function isMobileAudioMode(){
  return window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
}
function isCompactMenuMode(){
  return window.matchMedia('(max-width: 1279px), (max-height: 700px)').matches;
}
function updateMuteButton(){
  if(!els.muteBtn) return;
  const mobile = isMobileAudioMode();
  els.muteBtn.style.display = mobile ? 'inline-flex' : 'none';
  els.muteBtn.textContent = state.mobileMuted ? '🔇 ミュート' : '🔊 音ON';
  els.muteBtn.setAttribute('aria-pressed', state.mobileMuted ? 'true' : 'false');
  if(els.audioHint){
    els.audioHint.classList.add('hidden');
  }
}
function setMobileMuted(flag){
  state.mobileMuted = !!flag;
  applyVolume();
  updateMuteButton();
  scheduleSave();
}
function setMenuPage(page){
  state.menuPage = page || 'stats';
  const map = {stats:'.hero-stats', equip:'.equip-panel', inventory:'.inventory-panel', log:'.log-panel'};
  document.querySelectorAll('.mobile-menu-tabs button').forEach(btn=>btn.classList.toggle('active', btn.dataset.menuPage === state.menuPage));
  document.querySelectorAll('.side-panel .panel').forEach(p=>p.classList.remove('active-page'));
  const target = document.querySelector(map[state.menuPage] || map.stats);
  if(target) target.classList.add('active-page');
}
function syncCompactLayout(){
  updateMuteButton();
  setMenuPage(state.menuPage || 'stats');
  if(!isCompactMenuMode() && window.innerWidth >= 1280){
    state.uiOpen=false;
    els.sidePanel.classList.remove('open');
    els.equipToggleBtn.textContent='メニュー';
  }
}
function init(){
  // 初期状態は完全に空にする。
  // 以前はここで固定装備と倉庫アイテムを作っていたため、
  // ユーザーデータリセット後にも装備/倉庫が復活していた。
  slots.forEach(slot => state.equip[slot]=null);
  state.inventory = [];
  loadGame();
  if(isMobileAudioMode()) state.mobileMuted = true;
  bind();
  if(!isMobileAudioMode() || !state.mobileMuted) startAudio();
  state.lastHeroAttack = -999999;
  state.lastEnemyAttack = performance.now();
  spawnEnemy();
  renderAll();
  log('ゲーム開始。騎士が自動で戦闘を開始。');
  requestAnimationFrame(loop);
  setInterval(saveGame, 5000);
  window.addEventListener('beforeunload', saveGame);
}


function cleanItem(it){
  if(!it) return null;
  return {...it};
}
function serializeEquip(){
  const out={};
  slots.forEach(slot=>out[slot]=cleanItem(state.equip[slot]));
  return out;
}
function saveGame(){
  if(isResettingUserData) return;
  try{
    const data={
      version:41,
      level:state.level, xp:state.xp, xpNext:state.xpNext, lastXpGain:state.lastXpGain,
      chests:state.chests, mats:state.mats, defeated:state.defeated,
      hp:Math.max(1, Math.floor(state.hp||1)), base:state.base,
      inventory:state.inventory.map(cleanItem), equip:serializeEquip(), selectedEquip:state.selectedEquip,
      volume:state.volume, mobileMuted:state.mobileMuted, debug:state.debug,
      savedAt:Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }catch(e){ console.warn('save failed', e); }
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem('mini-browser-hero-save');
    if(!raw) return;
    const data=JSON.parse(raw);
    if(!data || typeof data!=='object') return;
    state.level = Number(data.level)||state.level;
    state.xp = Number(data.xp)||0;
    state.xpNext = Number(data.xpNext)||state.xpNext;
    state.lastXpGain = Number(data.lastXpGain)||0;
    state.chests = Number(data.chests)||0;
    state.mats = Number(data.mats)||0;
    state.defeated = Number(data.defeated)||0;
    if(data.base) state.base = {...state.base, ...data.base};
    state.inventory = Array.isArray(data.inventory) ? data.inventory.filter(Boolean) : state.inventory;
    if(data.equip){ slots.forEach(slot=>{ state.equip[slot] = data.equip[slot] || null; }); }
    state.selectedEquip = data.selectedEquip || null;
    state.volume = Math.min(2, Math.max(0, Number(data.volume ?? state.volume)));
    state.debug = {...state.debug, ...(data.debug||{})};
    if(typeof data.mobileMuted === 'boolean') state.mobileMuted = data.mobileMuted;
    state.hp = Math.min(Number(data.hp)||maxHp(), maxHp());
    if(state.hp<=0) state.hp=Math.floor(maxHp()*0.5);
    state.down=false; state.deathDance=false;
    console.info('save loaded');
  }catch(e){ console.warn('load failed', e); }
}
function clearGameStorage(){
  try{
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k && (k === SAVE_KEY || k === 'mini-browser-hero-save' || k.startsWith('mini-browser-hero-save') || k.startsWith('mini-browser-hero'))){
        keys.push(k);
      }
    }
    keys.forEach(k=>localStorage.removeItem(k));
  }catch(e){ console.warn('clear storage failed', e); }
}
function resetSave(){
  clearGameStorage();
}
function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveGame, 250);
}

function bind(){
  els.equipToggleBtn.onclick = () => {
    state.uiOpen=!state.uiOpen;
    els.sidePanel.classList.toggle('open', state.uiOpen);
    els.equipToggleBtn.textContent=state.uiOpen?'閉じる':'メニュー';
    startAudio();
  };
  if(els.volumeSlider){
    els.volumeSlider.value = Math.round(state.volume*100);
    if(els.volumeText) els.volumeText.textContent = `${Math.round(state.volume*100)}%`;
    els.volumeSlider.oninput = () => {
      state.volume = Number(els.volumeSlider.value)/100;
      if(els.volumeText) els.volumeText.textContent = `${Math.round(state.volume*100)}%`;
      applyVolume();
      scheduleSave();
      startAudio();
    };
  }
  // iPhone/Safari はユーザー操作の直後でないと音声が開始できない。
  // 画面タップ・音声ONボタン・各UI操作の全部から解除を試す。
  if(els.audioHint){
    els.audioHint.classList.add('hidden');
    els.audioHint.onclick = null;
  }
  const audioEvents = ['pointerdown','pointerup','click','touchstart','touchend','mousedown','keydown'];
  audioEvents.forEach(ev=>document.addEventListener(ev, () => { if(!isMobileAudioMode() || !state.mobileMuted) startAudio(); }, {passive:true}));
  document.addEventListener('click', (e) => {
    if(!els.inventory || els.inventory.contains(e.target)) return;
    state.inventoryMenuItemId = null;
    const menu = document.getElementById('inventoryActionMenu');
    if(menu) menu.remove();
  });
  setTimeout(()=>{ if(!isMobileAudioMode() || !state.mobileMuted) startAudio(); }, 300);
  els.debugBtn.onclick = () => { els.debugPanel.classList.toggle('hidden'); startAudio(); };
  if(els.muteBtn) els.muteBtn.onclick = (e) => { e.preventDefault(); setMobileMuted(!state.mobileMuted); if(!state.mobileMuted) startAudio(); };
  document.querySelectorAll('.mobile-menu-tabs button').forEach(btn=>btn.onclick=()=>setMenuPage(btn.dataset.menuPage));
  els.debugClose.onclick = () => els.debugPanel.classList.add('hidden');
  if(els.debugResetData) els.debugResetData.onclick = resetUserData;
  els.debugAddChests.onclick = () => { for(let i=0;i<50;i++) state.inventory.unshift(makeRandomItem()); renderAll(); log('デバッグ：装備を50個追加。','good'); scheduleSave(); };
  els.debugBestSword.onclick = () => { const it=makeDebugSword(); state.inventory.unshift(it); renderAll(); log('デバッグ：最強剣を倉庫に追加。','good'); scheduleSave(); };
  els.debugBestAccessory.onclick = () => { const a=makeDebugAccessory('リング'); const b=makeDebugAccessory('アミュレット'); state.inventory.unshift(a,b); renderAll(); log('デバッグ：最強アクセを倉庫に追加。','good'); scheduleSave(); };
  els.debugKillEnemy.onchange = () => { state.debug.killEnemy = els.debugKillEnemy.checked; log(`デバッグ：敵への攻撃で即死 ${state.debug.killEnemy?'ON':'OFF'}`, state.debug.killEnemy?'danger':''); scheduleSave(); };
  els.debugKillHero.onchange = () => { state.debug.killHero = els.debugKillHero.checked; log(`デバッグ：敵からの攻撃で即死 ${state.debug.killHero?'ON':'OFF'}`, state.debug.killHero?'danger':''); scheduleSave(); };

  if(els.openAllBtn) els.openAllBtn.style.display='none';
  els.bestEquipBtn.onclick = bestEquip;
  els.sellSelectedBtn.onclick = sellSelectedRarities;
  els.upgradeBtn.onclick = upgradeSelected;
  window.addEventListener('resize', syncMenuByWidth);
  syncMenuByWidth();
  setMenuPage(state.menuPage || 'stats');
  updateMuteButton();
}

function syncMenuByWidth(){
  syncCompactLayout();
}

function calcStats(){
  let s={
    hp:state.base.hp + (state.level-1)*45,
    atk:state.base.atk + (state.level-1)*8,
    def:state.base.def + (state.level-1)*4,
    fireRes:0, fireDmg:0, fireSkillChance:0, fireDamageHeal:0,
    thunderDmg:0, thunderSkillChance:0,
    deathDanceChance:.10, lifeSteal:0, guard:0, crit:.08
  };
  Object.values(state.equip).filter(Boolean).forEach(it=>{
    s.hp += it.hp||0; s.atk += it.atk||0; s.def += it.def||0;
    s.fireRes += it.fireRes||0; s.fireDmg += it.fireDmg||0; s.fireSkillChance += it.fireSkillChance||0;
    s.fireDamageHeal += it.fireDamageHeal||0;
    s.thunderDmg += it.thunderDmg||0; s.thunderSkillChance += it.thunderSkillChance||0;
    s.deathDanceChance += it.deathDanceChance||0;
    s.lifeSteal += it.lifeSteal||0; s.guard += it.guard||0; s.crit += it.crit||0;
  });
  s.fireRes=Math.min(.75,s.fireRes); s.fireDamageHeal=Math.min(1,s.fireDamageHeal);
  s.guard=Math.min(.45,s.guard); s.crit=Math.min(.55,s.crit); s.deathDanceChance=Math.min(1,s.deathDanceChance);
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
  const bossBonus = e.type==='ボス' ? 4 : 0;
  e.level = Math.max(1, state.level + Math.floor(state.defeated/3) + bossBonus);
  const scale=1 + e.level*.035 + Math.floor(state.defeated/10)*.03;
  e.maxHp=Math.floor(e.hp*scale); e.atk=Math.floor(e.atk*scale); e.def=Math.floor(e.def*scale);
  e.xp=Math.floor(e.xp*(1+e.level*.045));
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
    if(extra && Math.random() < (extra.chance + (extra.id==='fire'?calcStats().fireSkillChance:extra.id==='thunder'?calcStats().thunderSkillChance:0))){
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
  if(element==='fire') mult *= (1 + st.fireDmg);
  if(element==='thunder') mult *= (1 + st.thunderDmg);
  let dmg=Math.max(1, Math.floor((st.atk*mult + rand(0,st.atk*.45)) - state.enemy.def*.45));
  const crit=Math.random()<st.crit;
  if(crit) dmg=Math.floor(dmg*1.85);
  if(state.debug.killEnemy){ dmg = state.enemyHp; }
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
  if(state.enemyHp<=0){
    state.enemyHp = 0;
    renderBattle();
    setTimeout(enemyDefeated, 120);
    return;
  }
  renderBattle();
}
function enemyAttack(now){
  state.lastEnemyAttack=now;
  const e=state.enemy, st=calcStats();
  let element=e.element==='fire' && Math.random()<.55 ? 'fire':'normal';
  let name=e.enemySkill && element==='fire' ? e.enemySkill:'攻撃';
  if(Math.random()<st.guard){ showHeroFloat('GUARD','guard'); playSfx('guard'); log(`${e.name} の${name}をGUARD！`,'good'); return; }
  let dmg=Math.max(1, Math.floor(e.atk - st.def*.55 + rand(0,e.atk*.35)));
  if(state.debug.killHero){ dmg = Math.max(dmg, state.hp + 999999); }
  if(element==='fire') dmg=Math.floor(dmg*(1-st.fireRes));
  if(state.deathDance){ showHeroFloat('GUARD','guard'); return; }
  if(state.hp - dmg <= 0){
    if(Math.random()<st.deathDanceChance){ startDeathDance(); return; }
    state.hp=0; renderBattle(); startDown(); return;
  }
  state.hp=Math.max(0,state.hp-dmg);
  if(element==='fire' && st.fireDamageHeal){
    const heal=Math.floor(dmg*st.fireDamageHeal);
    if(heal>0){ state.hp=Math.min(maxHp(), state.hp+heal); showHeroFloat(`+${heal}`,'heal'); log(`炎属性被ダメ回復 +${heal}`,'good'); }
  }
  els.heroCard.classList.remove('hit'); void els.heroCard.offsetWidth; els.heroCard.classList.add('hit');
  setTimeout(()=>els.heroCard.classList.remove('hit'),220);
  showHeroFloat(dmg, element==='fire'?'fire':'damage'); playSfx('hit');
  log(`${e.name} の${name}！ ${dmg}ダメージ`, element==='fire'?'danger':'');
  renderBattle();
}
function enemyDefeated(){
  const e=state.enemy; state.enemy=null;
  els.enemyCard.classList.add('dead');
  state.defeated++;
  const xpMult = 1 + Math.max(0, (e.level || 1) - 1) * 0.08;
  const gainXp = Math.max(1, Math.floor(e.xp * xpMult));
  state.lastXpGain = gainXp; state.xp += gainXp;
  if(Math.random()<.38){ const it=makeRandomItem(); state.inventory.unshift(it); logItemDrop(it); showDropToast(it); }
  if(Math.random()<.22){ const m=randInt(1,3); state.mats += m; log(`強化石+${m} を獲得。`,'good'); }
  log(`${e.name} を撃破！ 経験値+${gainXp}`,'good'); playSfx('win');
  checkLevelUp(); renderAll(); scheduleSave();
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
  state.down=false; els.heroCard.classList.remove('down'); els.downOverlay.classList.add('hidden'); state.hp=maxHp(); renderBattle(); banner('復活'); log('騎士はHP100%で復活した。','good');
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
  const base = rarity.id==='legendary' ? .34 : rarity.id==='rare' ? .22 : .16;
  const list=[
    {id:'fire', name:'炎斬り', chance:base, element:'fire'},
    {id:'thunder', name:'雷撃', chance:base, element:'thunder'},
    {id:'multi', name:'連続攻撃', chance:base*.85, element:'physical'},
    {id:'heavy', name:'大攻撃', chance:base*.7, element:'physical'},
  ];
  return {...list[Math.floor(Math.random()*list.length)]};
}
function primeAudio(){
  // iOS Safari向け。無音を一瞬だけ流してAudioContextを完全に起こす。
  try{
    if(!state.audio || !state.masterGain) return;
    const ctx = state.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.00001;
    o.frequency.value = 440;
    o.connect(g);
    g.connect(state.masterGain);
    const t = ctx.currentTime || 0;
    o.start(t);
    o.stop(t + 0.03);
  }catch(e){}
}
function startAudio(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C){
      if(els.audioHint) els.audioHint.classList.add('hidden');
      return;
    }
    if(!state.audio){
      state.audio=new C();
      state.masterGain=state.audio.createGain();
      state.masterGain.connect(state.audio.destination);
      applyVolume();
    }
    const unlock = () => {
      primeAudio();
      state.audioUnlocked = state.audio && state.audio.state === 'running';
      if(els.audioHint) els.audioHint.classList.toggle('hidden', state.audioUnlocked);
      if(state.audioUnlocked){
        playBgm();
        playSfx('guard');
      }
    };
    if(state.audio.state==='suspended'){
      const p = state.audio.resume();
      if(p && typeof p.then==='function') p.then(unlock).catch(()=>{
        state.audioUnlocked = false;
        if(els.audioHint) els.audioHint.classList.remove('hidden');
      });
      else unlock();
    }else{
      unlock();
    }
  }catch(e){
    state.audioUnlocked = false;
    if(els.audioHint) els.audioHint.classList.remove('hidden');
    console.warn(e);
  }
}
function applyVolume(){
  if(state.masterGain) state.masterGain.gain.value = state.mobileMuted ? 0 : Math.max(0, Math.min(2, state.volume));
}
function tone(freq=440, dur=.08, type='sine', vol=.05){
  if(!state.audio || !state.masterGain) return;
  const ctx=state.audio, o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.value=freq; g.gain.value=0;
  o.connect(g); g.connect(state.masterGain);
  const t=ctx.currentTime;
  g.gain.linearRampToValueAtTime(vol,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.start(t); o.stop(t+dur+.02);
}
function playSfx(kind){
  if(!state.audioUnlocked) return;
  const map={slash:[640,.06,'triangle',.055],fire:[220,.14,'sawtooth',.055],thunder:[90,.09,'square',.04],heavy:[120,.18,'sawtooth',.06],hit:[180,.05,'square',.035],guard:[520,.08,'triangle',.045],win:[880,.12,'sine',.04],level:[660,.2,'triangle',.055],down:[110,.28,'sawtooth',.05],dance:[360,.22,'sawtooth',.06]};
  const a=map[kind]||map.slash; tone(...a);
  if(kind==='slash'||kind==='fire'||kind==='thunder'||kind==='dance') setTimeout(()=>tone(a[0]*1.42,a[1]*.8,a[2],a[3]*.65),55);
}
function playBgm(){
  if(!state.audio || state.bgmTimer) return;
  const seq=[196,246.94,293.66,246.94,220,261.63,329.63,293.66]; let i=0;
  state.bgmTimer=setInterval(()=>{ tone(seq[i++%seq.length],.28,'sine',.018); },360);
}


function makeRandomItem(){
  const slot=slots[Math.floor(Math.random()*slots.length)];
  const r=Math.random(); const rarity = r<.70?rarities[0]:r<.94?rarities[1]:rarities[2];
  return makeItem(slot, rarity);
}
function makeItem(slot, rarity){
  const lv=Math.max(1,state?.level||1);
  const name=(equipNames[slot]||[slot])[Math.floor(Math.random()*(equipNames[slot]||[slot]).length)];
  const m=rarity.mult;
  const it={id:crypto.randomUUID?.()||String(Math.random()), slot, rarity:rarity.id, rarityName:rarity.name, name, level:0, atk:0, def:0, hp:0, fireRes:0, fireDmg:0, fireSkillChance:0, fireDamageHeal:0, thunderDmg:0, thunderSkillChance:0, crit:0, lifeSteal:0, guard:0, deathDanceChance:0};
  if(slot==='武器'){
    it.atk=Math.floor((18+lv*4)*m);
    if(Math.random()<.35) it.crit=.03;
    if(Math.random()<.72) it.skill=randomWeaponSkill(rarity);
  } else if(slot==='リング'||slot==='アミュレット'){
    it.hp=Math.floor((55+lv*12)*m);
    if(Math.random()<.28) it.lifeSteal=.03;
    if(Math.random()<.22) it.guard=.03;
    if(rarity.id==='legendary') it.deathDanceChance=.50;
  } else {
    it.def=Math.floor((8+lv*3)*m);
    it.hp=Math.floor((25+lv*8)*m);
    if(Math.random()<.5) it.fireRes=+(Math.random()*.08+.02).toFixed(3);
    if(rarity.id==='legendary' && Math.random()<.45) it.fireDamageHeal=.50;
  }
  applyNameBonus(it);
  return it;
}

function applyNameBonus(it){
  if(it.name.includes('炎') || it.name.includes('火')){
    if(it.slot==='武器'){ it.fireDmg += .10; it.fireSkillChance += .05; if(it.skill?.id==='fire') it.skill.chance += .05; }
    else if(it.slot==='リング'||it.slot==='アミュレット'){ it.fireDmg += .15; it.fireSkillChance += .10; }
    else { it.fireRes += .10; if(Math.random()<.35) it.fireDamageHeal += .20; }
  }
  if(it.name.includes('雷')){
    if(it.slot==='武器'){ it.thunderDmg += .10; it.thunderSkillChance += .05; if(it.skill?.id==='thunder') it.skill.chance += .05; }
    else if(it.slot==='リング'||it.slot==='アミュレット'){ it.thunderDmg += .15; it.thunderSkillChance += .10; }
    else { it.thunderDmg += .05; it.thunderSkillChance += .05; }
  }
  if(it.name.includes('剣舞') || it.name.includes('不屈')){
    if(it.slot==='リング'||it.slot==='アミュレット') it.deathDanceChance += .25;
    else if(it.slot!=='武器') it.guard += .03;
  }
}

function itemPower(it){return (it.atk||0)*3 + (it.def||0)*2 + (it.hp||0)*.25 + (it.fireRes||0)*400 + (it.fireDmg||0)*420 + (it.thunderDmg||0)*420 + (it.fireDamageHeal||0)*550 + (it.deathDanceChance||0)*700 + (it.crit||0)*500 + (it.lifeSteal||0)*600 + (it.guard||0)*500 + it.level*15;}
function equipItem(it){
  state.inventoryMenuItemId = null;
  const actionMenu=document.getElementById('inventoryActionMenu'); if(actionMenu) actionMenu.remove();
  const idx=state.inventory.findIndex(x=>x.id===it.id); if(idx>=0) state.inventory.splice(idx,1);
  if(state.equip[it.slot]) state.inventory.unshift(state.equip[it.slot]);
  state.equip[it.slot]=it; state.hp=Math.min(state.hp,maxHp()); log(`${it.name} を装備。`,'good'); renderAll(); scheduleSave();
}
function bestEquip(){
  let changed=0;
  [...state.inventory].forEach(it=>{ if(!state.equip[it.slot] || itemPower(it)>itemPower(state.equip[it.slot])){ equipItem(it); changed++; } });
  log(`最強装備を一括装備（${changed}件）。`,'good'); renderAll();
}
function sellSelectedRarities(){
  const targets=[];
  if(els.sellNormalChk?.checked) targets.push('normal');
  if(els.sellRareChk?.checked) targets.push('rare');
  if(els.sellLegendaryChk?.checked) targets.push('legendary');
  if(targets.length===0){ log('売却対象のレアリティを選択して。','danger'); return; }

  const before=state.inventory.length;
  state.inventory = state.inventory.filter(it => !targets.includes(it.rarity));
  const sold = before - state.inventory.length;
  const label = targets.map(r => (rarities.find(x => x.id === r)?.name || r)).join('・');

  // v37.1: 売却直後に倉庫表示・ログ・保存を即時反映する。
  if(els.tooltip) els.tooltip.classList.add('hidden');
  log(`${label}装備を${sold}個売却。`, sold ? 'good' : '');
  renderAll();
  scheduleSave();
}
function openChests(n){
  const count=Math.min(n,state.chests); if(count<=0){log('宝箱がない。','danger');return;}
  for(let i=0;i<count;i++){ state.chests--; if(Math.random()<.55) state.inventory.unshift(makeRandomItem()); else state.mats+=randInt(1,3); }
  log(`宝箱を${count}個開封。`,'good'); renderAll(); scheduleSave();
}
function upgradeSelected(){
  const slot=state.selectedEquip; if(!slot || !state.equip[slot]) return;
  if(state.mats<=0){ log('強化石が足りない。','danger'); return; }
  const it=state.equip[slot]; state.mats--; it.level++; it.atk=Math.floor((it.atk||0)*1.08)+(it.slot==='武器'?3:0); it.def=Math.floor((it.def||0)*1.08)+(it.slot!=='武器'?2:0); it.hp=Math.floor((it.hp||0)*1.06); log(`${it.name} +${it.level} に強化。`,'good'); renderAll(); scheduleSave();
}


function makeDebugSword(){
  const it=makeItem('武器', rarities[2]);
  it.name='終焉の騎士剣'; it.atk=9999; it.crit=.50; it.lifeSteal=.10; it.fireDmg=.50; it.thunderDmg=.50; it.fireSkillChance=.50; it.thunderSkillChance=.50; it.skill={id:'multi', name:'連続攻撃', chance:.85, element:'physical'};
  return it;
}
function makeDebugAccessory(slot){
  const it=makeItem(slot, rarities[2]);
  it.name = slot==='リング' ? '死線のリング' : '死線のアミュレット';
  it.hp=9999; it.def=999; it.guard=.50; it.lifeSteal=.15; it.deathDanceChance=.50; it.fireDmg=.35; it.thunderDmg=.35; it.fireSkillChance=.25; it.thunderSkillChance=.25;
  return it;
}

function renderAll(){ renderBattle(); renderStats(); renderEquip(); renderInventory(); }
function renderBattle(){
  const mh=maxHp(); els.heroLevel.textContent=`Lv.${state.level}`; els.heroHpFill.style.width=`${Math.max(0,state.hp/mh*100)}%`; els.heroHpText.textContent=`${Math.floor(state.hp)} / ${Math.floor(mh)}`;
  if(state.enemy){ els.enemyName.textContent=state.enemy.name; if(els.enemyLevel) els.enemyLevel.textContent=`Lv.${state.enemy.level||1}`; els.enemyTag.textContent=state.enemy.type==='ボス'?'BOSS':''; els.enemyHpFill.style.width=`${Math.max(0,state.enemyHp/state.enemy.maxHp*100)}%`; els.enemyHpText.textContent=`${Math.floor(state.enemyHp)} / ${state.enemy.maxHp}`; }
  if(els.chests) els.chests.textContent=state.chests; els.mats.textContent=state.mats;
  if(els.expFill){ els.expFill.style.width=`${Math.max(0,Math.min(100,state.xp/state.xpNext*100))}%`; els.expLabel.textContent=`Lv.${state.level} EXP ${state.xp} / ${state.xpNext}`; els.expGainLabel.textContent=`+${state.lastXpGain}`; }
  if(state.deathDance){ els.deathDanceStatus.textContent = `死線の剣舞 残り${Math.max(0, Math.ceil((state.deathDanceUntil-performance.now())/1000))}秒`; }
}
function renderStats(){ const st=calcStats(); els.statLv.textContent=state.level; els.statXp.textContent=`${state.xp} / ${state.xpNext}`; els.statXpNext.textContent=state.xpNext; els.statXpGain.textContent=`+${state.lastXpGain}`; els.statAtk.textContent=Math.floor(st.atk); els.statDef.textContent=Math.floor(st.def); els.statFireRes.textContent=`${Math.round(st.fireRes*100)}%`; }
function renderEquip(){
  els.equipList.innerHTML='';
  slots.forEach(slot=>{ const it=state.equip[slot]; const div=document.createElement('div'); div.className='equip'+(it?` ${it.rarity}`:'')+(state.selectedEquip===slot?' selected':''); div.innerHTML=it?`<b>${slot}: ${it.name}+${it.level}</b><small>${itemSummary(it)}</small>`:`<b>${slot}: 未装備</b>`; div.onclick=()=>{state.selectedEquip=slot; renderEquip();}; if(it){ div.onmousemove=(e)=>showTip(e,it); div.onmouseleave=()=>els.tooltip.classList.add('hidden'); } els.equipList.appendChild(div); });
  const it=state.selectedEquip && state.equip[state.selectedEquip];
  els.upgradeBtn.disabled=!it || state.mats<=0;
  els.upgradeBtn.textContent=it?`${it.name}+${it.level} を強化`:'装備を選択して強化';
  els.upgradeBtn.classList.toggle('attention', !it && state.mats>0);
}
function renderInventory(){
  els.inventory.innerHTML='';
  const selectedId = state.inventoryMenuItemId;
  state.inventory.forEach(it=>{
    const div=document.createElement('div');
    div.className=`item ${it.rarity}${selectedId===it.id?' selected-inventory':''}`;
    div.innerHTML=`<b>${it.name}</b><span>${it.slot}</span>`;
    div.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); showInventoryActionMenu(it, div); };
    div.onmousemove=(e)=>showTip(e,it);
    div.onmouseleave=()=>{ if(state.inventoryMenuItemId!==it.id) els.tooltip.classList.add('hidden'); };
    els.inventory.appendChild(div);
    if(selectedId===it.id) setTimeout(()=>showInventoryActionMenu(it, div), 0);
  });
  if(els.openAllBtn){ els.openAllBtn.style.display='none'; }
}

function showInventoryActionMenu(it, anchor){
  state.inventoryMenuItemId = it.id;
  document.querySelectorAll('.item.selected-inventory').forEach(el=>el.classList.remove('selected-inventory'));
  if(anchor) anchor.classList.add('selected-inventory');
  let menu = document.getElementById('inventoryActionMenu');
  if(!menu){
    menu = document.createElement('div');
    menu.id = 'inventoryActionMenu';
    menu.className = 'inventory-action-menu';
    document.body.appendChild(menu);
  }
  const current=state.equip[it.slot];
  const diff=current ? Math.round(itemPower(it)-itemPower(current)) : 0;
  menu.innerHTML = `<div class="inventory-action-title"><b>${escapeHtml(it.name)}+${it.level}</b><small>${escapeHtml(it.slot)} / ${escapeHtml(it.rarityName||it.rarity)}</small></div><div class="inventory-action-summary">${escapeHtml(itemSummary(it)||'追加能力なし')}${current?`<br>現在: ${escapeHtml(current.name)}+${current.level} / 戦力差: ${diff>=0?'+':''}${diff}`:'<br>現在: 未装備'}</div><div class="inventory-action-buttons"><button type="button" data-action="equip">装備</button><button type="button" data-action="cancel">キャンセル</button></div>`;
  const r = anchor.getBoundingClientRect();
  const width = Math.min(300, window.innerWidth - 16);
  let left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
  let top = r.bottom + 6;
  menu.style.width = width + 'px';
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.classList.remove('hidden');
  requestAnimationFrame(()=>{
    const mr = menu.getBoundingClientRect();
    if(mr.bottom > window.innerHeight - 8){
      menu.style.top = Math.max(8, r.top - mr.height - 6) + 'px';
    }
  });
  menu.querySelector('[data-action="equip"]').onclick=(e)=>{ e.stopPropagation(); state.inventoryMenuItemId=null; menu.remove(); els.tooltip.classList.add('hidden'); equipItem(it); };
  menu.querySelector('[data-action="cancel"]').onclick=(e)=>{ e.stopPropagation(); state.inventoryMenuItemId=null; menu.remove(); els.tooltip.classList.add('hidden'); renderInventory(); };
}
function itemSummary(it){
  const arr=[];
  if(it.atk)arr.push(`攻+${it.atk}`); if(it.def)arr.push(`防+${it.def}`); if(it.hp)arr.push(`HP+${it.hp}`);
  if(it.fireRes)arr.push(`火軽減${Math.round(it.fireRes*100)}%`);
  if(it.fireDamageHeal)arr.push(`火被ダメ回復${Math.round(it.fireDamageHeal*100)}%`);
  if(it.fireDmg)arr.push(`火ダメ+${Math.round(it.fireDmg*100)}%`);
  if(it.fireSkillChance)arr.push(`炎斬り率+${Math.round(it.fireSkillChance*100)}%`);
  if(it.thunderDmg)arr.push(`雷ダメ+${Math.round(it.thunderDmg*100)}%`);
  if(it.thunderSkillChance)arr.push(`雷撃率+${Math.round(it.thunderSkillChance*100)}%`);
  if(it.deathDanceChance)arr.push(`死線の剣舞率+${Math.round(it.deathDanceChance*100)}%`);
  if(it.lifeSteal)arr.push(`吸収${Math.round(it.lifeSteal*100)}%`); if(it.guard)arr.push(`GUARD+${Math.round(it.guard*100)}%`); if(it.crit)arr.push(`会心+${Math.round(it.crit*100)}%`);
  if(it.skill)arr.push(`武器スキル:${it.skill.name} ${Math.round((it.skill.chance + (it.skill.id==='fire'?(it.fireSkillChance||0):it.skill.id==='thunder'?(it.thunderSkillChance||0):0))*100)}%`);
  return arr.join(' / ');
}

function showTip(e,it){
  const current=state.equip[it.slot]; let html=`<b style="color:#ffd76b">${it.name}+${it.level}</b><br>${it.slot} / ${it.rarityName}<br>${itemSummary(it)}<hr>`;
  html+= current ? `現在: ${current.name}+${current.level}<br>戦力差: ${Math.round(itemPower(it)-itemPower(current))}` : '現在: 未装備';
  els.tooltip.innerHTML=html; els.tooltip.style.left=(e.clientX+14)+'px'; els.tooltip.style.top=(e.clientY+14)+'px'; els.tooltip.classList.remove('hidden');
}

function escapeHtml(v){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function rarityColor(r){ return r==='legendary' ? '#ff9b24' : r==='rare' ? '#4d8dff' : '#eeeeee'; }
function logItemDrop(it){
  const color = rarityColor(it.rarity);
  const rarity = it.rarityName || (rarities.find(r=>r.id===it.rarity)?.name || it.rarity);
  log(`装備ドロップ：<span class="log-item ${it.rarity}" style="color:${color}">${escapeHtml(it.name)}</span> <span class="log-rarity ${it.rarity}" style="color:${color}">${escapeHtml(rarity)}</span>`, 'good', true);
}

function showDropToast(it){
  if(!els.dropToast) return;
  const color = rarityColor(it.rarity);
  const rarity = it.rarityName || (rarities.find(r=>r.id===it.rarity)?.name || it.rarity);
  els.dropToast.innerHTML = `<span style="color:${color}">${escapeHtml(it.name)}</span><small style="color:${color}">${escapeHtml(rarity)}</small>`;
  els.dropToast.className = `drop-toast ${it.rarity}`;
  clearTimeout(state.dropToastTimer);
  state.dropToastTimer = setTimeout(()=>els.dropToast.classList.add('hidden'), 3000);
}

function resetUserData(){
  if(!confirm('ユーザーデータをリセットする？')) return;
  isResettingUserData = true;
  clearTimeout(saveTimer);
  clearGameStorage();

  // URLは絶対に変更しない。ページ遷移もリロードもしない。
  // メモリ上の状態だけ初期化して、その場で新規ゲームとして再開する。
  slots.forEach(slot => state.equip[slot]=null);
  state.inventory = [];
  state.selectedEquip = null;
  state.level = 1;
  state.xp = 0;
  state.xpNext = 80;
  state.lastXpGain = 0;
  state.chests = 0;
  state.mats = 3;
  state.defeated = 0;
  state.base = {hp:520, atk:48, def:14};
  state.hp = maxHp();
  state.enemy = null;
  state.enemyHp = 1;
  state.down = false;
  state.downUntil = 0;
  state.deathDance = false;
  state.deathDanceUntil = 0;
  state.lastHeroAttack = -999999;
  state.lastEnemyAttack = performance.now();
  state.log = [];
  state.debug = {killEnemy:false, killHero:false};
  if(els.debugKillEnemy) els.debugKillEnemy.checked = false;
  if(els.debugKillHero) els.debugKillHero.checked = false;
  if(els.log) els.log.innerHTML='';
  if(els.tooltip) els.tooltip.classList.add('hidden');

  spawnEnemy();
  renderAll();
  log('ユーザーデータをリセットしました。');

  // 初期化後の空データを保存。以後の自動保存も再開。
  isResettingUserData = false;
  saveGame();
}
function log(msg, cls='', html=false){
  const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
  state.log.unshift({time,msg: html ? msg : escapeHtml(msg),cls,html:true});
  state.log=state.log.slice(0,100);
  if(els.log) els.log.innerHTML=state.log.map(l=>`<div class="${l.cls}">[${l.time}] ${l.msg}</div>`).join('');
}

function rand(a,b){ return Math.random()*(b-a)+a; }
function randInt(a,b){ return Math.floor(rand(a,b+1)); }

init();
