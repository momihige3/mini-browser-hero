'use strict';

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('click', e => { if(!e.target.closest?.('.status-badge')) hideStatusTooltip(); });

const $ = (id) => document.getElementById(id);
const els = {
  battleBg:document.querySelector('.battle-bg'),
  chests:$('chests'), mats:$('mats'), volumeSlider:$('volumeSlider'), muteBtn:$('muteBtn'), expLabel:$('expLabel'), expGainLabel:$('expGainLabel'), expFill:$('expFill'),
  enemyName:$('enemyName'), enemyLevel:$('enemyLevel'), enemyTag:$('enemyTag'), enemyImg:$('enemyImg'), enemyCard:$('enemyCard'), enemyHpFill:$('enemyHpFill'), enemyHpText:$('enemyHpText'),
  heroCard:$('heroCard'), heroHpFill:$('heroHpFill'), heroHpText:$('heroHpText'), heroLevel:$('heroLevel'), deathDanceStatus:$('deathDanceStatus'), heroStatusList:$('heroStatusList'), enemyStatusList:$('enemyStatusList'),
  enemyEffectLayer:$('enemyEffectLayer'), enemyFloats:$('enemyFloats'), levelEffect:$('levelEffect'), centerBanner:$('centerBanner'), dropToast:$('dropToast'), audioHint:$('audioHint'), deathAura:$('deathAura'), downOverlay:$('downOverlay'), downCount:$('downCount'),
  statLv:$('statLv'), statXp:$('statXp'), statXpNext:$('statXpNext'), statXpGain:$('statXpGain'), statAtk:$('statAtk'), statDef:$('statDef'), statFireRes:$('statFireRes'), monsterRecords:$('monsterRecords'),
  equipList:$('equipList'), upgradeBtn:$('upgradeBtn'), inventory:$('inventory'), tooltip:$('tooltip'), log:$('log'),
  equipToggleBtn:$('equipToggleBtn'), sidePanel:document.querySelector('.side-panel'), volumeSlider:$('volumeSlider'), volumeText:$('volumeText'), debugBtn:$('debugBtn'), debugPanel:$('debugPanel'), debugAddChests:$('debugAddChests'), debugResetData:$('debugResetData'), debugBestSword:$('debugBestSword'), debugBestAccessory:$('debugBestAccessory'), debugKillEnemy:$('debugKillEnemy'), debugKillHero:$('debugKillHero'), debugDarkSwordSaint:$('debugDarkSwordSaint'), debugClose:$('debugClose'), openAllBtn:$('openAllBtn'), bestEquipBtn:$('bestEquipBtn'), sellSelectedBtn:$('sellSelectedBtn'), sellNormalChk:$('sellNormalChk'), sellRareChk:$('sellRareChk'), sellLegendaryChk:$('sellLegendaryChk'), creditBtn:$('creditBtn'), termsBtn:$('termsBtn'), privacyBtn:$('privacyBtn'), legalModal:$('legalModal'), legalModalTitle:$('legalModalTitle'), legalModalBody:$('legalModalBody'), legalModalClose:$('legalModalClose'), deathDanceCutin:$('deathDanceCutin'), deathDanceCutinImg:$('deathDanceCutinImg'), deathDanceCutinQuote:$('deathDanceCutinQuote'), deathDanceCutinTitle:document.querySelector('.death-dance-cutin-title')
};


const BATTLE_BACKGROUNDS = [
  {id:'forest', name:'草原遺跡', src:'assets/bg_forest_ruins.jpg'},
  {id:'city', name:'市街地', src:'assets/bg_city.jpg'},
  {id:'desert', name:'砂漠', src:'assets/bg_desert.jpg'},
  {id:'volcano', name:'火山地帯', src:'assets/bg_volcano.jpg'},
  {id:'meteor_hill', name:'流星の丘', src:'assets/bg_meteor_hill.jpg'},
];
let currentBattleBgId = '';
let battleBgTimer = null;

const DEATH_DANCE_CUTINS = [
  {quote:'負けるわけにはいかない！', img:'assets/cutin_eye_1.jpg'},
  {quote:'諦めるには･･････まだ早い！', img:'assets/cutin_eye_2.jpg'},
  {quote:'最後の悪あがきをくらえ！', img:'assets/cutin_eye_3.jpg'},
  {quote:'剣の舞、受けてみろ！', img:'assets/cutin_eye_4.jpg'},
  {quote:'俺は･･････強い！！！', img:'assets/cutin_eye_5.jpg'},
];
const DARK_SWORD_SAINT_CUTIN = {quote:'私を超えてみせろ。', img:'assets/cutin_dark_sword_dance.png'};
const DARK_SWORD_TECHNIQUE_CUTIN = {quote:'', img:'assets/cutin_dark_sword_technique.png'};
const GAME_VERSION = (window.MINI_BROWSER_HERO_LATEST_VERSION || window.MINI_BROWSER_HERO_BUILD_VERSION || document.documentElement.dataset.buildVersion || '99.6');
window.GAME_VERSION = GAME_VERSION;
window.MINI_BROWSER_HERO_LATEST_VERSION = GAME_VERSION;
const DARK_SWORD_SAINT = {
  id:'dark_sword_saint', name:'暗黒剣聖', type:'裏ボス', img:'assets/enemy_dark_sword_saint.png', element:'dark',
  hp:32000, atk:260, def:95, xp:2600, gold:5000, bossChance:0, enemySkill:'暗黒斬'
};

const ENEMIES = [
  {id:'slime', name:'スライム', type:'雑魚', img:'assets/enemy_slime.jpg', element:'normal', hp:1200, atk:28, def:5, xp:22, gold:25, weight:'normal'},
  {id:'goblin', name:'ゴブリン', type:'雑魚', img:'assets/enemy_goblin.jpg', element:'normal', hp:980, atk:42, def:8, xp:26, gold:32, weight:'normal'},
  {id:'lizard', name:'リザード', type:'雑魚', img:'assets/enemy_lizard.jpg', element:'normal', hp:1450, atk:38, def:18, xp:32, gold:42, weight:'normal'},
  {id:'fire_spirit', name:'火の精霊', type:'雑魚', img:'assets/enemy_fire_spirit.jpg', element:'fire', hp:1100, atk:55, def:10, xp:38, gold:55, weight:'normal', fireAbsorb:true, enemySkill:'フレイム'},
  {id:'slime_king', name:'スライムキング', type:'ボス', img:'assets/enemy_slime_king.jpg', element:'normal', hp:5600, atk:75, def:30, xp:150, gold:220, bossChance:0.06, bossBuff:'acid_body'},
  {id:'orc', name:'オーク', type:'ボス', img:'assets/enemy_orc.jpg', element:'normal', hp:7400, atk:115, def:35, xp:230, gold:360, bossChance:0.03, bossBuff:'super_regen'},
  {id:'dragon', name:'ドラゴン', type:'ボス', img:'assets/enemy_dragon.jpg', element:'fire', hp:11800, atk:155, def:45, xp:480, gold:900, bossChance:0.005, fireResist:.5, enemySkill:'炎のブレス', bossBuff:'apex'},
  {id:'fire_king', name:'火の精霊王', type:'ボス', img:'assets/enemy_fire_king.jpg', element:'fire', hp:14500, atk:180, def:50, xp:620, gold:1200, bossChance:0.005, fireAbsorb:true, enemySkill:'フレイムテンペスト', bossBuff:'spirit_king'},
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
  inventory:[], equip:{}, down:false, downUntil:0, deathDance:false, deathDanceUntil:0, deathDanceBattleCount:0, deathDanceCutin:false, deathDanceCutinTimer:null, deathDanceSeqTimers:[], lastHeroAttack:0, lastEnemyAttack:0,
  log:[], debug:{killEnemy:false, killHero:false}, audio:null, masterGain:null, bgmGain:null, bgmTimer:null, bgmMode:'normal', normalBgm:null, swordDanceBgm:null, darkSwordSaintBgm:null, darkSwordSaintVoice:null, darkSwordReviveTimer:null, darkSwordComboTimers:[], darkSwordCutinActive:false, audioUnlocked:false, mobileMuted:true, menuPage:'stats', inventoryMenuItemId:null, enemyRecords:{}, forceFirstEnemy:false, bgmPausedByVisibility:false, heroStatuses:null, enemyStatuses:null, darkShieldStacks:0, dropToastTimer:null, dropToastQueueTimers:[], winStreak:0, bestWinStreak:0, forceNextDarkSwordSaint:false, darkSwordSaintLevel:1, darkSwordSaintKills:0
};

const SAVE_KEY = 'mini-browser-hero-save-v36';
let isResettingUserData = false;
let saveTimer = null;



function switchRandomBattleBackground(initial=false){
  if(!els.battleBg || !BATTLE_BACKGROUNDS.length) return;
  let candidates = BATTLE_BACKGROUNDS;
  if(BATTLE_BACKGROUNDS.length > 1 && currentBattleBgId){
    candidates = BATTLE_BACKGROUNDS.filter(bg => bg.id !== currentBattleBgId);
  }
  const bg = candidates[Math.floor(Math.random() * candidates.length)] || BATTLE_BACKGROUNDS[0];
  currentBattleBgId = bg.id;
  els.battleBg.style.backgroundImage = `url('${bg.src}')`;
  els.battleBg.dataset.bgName = bg.name;
  els.battleBg.classList.remove('bg-changing');
  void els.battleBg.offsetWidth;
  if(!initial) els.battleBg.classList.add('bg-changing');
}

function isMobileAudioMode(){
  return window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
}
function isCompactMenuMode(){
  return window.matchMedia('(max-width: 1279px), (max-height: 700px)').matches;
}
function isTouchDevice(){
  return window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window) || (navigator.maxTouchPoints||0) > 0;
}
function isIOSDevice(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints||0) > 1);
}
function isMouseLikePointer(e){
  // PC/マウス操作では、タッチ対応PCでもオンカーソル表示を出す。
  // touch / pen は誤表示防止で非表示。
  return !e || !e.pointerType || e.pointerType === 'mouse';
}
function setPointerMode(mode){
  if(!document.body) return;
  document.body.classList.toggle('using-mouse', mode === 'mouse');
  document.body.classList.toggle('using-touch', mode === 'touch');
}
function isSpPortrait(){
  return window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches;
}
function updateMuteButton(){
  if(!els.muteBtn) return;
  els.muteBtn.style.display = 'inline-flex';
  els.muteBtn.textContent = state.mobileMuted ? '🔇' : '🔊';
  els.muteBtn.title = state.mobileMuted ? 'ミュート中' : '音ON';
  els.muteBtn.setAttribute('aria-pressed', state.mobileMuted ? 'true' : 'false');
  if(els.audioHint){
    els.audioHint.classList.add('hidden');
  }
}
function setMobileMuted(flag){
  state.mobileMuted = !!flag;
  applyVolume();
  updateMuteButton();
  if(state.mobileMuted){
    stopAllAudioForMute();
  }else{
    startAudio();
    if(state.audioUnlocked) playBgm();
  }
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
  if(els.equipToggleBtn) els.equipToggleBtn.textContent = isSpPortrait() ? (state.uiOpen ? '×' : '☰') : (state.uiOpen ? '閉じる' : 'メニュー');
  if(els.debugBtn) els.debugBtn.textContent = isSpPortrait() ? 'D' : 'デバッグ';
  setMenuPage(state.menuPage || 'stats');
  if(!isCompactMenuMode() && window.innerWidth >= 1280){
    state.uiOpen=false;
    els.sidePanel.classList.remove('open');
    els.equipToggleBtn.textContent='メニュー';
  }
}

const LEGAL_CONTENT = {
  credit: {
    title: 'クレジット',
    body: `
      <p><b>Mini Browser Hero</b></p>
      <p>© 2026 もみヒゲ</p>
      <p>本作品の企画・開発・最終実装は、もみヒゲが行っています。</p>
      <p>本作品の一部素材・プログラム・文章・画像の制作には、生成AI（ChatGPT等）を利用しています。</p>
      <p>生成された内容は制作者による確認・編集・調整を経て、ゲーム内に実装されています。</p>
      <p>使用している画像・音声・フォント等の権利は、各権利者に帰属します。</p>
    `
  },
  terms: {
    title: '利用規約',
    body: `
      <p>本作品は無保証で提供されます。</p>
      <p>本作品の利用によって発生した損害について、制作者は一切の責任を負いません。</p>
      <p>本作品の無断転載、再配布、改変後の再配布を禁止します。</p>
    `
  },
  privacy: {
    title: 'プライバシーポリシー',
    body: `
      <p>本作品のセーブデータは、お使いのブラウザのローカルストレージにのみ保存されます。</p>
      <p>個人情報やセーブデータをゲーム側の外部サーバーへ送信することはありません。</p>
      <p>アクセス数の確認を目的として、GitHub Pages等のホスティングサービスが提供するアクセス情報、またはCloudflare Web Analytics等のアクセス解析ツールを利用する場合があります。</p>
      <p>取得する情報は、ページ閲覧数、アクセス日時、使用ブラウザ、参照元などの統計情報です。</p>
      <p>個人を直接特定する目的では利用しません。</p>
    `
  }
};

function openLegalModal(type){
  const data = LEGAL_CONTENT[type] || LEGAL_CONTENT.credit;
  if(!els.legalModal || !els.legalModalTitle || !els.legalModalBody) return;
  els.legalModalTitle.textContent = data.title;
  els.legalModalBody.innerHTML = data.body;
  els.legalModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}
function closeLegalModal(){
  if(els.legalModal) els.legalModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function init(){
  // 初期状態は完全に空にする。
  // 以前はここで固定装備と倉庫アイテムを作っていたため、
  // ユーザーデータリセット後にも装備/倉庫が復活していた。
  slots.forEach(slot => state.equip[slot]=null);
  state.inventory = [];
  loadGame();
  ensureStarterEquipment();
  sanitizeAllEquipmentDeathDanceChance();
  // v57: 音声は保存状態に関係なく、起動・リロード直後は必ずミュートON。
  state.mobileMuted = true;
  state.audioUnlocked = false;
  bind();
  switchRandomBattleBackground(true);
  if(battleBgTimer) clearInterval(battleBgTimer);
  battleBgTimer = setInterval(()=>switchRandomBattleBackground(false), 5 * 60 * 1000);
  if(!state.mobileMuted) startAudio();
  state.lastHeroAttack = -999999;
  state.lastEnemyAttack = performance.now();
  spawnEnemy(isFirstBattleState());
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
      level:state.level, xp:state.xp, xpNext:state.xpNext, lastXpGain:state.lastXpGain,
      chests:state.chests, mats:state.mats, defeated:state.defeated,
      hp:Math.max(1, Math.floor(state.hp||1)), base:state.base,
      inventory:state.inventory.map(cleanItem), equip:serializeEquip(), selectedEquip:state.selectedEquip,
      volume:state.volume, mobileMuted:state.mobileMuted, debug:state.debug, enemyRecords:state.enemyRecords, enemyLevelBase:state.enemyLevelBase, enemyLevelBaseDefeated:state.enemyLevelBaseDefeated, winStreak:state.winStreak, bestWinStreak:state.bestWinStreak, forceNextDarkSwordSaint:state.forceNextDarkSwordSaint, darkSwordSaintLevel:state.darkSwordSaintLevel, darkSwordSaintKills:state.darkSwordSaintKills,
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
    // v57: 起動時ミュート固定のため、保存済みミュート状態は読み込まない。
    state.mobileMuted = true;
    state.enemyRecords = sanitizeEnemyRecords(data.enemyRecords || {});
    state.enemyLevelBase = data.enemyLevelBase == null ? null : Math.max(1, Math.floor(Number(data.enemyLevelBase)||1));
    state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(data.enemyLevelBaseDefeated)||0));
    state.winStreak = Math.max(0, Math.floor(Number(data.winStreak)||0));
    state.bestWinStreak = Math.max(0, Math.floor(Number(data.bestWinStreak)||0));
    state.forceNextDarkSwordSaint = !!data.forceNextDarkSwordSaint;
    state.darkSwordSaintLevel = Math.max(1, Math.floor(Number(data.darkSwordSaintLevel)||1));
    state.darkSwordSaintKills = Math.max(0, Math.floor(Number(data.darkSwordSaintKills)||0));
    state.hp = Math.min(Number(data.hp)||maxHp(), maxHp());
    if(state.hp<=0) state.hp=Math.floor(maxHp()*0.5);
    sanitizeAllEquipmentDeathDanceChance();
    state.down=false; state.deathDance=false;
    console.info('save loaded');
  }catch(e){ console.warn('load failed', e); }
}

function sanitizeAllEquipmentDeathDanceChance(){
  const fix = (it)=>{
    if(!it) return it;
    if(it.name === '師匠のアミュレット'){
      it.deathDanceChance = 0.10;
      it.masterRegen = true;
      it.unsellable = true;
      return it;
    }
    if(it.specialFrame === 'darkholy'){
      if((it.deathDanceChance||0) > 0.25) it.deathDanceChance = 0.25;
      return it;
    }
    if((it.deathDanceChance||0) > 0.25) it.deathDanceChance = 0.25;
    return it;
  };
  Object.keys(state.equip||{}).forEach(k=>{ state.equip[k]=fix(state.equip[k]); });
  if(Array.isArray(state.inventory)) state.inventory.forEach(fix);
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
function sanitizeEnemyRecords(records){
  const out={};
  ENEMIES.forEach(e=>{
    const r = records && records[e.id] ? records[e.id] : {};
    out[e.id] = { seen: !!r.seen, kills: Math.max(0, Number(r.kills)||0), maxDefeatLevel: Math.max(0, Number(r.maxDefeatLevel)||0) };
  });
  return out;
}
function ensureEnemyRecord(id){
  if(!state.enemyRecords) state.enemyRecords = {};
  if(!state.enemyRecords[id]) state.enemyRecords[id] = {seen:false, kills:0, maxDefeatLevel:0};
  return state.enemyRecords[id];
}
function markEnemySeen(e){
  const r = ensureEnemyRecord(e.id);
  if(!r.seen){ r.seen = true; scheduleSave(); }
}
function markEnemyDefeated(e){
  const r = ensureEnemyRecord(e.id);
  r.seen = true;
  r.kills = (Number(r.kills)||0) + 1;
  r.maxDefeatLevel = Math.max(Number(r.maxDefeatLevel)||0, Number(e.level)||1);
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
    els.equipToggleBtn.textContent = isSpPortrait() ? (state.uiOpen ? '×' : '☰') : (state.uiOpen?'閉じる':'メニュー');
    startAudio();
    playUiClick();
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
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('inventoryActionMenu');
    if(menu && !menu.contains(e.target) && !e.target.closest?.('.item')) cancelInventoryActionMenu();
  });
  document.addEventListener('pointerup', (e) => {
    const menu = document.getElementById('inventoryActionMenu');
    if(menu && !menu.contains(e.target) && !e.target.closest?.('.item')) cancelInventoryActionMenu();
  }, {capture:true});
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ cancelInventoryActionMenu(); closeLegalModal(); } });
  document.addEventListener('visibilitychange', handlePageVisibility);
  window.addEventListener('pagehide', pauseBgmForPageHidden);
  window.addEventListener('pageshow', resumeBgmForPageVisible);
  window.addEventListener('blur', pauseBgmForPageHidden);
  window.addEventListener('focus', resumeBgmForPageVisible);
  setTimeout(()=>{ if(!state.mobileMuted) startAudio(); }, 300);
  els.debugBtn.onclick = () => { els.debugPanel.classList.toggle('hidden'); startAudio(); playUiClick(); };
  if(els.muteBtn) els.muteBtn.onclick = (e) => { e.preventDefault(); setMobileMuted(!state.mobileMuted); if(!state.mobileMuted) startAudio(); playUiClick(); };
  if(els.creditBtn) els.creditBtn.onclick = () => { playUiClick(); openLegalModal('credit'); };
  if(els.termsBtn) els.termsBtn.onclick = () => { playUiClick(); openLegalModal('terms'); };
  if(els.privacyBtn) els.privacyBtn.onclick = () => { playUiClick(); openLegalModal('privacy'); };
  if(els.legalModalClose) els.legalModalClose.onclick = () => { playUiClick(); closeLegalModal(); };
  if(els.legalModal) els.legalModal.addEventListener('click', (e)=>{ if(e.target && e.target.dataset && e.target.dataset.legalClose) closeLegalModal(); });
  document.querySelectorAll('.mobile-menu-tabs button').forEach(btn=>btn.onclick=()=>{setMenuPage(btn.dataset.menuPage); playUiClick();});
  els.debugClose.onclick = () => { els.debugPanel.classList.add('hidden'); playUiClick(); };
  if(els.debugResetData) els.debugResetData.onclick = () => { playUiClick(); resetUserData(); };
  els.debugAddChests.onclick = () => { playUiClick(); for(let i=0;i<50;i++) state.inventory.unshift(makeRandomItem()); renderAll(); log('デバッグ：装備を50個追加。','good'); scheduleSave(); };
  if(els.debugBestSword) els.debugBestSword.onclick = () => { playUiClick(); const it=makeDarkHolySword ? makeDarkHolySword(state.level) : makeDebugSword(); state.inventory.unshift(it); renderAll(); log('デバッグ：闇の聖剣を倉庫に追加。','good'); scheduleSave(); };
  if(els.debugBestAccessory) els.debugBestAccessory.onclick = () => { playUiClick(); const a=makeDarkAmulet ? makeDarkAmulet(state.level) : makeDebugAccessory('アミュレット'); state.inventory.unshift(a); renderAll(); log('デバッグ：闇のアミュレットを倉庫に追加。','good'); scheduleSave(); };
  els.debugKillEnemy.onchange = () => { state.debug.killEnemy = els.debugKillEnemy.checked; log(`デバッグ：敵への攻撃で即死 ${state.debug.killEnemy?'ON':'OFF'}`, state.debug.killEnemy?'danger':''); scheduleSave(); };
  els.debugKillHero.onchange = () => { state.debug.killHero = els.debugKillHero.checked; log(`デバッグ：敵からの攻撃で即死 ${state.debug.killHero?'ON':'OFF'}`, state.debug.killHero?'danger':''); scheduleSave(); };
  if(els.debugDarkSwordSaint) els.debugDarkSwordSaint.onclick = () => { playUiClick(); forceSpawnDarkSwordSaint(); };
  [els.sellNormalChk, els.sellRareChk, els.sellLegendaryChk].filter(Boolean).forEach(chk=>chk.onchange=()=>updateSellButtonState());

  if(els.openAllBtn) els.openAllBtn.style.display='none';
  els.bestEquipBtn.onclick = () => { playUiClick(); bestEquip(); };
  els.sellSelectedBtn.onclick = () => { if(els.sellSelectedBtn.disabled) return; playUiClick(); sellSelectedRarities(); };
  els.upgradeBtn.onclick = () => { if(!els.upgradeBtn.disabled) playUiClick(); upgradeSelected(); };
  window.addEventListener('resize', syncMenuByWidth);
  window.addEventListener('orientationchange', syncCompactLayout);
  bindStatusCardPopupEvents();
  syncMenuByWidth();
  setMenuPage(state.menuPage || 'stats');
  updateMuteButton();
  installVersionLabel();
  const fleeBtn=document.getElementById('fleeBtn'); if(fleeBtn) v94BindTap(fleeBtn, ()=>{ playUiClick(); confirmFlee(); });
  const fleeCancel=document.getElementById('fleeCancelBtn'); if(fleeCancel) v94BindTap(fleeCancel, ()=>{ playUiClick(); closeFleeModal(); });
  const fleeOk=document.getElementById('fleeOkBtn'); if(fleeOk) v94BindTap(fleeOk, ()=>{ playUiClick(); closeFleeModal(); fleeBattle(); });
}

function installVersionLabel(){
  const fixed=document.getElementById('fixedBuildVersion'); if(fixed) fixed.remove();
  const brand=document.querySelector('.brand'); if(!brand) return;
  let v=brand.querySelector('.build-version');
  if(!v){ v=document.createElement('span'); v.className='build-version'; brand.appendChild(v); }
  v.textContent = `ver.${GAME_VERSION}`;
  const dbg=document.querySelector('.debug-version'); if(dbg) dbg.textContent = `Build: ver.${GAME_VERSION}`;
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
    deathDanceChance:.10, deathDanceDefIgnore:0, heroDarkBleedChance:0, lifeSteal:0, guard:0, crit:.08,
    darkShield:false, darkAmulet:false, masterRegen:false, masterRegenRate:0, deathDanceDurationMul:1
  };
  let normalDanceBonus = 0;
  let darkDanceBonus = 0;
  Object.values(state.equip).filter(Boolean).forEach(it=>{
    s.hp += it.hp||0; s.atk += it.atk||0; s.def += it.def||0;
    s.fireRes += it.fireRes||0; s.fireDmg += it.fireDmg||0; s.fireSkillChance += it.fireSkillChance||0;
    s.fireDamageHeal += it.fireDamageHeal||0;
    s.thunderDmg += it.thunderDmg||0; s.thunderSkillChance += it.thunderSkillChance||0;
    const dd = it.deathDanceChance||0;
    if(dd){ if(it.specialFrame === 'darkholy') darkDanceBonus += dd; else normalDanceBonus += dd; }
    s.deathDanceDefIgnore += it.deathDanceDefIgnore||0;
    s.heroDarkBleedChance += it.heroDarkBleedChance||0;
    s.lifeSteal += it.lifeSteal||0; s.guard += it.guard||0; s.crit += it.crit||0;
    if(it.darkShield) s.darkShield = true;
    if(it.darkAmulet){ s.darkAmulet = true; s.deathDanceDurationMul = Math.max(s.deathDanceDurationMul, 2); }
    if(it.masterRegen){ s.masterRegen = true; s.masterRegenRate = Math.max(s.masterRegenRate, masterAmuletRegenRate()); }
  });
  s.deathDanceChance += Math.min(0.25, normalDanceBonus) + Math.min(0.50, darkDanceBonus);
  if(hasUnyieldingBuff()) s.deathDanceChance += 0.50;
  s.fireRes=Math.min(.75,s.fireRes); s.fireDamageHeal=Math.min(1,s.fireDamageHeal);
  s.guard=Math.min(.45,s.guard); s.crit=Math.min(.55,s.crit); s.deathDanceChance=Math.min(1,s.deathDanceChance); s.deathDanceDefIgnore=Math.min(.9,s.deathDanceDefIgnore);
  return s;
}
function maxHp(){return calcStats().hp}

function nowMs(){ return performance.now(); }

function makeEmptyEnemyStatuses(t=0){
  return {bleeds:[], darkBleeds:[], burnUntil:0, lastBleedTick:t, lastDarkBleedTick:t, darkAuraStacks:0, darkAuraLastTick:t, darkSwordBuffs:[], darkDanceCount:0, darkRevivingUntil:0, darkReviveStart:0, darkOneDamageCount:0, darkTechniqueAwakened:false, bossRegenLast:t};
}
function isDarkSwordSaint(e=state.enemy){ return !!e && e.id === 'dark_sword_saint'; }
function hasUnyieldingBuff(){ return isDarkSwordSaint() && !state.down; }
function isDarkSwordSaintReviving(){ ensureStatusContainers(); return isDarkSwordSaint() && (state.enemyStatuses.darkRevivingUntil || 0) > performance.now(); }
function darkSwordBuffCount(){ ensureStatusContainers(); cleanupStatuses(); return state.enemyStatuses.darkSwordBuffs.length; }
function darkSwordBuffSeconds(){ ensureStatusContainers(); cleanupStatuses(); const n=nowMs(); return Math.max(0, ...state.enemyStatuses.darkSwordBuffs.map(t=>Math.ceil((t-n)/1000)), 0); }
function darkAuraStacks(){ ensureStatusContainers(); return state.enemyStatuses.darkAuraStacks || 0; }
function darkDanceChanceForNext(){
  const count = state.enemyStatuses?.darkDanceCount || 0;
  if(count <= 0) return 100;
  if(count >= 10) return 0;
  return Math.max(0, 100 - count * 10);
}
function ensureStatusContainers(){
  if(!state.heroStatuses) state.heroStatuses = {bleeds:[], darkBleeds:[], burnUntil:0, lastBleedTick:0, lastDarkBleedTick:0};
  if(!state.heroStatuses.darkBleeds) state.heroStatuses.darkBleeds = [];
  if(!state.heroStatuses.lastDarkBleedTick) state.heroStatuses.lastDarkBleedTick = 0;
  if(!state.enemyStatuses) state.enemyStatuses = makeEmptyEnemyStatuses();
  if(!state.enemyStatuses.darkBleeds) state.enemyStatuses.darkBleeds = [];
  if(!state.enemyStatuses.lastDarkBleedTick) state.enemyStatuses.lastDarkBleedTick = 0;
}
function resetTransientStatuses(){
  state.heroStatuses = {bleeds:[], darkBleeds:[], burnUntil:0, lastBleedTick:0, lastDarkBleedTick:0};
  state.enemyStatuses = makeEmptyEnemyStatuses();
  state.deathDanceBattleCount = 0;
  state.darkShieldStacks = 0;
  hideStatusTooltip();
  renderStatusLists();
}
function cleanupStatuses(){
  ensureStatusContainers();
  const n = nowMs();
  state.heroStatuses.bleeds = state.heroStatuses.bleeds.filter(t=>t>n);
  state.heroStatuses.darkBleeds = (state.heroStatuses.darkBleeds||[]).filter(t=>t>n);
  state.enemyStatuses.bleeds = state.enemyStatuses.bleeds.filter(t=>t>n);
  state.enemyStatuses.darkBleeds = (state.enemyStatuses.darkBleeds||[]).filter(t=>t>n);
  if(state.heroStatuses.burnUntil && state.heroStatuses.burnUntil <= n) state.heroStatuses.burnUntil = 0;
  if(state.enemyStatuses.burnUntil && state.enemyStatuses.burnUntil <= n) state.enemyStatuses.burnUntil = 0;
  if(state.enemyStatuses.darkSwordBuffs) state.enemyStatuses.darkSwordBuffs = state.enemyStatuses.darkSwordBuffs.filter(t=>t>n);
  if(isDarkSwordSaint() && state.enemyStatuses.darkAuraStacks > 0){
    if(!state.enemyStatuses.darkAuraLastTick) state.enemyStatuses.darkAuraLastTick = n;
    const dec = Math.floor((n - state.enemyStatuses.darkAuraLastTick) / 10000);
    if(dec > 0){
      state.enemyStatuses.darkAuraLastTick += dec * 10000;
      state.enemyStatuses.darkAuraStacks = Math.max(0, state.enemyStatuses.darkAuraStacks - dec);
    }
  }
}
function hasBurn(target){ ensureStatusContainers(); cleanupStatuses(); return !!(target==='hero' ? state.heroStatuses.burnUntil : state.enemyStatuses.burnUntil); }
function burnSeconds(target){ ensureStatusContainers(); cleanupStatuses(); const until = target==='hero' ? state.heroStatuses.burnUntil : state.enemyStatuses.burnUntil; return Math.max(0, Math.ceil((until-nowMs())/1000)); }
function bleedCount(target){ ensureStatusContainers(); cleanupStatuses(); return (target==='hero' ? state.heroStatuses.bleeds : state.enemyStatuses.bleeds).length; }
function darkBleedCount(target='hero'){ ensureStatusContainers(); cleanupStatuses(); return (target==='enemy' ? (state.enemyStatuses.darkBleeds||[]) : (state.heroStatuses.darkBleeds||[])).length; }
function addDarkBleed(target='hero'){
  ensureStatusContainers(); cleanupStatuses();
  const owner = target==='enemy' ? state.enemyStatuses : state.heroStatuses;
  const box = owner.darkBleeds || (owner.darkBleeds = []);
  if(box.length >= 100) return false;
  box.push(nowMs() + 60000);
  renderStatusLists();
  return true;
}
function addBleed(target){
  ensureStatusContainers(); cleanupStatuses();
  const box = target==='hero' ? state.heroStatuses : state.enemyStatuses;
  if(box.bleeds.length >= 20) return false;
  box.bleeds.push(nowMs() + 10000);
  renderStatusLists();
  return true;
}
function addBurn(target){
  ensureStatusContainers(); cleanupStatuses();
  const until = nowMs() + 10000;
  if(target==='hero') state.heroStatuses.burnUntil = until;
  else state.enemyStatuses.burnUntil = until;
  renderStatusLists();
  return true;
}
function masterAmuletRegenRate(){
  return Math.min(0.10, 0.03 + Math.max(0, (state.level||1)-1) * 0.001);
}

function processStatusDots(now){
  ensureStatusContainers(); cleanupStatuses();
  if(state.enemy && state.enemy.bossBuff === 'super_regen'){
    if(!state.enemyStatuses.bossRegenLast) state.enemyStatuses.bossRegenLast = now;
    const ticks = Math.floor((now - state.enemyStatuses.bossRegenLast)/10000);
    if(ticks > 0){
      state.enemyStatuses.bossRegenLast += ticks*10000;
      const heal = Math.max(1, Math.floor(state.enemy.maxHp * 0.01 * ticks));
      if(state.enemyHp > 0 && state.enemyHp < state.enemy.maxHp){ state.enemyHp = Math.min(state.enemy.maxHp, state.enemyHp + heal); showFloat(`+${heal}`, 'heal'); }
    }
  }
  if(!state.down && !state.deathDanceCutin && calcStats().masterRegen){
    if(!state.heroStatuses.masterRegenLast) state.heroStatuses.masterRegenLast = now;
    const ticks = Math.floor((now - state.heroStatuses.masterRegenLast)/10000);
    if(ticks > 0){
      state.heroStatuses.masterRegenLast += ticks*10000;
      const heal = Math.max(1, Math.floor(maxHp() * masterAmuletRegenRate() * ticks));
      if(state.hp > 0 && state.hp < maxHp()){ state.hp = Math.min(maxHp(), state.hp + heal); showHeroFloat(`+${heal}`, 'heal'); }
    }
  }
  if(isDarkSwordSaintReviving()){ renderStatusLists(); return; }
  if(state.enemy && state.enemyStatuses.bleeds.length){
    if(!state.enemyStatuses.lastBleedTick) state.enemyStatuses.lastBleedTick = now;
    const ticks = Math.floor((now - state.enemyStatuses.lastBleedTick)/1000);
    if(ticks > 0){
      state.enemyStatuses.lastBleedTick += ticks*1000;
      let dmg = Math.max(1, Math.floor(state.enemy.maxHp * 0.01 * state.enemyStatuses.bleeds.length * ticks));
      if(state.enemy?.bossBuff === 'apex') dmg = Math.max(1, Math.floor(dmg * 0.5));
      if(isDarkSwordSaint() && darkAuraStacks() > 0){
        dmg = Math.max(1, Math.floor(dmg * 0.10));
      }
      state.enemyHp = Math.max(0, state.enemyHp - dmg);
      showFloat(`出血 ${dmg}${isDarkSwordSaint() && darkAuraStacks() > 0 ? ' 軽減' : ''}`,'damage');
      if(state.enemyHp <= 0){
        state.enemyHp = 0;
        renderBattle();
        if(tryDarkSwordDanceRevive()) return;
        setTimeout(enemyDefeated, 120);
      }
    }
  }else state.enemyStatuses.lastBleedTick = now;
  if(state.enemy && (state.enemyStatuses.darkBleeds||[]).length){
    if(!state.enemyStatuses.lastDarkBleedTick) state.enemyStatuses.lastDarkBleedTick = now;
    const ticks = Math.floor((now - state.enemyStatuses.lastDarkBleedTick)/15000);
    if(ticks > 0){
      state.enemyStatuses.lastDarkBleedTick += ticks*15000;
      let dmg = Math.max(1, Math.floor(state.enemy.maxHp * 0.01 * darkBleedCount('enemy') * ticks));
      if(isDarkSwordSaint() && darkAuraStacks() > 0){ dmg = Math.max(1, Math.floor(dmg * 0.10)); }
      state.enemyHp = Math.max(0, state.enemyHp - dmg);
      showFloat(`暗黒出血 ${dmg}${isDarkSwordSaint() && darkAuraStacks() > 0 ? ' 軽減' : ''}`,'dark');
      if(state.enemyHp <= 0){
        state.enemyHp = 0;
        renderBattle();
        if(tryDarkSwordDanceRevive()) return;
        setTimeout(enemyDefeated, 120);
      }
    }
  }else state.enemyStatuses.lastDarkBleedTick = now;
  if(!state.down && !state.deathDance && !state.deathDanceCutin && state.heroStatuses.bleeds.length){
    if(!state.heroStatuses.lastBleedTick) state.heroStatuses.lastBleedTick = now;
    const ticks = Math.floor((now - state.heroStatuses.lastBleedTick)/1000);
    if(ticks > 0){
      state.heroStatuses.lastBleedTick += ticks*1000;
      const dmg = Math.max(1, Math.floor(maxHp() * 0.01 * state.heroStatuses.bleeds.length * ticks));
      state.hp = Math.max(0, state.hp - dmg);
      showHeroFloat(`出血 ${dmg}`,'damage');
      if(state.hp <= 0){
        state.hp = 0;
        renderBattle();
        if(tryHeroDeathDance()) return;
        startDown();
      }
    }
  }else state.heroStatuses.lastBleedTick = now;
  if(!state.down && !state.deathDance && !state.deathDanceCutin && (state.heroStatuses.darkBleeds||[]).length){
    if(!state.heroStatuses.lastDarkBleedTick) state.heroStatuses.lastDarkBleedTick = now;
    const ticks = Math.floor((now - state.heroStatuses.lastDarkBleedTick)/15000);
    if(ticks > 0){
      state.heroStatuses.lastDarkBleedTick += ticks*15000;
      const dmg = Math.max(1, Math.floor(maxHp() * 0.01 * darkBleedCount('hero') * ticks));
      state.hp = Math.max(0, state.hp - dmg);
      showHeroFloat(`暗黒出血 ${dmg}`,'damage');
      if(state.hp <= 0){
        state.hp = 0;
        renderBattle();
        if(tryHeroDeathDance()) return;
        startDown();
      }
    }
  }else state.heroStatuses.lastDarkBleedTick = now;
  renderStatusLists();
}

function applyDarkShieldToDamage(dmg){
  const st = calcStats();
  if(!st.darkShield || dmg <= 0) return Math.max(0, Math.floor(dmg));
  state.darkShieldStacks = Math.min(50, (state.darkShieldStacks||0) + 1);
  const reduced = Math.max(1, Math.floor(dmg * (1 - state.darkShieldStacks/100)));
  const heal = Math.max(1, Math.floor(reduced * 0.5));
  state.hp = Math.min(maxHp(), state.hp + heal);
  showHeroFloat(`闇盾 +${heal}`, 'heal');
  return reduced;
}
function loseExpPercent(percent){
  let loss = Math.max(1, Math.floor(totalCurrentExp() * percent));
  state.lastXpGain = -loss;
  while(loss > 0){
    if(state.xp >= loss){ state.xp -= loss; loss = 0; }
    else{
      loss -= state.xp;
      if(state.level <= 1){ state.xp = 0; loss = 0; break; }
      state.level--;
      state.xpNext = Math.max(80, Math.floor((state.xpNext - 40) / 1.42));
      state.xp = state.xpNext;
    }
  }
  state.hp = Math.min(state.hp, maxHp());
}
function totalCurrentExp(){
  let total = Math.max(0, state.xp||0);
  let need = 80;
  for(let lv=1; lv<state.level; lv++){
    total += need;
    need = Math.floor(need*1.42+40);
  }
  return Math.max(1,total);
}
function formatExpDelta(value){
  const n = Math.floor(Number(value)||0);
  if(n > 0) return `+${n}`;
  if(n < 0) return `${n}`;
  return '0';
}

function tryHeroDeathDance(){
  // DOWN/敗北処理と死線の剣舞が同時に走ると、HP0のまま攻撃と敗北がループするため排他制御する。
  if(state.defeatSequence || state.down) return false;
  // すでに剣舞中/剣舞カットイン中なら死亡処理へ進ませない。
  if(state.deathDance || (state.deathDanceCutin && !state.darkSwordCutinActive)) return true;
  const chance = calcStats().deathDanceChance;
  if(Math.random() < chance){
    startDeathDance();
    return true;
  }
  return false;
}
function spawnWeakEnemyAfterEscape(){
  if(state.defeatCountdownTimer){ clearInterval(state.defeatCountdownTimer); state.defeatCountdownTimer = null; }
  clearDarkSwordTimers();
  clearDeathDanceSequence();
  hideDeathDanceCutin();
  state.down = false;
  state.defeatSequence = false;
  state.deathDance = false;
  state.deathDanceCutin = false;
  state.darkSwordCutinActive = false;
  state.hp = maxHp();
  resetTransientStatuses();
  state.lastHeroAttack = performance.now() - 9999;
  state.lastEnemyAttack = performance.now();
  if(els.heroCard) els.heroCard.classList.remove('down');
  if(els.downOverlay) els.downOverlay.classList.add('hidden');
  if(els.enemyCard) els.enemyCard.classList.remove('defeated-gone');
  spawnEnemy(false);
  setBgmMode(isDarkSwordSaint() ? 'dark_sword_saint' : 'normal');
  renderAll();
  scheduleSave();
}

function spawnEnemyAfterDefeat(){
  if(state.defeatCountdownTimer){ clearInterval(state.defeatCountdownTimer); state.defeatCountdownTimer = null; }
  clearDarkSwordTimers();
  clearDeathDanceSequence();
  hideDeathDanceCutin();
  state.down = false;
  state.defeatSequence = false;
  state.deathDance = false;
  state.deathDanceCutin = false;
  state.darkSwordCutinActive = false;
  state.hp = maxHp();
  if(els.heroCard) els.heroCard.classList.remove('down');
  if(els.downOverlay) els.downOverlay.classList.add('hidden');
  if(els.enemyCard) els.enemyCard.classList.remove('defeated-gone');
  spawnEnemy(false);
  setBgmMode(isDarkSwordSaint() ? 'dark_sword_saint' : 'normal');
  renderAll();
  scheduleSave();
}
function fleeBattle(){
  const currentLevel = Math.max(1, Math.floor(state.enemy?.level || state.enemyLevelBase || state.level || 1));
  const nextBase = Math.max(1, currentLevel - 20);
  state.enemyLevelBase = nextBase;
  state.enemyLevelBaseDefeated = state.defeated || 0;
  state.winStreak = 0;
  state.forceNextDarkSwordSaint = false;
  log(`戦闘から離脱した。敵の出現レベルが${currentLevel}→${nextBase}に低下した。`, 'danger');
  banner('戦闘離脱');
  spawnWeakEnemyAfterEscape();
}
function confirmFlee(){
  const modal = document.getElementById('fleeModal');
  if(modal) modal.classList.remove('hidden');
}
function closeFleeModal(){
  const modal = document.getElementById('fleeModal');
  if(modal) modal.classList.add('hidden');
}
function handleHeroDeath(){
  if(state.defeatSequence || state.down || state.deathDance || (state.deathDanceCutin && !state.darkSwordCutinActive)) return;
  state.defeatSequence = true;
  if(state.defeatCountdownTimer){ clearInterval(state.defeatCountdownTimer); state.defeatCountdownTimer = null; }
  clearDarkSwordTimers();
  clearDeathDanceSequence();
  hideDeathDanceCutin();
  state.deathDance = false;
  state.deathDanceCutin = false;
  state.darkSwordCutinActive = false;
  state.hp = 0;
  // 敗北確定時はバフ・デバフを全解除する。
  resetTransientStatuses();
  state.hp = 0;
  state.winStreak = 0;
  state.forceNextDarkSwordSaint = false;
  const defeatedEnemyLevel = Math.max(1, Math.floor(state.enemy?.level || state.enemyLevelBase || state.level || 1));
  const nextEnemyLevelBase = Math.max(1, Math.floor(defeatedEnemyLevel * 0.9));
  state.enemyLevelBase = nextEnemyLevelBase;
  state.enemyLevelBaseDefeated = state.defeated || 0;
  loseExpPercent(calcStats().effortRing ? 0 : (calcStats().humbleRing ? 0.09 : 0.25));
  state.hp = 0;
  const lostPct = calcStats().effortRing ? 0 : (calcStats().humbleRing ? 9 : 25);
  log(`騎士は力尽きた。経験値を${lostPct}%失った。敵レベルが${defeatedEnemyLevel}→${nextEnemyLevelBase}に低下した。`,'danger');
  banner('敗北…');
  if(els.heroCard) els.heroCard.classList.add('down');
  if(els.downOverlay){
    els.downOverlay.classList.remove('hidden');
    const dt = els.downOverlay.querySelector('.down-text');
    if(dt) dt.textContent = 'DOWN...';
    if(els.downCount) els.downCount.textContent = '5';
  }
  if(els.enemyCard){
    els.enemyCard.classList.remove('hit','attack','enter');
    els.enemyCard.classList.add('defeated-gone');
  }
  if(els.enemyHpFill) els.enemyHpFill.style.width='0%';
  if(els.enemyHpText) els.enemyHpText.textContent='消滅';
  renderStatusLists();
  renderBattle();
  scheduleSave();

  let count = 5;
  state.defeatCountdownTimer = setInterval(()=>{
    count -= 1;
    if(els.downCount) els.downCount.textContent = String(Math.max(0,count));
    if(count <= 0){
      clearInterval(state.defeatCountdownTimer);
      state.defeatCountdownTimer = null;
      if(els.enemyCard) els.enemyCard.classList.remove('defeated-gone');
      spawnEnemyAfterDefeat();
      state.defeatSequence = false;
      log('敵レベル低下後の戦闘を再開。','good');
    }
  }, 1000);
}

function enemyDefenseMultiplierFor(element){
  let m = 1;
  if(hasBurn('enemy')) m *= 0.75;
  if(element === 'thunder') m *= 0.75;
  if(state.deathDance) m *= (1 - (calcStats().deathDanceDefIgnore || 0));
  return Math.max(0, m);
}
function heroDefenseMultiplier(){ return hasBurn('hero') ? 0.75 : 1; }
function tryApplyHeroHitDebuffs(element, absorbed, skill='slash'){
  if(absorbed || !state.enemy) return;
  if(element === 'physical' && Math.random() < 0.10){
    if(addBleed('enemy')) log(`${state.enemy.name} に出血を付与。`, 'skilllog');
  }
  if((skill === 'slash' || skill === 'deathdance') && calcStats().heroDarkBleedChance && Math.random() < calcStats().heroDarkBleedChance){
    if(addDarkBleed('enemy')) log(`${state.enemy.name} に暗黒出血を刻んだ。`, 'skilllog');
  }
  if(element === 'fire' && Math.random() < 0.20){
    const fireRes = state.enemy.fireResist || 0;
    if(fireRes >= 0.10){ log(`${state.enemy.name} は火耐性で火傷を無効化。`, 'skilllog'); }
    else if(addBurn('enemy')) log(`${state.enemy.name} に火傷を付与。`, 'skilllog');
  }
}
function tryApplyEnemyHitDebuffs(element){
  const bleedRate = isDarkSwordSaint() ? 0.50 : 0.10;
  if(element !== 'fire' && Math.random() < bleedRate){
    if(addBleed('hero')) log(`${state.enemy?.name || '敵'}の攻撃で騎士は出血した。`,'danger');
  }
  if(element !== 'fire') return;
  if(Math.random() >= 0.20) return;
  const st = calcStats();
  if((st.fireRes||0) >= 0.10){ log('騎士は火耐性で火傷を無効化。','good'); return; }
  addBurn('hero');
  log('騎士は火傷を負った。','danger');
}
function statusTooltipHtml(kind, target){
  if(kind === 'bleed') return `<b>出血</b><br>現在：${bleedCount(target)}スタック<br>1スタックごとに10秒継続。<br>1秒ごとに最大HPの1%ダメージ。<br>最大20スタック。`;
  if(kind === 'darkbleed') return `<b>暗黒出血</b><br>現在：${darkBleedCount(target||'hero')}スタック<br>暗黒剣舞の攻撃ごとに50%で付与。<br>15秒ごとに最大HPの1%ダメージ。<br>最大100スタック。効果時間60秒。`; 
  if(kind === 'burn') return `<b>火傷</b><br>残り：${burnSeconds(target)}秒<br>防御力25%低下。<br>火耐性10%以上で無効化。`;
  if(kind === 'deathdance') return `<b>死線の剣舞</b><br>残り：${Math.max(0, Math.ceil((state.deathDanceUntil-nowMs())/1000))}秒<br>極限状態で連続攻撃を放つ。<br>この戦闘での発動回数：${state.deathDanceBattleCount||0}回<br>現在威力：${Math.pow(2, state.deathDanceBattleCount||0)}倍`; 
  if(kind === 'unyielding') return `<b>不屈</b><br>暗黒剣聖と対峙中のみ発動。<br>死線の剣舞発動率+50%。<br>現在の剣舞発動率：${Math.round(calcStats().deathDanceChance*100)}%。`;
  if(kind === 'darkaura') return `<b>闇オーラ</b><br>現在：${darkAuraStacks()}スタック<br>1スタックごとに被ダメージ10%軽減。<br>闇オーラ中は出血ダメージ90%軽減。<br>最大10スタック。10秒ごとに1減少。<br>暗黒剣舞発動時に10へ回復。`;
  if(kind === 'darksword') return `<b>暗黒の剣</b><br>現在：${darkSwordBuffCount()}スタック<br>攻撃力+50% / スタック。<br>効果時間：60秒。スタック可能。<br>最長残り：${darkSwordBuffSeconds()}秒。`;
  if(kind === 'darktechnique') return `<b>暗黒剣技</b><br>暗黒剣聖の通常攻撃で1ダメージが20回発生すると覚醒。<br>覚醒後は通常攻撃が暗黒剣技に置き換わる。<br>暗黒剣舞の回数にはカウントしない。<br>HP回復・闇オーラ回復・暗黒の剣付与はなし。<br>攻撃速度3倍、ガード無効、防御力50%無視。<br>攻撃ごとに出血50%、暗黒出血50%。<br>現在：${state.enemyStatuses?.darkTechniqueAwakened?'覚醒中':((state.enemyStatuses?.darkOneDamageCount||0)+' / 20')}。`;
  if(kind === 'darkdance') return `<b>暗黒剣舞</b><br>発動済み：${state.enemyStatuses?.darkDanceCount||0}回 / 10回<br>次回発動率：${darkDanceChanceForNext()}%<br>暗黒剣舞回数：${state.enemyStatuses?.darkDanceCount||0} / 10<br>HP0時に発動判定。カットイン後に5秒無敵、HPをゆっくり100%まで回復、闇オーラ10、暗黒の剣+1。<br>連続攻撃は10秒間、攻撃速度3倍、ガード無効、防御力50%無視。<br>攻撃ごとに出血50%、暗黒出血50%。`;
  if(kind === 'acid_body') return `<b>酸ボディ</b><br>受けた直接ダメージの10%を跳ね返す。`;
  if(kind === 'super_regen') return `<b>超再生</b><br>10秒ごとに最大HPの1%を回復する。`;
  if(kind === 'apex') return `<b>種族の頂点</b><br>被ダメージ50%軽減。<br>出血ダメージ50%軽減。`;
  if(kind === 'spirit_king') return `<b>精霊王</b><br>攻撃されると必ず火傷を付与する。`;
  if(kind === 'master_amulet') return `<b>師匠のアミュレット</b><br>10秒ごとに最大HP${(masterAmuletRegenRate()*100).toFixed(1)}%回復。<br>レベルに応じて+0.1%ずつ成長し、最大10%。<br>敵撃破時、最大HP25%回復。<br>死線の剣舞発動率+10%。`;
  if(kind === 'dark_shield') return `<b>闇の盾</b><br>毎ターン被ダメージ軽減+1%。最大50%。<br>被ダメージの半分を回復。`;
  if(kind === 'dark_amulet') return `<b>闇のアミュレット</b><br>死線の剣舞発動率+25%。<br>死線の剣舞効果時間2倍。`;
  return '';
}

function ensureStatusDetailPanel(){
  let panel = document.getElementById('statusDetailPanel');
  if(panel) return panel;
  panel = document.createElement('div');
  panel.id = 'statusDetailPanel';
  panel.className = 'status-detail-panel hidden';
  panel.innerHTML = `<button type="button" class="status-detail-close" aria-label="閉じる">×</button><div class="status-detail-title">状態詳細</div><div class="status-detail-body"></div>`;
  document.body.appendChild(panel);
  const close = panel.querySelector('.status-detail-close');
  if(close) close.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); hideStatusDetailPanel(); });
  return panel;
}
function showStatusDetailPanel(kind, target){
  const html = statusTooltipHtml(kind, target);
  if(!html) return;
  const panel = ensureStatusDetailPanel();
  const title = panel.querySelector('.status-detail-title');
  const body = panel.querySelector('.status-detail-body');
  if(title) title.textContent = target === 'enemy' ? '敵の状態詳細' : '主人公の状態詳細';
  if(body) body.innerHTML = html;
  panel.dataset.statusKind = kind || '';
  panel.dataset.statusTarget = target || '';
  panel.classList.remove('hidden');
}

function activeStatusEntries(target){
  ensureStatusContainers(); cleanupStatuses();
  const entries = [];
  if(target === 'hero'){
    const st=calcStats();
    if(st.masterRegen) entries.push(['master_amulet', 'hero']);
    if(st.darkShield) entries.push(['dark_shield', 'hero']);
    if(st.darkAmulet) entries.push(['dark_amulet', 'hero']);
  }else if(target === 'enemy'){
    if(state.enemy?.bossBuff) entries.push([state.enemy.bossBuff, 'enemy']);
  }
  if(bleedCount(target)) entries.push(['bleed', target]);
  if(target === 'hero' && darkBleedCount('hero')) entries.push(['darkbleed', 'hero']);
  if(target === 'enemy' && darkBleedCount('enemy')) entries.push(['darkbleed', 'enemy']);
  if(hasBurn(target)) entries.push(['burn', target]);
  if(target === 'hero'){
    if(hasUnyieldingBuff()) entries.push(['unyielding', 'hero']);
    if(state.deathDance) entries.push(['deathdance', 'hero']);
  }else if(target === 'enemy'){
    if(isDarkSwordSaint()){
      entries.push(['darkaura', 'enemy']);
      entries.push(['darksword', 'enemy']);
      entries.push(['darkdance', 'enemy']);
      entries.push(['darktechnique', 'enemy']);
    }
  }
  return entries;
}
function statusListPanelHtml(target){
  const entries = activeStatusEntries(target);
  if(!entries.length) return '<div class="status-empty">効果中のバフ・デバフはありません。</div>';
  return entries.map(([kind,t]) => `<div class="status-detail-item">${statusTooltipHtml(kind,t)}</div>`).join('');
}
function showStatusListPanel(target){
  const panel = ensureStatusDetailPanel();
  const title = panel.querySelector('.status-detail-title');
  const body = panel.querySelector('.status-detail-body');
  if(title) title.textContent = target === 'enemy' ? '敵のバフ・デバフ一覧' : '主人公のバフ・デバフ一覧';
  if(body) body.innerHTML = statusListPanelHtml(target);
  panel.dataset.statusKind = 'all';
  panel.dataset.statusTarget = target || '';
  panel.classList.remove('hidden');
}
function bindStatusCardPopupEvents(){
  const bindOne = (el, target) => {
    if(!el || el.dataset.statusCardPopupBound === '1') return;
    el.dataset.statusCardPopupBound = '1';
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.setAttribute('aria-label', target === 'enemy' ? '敵のバフ・デバフ一覧を開く' : '主人公のバフ・デバフ一覧を開く');
    const open = (e) => {
      if(e){ e.preventDefault(); e.stopPropagation(); }
      showStatusListPanel(target);
    };
    el.addEventListener('click', open);
    el.addEventListener('touchstart', open, {passive:false});
    el.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' '){ open(e); } });
  };
  bindOne(els.enemyCard, 'enemy');
  bindOne(els.heroCard, 'hero');
}
function hideStatusDetailPanel(){
  const panel = document.getElementById('statusDetailPanel');
  if(panel) panel.classList.add('hidden');
}
function isNarrowBattleTooltipMode(){
  return window.innerWidth <= 1180 || window.matchMedia('(orientation: portrait)').matches || window.matchMedia('(pointer: coarse)').matches;
}

function showStatusTooltip(e, kind, target, forceBottom=false){
  if(!els.tooltip) return;
  const html = statusTooltipHtml(kind, target);
  if(!html) return;
  els.tooltip.innerHTML = html;
  els.tooltip.classList.remove('hidden');
  const eventType = e?.type || '';
  const isClickLike = forceBottom || eventType === 'click' || eventType === 'touchstart' || eventType === 'pointerdown';
  if(isClickLike || isNarrowBattleTooltipMode()){
    if(els.tooltip) els.tooltip.classList.add('hidden');
    showStatusDetailPanel(kind, target);
    return;
  }
  els.tooltip.classList.remove('status-tooltip-modal','status-tooltip-bottom');
  els.tooltip.style.transform = 'none';
  els.tooltip.style.right = 'auto';
  els.tooltip.style.bottom = 'auto';

  const touch = e.touches && e.touches[0] ? e.touches[0] : null;
  const baseX = (typeof e.clientX === 'number' && e.clientX) ? e.clientX : (touch ? touch.clientX : window.innerWidth/2);
  const baseY = (typeof e.clientY === 'number' && e.clientY) ? e.clientY : (touch ? touch.clientY : window.innerHeight/2);
  const pad = 10;
  const rect = els.tooltip.getBoundingClientRect();
  let x = baseX + 14;
  let y = baseY + 14;
  if(x + rect.width + pad > window.innerWidth) x = baseX - rect.width - 14;
  if(y + rect.height + pad > window.innerHeight) y = baseY - rect.height - 14;
  x = Math.max(pad, Math.min(x, window.innerWidth - rect.width - pad));
  y = Math.max(pad, Math.min(y, window.innerHeight - rect.height - pad));
  els.tooltip.style.left = x + 'px';
  els.tooltip.style.top = y + 'px';
}
function hideStatusTooltip(){ if(els.tooltip){ els.tooltip.classList.add('hidden'); els.tooltip.classList.remove('status-tooltip-modal','status-tooltip-bottom'); } }
function makeStatusBadge(label, cls, kind, target){
  return `<button type="button" class="status-badge ${cls}" data-status-kind="${kind}" data-status-target="${target}" aria-label="${label} の効果を見る">${label}</button>`;
}
function bindStatusBadgeEvents(){
  document.querySelectorAll('.status-badge').forEach(btn=>{
    btn.onpointerdown = (e)=>{
      if(e.pointerType && e.pointerType !== 'mouse') setPointerMode('touch');
      if(isNarrowBattleTooltipMode() || (e.pointerType && e.pointerType !== 'mouse')){
        e.preventDefault(); e.stopPropagation();
        showStatusDetailPanel(btn.dataset.statusKind, btn.dataset.statusTarget);
      }
    };
    btn.onclick = (e)=>{
      e.preventDefault(); e.stopPropagation();
      showStatusDetailPanel(btn.dataset.statusKind, btn.dataset.statusTarget);
    };
    btn.onmouseenter = (e)=>{ if(!isNarrowBattleTooltipMode()) showStatusTooltip(e, btn.dataset.statusKind, btn.dataset.statusTarget); };
    btn.onmousemove = (e)=>{ if(!isNarrowBattleTooltipMode()) showStatusTooltip(e, btn.dataset.statusKind, btn.dataset.statusTarget); };
    btn.onmouseleave = hideStatusTooltip;
    btn.ontouchstart = (e)=>{ e.preventDefault(); e.stopPropagation(); setPointerMode('touch'); showStatusDetailPanel(btn.dataset.statusKind, btn.dataset.statusTarget); };
  });
}
document.addEventListener('click', (e)=>{ if(!e.target.closest) return; if(!e.target.closest('.status-badge,.tooltip,#statusDetailPanel')){ hideStatusTooltip(); hideStatusDetailPanel(); } });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ hideStatusTooltip(); hideStatusDetailPanel(); } });

document.addEventListener('pointerdown', (e)=>{
  const btn = e.target?.closest ? e.target.closest('.status-badge') : null;
  if(!btn) return;
  if(e.pointerType && e.pointerType !== 'mouse') setPointerMode('touch');
  if(isNarrowBattleTooltipMode() || (e.pointerType && e.pointerType !== 'mouse')){
    e.preventDefault(); e.stopPropagation();
    showStatusDetailPanel(btn.dataset.statusKind, btn.dataset.statusTarget);
  }
}, true);
document.addEventListener('touchstart', (e)=>{
  const btn = e.target?.closest ? e.target.closest('.status-badge') : null;
  if(!btn) return;
  setPointerMode('touch');
  e.preventDefault(); e.stopPropagation();
  showStatusDetailPanel(btn.dataset.statusKind, btn.dataset.statusTarget);
}, {capture:true, passive:false});

function renderStatusLists(){
  ensureStatusContainers(); cleanupStatuses();
  if(els.enemyStatusList){
    const parts=[];
    if(state.enemy?.bossBuff){
      const names={acid_body:'🧪酸ボディ', super_regen:'💚超再生', apex:'👑種族の頂点', spirit_king:'🔥精霊王'};
      parts.push(makeStatusBadge(names[state.enemy.bossBuff]||'ボス特性', 'bossbuff', state.enemy.bossBuff, 'enemy'));
    }
    const bc = bleedCount('enemy');
    if(bc) parts.push(makeStatusBadge(`🩸出血(${bc})`, 'bleed', 'bleed', 'enemy'));
    const edbc = darkBleedCount('enemy');
    if(edbc) parts.push(makeStatusBadge(`🩸暗黒出血(${edbc})`, 'bleed darkbleed', 'darkbleed', 'enemy'));
    if(hasBurn('enemy')) parts.push(makeStatusBadge('🔥火傷', 'burn', 'burn', 'enemy'));
    if(isDarkSwordSaint()){
      parts.push(makeStatusBadge(`🛡️闇オーラ(${darkAuraStacks()})`, 'darkaura', 'darkaura', 'enemy'));
      const ds = darkSwordBuffCount();
      parts.push(makeStatusBadge(`⚔️暗黒の剣(${ds})`, 'darksword', 'darksword', 'enemy'));
      parts.push(makeStatusBadge(`🌑暗黒剣舞(${state.enemyStatuses?.darkDanceCount||0})`, 'darkdance', 'darkdance', 'enemy'));
      parts.push(makeStatusBadge(`⚔️暗黒剣技(${state.enemyStatuses?.darkTechniqueAwakened?'覚醒':((state.enemyStatuses?.darkOneDamageCount||0)+'/20')})`, 'darkdance', 'darktechnique', 'enemy'));
    }
    els.enemyStatusList.innerHTML = parts.join('');
  }
  if(els.heroStatusList){
    const parts=[];
    const st=calcStats();
    if(st.masterRegen) parts.push(makeStatusBadge('📿師匠のアミュレット', 'buff', 'master_amulet', 'hero'));
    if(st.darkShield) parts.push(makeStatusBadge(`🛡闇の盾(${state.darkShieldStacks||0}%)`, 'buff', 'dark_shield', 'hero'));
    if(st.darkAmulet) parts.push(makeStatusBadge('📿闇のアミュレット', 'buff', 'dark_amulet', 'hero'));
    const bc = bleedCount('hero');
    if(bc) parts.push(makeStatusBadge(`🩸出血(${bc})`, 'bleed', 'bleed', 'hero'));
    const dbc = darkBleedCount('hero');
    if(dbc) parts.push(makeStatusBadge(`🩸暗黒出血(${dbc})`, 'bleed darkbleed', 'darkbleed', 'hero'));
    if(hasBurn('hero')) parts.push(makeStatusBadge('🔥火傷', 'burn', 'burn', 'hero'));
    if(hasUnyieldingBuff()) parts.push(makeStatusBadge('🛡️不屈', 'unyielding', 'unyielding', 'hero'));
    if(state.deathDance) parts.push(makeStatusBadge('⚔️剣舞', 'dance', 'deathdance', 'hero'));
    els.heroStatusList.innerHTML = parts.join('');
  }
  bindStatusBadgeEvents();
}

function isFirstBattleState(){
  // 新規開始・ユーザーリセット直後だけ、最初の敵をスライムLv.1に固定する。
  // 進行済みデータでは通常抽選に戻す。
  return state.level === 1 && state.defeated === 0 && state.xp === 0 && !state.enemy;
}
function makeFirstEnemy(){
  const slime = ENEMIES.find(e => e.id === 'slime') || ENEMIES[0];
  return {...slime, level:1};
}

function pickEnemy(){
  let r=Math.random(), acc=0;
  for(const b of bosses){ acc += b.bossChance; if(r < acc) return {...b}; }
  return {...normals[Math.floor(Math.random()*normals.length)]};
}
function makeScaledEnemy(base, forceLevel=null){
  const e = {...base};
  if(e.id === 'dark_sword_saint' && forceLevel == null){ forceLevel = Math.max(1, Math.floor(state.darkSwordSaintLevel || 1)); }
  const bossBonus = e.type==='ボス' || e.type==='裏ボス' ? 4 : 0;
  if(forceLevel){
    e.level = forceLevel;
  }else if(state.enemyLevelBase != null){
    const progress = Math.max(0, Math.floor(((state.defeated||0) - (state.enemyLevelBaseDefeated||0)) / 3));
    e.level = Math.max(1, Math.floor(state.enemyLevelBase) + progress + bossBonus);
  }else{
    e.level = Math.max(1, state.level + Math.floor(state.defeated/3) + bossBonus);
  }
  if(e.id !== 'dark_sword_saint' && calcStats && calcStats().humbleRing){
    if(state.humbleEnemyFixedLevel == null) state.humbleEnemyFixedLevel = Math.max(1, e.level || state.level || 1);
    e.level = Math.max(1, Math.floor(state.humbleEnemyFixedLevel));
  }else{
    state.humbleEnemyFixedLevel = null;
  }
  const scaledDefeated = state.enemyLevelBase != null ? Math.max(0, (state.defeated||0) - (state.enemyLevelBaseDefeated||0)) : (state.defeated||0);
  const scale=1 + e.level*.035 + Math.floor(scaledDefeated/10)*.03;
  e.maxHp=Math.max(1, Math.floor(e.hp * scale * 0.1)); e.atk=Math.floor(e.atk*scale); e.def=Math.floor(e.def*scale);
  e.xp=Math.floor(e.xp*(1+e.level*.045));
  return e;
}
function setEnemy(e){
  state.deathDanceBattleCount = 0;
  state.darkShieldStacks = 0;
  state.enemy=e; state.enemyHp=e.maxHp; state.enemyStatuses = makeEmptyEnemyStatuses(performance.now());
  if(isDarkSwordSaint(e)){
    state.enemyStatuses.darkAuraStacks = 10;
    state.enemyStatuses.darkAuraLastTick = performance.now();
    state.enemyStatuses.darkSwordBuffs = [];
    state.enemyStatuses.darkDanceCount = 0;
    state.enemyStatuses.darkOneDamageCount = 0;
    state.enemyStatuses.darkTechniqueAwakened = false;
    setBgmMode('dark_sword_saint');
  }else{
    setBgmMode('normal');
  }
  markEnemySeen(e);
  els.enemyImg.src=e.img; els.enemyCard.className='card enemy-card enter';
  setTimeout(()=>els.enemyCard.classList.remove('enter'),600);
  renderBattle();
  log(`${e.name} が現れた。${e.type==='ボス'||e.type==='裏ボス'?'ボス出現！':''}`, e.type==='ボス'||e.type==='裏ボス'?'danger':'');
}
function forceSpawnDarkSwordSaint(){
  // ver99.6: 即時召喚ではなく、次の敵として暗黒剣聖を予約する
  state.forceNextDarkSwordSaint = true;
  state.pendingDarkSwordSaintDelay = false;
  banner('次の敵に暗黒剣聖をセット！', 1400);
  log('デバッグ：暗黒剣聖を次の敵にセット。現在の敵を倒すと出現する。', 'danger');
  renderAll();
  scheduleSave();
}
function spawnEnemy(forceFirst=false){
  let base;
  if(!forceFirst && state.forceNextDarkSwordSaint){
    base = DARK_SWORD_SAINT;
    state.forceNextDarkSwordSaint = false;
    log('100連勝の気配に、暗黒剣聖が現れた。', 'danger');
    banner('暗黒剣聖出現！', 1800);
  }else{
    base=forceFirst ? makeFirstEnemy() : pickEnemy();
  }
  const e = makeScaledEnemy(base, forceFirst ? 1 : null);
  setEnemy(e);
}

function loop(now){
  if(state.defeatSequence){ requestAnimationFrame(loop); return; }
  if(state.deathDanceCutin && !state.darkSwordCutinActive){ requestAnimationFrame(loop); return; }
  if(state.deathDance && now > state.deathDanceUntil) endDeathDance();
  processStatusDots(now);
  if(state.down){
    const left=Math.max(0, Math.ceil((state.downUntil-now)/1000));
    els.downCount.textContent=left;
    if(now >= state.downUntil) revive();
    requestAnimationFrame(loop); return;
  }
  if(state.enemy){
    const interval = state.deathDance ? 360 : 1150;
    if(now - state.lastHeroAttack > interval){ heroAttack(now); }
    if(now - state.lastEnemyAttack > enemyInterval()){ enemyAttack(now); }
  }
  if(state.deathDance){
    const target=maxHp()*0.5;
    if(state.hp < target){ state.hp=Math.min(target, state.hp + maxHp()/600); renderBattle(); }
  }
  requestAnimationFrame(loop);
}
function enemyInterval(){ return (state.enemy?.type==='ボス' || state.enemy?.type==='裏ボス') ? 1350 : 1700; }

function heroAttack(now){
  state.lastHeroAttack=now;
  const skill = state.deathDance ? 'deathdance' : 'slash';
  els.heroCard.classList.remove('attack'); void els.heroCard.offsetWidth; els.heroCard.classList.add('attack');
  // v70: 攻撃開始時にも短い斬撃SEを鳴らし、自動攻撃でも確実に聞こえるようにする。
  playSfx(skill==='deathdance'?'dance':'slash');
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
  if(element==='dark') return '暗黒';
  return '通常';
}
function applyHeroHit(skill){
  if(!state.enemy) return;
  if(isDarkSwordSaintReviving()){ showFloat('無効','guard'); renderBattle(); return; }
  const st=calcStats(); let mult=1, element='physical', fx='slash', label='斬撃';
  // 属性仕様：通常斬撃/連続攻撃/大攻撃は物理。炎斬りは火、雷撃は雷。
  if(skill==='fire'){mult=1.45;element='fire';fx='fire';label='炎斬り'}
  if(skill==='thunder'){mult=1.35;element='thunder';fx='thunder';label='雷撃'}
  if(skill==='multi'){mult=.72;element='physical';fx='slash';label='連続攻撃'}
  if(skill==='heavy'){mult=2.25;element='physical';fx='heavy';label='大攻撃'}
  if(skill==='deathdance'){mult=0.95*Math.pow(2, Math.max(0, state.deathDanceBattleCount||0));element='physical';fx='slash';label='死線の剣舞'}
  if(element==='fire') mult *= (1 + st.fireDmg);
  if(element==='thunder') mult *= (1 + st.thunderDmg);
  let dmg=Math.max(1, Math.floor((st.atk*mult + rand(0,st.atk*.45)) - state.enemy.def*.45*enemyDefenseMultiplierFor(element)));
  const crit=Math.random()<st.crit;
  if(crit) dmg=Math.floor(dmg*1.85);
  if(state.debug.killEnemy){ dmg = state.enemyHp; }
  let absorbed=false, resisted=false;
  if(element==='fire' && state.enemy.fireAbsorb){ state.enemyHp=Math.min(state.enemy.maxHp, state.enemyHp + dmg); absorbed=true; }
  else {
    if(element==='fire' && state.enemy.fireResist){dmg=Math.floor(dmg*(1-state.enemy.fireResist)); resisted=true;}
    if(state.enemy?.bossBuff === 'apex') dmg = Math.max(1, Math.floor(dmg * 0.5));
    if(isDarkSwordSaint()){
      const auraReduce = Math.min(1, darkAuraStacks() * 0.10);
      dmg = Math.floor(dmg * (1 - auraReduce));
    }
    state.enemyHp=Math.max(0, state.enemyHp - dmg);
    // v95.9: スライムキング（酸ボディ）はHP0到達時点で即撃破確定。
    // 剣舞などの多段ヒット中でも、倒した後に反射が続かないようにする。
    if(state.enemy?.bossBuff === 'acid_body' && state.enemyHp <= 0){
      state.enemyHp = 0;
      state.enemy.dead = true;
      state.enemy.defeated = true;
      renderBattle();
      enemyDefeated();
      return;
    }
    if(state.enemy?.bossBuff === 'acid_body' && dmg > 0 && !state.enemy.dead && !state.enemy.defeated){
      const ref = Math.max(1, Math.floor(dmg * 0.10));
      state.hp = Math.max(0, state.hp - ref);
      showHeroFloat(`反射 ${ref}`, 'acid');
      if(state.hp <= 0){ if(tryHeroDeathDance()) return; handleHeroDeath(); return; }
    }
    if(state.enemy?.bossBuff === 'spirit_king'){ addBurn('hero'); log('精霊王の炎が騎士に火傷を刻んだ。','danger'); }
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
  tryApplyHeroHitDebuffs(element, absorbed, skill);
  if(!absorbed && (skill==='fire'||skill==='thunder'||skill==='heavy'||skill==='deathdance')) log(`${label}（${elementName(element)}）！ ${dmg}ダメージ`, 'skilllog');
  if(st.lifeSteal && !absorbed){
    const heal=Math.floor(dmg*st.lifeSteal); if(heal>0){state.hp=Math.min(maxHp(),state.hp+heal); showHeroFloat(`+${heal}`,'heal')}
  }
  if(state.enemyHp<=0){
    state.enemyHp = 0;
    renderBattle();
    if(tryDarkSwordDanceRevive()) return;
    setTimeout(enemyDefeated, 120);
    return;
  }
  renderBattle();
}
function enemyAttack(now){
  state.lastEnemyAttack=now;
  const e=state.enemy, st=calcStats();
  if(isDarkSwordSaint() && state.enemyStatuses?.darkTechniqueAwakened){
    startDarkSwordTechnique(false);
    renderBattle();
    return;
  }
  let element = isDarkSwordSaint() ? 'dark' : (e.element==='fire' && Math.random()<.55 ? 'fire':'normal');
  let name = element==='dark' ? '暗黒攻撃' : (e.enemySkill && element==='fire' ? e.enemySkill:'攻撃');
  if(Math.random()<st.guard){ showHeroFloat('GUARD','guard'); playSfx('guard'); log(`${e.name} の${name}をGUARD！`,'good'); return; }
  let atk = e.atk * (1 + darkSwordBuffCount() * 0.5);
  let dmg=Math.max(1, Math.floor(atk - st.def*.55*heroDefenseMultiplier() + rand(0,atk*.35)));
  if(state.debug.killHero){ dmg = Math.max(dmg, state.hp + 999999); }
  if(element==='fire') dmg=Math.floor(dmg*(1-st.fireRes));
  dmg = applyDarkShieldToDamage(dmg);
  // 暗黒剣舞はガード無効。主人公の剣舞中でも防御扱いにしない。
  if(state.hp - dmg <= 0){
    if(tryHeroDeathDance()) return;
    state.hp=0; renderBattle(); handleHeroDeath(); return;
  }
  state.hp=Math.max(0,state.hp-dmg);
  if(element==='fire' && st.fireDamageHeal){
    const heal=Math.floor(dmg*st.fireDamageHeal);
    if(heal>0){ state.hp=Math.min(maxHp(), state.hp+heal); showHeroFloat(`+${heal}`,'heal'); log(`炎属性被ダメ回復 +${heal}`,'good'); }
  }
  els.heroCard.classList.remove('hit'); void els.heroCard.offsetWidth; els.heroCard.classList.add('hit');
  setTimeout(()=>els.heroCard.classList.remove('hit'),220);
  showHeroFloat(dmg, element==='fire'?'fire':(element==='dark'?'dark':'damage')); playSfx('hit');
  tryApplyEnemyHitDebuffs(element);
  if(isDarkSwordSaint()){
    ensureStatusContainers();
    if(!state.enemyStatuses.darkTechniqueAwakened && element === 'dark' && dmg === 1){
      state.enemyStatuses.darkOneDamageCount = (state.enemyStatuses.darkOneDamageCount || 0) + 1;
      if(state.enemyStatuses.darkOneDamageCount >= 20){
        state.enemyStatuses.darkTechniqueAwakened = true;
        state.enemyStatuses.darkOneDamageCount = 20;
        log('1ダメージを20回見切った。暗黒剣聖が暗黒剣技へ覚醒！','danger');
        setTimeout(()=>startDarkSwordTechnique(true), 80);
      }
    }
  }
  log(`${e.name} の${name}！ ${dmg}ダメージ`, element==='fire'?'danger':'');
  renderBattle();
}
function clearDarkSwordTimers(){
  if(state.darkSwordReviveTimer){
    clearTimeout(state.darkSwordReviveTimer);
    clearInterval(state.darkSwordReviveTimer);
    state.darkSwordReviveTimer = null;
  }
  if(state.darkSwordComboTimers && state.darkSwordComboTimers.length){
    state.darkSwordComboTimers.forEach(id=>clearTimeout(id));
    state.darkSwordComboTimers = [];
  }
}
function confirmDarkSwordDefeat(){
  if(!isDarkSwordSaint()) return;
  ensureStatusContainers();
  state.enemyStatuses.darkDeadConfirmed = true;
  state.enemyStatuses.darkRevivingUntil = 0;
  state.enemyStatuses.darkReviveStart = 0;
  state.darkSwordCutinActive = false;
  state.deathDanceCutin = false;
  clearDarkSwordTimers();
  hideDeathDanceCutin();
}

function tryDarkSwordDanceRevive(){
  if(!isDarkSwordSaint()) return false;
  ensureStatusContainers();
  if(state.enemyStatuses.darkDeadConfirmed) return false;
  const count = state.enemyStatuses.darkDanceCount || 0;
  if(count >= 10){ confirmDarkSwordDefeat(); return false; }
  const chance = darkDanceChanceForNext();
  if(Math.random() * 100 >= chance){
    log(`暗黒剣舞は不発。暗黒剣聖を超えた！`, 'good');
    confirmDarkSwordDefeat();
    return false;
  }

  const t = performance.now();
  state.enemyStatuses.darkDanceCount = count + 1;
  // ver99.6: 暗黒剣舞発動時、主人公の死線の剣舞発動回数と剣舞状態を必ずリセット
  state.deathDanceBattleCount = 0;
  state.deathDanceComboCount = 0;
  state.deathDance = false;
  state.deathDanceUntil = 0;
  if(els.deathAura) els.deathAura.classList.add('hidden');
  if(els.deathDanceStatus) els.deathDanceStatus.classList.add('hidden');
  state.enemyStatuses.darkReviveStart = 0;
  state.enemyStatuses.darkRevivingUntil = t + 9000;
  state.enemyHp = 0;
  state.deathDanceCutin = true;
  state.darkSwordCutinActive = true;
  state.lastHeroAttack = t - 9999;
  state.lastEnemyAttack = t - 9999;

  if(state.darkSwordReviveTimer) clearInterval(state.darkSwordReviveTimer);
  renderBattle();
  banner('暗黒剣舞！', 1200);
  log(`暗黒剣舞発動！ カットイン後に5秒間無敵化し、HPを回復する！（${state.enemyStatuses.darkDanceCount}回目）`, 'danger');
  showDarkSwordDanceCutin();

  state.darkSwordReviveTimer = setTimeout(()=>{
    if(!isDarkSwordSaint() || state.enemyStatuses?.darkDeadConfirmed){
      state.darkSwordReviveTimer = null;
      return;
    }
    hideDeathDanceCutin();
    state.deathDanceCutin = false;
    state.darkSwordCutinActive = false;
    // カットインが消えた直後から、回復待ち時間中にも暗黒剣舞の連続攻撃を開始する。
    darkSwordDanceCombo('recovering');
    const recoveryStart = performance.now();
    state.enemyStatuses.darkReviveStart = recoveryStart;
    state.enemyStatuses.darkRevivingUntil = recoveryStart + 5000;
    state.darkSwordReviveTimer = setInterval(()=>{
      if(!isDarkSwordSaint() || state.enemyStatuses?.darkDeadConfirmed){
        clearInterval(state.darkSwordReviveTimer);
        state.darkSwordReviveTimer = null;
        return;
      }
      const now = performance.now();
      const start = state.enemyStatuses.darkReviveStart || now;
      const p = Math.max(0, Math.min(1, (now - start) / 5000));
      state.enemyHp = Math.max(1, Math.floor(state.enemy.maxHp * p));
      renderBattle();
      if(p >= 1){
        clearInterval(state.darkSwordReviveTimer);
        state.darkSwordReviveTimer = null;
        finishDarkSwordDanceRevive();
      }
    }, 50);
  }, 4000);
  return true;
}
function finishDarkSwordDanceRevive(){
  if(!isDarkSwordSaint() || state.enemyStatuses?.darkDeadConfirmed) return;
  ensureStatusContainers();
  state.enemyHp = state.enemy.maxHp;
  state.enemyStatuses.darkRevivingUntil = 0;
  state.enemyStatuses.darkReviveStart = 0;
  state.enemyStatuses.darkAuraStacks = 10;
  state.enemyStatuses.darkAuraLastTick = performance.now();
  state.enemyStatuses.darkSwordBuffs.push(performance.now() + 60000);
  state.deathDanceCutin = false;
  state.darkSwordCutinActive = false;
  hideDeathDanceCutin();
  renderBattle();
  renderStatusLists();
  log(`闇オーラ10、暗黒の剣+1。暗黒剣舞はガード無効・防御力50%無視！`, 'danger');
  setTimeout(()=>darkSwordDanceCombo(), 120);
}

function startDarkSwordTechnique(showCutin=true){
  if(!isDarkSwordSaint() || state.enemyStatuses?.darkDeadConfirmed) return;
  state.lastEnemyAttack = performance.now();
  if(showCutin){
    state.darkSwordCutinActive = true;
    state.deathDanceCutin = true;
    renderBattle();
    banner('暗黒剣技！', 1000);
    log('暗黒剣技覚醒！ 以後、通常攻撃が暗黒剣技に変化する。', 'danger');
    showDarkSwordTechniqueCutin();
    setTimeout(()=>{
      if(!isDarkSwordSaint()) return;
      hideDeathDanceCutin();
      state.deathDanceCutin = false;
      state.darkSwordCutinActive = false;
      darkSwordDanceCombo('punish');
    }, 2200);
  }else{
    log('暗黒剣聖が暗黒剣技を放つ！', 'danger');
    darkSwordDanceCombo('punish');
  }
}
function darkSwordDanceCombo(mode='finish'){
  if(!isDarkSwordSaint() || state.enemyStatuses?.darkDeadConfirmed) return;
  const baseInterval = 500;
  const interval = Math.max(120, Math.floor(baseInterval / 3)); // 攻撃間隔を1/3にする3倍速
  const hitCount = mode === 'punish' ? 8 : Math.max(1, Math.floor(10000 / interval));
  log(mode === 'recovering' ? '暗黒剣舞の10秒連続攻撃が回復中に始まった！' : (mode === 'punish' ? '暗黒剣聖が暗黒剣技を放った！' : '暗黒剣舞の10秒追撃連続攻撃！'), 'danger');
  state.lastEnemyAttack = performance.now();
  if(!state.darkSwordComboTimers) state.darkSwordComboTimers = [];
  for(let i=0;i<hitCount;i++){
    const timerId = setTimeout(()=>applyDarkSwordDanceHit(i+1, hitCount, mode), i*interval);
    state.darkSwordComboTimers.push(timerId);
  }
}
function applyDarkSwordDanceHit(i, total, mode='finish'){
  if(!isDarkSwordSaint() || state.down || state.enemyStatuses?.darkDeadConfirmed) return;
  const e = state.enemy, st = calcStats();
  // 暗黒剣舞はガード無効・防御力50%無視。主人公の剣舞発動判定は通常通り行う。
  const atk = e.atk * (1 + darkSwordBuffCount() * 0.5);
  const effectiveDef = st.def * 0.50;
  let dmg = Math.max(1, Math.floor((atk*0.42 + rand(0, atk*0.12)) - effectiveDef*0.55*heroDefenseMultiplier()));
  // 1ヒット即死を防ぎ、連続攻撃として受ける形にする。デバッグ即死だけは維持。
  if(!state.debug.killHero){
    dmg = Math.min(dmg, Math.max(1, Math.floor(maxHp() * 0.35)));
  }else{
    dmg = Math.max(dmg, state.hp + 999999);
  }
  dmg = applyDarkShieldToDamage(dmg);
  els.enemyCard.classList.remove('attack'); void els.enemyCard.offsetWidth; els.enemyCard.classList.add('attack');
  setTimeout(()=>els.enemyCard.classList.remove('attack'),220);
  if(Math.random() < 0.50){ if(addBleed('hero')) log(`${mode==='punish'?'暗黒剣技':'暗黒剣舞'}で騎士は出血した。`,'danger'); }
  if(Math.random() < 0.50){ if(addDarkBleed()) log(`${mode==='punish'?'暗黒剣技':'暗黒剣舞'}で騎士に暗黒出血が刻まれた。`,'danger'); }
  if(state.hp - dmg <= 0){
    showHeroFloat(`${mode==='punish'?'暗黒剣技':'暗黒剣舞'} ${dmg}`,'dark');
    playSfx('hit');
    // 暗黒剣舞でも主人公側の剣舞発動チャンスを許可。双方の剣舞が被って発動できる。
    if(!state.debug.killHero && tryHeroDeathDance()){
      renderBattle();
      return;
    }
    state.hp = 0;
    renderBattle();
    handleHeroDeath();
    return;
  }
  state.hp = Math.max(0, state.hp - dmg);
  showHeroFloat(`${mode==='punish'?'暗黒剣技':'暗黒剣舞'} ${dmg}`,'dark');
  playSfx(i % 2 ? 'slash' : 'hit');
  if(i === total){
    if(isDarkSwordSaint() && state.enemyHp > 0 && !state.down) setBgmMode('dark_sword_saint');
  }
  renderBattle();
}
function showDarkSwordDanceCutin(){
  if(!els.deathDanceCutin) return;
  els.deathDanceCutin.classList.remove('hero-cutin');
  els.deathDanceCutin.classList.add('dark-cutin');
  if(els.deathDanceCutinImg) els.deathDanceCutinImg.src = DARK_SWORD_SAINT_CUTIN.img;
  if(els.deathDanceCutinQuote) els.deathDanceCutinQuote.textContent = DARK_SWORD_SAINT_CUTIN.quote;
  if(els.deathDanceCutinTitle) els.deathDanceCutinTitle.textContent = '暗黒剣舞';
  els.deathDanceCutin.classList.remove('hidden');
  void els.deathDanceCutin.offsetWidth;
  els.deathDanceCutin.classList.add('show');
  playSfx('cutin');
  playDarkSwordSaintVoice();
}

function showDarkSwordTechniqueCutin(){
  if(!els.deathDanceCutin) return;
  els.deathDanceCutin.classList.remove('hero-cutin');
  els.deathDanceCutin.classList.add('dark-cutin');
  if(els.deathDanceCutinImg) els.deathDanceCutinImg.src = DARK_SWORD_TECHNIQUE_CUTIN.img;
  if(els.deathDanceCutinQuote) els.deathDanceCutinQuote.textContent = DARK_SWORD_TECHNIQUE_CUTIN.quote;
  if(els.deathDanceCutinTitle) els.deathDanceCutinTitle.textContent = '暗黒剣技';
  els.deathDanceCutin.classList.remove('hidden');
  void els.deathDanceCutin.offsetWidth;
  els.deathDanceCutin.classList.add('show');
  playSfx('cutin');
}
function enemyDefeated(){
  const e=state.enemy;
  if(e && e.id === 'dark_sword_saint'){
    if(state.enemyStatuses){ state.enemyStatuses.darkDeadConfirmed=true; state.enemyStatuses.darkRevivingUntil=0; state.enemyStatuses.darkReviveStart=0; }
    clearDarkSwordTimers();
    state.darkSwordCutinActive=false;
    state.deathDanceCutin=false;
    hideDeathDanceCutin();
    setBgmMode('normal');
  }
  state.enemy=null;
  els.enemyCard.classList.add('dead');
  state.defeated++;
  state.winStreak = Math.max(0, Math.floor(state.winStreak||0)) + 1;
  state.bestWinStreak = Math.max(state.bestWinStreak||0, state.winStreak);
  if(e && e.id === 'dark_sword_saint'){
    state.darkSwordSaintKills = Math.max(0, Math.floor(state.darkSwordSaintKills||0)) + 1;
    state.darkSwordSaintLevel = Math.max(1, Math.floor(state.darkSwordSaintLevel||1)) + 1;
  }else if(state.winStreak >= 100){
    state.forceNextDarkSwordSaint = true;
    state.winStreak = 0;
    log('100連勝達成！ 5秒後に暗黒剣聖が確定出現する。','danger');
    banner('100連勝達成！', 5000);
    state.pendingDarkSwordSaintDelay = true;
  }
  markEnemyDefeated(e);
  const xpMult = 1 + Math.max(0, (e.level || 1) - 1) * 0.08;
  const gainXp = Math.max(1, Math.floor(e.xp * xpMult));
  state.lastXpGain = gainXp; state.xp += gainXp;
  if(e && e.id === 'dark_sword_saint'){
    const legendary = rarities.find(r=>r.id==='legendary') || rarities[rarities.length-1];
    const darkPool = [makeDarkHolySword, makeDarkShield, makeDarkAmulet, makeDarkArmor, makeDarkGauntlets, makeDarkHelm, makeDarkBoots];
    const darkReward = darkPool[Math.floor(Math.random()*darkPool.length)](state.level);
    const rewards = [];
    for(let i=0;i<2;i++) rewards.push(makeItem(slots[Math.floor(Math.random()*slots.length)], legendary, {isBossDrop:true}));
    rewards.push(darkReward); // 闇シリーズは3枠目で通知・ドロップ
    for(let i=rewards.length-1;i>=0;i--) state.inventory.unshift(rewards[i]);
    log('暗黒剣聖討伐報酬：レジェンダリー確定装備×2、3枠目に闇シリーズ装備！','good');
    showDropSequence(rewards);
  }else if(Math.random()<.38){ const it=makeRandomItem(e?.type==='ボス'); state.inventory.unshift(it); logItemDrop(it); showDropToast(it); }
  if(Math.random()<.22){ const m=randInt(1,3); state.mats += m; log(`強化石+${m} を獲得。`,'good'); }
  if(calcStats().masterRegen && state.hp > 0){
    const heal = Math.max(1, Math.floor(maxHp() * 0.25));
    const beforeHp = state.hp;
    state.hp = Math.min(maxHp(), state.hp + heal);
    if(state.hp > beforeHp){ showHeroFloat(`+${Math.floor(state.hp-beforeHp)}`, 'heal'); log(`師匠のアミュレット：撃破時HP${Math.floor(state.hp-beforeHp).toLocaleString()}回復。`,'good'); }
  }
  log(`${e.name} を撃破！ 経験値+${gainXp}`,'good'); playSfx('win');
  checkLevelUp(); renderAll(); scheduleSave();
  const nextDelay = state.pendingDarkSwordSaintDelay ? 5000 : 850;
  state.pendingDarkSwordSaintDelay = false;
  setTimeout(spawnEnemy,nextDelay);
}
function checkLevelUp(){
  while(state.xp>=state.xpNext){ state.xp-=state.xpNext; state.level++; state.xpNext=Math.floor(state.xpNext*1.42+40); state.hp=maxHp(); showLevelUp(); log(`LEVEL UP！ Lv.${state.level}`,'good'); }
}
function showLevelUp(){ els.levelEffect.classList.remove('hidden'); playSfx('level'); setTimeout(()=>els.levelEffect.classList.add('hidden'),1150); }
function startDown(){
  handleHeroDeath();
}
function revive(){
  state.down=false;
  if(els.heroCard) els.heroCard.classList.remove('down');
  if(els.downOverlay) els.downOverlay.classList.add('hidden');
}
function clearDeathDanceSequence(){
  clearTimeout(state.deathDanceCutinTimer);
  (state.deathDanceSeqTimers||[]).forEach(t=>clearTimeout(t));
  state.deathDanceSeqTimers=[];
  const hb=document.getElementById('deathDanceHeartbeat');
  if(hb) hb.remove();
}
function queueDeathDanceStep(fn, delay){
  const t=setTimeout(fn, delay);
  state.deathDanceSeqTimers.push(t);
  return t;
}
function showDeathDanceHeartbeat(text='ドクン…'){
  let hb=document.getElementById('deathDanceHeartbeat');
  if(!hb){
    hb=document.createElement('div');
    hb.id='deathDanceHeartbeat';
    hb.className='death-dance-heartbeat';
    document.body.appendChild(hb);
  }
  hb.textContent=text;
  hb.classList.remove('show');
  void hb.offsetWidth;
  hb.classList.add('show');
  // v68: ドクンドクン削除に合わせて心音SEは鳴らさない。
}
function startDeathDance(){
  if(state.defeatSequence || state.down) return false;
  if(state.deathDance || (state.deathDanceCutin && !state.darkSwordCutinActive)) return true;
  clearDeathDanceSequence();
  state.hp = 1;
  state.deathDanceCutin = true;
  state.lastHeroAttack = performance.now();
  state.lastEnemyAttack = performance.now();
  renderBattle();
  banner('死線の剣舞！', 1000);
  log('死線の剣舞、発動寸前！','skilllog');

  // v67: バナー開始と同時に剣舞BGMへ切替。1秒後にカットイン＋セリフ＋剣舞ロゴを3秒表示し、表示開始と同時にシャキィンSE。
  queueDeathDanceStep(()=>{ setBgmMode('dance'); }, 0);
  queueDeathDanceStep(()=>showDeathDanceCutin(), 1000);
  state.deathDanceCutinTimer = queueDeathDanceStep(beginDeathDanceAfterCutin, 4000);
  return true;
}
function showDeathDanceCutin(){
  if(!els.deathDanceCutin) return;
  els.deathDanceCutin.classList.remove('dark-cutin');
  els.deathDanceCutin.classList.add('hero-cutin');
  const data = DEATH_DANCE_CUTINS[Math.floor(Math.random() * DEATH_DANCE_CUTINS.length)];
  if(els.deathDanceCutinImg) els.deathDanceCutinImg.src = data.img;
  if(els.deathDanceCutinQuote) els.deathDanceCutinQuote.textContent = data.quote;
  if(els.deathDanceCutinTitle) els.deathDanceCutinTitle.textContent = '死線の剣舞';
  els.deathDanceCutin.classList.remove('hidden');
  void els.deathDanceCutin.offsetWidth;
  els.deathDanceCutin.classList.add('show');
  playSfx('cutin');
}
function hideDeathDanceCutin(){
  if(!els.deathDanceCutin) return;
  els.deathDanceCutin.classList.remove('show');
  els.deathDanceCutin.classList.add('hidden');
  if(!state.darkSwordCutinActive){ els.deathDanceCutin.classList.remove('dark-cutin'); }
}
function beginDeathDanceAfterCutin(){
  if(state.defeatSequence || state.down){ clearDeathDanceSequence(); hideDeathDanceCutin(); return; }
  state.deathDanceCutin = false;
  state.deathDanceSeqTimers=[];
  const hb=document.getElementById('deathDanceHeartbeat'); if(hb) hb.remove();
  hideDeathDanceCutin();
  state.deathDance=true;
  state.deathDanceBattleCount = (state.deathDanceBattleCount || 0) + 1 + (calcStats().deathDanceCountBonus || 0);
  state.deathDanceUntil=performance.now()+Math.floor(10000 * (calcStats().deathDanceDurationMul || 1));
  state.hp=1;
  state.lastHeroAttack = performance.now() - 9999;
  state.lastEnemyAttack = performance.now();
  els.heroCard.classList.add('deathdance');
  els.deathAura.classList.remove('hidden');
  els.deathDanceStatus.classList.remove('hidden');
  renderStatusLists();
  playSfx('dance');
  setBgmMode('dance');
  log(`死線の剣舞発動！ 極限状態で連続攻撃。今回の戦闘中${state.deathDanceBattleCount}回目、威力${Math.pow(2,state.deathDanceBattleCount)}倍。`,'skilllog');
  renderBattle();
}
function endDeathDance(){
  state.deathDance=false;
  els.heroCard.classList.remove('deathdance');
  els.deathAura.classList.add('hidden');
  els.deathDanceStatus.classList.add('hidden');
  renderStatusLists();
  setBgmMode(isDarkSwordSaint() && state.enemyHp > 0 ? 'dark_sword_saint' : 'normal');
  banner('死線の剣舞 終了');
  log('死線の剣舞が終了。','skilllog');
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
function banner(text, duration=950){ els.centerBanner.textContent=text; els.centerBanner.classList.remove('hidden'); setTimeout(()=>els.centerBanner.classList.add('hidden'),duration); }


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
    if(!state.audio) return;
    const ctx = state.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.00001;
    o.connect(g); g.connect(state.masterGain || ctx.destination);
    const t = ctx.currentTime;
    o.start(t);
    o.stop(t + 0.03);
  }catch(e){}
}
function unlockSfxForIOS(){
  // iPhone/Safari対策：ミュート解除のユーザー操作中にSE経路も起こす。
  // ここで一度だけ極小音量の短い音を流しておくと、自動攻撃SEが後続で鳴りやすい。
  if(state.mobileMuted || !state.audio || !state.masterGain) return;
  try{
    const ctx = state.audio;
    if(ctx.state !== 'running') return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 880;
    g.gain.value = 0.00001;
    o.connect(g);
    g.connect(state.masterGain);
    const t = ctx.currentTime;
    o.start(t);
    o.stop(t + 0.04);
    state.audioUnlocked = true;
  }catch(e){}
}
function ensureBgmAudio(){
  if(!state.normalBgm){
    state.normalBgm = new Audio('Petals_on_the_Water.mp3');
    state.normalBgm.loop = true;
    state.normalBgm.preload = 'auto';
  }
  if(!state.swordDanceBgm){
    state.swordDanceBgm = new Audio('Steel_At_The_Gate.mp3');
    state.swordDanceBgm.loop = true;
    state.swordDanceBgm.preload = 'auto';
  }
  if(!state.darkSwordSaintBgm){
    state.darkSwordSaintBgm = new Audio('March_of_the_Iron_Saint.mp3');
    state.darkSwordSaintBgm.loop = true;
    state.darkSwordSaintBgm.preload = 'auto';
  }
  if(!state.darkSwordSaintVoice){
    state.darkSwordSaintVoice = new Audio('DarkKnigtVoice.mp3');
    state.darkSwordSaintVoice.loop = false;
    state.darkSwordSaintVoice.preload = 'auto';
  }
  updateBgmVolume();
}
function updateBgmVolume(){
  const v = state.mobileMuted ? 0 : Math.max(0, Math.min(2, state.volume)) * 0.05;
  if(state.normalBgm) state.normalBgm.volume = v;
  if(state.swordDanceBgm) state.swordDanceBgm.volume = v;
  if(state.darkSwordSaintBgm) state.darkSwordSaintBgm.volume = v;
  if(state.darkSwordSaintVoice) state.darkSwordSaintVoice.volume = state.mobileMuted ? 0 : Math.max(0, Math.min(2, state.volume)) * 0.25;
}
function safePlayAudio(a){
  if(!a || state.mobileMuted) return;
  try{
    const p = a.play();
    if(p && typeof p.catch === 'function') p.catch(()=>{});
  }catch(e){}
}
function playDarkSwordSaintVoice(){
  if(!state.audioUnlocked || state.mobileMuted) return;
  ensureBgmAudio();
  updateBgmVolume();
  if(!state.darkSwordSaintVoice) return;
  try{ state.darkSwordSaintVoice.pause(); state.darkSwordSaintVoice.currentTime = 0; }catch(e){}
  safePlayAudio(state.darkSwordSaintVoice);
}
function pauseNormalBgm(){
  if(state.normalBgm) state.normalBgm.pause();
}
function stopAllBgm(){
  stopBgm();
  if(state.normalBgm) state.normalBgm.pause();
  if(state.swordDanceBgm){ state.swordDanceBgm.pause(); state.swordDanceBgm.currentTime = 0; }
  if(state.darkSwordSaintBgm){ state.darkSwordSaintBgm.pause(); state.darkSwordSaintBgm.currentTime = 0; }
  if(state.darkSwordSaintVoice){ state.darkSwordSaintVoice.pause(); state.darkSwordSaintVoice.currentTime = 0; }
}

function stopHtmlAudio(a, reset=false){
  if(!a) return;
  try{ a.pause(); }catch(e){}
  if(reset){ try{ a.currentTime = 0; }catch(e){} }
}
function stopAllAudioForMute(){
  // iOS Safari対策：音量0だけでは鳴り続けることがあるため、再生自体を止める。
  stopBgm();
  ensureBgmAudio();
  stopHtmlAudio(state.normalBgm, false);
  stopHtmlAudio(state.swordDanceBgm, true);
  stopHtmlAudio(state.darkSwordSaintBgm, false);
  stopHtmlAudio(state.darkSwordSaintVoice, true);
  if(state.masterGain) state.masterGain.gain.value = 0;
  if(state.audio && state.audio.state === 'running'){
    try{ state.audio.suspend(); }catch(e){}
  }
}

function pauseBgmForPageHidden(){
  ensureBgmAudio();
  state.bgmPausedByVisibility = true;
  if(state.normalBgm) state.normalBgm.pause();
  if(state.swordDanceBgm) state.swordDanceBgm.pause();
  if(state.darkSwordSaintBgm) state.darkSwordSaintBgm.pause();
  if(state.darkSwordSaintVoice) state.darkSwordSaintVoice.pause();
}
function resumeBgmForPageVisible(){
  if(!state.bgmPausedByVisibility) return;
  state.bgmPausedByVisibility = false;
  if(!state.audioUnlocked || state.mobileMuted) return;
  playBgm();
}
function handlePageVisibility(){
  if(document.hidden) pauseBgmForPageHidden();
  else {
    if(state.mobileMuted) stopAllAudioForMute();
    else resumeBgmForPageVisible();
  }
}
function startAudio(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(C && !state.audio){
      state.audio=new C();
      state.masterGain=state.audio.createGain();
      state.masterGain.connect(state.audio.destination);
      applyVolume();
    }
    ensureBgmAudio();
    const unlock = () => {
      primeAudio();
      state.audioUnlocked = !state.audio || state.audio.state === 'running';
      if(state.audioUnlocked) unlockSfxForIOS();
      if(els.audioHint) els.audioHint.classList.add('hidden');
      if(state.audioUnlocked && !state.mobileMuted) playBgm();
    };
    if(state.audio && state.audio.state==='suspended'){
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
  updateBgmVolume();
}

function ensureSfxReady(){
  if(state.mobileMuted) return false;
  try{
    const C = window.AudioContext || window.webkitAudioContext;
    if(C && !state.audio){
      state.audio = new C();
      state.masterGain = state.audio.createGain();
      state.masterGain.connect(state.audio.destination);
      applyVolume();
    }
    if(state.audio && state.audio.state === 'suspended'){
      const p = state.audio.resume();
      if(p && typeof p.then === 'function'){
        p.then(()=>{ state.audioUnlocked = true; unlockSfxForIOS(); }).catch(()=>{});
      }
    }
    if(!state.audio || state.audio.state === 'running'){
      state.audioUnlocked = true;
      unlockSfxForIOS();
    }
    return !!state.audio && !!state.masterGain && state.audio.state === 'running' && !state.mobileMuted;
  }catch(e){
    return false;
  }
}

function tone(freq=440, dur=.08, type='sine', vol=.05, delay=0){
  if(!state.audio || !state.masterGain || state.mobileMuted) return;
  const ctx=state.audio;
  if(ctx.state === 'suspended'){
    try{ ctx.resume(); }catch(e){}
  }
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.value=freq; g.gain.value=0;
  o.connect(g); g.connect(state.masterGain);
  const t=ctx.currentTime + Math.max(0, delay);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime(vol,t+.008);
  g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.025,dur));
  o.start(t); o.stop(t+dur+.03);
}

function noiseBurst(dur=.06, vol=.025, delay=0, filterFreq=1400){
  if(!state.audio || !state.masterGain || state.mobileMuted) return;
  const ctx=state.audio;
  if(ctx.state === 'suspended'){
    try{ ctx.resume(); }catch(e){}
  }
  const len=Math.max(1, Math.floor(ctx.sampleRate*dur));
  const buffer=ctx.createBuffer(1,len,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<len;i++) data[i]=(Math.random()*2-1)*(1-i/len);
  const src=ctx.createBufferSource();
  const filter=ctx.createBiquadFilter();
  const g=ctx.createGain();
  filter.type='highpass'; filter.frequency.value=filterFreq;
  g.gain.value=vol;
  src.buffer=buffer;
  src.connect(filter); filter.connect(g); g.connect(state.masterGain);
  const t=ctx.currentTime + Math.max(0, delay);
  src.start(t);
}

const SFX_VOL = 0.5;
const SFX_COMBAT_VOL = 0.25;
function sv(v, kind){
  const combatKinds = new Set(['slash','fire','thunder','heavy','hit','guard','dance']);
  const rate = combatKinds.has(kind) ? SFX_COMBAT_VOL : SFX_VOL;
  return Math.max(0, Math.min(1, v * rate));
}

function playSfx(kind){
  if(!ensureSfxReady()) return;
  // v73: BGMは5%。戦闘SEは常時25%、UI/演出SEは50%。
  switch(kind){
    case 'slash':
      noiseBurst(.075, sv(.18, kind), 0, 1700);
      tone(720,.065,'triangle',sv(.28, kind),0);
      tone(1180,.055,'triangle',sv(.18, kind),.045);
      break;
    case 'fire':
      noiseBurst(.14, sv(.18, kind), 0, 550);
      tone(170,.18,'sawtooth',sv(.25, kind),0);
      tone(420,.10,'sawtooth',sv(.16, kind),.055);
      break;
    case 'thunder':
      noiseBurst(.09, sv(.20, kind),0,2200);
      tone(95,.09,'square',sv(.24, kind),0);
      tone(1480,.06,'square',sv(.18, kind),.045);
      break;
    case 'heavy':
      noiseBurst(.13, sv(.24, kind),0,850);
      tone(120,.20,'sawtooth',sv(.30, kind),0);
      tone(70,.14,'square',sv(.18, kind),.08);
      break;
    case 'hit':
      noiseBurst(.055,sv(.12, kind),0,700);
      tone(170,.065,'square',sv(.18, kind),0);
      break;
    case 'guard':
      tone(520,.08,'triangle',sv(.22, kind),0);
      tone(390,.07,'triangle',sv(.16, kind),.045);
      break;
    case 'win':
      tone(740,.11,'sine',sv(.18, kind),0);
      tone(980,.13,'sine',sv(.16, kind),.09);
      break;
    case 'level':
      tone(660,.11,'triangle',sv(.22, kind),0);
      tone(880,.14,'triangle',sv(.20, kind),.09);
      tone(1320,.17,'sine',sv(.16, kind),.18);
      break;
    case 'down':
      tone(110,.28,'sawtooth',sv(.22, kind),0);
      tone(80,.22,'sawtooth',sv(.16, kind),.12);
      break;
    case 'dance':
      noiseBurst(.11,sv(.18, kind),0,1600);
      tone(360,.18,'sawtooth',sv(.26, kind),0);
      tone(720,.13,'triangle',sv(.18, kind),.08);
      break;
    case 'cutin':
      noiseBurst(.12,sv(.26, kind),0,2500);
      tone(960,.16,'sawtooth',sv(.34, kind),0);
      tone(420,.18,'triangle',sv(.24, kind),.12);
      tone(1280,.12,'sine',sv(.20, kind),.22);
      break;
    default:
      tone(520,.055,'triangle',sv(.14, kind),0);
  }
}

function playUiClick(){
  if(!ensureSfxReady()) return;
  tone(520,.045,'triangle',sv(.12, 'ui'));
}
function stopBgm(){
  // 旧オシレーターBGM用の停止処理。HTMLAudio BGMは止めない。
  if(state.bgmTimer){ clearInterval(state.bgmTimer); state.bgmTimer=null; }
}
function setBgmMode(mode){
  state.bgmMode = mode || 'normal';
  if(!state.audioUnlocked || state.mobileMuted) return;
  playBgm();
}
function playBgm(){
  if(!state.audioUnlocked || state.mobileMuted) return;
  ensureBgmAudio();
  updateBgmVolume();
  stopBgm();
  if(state.bgmMode === 'dance'){
    if(state.normalBgm) state.normalBgm.pause();
    if(state.darkSwordSaintBgm) state.darkSwordSaintBgm.pause();
    if(state.swordDanceBgm){
      // 剣舞BGM再生中にメニュー/ボタン操作で startAudio() や playBgm() が再実行されても、
      // currentTime を 0 に戻さない。未再生・停止中の時だけ先頭から再生する。
      if(state.swordDanceBgm.ended || (state.swordDanceBgm.paused && (!state.swordDanceBgm.currentTime || state.swordDanceBgm.currentTime <= 0.05))){
        try{ state.swordDanceBgm.currentTime = 0; }catch(e){}
      }
      safePlayAudio(state.swordDanceBgm);
    }
  }else if(state.bgmMode === 'dark_sword_saint'){
    if(state.normalBgm) state.normalBgm.pause();
    if(state.swordDanceBgm){ state.swordDanceBgm.pause(); try{ state.swordDanceBgm.currentTime = 0; }catch(e){} }
    if(state.darkSwordSaintBgm){
      if(state.darkSwordSaintBgm.ended || (state.darkSwordSaintBgm.paused && (!state.darkSwordSaintBgm.currentTime || state.darkSwordSaintBgm.currentTime <= 0.05))){
        try{ state.darkSwordSaintBgm.currentTime = 0; }catch(e){}
      }
      safePlayAudio(state.darkSwordSaintBgm);
    }
  }else{
    if(state.swordDanceBgm){ state.swordDanceBgm.pause(); try{ state.swordDanceBgm.currentTime = 0; }catch(e){} }
    if(state.darkSwordSaintBgm){ state.darkSwordSaintBgm.pause(); try{ state.darkSwordSaintBgm.currentTime = 0; }catch(e){} }
  if(state.darkSwordSaintVoice){ state.darkSwordSaintVoice.pause(); try{ state.darkSwordSaintVoice.currentTime = 0; }catch(e){} }
    safePlayAudio(state.normalBgm);
  }
}



function makeDarkHolySword(levelOverride){
  const lv = Math.max(1, Math.floor(levelOverride || state.level || 1));
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('武器', legendary);
  it.name = '闇の聖剣';
  it.rarity = 'legendary';
  it.rarityName = 'レジェンダリー';
  it.specialFrame = 'darkholy';
  it.atk = Math.floor((34 + lv * 7) * legendary.mult);
  it.crit = Math.max(it.crit||0, 0.08);
  it.heroDarkBleedChance = 0.10;
  it.skill = {id:'multi', name:'連続攻撃', chance:1, element:'physical'};
  it.flavor = '暗黒剣聖を超えた証。通常攻撃と剣舞の1ヒットごとに暗黒出血を刻む。';
  return it;
}

function makeDarkShield(levelOverride){
  const lv = Math.max(1, Math.floor(levelOverride || state.level || 1));
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('盾', legendary);
  it.name = '闇の盾';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'darkholy';
  it.def = Math.floor((18 + lv * 5) * legendary.mult);
  it.hp = Math.floor((70 + lv * 14) * legendary.mult);
  it.darkShield = true;
  it.flavor = '毎ターン被ダメージ軽減+1%（最大50%）。受けたダメージの半分を回復。';
  return it;
}
function makeDarkAmulet(levelOverride){
  const lv = Math.max(1, Math.floor(levelOverride || state.level || 1));
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('アミュレット', legendary);
  it.name = '闇のアミュレット';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'darkholy';
  it.hp = Math.floor((90 + lv * 16) * legendary.mult);
  it.deathDanceChance = 0.25;
  it.darkAmulet = true;
  it.flavor = '死線の剣舞発動率+25%。死線の剣舞効果時間2倍。';
  return it;
}
function makeMasterAmulet(){
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('アミュレット', legendary);
  it.id = 'master_amulet_fixed';
  it.name = '師匠のアミュレット';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー';
  it.hp = 120;
  it.deathDanceChance = 0.10;
  it.masterRegen = true;
  it.unsellable = true;
  it.flavor = '師匠より託された護符。10秒ごとにHP回復（Lvで成長、最大10%）。敵撃破時HP25%回復。死線の剣舞発動率+10%。';
  return it;
}
function ensureStarterEquipment(force=false){
  const hasMaster = Object.values(state.equip||{}).some(it=>it && it.name==='師匠のアミュレット') || (state.inventory||[]).some(it=>it && it.name==='師匠のアミュレット');
  if(force || !hasMaster){
    if(!state.equip) state.equip = {};
    if(!state.equip['アミュレット']) state.equip['アミュレット'] = makeMasterAmulet();
    else state.inventory.unshift(makeMasterAmulet());
  }
}
function rollDeathDanceDropChance(isBossDrop){
  const r = Math.random();
  if(isBossDrop){
    if(r < 0.015) return randInt(20,25) / 100;
    if(r < 0.10) return randInt(11,19) / 100;
    if(r < 0.30) return randInt(1,10) / 100;
    return 0;
  }
  if(r < 0.12) return randInt(1,10) / 100;
  return 0;
}
function makeRandomItem(isBossDrop=false){
  const slot=slots[Math.floor(Math.random()*slots.length)];
  const r=Math.random(); const rarity = r<.70?rarities[0]:r<.94?rarities[1]:rarities[2];
  return makeItem(slot, rarity, {isBossDrop});
}
function makeItem(slot, rarity, opts={}){
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
  } else {
    it.def=Math.floor((8+lv*3)*m);
    it.hp=Math.floor((25+lv*8)*m);
    if(Math.random()<.5) it.fireRes=+(Math.random()*.08+.02).toFixed(3);
    if(rarity.id==='legendary' && Math.random()<.45) it.fireDamageHeal=.50;
  }
  applyNameBonus(it);
  normalizeGeneratedDeathDanceChance(it, !!opts.isBossDrop);
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


function normalizeGeneratedDeathDanceChance(it, isBossDrop=false){
  if(!it || !(it.slot==='リング' || it.slot==='アミュレット')) return it;
  if(it.specialFrame === 'darkholy' || it.name === '師匠のアミュレット') return it;
  const hadThemeBonus = (it.deathDanceChance||0) > 0;
  let rolled = rollDeathDanceDropChance(isBossDrop);
  if(hadThemeBonus && rolled <= 0){
    rolled = isBossDrop ? randInt(1,19)/100 : randInt(1,10)/100;
  }
  if(!isBossDrop && rolled > 0.10) rolled = 0.10;
  if(isBossDrop && rolled > 0.25) rolled = 0.25;
  it.deathDanceChance = rolled;
  return it;
}

function itemPower(it){return (it.atk||0)*3 + (it.def||0)*2 + (it.hp||0)*.25 + (it.fireRes||0)*400 + (it.fireDmg||0)*420 + (it.thunderDmg||0)*420 + (it.fireDamageHeal||0)*550 + (it.deathDanceChance||0)*700 + (it.deathDanceDefIgnore||0)*800 + (it.crit||0)*500 + (it.lifeSteal||0)*600 + (it.guard||0)*500 + (it.darkShield?2200:0) + (it.darkAmulet?1800:0) + (it.masterRegen?900:0) + it.level*15;}
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
function sellExpValue(it){
  const basePower = Math.max(1, Math.round(itemPower(it)));
  const special = ['fireDmg','thunderDmg','fireSkillChance','thunderSkillChance','fireDamageHeal','deathDanceChance','deathDanceDefIgnore','heroDarkBleedChance','lifeSteal','guard','crit'].reduce((sum,k)=>sum + Math.round((it[k]||0)*1000),0);
  const skillBonus = it.skill ? Math.round((it.skill.chance||0)*900) + (it.skill.id==='multi'?650:300) : 0;
  const rarityBonus = it.specialFrame==='darkholy' ? 5 : it.rarity==='legendary' ? 3.2 : it.rarity==='rare' ? 1.7 : 1;
  const enhanceBonus = 1 + (it.level||0) * 0.22;
  return Math.max(1, Math.floor((basePower + special + skillBonus) * rarityBonus * enhanceBonus * 0.12));
}
function sellSelectedRarities(){
  const targets=selectedSellRarities();
  if(targets.length===0){ log('売却対象のレアリティを選択して。','danger'); return; }

  const soldItems = state.inventory.filter(it => targets.includes(it.rarity) && !it.unsellable);
  state.inventory = state.inventory.filter(it => !(targets.includes(it.rarity) && !it.unsellable));
  const sold = soldItems.length;
  const gainedXp = soldItems.reduce((sum,it)=>sum + sellExpValue(it), 0);
  const label = targets.map(r => (rarities.find(x => x.id === r)?.name || r)).join('・');

  if(els.tooltip) els.tooltip.classList.add('hidden');
  if(sold){
    state.xp += gainedXp;
    state.lastXpGain = gainedXp;
    log(`${label}装備を${sold}個売却し、経験値+${gainedXp.toLocaleString()}に変換。`, 'good');
    checkLevelUp();
  }else{
    log(`${label}装備は倉庫にない。`, '');
  }
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
  it.hp=0; it.def=999; it.guard=.50; it.lifeSteal=.15; it.deathDanceChance=.25; it.deathDanceDefIgnore=.50; it.fireDmg=.35; it.thunderDmg=.35; it.fireSkillChance=.25; it.thunderSkillChance=.25;
  return it;
}

function renderAll(){ renderBattle(); renderStats(); renderEquip(); renderInventory(); }
function renderBattle(){
  installVersionLabel();
  const mh=maxHp(); els.heroLevel.textContent=`Lv.${state.level}`; els.heroHpFill.style.width=`${Math.max(0,state.hp/mh*100)}%`; els.heroHpText.textContent=`${Math.floor(state.hp)} / ${Math.floor(mh)}`;
  if(state.enemy){ els.enemyName.textContent=state.enemy.name; if(els.enemyLevel) els.enemyLevel.textContent=`Lv.${state.enemy.level||1}`; els.enemyTag.textContent=state.enemy.type==='ボス'?'BOSS':''; els.enemyHpFill.style.width=`${Math.max(0,state.enemyHp/state.enemy.maxHp*100)}%`; els.enemyHpText.textContent=`${Math.floor(state.enemyHp)} / ${state.enemy.maxHp}`; }
  if(els.chests) els.chests.textContent=state.chests; els.mats.textContent=state.mats;
  if(els.expFill){ els.expFill.style.width=`${Math.max(0,Math.min(100,state.xp/state.xpNext*100))}%`; els.expLabel.textContent=`Lv.${state.level} EXP ${state.xp} / ${state.xpNext}`; els.expGainLabel.textContent=formatExpDelta(state.lastXpGain); }
  if(state.deathDance){ els.deathDanceStatus.textContent = `死線の剣舞 残り${Math.max(0, Math.ceil((state.deathDanceUntil-performance.now())/1000))}秒`; }
  renderStatusLists();
}
function renderStats(){ const st=calcStats(); els.statLv.textContent=state.level; els.statXp.textContent=`${state.xp} / ${state.xpNext}`; els.statXpNext.textContent=state.xpNext; els.statXpGain.textContent=formatExpDelta(state.lastXpGain); els.statAtk.textContent=Math.floor(st.atk); els.statDef.textContent=Math.floor(st.def); els.statFireRes.textContent=`${Math.round(st.fireRes*100)}%`; renderMonsterRecords(); }
function renderMonsterRecords(){
  if(!els.monsterRecords) return;
  if(!state.enemyRecords) state.enemyRecords = {};
  els.monsterRecords.innerHTML = ENEMIES.map(e=>{
    const r = state.enemyRecords[e.id] || {seen:false,kills:0,maxDefeatLevel:0};
    const seen = !!r.seen;
    const name = seen ? e.name : '？？？';
    const kills = seen ? (Number(r.kills)||0) : '？';
    const maxLv = seen && Number(r.maxDefeatLevel) > 0 ? `Lv.${Number(r.maxDefeatLevel)}` : (seen ? '-' : '？');
    const type = seen ? e.type : '未遭遇';
    return `<div class="monster-record-row ${seen?'seen':'unknown'}"><b>${escapeHtml(name)}</b><span>${escapeHtml(type)}</span><em>討伐 ${kills}</em><strong>最高 ${maxLv}</strong></div>`;
  }).join('');
}
function itemFrameClass(it){ return it ? (it.specialFrame || it.rarity || '') : ''; }
function itemNameColor(it){ return it?.specialFrame === 'darkholy' ? '#b86cff' : rarityColor(it?.rarity); }
function renderEquip(){
  els.equipList.innerHTML='';
  slots.forEach(slot=>{ const it=state.equip[slot]; const div=document.createElement('div'); div.className='equip'+(it?` ${itemFrameClass(it)} ${it.rarity}`:'')+(state.selectedEquip===slot?' selected':''); div.innerHTML=it?`<b style="color:${itemNameColor(it)}">${slot}: ${it.name}+${it.level}</b><small>${itemSummary(it)}</small>`:`<b>${slot}: 未装備</b>`; div.onclick=()=>{state.selectedEquip=slot; renderEquip();}; if(it){ div.onmousemove=(e)=>showTip(e,it); div.onmouseleave=()=>els.tooltip.classList.add('hidden'); } els.equipList.appendChild(div); });
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
    div.className=`item ${it.rarity} ${itemFrameClass(it)}${selectedId===it.id?' selected-inventory':''}`;
    div.dataset.itemId = String(it.id);
    div.innerHTML=`<b style="color:${itemNameColor(it)}">${it.name}</b><span>${it.slot}</span>`;
    div.onpointerdown=(e)=>{ if(e.pointerType && e.pointerType !== 'mouse'){ setPointerMode('touch'); els.tooltip.classList.add('hidden'); } };
    const openItemMenu=(e)=>{ if(e){ e.preventDefault(); e.stopPropagation(); } els.tooltip.classList.add('hidden'); showInventoryActionMenu(it, div); };
    div.onclick=openItemMenu;
    div.onpointerup=(e)=>{ if(e.pointerType && e.pointerType !== 'mouse') openItemMenu(e); };
    div.ontouchend=openItemMenu;
    // PC/マウス操作: オンカーソルで装備情報を表示
    // タッチ操作: オンカーソル表示なし
    div.onpointerenter=(e)=>{
      if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); }
      else { setPointerMode('touch'); els.tooltip.classList.add('hidden'); }
    };
    div.onpointermove=(e)=>{
      if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); }
      else { setPointerMode('touch'); els.tooltip.classList.add('hidden'); }
    };
    // 古いブラウザ/通常マウスイベント用の保険
    div.onmousemove=(e)=>{ setPointerMode('mouse'); showTip(e,it); };
    div.onmouseleave=()=>{ if(state.inventoryMenuItemId!==it.id) els.tooltip.classList.add('hidden'); };
    els.inventory.appendChild(div);
    if(selectedId===it.id) setTimeout(()=>showInventoryActionMenu(it, div), 0);
  });
  if(els.openAllBtn){ els.openAllBtn.style.display='none'; }
  updateSellButtonState();
}
function selectedSellRarities(){
  const targets=[];
  if(els.sellNormalChk?.checked) targets.push('normal');
  if(els.sellRareChk?.checked) targets.push('rare');
  if(els.sellLegendaryChk?.checked) targets.push('legendary');
  return targets;
}
function updateSellButtonState(){
  if(!els.sellSelectedBtn) return;
  const targets = selectedSellRarities();
  const count = state.inventory.filter(it=>targets.includes(it.rarity) && !it.unsellable).length;
  els.sellSelectedBtn.disabled = targets.length === 0;
  els.sellSelectedBtn.textContent = `経験値化 (${count})`;
}
function cancelInventoryActionMenu(){
  const menu = document.getElementById('inventoryActionMenu');
  if(menu) menu.remove();
  state.inventoryMenuItemId = null;
  if(els.tooltip) els.tooltip.classList.add('hidden');
  document.querySelectorAll('.item.selected-inventory').forEach(el=>el.classList.remove('selected-inventory'));
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
  menu.style.width = width + 'px';
  if(isTouchDevice()){
    // タッチ端末ではカーソル位置表示にせず、画面下に固定表示する。
    menu.style.left = '50%';
    menu.style.right = 'auto';
    menu.style.top = 'auto';
    menu.style.bottom = '12px';
    menu.style.transform = 'translateX(-50%)';
  }else{
    let left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    let top = r.bottom + 6;
    menu.style.left = left + 'px';
    menu.style.right = 'auto';
    menu.style.top = top + 'px';
    menu.style.bottom = 'auto';
    menu.style.transform = 'none';
  }
  menu.classList.remove('hidden');
  if(!isTouchDevice()){
    requestAnimationFrame(()=>{
      const mr = menu.getBoundingClientRect();
      if(mr.bottom > window.innerHeight - 8){
        menu.style.top = Math.max(8, r.top - mr.height - 6) + 'px';
      }
    });
  }
  const bindMenuAction = (selector, fn) => {
    const btn = menu.querySelector(selector);
    if(!btn) return;
    let last = 0;
    const run = (e) => {
      if(e){ e.preventDefault(); e.stopPropagation(); }
      const n = performance.now ? performance.now() : Date.now();
      if(n - last < 350) return;
      last = n;
      playUiClick();
      fn();
    };
    btn.onclick = run;
    btn.onpointerup = run;
    btn.ontouchend = run;
  };
  bindMenuAction('[data-action="equip"]', ()=>{ cancelInventoryActionMenu(); equipItem(it); });
  bindMenuAction('[data-action="cancel"]', ()=>{ cancelInventoryActionMenu(); renderInventory(); });
  menu.onclick=(e)=>e.stopPropagation();
  menu.onpointerup=(e)=>e.stopPropagation();
  menu.ontouchend=(e)=>e.stopPropagation();
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
  if(it.skill?.id==='thunder')arr.push('雷撃:防御25%無視');
  if(it.skill?.id==='fire')arr.push('炎斬り:火傷20%');
  if(it.deathDanceChance)arr.push(`死線の剣舞率+${Math.round(it.deathDanceChance*100)}%`);
  if(it.deathDanceDefIgnore)arr.push(`剣舞時防御無視${Math.round(it.deathDanceDefIgnore*100)}%`);
  if(it.heroDarkBleedChance)arr.push(`通常攻撃/剣舞:暗黒出血${Math.round(it.heroDarkBleedChance*100)}%`);
  if(it.darkShield)arr.push('毎ターン被ダメ軽減+1%(最大50%) / 被ダメ50%回復');
  if(it.darkAmulet)arr.push('死線の剣舞効果時間2倍');
  if(it.masterRegen)arr.push(`10秒ごとにHP${(masterAmuletRegenRate()*100).toFixed(1)}%回復(最大10%) / 撃破時HP25%回復`);
  if(it.lifeSteal)arr.push(`吸収${Math.round(it.lifeSteal*100)}%`); if(it.guard)arr.push(`GUARD+${Math.round(it.guard*100)}%`); if(it.crit)arr.push(`会心+${Math.round(it.crit*100)}%`);
  if(it.skill)arr.push(`武器スキル:${it.skill.name} ${Math.round((it.skill.chance + (it.skill.id==='fire'?(it.fireSkillChance||0):it.skill.id==='thunder'?(it.thunderSkillChance||0):0))*100)}%`);
  if(it.flavor)arr.push(it.flavor);
  return arr.join(' / ');
}

function showTip(e,it){
  const current=state.equip[it.slot]; let html=`<b style="color:${itemNameColor(it)}">${it.name}+${it.level}</b><br>${it.slot} / ${it.rarityName}<br>${itemSummary(it)}<hr>`;
  html+= current ? `現在: ${current.name}+${current.level}<br>戦力差: ${Math.round(itemPower(it)-itemPower(current))}` : '現在: 未装備';
  els.tooltip.innerHTML=html; els.tooltip.style.left=(e.clientX+14)+'px'; els.tooltip.style.top=(e.clientY+14)+'px'; els.tooltip.classList.remove('hidden');
}

function escapeHtml(v){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function rarityColor(r){ return r==='darkholy' ? '#b86cff' : r==='legendary' ? '#ff9b24' : r==='rare' ? '#4d8dff' : '#eeeeee'; }
function logItemDrop(it){
  const color = itemNameColor(it);
  const rarity = it.rarityName || (rarities.find(r=>r.id===it.rarity)?.name || it.rarity);
  log(`装備ドロップ：<span class="log-item ${itemFrameClass(it)} ${it.rarity}" style="color:${color}">${escapeHtml(it.name)}</span> <span class="log-rarity ${itemFrameClass(it)} ${it.rarity}" style="color:${color}">${escapeHtml(rarity)}</span>`, 'good', true);
}

function showDropSequence(items){
  if(state.dropToastQueueTimers){ state.dropToastQueueTimers.forEach(t=>clearTimeout(t)); }
  state.dropToastQueueTimers = [];
  (items||[]).forEach((it,i)=>{
    const t=setTimeout(()=>{ logItemDrop(it); showDropToast(it); renderInventory(); scheduleSave(); }, i*3000);
    state.dropToastQueueTimers.push(t);
  });
}

function showDropToast(it){
  if(!els.dropToast) return;
  const color = itemNameColor(it);
  const rarity = it.rarityName || (rarities.find(r=>r.id===it.rarity)?.name || it.rarity);
  const summary = escapeHtml(itemSummary(it) || '追加能力なし');
  els.dropToast.innerHTML = `<span style="color:${color}">${escapeHtml(it.name)}</span><small style="color:${color}">${escapeHtml(rarity)}</small><em class="drop-performance">${summary}</em>`;
  els.dropToast.className = `drop-toast ${itemFrameClass(it)} ${it.rarity}`;
  clearTimeout(state.dropToastTimer);
  state.dropToastTimer = setTimeout(()=>els.dropToast.classList.add('hidden'), 3000);
}

function resetBattleState(forceFirst=false){
  // 戦闘中の一時状態を完全に初期化する。
  // 剣舞・DOWN・ドロップ表示などがリセット後に残らないようにする。
  state.forceFirstEnemy = true;
  clearTimeout(state.dropToastTimer);
  clearDeathDanceSequence();
  resetTransientStatuses();
  state.deathDanceCutin=false; state.darkSwordCutinActive=false; state.deathDance=false; state.down=false;
  state.bgmMode='normal'; stopAllBgm(); if(state.audioUnlocked && !state.mobileMuted) playBgm();
  hideDeathDanceCutin();
  if(els.deathDanceStatus) els.deathDanceStatus.classList.add('hidden');
  if(els.deathAura) els.deathAura.classList.add('hidden');
  if(els.downOverlay) els.downOverlay.classList.add('hidden');
  if(els.dropToast) els.dropToast.classList.add('hidden');
  if(els.centerBanner) els.centerBanner.classList.add('hidden');
  if(els.enemyEffectLayer) els.enemyEffectLayer.innerHTML = '';
  if(els.enemyFloats) els.enemyFloats.innerHTML = '';
  if(els.enemyCard){
    els.enemyCard.classList.remove('dead','hit','enter');
  }
  spawnEnemy(forceFirst);
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
  state.winStreak = 0;
  state.bestWinStreak = 0;
  state.forceNextDarkSwordSaint = false;
  state.darkSwordSaintLevel = 1;
  state.darkSwordSaintKills = 0;
  state.enemyLevelBase = null;
  state.enemyLevelBaseDefeated = 0;
  state.base = {hp:520, atk:48, def:14};
  state.hp = maxHp();
  state.forceFirstEnemy = true;
  state.log = [];
  state.debug = {killEnemy:false, killHero:false};
  state.enemyRecords = sanitizeEnemyRecords({});
  ensureStarterEquipment(true);
  resetTransientStatuses();
  if(els.debugKillEnemy) els.debugKillEnemy.checked = false;
  if(els.debugKillHero) els.debugKillHero.checked = false;
  if(els.log) els.log.innerHTML='';
  if(els.tooltip) els.tooltip.classList.add('hidden');

  resetBattleState(true);
  renderAll();
  log('ユーザーデータをリセットしました。スライム Lv.1 から再開します。');

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


/* v94: iPhone / iOS pointer operation stabilization */
function v94SafeStop(e){
  if(!e) return;
  try{ e.preventDefault(); }catch(_){ }
  try{ e.stopPropagation(); }catch(_){ }
}
function v94BindTap(el, handler){
  if(!el || el.__v94TapBound) return;
  el.__v94TapBound = true;
  el.onclick = null;
  let last = 0;
  const run = (e) => {
    const now = performance.now ? performance.now() : Date.now();
    if(now - last < 550){ v94SafeStop(e); return; }
    last = now;
    v94SafeStop(e);
    try{ startAudio && startAudio(); }catch(_){ }
    handler(e);
  };
  el.addEventListener('pointerup', run, {passive:false});
  el.addEventListener('touchend', run, {passive:false});
  el.addEventListener('click', run, {passive:false});
}
function v94CloseAllTransientPanels(){
  try{ hideStatusTooltip && hideStatusTooltip(); }catch(_){ }
  try{ hideStatusDetailPanel && hideStatusDetailPanel(); }catch(_){ }
  try{ closeStatusCardPopup && closeStatusCardPopup(); }catch(_){ }
  try{ cancelInventoryActionMenu && cancelInventoryActionMenu(); }catch(_){ }
  const cutins = document.querySelectorAll('.death-dance-cutin,.death-dance-heartbeat');
  cutins.forEach(el=>{ el.style.pointerEvents='none'; });
}
function v94InstallTouchControls(){
  const byId = (id)=>document.getElementById(id);
  v94BindTap(byId('equipToggleBtn'), () => {
    v94CloseAllTransientPanels();
    state.uiOpen = !state.uiOpen;
    els.sidePanel.classList.toggle('open', state.uiOpen);
    els.equipToggleBtn.textContent = isSpPortrait() ? (state.uiOpen ? '×' : '☰') : (state.uiOpen ? '閉じる' : 'メニュー');
    playUiClick();
  });
  v94BindTap(byId('debugBtn'), () => {
    v94CloseAllTransientPanels();
    els.debugPanel.classList.toggle('hidden');
    playUiClick();
  });
  v94BindTap(byId('muteBtn'), () => {
    setMobileMuted(!state.mobileMuted);
    if(!state.mobileMuted) startAudio();
    playUiClick();
  });
  v94BindTap(byId('debugClose'), () => { els.debugPanel.classList.add('hidden'); playUiClick(); });
  v94BindTap(byId('debugResetData'), () => { playUiClick(); resetUserData(); });
  v94BindTap(byId('debugAddChests'), () => { playUiClick(); for(let i=0;i<50;i++) state.inventory.unshift(makeRandomItem()); renderAll(); log('デバッグ：装備を50個追加。','good'); scheduleSave(); });
  if(byId('debugBestSword')) v94BindTap(byId('debugBestSword'), () => { playUiClick(); const it=makeDarkHolySword ? makeDarkHolySword(state.level) : makeDebugSword(); state.inventory.unshift(it); renderAll(); log('デバッグ：闇の聖剣を倉庫に追加。','good'); scheduleSave(); });
  if(byId('debugBestAccessory')) v94BindTap(byId('debugBestAccessory'), () => { playUiClick(); const a=makeDarkAmulet ? makeDarkAmulet(state.level) : makeDebugAccessory('アミュレット'); state.inventory.unshift(a); renderAll(); log('デバッグ：闇のアミュレットを倉庫に追加。','good'); scheduleSave(); });
  v94BindTap(byId('debugDarkSwordSaint'), () => { playUiClick(); forceSpawnDarkSwordSaint(); });
  document.querySelectorAll('.mobile-menu-tabs button').forEach(btn=>{
    v94BindTap(btn, () => { setMenuPage(btn.dataset.menuPage); playUiClick(); });
  });
  document.querySelectorAll('#creditBtn,#termsBtn,#privacyBtn,#legalModalClose').forEach(btn=>{
    const id = btn.id;
    v94BindTap(btn, () => {
      playUiClick();
      if(id==='creditBtn') openLegalModal('credit');
      else if(id==='termsBtn') openLegalModal('terms');
      else if(id==='privacyBtn') openLegalModal('privacy');
      else if(id==='legalModalClose') closeLegalModal();
    });
  });
  // iPhoneで透明要素がタップを奪わないようにする。
  // ただしPC/大画面ではsidePanelは常時表示なので pointer-events を消さない。
  const syncPanelPointerEvents = () => {
    if(els.debugPanel) els.debugPanel.style.pointerEvents = els.debugPanel.classList.contains('hidden') ? 'none' : 'auto';
    if(els.sidePanel){
      const overlayMenuMode = isSpPortrait() || window.innerWidth <= 900;
      els.sidePanel.style.pointerEvents = (!overlayMenuMode || els.sidePanel.classList.contains('open')) ? 'auto' : 'none';
    }
  };
  syncPanelPointerEvents();
  window.addEventListener('resize', syncPanelPointerEvents);
  const mo = new MutationObserver(syncPanelPointerEvents);
  if(els.debugPanel) mo.observe(els.debugPanel,{attributes:true,attributeFilter:['class']});
  if(els.sidePanel) mo.observe(els.sidePanel,{attributes:true,attributeFilter:['class']});
}

init();
setTimeout(v94InstallTouchControls, 0);


window.addEventListener("load",()=>{ state.mobileMuted = true; updateMuteButton(); applyVolume(); stopAllAudioForMute(); });
window.addEventListener("pageshow",()=>{ if(state.mobileMuted) stopAllAudioForMute(); });
window.addEventListener("focus",()=>{ if(state.mobileMuted) stopAllAudioForMute(); });


/* v95.1: visible build badge + inventory/menu touch fix */
function v951EnsureVersionBadge(){
  const text = 'ver.' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '99.6');
  document.querySelectorAll('.build-version,.debug-version').forEach(el=>{
    if(el.classList.contains('debug-version')) el.textContent = 'Build: ' + text;
    else el.textContent = text;
  });
  let fixed = document.getElementById('fixedBuildVersion');
  if(!fixed){
    fixed = document.createElement('div');
    fixed.id = 'fixedBuildVersion';
    fixed.className = 'fixed-build-version';
    document.body.appendChild(fixed);
  }
  fixed.textContent = text;
}
function v951InstallInventoryDelegation(){
  if(window.__v951InventoryDelegation) return;
  window.__v951InventoryDelegation = true;
  const openFromEvent = (e) => {
    const item = e.target?.closest ? e.target.closest('#inventory .item') : null;
    if(!item) return;
    const idx = Array.prototype.indexOf.call(els.inventory.children, item);
    const it = state.inventory[idx];
    if(!it) return;
    e.preventDefault();
    e.stopPropagation();
    els.tooltip?.classList.add('hidden');
    showInventoryActionMenu(it, item);
  };
  ['click','pointerup','touchend'].forEach(type=>{
    els.inventory?.addEventListener(type, openFromEvent, {capture:true, passive:false});
  });
}
function v951FinalFixes(){
  v951EnsureVersionBadge();
  v951InstallInventoryDelegation();
  if(els.sidePanel) els.sidePanel.style.pointerEvents = (isSpPortrait() || window.innerWidth <= 900) && !els.sidePanel.classList.contains('open') ? 'none' : 'auto';
}
setTimeout(v951FinalFixes, 50);
window.addEventListener('resize', v951FinalFixes);


/* v95.2: small-screen item menu, modal z-index, always-visible version badge */
function v952EnsureVersionBadge(){
  const text = 'ver.' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '99.6');
  let header = document.querySelector('.brand .build-version');
  const brand = document.querySelector('.brand');
  if(brand && !header){
    header = document.createElement('span');
    header.className = 'build-version';
    brand.appendChild(header);
  }
  if(header) header.textContent = text;
  document.querySelectorAll('.debug-version').forEach(el=>el.textContent='Build: '+text);
  let fixed = document.getElementById('fixedBuildVersion');
  if(!fixed){
    fixed = document.createElement('div');
    fixed.id = 'fixedBuildVersion';
    fixed.className = 'fixed-build-version';
    document.body.appendChild(fixed);
  }
  fixed.textContent = text;
  fixed.style.display = 'none';
  fixed.style.visibility = 'hidden';
  fixed.style.opacity = '0';
}
function v952OpenInventoryItemFromElement(itemEl, ev){
  if(!itemEl) return false;
  const id = itemEl.dataset ? itemEl.dataset.itemId : '';
  let it = id ? state.inventory.find(x=>String(x.id)===String(id)) : null;
  if(!it && els.inventory){
    const idx = Array.prototype.indexOf.call(els.inventory.children, itemEl);
    it = state.inventory[idx];
  }
  if(!it) return false;
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  els.tooltip?.classList.add('hidden');
  showInventoryActionMenu(it, itemEl);
  return true;
}
function v952OpenEquipSlotFromElement(equipEl, ev){
  if(!equipEl) return false;
  const idx = Array.prototype.indexOf.call(els.equipList.children, equipEl);
  const slot = slots[idx];
  if(!slot) return false;
  state.selectedEquip = slot;
  renderEquip();
  const it = state.equip[slot];
  if(!it) return true;
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  // 装備中アイテムは「強化」選択用のメニューとして表示する。
  let menu = document.getElementById('inventoryActionMenu');
  if(!menu){
    menu = document.createElement('div');
    menu.id = 'inventoryActionMenu';
    menu.className = 'inventory-action-menu';
    document.body.appendChild(menu);
  }
  menu.innerHTML = `<div class="inventory-action-title"><b>${escapeHtml(it.name)}+${it.level}</b><small>${escapeHtml(slot)} / ${escapeHtml(it.rarityName||it.rarity)}</small></div><div class="inventory-action-summary">${escapeHtml(itemSummary(it)||'追加能力なし')}<br>現在装備中</div><div class="inventory-action-buttons"><button type="button" data-action="upgrade">強化選択</button><button type="button" data-action="cancel">閉じる</button></div>`;
  const width = Math.min(320, window.innerWidth - 16);
  menu.style.width = width + 'px';
  if(isTouchDevice() || window.innerWidth <= 900){
    menu.style.left='50%'; menu.style.right='auto'; menu.style.top='auto'; menu.style.bottom='12px'; menu.style.transform='translateX(-50%)';
  }else{
    const r = equipEl.getBoundingClientRect();
    menu.style.left = Math.min(Math.max(8,r.left), window.innerWidth-width-8)+'px';
    menu.style.top = (r.bottom+6)+'px'; menu.style.right='auto'; menu.style.bottom='auto'; menu.style.transform='none';
  }
  menu.classList.remove('hidden');
  const bind=(sel,fn)=>{ const b=menu.querySelector(sel); if(!b) return; const run=(e)=>{ if(e){e.preventDefault();e.stopPropagation();} playUiClick(); fn();}; b.onclick=run; b.onpointerup=run; b.ontouchend=run; };
  bind('[data-action="upgrade"]',()=>{ state.selectedEquip=slot; cancelInventoryActionMenu(); renderEquip(); });
  bind('[data-action="cancel"]',()=>{ cancelInventoryActionMenu(); });
  menu.onclick=(e)=>e.stopPropagation(); menu.onpointerup=(e)=>e.stopPropagation(); menu.ontouchend=(e)=>e.stopPropagation();
  return true;
}
function v952InstallDelegatedMenus(){
  if(window.__v952DelegatedMenus) return;
  window.__v952DelegatedMenus = true;
  const handler = (e)=>{
    const target = e.target;
    if(!target || !target.closest) return;
    const actionMenu = target.closest('#inventoryActionMenu');
    if(actionMenu) return;
    const inv = target.closest('#inventory .item');
    if(inv){ v952OpenInventoryItemFromElement(inv,e); return; }
    const eq = target.closest('#equipList .equip');
    if(eq){ v952OpenEquipSlotFromElement(eq,e); return; }
  };
  ['pointerup','click','touchend'].forEach(type=>{
    document.addEventListener(type, handler, {capture:true, passive:false});
  });
}
function v952PatchLegalModal(){
  const openOrig = window.openLegalModal || openLegalModal;
  window.openLegalModal = function(kind){
    try{ if(els.sidePanel && (isSpPortrait() || window.innerWidth <= 900)){ state.uiOpen=false; els.sidePanel.classList.remove('open'); } }catch(_){ }
    openOrig(kind);
    if(els.legalModal){
      els.legalModal.classList.remove('hidden');
      els.legalModal.style.zIndex = '30000';
      els.legalModal.style.pointerEvents = 'auto';
    }
  };
}
function v952FinalFixes(){
  installVersionLabel();
  v952EnsureVersionBadge();
  v952InstallDelegatedMenus();
  if(!window.__v952LegalPatched){ window.__v952LegalPatched=true; v952PatchLegalModal(); }
}
setTimeout(v952FinalFixes, 80);
window.addEventListener('load', v952FinalFixes);
window.addEventListener('resize', v952FinalFixes);


/* v95.9: debug reset double-confirm prevention + final version badge */
(function(){
  const BUILD_TEXT = 'ver.' + (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  function forceBuildBadge(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent = BUILD_TEXT; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ' + BUILD_TEXT; });
    let fixed = document.getElementById('fixedBuildVersion');
    if(fixed){ fixed.textContent = BUILD_TEXT; }
  }
  function bindResetOnce(){
    const oldBtn = document.getElementById('debugResetData');
    if(!oldBtn || oldBtn.__v959ResetBound) return;
    const btn = oldBtn.cloneNode(true);
    btn.__v959ResetBound = true;
    oldBtn.parentNode.replaceChild(btn, oldBtn);
    let busy = false;
    let last = 0;
    const run = (e)=>{
      try{ e.preventDefault(); e.stopPropagation(); }catch(_){ }
      const now = performance.now ? performance.now() : Date.now();
      if(busy || now - last < 700) return;
      busy = true;
      last = now;
      try{ playUiClick && playUiClick(); }catch(_){ }
      try{ resetUserData(); }finally{ setTimeout(()=>{ busy=false; }, 900); }
    };
    btn.addEventListener('pointerup', run, {passive:false});
    btn.addEventListener('touchend', run, {passive:false});
    btn.addEventListener('click', run, {passive:false});
  }
  function install(){ forceBuildBadge(); bindResetOnce(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', install);
  setTimeout(install, 250);
  setTimeout(install, 1000);
})();


/* v97: red unique gear, humble ring, debug grants, natural regen options */
(function(){
  const BUILD_TEXT = 'ver.' + (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  function v97uuid(){ try{return crypto.randomUUID();}catch(_){return 'v97_'+Math.random().toString(36).slice(2)+Date.now();} }
  function legendaryRarity(){ return (rarities.find(r=>r.id==='legendary') || rarities[rarities.length-1]); }
  function addBuild97(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent = BUILD_TEXT; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ' + BUILD_TEXT; });
  }
  function redStats(slot){
    const it = makeItem(slot, legendaryRarity(), {isBossDrop:true});
    it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'redunique';
    return it;
  }
  window.makeBlessedShield = function(){
    const it = redStats('盾');
    it.name = '祝福の盾'; it.blessedShield = true;
    it.flavor = '祝福：被ダメージ時10%で発動。30秒間、1秒ごとに最大HP5%回復。';
    return it;
  };
  window.makeMysticArmor = function(){
    const it = redStats('鎧');
    it.name = '神秘の鎧'; it.mysticArmor = true;
    it.flavor = '神秘：敵撃破時にHP全回復。';
    return it;
  };
  window.makeEffortRing = function(){
    const it = redStats('リング');
    it.name = '努力の指輪'; it.effortRing = true;
    it.flavor = 'くじけぬ心：敗北時経験値ロスト無し。取得経験値25%アップ。';
    return it;
  };
  window.makeHumbleRing = function(){
    const it = makeItem('リング', legendaryRarity(), {isBossDrop:true});
    it.name = '謙虚の指輪'; it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'darkholy';
    it.humbleRing = true; it.deathDanceChance = 0;
    it.flavor = '謙虚：敵のレベルが上がらない。死亡時の経験値ロストが9%になる。';
    return it;
  };
  function hasItemByName(name){
    return Object.values(state.equip||{}).some(it=>it&&it.name===name) || (state.inventory||[]).some(it=>it&&it.name===name);
  }
  function ensureHumbleStarter(){
    if(!hasItemByName('謙虚の指輪')){ state.inventory.unshift(makeHumbleRing()); scheduleSave?.(); }
  }
  const oldEnsureStarter = window.ensureStarterEquipment || ensureStarterEquipment;
  window.ensureStarterEquipment = function(){ const r=oldEnsureStarter?.apply(this, arguments); ensureHumbleStarter(); return r; };
  const oldCalc = calcStats;
  window.calcStats = function(){
    const s = oldCalc.apply(this, arguments);
    s.naturalRegenRate = 0; s.blessedShield=false; s.mysticArmor=false; s.effortRing=false; s.humbleRing=false;
    Object.values(state.equip||{}).filter(Boolean).forEach(it=>{
      s.naturalRegenRate += it.naturalRegenRate || 0;
      if(it.blessedShield) s.blessedShield = true;
      if(it.mysticArmor) s.mysticArmor = true;
      if(it.effortRing) s.effortRing = true;
      if(it.humbleRing) s.humbleRing = true;
    });
    return s;
  };
  const oldMakeItem = makeItem;
  window.makeItem = function(slot, rarity, opts={}){
    const it = oldMakeItem.apply(this, arguments);
    if(it && !it.specialFrame && !it.masterRegen && ['normal','rare','legendary'].includes(it.rarity) && Math.random() < 0.20){
      const max = it.rarity==='legendary' ? 5 : it.rarity==='rare' ? 3 : 1;
      it.naturalRegenRate = (randInt ? randInt(1, max) : Math.ceil(Math.random()*max)) / 100;
    }
    return it;
  };
  const oldPower = itemPower;
  window.itemPower = function(it){
    let v = oldPower.apply(this, arguments);
    if(!it) return v;
    v += (it.naturalRegenRate||0)*1800;
    if(it.blessedShield) v += 3600;
    if(it.mysticArmor) v += 3200;
    if(it.effortRing) v += 2800;
    if(it.humbleRing) v += 1200;
    if(it.specialFrame==='redunique') v += 2600;
    return v;
  };
  const oldSummary = itemSummary;
  window.itemSummary = function(it){
    let base = oldSummary.apply(this, arguments);
    const arr=[];
    if(it?.naturalRegenRate) arr.push(`自然治癒：10秒ごとにHP${Math.round(it.naturalRegenRate*100)}%回復`);
    if(it?.blessedShield) arr.push('祝福：被ダメージ時10%で30秒間、毎秒HP5%回復');
    if(it?.mysticArmor) arr.push('神秘：敵撃破時HP全回復');
    if(it?.effortRing) arr.push('くじけぬ心：敗北時EXPロスト無し / 取得EXP+25%');
    if(it?.humbleRing) arr.push('謙虚：敵レベル上昇停止 / 死亡時EXPロスト9%');
    return [base, ...arr].filter(Boolean).join(' / ');
  };
  const oldNameColor = itemNameColor;
  window.itemNameColor = function(it){ if(it?.specialFrame==='redunique') return '#ff4040'; return oldNameColor.apply(this, arguments); };
  const oldFrame = itemFrameClass;
  window.itemFrameClass = function(it){ if(it?.specialFrame==='redunique') return 'redunique'; return oldFrame.apply(this, arguments); };
  const oldApplyShield = applyDarkShieldToDamage;
  window.applyDarkShieldToDamage = function(dmg){
    let out = oldApplyShield.apply(this, arguments);
    if(out > 0 && calcStats().blessedShield && Math.random() < 0.10){
      ensureStatusContainers();
      state.heroStatuses.blessingUntil = nowMs() + 30000;
      state.heroStatuses.blessingLastTick = nowMs();
      log('祝福の盾：祝福が発動！','good');
      showHeroFloat('祝福', 'heal');
    }
    return out;
  };
  const oldProcess = processStatusDots;
  window.processStatusDots = function(now){
    oldProcess.apply(this, arguments);
    ensureStatusContainers();
    const st = calcStats();
    if(!state.down && !state.deathDanceCutin && st.naturalRegenRate > 0){
      if(!state.heroStatuses.naturalRegenLast) state.heroStatuses.naturalRegenLast = now;
      const ticks = Math.floor((now - state.heroStatuses.naturalRegenLast)/10000);
      if(ticks > 0){
        state.heroStatuses.naturalRegenLast += ticks*10000;
        const heal = Math.max(1, Math.floor(maxHp() * st.naturalRegenRate * ticks));
        if(state.hp > 0 && state.hp < maxHp()){ state.hp = Math.min(maxHp(), state.hp + heal); showHeroFloat(`自然+${heal}`, 'heal'); }
      }
    }
    if(state.heroStatuses.blessingUntil && now < state.heroStatuses.blessingUntil){
      if(!state.heroStatuses.blessingLastTick) state.heroStatuses.blessingLastTick = now;
      const ticks = Math.floor((now - state.heroStatuses.blessingLastTick)/1000);
      if(ticks > 0){
        state.heroStatuses.blessingLastTick += ticks*1000;
        const heal = Math.max(1, Math.floor(maxHp() * 0.05 * ticks));
        if(state.hp > 0 && state.hp < maxHp()){ state.hp = Math.min(maxHp(), state.hp + heal); showHeroFloat(`祝福+${heal}`, 'heal'); }
      }
    }else if(state.heroStatuses.blessingUntil && now >= state.heroStatuses.blessingUntil){
      state.heroStatuses.blessingUntil = 0;
    }
  };
  const oldEnemyDefeated = enemyDefeated;
  window.enemyDefeated = function(){
    const e = state.enemy;
    const stBefore = calcStats();
    const xpMult = e ? (1 + Math.max(0, (e.level || 1) - 1) * 0.08) : 1;
    const baseGain = e ? Math.max(1, Math.floor(e.xp * xpMult)) : 0;
    const r = oldEnemyDefeated.apply(this, arguments);
    if(stBefore.effortRing && baseGain > 0){
      const bonus = Math.max(1, Math.floor(baseGain * 0.25));
      state.xp += bonus; state.lastXpGain = (state.lastXpGain||0) + bonus;
      log(`努力の指輪：取得経験値+${bonus.toLocaleString()}。`, 'good');
      checkLevelUp(); renderAll(); scheduleSave();
    }
    if(stBefore.mysticArmor && state.hp > 0){
      state.hp = maxHp(); showHeroFloat('全回復', 'heal'); log('神秘の鎧：敵撃破時HP全回復。','good'); renderAll();
    }
    if(e && Math.random() < 0.01){
      const pool=[makeBlessedShield, makeMysticArmor, makeEffortRing];
      const it=pool[Math.floor(Math.random()*pool.length)]();
      state.inventory.unshift(it); log(`固有レジェンダリー：${it.name} を獲得！`,'good'); showDropToast(it); scheduleSave();
    }
    return r;
  };
  const oldDebugSword = makeDebugSword;
  window.makeDebugSword = function(){ return makeDarkHolySword ? makeDarkHolySword(state.level) : oldDebugSword(); };
  function grantItem(it){ state.inventory.unshift(it); renderAll(); scheduleSave(); log(`デバッグ：${it.name}を倉庫に追加。`,'good'); }
  function installDebugButtons(){
    const panel=document.getElementById('debugPanel'); if(!panel || panel.__v97Buttons) return; panel.__v97Buttons=true;
    const ref=document.getElementById('debugDarkSwordSaint') || document.getElementById('debugBestAccessory') || panel.querySelector('button');
    const box=document.createElement('div'); box.className='debug-v97-box';
    box.innerHTML=`<div style="margin-top:6px;font-weight:700;color:#ffe28a;">特殊装備付与</div>
      <button type="button" data-v97="redset">赤装備セット付与</button>
      <button type="button" data-v97="darkset">闇装備セット付与</button>
      <button type="button" data-v97="bless">祝福の盾</button>
      <button type="button" data-v97="mystic">神秘の鎧</button>
      <button type="button" data-v97="effort">努力の指輪</button>
      <button type="button" data-v97="holy">闇の聖剣</button>
      <button type="button" data-v97="darkshield">闇の盾</button>
      <button type="button" data-v97="darkamulet">闇のアミュレット</button>
      <button type="button" data-v97="darkarmor">闇の鎧</button>
      <button type="button" data-v97="darkgauntlets">闇の籠手</button>
      <button type="button" data-v97="darkhelm">闇の兜</button>
      <button type="button" data-v97="darkboots">暗黒の靴</button>
      <button type="button" data-v97="humble">謙虚の指輪</button>`;
    if(ref && ref.parentNode) ref.parentNode.insertBefore(box, ref.nextSibling); else panel.appendChild(box);
    box.addEventListener('click', e=>{
      const b=e.target.closest('button[data-v97]'); if(!b) return; e.preventDefault(); e.stopPropagation();
      const k=b.dataset.v97;
      if(k==='redset'){ [makeBlessedShield(),makeMysticArmor(),makeEffortRing()].forEach(x=>state.inventory.unshift(x)); log('デバッグ：赤装備セットを追加。','good'); }
      if(k==='darkset'){ [makeDarkHolySword(state.level),makeDarkShield(state.level),makeDarkAmulet(state.level),makeDarkArmor(state.level),makeDarkGauntlets(state.level),makeDarkHelm(state.level),makeDarkBoots(state.level)].forEach(x=>state.inventory.unshift(x)); log('デバッグ：闇装備セットを追加。','good'); }
      if(k==='bless') grantItem(makeBlessedShield());
      if(k==='mystic') grantItem(makeMysticArmor());
      if(k==='effort') grantItem(makeEffortRing());
      if(k==='holy') grantItem(makeDarkHolySword(state.level));
      if(k==='darkshield') grantItem(makeDarkShield(state.level));
      if(k==='darkamulet') grantItem(makeDarkAmulet(state.level));
      if(k==='darkarmor') grantItem(makeDarkArmor(state.level));
      if(k==='darkgauntlets') grantItem(makeDarkGauntlets(state.level));
      if(k==='darkhelm') grantItem(makeDarkHelm(state.level));
      if(k==='darkboots') grantItem(makeDarkBoots(state.level));
      if(k==='humble') grantItem(makeHumbleRing());
      renderAll(); scheduleSave();
    });
  }
  function install(){ addBuild97(); ensureHumbleStarter(); installDebugButtons(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  window.addEventListener('load', install); setTimeout(install,250); setTimeout(install,1000);
})();


/* v97.1: dark sword saint progression, 100-win guarantee, no-loss flee */
(function(){
  function forceV971Ui(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent='ver.'+(window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION); });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+(window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION); });
    const modal=document.getElementById('fleeModal');
    if(modal){
      const p=modal.querySelector('p');
      if(p) p.innerHTML='敵の出現レベルが20下がります。<br>経験値は失いません。';
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', forceV971Ui); else forceV971Ui();
  window.addEventListener('load', forceV971Ui); setTimeout(forceV971Ui,250); setTimeout(forceV971Ui,1000);
})();


/* v97.2: force flee visibility and remove legacy strongest debug controls */
(function(){
  function applyV972Fixes(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent='ver.'+(window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION); });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+(window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION); });
    const oldSword=document.getElementById('debugBestSword'); if(oldSword) oldSword.remove();
    const oldAcc=document.getElementById('debugBestAccessory'); if(oldAcc) oldAcc.remove();
    const battle=document.querySelector('.battle-panel') || document.body;
    let btn=document.getElementById('fleeBtn');
    if(!btn){
      btn=document.createElement('button');
      btn.id='fleeBtn'; btn.className='flee-btn'; btn.type='button'; btn.textContent='戦闘から逃げる';
      battle.appendChild(btn);
    }
    btn.style.display='block'; btn.style.visibility='visible'; btn.style.opacity='1'; btn.style.pointerEvents='auto';
    if(!btn.__v972Bound){
      const run=(e)=>{ if(e){ e.preventDefault(); e.stopPropagation(); } try{ playUiClick && playUiClick(); }catch(_){} if(typeof confirmFlee==='function') confirmFlee(); };
      btn.addEventListener('pointerup', run, {passive:false});
      btn.addEventListener('touchend', run, {passive:false});
      btn.addEventListener('click', run, {passive:false});
      btn.__v972Bound=true;
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', applyV972Fixes); else applyV972Fixes();
  window.addEventListener('load', applyV972Fixes);
  setTimeout(applyV972Fixes,250);
  setTimeout(applyV972Fixes,1000);
})();

/* v97.3: real lock, warehouse filters, humility protection */
(function(){
  const BUILD = (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  function byId(id){ return document.getElementById(id); }
  function updateBuild973(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
  }
  function normalizeProtectItem(it){
    if(!it) return it;
    if(it.name === '謙虚の指輪' || it.humbleRing){
      it.humbleRing = true;
      it.unsellable = true;
      if(it.locked == null) it.locked = true;
      it.specialFrame = it.specialFrame || 'darkholy';
    }
    return it;
  }
  function normalizeAllLocks(){
    Object.values(state.equip||{}).forEach(normalizeProtectItem);
    (state.inventory||[]).forEach(normalizeProtectItem);
  }
  const oldEnsureStarter973 = window.ensureStarterEquipment || (typeof ensureStarterEquipment==='function' ? ensureStarterEquipment : null);
  if(oldEnsureStarter973){
    window.ensureStarterEquipment = ensureStarterEquipment = function(){
      const r = oldEnsureStarter973.apply(this, arguments);
      normalizeAllLocks();
      return r;
    };
  }
  function ensureInventoryFilterUi(){
    const panel=document.querySelector('.inventory-panel');
    const inv=byId('inventory');
    if(!panel || !inv) return;
    let bar=byId('inventoryFilterBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='inventoryFilterBar';
      bar.className='inventory-filter-bar';
      bar.innerHTML=`<label>表示 <select id="inventoryFilterSelect">
        <option value="all">全て</option>
        <option value="weapon">武器</option>
        <option value="armor">防具</option>
        <option value="shield">盾</option>
        <option value="ring">指輪</option>
        <option value="amulet">アミュレット</option>
        <option value="normal">ノーマル</option>
        <option value="rare">レア</option>
        <option value="legendary">レジェンダリー</option>
        <option value="purple">紫枠</option>
        <option value="red">赤枠</option>
        <option value="locked">ロック中</option>
        <option value="unlocked">未ロック</option>
      </select></label>`;
      panel.insertBefore(bar, inv);
      const sel=bar.querySelector('select');
      sel.value = state.inventoryFilter || 'all';
      sel.addEventListener('change', ()=>{ state.inventoryFilter=sel.value; cancelInventoryActionMenu?.(); renderInventory(); scheduleSave?.(); });
    }
  }
  function passesInventoryFilter(it){
    const f=state.inventoryFilter || 'all';
    if(f==='all') return true;
    if(f==='weapon') return it.slot==='武器';
    if(f==='armor') return it.slot==='鎧' || it.slot==='防具';
    if(f==='shield') return it.slot==='盾';
    if(f==='ring') return it.slot==='リング';
    if(f==='amulet') return it.slot==='アミュレット';
    if(f==='normal') return it.rarity==='normal';
    if(f==='rare') return it.rarity==='rare';
    if(f==='legendary') return it.rarity==='legendary';
    if(f==='purple') return it.specialFrame==='darkholy';
    if(f==='red') return it.specialFrame==='redunique';
    if(f==='locked') return !!it.locked;
    if(f==='unlocked') return !it.locked;
    return true;
  }
  function lockedLabel(it){ return it?.locked ? '🔒 ' : ''; }
  const oldSummary973 = itemSummary;
  itemSummary = window.itemSummary = function(it){
    let s = oldSummary973.apply(this, arguments);
    if(it?.locked) s = (s ? s + ' / ' : '') + 'ロック中：経験値化対象外';
    return s;
  };
  function canExpConvert(it){ return !!it && !it.unsellable && !it.locked; }
  const oldSellExpValue973 = sellExpValue;
  sellExpValue = window.sellExpValue = function(it){ return oldSellExpValue973.apply(this, arguments); };
  selectedSellRarities = window.selectedSellRarities = function(){
    const targets=[];
    if(els.sellNormalChk?.checked) targets.push('normal');
    if(els.sellRareChk?.checked) targets.push('rare');
    if(els.sellLegendaryChk?.checked) targets.push('legendary');
    return targets;
  };
  updateSellButtonState = window.updateSellButtonState = function(){
    if(!els.sellSelectedBtn) return;
    const targets=selectedSellRarities();
    const count=(state.inventory||[]).filter(it=>targets.includes(it.rarity) && canExpConvert(it)).length;
    els.sellSelectedBtn.disabled = targets.length===0;
    els.sellSelectedBtn.textContent = `経験値化 (${count})`;
  };
  sellSelectedRarities = window.sellSelectedRarities = function(){
    const targets=selectedSellRarities();
    if(targets.length===0){ log('経験値化対象のレアリティを選択して。','danger'); return; }
    const soldItems=(state.inventory||[]).filter(it=>targets.includes(it.rarity) && canExpConvert(it));
    state.inventory=(state.inventory||[]).filter(it=>!(targets.includes(it.rarity) && canExpConvert(it)));
    const gainedXp=soldItems.reduce((sum,it)=>sum+sellExpValue(it),0);
    const label=targets.map(r=>(rarities.find(x=>x.id===r)?.name||r)).join('・');
    if(els.tooltip) els.tooltip.classList.add('hidden');
    if(soldItems.length){
      state.xp += gainedXp; state.lastXpGain = gainedXp;
      log(`${label}装備を${soldItems.length}個経験値化し、経験値+${gainedXp.toLocaleString()}。`,'good');
      checkLevelUp();
    }else{
      log(`${label}装備に経験値化できるものがない。`, '');
    }
    renderAll(); scheduleSave?.();
  };
  equipItem = window.equipItem = function(it){
    if(!it) return;
    normalizeProtectItem(it);
    state.inventoryMenuItemId = null;
    const actionMenu=byId('inventoryActionMenu'); if(actionMenu) actionMenu.remove();
    const idx=(state.inventory||[]).findIndex(x=>x.id===it.id); if(idx>=0) state.inventory.splice(idx,1);
    if(state.equip[it.slot]) state.inventory.unshift(state.equip[it.slot]);
    state.equip[it.slot]=it; state.hp=Math.min(state.hp,maxHp()); log(`${it.name} を装備。`,'good'); renderAll(); scheduleSave?.();
  };
  bestEquip = window.bestEquip = function(){
    let changed=0;
    [...(state.inventory||[])].forEach(it=>{
      normalizeProtectItem(it);
      if((it.name==='謙虚の指輪' || it.humbleRing) && !(state.equip[it.slot] && (state.equip[it.slot].name==='謙虚の指輪' || state.equip[it.slot].humbleRing))) return;
      if(!state.equip[it.slot] || itemPower(it)>itemPower(state.equip[it.slot])){ equipItem(it); changed++; }
    });
    log(`最強装備を一括装備（${changed}件）。`,'good'); renderAll();
  };
  function toggleLockItem(it){
    if(!it) return;
    normalizeProtectItem(it);
    if(it.unsellable || it.name==='謙虚の指輪' || it.humbleRing){
      it.locked=true;
      log(`${it.name} は保護装備のためロック固定。`,'good');
    }else{
      it.locked = !it.locked;
      log(`${it.name} を${it.locked?'ロック':'ロック解除'}。`, it.locked?'good':'');
    }
    cancelInventoryActionMenu?.(); renderAll(); scheduleSave?.();
  }
  renderInventory = window.renderInventory = function(){
    normalizeAllLocks();
    ensureInventoryFilterUi();
    const inv=els.inventory; if(!inv) return;
    inv.innerHTML='';
    const selectedId=state.inventoryMenuItemId;
    const shown=(state.inventory||[]).filter(passesInventoryFilter);
    if(!shown.length){
      const empty=document.createElement('div'); empty.className='inventory-empty'; empty.textContent='表示できる装備がない'; inv.appendChild(empty);
    }
    shown.forEach(it=>{
      const div=document.createElement('div');
      div.className=`item ${it.rarity} ${itemFrameClass(it)}${selectedId===it.id?' selected-inventory':''}${it.locked?' locked':''}`;
      div.dataset.itemId=String(it.id);
      div.innerHTML=`<b style="color:${itemNameColor(it)}">${lockedLabel(it)}${it.name}</b><span>${it.slot}</span>`;
      const openItemMenu=(e)=>{ if(e){ e.preventDefault(); e.stopPropagation(); } els.tooltip?.classList.add('hidden'); showInventoryActionMenu(it, div); };
      div.onclick=openItemMenu;
      div.onpointerup=(e)=>{ if(!e.pointerType || e.pointerType!=='mouse') openItemMenu(e); };
      div.ontouchend=openItemMenu;
      div.onpointerenter=(e)=>{ if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); } else { setPointerMode('touch'); els.tooltip?.classList.add('hidden'); } };
      div.onpointermove=(e)=>{ if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); } else { setPointerMode('touch'); els.tooltip?.classList.add('hidden'); } };
      div.onmousemove=(e)=>{ setPointerMode('mouse'); showTip(e,it); };
      div.onmouseleave=()=>{ if(state.inventoryMenuItemId!==it.id) els.tooltip?.classList.add('hidden'); };
      inv.appendChild(div);
      if(selectedId===it.id) setTimeout(()=>showInventoryActionMenu(it, div),0);
    });
    if(els.openAllBtn) els.openAllBtn.style.display='none';
    updateSellButtonState();
  };
  showInventoryActionMenu = window.showInventoryActionMenu = function(it, anchor){
    normalizeProtectItem(it);
    state.inventoryMenuItemId = it.id;
    document.querySelectorAll('.item.selected-inventory').forEach(el=>el.classList.remove('selected-inventory'));
    if(anchor) anchor.classList.add('selected-inventory');
    let menu=byId('inventoryActionMenu');
    if(!menu){ menu=document.createElement('div'); menu.id='inventoryActionMenu'; menu.className='inventory-action-menu'; document.body.appendChild(menu); }
    const current=state.equip[it.slot];
    const diff=current ? Math.round(itemPower(it)-itemPower(current)) : 0;
    const canSell=canExpConvert(it);
    menu.innerHTML = `<div class="inventory-action-title"><b>${escapeHtml(lockedLabel(it)+it.name)}+${it.level}</b><small>${escapeHtml(it.slot)} / ${escapeHtml(it.rarityName||it.rarity)}</small></div><div class="inventory-action-summary">${escapeHtml(itemSummary(it)||'追加能力なし')}${current?`<br>現在: ${escapeHtml(current.name)}+${current.level} / 戦力差: ${diff>=0?'+':''}${diff}`:'<br>現在: 未装備'}</div><div class="inventory-action-buttons"><button type="button" data-action="equip">装備</button><button type="button" data-action="lock">${it.locked?'ロック解除':'ロック'}</button><button type="button" data-action="sell" ${canSell?'':'disabled'}>${canSell?'経験値化':'経験値化不可'}</button><button type="button" data-action="cancel">キャンセル</button></div>`;
    const r=anchor?.getBoundingClientRect ? anchor.getBoundingClientRect() : {left:8,bottom:80,top:80};
    const width=Math.min(320, window.innerWidth-16);
    menu.style.width=width+'px';
    if(isTouchDevice() || window.innerWidth<760){ menu.style.left='50%'; menu.style.right='auto'; menu.style.top='auto'; menu.style.bottom='12px'; menu.style.transform='translateX(-50%)'; }
    else { let left=Math.min(Math.max(8,r.left),window.innerWidth-width-8); menu.style.left=left+'px'; menu.style.right='auto'; menu.style.top=(r.bottom+6)+'px'; menu.style.bottom='auto'; menu.style.transform='none'; }
    menu.classList.remove('hidden');
    const bind=(sel,fn)=>{ const b=menu.querySelector(sel); if(!b) return; let last=0; const run=(e)=>{ if(e){e.preventDefault();e.stopPropagation();} if(b.disabled) return; const n=performance.now?performance.now():Date.now(); if(n-last<300) return; last=n; playUiClick?.(); fn(); }; b.onclick=run; b.onpointerup=run; b.ontouchend=run; };
    bind('[data-action="equip"]',()=>{ cancelInventoryActionMenu(); equipItem(it); });
    bind('[data-action="lock"]',()=>{ toggleLockItem(it); });
    bind('[data-action="sell"]',()=>{
      if(!canExpConvert(it)) return;
      const idx=(state.inventory||[]).findIndex(x=>x.id===it.id);
      if(idx>=0) state.inventory.splice(idx,1);
      const xp=sellExpValue(it); state.xp+=xp; state.lastXpGain=xp;
      log(`${it.name} を経験値化し、経験値+${xp.toLocaleString()}。`,'good');
      checkLevelUp(); cancelInventoryActionMenu(); renderAll(); scheduleSave?.();
    });
    bind('[data-action="cancel"]',()=>{ cancelInventoryActionMenu(); renderInventory(); });
    menu.onclick=e=>e.stopPropagation(); menu.onpointerup=e=>e.stopPropagation(); menu.ontouchend=e=>e.stopPropagation();
  };
  renderEquip = window.renderEquip = function(){
    normalizeAllLocks();
    if(!els.equipList) return;
    els.equipList.innerHTML='';
    slots.forEach(slot=>{
      const it=state.equip[slot]; const div=document.createElement('div');
      div.className='equip'+(it?` ${itemFrameClass(it)} ${it.rarity}`:'')+(state.selectedEquip===slot?' selected':'')+(it?.locked?' locked':'');
      div.innerHTML=it?`<b style="color:${itemNameColor(it)}">${slot}: ${lockedLabel(it)}${it.name}+${it.level}</b><small>${itemSummary(it)}</small>`:`<b>${slot}: 未装備</b>`;
      div.onclick=(e)=>{ state.selectedEquip=slot; renderEquip(); if(it) showEquippedActionMenu973(it, div); };
      div.onpointerup=(e)=>{ if(e.pointerType && e.pointerType!=='mouse'){ e.preventDefault(); state.selectedEquip=slot; renderEquip(); if(it) showEquippedActionMenu973(it, div); } };
      if(it){ div.onmousemove=(e)=>showTip(e,it); div.onmouseleave=()=>els.tooltip.classList.add('hidden'); }
      els.equipList.appendChild(div);
    });
    const it=state.selectedEquip && state.equip[state.selectedEquip];
    els.upgradeBtn.disabled=!it || state.mats<=0;
    els.upgradeBtn.textContent=it?`${it.name}+${it.level} を強化`:'装備を選択して強化';
    els.upgradeBtn.classList.toggle('attention', !it && state.mats>0);
  };
  function showEquippedActionMenu973(it, anchor){
    let menu=byId('inventoryActionMenu');
    if(!menu){ menu=document.createElement('div'); menu.id='inventoryActionMenu'; menu.className='inventory-action-menu'; document.body.appendChild(menu); }
    menu.innerHTML=`<div class="inventory-action-title"><b>${escapeHtml(lockedLabel(it)+it.name)}+${it.level}</b><small>${escapeHtml(it.slot)} / 装備中</small></div><div class="inventory-action-summary">${escapeHtml(itemSummary(it)||'追加能力なし')}</div><div class="inventory-action-buttons"><button type="button" data-action="select">強化</button><button type="button" data-action="lock">${it.locked?'ロック解除':'ロック'}</button><button type="button" data-action="cancel">閉じる</button></div>`;
    const r=anchor.getBoundingClientRect(); const width=Math.min(320, window.innerWidth-16); menu.style.width=width+'px';
    if(isTouchDevice() || window.innerWidth<760){ menu.style.left='50%'; menu.style.right='auto'; menu.style.top='auto'; menu.style.bottom='12px'; menu.style.transform='translateX(-50%)'; }
    else { menu.style.left=Math.min(Math.max(8,r.left),window.innerWidth-width-8)+'px'; menu.style.top=(r.bottom+6)+'px'; menu.style.bottom='auto'; menu.style.transform='none'; }
    menu.classList.remove('hidden');
    const bind=(sel,fn)=>{ const b=menu.querySelector(sel); if(!b) return; const run=(e)=>{ if(e){e.preventDefault();e.stopPropagation();} playUiClick?.(); fn(); }; b.onclick=run; b.onpointerup=run; b.ontouchend=run; };
    bind('[data-action="select"]',()=>{ state.selectedEquip=it.slot; cancelInventoryActionMenu(); renderEquip(); });
    bind('[data-action="lock"]',()=>{ toggleLockItem(it); });
    bind('[data-action="cancel"]',()=>{ cancelInventoryActionMenu(); renderEquip(); });
    menu.onclick=e=>e.stopPropagation(); menu.onpointerup=e=>e.stopPropagation(); menu.ontouchend=e=>e.stopPropagation();
  }
  function install973(){
    updateBuild973(); normalizeAllLocks(); ensureInventoryFilterUi();
    const sel=byId('inventoryFilterSelect'); if(sel){ sel.value=state.inventoryFilter||'all'; }
    renderAll?.();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install973); else install973();
  window.addEventListener('load', install973); setTimeout(install973,300); setTimeout(install973,1200);
})();


/* v97.4: Dark Sword Saint independent level, cutin preload, streak notice, flee layout */
(function(){
  const BUILD = (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  function updateBuild974(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
  }
  function normalEnemyReferenceLevel(){
    if(state.enemyLevelBase != null){
      const progress = Math.max(0, Math.floor(((state.defeated||0) - (state.enemyLevelBaseDefeated||0)) / 3));
      return Math.max(1, Math.floor(state.enemyLevelBase) + progress);
    }
    return Math.max(1, Math.floor((state.level||1) + Math.floor((state.defeated||0)/3)));
  }
  handleHeroDeath = window.handleHeroDeath = function(){
    if(state.defeatSequence || state.down || state.deathDance || (state.deathDanceCutin && !state.darkSwordCutinActive)) return;
    const wasDarkSwordSaint = isDarkSwordSaint();
    state.defeatSequence = true;
    if(state.defeatCountdownTimer){ clearInterval(state.defeatCountdownTimer); state.defeatCountdownTimer = null; }
    clearDarkSwordTimers();
    clearDeathDanceSequence();
    hideDeathDanceCutin();
    state.deathDance = false;
    state.deathDanceCutin = false;
    state.darkSwordCutinActive = false;
    state.hp = 0;
    resetTransientStatuses();
    state.hp = 0;
    state.winStreak = 0;
    state.forceNextDarkSwordSaint = false;
    state.pendingDarkSwordSaintDelay = false;
    const defeatedEnemyLevel = wasDarkSwordSaint ? normalEnemyReferenceLevel() : Math.max(1, Math.floor(state.enemy?.level || state.enemyLevelBase || state.level || 1));
    const nextEnemyLevelBase = Math.max(1, Math.floor(defeatedEnemyLevel * 0.9));
    state.enemyLevelBase = nextEnemyLevelBase;
    state.enemyLevelBaseDefeated = state.defeated || 0;
    const st = calcStats();
    loseExpPercent(st.effortRing ? 0 : (st.humbleRing ? 0.09 : 0.25));
    state.hp = 0;
    const lostPct = st.effortRing ? 0 : (st.humbleRing ? 9 : 25);
    if(wasDarkSwordSaint){
      log(`暗黒剣聖に敗北。暗黒剣聖Lvは維持。経験値を${lostPct}%失った。通常敵レベル基準が${defeatedEnemyLevel}→${nextEnemyLevelBase}に低下した。`,'danger');
    }else{
      log(`騎士は力尽きた。経験値を${lostPct}%失った。敵レベルが${defeatedEnemyLevel}→${nextEnemyLevelBase}に低下した。`,'danger');
    }
    banner('敗北…');
    if(els.heroCard) els.heroCard.classList.add('down');
    if(els.downOverlay){
      els.downOverlay.classList.remove('hidden');
      const dt = els.downOverlay.querySelector('.down-text');
      if(dt) dt.textContent = 'DOWN...';
      if(els.downCount) els.downCount.textContent = '5';
    }
    if(els.enemyCard){
      els.enemyCard.classList.remove('hit','attack','enter');
      els.enemyCard.classList.add('defeated-gone');
    }
    if(els.enemyHpFill) els.enemyHpFill.style.width='0%';
    if(els.enemyHpText) els.enemyHpText.textContent='消滅';
    renderStatusLists();
    renderBattle();
    scheduleSave();

    let count = 5;
    state.defeatCountdownTimer = setInterval(()=>{
      count -= 1;
      if(els.downCount) els.downCount.textContent = String(Math.max(0,count));
      if(count <= 0){
        clearInterval(state.defeatCountdownTimer);
        state.defeatCountdownTimer = null;
        if(els.enemyCard) els.enemyCard.classList.remove('defeated-gone');
        spawnEnemyAfterDefeat();
        state.defeatSequence = false;
        log('敵レベル低下後の戦闘を再開。','good');
      }
    }, 1000);
  };

  function showCutinPreloaded({img, quote, title, dark=false, hero=false, voice=false}){
    if(!els.deathDanceCutin) return;
    const box = els.deathDanceCutin;
    box.classList.remove('show');
    box.classList.add('hidden');
    box.classList.toggle('dark-cutin', !!dark);
    box.classList.toggle('hero-cutin', !!hero);
    if(els.deathDanceCutinQuote) els.deathDanceCutinQuote.textContent = quote || '';
    if(els.deathDanceCutinTitle) els.deathDanceCutinTitle.textContent = title || '';
    const reveal = ()=>{
      box.classList.remove('hidden');
      void box.offsetWidth;
      box.classList.add('show');
      playSfx('cutin');
      if(voice) playDarkSwordSaintVoice();
    };
    if(els.deathDanceCutinImg){
      els.deathDanceCutinImg.onload = ()=>{ els.deathDanceCutinImg.onload = null; reveal(); };
      els.deathDanceCutinImg.src = '';
      // 画像セット前に1フレーム消して、前回カットインの相手画像が一瞬出るのを防ぐ。
      requestAnimationFrame(()=>{
        if(els.deathDanceCutinImg) els.deathDanceCutinImg.src = img;
        setTimeout(()=>{ if(box.classList.contains('hidden')) reveal(); }, 220);
      });
    }else{
      reveal();
    }
  }
  showDeathDanceCutin = window.showDeathDanceCutin = function(){
    const data = DEATH_DANCE_CUTINS[Math.floor(Math.random() * DEATH_DANCE_CUTINS.length)];
    showCutinPreloaded({img:data.img, quote:data.quote, title:'死線の剣舞', hero:true});
  };
  showDarkSwordDanceCutin = window.showDarkSwordDanceCutin = function(){
    showCutinPreloaded({img:DARK_SWORD_SAINT_CUTIN.img, quote:DARK_SWORD_SAINT_CUTIN.quote, title:'暗黒剣舞', dark:true, voice:true});
  };
  showDarkSwordTechniqueCutin = window.showDarkSwordTechniqueCutin = function(){
    showCutinPreloaded({img:DARK_SWORD_TECHNIQUE_CUTIN.img, quote:DARK_SWORD_TECHNIQUE_CUTIN.quote, title:'暗黒剣技', dark:true});
  };
  const oldHide974 = hideDeathDanceCutin;
  hideDeathDanceCutin = window.hideDeathDanceCutin = function(){
    oldHide974();
    if(els.deathDanceCutinImg){ els.deathDanceCutinImg.onload = null; }
  };
  function install974(){ updateBuild974(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install974); else install974();
  window.addEventListener('load', install974);
  setTimeout(install974,300); setTimeout(install974,1200);
})();


/* v98: dark equipment set expansion */
(function(){
  const BUILD = (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  function legendaryRarity98(){ return (rarities.find(r=>r.id==='legendary') || rarities[rarities.length-1]); }
  function darkBase98(slot, levelOverride){
    const lv = Math.max(1, Math.floor(levelOverride || state.level || 1));
    const it = makeItem(slot, legendaryRarity98(), {isBossDrop:true});
    it.rarity='legendary'; it.rarityName='レジェンダリー'; it.specialFrame='darkholy'; it.level = it.level || 0;
    return {it, lv, mult:(legendaryRarity98().mult || 3.2)};
  }
  window.makeDarkArmor = makeDarkArmor = function(levelOverride){
    const b=darkBase98('鎧', levelOverride), it=b.it, lv=b.lv, m=b.mult;
    it.name='闇の鎧';
    it.def=Math.floor((28 + lv*6)*m); it.hp=Math.floor((120 + lv*22)*m);
    it.darkArmor=true; it.darkDamageReduce=0.25; it.darkRegenPerSecond=0.02; it.darkBleedMax=20;
    it.flavor='被ダメージ25%軽減。1秒ごとに最大HP2%回復。自身への暗黒出血を最大20スタックまで減少。';
    return it;
  };
  window.makeDarkGauntlets = makeDarkGauntlets = function(levelOverride){
    const b=darkBase98('腕', levelOverride), it=b.it, lv=b.lv, m=b.mult;
    it.name='闇の籠手';
    it.def=Math.floor((18 + lv*4)*m); it.atk=Math.floor((10 + lv*3)*m); it.hp=Math.floor((55 + lv*10)*m);
    it.darkGauntlets=true; it.deathDanceCountBonus=2;
    it.flavor='死線の剣舞発動時、剣舞発動回数+2。';
    return it;
  };
  window.makeDarkHelm = makeDarkHelm = function(levelOverride){
    const b=darkBase98('兜', levelOverride), it=b.it, lv=b.lv, m=b.mult;
    it.name='闇の兜';
    it.def=Math.floor((20 + lv*5)*m); it.hp=Math.floor((70 + lv*12)*m);
    it.darkHelm=true; it.deathDanceChance=0.10;
    it.flavor='死線の剣舞発動率+10%。出血・暗黒出血解除。死線の剣舞発動中、出血・暗黒出血を受けない。';
    return it;
  };
  window.makeDarkBoots = makeDarkBoots = function(levelOverride){
    const b=darkBase98('足', levelOverride), it=b.it, lv=b.lv, m=b.mult;
    it.name='暗黒の靴';
    it.def=Math.floor((14 + lv*4)*m); it.hp=Math.floor((55 + lv*10)*m);
    it.darkBoots=true; it.evasion=0.25; it.lowHpEvasion=0.25;
    it.flavor='回避率+25%。HP半分以下でさらに+25%。';
    return it;
  };

  const oldCalc98 = calcStats;
  window.calcStats = calcStats = function(){
    const s = oldCalc98.apply(this, arguments);
    s.darkArmor=false; s.darkDamageReduce=s.darkDamageReduce||0; s.darkRegenPerSecond=s.darkRegenPerSecond||0; s.darkBleedMax=100;
    s.darkGauntlets=false; s.deathDanceCountBonus=s.deathDanceCountBonus||0;
    s.darkHelm=false; s.bleedImmuneDuringDeathDance=false;
    s.evasion=s.evasion||0; s.lowHpEvasion=s.lowHpEvasion||0;
    Object.values(state.equip||{}).filter(Boolean).forEach(it=>{
      if(it.darkArmor){ s.darkArmor=true; s.darkDamageReduce=Math.max(s.darkDamageReduce||0, it.darkDamageReduce||0.25); s.darkRegenPerSecond += it.darkRegenPerSecond||0.02; s.darkBleedMax=Math.min(s.darkBleedMax, it.darkBleedMax||20); }
      if(it.darkGauntlets){ s.darkGauntlets=true; s.deathDanceCountBonus += it.deathDanceCountBonus||2; }
      if(it.darkHelm){ s.darkHelm=true; s.bleedImmuneDuringDeathDance=true; }
      if(it.darkBoots){ s.evasion += it.evasion||0.25; s.lowHpEvasion += it.lowHpEvasion||0.25; }
    });
    s.evasion = Math.min(0.75, s.evasion || 0);
    return s;
  };

  const oldAddBleed98 = addBleed;
  window.addBleed = addBleed = function(target){
    if(target==='hero' && state.deathDance && calcStats().bleedImmuneDuringDeathDance) return false;
    return oldAddBleed98.apply(this, arguments);
  };
  const oldAddDarkBleed98 = addDarkBleed;
  window.addDarkBleed = addDarkBleed = function(target='hero'){
    if(target==='hero'){
      const st=calcStats();
      if(state.deathDance && st.bleedImmuneDuringDeathDance) return false;
      ensureStatusContainers(); cleanupStatuses();
      const max = Math.max(0, Math.min(100, st.darkBleedMax || 100));
      const box = state.heroStatuses.darkBleeds || (state.heroStatuses.darkBleeds=[]);
      if(box.length >= max) return false;
    }
    return oldAddDarkBleed98.apply(this, arguments);
  };

  const oldProcess98 = processStatusDots;
  window.processStatusDots = processStatusDots = function(now){
    oldProcess98.apply(this, arguments);
    ensureStatusContainers();
    const st=calcStats();
    if(st.darkHelm){
      if((state.heroStatuses.bleeds||[]).length || (state.heroStatuses.darkBleeds||[]).length){
        state.heroStatuses.bleeds=[]; state.heroStatuses.darkBleeds=[];
        renderStatusLists();
      }
    }else if(st.darkArmor && (state.heroStatuses.darkBleeds||[]).length > (st.darkBleedMax||20)){
      state.heroStatuses.darkBleeds = state.heroStatuses.darkBleeds.slice(0, st.darkBleedMax||20);
      renderStatusLists();
    }
    if(!state.down && !state.deathDanceCutin && st.darkRegenPerSecond > 0){
      if(!state.heroStatuses.darkArmorRegenLast) state.heroStatuses.darkArmorRegenLast = now;
      const ticks = Math.floor((now - state.heroStatuses.darkArmorRegenLast)/1000);
      if(ticks > 0){
        state.heroStatuses.darkArmorRegenLast += ticks*1000;
        const heal = Math.max(1, Math.floor(maxHp() * st.darkRegenPerSecond * ticks));
        if(state.hp > 0 && state.hp < maxHp()){ state.hp=Math.min(maxHp(), state.hp+heal); showHeroFloat(`闇鎧+${heal}`, 'heal'); renderBattle(); }
      }
    }
  };

  const oldApplyDarkShield98 = applyDarkShieldToDamage;
  window.applyDarkShieldToDamage = applyDarkShieldToDamage = function(dmg){
    let out = oldApplyDarkShield98.apply(this, arguments);
    const st=calcStats();
    if(st.darkArmor && out > 0){ out = Math.max(1, Math.floor(out * (1 - (st.darkDamageReduce||0.25)))); }
    return out;
  };

  function rollDodge98(label='MISS'){
    const st=calcStats();
    let rate=st.evasion||0;
    if(state.hp <= maxHp()*0.5) rate += st.lowHpEvasion||0;
    rate = Math.min(0.85, rate);
    if(rate > 0 && Math.random() < rate){ showHeroFloat(label,'guard'); playSfx('guard'); log(`暗黒の靴：攻撃を回避！`,'good'); renderBattle(); return true; }
    return false;
  }
  const oldEnemyAttack98 = enemyAttack;
  window.enemyAttack = enemyAttack = function(now){
    if(state.enemy && rollDodge98('MISS')){ state.lastEnemyAttack = now || performance.now(); return; }
    return oldEnemyAttack98.apply(this, arguments);
  };
  const oldDarkHit98 = applyDarkSwordDanceHit;
  window.applyDarkSwordDanceHit = applyDarkSwordDanceHit = function(i,total,mode='finish'){
    if(state.enemy && rollDodge98('MISS')) return;
    return oldDarkHit98.apply(this, arguments);
  };

  const oldSummary98 = itemSummary;
  window.itemSummary = itemSummary = function(it){
    let base = oldSummary98.apply(this, arguments);
    const arr=[];
    if(it?.darkArmor) arr.push('闇の鎧：被ダメ25%軽減 / 毎秒HP2%回復 / 暗黒出血最大20');
    if(it?.darkGauntlets) arr.push('闇の籠手：死線の剣舞発動回数+2');
    if(it?.darkHelm) arr.push('闇の兜：剣舞率+10% / 出血・暗黒出血解除 / 剣舞中DOT無効');
    if(it?.darkBoots) arr.push('暗黒の靴：回避+25% / HP半分以下でさらに+25%');
    return [base, ...arr].filter(Boolean).join(' / ');
  };
  const oldPower98 = itemPower;
  window.itemPower = itemPower = function(it){
    let v=oldPower98.apply(this, arguments); if(!it) return v;
    if(it.darkArmor) v += 4200;
    if(it.darkGauntlets) v += 3800;
    if(it.darkHelm) v += 3600;
    if(it.darkBoots) v += 3400;
    return v;
  };

  function installDebug98(){
    const panel=document.getElementById('debugPanel'); if(!panel || panel.__v98Buttons) return; panel.__v98Buttons=true;
    const box=document.createElement('div'); box.className='debug-v98-box';
    box.innerHTML=`<div style="margin-top:6px;font-weight:700;color:#d8a8ff;">闇装備追加付与</div>
      <button type="button" data-v98="armor">闇の鎧</button>
      <button type="button" data-v98="gauntlets">闇の籠手</button>
      <button type="button" data-v98="helm">闇の兜</button>
      <button type="button" data-v98="boots">暗黒の靴</button>`;
    panel.appendChild(box);
    box.addEventListener('click', e=>{
      const b=e.target.closest('button[data-v98]'); if(!b) return; e.preventDefault(); e.stopPropagation();
      const k=b.dataset.v98;
      const map={armor:makeDarkArmor,gauntlets:makeDarkGauntlets,helm:makeDarkHelm,boots:makeDarkBoots};
      const fn=map[k]; if(fn){ const it=fn(state.level); state.inventory.unshift(it); log(`デバッグ：${it.name}を倉庫に追加。`,'good'); renderAll(); scheduleSave?.(); }
    });
  }
  function updateBuild98(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    installDebug98();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', updateBuild98); else updateBuild98();
  window.addEventListener('load', updateBuild98); setTimeout(updateBuild98,300); setTimeout(updateBuild98,1200);
})();


/* v98.2: real UI tabs, log filters, dark equipment debug grant, dark saint HP0 watchdog, defeat status clear */
(function(){
  const BUILD = (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  function safe(fn){ try{return fn();}catch(e){ console.warn('[v98.2]', e); } }
  function updateBuild982(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
  }

  function ensureTopPanelTabs(){
    const header=document.querySelector('.topbar'); if(!header) return;
    let nav=document.getElementById('topPanelTabs');
    if(!nav){
      nav=document.createElement('nav');
      nav.id='topPanelTabs'; nav.className='top-panel-tabs';
      nav.setAttribute('aria-label','右パネル切り替え');
      nav.innerHTML='<button type="button" data-menu-page="stats">ステータス</button><button type="button" data-menu-page="equip">装備/強化</button><button type="button" data-menu-page="inventory">倉庫</button><button type="button" data-menu-page="log">ログ</button>';
      header.appendChild(nav);
      nav.addEventListener('click', e=>{
        const b=e.target.closest('button[data-menu-page]'); if(!b) return;
        e.preventDefault(); e.stopPropagation();
        if(typeof setMenuPage==='function') setMenuPage(b.dataset.menuPage);
        else state.menuPage=b.dataset.menuPage;
        document.querySelectorAll('#topPanelTabs button').forEach(x=>x.classList.toggle('active', x===b));
        if(els?.sidePanel) els.sidePanel.classList.add('open');
      });
    }
    const page=(state&&state.menuPage)||'stats';
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.menuPage===page));
  }
  const oldSetMenuPage982 = (typeof setMenuPage==='function') ? setMenuPage : null;
  if(oldSetMenuPage982){
    setMenuPage = function(page){
      const r=oldSetMenuPage982.apply(this, arguments);
      document.querySelectorAll('#topPanelTabs button').forEach(btn=>btn.classList.toggle('active', btn.dataset.menuPage === ((state&&state.menuPage)||page||'stats')));
      return r;
    };
  }

  const LOG_FILTERS = {all:'すべて', damage:'ダメージ', system:'システム', drop:'ドロップ'};
  function classifyLog(msg, cls){
    const s=String(msg||'');
    if(/ドロップ|獲得|報酬|倉庫|経験値化|装備|強化石/.test(s)) return 'drop';
    if(/ダメージ|出血|暗黒出血|火傷|回復|MISS|GUARD|反射|剣舞|攻撃|斬撃|雷撃|炎斬り/.test(s) || /danger|skilllog|damage|fire|dark/.test(String(cls||''))) return 'damage';
    return 'system';
  }
  function ensureLogFilters(){
    const panel=document.querySelector('.log-panel'); if(!panel) return;
    let box=document.getElementById('logFilterTabs');
    if(!box){
      box=document.createElement('div'); box.id='logFilterTabs'; box.className='log-filter-tabs';
      box.innerHTML=Object.entries(LOG_FILTERS).map(([k,v])=>`<button type="button" data-log-filter="${k}">${v}</button>`).join('');
      const h=panel.querySelector('h2');
      if(h && h.nextSibling) panel.insertBefore(box, h.nextSibling); else panel.prepend(box);
      box.addEventListener('click', e=>{
        const b=e.target.closest('button[data-log-filter]'); if(!b) return;
        state.logFilter=b.dataset.logFilter||'all'; renderLog982();
      });
    }
    box.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.logFilter === (state.logFilter||'all')));
  }
  function renderLog982(){
    if(!els || !els.log) return;
    ensureLogFilters();
    const f=state.logFilter||'all';
    const rows=(state.log||[]).filter(l=> f==='all' || (l.type||classifyLog(l.msg,l.cls))===f);
    els.log.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time}] ${l.msg}</div>`).join('');
    const box=document.getElementById('logFilterTabs'); if(box) box.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.logFilter===f));
  }
  const oldLog982 = log;
  log = function(msg, cls='', html=false){
    const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
    const safeMsg = html ? msg : (typeof escapeHtml==='function' ? escapeHtml(msg) : String(msg));
    const type = classifyLog(msg, cls);
    state.log.unshift({time, msg:safeMsg, cls, html:true, type});
    state.log=state.log.slice(0,160);
    renderLog982();
  };

  function darkLevel(){ return Math.max(1, Math.floor((state&&state.darkSwordSaintLevel)||state.level||1)); }
  function makeDarkByName(name){
    const lv=darkLevel();
    const map={
      '闇の聖剣':()=>makeDarkHolySword(lv), '闇の盾':()=>makeDarkShield(lv), '闇のアミュレット':()=>makeDarkAmulet(lv),
      '闇の鎧':()=>makeDarkArmor(lv), '闇の籠手':()=>makeDarkGauntlets(lv), '闇の兜':()=>makeDarkHelm(lv), '暗黒の靴':()=>makeDarkBoots(lv)
    };
    return map[name] ? map[name]() : null;
  }
  function darkSet(){ return ['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'].map(makeDarkByName).filter(Boolean); }
  function grantDark982(items){
    items.forEach(it=>state.inventory.unshift(it));
    renderAll(); scheduleSave?.(); log(`デバッグ：闇装備を${items.length}個付与。`, 'good');
  }
  function ensureDarkDebug982(){
    const panel=document.getElementById('debugPanel'); if(!panel || panel.__v982DarkDebug) return; panel.__v982DarkDebug=true;
    const box=document.createElement('div'); box.className='debug-v982-dark-box';
    box.innerHTML='<div style="margin-top:6px;font-weight:700;color:#d8a8ff;">闇装備付与 ver.'+(window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION)+'</div><button type="button" data-dark982="set">闇装備7種セット</button>'+['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'].map(n=>`<button type="button" data-dark982="${n}">${n}</button>`).join('');
    panel.appendChild(box);
    box.addEventListener('click', e=>{
      const b=e.target.closest('button[data-dark982]'); if(!b) return; e.preventDefault(); e.stopPropagation();
      if(b.dataset.dark982==='set') grantDark982(darkSet());
      else { const it=makeDarkByName(b.dataset.dark982); if(it) grantDark982([it]); else log(`デバッグ：${b.dataset.dark982}の生成に失敗。`,'danger'); }
    });
  }

  const oldClearDark982 = (typeof clearDarkSwordTimers==='function') ? clearDarkSwordTimers : null;
  function hardStopDark982(){
    safe(()=>oldClearDark982 && oldClearDark982());
    if(state){ state.darkSwordCutinActive=false; state.deathDanceCutin=false; }
    safe(()=>hideDeathDanceCutin && hideDeathDanceCutin());
    safe(()=>setBgmMode && setBgmMode('normal'));
    if(state && state.enemyStatuses){ state.enemyStatuses.darkDeadConfirmed=true; state.enemyStatuses.darkRevivingUntil=0; state.enemyStatuses.darkReviveStart=0; }
  }
  const oldTryDark982 = tryDarkSwordDanceRevive;
  tryDarkSwordDanceRevive = function(){
    if(!isDarkSwordSaint()) return false;
    const r=oldTryDark982.apply(this, arguments);
    if(!r && state.enemyHp<=0){ hardStopDark982(); }
    return r;
  };
  const oldEnemyDefeated982 = enemyDefeated;
  enemyDefeated = function(){
    if(isDarkSwordSaint() || (state.enemy && state.enemy.id==='dark_sword_saint')) hardStopDark982();
    return oldEnemyDefeated982.apply(this, arguments);
  };
  function darkHp0Watchdog(){
    if(!isDarkSwordSaint() || !state.enemy || state.down || state.defeatSequence) return;
    ensureStatusContainers?.();
    const reviving=(state.enemyStatuses?.darkRevivingUntil||0)>performance.now();
    if(state.enemyHp<=0 && !reviving && !state.enemyStatuses?.darkDeadConfirmed){
      const revived = tryDarkSwordDanceRevive();
      if(!revived){ hardStopDark982(); setTimeout(()=>{ if(state.enemy && state.enemy.id==='dark_sword_saint' && state.enemyHp<=0) enemyDefeated(); }, 30); }
    }
  }

  function clearDefeatDots982(){
    safe(()=>resetTransientStatuses && resetTransientStatuses());
    if(state){
      state.heroStatuses = state.heroStatuses || {};
      state.enemyStatuses = state.enemyStatuses || {};
      state.heroStatuses.bleeds=[]; state.heroStatuses.darkBleeds=[]; state.heroStatuses.burnUntil=0;
      state.enemyStatuses.bleeds=[]; state.enemyStatuses.darkBleeds=[]; state.enemyStatuses.burnUntil=0;
    }
  }
  const oldHandleDeath982 = handleHeroDeath;
  handleHeroDeath = function(){ clearDefeatDots982(); const r=oldHandleDeath982.apply(this, arguments); clearDefeatDots982(); renderStatusLists?.(); return r; };
  const oldSpawnAfter982 = spawnEnemyAfterDefeat;
  spawnEnemyAfterDefeat = function(){ clearDefeatDots982(); const r=oldSpawnAfter982.apply(this, arguments); clearDefeatDots982(); renderStatusLists?.(); return r; };

  function boot982(){ updateBuild982(); ensureTopPanelTabs(); ensureLogFilters(); ensureDarkDebug982(); renderLog982(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot982); else boot982();
  window.addEventListener('load', boot982);
  setInterval(()=>{ boot982(); darkHp0Watchdog(); }, 1000);
})();


/* latest: authoritative integrated patch */
(function(){
  const BUILD = (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  window.__LATEST_BUILD__ = BUILD;

  const DARK_NAMES = ['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'];

  function setLatestVersion(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>{ el.textContent = 'ver.' + BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ver.' + BUILD; });
    const fixed = document.getElementById('fixedBuildVersion');
    if(fixed) fixed.textContent = 'ver.' + BUILD;
  }

  function installLatestCss(){
    if(document.getElementById('v990LatestCss')) return;
    const st = document.createElement('style');
    st.id = 'v990LatestCss';
    st.textContent = `
      html,body{min-height:100%;overflow-y:auto!important;}
      button,.btn,[role="button"],input,select,label{touch-action:manipulation!important;pointer-events:auto!important;}
      #debugPanel,.debug-panel,#menuPanel,.menu-panel,#mobileMenuPanel,.mobile-menu-panel,.side-panel,.right-panel,#sidePanel{
        max-height:calc(100dvh - 96px)!important;
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch!important;
        box-sizing:border-box!important;
        padding-bottom:96px!important;
        pointer-events:auto!important;
      }
      #debugPanel *,.debug-panel *,.side-panel *,.menu-panel *{pointer-events:auto!important;}
      .cutin,.cutin-overlay,#cutin,#cutinOverlay,.boss-intro,.dark-cutin{pointer-events:none!important;}
      .top-panel-tabs,.v990-top-panel-tabs{
        display:flex!important;
        gap:6px;
        padding:4px 8px;
        border-top:1px solid rgba(212,160,42,.45);
        border-bottom:1px solid rgba(212,160,42,.65);
        background:rgba(14,8,3,.96);
        z-index:4000;
        flex-wrap:wrap;
      }
      .top-panel-tabs button,.v990-top-panel-tabs button{
        flex:1 1 90px;
        min-height:34px;
        border:1px solid #b78a24;
        background:rgba(48,28,7,.92);
        color:#ffe09a;
        border-radius:4px;
        font-weight:700;
      }
      .top-panel-tabs button.active,.v990-top-panel-tabs button.active{
        background:rgba(120,84,20,.98);
        box-shadow:inset 0 0 0 1px #ffd15b;
      }
      .log-filter-bar{
        display:flex;
        gap:4px;
        flex-wrap:wrap;
        margin:4px 0 8px;
      }
      .log-filter-bar button{
        flex:1 1 70px;
        min-height:28px;
      }
      .log-filter-bar button.active{
        outline:1px solid #ffd15b;
      }
      #latestDarkDebugBox{
        margin:8px 0;
        padding:8px;
        border:1px solid rgba(185,120,255,.8);
        border-radius:8px;
        background:rgba(30,0,45,.55);
        display:flex;
        gap:6px;
        flex-wrap:wrap;
      }
      #latestDarkDebugBox button{min-height:32px;}
      @media (pointer:coarse),(max-width:820px){
        #fleeBtn,.flee-btn,#fleeButton,.escape-btn,#escapeBtn{
          min-width:44px!important;width:44px!important;height:44px!important;padding:0!important;
          border-radius:999px!important;font-size:0!important;display:inline-flex!important;
          align-items:center!important;justify-content:center!important;
        }
        #fleeBtn::before,.flee-btn::before,#fleeButton::before,.escape-btn::before,#escapeBtn::before{content:"🏃";font-size:24px;}
        .status-popup-close,.buff-popup-close,.debuff-popup-close,.status-detail-close,#statusDetailClose,#statusPopupClose,.tooltip-close,.popup-close.status-close{display:none!important;}
      }
    `;
    document.head.appendChild(st);
  }

  function uuid(){
    try{ return crypto.randomUUID(); }catch(e){ return 'latest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }
  }
  function legendary(){
    return (rarities.find(r=>r.id==='legendary') || rarities[rarities.length-1]);
  }

  function makeDarkEquipLatest(name, levelOverride){
    const lv = Math.max(1, Math.floor(levelOverride || state.level || 1));
    const r = legendary();
    if(name === '闇の聖剣' && typeof makeDarkHolySword === 'function') return makeDarkHolySword(lv);
    if(name === '闇の盾' && typeof makeDarkShield === 'function') return makeDarkShield(lv);
    if(name === '闇のアミュレット' && typeof makeDarkAmulet === 'function') return makeDarkAmulet(lv);

    const slotMap = {'闇の鎧':'鎧','闇の籠手':'腕','闇の兜':'兜','暗黒の靴':'足'};
    const it = makeItem(slotMap[name] || 'リング', r, {isBossDrop:true});
    it.id = uuid();
    it.name = name;
    it.rarity = 'legendary';
    it.rarityName = 'レジェンダリー';
    it.specialFrame = 'darkholy';
    it.darkEquip = true;

    if(name === '闇の鎧'){
      it.darkArmor = true;
      it.darkDamageReduce = 0.25;
      it.darkRegenPerSecond = 0.02;
      it.darkBleedMax = 20;
      it.def = Math.floor((28 + lv*6) * r.mult);
      it.hp = Math.floor((120 + lv*22) * r.mult);
      it.flavor = '被ダメージ25%軽減。1秒ごとに最大HP2%回復。自身への暗黒出血を最大20スタックまで減少。';
    }
    if(name === '闇の籠手'){
      it.darkGauntlets = true;
      it.deathDanceCountBonus = 2;
      it.atk = Math.floor((22 + lv*5) * r.mult);
      it.def = Math.floor((12 + lv*4) * r.mult);
      it.flavor = '死線の剣舞時、剣舞発動回数+2。';
    }
    if(name === '闇の兜'){
      it.darkHelm = true;
      it.deathDanceChance = 0.10;
      it.clearBleedOnEquip = true;
      it.preventBleedDuringDance = true;
      it.def = Math.floor((18 + lv*5) * r.mult);
      it.hp = Math.floor((80 + lv*15) * r.mult);
      it.flavor = '死線の剣舞発動率+10%。出血・暗黒出血解除。死線の剣舞中は出血・暗黒出血を受けない。';
    }
    if(name === '暗黒の靴'){
      it.darkBoots = true;
      it.evasion = 0.25;
      it.lowHpEvasion = 0.25;
      it.def = Math.floor((12 + lv*4) * r.mult);
      it.hp = Math.floor((70 + lv*13) * r.mult);
      it.flavor = '回避率+25%。HP半分以下でさらに+25%。';
    }
    return it;
  }

  window.makeDarkArmor = function(levelOverride){ return makeDarkEquipLatest('闇の鎧', levelOverride); };
  window.makeDarkGauntlets = function(levelOverride){ return makeDarkEquipLatest('闇の籠手', levelOverride); };
  window.makeDarkHelm = function(levelOverride){ return makeDarkEquipLatest('闇の兜', levelOverride); };
  window.makeDarkBoots = function(levelOverride){ return makeDarkEquipLatest('暗黒の靴', levelOverride); };

  function grantDarkEquip(name){
    state.inventory.unshift(makeDarkEquipLatest(name, state.level));
    renderAll();
    scheduleSave();
    log('デバッグ：' + name + 'を倉庫に追加。','good');
  }
  function grantDarkSet(){
    DARK_NAMES.slice().reverse().forEach(name => state.inventory.unshift(makeDarkEquipLatest(name, state.level)));
    renderAll();
    scheduleSave();
    log('デバッグ：闇装備セット7種を倉庫に追加。','good');
  }

  window.grantDarkEquipLatest = grantDarkEquip;
  window.grantDarkSetLatest = grantDarkSet;

  function installDebugDarkButtons(){
    const panel = document.getElementById('debugPanel');
    if(!panel) return;
    let old = document.getElementById('latestDarkDebugBox');
    if(old) return;

    const box = document.createElement('div');
    box.id = 'latestDarkDebugBox';
    box.innerHTML = '<div style="width:100%;font-weight:700;color:#e5c3ff;">最新版 闇装備付与</div>';

    const setBtn = document.createElement('button');
    setBtn.type = 'button';
    setBtn.dataset.latestDarkSet = '1';
    setBtn.textContent = '闇装備セット7種';
    box.appendChild(setBtn);

    DARK_NAMES.forEach(name=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.latestDarkEquip = name;
      b.textContent = name;
      box.appendChild(b);
    });

    const close = document.getElementById('debugClose');
    if(close && close.parentNode) close.parentNode.insertBefore(box, close);
    else panel.appendChild(box);
  }

  document.addEventListener('pointerup', function(e){
    const set = e.target.closest?.('[data-latest-dark-set]');
    const eq = e.target.closest?.('[data-latest-dark-equip]');
    if(set){ e.preventDefault(); e.stopPropagation(); grantDarkSet(); return; }
    if(eq){ e.preventDefault(); e.stopPropagation(); grantDarkEquip(eq.dataset.latestDarkEquip); return; }
  }, true);

  function ensureTopPanelTabsLatest(){
    const header = document.querySelector('.topbar');
    if(!header) return;
    let nav = document.getElementById('topPanelTabs') || document.getElementById('v990TopPanelTabs');
    if(!nav){
      nav = document.createElement('nav');
      nav.id = 'topPanelTabs';
      nav.className = 'top-panel-tabs v990-top-panel-tabs';
      nav.setAttribute('aria-label','右パネル切り替え');
      nav.innerHTML = '<button type="button" data-menu-page="stats">ステータス</button><button type="button" data-menu-page="equip">装備/強化</button><button type="button" data-menu-page="inventory">倉庫</button><button type="button" data-menu-page="log">ログ</button>';
      header.appendChild(nav);
    }
    nav.querySelectorAll('button[data-menu-page]').forEach(btn=>{
      if(btn.__latestTabBound) return;
      btn.__latestTabBound = true;
      const run = (e)=>{
        e.preventDefault(); e.stopPropagation();
        setMenuPage(btn.dataset.menuPage);
        if(els.sidePanel){ els.sidePanel.classList.add('open'); els.sidePanel.style.pointerEvents='auto'; }
        nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.menuPage === state.menuPage));
        playUiClick?.();
      };
      btn.addEventListener('click', run);
      btn.addEventListener('pointerup', run, {passive:false});
    });
    nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.menuPage === (state.menuPage || 'stats')));
  }

  function ensureLogFilterLatest(){
    const logPanel = document.querySelector('.log-panel');
    const logEl = document.getElementById('log');
    if(!logPanel || !logEl) return;
    let bar = document.getElementById('logFilterBar');
    if(!bar){
      bar = document.createElement('div');
      bar.id = 'logFilterBar';
      bar.className = 'log-filter-bar';
      bar.innerHTML = '<button type="button" data-log-filter="all">すべて</button><button type="button" data-log-filter="damage">ダメージ</button><button type="button" data-log-filter="system">システム</button><button type="button" data-log-filter="drop">ドロップ</button>';
      logPanel.insertBefore(bar, logEl);
    }
    bar.querySelectorAll('button').forEach(btn=>{
      if(btn.__latestLogFilterBound) return;
      btn.__latestLogFilterBound = true;
      btn.addEventListener('click', e=>{ e.preventDefault(); state.logFilter = btn.dataset.logFilter; renderLogLatest(); });
      btn.addEventListener('pointerup', e=>{ e.preventDefault(); state.logFilter = btn.dataset.logFilter; renderLogLatest(); }, {passive:false});
    });
    renderLogLatest();
  }

  function classifyLogLatest(l){
    const s = String(l?.msg || '');
    if(/ドロップ|獲得|報酬|倉庫|経験値化|装備|強化石/.test(s)) return 'drop';
    if(/ダメージ|出血|暗黒出血|火傷|回復|MISS|GUARD|反射|剣舞|攻撃|斬撃|雷撃|炎斬り/.test(s)) return 'damage';
    return 'system';
  }
  function renderLogLatest(){
    const logEl = document.getElementById('log');
    if(!logEl || !state.log) return;
    const f = state.logFilter || 'all';
    const rows = state.log.filter(l => f === 'all' || classifyLogLatest(l) === f);
    logEl.innerHTML = rows.map(l=>`<div class="${l.cls||''}">[${l.time}] ${l.msg}</div>`).join('');
    document.querySelectorAll('#logFilterBar button').forEach(b=>b.classList.toggle('active', b.dataset.logFilter === f));
  }

  const oldLog = log;
  log = window.log = function(msg, cls='', html=false){
    oldLog.call(this, msg, cls, html);
    renderLogLatest();
  };

  const oldItemSummary = itemSummary;
  itemSummary = window.itemSummary = function(it){
    let s = oldItemSummary.apply(this, arguments);
    if(it?.darkArmor) s += (s?' / ':'') + '闇の鎧：被ダメ25%軽減 / 毎秒HP2%回復 / 暗黒出血最大20';
    if(it?.darkGauntlets) s += (s?' / ':'') + '闇の籠手：死線の剣舞発動回数+2';
    if(it?.darkHelm) s += (s?' / ':'') + '闇の兜：剣舞率+10% / 出血解除 / 剣舞中DOT無効';
    if(it?.darkBoots) s += (s?' / ':'') + '暗黒の靴：回避+25% / HP半分以下さらに+25%';
    return s;
  };

  const oldCalc = calcStats;
  calcStats = window.calcStats = function(){
    const s = oldCalc.apply(this, arguments);
    Object.values(state.equip||{}).filter(Boolean).forEach(it=>{
      if(it.darkArmor){
        s.darkArmor = true;
        s.darkDamageReduce = Math.max(s.darkDamageReduce||0, 0.25);
        s.darkRegenPerSecond = Math.max(s.darkRegenPerSecond||0, 0.02);
        s.darkBleedMax = Math.min(s.darkBleedMax||100, 20);
      }
      if(it.darkGauntlets) s.deathDanceCountBonus = Math.max(s.deathDanceCountBonus||0, 2);
      if(it.darkHelm){
        s.darkHelm = true;
        s.preventBleedDuringDance = true;
      }
      if(it.darkBoots){
        s.evasion = Math.min(0.75, (s.evasion||0) + 0.25 + (state.hp <= maxHp()*0.5 ? 0.25 : 0));
      }
    });
    return s;
  };

  const oldApplyShield = applyDarkShieldToDamage;
  applyDarkShieldToDamage = window.applyDarkShieldToDamage = function(dmg){
    let out = oldApplyShield.apply(this, arguments);
    const st = calcStats();
    if(st.darkDamageReduce) out = Math.max(1, Math.floor(out * (1 - st.darkDamageReduce)));
    return out;
  };

  const oldAddDarkBleed = addDarkBleed;
  addDarkBleed = window.addDarkBleed = function(target='hero'){
    if(target === 'hero' && state.deathDance && calcStats().preventBleedDuringDance) return false;
    const ok = oldAddDarkBleed.apply(this, arguments);
    if(target === 'hero'){
      ensureStatusContainers();
      const max = calcStats().darkBleedMax || 100;
      if((state.heroStatuses.darkBleeds||[]).length > max) state.heroStatuses.darkBleeds = state.heroStatuses.darkBleeds.slice(-max);
    }
    return ok;
  };

  const oldAddBleed = addBleed;
  addBleed = window.addBleed = function(target){
    if(target === 'hero' && state.deathDance && calcStats().preventBleedDuringDance) return false;
    return oldAddBleed.apply(this, arguments);
  };

  function clearDotsLatest(){
    ensureStatusContainers();
    if(state.heroStatuses){ state.heroStatuses.bleeds=[]; state.heroStatuses.darkBleeds=[]; state.heroStatuses.burnUntil=0; }
    if(state.enemyStatuses){ state.enemyStatuses.bleeds=[]; state.enemyStatuses.darkBleeds=[]; state.enemyStatuses.burnUntil=0; }
    renderStatusLists?.();
  }

  const oldHandleHeroDeath = handleHeroDeath;
  handleHeroDeath = window.handleHeroDeath = function(){
    clearDotsLatest();
    const r = oldHandleHeroDeath.apply(this, arguments);
    clearDotsLatest();
    return r;
  };

  const oldProcessDots = processStatusDots;
  processStatusDots = window.processStatusDots = function(now){
    oldProcessDots.apply(this, arguments);
    const st = calcStats();
    if(st.darkRegenPerSecond && !state.down && !state.deathDanceCutin){
      ensureStatusContainers();
      if(!state.heroStatuses.darkArmorRegenLast) state.heroStatuses.darkArmorRegenLast = now;
      const ticks = Math.floor((now - state.heroStatuses.darkArmorRegenLast) / 1000);
      if(ticks > 0){
        state.heroStatuses.darkArmorRegenLast += ticks * 1000;
        if(state.hp > 0 && state.hp < maxHp()){
          const heal = Math.max(1, Math.floor(maxHp() * st.darkRegenPerSecond * ticks));
          state.hp = Math.min(maxHp(), state.hp + heal);
          showHeroFloat('闇鎧+' + heal, 'heal');
        }
      }
    }
    darkHp0WatchdogLatest();
  };

  function clearDarkTimersLatest(){
    ['darkSwordReviveTimer','darkDanceTimer','darkDanceCutinTimer','darkDanceAttackTimer','darkDanceRecoveryTimer','darkTechniqueTimer','bleedTimer','darkBleedTimer','dotTimer'].forEach(k=>{
      try{ if(state[k]){ clearTimeout(state[k]); clearInterval(state[k]); state[k]=null; } }catch(e){}
      try{ if(window[k]){ clearTimeout(window[k]); clearInterval(window[k]); window[k]=null; } }catch(e){}
    });
    if(state.darkSwordComboTimers){ state.darkSwordComboTimers.forEach(id=>clearTimeout(id)); state.darkSwordComboTimers=[]; }
  }

  function darkHp0WatchdogLatest(){
    if(!state.enemy || state.enemy.id !== 'dark_sword_saint') return;
    if(state.enemyHp > 0) return;
    if(state.enemyStatuses && state.enemyStatuses.darkDeadConfirmed) return;
    state.enemyHp = 0;
    if(state.enemy){ state.enemy.dead = true; state.enemy.defeated = true; }
    if(state.enemyStatuses){
      state.enemyStatuses.darkDeadConfirmed = true;
      state.enemyStatuses.darkRevivingUntil = 0;
      state.enemyStatuses.darkReviveStart = 0;
      state.enemyStatuses.bleeds = [];
      state.enemyStatuses.darkBleeds = [];
    }
    clearDotsLatest();
    clearDarkTimersLatest();
    hideDeathDanceCutin?.();
    state.darkSwordCutinActive = false;
    state.deathDanceCutin = false;
    try{ enemyDefeated(); }catch(e){ console.warn('darkHp0WatchdogLatest', e); }
  }

  const oldVoice = playDarkSwordSaintVoice;
  let lastVoice = 0;
  playDarkSwordSaintVoice = window.playDarkSwordSaintVoice = function(){
    const now = Date.now();
    if(now - lastVoice < 1200) return;
    lastVoice = now;
    return oldVoice.apply(this, arguments);
  };

  const oldPlayBgm = playBgm;
  playBgm = window.playBgm = function(){
    if(isDarkSwordSaint?.() && state.bgmMode !== 'dance') state.bgmMode = 'dark_sword_saint';
    return oldPlayBgm.apply(this, arguments);
  };

  function hardTouchLatest(){
    if(!isTouchDevice?.()) return;
    document.querySelectorAll('#debugPanel button,#debugPanel input,#debugPanel label,.mobile-menu-tabs button,#topPanelTabs button,#equipToggleBtn,#debugBtn,#muteBtn,#fleeBtn,#fleeOkBtn,#fleeCancelBtn').forEach(el=>{
      if(el.__latestTouch) return;
      el.__latestTouch = true;
      el.style.pointerEvents='auto';
      el.style.touchAction='manipulation';
      el.addEventListener('touchend', function(e){
        if(e.target.closest?.('[data-latest-dark-set],[data-latest-dark-equip]')) return;
        try{ e.preventDefault(); e.stopPropagation(); }catch(_e){}
        setTimeout(()=>{ try{ el.click(); }catch(_e){} },0);
      }, {passive:false});
    });
    if(els.debugPanel) els.debugPanel.style.pointerEvents = els.debugPanel.classList.contains('hidden') ? 'none' : 'auto';
    if(els.sidePanel) els.sidePanel.style.pointerEvents = (!isSpPortrait() || els.sidePanel.classList.contains('open')) ? 'auto' : 'none';
  }

  function bootLatest(){
    setLatestVersion();
    installLatestCss();
    installDebugDarkButtons();
    ensureTopPanelTabsLatest();
    ensureLogFilterLatest();
    hardTouchLatest();
    darkHp0WatchdogLatest();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootLatest);
  else bootLatest();
  window.addEventListener('load', bootLatest);
  window.addEventListener('resize', bootLatest);
  setInterval(bootLatest, 500);
})();


/* latest final spec lock: direct integrated requirements */
(function(){
  'use strict';
  const BUILD = (window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  const DARK_NAMES = ['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'];
  const PAGE_LABELS = {stats:'ステータス', equip:'装備・強化', inventory:'倉庫', log:'ログ'};
  const LOG_LABELS = {all:'すべて', damage:'ダメージ', system:'システム', drop:'ドロップ'};

  function safe(fn){ try{return fn();}catch(e){ console.warn('[v99 final]', e); } }
  function byId(id){ return document.getElementById(id); }
  function markVersion(){
    safe(()=>{ if(typeof GAME_VERSION !== 'undefined') window.GAME_VERSION = BUILD; });
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>el.textContent='ver.'+BUILD);
    document.querySelectorAll('.debug-version').forEach(el=>el.textContent='Build: ver.'+BUILD);
    const fixed=byId('fixedBuildVersion'); if(fixed) fixed.textContent='ver.'+BUILD;
  }

  function ensureRightTabs(){
    const side=document.querySelector('.side-panel'); if(!side) return;
    let nav=side.querySelector('.side-tabs') || side.querySelector('.mobile-menu-tabs');
    if(!nav){ nav=document.createElement('nav'); side.prepend(nav); }
    nav.className='mobile-menu-tabs side-tabs';
    nav.setAttribute('aria-label','右側タブ');
    nav.innerHTML=Object.entries(PAGE_LABELS).map(([k,v])=>`<button type="button" data-menu-page="${k}">${v}</button>`).join('');
    nav.querySelectorAll('button').forEach(btn=>{
      const run=(e)=>{ if(e){e.preventDefault(); e.stopPropagation();} safe(()=>setMenuPage(btn.dataset.menuPage)); if(side) side.classList.add('open'); syncTabs(); safe(()=>playUiClick&&playUiClick()); };
      btn.onclick=run;
      btn.onpointerup=run;
      btn.ontouchend=run;
    });
    syncTabs();
  }
  function syncTabs(){
    const page=(window.state&&state.menuPage)||'stats';
    document.querySelectorAll('[data-menu-page]').forEach(b=>b.classList.toggle('active', b.dataset.menuPage===page));
    const map={stats:'.hero-stats', equip:'.equip-panel', inventory:'.inventory-panel', log:'.log-panel'};
    document.querySelectorAll('.side-panel .panel').forEach(p=>p.classList.remove('active-page'));
    const target=document.querySelector(map[page]||map.stats); if(target) target.classList.add('active-page');
  }
  if(typeof setMenuPage === 'function'){
    const baseSetMenuPage=setMenuPage;
    window.setMenuPage = setMenuPage = function(page){ const r=baseSetMenuPage.apply(this,arguments); syncTabs(); return r; };
  }

  function classifyLogEntry(l){
    const s=String((l&&l.msg)||l||''); const cls=String((l&&l.cls)||'');
    if(/ドロップ|獲得|報酬|倉庫|付与|装備|強化石|経験値化/.test(s)) return 'drop';
    if(/ダメージ|攻撃|斬撃|炎斬り|雷撃|剣舞|出血|暗黒出血|火傷|反射|回復|GUARD|MISS|吸収/.test(s) || /danger|skilllog|damage|fire|dark/.test(cls)) return 'damage';
    return 'system';
  }
  function ensureLogFilter(){
    const panel=document.querySelector('.log-panel'); const logEl=byId('log'); if(!panel||!logEl) return;
    let bar=byId('logFilterBar');
    if(!bar){ bar=document.createElement('div'); bar.id='logFilterBar'; bar.className='log-filter-bar'; panel.insertBefore(bar,logEl); }
    bar.innerHTML=Object.entries(LOG_LABELS).map(([k,v])=>`<button type="button" data-log-filter="${k}">${v}</button>`).join('');
    bar.querySelectorAll('button').forEach(btn=>{
      const run=(e)=>{ if(e){e.preventDefault(); e.stopPropagation();} state.logFilter=btn.dataset.logFilter||'all'; renderFilteredLog(); };
      btn.onclick=run; btn.onpointerup=run; btn.ontouchend=run;
    });
    renderFilteredLog();
  }
  function renderFilteredLog(){
    const logEl=byId('log'); if(!logEl||!window.state||!Array.isArray(state.log)) return;
    const filter=state.logFilter||'all';
    const rows=state.log.filter(l=>filter==='all'||(l.type||classifyLogEntry(l))===filter);
    logEl.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time||''}] ${l.msg||''}</div>`).join('');
    document.querySelectorAll('#logFilterBar button').forEach(b=>b.classList.toggle('active', b.dataset.logFilter===filter));
  }
  if(typeof log === 'function'){
    const baseLog=log;
    window.log = log = function(msg, cls='', html=false){
      const r=baseLog.apply(this, arguments);
      if(Array.isArray(state.log) && state.log[0] && !state.log[0].type) state.log[0].type=classifyLogEntry({msg,cls});
      renderFilteredLog();
      return r;
    };
  }

  function legendary(){ return (window.rarities&&rarities.find(r=>r.id==='legendary')) || {id:'legendary',name:'レジェンダリー',mult:3.2}; }
  function makeFallbackDark(name, levelOverride){
    const lv=Math.max(1, Math.floor(levelOverride || (state&&state.level) || 1)); const r=legendary();
    const slotMap={'闇の聖剣':'武器','闇の盾':'盾','闇のアミュレット':'アミュレット','闇の鎧':'鎧','闇の籠手':'腕','闇の兜':'兜','暗黒の靴':'足'};
    const it=(typeof makeItem==='function') ? makeItem(slotMap[name]||'リング', r, {isBossDrop:true}) : {id:String(Date.now()+Math.random()),slot:slotMap[name]||'リング'};
    Object.assign(it,{name,rarity:'legendary',rarityName:'レジェンダリー',specialFrame:'darkholy',darkEquip:true,level:0});
    if(name==='闇の聖剣'){ it.atk=Math.floor((34+lv*7)*r.mult); it.heroDarkBleedChance=.10; it.skill={id:'multi',name:'連続攻撃',chance:1,element:'physical'}; }
    if(name==='闇の盾'){ it.def=Math.floor((18+lv*5)*r.mult); it.hp=Math.floor((70+lv*14)*r.mult); it.darkShield=true; }
    if(name==='闇のアミュレット'){ it.hp=Math.floor((90+lv*16)*r.mult); it.deathDanceChance=.25; it.darkAmulet=true; }
    if(name==='闇の鎧'){ it.def=Math.floor((28+lv*6)*r.mult); it.hp=Math.floor((120+lv*22)*r.mult); it.darkArmor=true; it.darkDamageReduce=.25; it.darkBleedMax=20; }
    if(name==='闇の籠手'){ it.atk=Math.floor((22+lv*5)*r.mult); it.def=Math.floor((12+lv*4)*r.mult); it.darkGauntlets=true; it.deathDanceCountBonus=2; }
    if(name==='闇の兜'){ it.def=Math.floor((18+lv*5)*r.mult); it.hp=Math.floor((80+lv*15)*r.mult); it.darkHelm=true; it.deathDanceChance=.10; it.preventBleedDuringDance=true; }
    if(name==='暗黒の靴'){ it.def=Math.floor((12+lv*4)*r.mult); it.hp=Math.floor((70+lv*13)*r.mult); it.darkBoots=true; it.evasion=.25; it.lowHpEvasion=.25; }
    it.flavor = it.flavor || '暗黒剣聖に関わる闇装備。';
    return it;
  }
  window.makeDarkArmor=function(lv){ return makeFallbackDark('闇の鎧',lv); };
  window.makeDarkGauntlets=function(lv){ return makeFallbackDark('闇の籠手',lv); };
  window.makeDarkHelm=function(lv){ return makeFallbackDark('闇の兜',lv); };
  window.makeDarkBoots=function(lv){ return makeFallbackDark('暗黒の靴',lv); };
  function makeDark(name){
    if(name==='闇の聖剣' && typeof makeDarkHolySword==='function') return makeDarkHolySword(state.level);
    if(name==='闇の盾' && typeof makeDarkShield==='function') return makeDarkShield(state.level);
    if(name==='闇のアミュレット' && typeof makeDarkAmulet==='function') return makeDarkAmulet(state.level);
    return makeFallbackDark(name,state.level);
  }
  function grant(name){ state.inventory.unshift(makeDark(name)); safe(()=>renderAll()); safe(()=>scheduleSave()); safe(()=>log('デバッグ：'+name+'を付与。','good')); }
  function grantSet(){ DARK_NAMES.slice().reverse().forEach(n=>state.inventory.unshift(makeDark(n))); safe(()=>renderAll()); safe(()=>scheduleSave()); safe(()=>log('デバッグ：闇装備7種セットを付与。','good')); }

  function ensureDebug(){
    const panel=byId('debugPanel'); if(!panel) return;
    const grid=byId('debugGrantDarkItems');
    if(grid){ grid.innerHTML=DARK_NAMES.map(n=>`<button type="button" data-final-dark="${n}">${n}</button>`).join(''); }
    const bind=(id,fn)=>{ const el=byId(id); if(el){ el.onclick=(e)=>{e.preventDefault(); e.stopPropagation(); safe(()=>playUiClick&&playUiClick()); fn();}; el.onpointerup=el.onclick; el.ontouchend=el.onclick; } };
    bind('debugGrantDarkSet',grantSet);
    bind('debugHp0Kill',()=>{ if(state.enemy){ state.enemyHp=0; state.enemy.dead=true; state.enemy.defeated=true; safe(()=>enemyDefeated()); } });
    bind('debugForceDefeated',()=>{ forceEnemyDefeated(); });
    bind('debugClearBleed',()=>{ clearBleeds(); safe(()=>log('デバッグ：出血・暗黒出血を解除。','good')); });
    bind('debugStopDot',()=>{ clearBleeds(); stopDotTimers(); safe(()=>log('デバッグ：DOTタイマーを停止。','good')); });
    bind('debugStopDarkDance',()=>{ stopDarkDanceTimers(); safe(()=>log('デバッグ：暗黒剣舞タイマーを停止。','good')); });
    document.querySelectorAll('[data-final-dark]').forEach(b=>{ b.onclick=(e)=>{e.preventDefault(); e.stopPropagation(); grant(b.dataset.finalDark);}; b.onpointerup=b.onclick; b.ontouchend=b.onclick; });
  }
  function clearBleeds(){
    safe(()=>ensureStatusContainers&&ensureStatusContainers());
    ['heroStatuses','enemyStatuses'].forEach(k=>{ state[k]=state[k]||{}; state[k].bleeds=[]; state[k].darkBleeds=[]; state[k].burnUntil=0; state[k].lastBleedTick=performance.now(); state[k].lastDarkBleedTick=performance.now(); });
    safe(()=>renderStatusLists&&renderStatusLists());
  }
  function stopDotTimers(){ ['bleedTimer','darkBleedTimer','dotTimer','statusTimer'].forEach(k=>{ safe(()=>{ if(state[k]){clearTimeout(state[k]);clearInterval(state[k]);state[k]=null;} }); safe(()=>{ if(window[k]){clearTimeout(window[k]);clearInterval(window[k]);window[k]=null;} }); }); clearBleeds(); }
  function stopDarkDanceTimers(){
    safe(()=>clearDarkSwordTimers&&clearDarkSwordTimers());
    ['darkSwordReviveTimer','darkDanceTimer','darkDanceCutinTimer','darkDanceAttackTimer','darkDanceRecoveryTimer','darkTechniqueTimer'].forEach(k=>{ safe(()=>{ if(state[k]){clearTimeout(state[k]);clearInterval(state[k]);state[k]=null;} }); safe(()=>{ if(window[k]){clearTimeout(window[k]);clearInterval(window[k]);window[k]=null;} }); });
    if(state.darkSwordComboTimers){ state.darkSwordComboTimers.forEach(id=>safe(()=>clearTimeout(id))); state.darkSwordComboTimers=[]; }
    if(state.enemyStatuses){ state.enemyStatuses.darkRevivingUntil=0; state.enemyStatuses.darkReviveStart=0; }
    state.darkSwordCutinActive=false; state.deathDanceCutin=false; safe(()=>hideDeathDanceCutin&&hideDeathDanceCutin());
    safe(()=>setBgmMode&&setBgmMode((state.enemy&&state.enemy.id==='dark_sword_saint'&&state.enemyHp>0)?'dark_sword_saint':'normal'));
  }
  function forceEnemyDefeated(){
    if(!state.enemy) return;
    state.enemyHp=0; state.enemy.dead=true; state.enemy.defeated=true;
    if(state.enemyStatuses){ state.enemyStatuses.darkDeadConfirmed=true; state.enemyStatuses.darkRevivingUntil=0; state.enemyStatuses.darkReviveStart=0; }
    stopDarkDanceTimers(); clearBleeds(); safe(()=>enemyDefeated());
  }

  if(typeof tryDarkSwordDanceRevive === 'function'){
    const baseTry=tryDarkSwordDanceRevive;
    window.tryDarkSwordDanceRevive = tryDarkSwordDanceRevive = function(){
      const r=baseTry.apply(this, arguments);
      if(r){ state.deathDanceBattleCount=0; state.deathDanceComboCount=0; safe(()=>log('暗黒剣舞：主人公の死線の剣舞発動回数をリセット。','danger')); }
      return r;
    };
  }
  if(typeof setBgmMode === 'function'){
    const baseSetBgm=setBgmMode;
    window.setBgmMode = setBgmMode = function(mode){
      if(state && state.enemy && state.enemy.id==='dark_sword_saint' && state.enemyHp>0 && mode==='normal') mode='dark_sword_saint';
      return baseSetBgm.call(this, mode);
    };
  }
  if(typeof playDarkSwordSaintVoice === 'function'){
    const baseVoice=playDarkSwordSaintVoice; let last=0;
    window.playDarkSwordSaintVoice = playDarkSwordSaintVoice = function(){ const now=Date.now(); if(now-last<1200) return; last=now; return baseVoice.apply(this,arguments); };
  }
  if(typeof confirmFlee === 'function'){
    const baseConfirm=confirmFlee;
    window.confirmFlee = confirmFlee = function(){
      const btn=byId('fleeBtn'); if(btn){ btn.textContent='🏃'; btn.setAttribute('aria-label','逃走'); }
      const cancel=byId('fleeCancelBtn'); if(cancel) cancel.textContent='キャンセル';
      const ok=byId('fleeOkBtn'); if(ok) ok.textContent='逃走する';
      return baseConfirm.apply(this,arguments);
    };
  }

  function outsideCloseStatus(e){
    const detail=byId('statusDetailPanel')||byId('statusCardPopup')||document.querySelector('.status-detail-panel,.status-card-popup,.tooltip:not(.hidden)');
    if(!detail || detail.classList.contains('hidden')) return;
    if(detail.contains(e.target) || e.target.closest?.('.status-badge,.status-list,.equip,.item')) return;
    detail.classList.add('hidden');
    const tip=byId('tooltip'); if(tip) tip.classList.add('hidden');
  }
  document.addEventListener('pointerup', outsideCloseStatus, true);
  document.addEventListener('click', outsideCloseStatus, true);

  function boot(){
    markVersion(); ensureRightTabs(); ensureLogFilter(); ensureDebug(); syncTabs();
    const flee=byId('fleeBtn'); if(flee){ flee.textContent='🏃'; flee.setAttribute('aria-label','逃走'); }
    const cancel=byId('fleeCancelBtn'); if(cancel) cancel.textContent='キャンセル';
    const ok=byId('fleeOkBtn'); if(ok) ok.textContent='逃走する';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',boot); window.addEventListener('resize',boot); setInterval(boot,1000);
})();


/* latest final stability patch: layout, logs, dark saint, dark equips */
(function(){
  'use strict';
  const BUILD=(window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  const DARK_NAMES=['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'];
  const LOG_LABELS={all:'すべて',damage:'ダメージ',system:'システム',drop:'ドロップ'};
  function safe(fn){try{return fn();}catch(e){console.warn('[latest]',e);}}
  function id(x){return document.getElementById(x)}
  function ver(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(e=>e.textContent='ver.'+BUILD);
    document.querySelectorAll('.debug-version').forEach(e=>e.textContent='Build: ver.'+BUILD);
    const f=id('fixedBuildVersion'); if(f) f.textContent='ver.'+BUILD;
  }
  function preloadDarkAssets(){
    if(window.__mbh991Preloaded) return; window.__mbh991Preloaded=true;
    ['assets/enemy_dark_sword_saint.png','assets/cutin_dark_sword_dance.png','assets/cutin_dark_sword_technique.png'].forEach(src=>{
      const img=new Image(); img.decoding='async'; img.loading='eager'; img.src=src;
      if(img.decode) img.decode().catch(()=>{});
    });
  }
  function classify(l){
    const s=String((l&&l.msg)||l||'').replace(/<[^>]*>/g,''); const cls=String((l&&l.cls)||'');
    if(/装備ドロップ|ドロップ|報酬|倉庫|付与|強化石|経験値化|獲得/.test(s)) return 'drop';
    if(/ダメージ|攻撃|斬撃|炎斬り|雷撃|剣舞|出血|暗黒出血|火傷|反射|回復|GUARD|MISS|吸収|不発|撃破/.test(s)||/danger|skilllog|damage|fire|dark/.test(cls)) return 'damage';
    return 'system';
  }
  function renderLog991(){
    const logEl=id('log'); if(!logEl||!window.state||!Array.isArray(state.log)) return;
    const f=state.logFilter||'all';
    const rows=state.log.filter(l=>f==='all'||(l.type||classify(l))===f);
    logEl.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time||''}] ${l.msg||''}</div>`).join('');
    document.querySelectorAll('#logFilterBar button,#logFilterTabs button').forEach(b=>b.classList.toggle('active',(b.dataset.logFilter||'all')===f));
  }
  function ensureLog991(){
    const panel=document.querySelector('.log-panel'); const logEl=id('log'); if(!panel||!logEl) return;
    let bar=id('logFilterBar');
    if(!bar){bar=document.createElement('div'); bar.id='logFilterBar'; bar.className='log-filter-bar'; panel.insertBefore(bar,logEl);}    
    bar.innerHTML=Object.entries(LOG_LABELS).map(([k,v])=>`<button type="button" data-log-filter="${k}">${v}</button>`).join('');
    renderLog991();
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('#logFilterBar button,#logFilterTabs button'); if(!b) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    state.logFilter=b.dataset.logFilter||'all'; renderLog991();
  },true);
  document.addEventListener('pointerup',function(e){
    const b=e.target.closest&&e.target.closest('#logFilterBar button,#logFilterTabs button'); if(!b) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    state.logFilter=b.dataset.logFilter||'all'; renderLog991();
  },true);
  if(typeof log==='function'){
    window.log = log = function(msg, cls='', html=false){
      const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
      const safeMsg=html?msg:(typeof escapeHtml==='function'?escapeHtml(msg):String(msg));
      const entry={time,msg:safeMsg,cls,html:true,type:classify({msg,cls})};
      state.log.unshift(entry); state.log=state.log.slice(0,200); renderLog991();
    };
  }
  function rarity(){return (window.rarities&&rarities.find(r=>r.id==='legendary'))||{id:'legendary',name:'レジェンダリー',mult:3.2};}
  function slotOf(name){return {'闇の聖剣':'武器','闇の盾':'盾','闇のアミュレット':'アミュレット','闇の鎧':'鎧','闇の籠手':'腕','闇の兜':'兜','暗黒の靴':'足'}[name]||'リング';}
  function makeDark991(name,lv){
    lv=Math.max(1,Math.floor(lv||(window.state&&state.level)||1));
    if(name==='闇の聖剣'&&typeof makeDarkHolySword==='function') return makeDarkHolySword(lv);
    if(name==='闇の盾'&&typeof makeDarkShield==='function') return makeDarkShield(lv);
    if(name==='闇のアミュレット'&&typeof makeDarkAmulet==='function') return makeDarkAmulet(lv);
    const r=rarity(); const mult=r.mult||3.2;
    const it=(typeof makeItem==='function')?makeItem(slotOf(name),r,{isBossDrop:true}):{id:'d'+Date.now()+Math.random(),slot:slotOf(name)};
    Object.assign(it,{name,rarity:'legendary',rarityName:'レジェンダリー',specialFrame:'darkholy',darkEquip:true,level:it.level||0});
    if(name==='闇の鎧'){it.def=Math.floor((28+lv*6)*mult);it.hp=Math.floor((120+lv*22)*mult);it.darkArmor=true;it.darkDamageReduce=.25;it.darkRegenPerSecond=.02;it.darkBleedMax=20;it.flavor='被ダメージ25%軽減。1秒ごとに最大HP2%回復。暗黒出血を最大20スタックへ抑える。';}
    if(name==='闇の籠手'){it.atk=Math.floor((22+lv*5)*mult);it.def=Math.floor((12+lv*4)*mult);it.hp=Math.floor((55+lv*10)*mult);it.darkGauntlets=true;it.deathDanceCountBonus=2;it.flavor='死線の剣舞発動時、剣舞発動回数+2。';}
    if(name==='闇の兜'){it.def=Math.floor((18+lv*5)*mult);it.hp=Math.floor((80+lv*15)*mult);it.darkHelm=true;it.deathDanceChance=.10;it.preventBleedDuringDance=true;it.flavor='死線の剣舞発動率+10%。出血・暗黒出血解除。剣舞中は出血系を受けない。';}
    if(name==='暗黒の靴'){it.def=Math.floor((12+lv*4)*mult);it.hp=Math.floor((70+lv*13)*mult);it.darkBoots=true;it.evasion=.25;it.lowHpEvasion=.25;it.flavor='回避率+25%。HP半分以下でさらに+25%。';}
    return it;
  }
  window.makeDarkArmor=function(lv){return makeDark991('闇の鎧',lv)};
  window.makeDarkGauntlets=function(lv){return makeDark991('闇の籠手',lv)};
  window.makeDarkHelm=function(lv){return makeDark991('闇の兜',lv)};
  window.makeDarkBoots=function(lv){return makeDark991('暗黒の靴',lv)};
  function grantDark991(name){state.inventory.unshift(makeDark991(name,state.level)); safe(()=>renderAll()); safe(()=>scheduleSave()); safe(()=>log('デバッグ：'+name+'を付与。','good'));}
  function grantSet991(){DARK_NAMES.slice().reverse().forEach(n=>state.inventory.unshift(makeDark991(n,state.level))); safe(()=>renderAll()); safe(()=>scheduleSave()); safe(()=>log('デバッグ：闇装備7種セットを付与。','good'));}
  function ensureDebug991(){
    const panel=id('debugPanel'); if(!panel) return;
    let box=id('debugGrantDarkItems');
    if(!box){box=document.createElement('div'); box.id='debugGrantDarkItems'; box.className='debug-grid'; panel.insertBefore(box,id('debugHp0Kill')||id('debugClose')||null);}    
    box.innerHTML=DARK_NAMES.map(n=>`<button type="button" data-dark991="${n}">${n}</button>`).join('');
    const set=id('debugGrantDarkSet'); if(set) set.textContent='闇装備7種セット付与';
  }
  document.addEventListener('click',function(e){
    const set=e.target.closest&&e.target.closest('#debugGrantDarkSet,[data-latest-dark-set]');
    const item=e.target.closest&&e.target.closest('[data-dark991],[data-final-dark],[data-latest-dark-equip]');
    if(set){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantSet991(); return;}
    if(item){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantDark991(item.dataset.dark991||item.dataset.finalDark||item.dataset.latestDarkEquip); return;}
  },true);
  document.addEventListener('pointerup',function(e){
    const set=e.target.closest&&e.target.closest('#debugGrantDarkSet,[data-latest-dark-set]');
    const item=e.target.closest&&e.target.closest('[data-dark991],[data-final-dark],[data-latest-dark-equip]');
    if(set){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantSet991(); return;}
    if(item){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantDark991(item.dataset.dark991||item.dataset.finalDark||item.dataset.latestDarkEquip); return;}
  },true);
  function resetHeroDance991(){
    if(!window.state) return;
    state.deathDanceBattleCount=0; state.deathDanceComboCount=0;
    if(state.deathDance){ state.deathDance=false; state.deathDanceUntil=0; const a=id('deathAura'); if(a)a.classList.add('hidden'); const d=id('deathDanceStatus'); if(d)d.classList.add('hidden'); }
  }
  if(typeof tryDarkSwordDanceRevive==='function'){
    const baseTry=tryDarkSwordDanceRevive;
    window.tryDarkSwordDanceRevive = tryDarkSwordDanceRevive = function(){
      const before=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      const r=baseTry.apply(this,arguments);
      const after=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      if(r||after>before){resetHeroDance991(); safe(()=>log('暗黒剣舞：主人公の死線の剣舞発動回数をリセット。','danger'));}
      return r;
    };
  }
  if(typeof finishDarkSwordDanceRevive==='function'){
    const baseFinish=finishDarkSwordDanceRevive;
    window.finishDarkSwordDanceRevive = finishDarkSwordDanceRevive = function(){resetHeroDance991(); return baseFinish.apply(this,arguments);};
  }
  function darkDeadFinalize991(){
    if(!state.enemy||state.enemy.id!=='dark_sword_saint') return;
    if(state.enemyHp>0) return;
    if(state.deathDanceCutin||state.darkSwordCutinActive) return;
    if(state.enemyStatuses&&state.enemyStatuses.darkRevivingUntil>performance.now()) return;
    const count=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
    if(count<10 && !(state.enemy&&state.enemy.dead&&state.enemy.defeated) && !(state.enemyStatuses&&state.enemyStatuses.darkDeadConfirmed)) return;
    if(state.__darkDefeatFinalizing991) return;
    state.__darkDefeatFinalizing991=true;
    safe(()=>{if(state.enemyStatuses){state.enemyStatuses.darkDeadConfirmed=true;state.enemyStatuses.darkRevivingUntil=0;state.enemyStatuses.darkReviveStart=0;}});
    safe(()=>clearDarkSwordTimers&&clearDarkSwordTimers()); safe(()=>hideDeathDanceCutin&&hideDeathDanceCutin());
    state.darkSwordCutinActive=false; state.deathDanceCutin=false; state.enemyHp=0; if(state.enemy){state.enemy.dead=true;state.enemy.defeated=true;}
    setTimeout(()=>{safe(()=>enemyDefeated&&enemyDefeated()); setTimeout(()=>{state.__darkDefeatFinalizing991=false; if(!state.enemy) safe(()=>spawnEnemy&&spawnEnemy());},1200);},30);
  }
  const baseEnemyDefeated991 = (typeof enemyDefeated==='function') ? enemyDefeated : null;
  if(baseEnemyDefeated991){
    window.enemyDefeated = enemyDefeated = function(){
      const wasDark=state.enemy&&state.enemy.id==='dark_sword_saint';
      state.__lastEnemyDefeatAt991=Date.now();
      const r=baseEnemyDefeated991.apply(this,arguments);
      if(wasDark){ setTimeout(()=>{ if(!state.enemy && Date.now()-(state.__lastEnemyDefeatAt991||0)>900) safe(()=>spawnEnemy&&spawnEnemy()); },1800); }
      return r;
    };
  }
  function bindCardStatus991(){
    [['enemyCard','enemy'],['heroCard','hero']].forEach(([cid,target])=>{
      const el=id(cid); if(!el||el.__status991) return; el.__status991=true; el.style.pointerEvents='auto'; el.style.cursor='pointer';
      const open=e=>{ if(e){e.preventDefault();e.stopPropagation();} safe(()=>showStatusListPanel?showStatusListPanel(target):null); };
      el.addEventListener('click',open,true); el.addEventListener('pointerup',open,{capture:true,passive:false}); el.addEventListener('touchend',open,{capture:true,passive:false});
    });
  }
  function fixLabels991(){
    document.querySelectorAll('button').forEach(b=>{ if((b.textContent||'').trim()==='強化選択') b.textContent='強化'; });
    const flee=id('fleeBtn'); if(flee){flee.textContent='🏃';flee.setAttribute('aria-label','逃走');}
    const ok=id('fleeOkBtn'); if(ok) ok.textContent='逃走する'; const ca=id('fleeCancelBtn'); if(ca) ca.textContent='キャンセル';
  }
  function boot991(){ver(); preloadDarkAssets(); ensureLog991(); ensureDebug991(); bindCardStatus991(); fixLabels991(); renderLog991();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot991); else boot991();
  window.addEventListener('load',boot991); window.addEventListener('resize',boot991);
  setInterval(()=>{boot991(); darkDeadFinalize991();},700);
})();

/* latest confirmed bugfix: dark saint transition, dark dance reset, debug dark equips, log filters, labels */
(function(){
  'use strict';
  const BUILD=(window.MINI_BROWSER_HERO_LATEST_VERSION || GAME_VERSION);
  const DARK_NAMES=['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'];
  const LOG_LABELS={all:'すべて',damage:'ダメージ',system:'システム',drop:'ドロップ'};
  function byId(id){return document.getElementById(id);}
  function safe(fn){try{return fn();}catch(e){console.warn('[latest]',e);}}
  function updateVersion992(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(e=>e.textContent='ver.'+BUILD);
    document.querySelectorAll('.debug-version').forEach(e=>e.textContent='Build: ver.'+BUILD);
    const f=byId('fixedBuildVersion'); if(f) f.textContent='ver.'+BUILD;
  }
  function rawText(x){return String(x||'').replace(/<[^>]*>/g,'');}
  function classifyLog992(entry){
    const msg=rawText(entry&&entry.msg!==undefined?entry.msg:entry);
    const cls=String((entry&&entry.cls)||'');
    if(/装備ドロップ|ドロップ|討伐報酬|報酬|付与|強化石|獲得|倉庫|経験値化/.test(msg)) return 'drop';
    if(/\d+ダメージ|攻撃|斬撃|剣舞|暗黒剣舞|暗黒剣技|出血|暗黒出血|火傷|反射|回復|GUARD|MISS|吸収|不発|撃破/.test(msg) || /damage|danger|skilllog|fire|dark/.test(cls)) return 'damage';
    return 'system';
  }
  function renderLog992(){
    const logEl=byId('log');
    if(!logEl || !Array.isArray(state.log)) return;
    const filter=state.logFilter||'all';
    const rows=state.log.filter(l=>filter==='all' || (l.type||classifyLog992(l))===filter);
    logEl.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time||''}] ${l.msg||''}</div>`).join('');
    document.querySelectorAll('#logFilterBar button,#logFilterTabs button,[data-log-filter]').forEach(b=>{
      if(b.dataset&&b.dataset.logFilter) b.classList.toggle('active',(b.dataset.logFilter||'all')===filter);
    });
  }
  function ensureLogFilter992(){
    const logEl=byId('log'); if(!logEl) return;
    const panel=logEl.closest('.log-panel') || logEl.parentElement;
    if(!panel) return;
    let bar=byId('logFilterBar');
    if(!bar){ bar=document.createElement('div'); bar.id='logFilterBar'; bar.className='log-filter-bar'; panel.insertBefore(bar,logEl); }
    bar.innerHTML=Object.entries(LOG_LABELS).map(([k,v])=>`<button type="button" data-log-filter="${k}">${v}</button>`).join('');
    renderLog992();
  }
  function onLogFilter992(e){
    const b=e.target.closest&&e.target.closest('#logFilterBar button,#logFilterTabs button,[data-log-filter]');
    if(!b || !b.dataset || !b.dataset.logFilter) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    state.logFilter=b.dataset.logFilter||'all';
    renderLog992();
  }
  document.addEventListener('click',onLogFilter992,true);
  document.addEventListener('pointerup',onLogFilter992,{capture:true,passive:false});
  const baseLog992 = (typeof log==='function') ? log : null;
  window.log = log = function(msg, cls='', html=false){
    const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
    const safeMsg=html?msg:(typeof escapeHtml==='function'?escapeHtml(msg):String(msg));
    state.log.unshift({time,msg:safeMsg,cls,html:true,type:classifyLog992({msg,cls})});
    state.log=state.log.slice(0,200);
    renderLog992();
  };

  function resetHeroDeathDance992(){
    state.deathDanceBattleCount=0;
    state.deathDanceComboCount=0;
    state.deathDance=false;
    state.deathDanceUntil=0;
    const aura=byId('deathAura'); if(aura) aura.classList.add('hidden');
    const stat=byId('deathDanceStatus'); if(stat) stat.classList.add('hidden');
    safe(()=>renderBattle&&renderBattle());
    safe(()=>renderStatusLists&&renderStatusLists());
  }
  if(typeof tryDarkSwordDanceRevive==='function'){
    const baseTry=tryDarkSwordDanceRevive;
    window.tryDarkSwordDanceRevive = tryDarkSwordDanceRevive = function(){
      const before=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      const result=baseTry.apply(this,arguments);
      const after=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      if(result || after>before){
        resetHeroDeathDance992();
        safe(()=>log('暗黒剣舞：主人公の死線の剣舞発動回数をリセット。','danger'));
      }
      return result;
    };
  }
  if(typeof showDarkSwordDanceCutin==='function'){
    const baseShow=showDarkSwordDanceCutin;
    window.showDarkSwordDanceCutin = showDarkSwordDanceCutin = function(){
      resetHeroDeathDance992();
      return baseShow.apply(this,arguments);
    };
  }
  if(typeof finishDarkSwordDanceRevive==='function'){
    const baseFinish=finishDarkSwordDanceRevive;
    window.finishDarkSwordDanceRevive = finishDarkSwordDanceRevive = function(){
      resetHeroDeathDance992();
      return baseFinish.apply(this,arguments);
    };
  }

  function rarity992(){return (typeof rarities!=='undefined'&&rarities.find(r=>r.id==='legendary')) || {id:'legendary',name:'レジェンダリー',mult:3.2,color:'#b06cff'};}
  function slotOf992(name){return {'闇の聖剣':'武器','闇の盾':'盾','闇のアミュレット':'アミュレット','闇の鎧':'鎧','闇の籠手':'腕','闇の兜':'兜','暗黒の靴':'足'}[name]||'リング';}
  function baseDarkItem992(name,lv){
    lv=Math.max(1,Math.floor(lv||state.level||1));
    const r=rarity992();
    let it;
    if(typeof makeItem==='function') it=makeItem(slotOf992(name),r,{isBossDrop:true});
    else it={id:'dark_'+Date.now()+'_'+Math.random().toString(16).slice(2),slot:slotOf992(name),level:0};
    Object.assign(it,{name,rarity:'legendary',rarityName:'レジェンダリー',specialFrame:'darkholy',darkEquip:true,level:it.level||0});
    return {it,lv,mult:r.mult||3.2};
  }
  function makeDark992(name,lv){
    lv=Math.max(1,Math.floor(lv||state.level||1));
    if(name==='闇の聖剣' && typeof makeDarkHolySword==='function') return makeDarkHolySword(lv);
    if(name==='闇の盾' && typeof makeDarkShield==='function') return makeDarkShield(lv);
    if(name==='闇のアミュレット' && typeof makeDarkAmulet==='function') return makeDarkAmulet(lv);
    const o=baseDarkItem992(name,lv), it=o.it, mult=o.mult;
    if(name==='闇の鎧') Object.assign(it,{def:Math.floor((28+lv*6)*mult),hp:Math.floor((120+lv*22)*mult),darkArmor:true,darkDamageReduce:.25,darkRegenPerSecond:.02,darkBleedMax:20,flavor:'被ダメージ25%軽減。1秒ごとに最大HP2%回復。暗黒出血を最大20スタックへ抑える。'});
    if(name==='闇の籠手') Object.assign(it,{atk:Math.floor((22+lv*5)*mult),def:Math.floor((12+lv*4)*mult),hp:Math.floor((55+lv*10)*mult),darkGauntlets:true,deathDanceCountBonus:2,flavor:'死線の剣舞発動時、剣舞発動回数+2。'});
    if(name==='闇の兜') Object.assign(it,{def:Math.floor((18+lv*5)*mult),hp:Math.floor((80+lv*15)*mult),darkHelm:true,deathDanceChance:.10,preventBleedDuringDance:true,flavor:'死線の剣舞発動率+10%。出血・暗黒出血解除。剣舞中は出血系を受けない。'});
    if(name==='暗黒の靴') Object.assign(it,{def:Math.floor((12+lv*4)*mult),hp:Math.floor((70+lv*13)*mult),darkBoots:true,evasion:.25,lowHpEvasion:.25,flavor:'回避率+25%。HP半分以下でさらに+25%。'});
    return it;
  }
  window.makeDarkArmor=function(lv){return makeDark992('闇の鎧',lv);};
  window.makeDarkGauntlets=function(lv){return makeDark992('闇の籠手',lv);};
  window.makeDarkHelm=function(lv){return makeDark992('闇の兜',lv);};
  window.makeDarkBoots=function(lv){return makeDark992('暗黒の靴',lv);};
  function grantDarkItem992(name){
    if(!DARK_NAMES.includes(name)) return;
    state.inventory.unshift(makeDark992(name,state.level));
    safe(()=>renderAll&&renderAll()); safe(()=>scheduleSave&&scheduleSave()); safe(()=>log('デバッグ：'+name+'を付与。','good'));
  }
  function grantDarkSet992(){
    DARK_NAMES.slice().reverse().forEach(n=>state.inventory.unshift(makeDark992(n,state.level)));
    safe(()=>renderAll&&renderAll()); safe(()=>scheduleSave&&scheduleSave()); safe(()=>log('デバッグ：闇装備7種セットを付与。','good'));
  }
  window.grantDarkEquipLatest=grantDarkItem992;
  window.grantDarkSetLatest=grantDarkSet992;
  function ensureDebugDark992(){
    const panel=byId('debugPanel'); if(!panel) return;
    let set=byId('debugGrantDarkSet');
    if(!set){ set=document.createElement('button'); set.id='debugGrantDarkSet'; set.type='button'; set.textContent='闇装備7種セット付与'; panel.insertBefore(set,byId('debugHp0Kill')||byId('debugClose')||null); }
    let box=byId('debugGrantDarkItems');
    if(!box){ box=document.createElement('div'); box.id='debugGrantDarkItems'; box.className='debug-grid'; panel.insertBefore(box,byId('debugHp0Kill')||byId('debugClose')||null); }
    box.innerHTML=DARK_NAMES.map(n=>`<button type="button" data-dark992="${n}">${n}</button>`).join('');
  }
  function onDebugDark992(e){
    const set=e.target.closest&&e.target.closest('#debugGrantDarkSet,[data-latest-dark-set]');
    const item=e.target.closest&&e.target.closest('[data-dark992],[data-dark991],[data-final-dark],[data-latest-dark-equip]');
    if(set){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantDarkSet992(); return; }
    if(item){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantDarkItem992(item.dataset.dark992||item.dataset.dark991||item.dataset.finalDark||item.dataset.latestDarkEquip); return; }
  }
  document.addEventListener('click',onDebugDark992,true);
  document.addEventListener('pointerup',onDebugDark992,{capture:true,passive:false});

  const baseEnemyDefeated992=(typeof enemyDefeated==='function')?enemyDefeated:null;
  if(baseEnemyDefeated992){
    window.enemyDefeated = enemyDefeated = function(){
      if(state.__enemyDefeatedRunning992) return;
      const wasDark=state.enemy&&state.enemy.id==='dark_sword_saint';
      state.__enemyDefeatedRunning992=true;
      let result;
      try{ result=baseEnemyDefeated992.apply(this,arguments); }
      finally{ setTimeout(()=>{state.__enemyDefeatedRunning992=false;},300); }
      if(wasDark){
        setTimeout(()=>{
          if(!state.enemy){ safe(()=>spawnEnemy&&spawnEnemy()); }
        },1400);
      }
      return result;
    };
  }
  function forceFinalizeDark992(){
    if(!state.enemy || state.enemy.id!=='dark_sword_saint') return;
    if(state.enemyHp>0) return;
    const reviving=state.enemyStatuses && (state.enemyStatuses.darkRevivingUntil||0)>performance.now();
    if(reviving || state.deathDanceCutin || state.darkSwordCutinActive) return;
    if(state.__darkFinalize992) return;
    state.__darkFinalize992=true;
    safe(()=>{ if(state.enemyStatuses){ state.enemyStatuses.darkDeadConfirmed=true; state.enemyStatuses.darkRevivingUntil=0; state.enemyStatuses.darkReviveStart=0; state.enemyStatuses.bleeds=[]; state.enemyStatuses.darkBleeds=[]; }});
    safe(()=>clearDarkSwordTimers&&clearDarkSwordTimers()); safe(()=>hideDeathDanceCutin&&hideDeathDanceCutin());
    state.enemyHp=0; if(state.enemy){ state.enemy.dead=true; state.enemy.defeated=true; }
    state.darkSwordCutinActive=false; state.deathDanceCutin=false;
    setTimeout(()=>{ safe(()=>enemyDefeated&&enemyDefeated()); setTimeout(()=>{state.__darkFinalize992=false; if(!state.enemy) safe(()=>spawnEnemy&&spawnEnemy());},1600); },50);
  }
  function fixUpgradeLabels992(){
    document.querySelectorAll('button').forEach(b=>{ if((b.textContent||'').trim()==='強化選択') b.textContent='強化'; });
  }
  function boot992(){ updateVersion992(); ensureLogFilter992(); ensureDebugDark992(); fixUpgradeLabels992(); renderLog992(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot992); else boot992();
  window.addEventListener('load',boot992); window.addEventListener('resize',boot992);
  setInterval(()=>{boot992(); forceFinalizeDark992();},500);
})();


/* latest-version authority: single-source build version + cache-safe display */
(function(){
  function latest(){
    return (window.MINI_BROWSER_HERO_LATEST_VERSION || window.MINI_BROWSER_HERO_BUILD_VERSION || document.documentElement.dataset.buildVersion || window.GAME_VERSION || '99.6');
  }
  function applyLatestVersion(){
    var v = latest();
    window.GAME_VERSION = v;
    window.MINI_BROWSER_HERO_LATEST_VERSION = v;
    window.MINI_BROWSER_HERO_BUILD_VERSION = v;
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(function(el){ el.textContent = 'ver.' + v; });
    document.querySelectorAll('.debug-version').forEach(function(el){ el.textContent = 'Build: ver.' + v; });
    var fixed = document.getElementById('fixedBuildVersion');
    if(fixed) fixed.textContent = 'ver.' + v;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyLatestVersion); else applyLatestVersion();
  window.addEventListener('load', applyLatestVersion);
  window.addEventListener('pageshow', applyLatestVersion);
  setInterval(applyLatestVersion, 250);
})();


/* ver99.6 definitive fixes: direct final overrides */
(function(){
  'use strict';
  const BUILD='99.6';
  const DARK_NAMES=['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'];
  const LOG_LABELS={all:'すべて',damage:'ダメージ',system:'システム',drop:'ドロップ'};
  const $=id=>document.getElementById(id);
  const safe=fn=>{try{return fn&&fn();}catch(e){console.warn('[99.6]',e);}};
  window.MINI_BROWSER_HERO_LATEST_VERSION=BUILD;
  window.MINI_BROWSER_HERO_BUILD_VERSION=BUILD;
  window.GAME_VERSION=BUILD;
  if(document.documentElement) document.documentElement.dataset.buildVersion=BUILD;
  function applyVersion994(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>el.textContent='ver.'+BUILD);
    document.querySelectorAll('.debug-version').forEach(el=>el.textContent='Build: ver.'+BUILD);
  }
  function resetHeroDeathDance994(){
    state.deathDanceBattleCount=0;
    state.deathDanceComboCount=0;
    state.deathDance=false;
    state.deathDanceUntil=0;
    state.deathDanceCutin=false;
    if(window.els){
      if(els.deathAura) els.deathAura.classList.add('hidden');
      if(els.deathDanceStatus) els.deathDanceStatus.classList.add('hidden');
      if(els.deathDanceCutin) els.deathDanceCutin.classList.add('hidden');
    }
    safe(()=>hideDeathDanceCutin());
    safe(()=>renderStatusLists());
    safe(()=>renderBattle());
  }
  window.resetHeroDeathDanceForDarkSwordSaint = resetHeroDeathDance994;

  // 暗黒剣舞の発動入口を最後にもう一度包む。発動成否がtrueなら必ずリセット。
  if(typeof tryDarkSwordDanceRevive==='function' && !tryDarkSwordDanceRevive.__v994){
    const base=tryDarkSwordDanceRevive;
    const wrapped=function(){
      const before=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      const r=base.apply(this,arguments);
      const after=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      if(r || after>before){
        resetHeroDeathDance994();
        safe(()=>log('暗黒剣舞：主人公の死線の剣舞発動回数を0にリセット。','danger'));
      }
      return r;
    };
    wrapped.__v994=true;
    window.tryDarkSwordDanceRevive=tryDarkSwordDanceRevive=wrapped;
  }
  if(typeof showDarkSwordDanceCutin==='function' && !showDarkSwordDanceCutin.__v994){
    const base=showDarkSwordDanceCutin;
    const wrapped=function(){ resetHeroDeathDance994(); return base.apply(this,arguments); };
    wrapped.__v994=true;
    window.showDarkSwordDanceCutin=showDarkSwordDanceCutin=wrapped;
  }

  // 闇装備4種が確実に生成・付与されるように最終生成関数を固定。
  function legendary994(){return (typeof rarities!=='undefined'&&rarities.find(r=>r.id==='legendary'))||{id:'legendary',name:'レジェンダリー',mult:3.2,color:'#b06cff'};}
  function slot994(name){return {'闇の聖剣':'武器','闇の盾':'盾','闇のアミュレット':'アミュレット','闇の鎧':'鎧','闇の籠手':'腕','闇の兜':'兜','暗黒の靴':'足'}[name]||'リング';}
  function baseItem994(name,lv){
    lv=Math.max(1,Math.floor(lv||state.level||1));
    const r=legendary994();
    let it=typeof makeItem==='function' ? makeItem(slot994(name),r,{isBossDrop:true}) : {id:'dark_'+Date.now()+'_'+Math.random().toString(16).slice(2),slot:slot994(name),level:0};
    it.name=name; it.rarity='legendary'; it.rarityName='レジェンダリー'; it.specialFrame='darkholy'; it.darkEquip=true; it.unsellable=false;
    return {it,lv,mult:r.mult||3.2};
  }
  function makeDark994(name,lv){
    lv=Math.max(1,Math.floor(lv||state.level||1));
    if(name==='闇の聖剣' && typeof makeDarkHolySword==='function') return makeDarkHolySword(lv);
    if(name==='闇の盾' && typeof makeDarkShield==='function') return makeDarkShield(lv);
    if(name==='闇のアミュレット' && typeof makeDarkAmulet==='function') return makeDarkAmulet(lv);
    const o=baseItem994(name,lv), it=o.it, m=o.mult;
    if(name==='闇の鎧') Object.assign(it,{def:Math.floor((30+lv*6)*m),hp:Math.floor((140+lv*24)*m),darkArmor:true,darkDamageReduce:.25,darkRegenPerSecond:.02,darkBleedMax:20,flavor:'被ダメージ25%軽減。1秒ごとに最大HP2%回復。暗黒出血を最大20スタックへ抑える。'});
    if(name==='闇の籠手') Object.assign(it,{atk:Math.floor((24+lv*5)*m),def:Math.floor((12+lv*4)*m),hp:Math.floor((60+lv*10)*m),darkGauntlets:true,deathDanceCountBonus:2,flavor:'死線の剣舞発動時、剣舞発動回数+2。'});
    if(name==='闇の兜') Object.assign(it,{def:Math.floor((20+lv*5)*m),hp:Math.floor((90+lv*15)*m),darkHelm:true,deathDanceChance:.10,preventBleedDuringDance:true,flavor:'死線の剣舞発動率+10%。出血・暗黒出血解除。剣舞中は出血系を受けない。'});
    if(name==='暗黒の靴') Object.assign(it,{def:Math.floor((14+lv*4)*m),hp:Math.floor((75+lv*13)*m),darkBoots:true,evasion:.25,lowHpEvasion:.25,flavor:'回避率+25%。HP半分以下でさらに+25%。'});
    return it;
  }
  window.makeDarkArmor=function(lv){return makeDark994('闇の鎧',lv);};
  window.makeDarkGauntlets=function(lv){return makeDark994('闇の籠手',lv);};
  window.makeDarkHelm=function(lv){return makeDark994('闇の兜',lv);};
  window.makeDarkBoots=function(lv){return makeDark994('暗黒の靴',lv);};
  window.makeDarkEquip994=makeDark994;
  function grantDark994(name){
    if(!DARK_NAMES.includes(name)) return;
    state.inventory.unshift(makeDark994(name,state.level));
    safe(()=>renderAll()); safe(()=>scheduleSave()); safe(()=>log('デバッグ：'+name+'を付与。','good'));
  }
  function grantDarkSet994(){
    DARK_NAMES.slice().reverse().forEach(n=>state.inventory.unshift(makeDark994(n,state.level)));
    safe(()=>renderAll()); safe(()=>scheduleSave()); safe(()=>log('デバッグ：闇装備7種セットを付与。','good'));
  }
  window.grantDarkEquipLatest=grantDark994;
  window.grantDarkSetLatest=grantDarkSet994;
  function ensureDarkDebug994(){
    const panel=$('debugPanel'); if(!panel) return;
    let set=$('debugGrantDarkSet');
    if(!set){ set=document.createElement('button'); set.type='button'; set.id='debugGrantDarkSet'; panel.insertBefore(set,$('debugClose')||null); }
    set.textContent='闇装備7種セット付与';
    let box=$('debugGrantDarkItems');
    if(!box){ box=document.createElement('div'); box.id='debugGrantDarkItems'; box.className='debug-grid'; panel.insertBefore(box,set.nextSibling); }
    box.innerHTML=DARK_NAMES.map(n=>`<button type="button" data-dark994="${n}">${n}</button>`).join('');
  }
  function darkDebugHandler994(e){
    const set=e.target.closest&&e.target.closest('#debugGrantDarkSet,[data-latest-dark-set]');
    const item=e.target.closest&&e.target.closest('[data-dark994],[data-dark992],[data-dark991],[data-final-dark],[data-latest-dark-equip]');
    if(set){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantDarkSet994(); return;}
    if(item){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantDark994(item.dataset.dark994||item.dataset.dark992||item.dataset.dark991||item.dataset.finalDark||item.dataset.latestDarkEquip); return;}
  }
  document.addEventListener('click',darkDebugHandler994,true);
  document.addEventListener('pointerup',darkDebugHandler994,{capture:true,passive:false});

  // ログフィルターを本体のlog/renderと直結。
  function classifyLog994(l){
    const c=String(l.cls||''); const m=String(l.msg||'');
    if(c.includes('drop')||/ドロップ|獲得|付与|装備|報酬|倉庫/.test(m)) return 'drop';
    if(c.includes('damage')||c.includes('danger')||c.includes('skill')||/ダメージ|攻撃|出血|火傷|剣舞|撃破|暗黒/.test(m)) return 'damage';
    return 'system';
  }
  function renderLog994(){
    const logEl=$('log'); if(!logEl) return;
    const f=state.logFilter||'all';
    const rows=(state.log||[]).filter(l=>f==='all'||(l.type||classifyLog994(l))===f);
    logEl.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time||''}] ${l.msg||''}</div>`).join('');
    document.querySelectorAll('#logFilterBar button,#logFilterTabs button,[data-log-filter]').forEach(b=>{ if(b.dataset&&b.dataset.logFilter) b.classList.toggle('active',(b.dataset.logFilter||'all')===f); });
  }
  function ensureLogFilter994(){
    const logEl=$('log'); const panel=document.querySelector('.log-panel'); if(!logEl||!panel) return;
    let bar=$('logFilterBar');
    if(!bar){ bar=document.createElement('div'); bar.id='logFilterBar'; bar.className='log-filter-bar'; panel.insertBefore(bar,logEl); }
    bar.innerHTML=Object.entries(LOG_LABELS).map(([k,v])=>`<button type="button" data-log-filter="${k}">${v}</button>`).join('');
    renderLog994();
  }
  function logFilterHandler994(e){
    const b=e.target.closest&&e.target.closest('#logFilterBar button,#logFilterTabs button,[data-log-filter]');
    if(!b||!b.dataset||!b.dataset.logFilter) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    state.logFilter=b.dataset.logFilter||'all';
    renderLog994();
  }
  document.addEventListener('click',logFilterHandler994,true);
  document.addEventListener('pointerup',logFilterHandler994,{capture:true,passive:false});
  window.renderFilteredLog=renderLog994;
  window.renderLog=renderLog994;
  window.log=function(msg,cls='',html=false){
    const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
    const safeMsg=html?msg:(typeof escapeHtml==='function'?escapeHtml(msg):String(msg).replace(/[&<>]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[s])));
    state.log.unshift({time,msg:safeMsg,cls,html:true,type:classifyLog994({msg,cls})});
    state.log=state.log.slice(0,200);
    renderLog994();
  };
  try{ log=window.log; }catch(e){}

  // 暗黒剣聖撃破後に止まった場合の最終保険。撃破処理の多重ロックも解除して次へ進める。
  function darkSaintDefeatWatch994(){
    if(!state.enemy || state.enemy.id!=='dark_sword_saint') return;
    if(state.enemyHp>0) return;
    const reviving=state.enemyStatuses && (state.enemyStatuses.darkRevivingUntil||0)>performance.now();
    if(reviving || state.darkSwordCutinActive || state.deathDanceCutin) return;
    state.__enemyDefeatedRunning992=false;
    state.__darkFinalize992=false;
    state.__darkDefeatFinalizing991=false;
    safe(()=>{ if(state.enemyStatuses){ state.enemyStatuses.darkDeadConfirmed=true; state.enemyStatuses.darkRevivingUntil=0; state.enemyStatuses.darkReviveStart=0; }});
    safe(()=>clearDarkSwordTimers()); safe(()=>hideDeathDanceCutin());
    state.darkSwordCutinActive=false; state.deathDanceCutin=false;
    if(!state.__darkSaintDefeat994){
      state.__darkSaintDefeat994=true;
      setTimeout(()=>{
        safe(()=>enemyDefeated());
        setTimeout(()=>{ state.__darkSaintDefeat994=false; if(!state.enemy) safe(()=>spawnEnemy(false)); },1200);
      },80);
    }
  }
  setInterval(darkSaintDefeatWatch994,300);

  // デバッグ暗黒剣聖召喚は即時ではなく次敵セット。既存onclickより後段captureで止める。
  function queueDarkSaint994(e){
    const b=e.target.closest&&e.target.closest('#debugDarkSwordSaint'); if(!b) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    state.forceNextDarkSwordSaint=true; state.pendingDarkSwordSaintDelay=false;
    safe(()=>banner('次の敵に暗黒剣聖をセット！',1400)); safe(()=>log('デバッグ：暗黒剣聖を次の敵にセット。','danger'));
    safe(()=>scheduleSave());
  }
  document.addEventListener('click',queueDarkSaint994,true);
  document.addEventListener('pointerup',queueDarkSaint994,{capture:true,passive:false});

  // メニューを開いた時は最後のタブを維持。タブ変更時に記録。
  if(typeof setMenuPage==='function' && !setMenuPage.__v994){
    const base=setMenuPage;
    const wrapped=function(page){ state.menuPage=page||state.menuPage||'stats'; const r=base.call(this,state.menuPage); safe(()=>scheduleSave()); return r; };
    wrapped.__v994=true; window.setMenuPage=setMenuPage=wrapped;
  }
  function menuOpenLastTab994(){ safe(()=>setMenuPage(state.menuPage||'stats')); }
  document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('#equipToggleBtn')) setTimeout(menuOpenLastTab994,0); },true);

  // PCだけ、非アクティブ/別タブでBGMを再開する。スマホは電池・OS制限があるため従来通り。
  function isPc994(){ return !(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) && matchMedia('(min-width: 761px)').matches; }
  function keepPcBgm994(){
    if(!isPc994()) return;
    state.bgmPausedByVisibility=false;
    if(state.mobileMuted || !state.audioUnlocked) return;
    if(state.audio && state.audio.state==='suspended') safe(()=>state.audio.resume());
    safe(()=>playBgm());
  }
  document.addEventListener('visibilitychange',()=>setTimeout(keepPcBgm994,50));
  window.addEventListener('blur',()=>setTimeout(keepPcBgm994,50));
  window.addEventListener('pagehide',()=>setTimeout(keepPcBgm994,50));

  function fixLabels994(){ document.querySelectorAll('button').forEach(b=>{ if((b.textContent||'').trim()==='強化選択') b.textContent='強化'; }); }
  function boot994(){ applyVersion994(); ensureDarkDebug994(); ensureLogFilter994(); fixLabels994(); menuOpenLastTab994(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot994); else boot994();
  window.addEventListener('load',boot994); window.addEventListener('resize',boot994);
  setInterval(()=>{ applyVersion994(); ensureDarkDebug994(); fixLabels994(); },1000);
})();


/* ver99.6 hard confirmed fixes: no more layered-miss guard */
(function(){
  'use strict';
  var BUILD='99.6';
  var DARK_NAMES=['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'];
  var LOG_LABELS={all:'すべて',damage:'ダメージ',system:'システム',drop:'ドロップ'};
  function $(id){return document.getElementById(id)}
  function safe(fn){try{return fn&&fn()}catch(e){console.warn('[99.6 hard]',e)}}
  function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
  function version(){
    window.GAME_VERSION=BUILD; window.MINI_BROWSER_HERO_LATEST_VERSION=BUILD; window.MINI_BROWSER_HERO_BUILD_VERSION=BUILD;
    if(document.documentElement) document.documentElement.dataset.buildVersion=BUILD;
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(function(e){e.textContent='ver.'+BUILD});
    document.querySelectorAll('.debug-version').forEach(function(e){e.textContent='Build: ver.'+BUILD});
    var f=$('fixedBuildVersion'); if(f) f.textContent='ver.'+BUILD;
  }

  function resetHeroDanceHard(reason){
    if(!window.state) return;
    state.deathDanceBattleCount=0;
    state.deathDanceComboCount=0;
    state.deathDance=false;
    state.deathDanceUntil=0;
    // カットインは暗黒剣舞側でも使うので、暗黒カットイン中だけは閉じない
    if(!state.darkSwordCutinActive){ state.deathDanceCutin=false; safe(function(){hideDeathDanceCutin&&hideDeathDanceCutin()}); }
    var a=$('deathAura'); if(a) a.classList.add('hidden');
    var d=$('deathDanceStatus'); if(d) d.classList.add('hidden');
    state.__lastHeroDanceResetReason995=reason||'darkdance';
    state.__lastHeroDanceResetAt995=Date.now();
    safe(function(){renderStatusLists&&renderStatusLists()});
    safe(function(){renderBattle&&renderBattle()});
  }
  window.resetHeroDeathDanceForDarkSwordSaint=resetHeroDanceHard;

  // 入口・カットイン・回復完了・監視の4重で、暗黒剣舞回数が増えた瞬間に必ずリセット
  if(typeof tryDarkSwordDanceRevive==='function' && !tryDarkSwordDanceRevive.__hard995){
    var baseTry=tryDarkSwordDanceRevive;
    var wrapTry=function(){
      var before=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      var r=baseTry.apply(this,arguments);
      var after=(state.enemyStatuses&&state.enemyStatuses.darkDanceCount)||0;
      if(r || after>before){ resetHeroDanceHard('tryDarkSwordDanceRevive'); safe(function(){log('暗黒剣舞：主人公の死線の剣舞発動回数を0にリセット。','danger')}); }
      return r;
    };
    wrapTry.__hard995=true; window.tryDarkSwordDanceRevive=tryDarkSwordDanceRevive=wrapTry;
  }
  if(typeof showDarkSwordDanceCutin==='function' && !showDarkSwordDanceCutin.__hard995){
    var baseShow=showDarkSwordDanceCutin;
    var wrapShow=function(){ resetHeroDanceHard('showDarkSwordDanceCutin'); return baseShow.apply(this,arguments); };
    wrapShow.__hard995=true; window.showDarkSwordDanceCutin=showDarkSwordDanceCutin=wrapShow;
  }
  if(typeof finishDarkSwordDanceRevive==='function' && !finishDarkSwordDanceRevive.__hard995){
    var baseFinish=finishDarkSwordDanceRevive;
    var wrapFinish=function(){ resetHeroDanceHard('finishDarkSwordDanceRevive'); return baseFinish.apply(this,arguments); };
    wrapFinish.__hard995=true; window.finishDarkSwordDanceRevive=finishDarkSwordDanceRevive=wrapFinish;
  }
  var lastDarkDanceCount=-1;
  function watchDarkDanceReset(){
    if(!window.state || !state.enemyStatuses) return;
    var c=state.enemyStatuses.darkDanceCount||0;
    if(lastDarkDanceCount<0) lastDarkDanceCount=c;
    if(c>lastDarkDanceCount){ resetHeroDanceHard('watchDarkDanceCount'); }
    lastDarkDanceCount=c;
  }

  function legend(){return (typeof rarities!=='undefined'&&rarities.find(function(r){return r.id==='legendary'}))||{id:'legendary',name:'レジェンダリー',mult:3.2,color:'#b06cff'}}
  function slot(name){return {'闇の聖剣':'武器','闇の盾':'盾','闇のアミュレット':'アミュレット','闇の鎧':'鎧','闇の籠手':'腕','闇の兜':'兜','暗黒の靴':'足'}[name]||'リング'}
  function newId(){return 'dark995_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}
  function makeBase(name,lv){
    lv=Math.max(1,Math.floor(lv||(state&&state.level)||1));
    var r=legend(), m=r.mult||3.2, it;
    try{ it=(typeof makeItem==='function')?makeItem(slot(name),r,{isBossDrop:true}):null; }catch(e){ it=null; }
    if(!it) it={id:newId(),slot:slot(name),level:0};
    it.id=it.id||newId(); it.name=name; it.slot=slot(name); it.rarity='legendary'; it.rarityName='レジェンダリー'; it.specialFrame='darkholy'; it.darkEquip=true; it.level=it.level||0;
    return {it:it,lv:lv,m:m};
  }
  function makeDark(name,lv){
    lv=Math.max(1,Math.floor(lv||(state&&state.level)||1));
    if(name==='闇の聖剣' && typeof makeDarkHolySword==='function') return makeDarkHolySword(lv);
    if(name==='闇の盾' && typeof makeDarkShield==='function') return makeDarkShield(lv);
    if(name==='闇のアミュレット' && typeof makeDarkAmulet==='function') return makeDarkAmulet(lv);
    var o=makeBase(name,lv), it=o.it, m=o.m;
    if(name==='闇の鎧') Object.assign(it,{def:Math.floor((30+lv*6)*m),hp:Math.floor((140+lv*24)*m),darkArmor:true,darkDamageReduce:.25,darkRegenPerSecond:.02,darkBleedMax:20,flavor:'被ダメージ25%軽減。1秒ごとに最大HP2%回復。暗黒出血を最大20スタックへ抑える。'});
    if(name==='闇の籠手') Object.assign(it,{atk:Math.floor((24+lv*5)*m),def:Math.floor((12+lv*4)*m),hp:Math.floor((60+lv*10)*m),darkGauntlets:true,deathDanceCountBonus:2,flavor:'死線の剣舞発動時、剣舞発動回数+2。'});
    if(name==='闇の兜') Object.assign(it,{def:Math.floor((20+lv*5)*m),hp:Math.floor((90+lv*15)*m),darkHelm:true,deathDanceChance:.10,preventBleedDuringDance:true,flavor:'死線の剣舞発動率+10%。出血・暗黒出血解除。剣舞中は出血系を受けない。'});
    if(name==='暗黒の靴') Object.assign(it,{def:Math.floor((14+lv*4)*m),hp:Math.floor((75+lv*13)*m),darkBoots:true,evasion:.25,lowHpEvasion:.25,flavor:'回避率+25%。HP半分以下でさらに+25%。'});
    return it;
  }
  window.makeDarkArmor=function(lv){return makeDark('闇の鎧',lv)};
  window.makeDarkGauntlets=function(lv){return makeDark('闇の籠手',lv)};
  window.makeDarkHelm=function(lv){return makeDark('闇の兜',lv)};
  window.makeDarkBoots=function(lv){return makeDark('暗黒の靴',lv)};
  window.makeDarkEquip995=makeDark;
  function grantDark(name){
    if(DARK_NAMES.indexOf(name)<0 || !window.state) return;
    state.inventory=Array.isArray(state.inventory)?state.inventory:[];
    state.inventory.unshift(makeDark(name,state.level));
    safe(function(){renderAll&&renderAll()}); safe(function(){scheduleSave&&scheduleSave()}); safe(function(){log('デバッグ：'+name+'を付与。','good')});
  }
  function grantSet(){
    if(!window.state) return;
    DARK_NAMES.slice().reverse().forEach(function(n){state.inventory.unshift(makeDark(n,state.level))});
    safe(function(){renderAll&&renderAll()}); safe(function(){scheduleSave&&scheduleSave()}); safe(function(){log('デバッグ：闇装備7種セットを付与。','good')});
  }
  window.grantDarkEquipLatest=grantDark; window.grantDarkSetLatest=grantSet;
  function ensureDebug(){
    var panel=$('debugPanel'); if(!panel) return;
    var set=$('debugGrantDarkSet'); if(!set){set=document.createElement('button');set.id='debugGrantDarkSet';set.type='button';panel.appendChild(set)}
    set.textContent='闇装備7種セット付与';
    var box=$('debugGrantDarkItems'); if(!box){box=document.createElement('div');box.id='debugGrantDarkItems';box.className='debug-grid';set.insertAdjacentElement('afterend',box)}
    box.innerHTML=DARK_NAMES.map(function(n){return '<button type="button" data-dark995="'+n+'">'+n+'</button>'}).join('');
    set.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()} grantSet()};
    box.querySelectorAll('[data-dark995]').forEach(function(b){b.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()} grantDark(b.dataset.dark995)}});
  }
  function darkDebugEvent(e){
    var t=e.target; if(!t||!t.closest) return;
    var set=t.closest('#debugGrantDarkSet,[data-latest-dark-set]');
    var item=t.closest('[data-dark995],[data-dark994],[data-dark992],[data-dark991],[data-final-dark],[data-latest-dark-equip]');
    if(set){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantSet(); return;}
    if(item){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); grantDark(item.dataset.dark995||item.dataset.dark994||item.dataset.dark992||item.dataset.dark991||item.dataset.finalDark||item.dataset.latestDarkEquip); return;}
  }
  document.addEventListener('click',darkDebugEvent,true);
  document.addEventListener('pointerdown',darkDebugEvent,{capture:true,passive:false});
  document.addEventListener('pointerup',darkDebugEvent,{capture:true,passive:false});

  function classify(l){
    var m=String((l&&l.msg)||l||'').replace(/<[^>]*>/g,''); var c=String((l&&l.cls)||'');
    if(/ドロップ|獲得|報酬|付与|装備|倉庫|強化石|経験値化/.test(m)||/drop|good/.test(c)) return 'drop';
    if(/ダメージ|攻撃|斬撃|雷撃|炎斬り|剣舞|暗黒剣舞|暗黒剣技|出血|暗黒出血|火傷|反射|回復|撃破|MISS|GUARD|吸収/.test(m)||/damage|danger|skilllog|dark|fire|acid/.test(c)) return 'damage';
    return 'system';
  }
  function renderLogHard(){
    var logEl=$('log'); if(!logEl||!window.state) return;
    var f=state.logFilter||'all';
    var rows=(state.log||[]).filter(function(l){return f==='all'||(l.type||classify(l))===f});
    logEl.innerHTML=rows.map(function(l){return '<div class="'+(l.cls||'')+'">['+(l.time||'')+'] '+(l.msg||'')+'</div>'}).join('');
    document.querySelectorAll('[data-log-filter]').forEach(function(b){b.classList.toggle('active',(b.dataset.logFilter||'all')===f)});
  }
  function ensureLog(){
    var logEl=$('log'); if(!logEl) return;
    var panel=logEl.closest('.log-panel')||logEl.parentElement; if(!panel) return;
    var bar=$('logFilterBar'); if(!bar){bar=document.createElement('div');bar.id='logFilterBar';bar.className='log-filter-bar';panel.insertBefore(bar,logEl)}
    bar.innerHTML=Object.keys(LOG_LABELS).map(function(k){return '<button type="button" data-log-filter="'+k+'">'+LOG_LABELS[k]+'</button>'}).join('');
    renderLogHard();
  }
  function logFilterEvent(e){
    var b=e.target&&e.target.closest&&e.target.closest('[data-log-filter]'); if(!b) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    state.logFilter=b.dataset.logFilter||'all'; renderLogHard();
  }
  document.addEventListener('click',logFilterEvent,true);
  document.addEventListener('pointerdown',logFilterEvent,{capture:true,passive:false});
  document.addEventListener('pointerup',logFilterEvent,{capture:true,passive:false});
  window.renderFilteredLog=renderLogHard; window.renderLog=renderLogHard;
  window.log=function(msg,cls,html){
    cls=cls||''; var time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
    var text=html?String(msg):esc(msg);
    state.log=Array.isArray(state.log)?state.log:[];
    state.log.unshift({time:time,msg:text,cls:cls,html:true,type:classify({msg:msg,cls:cls})});
    state.log=state.log.slice(0,200); renderLogHard();
  };
  try{log=window.log}catch(e){}

  function finalSpawnNext(){
    state.__enemyDefeatedRunning992=false; state.__darkFinalize992=false; state.__darkDefeatFinalizing991=false; state.__darkSaintDefeat994=false; state.__darkSaintDefeat995=false;
    safe(function(){clearDarkSwordTimers&&clearDarkSwordTimers()}); safe(function(){hideDeathDanceCutin&&hideDeathDanceCutin()});
    state.darkSwordCutinActive=false; state.deathDanceCutin=false;
    if(state.enemy && state.enemy.id==='dark_sword_saint'){
      // まず通常の報酬・討伐処理を試す
      safe(function(){enemyDefeated&&enemyDefeated()});
    }
    setTimeout(function(){ if(!state.enemy){ safe(function(){spawnEnemy&&spawnEnemy(false)}) } },1600);
  }
  function watchDarkDefeat(){
    if(!window.state||!state.enemy||state.enemy.id!=='dark_sword_saint') return;
    if(state.enemyHp>0) return;
    var reviving=state.enemyStatuses && (state.enemyStatuses.darkRevivingUntil||0)>performance.now();
    if(reviving) return;
    if(state.__darkSaintDefeat995) return;
    state.__darkSaintDefeat995=true;
    safe(function(){ if(state.enemyStatuses){state.enemyStatuses.darkDeadConfirmed=true;state.enemyStatuses.darkRevivingUntil=0;state.enemyStatuses.darkReviveStart=0;state.enemyStatuses.bleeds=[];state.enemyStatuses.darkBleeds=[]} });
    state.darkSwordCutinActive=false; state.deathDanceCutin=false;
    setTimeout(finalSpawnNext,80);
    setTimeout(function(){state.__darkSaintDefeat995=false; if(state.enemy&&state.enemy.id==='dark_sword_saint'&&state.enemyHp<=0){state.enemy=null; safe(function(){spawnEnemy&&spawnEnemy(false)})}},3000);
  }

  function fixLabels(){
    document.querySelectorAll('button').forEach(function(b){ if((b.textContent||'').trim()==='強化選択') b.textContent='強化'; });
  }
  if(window.MutationObserver){
    new MutationObserver(function(){fixLabels()}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  }

  function boot(){version(); ensureDebug(); ensureLog(); fixLabels(); watchDarkDanceReset(); watchDarkDefeat();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',boot); window.addEventListener('resize',boot); window.addEventListener('pageshow',boot);
  setInterval(boot,250);
})();


/* ver99.6 single fix: Dark Sword Saint defeat must always move to the next battle */
(function(){
  var BUILD='99.6';
  function safe(fn){ try{ return fn&&fn(); }catch(e){ console.warn('[99.6 dark saint defeat]', e); return null; } }
  function isDarkSaintActive(){ return window.state && state.enemy && state.enemy.id === 'dark_sword_saint'; }
  function clearDarkBlockingFlags(){
    safe(function(){ if(typeof clearDarkSwordTimers==='function') clearDarkSwordTimers(); });
    safe(function(){ if(typeof hideDeathDanceCutin==='function') hideDeathDanceCutin(); });
    if(!window.state) return;
    state.darkSwordCutinActive=false;
    state.deathDanceCutin=false;
    state.__enemyDefeatedRunning992=false;
    state.__darkFinalize992=false;
    state.__darkDefeatFinalizing991=false;
    state.__darkSaintDefeat994=false;
    state.__darkSaintDefeat995=false;
    if(state.enemyStatuses){
      state.enemyStatuses.darkDeadConfirmed=true;
      state.enemyStatuses.darkRevivingUntil=0;
      state.enemyStatuses.darkReviveStart=0;
    }
  }
  function spawnNextIfNeeded(){
    if(!window.state) return;
    // If the old stacked patches left the defeated Dark Sword Saint in place, remove it.
    if(state.enemy && state.enemy.id === 'dark_sword_saint' && state.enemyHp <= 0){
      state.enemy = null;
    }
    if(!state.enemy){
      safe(function(){ if(typeof spawnEnemy==='function') spawnEnemy(false); });
      safe(function(){ if(typeof setBgmMode==='function') setBgmMode(state.enemy && state.enemy.id==='dark_sword_saint' ? 'dark_sword_saint' : 'normal'); });
      safe(function(){ if(typeof renderAll==='function') renderAll(); else if(typeof renderBattle==='function') renderBattle(); });
      safe(function(){ if(typeof scheduleSave==='function') scheduleSave(); });
    }
  }
  function finalizeDarkSaintDefeat996(reason){
    if(!isDarkSaintActive()) return false;
    if(state.enemyHp > 0) return false;
    var reviving = state.enemyStatuses && (state.enemyStatuses.darkRevivingUntil||0) > performance.now();
    if(reviving) return false;
    if(state.__darkSaintFinalizing996) return true;
    state.__darkSaintFinalizing996 = true;
    clearDarkBlockingFlags();
    state.enemyHp = 0;
    // Do not set enemy.defeated before calling enemyDefeated; some old paths use it as a guard.
    safe(function(){ if(typeof log==='function') log('暗黒剣聖を撃破。次の敵へ移行する。','good'); });
    var before = state.enemy;
    var ok = false;
    try{
      if(typeof enemyDefeated === 'function'){
        enemyDefeated();
        ok = true;
      }
    }catch(e){ console.warn('[99.6] enemyDefeated failed; using fallback spawn', e); }
    setTimeout(function(){
      // Normal enemyDefeated schedules the next enemy. If it did not, force it.
      if(state.enemy === before || (state.enemy && state.enemy.id === 'dark_sword_saint' && state.enemyHp <= 0)){
        state.enemy = null;
      }
      spawnNextIfNeeded();
      state.__darkSaintFinalizing996 = false;
    }, ok ? 1300 : 100);
    return true;
  }
  window.finalizeDarkSaintDefeat996 = finalizeDarkSaintDefeat996;

  var prevTry = (typeof tryDarkSwordDanceRevive === 'function') ? tryDarkSwordDanceRevive : null;
  if(prevTry){
    tryDarkSwordDanceRevive = window.tryDarkSwordDanceRevive = function(){
      if(!isDarkSaintActive()) return prevTry.apply(this, arguments);
      var r = prevTry.apply(this, arguments);
      if(!r && state.enemyHp <= 0){ finalizeDarkSaintDefeat996('tryDarkSwordDanceRevive:false'); }
      return r;
    };
  }

  var prevEnemyDefeated = (typeof enemyDefeated === 'function') ? enemyDefeated : null;
  if(prevEnemyDefeated){
    enemyDefeated = window.enemyDefeated = function(){
      var wasDark = isDarkSaintActive();
      if(wasDark){ clearDarkBlockingFlags(); }
      var r = prevEnemyDefeated.apply(this, arguments);
      if(wasDark){ setTimeout(spawnNextIfNeeded, 1300); }
      return r;
    };
  }

  function watch(){
    if(!isDarkSaintActive()) return;
    if(state.enemyHp <= 0) finalizeDarkSaintDefeat996('watch');
  }
  setInterval(watch, 200);
  document.documentElement.dataset.buildVersion = BUILD;
  window.MINI_BROWSER_HERO_LATEST_VERSION = BUILD;
  window.MINI_BROWSER_HERO_BUILD_VERSION = BUILD;
})();


/* ver99.7 focused fix: Dark Sword Saint defeat clears DOT and always resumes battle */
(function(){
  var BUILD='99.9';
  function safe(fn){ try{ return fn&&fn(); }catch(e){ console.warn('[99.8 dark saint transition]', e); return null; } }
  function isDarkSaint(){ return window.state && state.enemy && state.enemy.id === 'dark_sword_saint'; }
  function clearArrayOwner(o){
    if(!o) return;
    o.bleeds=[]; o.darkBleeds=[]; o.burnUntil=0;
    o.lastBleedTick=performance.now(); o.lastDarkBleedTick=performance.now();
  }
  function clearAllDotAndBlocking997(){
    if(!window.state) return;
    safe(function(){ if(typeof clearDarkSwordTimers==='function') clearDarkSwordTimers(); });
    safe(function(){ if(typeof clearDeathDanceSequence==='function') clearDeathDanceSequence(); });
    safe(function(){ if(typeof hideDeathDanceCutin==='function') hideDeathDanceCutin(); });
    clearArrayOwner(state.heroStatuses || (state.heroStatuses={}));
    clearArrayOwner(state.enemyStatuses || (state.enemyStatuses={}));
    if(state.enemyStatuses){
      state.enemyStatuses.darkDeadConfirmed=true;
      state.enemyStatuses.darkRevivingUntil=0;
      state.enemyStatuses.darkReviveStart=0;
      state.enemyStatuses.darkSwordBuffs=[];
    }
    state.darkSwordCutinActive=false;
    state.deathDanceCutin=false;
    state.deathDance=false;
    state.down=false;
    state.defeatSequence=false;
    state.__enemyDefeatedRunning992=false;
    state.__darkFinalize992=false;
    state.__darkDefeatFinalizing991=false;
    state.__darkSaintDefeat994=false;
    state.__darkSaintDefeat995=false;
    if(state.hp<=0) state.hp = (typeof maxHp==='function') ? maxHp() : 1;
    safe(function(){ if(typeof renderStatusLists==='function') renderStatusLists(); });
  }
  var inFinalize=false;
  function forceNext997(){
    if(!window.state) return;
    clearAllDotAndBlocking997();
    if(state.enemy && state.enemy.id==='dark_sword_saint' && state.enemyHp<=0){ state.enemy=null; }
    if(!state.enemy){
      safe(function(){ if(typeof spawnEnemy==='function') spawnEnemy(false); });
      safe(function(){ if(typeof setBgmMode==='function') setBgmMode(state.enemy && state.enemy.id==='dark_sword_saint' ? 'dark_sword_saint' : 'normal'); });
      safe(function(){ if(typeof renderAll==='function') renderAll(); else if(typeof renderBattle==='function') renderBattle(); });
      safe(function(){ if(typeof scheduleSave==='function') scheduleSave(); });
    }
    inFinalize=false;
  }
  function finalize997(reason){
    if(!isDarkSaint()) return false;
    if(state.enemyHp>0) return false;
    var reviving=state.enemyStatuses && (state.enemyStatuses.darkRevivingUntil||0)>performance.now();
    if(reviving) return false;
    if(inFinalize) return true;
    inFinalize=true;
    clearAllDotAndBlocking997();
    state.enemyHp=0;
    var before=state.enemy;
    safe(function(){ if(typeof log==='function') log('暗黒剣聖撃破：状態異常を解除して次のバトルへ移行。','good'); });
    var called=false;
    try{
      if(typeof enemyDefeated==='function'){
        enemyDefeated();
        called=true;
      }
    }catch(e){ console.warn('[99.8] enemyDefeated failed, forcing next battle', e); }
    clearAllDotAndBlocking997();
    setTimeout(function(){
      clearAllDotAndBlocking997();
      if(state.enemy===before || (state.enemy && state.enemy.id==='dark_sword_saint' && state.enemyHp<=0)) state.enemy=null;
      if(!state.enemy) forceNext997(); else inFinalize=false;
    }, called ? 950 : 80);
    setTimeout(function(){ if(!state.enemy || (state.enemy && state.enemy.id==='dark_sword_saint' && state.enemyHp<=0)) forceNext997(); }, 2200);
    return true;
  }
  window.finalizeDarkSaintDefeat997=finalize997;

  var prevProcess=(typeof processStatusDots==='function')?processStatusDots:null;
  if(prevProcess && !prevProcess.__v997){
    var wrapProcess=function(now){
      if(window.state && (inFinalize || (!state.enemy && state.__lastDarkSaintDefeat997))){ clearAllDotAndBlocking997(); return; }
      return prevProcess.apply(this,arguments);
    };
    wrapProcess.__v997=true; processStatusDots=window.processStatusDots=wrapProcess;
  }

  var prevEnemyDef=(typeof enemyDefeated==='function')?enemyDefeated:null;
  if(prevEnemyDef && !prevEnemyDef.__v997){
    var wrapEnemyDef=function(){
      var wasDark=isDarkSaint();
      if(wasDark){ clearAllDotAndBlocking997(); state.__lastDarkSaintDefeat997=Date.now(); }
      var r=prevEnemyDef.apply(this,arguments);
      if(wasDark){ clearAllDotAndBlocking997(); setTimeout(forceNext997,950); }
      return r;
    };
    wrapEnemyDef.__v997=true; enemyDefeated=window.enemyDefeated=wrapEnemyDef;
  }

  function watch997(){
    if(!isDarkSaint()) return;
    if(state.enemyHp<=0) finalize997('watch');
  }
  setInterval(watch997,100);
  document.documentElement.dataset.buildVersion=BUILD;
  window.GAME_VERSION=BUILD;
  window.MINI_BROWSER_HERO_LATEST_VERSION=BUILD;
  window.MINI_BROWSER_HERO_BUILD_VERSION=BUILD;
  function renderVer(){
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(function(el){el.textContent='ver.'+BUILD;});
    document.querySelectorAll('.debug-version').forEach(function(el){el.textContent='Build: ver.'+BUILD;});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',renderVer); else renderVer();
  window.addEventListener('load',renderVer);
})();


/* ver99.9 diagnostic trace: Dark Sword Saint transition investigation */
(function(){
  const BUILD='99.9';
  const KEY='mbh_debug_trace_v998';
  const MAX=350;
  function safe(fn){ try{return fn&&fn();}catch(e){ console.warn('[TRACE99.8]', e); return null; } }
  function shortErr(e){ return e ? String(e && (e.stack || e.message || e)).slice(0,900) : ''; }
  function snapshot(extra){
    let enemy=null, est=null, hst=null;
    safe(()=>{ enemy = state && state.enemy ? {id:state.enemy.id,name:state.enemy.name,level:state.enemy.level,hp:state.enemyHp,maxHp:state.enemy.maxHp,dead:!!state.enemy.dead,defeated:!!state.enemy.defeated} : null; });
    safe(()=>{ est = state && state.enemyStatuses ? {
      darkDeadConfirmed:!!state.enemyStatuses.darkDeadConfirmed,
      darkRevivingUntil:Math.round(state.enemyStatuses.darkRevivingUntil||0),
      darkReviveStart:Math.round(state.enemyStatuses.darkReviveStart||0),
      darkDanceCount:state.enemyStatuses.darkDanceCount||0,
      enemyBleeds:(state.enemyStatuses.bleeds||[]).length,
      enemyDarkBleeds:(state.enemyStatuses.darkBleeds||[]).length,
      darkAuraStacks:state.enemyStatuses.darkAuraStacks||0,
      darkTechniqueAwakened:!!state.enemyStatuses.darkTechniqueAwakened
    } : null; });
    safe(()=>{ hst = state && state.heroStatuses ? {
      heroBleeds:(state.heroStatuses.bleeds||[]).length,
      heroDarkBleeds:(state.heroStatuses.darkBleeds||[]).length,
      burnUntil:Math.round(state.heroStatuses.burnUntil||0)
    } : null; });
    return Object.assign({
      t:new Date().toLocaleTimeString('ja-JP',{hour12:false}),
      ms:Math.round(performance.now()),
      build:BUILD,
      enemy,
      enemyStatuses:est,
      heroStatuses:hst,
      hp:safe(()=>Math.round(state.hp)),
      maxHp:safe(()=>Math.round(maxHp())),
      down:safe(()=>!!state.down),
      defeatSequence:safe(()=>!!state.defeatSequence),
      deathDance:safe(()=>!!state.deathDance),
      deathDanceBattleCount:safe(()=>state.deathDanceBattleCount||0),
      deathDanceCutin:safe(()=>!!state.deathDanceCutin),
      darkSwordCutinActive:safe(()=>!!state.darkSwordCutinActive),
      winStreak:safe(()=>state.winStreak||0),
      defeated:safe(()=>state.defeated||0),
      forceNextDarkSwordSaint:safe(()=>!!state.forceNextDarkSwordSaint),
      lastHeroAttack:safe(()=>Math.round(state.lastHeroAttack||0)),
      lastEnemyAttack:safe(()=>Math.round(state.lastEnemyAttack||0))
    }, extra||{});
  }
  function read(){ try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){return []} }
  function write(arr){ try{localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)));}catch(_){} }
  function trace(label, extra){
    const row=snapshot(Object.assign({label}, extra||{}));
    const arr=read(); arr.push(row); write(arr);
    try{ console.log('[MBH TRACE]', label, row); }catch(_){ }
    return row;
  }
  window.MBH_TRACE_KEY=KEY;
  window.mbhTrace=trace;
  window.mbhGetTrace=function(){ return read(); };
  window.mbhClearTrace=function(){ localStorage.removeItem(KEY); trace('trace-cleared'); renderTracePanel(); };
  window.mbhCopyTrace=function(){
    const text=JSON.stringify(read(), null, 2);
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(()=>{ safe(()=>log('進行デバッグログをコピーした。','good')); }); }
    else { prompt('このログをコピーして送ってね', text); }
    return text;
  };
  window.mbhDownloadTrace=function(){
    const text=JSON.stringify(read(), null, 2);
    const blob=new Blob([text], {type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mbh-debug-trace-ver99.9.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  };
  function wrap(name, before, after){
    const old=window[name] || (typeof globalThis!=='undefined' ? globalThis[name] : null);
    if(typeof old!=='function' || old.__trace998) return;
    const fn=function(){
      const args=[...arguments];
      safe(()=>before&&before(args));
      try{
        const ret=old.apply(this, arguments);
        safe(()=>after&&after(args, ret));
        return ret;
      }catch(e){
        trace(name+':throw', {error:shortErr(e)});
        throw e;
      }
    };
    fn.__trace998=true; fn.__old=old;
    try{ window[name]=fn; }catch(_){ }
    try{ globalThis[name]=fn; }catch(_){ }
  }
  function installWraps(){
    wrap('tryDarkSwordDanceRevive', ()=>trace('tryDarkSwordDanceRevive:before'), (a,r)=>trace('tryDarkSwordDanceRevive:after',{returned:!!r}));
    wrap('enemyDefeated', ()=>trace('enemyDefeated:before'), ()=>trace('enemyDefeated:after'));
    wrap('spawnEnemy', (a)=>trace('spawnEnemy:before',{forceFirst:!!a[0]}), ()=>trace('spawnEnemy:after'));
    wrap('setEnemy', (a)=>trace('setEnemy:before',{nextEnemy:a&&a[0]?{id:a[0].id,name:a[0].name,level:a[0].level}:null}), ()=>trace('setEnemy:after'));
    wrap('handleHeroDeath', ()=>trace('handleHeroDeath:before'), ()=>trace('handleHeroDeath:after'));
    wrap('spawnEnemyAfterDefeat', ()=>trace('spawnEnemyAfterDefeat:before'), ()=>trace('spawnEnemyAfterDefeat:after'));
    wrap('processStatusDots', (a)=>{
      const e=safe(()=>state.enemy&&state.enemy.id);
      if(e==='dark_sword_saint' || safe(()=>state.heroStatuses&&(state.heroStatuses.darkBleeds||[]).length)){ trace('processStatusDots:tick',{nowArg:Math.round(a[0]||0)}); }
    }, null);
    wrap('clearDarkSwordTimers', ()=>trace('clearDarkSwordTimers:before'), ()=>trace('clearDarkSwordTimers:after'));
  }
  function renderTracePanel(){
    const out=document.getElementById('mbhTraceOut'); if(!out) return;
    const arr=read().slice(-40).reverse();
    out.textContent=arr.map(x=>`${x.t} ${x.label} enemy=${x.enemy?x.enemy.name+' HP'+x.enemy.hp+'/'+x.enemy.maxHp:'なし'} down=${x.down} defeatSeq=${x.defeatSequence} heroDB=${x.heroStatuses?x.heroStatuses.heroDarkBleeds:0} eDB=${x.enemyStatuses?x.enemyStatuses.enemyDarkBleeds:0} ddc=${x.enemyStatuses?x.enemyStatuses.darkDanceCount:0}`).join('\n');
  }
  function ensurePanel(){
    const panel=document.getElementById('debugPanel') || document.body;
    if(document.getElementById('mbhTraceBox')) return;
    const box=document.createElement('div');
    box.id='mbhTraceBox';
    box.style.cssText='margin-top:8px;padding:8px;border:1px solid rgba(180,120,255,.45);border-radius:10px;background:rgba(20,10,35,.7);font-size:12px;';
    box.innerHTML='<div style="font-weight:800;color:#d8a8ff;margin-bottom:6px;">進行デバッグログ ver.99.9</div><button type="button" id="mbhTraceMark">現在状態を記録</button> <button type="button" id="mbhTraceCopy">ログコピー</button> <button type="button" id="mbhTraceDownload">DL</button> <button type="button" id="mbhTraceClear">消去</button><pre id="mbhTraceOut" style="white-space:pre-wrap;max-height:180px;overflow:auto;background:rgba(0,0,0,.35);padding:6px;border-radius:8px;margin-top:6px;"></pre>';
    panel.appendChild(box);
    document.getElementById('mbhTraceMark').onclick=()=>{ trace('manual-mark'); renderTracePanel(); };
    document.getElementById('mbhTraceCopy').onclick=()=>{ window.mbhCopyTrace(); renderTracePanel(); };
    document.getElementById('mbhTraceDownload').onclick=()=>{ window.mbhDownloadTrace(); renderTracePanel(); };
    document.getElementById('mbhTraceClear').onclick=()=>{ localStorage.removeItem(KEY); trace('trace-cleared'); renderTracePanel(); };
    renderTracePanel();
  }
  function hp0Watch(){
    const isDSS=safe(()=>state.enemy&&state.enemy.id==='dark_sword_saint');
    if(!isDSS) return;
    const hp=safe(()=>state.enemyHp);
    const rev=safe(()=>state.enemyStatuses && (state.enemyStatuses.darkRevivingUntil||0)>performance.now());
    const dead=safe(()=>state.enemyStatuses && state.enemyStatuses.darkDeadConfirmed);
    if(hp<=0) trace('watch:dark-saint-hp0', {reviving:!!rev, deadConfirmed:!!dead});
  }
  function boot(){
    installWraps(); ensurePanel();
    trace('trace-boot');
    const v=BUILD;
    document.documentElement.dataset.buildVersion=v;
    window.GAME_VERSION=v; window.MINI_BROWSER_HERO_LATEST_VERSION=v; window.MINI_BROWSER_HERO_BUILD_VERSION=v;
    document.querySelectorAll('.build-version,.fixed-build-version').forEach(el=>el.textContent='ver.'+v);
    document.querySelectorAll('.debug-version').forEach(el=>el.textContent='Build: ver.'+v+' debug');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', boot);
  setInterval(()=>{ safe(installWraps); safe(ensurePanel); safe(renderTracePanel); safe(hp0Watch); }, 1000);
})();
