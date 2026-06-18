'use strict';

// ver0.1.3: ボス表示整理・火炎ブレスタグカウント・ボスランダム出現。
// strict modeで `makeDarkArmor = function...` がReferenceErrorになり、
// 後続パッチ全体が止まる問題を防ぐ。
var makeDarkArmor, makeDarkGauntlets, makeDarkHelm, makeDarkBoots;

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
const GAME_VERSION = (window.APP_VERSION || '0.2.9');
window.GAME_VERSION = GAME_VERSION;

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
const BOSS_BY_NORMAL_ID = Object.freeze({
  slime: 'slime_king',
  goblin: 'orc',
  lizard: 'dragon',
  fire_spirit: 'fire_king'
});
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
  level:1, xp:0, xpNext:1000, chests:0, mats:3, defeated:0,
  base:{hp:520, atk:48, def:14}, hp:520, enemy:null, enemyHp:1,
  inventory:[], equip:{}, down:false, downUntil:0, deathDance:false, deathDanceUntil:0, deathDanceBattleCount:0, deathDanceCutin:false, deathDanceCutinTimer:null, deathDanceSeqTimers:[], lastHeroAttack:0, lastEnemyAttack:0,
  log:[], debug:{killEnemy:false, killHero:false}, audio:null, masterGain:null, bgmGain:null, bgmTimer:null, bgmMode:'normal', normalBgm:null, swordDanceBgm:null, darkSwordSaintBgm:null, darkSwordSaintVoice:null, darkSwordReviveTimer:null, darkSwordComboTimers:[], darkSwordCutinActive:false, audioUnlocked:false, mobileMuted:true, menuPage:'stats', inventoryMenuItemId:null, enemyRecords:{}, forceFirstEnemy:false, bgmPausedByVisibility:false, heroStatuses:null, enemyStatuses:null, darkShieldStacks:0, dropToastTimer:null, dropToastQueueTimers:[], winStreak:0, bestWinStreak:0, forceNextDarkSwordSaint:false, pendingBossForNext:null, darkSwordSaintFirstEncountered:false, darkSwordSaintLevel:1, darkSwordSaintKills:0, darkSwordSaintLastLevelTrigger:0, darkSwordSaintReturn:null, debugForcedBossNext:null
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
      volume:state.volume, mobileMuted:state.mobileMuted, debug:state.debug, enemyRecords:state.enemyRecords, enemyLevelBase:state.enemyLevelBase, enemyLevelBaseDefeated:state.enemyLevelBaseDefeated, winStreak:state.winStreak, bestWinStreak:state.bestWinStreak, forceNextDarkSwordSaint:state.forceNextDarkSwordSaint, pendingBossForNext:state.pendingBossForNext, darkSwordSaintFirstEncountered:state.darkSwordSaintFirstEncountered, darkSwordSaintLevel:state.darkSwordSaintLevel, darkSwordSaintKills:state.darkSwordSaintKills, darkSwordSaintLastLevelTrigger:state.darkSwordSaintLastLevelTrigger, darkSwordSaintReturn:state.darkSwordSaintReturn, debugForcedBossNext:state.debugForcedBossNext,
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
    state.xpNext = 1000;
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
    state.pendingBossForNext = data.pendingBossForNext && typeof data.pendingBossForNext === 'object' ? {id:String(data.pendingBossForNext.id||''), level:Math.max(1, Math.floor(Number(data.pendingBossForNext.level)||1)), from:String(data.pendingBossForNext.from||'')} : null;
    state.darkSwordSaintFirstEncountered = !!data.darkSwordSaintFirstEncountered || !!data.darkSwordSaintKills || !!(data.enemyRecords && data.enemyRecords.dark_sword_saint && data.enemyRecords.dark_sword_saint.seen);
    state.darkSwordSaintLevel = Math.max(1, Math.floor(Number(data.darkSwordSaintLevel)||1));
    state.darkSwordSaintKills = Math.max(0, Math.floor(Number(data.darkSwordSaintKills)||0));
    state.darkSwordSaintLastLevelTrigger = data.darkSwordSaintLastLevelTrigger == null ? Math.floor((Number(state.level)||1)/20) : Math.max(0, Math.floor(Number(data.darkSwordSaintLastLevelTrigger)||0));
    state.darkSwordSaintReturn = data.darkSwordSaintReturn || null;
    state.debugForcedBossNext = data.debugForcedBossNext || null;
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
  return {bleeds:[], darkBleeds:[], burnUntil:0, lastBleedTick:t, lastDarkBleedTick:t, darkAuraStacks:0, darkAuraLastTick:t, darkSwordBuffs:[], darkDanceCount:0, darkRevivingUntil:0, darkReviveStart:0, darkOneDamageCount:0, darkTechniqueAwakened:false, bossRegenLast:t, dragonBreathCount:0, bossBuffStart:t, bossPierceStart:t};
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
function isSpeciesBoss(e=state.enemy){
  return !!e && e.type === 'ボス' && !isDarkSwordSaint(e);
}
function bossCommonDamageReduction(){
  if(!isSpeciesBoss()) return 0;
  ensureStatusContainers();
  const start = Number(state.enemyStatuses.bossBuffStart) || nowMs();
  const elapsed10 = Math.floor(Math.max(0, nowMs() - start) / 10000);
  return Math.max(0, 0.75 - elapsed10 * 0.01);
}
function bossCommonDefensePierce(){
  if(!isSpeciesBoss()) return 0;
  ensureStatusContainers();
  const start = Number(state.enemyStatuses.bossPierceStart) || nowMs();
  const elapsed30 = Math.floor(Math.max(0, nowMs() - start) / 30000);
  return Math.min(0.50, 0.10 + elapsed30 * 0.01);
}
function bossCommonStatusText(){
  return `被ダメ軽減${Math.round(bossCommonDamageReduction()*100)}% / 防御無視${Math.round(bossCommonDefensePierce()*100)}%`;
}
function ensureStatusContainers(){
  if(!state.heroStatuses) state.heroStatuses = {bleeds:[], darkBleeds:[], burnUntil:0, lastBleedTick:0, lastDarkBleedTick:0};
  if(!state.heroStatuses.darkBleeds) state.heroStatuses.darkBleeds = [];
  if(!state.heroStatuses.lastDarkBleedTick) state.heroStatuses.lastDarkBleedTick = 0;
  if(!state.enemyStatuses) state.enemyStatuses = makeEmptyEnemyStatuses();
  if(!state.enemyStatuses.darkBleeds) state.enemyStatuses.darkBleeds = [];
  if(!state.enemyStatuses.lastDarkBleedTick) state.enemyStatuses.lastDarkBleedTick = 0;
  if(!state.enemyStatuses.bossBuffStart) state.enemyStatuses.bossBuffStart = nowMs();
  if(!state.enemyStatuses.bossPierceStart) state.enemyStatuses.bossPierceStart = nowMs();
}
function resetTransientStatuses(){
  state.heroStatuses = {bleeds:[], darkBleeds:[], burnUntil:0, lastBleedTick:0, lastDarkBleedTick:0};
  state.enemyStatuses = makeEmptyEnemyStatuses();
  state.deathDanceBattleCount = 0;
  state.darkShieldStacks = 0;
  hideStatusTooltip();
  renderStatusLists();
}
function clearHeroDebuffsForDeathDance(){
  ensureStatusContainers();
  state.heroStatuses.bleeds = [];
  state.heroStatuses.darkBleeds = [];
  state.heroStatuses.burnUntil = 0;
  state.heroStatuses.lastBleedTick = performance.now();
  state.heroStatuses.lastDarkBleedTick = performance.now();
  renderStatusLists();
}
function isHeroDebuffImmune(){
  return !!(state.deathDance || state.deathDanceCutin);
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
  if(target !== 'enemy' && isHeroDebuffImmune()) return false;
  const owner = target==='enemy' ? state.enemyStatuses : state.heroStatuses;
  const box = owner.darkBleeds || (owner.darkBleeds = []);
  if(box.length >= 100) return false;
  box.push(nowMs() + 60000);
  renderStatusLists();
  return true;
}
function addBleed(target){
  ensureStatusContainers(); cleanupStatuses();
  if(target === 'hero' && isHeroDebuffImmune()) return false;
  const box = target==='hero' ? state.heroStatuses : state.enemyStatuses;
  if(box.bleeds.length >= 20) return false;
  box.bleeds.push(nowMs() + 10000);
  renderStatusLists();
  return true;
}
function addBurn(target){
  ensureStatusContainers(); cleanupStatuses();
  if(target === 'hero' && isHeroDebuffImmune()) return false;
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
    const ticks = Math.min(60, Math.floor((now - state.enemyStatuses.bossRegenLast)/200));
    if(ticks > 0){
      state.enemyStatuses.bossRegenLast += ticks*200;
      let totalHeal = 0;
      for(let i=0;i<ticks;i++){
        if(!(state.enemyHp > 0 && state.enemyHp < state.enemy.maxHp)) break;
        const rate = state.enemyHp <= state.enemy.maxHp * 0.5 ? 0.02 : 0.01;
        const heal = Math.max(1, Math.floor(state.enemy.maxHp * rate));
        state.enemyHp = Math.min(state.enemy.maxHp, state.enemyHp + heal);
        totalHeal += heal;
      }
      if(totalHeal > 0) showFloat(`+${totalHeal}`, 'heal');
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
      if(isSpeciesBoss()) dmg = Math.max(1, Math.floor(dmg * (1 - bossCommonDamageReduction())));
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
      if(isSpeciesBoss()) dmg = Math.max(1, Math.floor(dmg * (1 - bossCommonDamageReduction())));
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
      state.xpNext = 1000;
      state.xp = state.xpNext;
    }
  }
  state.hp = Math.min(state.hp, maxHp());
}
function totalCurrentExp(){
  return Math.max(1, Math.max(0, (Math.floor(Number(state.level)||1)-1) * 1000) + Math.max(0, Math.floor(Number(state.xp)||0)));
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
  const darkSaintBattle = isDarkSwordSaint();
  const currentLevel = Math.max(1, Math.floor(state.enemy?.level || state.enemyLevelBase || state.level || 1));
  if(darkSaintBattle){
    state.winStreak = 0;
    state.forceNextDarkSwordSaint = false;
    if(state.darkSwordSaintReturn && state.darkSwordSaintReturn.milestoneDarkSaint){
      state.enemyLevelBase = currentLevel + 1;
      state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
      state.darkSwordSaintReturn = null;
      log(`暗黒剣聖の試練から離脱した。試練を越え、敵レベルはLv.${currentLevel}→Lv.${state.enemyLevelBase}へ進行。`, 'danger');
    }else if(state.darkSwordSaintReturn){
      state.enemyLevelBase = state.darkSwordSaintReturn.enemyLevelBase;
      state.enemyLevelBaseDefeated = state.darkSwordSaintReturn.enemyLevelBaseDefeated;
      state.darkSwordSaintReturn = null;
      log('暗黒剣聖戦から離脱した。暗黒剣聖は独立レベルのため、敵の出現レベルは低下しない。', 'danger');
    }else{
      log('暗黒剣聖戦から離脱した。暗黒剣聖は独立レベルのため、敵の出現レベルは低下しない。', 'danger');
    }
    banner('暗黒剣聖から離脱');
    spawnWeakEnemyAfterEscape();
    return;
  }
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
  const desc = document.getElementById('fleeModalDesc');
  if(desc){
    desc.innerHTML = isDarkSwordSaint()
      ? '暗黒剣聖は独立レベルのため、逃走しても敵の出現レベルは下がりません。<br>経験値は失いません。'
      : '敵の出現レベルが20下がります。<br>経験値は失いません。';
  }
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
  const darkSaintDefeat = isDarkSwordSaint();
  let nextEnemyLevelBase = Math.max(1, Math.floor(defeatedEnemyLevel * 0.9));
  if(darkSaintDefeat){
    // ver.0.2.9: 100レベルごとの暗黒剣聖は、勝敗に関係なく通常敵レベル+1。
    if(state.darkSwordSaintReturn && state.darkSwordSaintReturn.milestoneDarkSaint){
      state.enemyLevelBase = defeatedEnemyLevel + 1;
      state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
      state.darkSwordSaintReturn = null;
      loseExpPercent(calcStats().effortRing ? 0 : (calcStats().humbleRing ? 0.09 : 0.25));
      state.hp = 0;
      const lostPct = calcStats().effortRing ? 0 : (calcStats().humbleRing ? 9 : 25);
      log(`暗黒剣聖の試練に敗北した。経験値を${lostPct}%失ったが、敵レベルはLv.${defeatedEnemyLevel}→Lv.${state.enemyLevelBase}へ進行。`,'danger');
    }else{
      if(state.darkSwordSaintReturn){
        state.enemyLevelBase = state.darkSwordSaintReturn.enemyLevelBase;
        state.enemyLevelBaseDefeated = state.darkSwordSaintReturn.enemyLevelBaseDefeated;
      }
      state.darkSwordSaintReturn = null;
      loseExpPercent(calcStats().effortRing ? 0 : (calcStats().humbleRing ? 0.09 : 0.25));
      state.hp = 0;
      const lostPct = calcStats().effortRing ? 0 : (calcStats().humbleRing ? 9 : 25);
      log(`暗黒剣聖に敗北した。経験値を${lostPct}%失ったが、暗黒剣聖は独立レベルのため通常敵レベルは低下しない。`,'danger');
    }
  }else{
    state.enemyLevelBase = nextEnemyLevelBase;
    state.enemyLevelBaseDefeated = state.defeated || 0;
    loseExpPercent(calcStats().effortRing ? 0 : (calcStats().humbleRing ? 0.09 : 0.25));
    state.hp = 0;
    const lostPct = calcStats().effortRing ? 0 : (calcStats().humbleRing ? 9 : 25);
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
  if(kind === 'deathdance') return `<b>死線の剣舞</b><br>残り：${Math.max(0, Math.ceil((state.deathDanceUntil-nowMs())/1000))}秒<br>極限状態で連続攻撃を放つ。<br>発動時にすべてのデバフを解除し、発動中は新たなデバフを無効化する。<br>この戦闘での発動回数：${state.deathDanceBattleCount||0}回<br>現在威力：${Math.pow(2, state.deathDanceBattleCount||0)}倍`; 
  if(kind === 'unyielding') return `<b>不屈</b><br>暗黒剣聖と対峙中のみ発動。<br>死線の剣舞発動率+50%。<br>現在の剣舞発動率：${Math.round(calcStats().deathDanceChance*100)}%。`;
  if(kind === 'darkaura') return `<b>闇オーラ</b><br>現在：${darkAuraStacks()}スタック<br>1スタックごとに被ダメージ10%軽減。<br>闇オーラ中は出血ダメージ90%軽減。<br>最大10スタック。10秒ごとに1減少。<br>暗黒剣舞発動時に10へ回復。`;
  if(kind === 'darksword') return `<b>暗黒の剣</b><br>現在：${darkSwordBuffCount()}スタック<br>攻撃力+50% / スタック。<br>効果時間：60秒。スタック可能。<br>最長残り：${darkSwordBuffSeconds()}秒。`;
  if(kind === 'darktechnique') return `<b>暗黒剣技</b><br>暗黒剣聖の通常攻撃で1ダメージが20回発生すると覚醒。<br>覚醒後は通常攻撃が暗黒剣技に置き換わる。<br>暗黒剣舞の回数にはカウントしない。<br>HP回復・闇オーラ回復・暗黒の剣付与はなし。<br>攻撃速度3倍、ガード無効、防御力50%無視。<br>攻撃ごとに出血50%、暗黒出血50%。<br>現在：${state.enemyStatuses?.darkTechniqueAwakened?'覚醒中':((state.enemyStatuses?.darkOneDamageCount||0)+' / 20')}。`;
  if(kind === 'darkdance') return `<b>暗黒剣舞</b><br>発動済み：${state.enemyStatuses?.darkDanceCount||0}回 / 10回<br>次回発動率：${darkDanceChanceForNext()}%<br>暗黒剣舞回数：${state.enemyStatuses?.darkDanceCount||0} / 10<br>HP0時に発動判定。カットイン後に5秒無敵、HPをゆっくり100%まで回復、闇オーラ10、暗黒の剣+1。<br>発動時、主人公の「死線の剣舞」の発動回数をリセットする。<br>連続攻撃は10秒間、攻撃速度3倍、ガード無効、防御力50%無視。<br>攻撃ごとに出血50%、暗黒出血50%。`;
  if(kind === 'acid_body') return `<b>酸ボディ</b><br>受けた直接ダメージの10%を跳ね返す。`;
  if(kind === 'super_regen') return `<b>超再生</b><br>0.2秒ごとに最大HPの1%を回復する。<br>HP50%以下では0.2秒ごとに2%回復する。`;
  if(kind === 'dragon_breath') return `<b>火炎ブレス</b><br>発動まで：あと${dragonBreathTurnsLeft()}ターン<br>ドラゴンの行動5回ごとに発動。<br>ドラゴンの現在HPの1%分の火属性攻撃を10連続で行う。<br>火軽減20%未満の場合、確定で火傷を付与する。`;
  if(kind === 'boss_common') return `<b>ボス</b><br>強大な存在。<br>時間経過で能力が変化する。`;
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
    if(isSpeciesBoss()) entries.push(['boss_common', 'enemy']);
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


function isDragonEnemy(){ return state.enemy?.id === 'dragon'; }
function dragonBreathTurnsLeft(){
  ensureStatusContainers();
  const count = Math.max(0, Math.min(4, Number(state.enemyStatuses?.dragonBreathCount)||0));
  return Math.max(1, 5 - count);
}
function showHeroBreathFloat(text, index){
  const layer=els.heroCard.querySelector('.float-layer') || (()=>{const l=document.createElement('div'); l.className='float-layer'; els.heroCard.appendChild(l); return l;})();
  const div=document.createElement('div');
  div.className='float fire breath-hit hero-damage-float';
  div.textContent=text;
  const offset = Math.max(0, Number(index)||0);
  // 主人公の被ダメは中央寄り（主人公から見て左側）へ、1発ごとに少しずらす
  div.style.left = `${34 + (offset % 5) * 3}%`;
  div.style.top = `${14 + offset * 4.0}%`;
  div.style.fontSize = '42px';
  div.style.animationDuration = '3s';
  div.style.zIndex = String(20 + offset);
  layer.appendChild(div);
  setTimeout(()=>div.remove(), 3200);
}

function dragonFireBreath(){
  if(!isDragonEnemy() || state.down || state.dragonBreathActive) return;
  state.dragonBreathActive = true;
  const st = calcStats();
  const base = Math.max(1, Math.floor((state.enemyHp || state.enemy?.maxHp || 1) * 0.01));
  let total = 0;
  let hit = 0;
  log('ドラゴンが大きく息を吸い込んだ……','danger');
  banner('🔥 火炎ブレス！！', 1250);
  playSfx('fire');

  const finish = ()=>{
    state.dragonBreathActive = false;
    if(total > 0) log(`火炎ブレス！ 10連続火属性攻撃 合計${total}ダメージ`, 'danger');
    if(!state.down && state.hp > 0){
      if((st.fireRes||0) >= 0.20){
        log('騎士は火軽減20%以上で火傷を防いだ。','good');
      }else if(addBurn('hero')){
        log('火軽減20%未満。火炎ブレスで騎士は火傷した。','danger');
      }
    }
    renderBattle();
    renderStatusLists();
  };

  const doHit = ()=>{
    if(!isDragonEnemy() || state.down || state.hp <= 0 || hit >= 10){ finish(); return; }
    hit += 1;
    let dmg = Math.max(1, Math.floor(base * (1 - (st.fireRes||0))));
    dmg = applyDarkShieldToDamage(dmg);
    total += dmg;
    showHeroBreathFloat(`-${dmg.toLocaleString()}`, hit - 1);
    playSfx('fire');

    if(state.hp - dmg <= 0){
      if(!state.debug.killHero && tryHeroDeathDance()){
        renderBattle();
        finish();
        return;
      }
      state.hp = 0;
      renderBattle();
      handleHeroDeath();
      finish();
      return;
    }

    state.hp = Math.max(0, state.hp - dmg);
    renderBattle();
    setTimeout(doHit, 120);
  };

  setTimeout(doHit, 260);
}

function renderStatusLists(){
  ensureStatusContainers(); cleanupStatuses();
  if(els.enemyStatusList){
    const parts=[];
    if(isSpeciesBoss()){
      parts.push(makeStatusBadge(`👹ボス`, 'bossbuff', 'boss_common', 'enemy'));
    }
    if(state.enemy?.bossBuff){
      const names={acid_body:'🧪酸ボディ', super_regen:'💚超再生', apex:'👑種族の頂点', spirit_king:'🔥精霊王'};
      parts.push(makeStatusBadge(names[state.enemy.bossBuff]||'ボス特性', 'bossbuff', state.enemy.bossBuff, 'enemy'));
    }
    if(isDragonEnemy()){
      parts.push(makeStatusBadge(`🐉火炎ブレス：${dragonBreathTurnsLeft()}`, 'bossbuff', 'dragon_breath', 'enemy'));
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
  // ver.0.2.9: 通常敵レベルは撃破時抽選で上昇。ボスはLv10刻み予約からランダム出現。
  return {...normals[Math.floor(Math.random()*normals.length)]};
}
function getBossForNormal(normalId){
  const bossId = BOSS_BY_NORMAL_ID[normalId];
  return bossId ? ENEMIES.find(e=>e.id===bossId) : null;
}
function getEnemyTemplateById(id){
  if(id === 'dark_sword_saint') return DARK_SWORD_SAINT;
  return ENEMIES.find(e=>e.id===id) || null;
}
function shouldReplaceBossWithDarkSaint(){
  return !!state.darkSwordSaintFirstEncountered && Math.random() < 0.01;
}
function scheduleBossAfterNormalDefeat(e){
  // ver.0.2.9: 雑魚Lv10刻みで、種族ボスからランダム出現。レベルは撃破した雑魚と共通。
  try{
    if(!e || e.type !== '雑魚') return;
    const lv = Math.max(1, Math.floor(Number(e.level)||1));
    if(lv % 10 !== 0) return;
    if(Math.floor(Number(state.lastBossScheduledLevel)||0) === lv) return;
    if(lv % 100 === 0){
      state.pendingBossForNext = { id: 'dark_sword_saint', level: lv, from: e.id, milestoneDarkSaint: true };
      state.lastBossScheduledLevel = lv;
      log(`${e.name}Lv.${lv}を制した。100レベルごとの試練として、次のボスは暗黒剣聖！`, 'danger');
      banner('100レベルの試練！', 1800);
      return;
    }
    const bossPool = bosses.filter(b => b && b.type === 'ボス');
    if(!bossPool.length) return;
    const boss = bossPool[Math.floor(Math.random() * bossPool.length)];
    state.pendingBossForNext = { id: boss.id, level: lv, from: e.id, randomBoss: true };
    state.lastBossScheduledLevel = lv;
    log(`${e.name}Lv.${lv}を制した。次の敵にボスLv.${lv}が現れる！`, 'danger');
  }catch(err){
    console.error('[MBH0.1.3 scheduleBossAfterNormalDefeat]', err);
    state.pendingBossForNext = null;
  }
}
function makeScaledEnemy(base, forceLevel=null){
  const e = {...base};
  if(e.id === 'dark_sword_saint' && forceLevel == null){ forceLevel = Math.max(1, Math.floor(state.darkSwordSaintLevel || 1)); }
  const bossBonus = e.type==='ボス' || e.type==='裏ボス' ? 4 : 0;
  if(forceLevel){
    e.level = forceLevel;
  }else{
    // ver.0.2.9: 敵レベルは撃破数で自動上昇させず、撃破時の抽選/ボス撃破で更新する。
    if(state.enemyLevelBase == null){
      state.enemyLevelBase = Math.max(1, Math.floor(Number(state.enemy?.level) || Number(state.level) || 1));
      state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
    }
    e.level = Math.max(1, Math.floor(Number(state.enemyLevelBase)||1) + bossBonus);
  }
  if(e.id !== 'dark_sword_saint' && calcStats && calcStats().humbleRing){
    if(state.humbleEnemyFixedLevel == null) state.humbleEnemyFixedLevel = Math.max(1, e.level || state.level || 1);
    e.level = Math.max(1, Math.floor(state.humbleEnemyFixedLevel));
  }else{
    state.humbleEnemyFixedLevel = null;
  }
  const scaledDefeated = state.enemyLevelBase != null ? Math.max(0, (state.defeated||0) - (state.enemyLevelBaseDefeated||0)) : (state.defeated||0);
  const hpScale=1 + e.level*.035 + Math.floor(scaledDefeated/10)*.03;
  // ver.0.2.9: 敵ATK/DEFのレベル成長が弱すぎたため、HPとは別の成長係数へ分離。
  // HPは既存の伸びを維持し、攻撃力・防御力だけ敵Lvに応じてしっかり伸ばす。
  const statScale=1 + Math.max(0, (Number(e.level)||1)-1) * 0.08 + Math.floor(scaledDefeated/10)*.03;
  const normalHpGrowth = e.type === '雑魚' ? Math.pow(1.01, Math.max(0, (Number(e.level)||1) - 1)) : 1;
  e.maxHp=Math.max(1, Math.floor(e.hp * hpScale * 0.1 * normalHpGrowth));
  e.atk=Math.max(1, Math.floor(e.atk*statScale));
  e.def=Math.max(0, Math.floor(e.def*statScale));
  e.xp=Math.floor(e.xp*(1+e.level*.045));
  return e;
}
function setEnemy(e){
  state.deathDanceBattleCount = 0;
  state.darkShieldStacks = 0;
  state.enemy=e; state.enemyHp=e.maxHp; state.enemyStatuses = makeEmptyEnemyStatuses(performance.now());
  if(isDarkSwordSaint(e)){
    state.darkSwordSaintFirstEncountered = true;
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
  // ver0.1.3: 即時召喚ではなく、次の敵として暗黒剣聖を予約する
  state.forceNextDarkSwordSaint = true;
  state.pendingDarkSwordSaintDelay = false;
  banner('次の敵に暗黒剣聖をセット！', 1400);
  log('デバッグ：暗黒剣聖を次の敵にセット。現在の敵を倒すと出現する。', 'danger');
  renderAll();
  scheduleSave();
}
function spawnEnemy(forceFirst=false){
  let base;
  let forceLevel = forceFirst ? 1 : null;
  if(!forceFirst && state.forceNextDarkSwordSaint){
    state.darkSwordSaintReturn = {
      enemyLevelBase: state.enemyLevelBase,
      enemyLevelBaseDefeated: state.enemyLevelBaseDefeated,
      defeated: state.defeated,
      level: state.enemy && state.enemy.id !== 'dark_sword_saint' ? state.enemy.level : null
    };
    base = DARK_SWORD_SAINT;
    state.forceNextDarkSwordSaint = false;
    state.pendingBossForNext = null;
    log('成長の気配に、暗黒剣聖が現れた。', 'danger');
    banner('暗黒剣聖出現！', 1800);
  }else if(!forceFirst && state.debugForcedBossNext){
    const pending = state.debugForcedBossNext;
    const bossBase = getEnemyTemplateById(pending.id);
    state.debugForcedBossNext = null;
    base = bossBase || pickEnemy();
    forceLevel = Math.max(1, Math.floor(Number(pending.level)||1));
    log(`デバッグ：${base.name}Lv.${forceLevel} が次の敵として現れた。`, 'danger');
  }else if(!forceFirst && state.pendingBossForNext){
    const pending = state.pendingBossForNext;
    const bossBase = getEnemyTemplateById(pending.id);
    state.pendingBossForNext = null;
    if(pending.id === 'dark_sword_saint'){
      const lv = Math.max(1, Math.floor(Number(pending.level)||1));
      state.darkSwordSaintReturn = {
        enemyLevelBase: state.enemyLevelBase,
        enemyLevelBaseDefeated: state.enemyLevelBaseDefeated,
        defeated: state.defeated,
        level: lv,
        pendingBoss: pending,
        milestoneDarkSaint: true
      };
      base = DARK_SWORD_SAINT;
      forceLevel = lv;
      log(`100レベルごとの試練。暗黒剣聖Lv.${lv}が立ちはだかる！`, 'danger');
      banner('暗黒剣聖・試練！', 1800);
    }else if(bossBase && shouldReplaceBossWithDarkSaint()){
      state.darkSwordSaintReturn = {
        enemyLevelBase: state.enemyLevelBase,
        enemyLevelBaseDefeated: state.enemyLevelBaseDefeated,
        defeated: state.defeated,
        level: Math.max(1, Math.floor(Number(pending.level)||1)),
        pendingBoss: pending
      };
      base = DARK_SWORD_SAINT;
      log(`${bossBase.name}の気配を裂き、暗黒剣聖が現れた！（ボス時1%）`, 'danger');
      banner('暗黒剣聖乱入！', 1800);
    }else{
      base = bossBase || pickEnemy();
      forceLevel = Math.max(1, Math.floor(Number(pending.level)||1));
      log(`${base.name}Lv.${forceLevel} が立ちはだかる！`, 'danger');
    }
  }else{
    base=forceFirst ? makeFirstEnemy() : pickEnemy();
  }
  const e = makeScaledEnemy(base, forceLevel);
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
    if(isSpeciesBoss()) dmg = Math.max(1, Math.floor(dmg * (1 - bossCommonDamageReduction())));
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
  if(state.dragonBreathActive) return;
  state.lastEnemyAttack=now;
  const e=state.enemy, st=calcStats();
  if(isDragonEnemy()){
    ensureStatusContainers();
    state.enemyStatuses.dragonBreathCount = (Number(state.enemyStatuses.dragonBreathCount)||0) + 1;
    if(state.enemyStatuses.dragonBreathCount >= 5){
      state.enemyStatuses.dragonBreathCount = 0;
      dragonFireBreath();
      return;
    }
    renderStatusLists();
  }
  if(isDarkSwordSaint() && state.enemyStatuses?.darkTechniqueAwakened){
    startDarkSwordTechnique(false);
    renderBattle();
    return;
  }
  // ver0.1.3: 火の精霊・火の精霊王の通常攻撃は必ず火属性。
  // 以前は fire 属性敵でも55%抽選だったため、火属性攻撃にならないことがあった。
  const isPureFireAttacker = e && (e.id === 'fire_spirit' || e.id === 'fire_king');
  let element = isDarkSwordSaint() ? 'dark' : (isPureFireAttacker ? 'fire' : (e.element==='fire' && Math.random()<.55 ? 'fire':'normal'));
  let name = element==='dark' ? '暗黒攻撃' : (e.enemySkill && element==='fire' ? e.enemySkill:'攻撃');
  if(Math.random()<st.guard){ showHeroFloat('GUARD','guard'); playSfx('guard'); log(`${e.name} の${name}をGUARD！`,'good'); return; }
  let atk = e.atk * (1 + darkSwordBuffCount() * 0.5);
  const bossPierce = bossCommonDefensePierce();
  let dmg=Math.max(1, Math.floor(atk - st.def*.55*heroDefenseMultiplier()*(1-bossPierce) + rand(0,atk*.35)));
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
  // ver.0.2.9: 暗黒剣舞でリセットするのは死線の剣舞の発動回数だけ。
  // 発動中の死線の剣舞そのものは解除しない。
  state.deathDanceBattleCount = 0;
  state.deathDanceComboCount = 0;
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
function updateEnemyLevelProgressionOnDefeat(e){
  // ver.0.2.9: 雑魚撃破は10%で敵レベル+1。ボス撃破は確定+1。
  // 暗黒剣聖は通常敵進行に影響させない。
  try{
    if(!e) return;
    const lv = Math.max(1, Math.floor(Number(e.level) || Number(state.enemyLevelBase) || Number(state.level) || 1));
    if(e.id === 'dark_sword_saint'){
      if(state.darkSwordSaintReturn && state.darkSwordSaintReturn.milestoneDarkSaint){
        state.enemyLevelBase = lv + 1;
        state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
        log(`100レベルの試練突破！ 敵レベルがLv.${lv}→Lv.${state.enemyLevelBase}に上昇。`, 'system');
      }
      return;
    }
    if(state.enemyLevelBase == null) state.enemyLevelBase = lv;
    const isBoss = e.type === 'ボス' || e.type === '裏ボス';
    if(isBoss){
      state.enemyLevelBase = lv + 1;
      state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
      log(`ボス撃破！ 敵レベルがLv.${lv}→Lv.${state.enemyLevelBase}に上昇。`, 'system');
      return;
    }
    if(e.type === '雑魚'){
      if(Math.random() < 0.10){
        state.enemyLevelBase = lv + 1;
        state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
        log(`敵レベル上昇！ Lv.${lv}→Lv.${state.enemyLevelBase}`, 'system');
      }else{
        state.enemyLevelBase = lv;
      }
    }
  }catch(err){
    console.error('[MBH0.1.3 updateEnemyLevelProgressionOnDefeat]', err);
  }
}


function heroEnemyLevelDiffMultiplier(e){
  const enemyLv = Math.max(1, Math.floor(Number(e?.level) || Number(state.enemyLevelBase) || 1));
  const heroLv = Math.max(1, Math.floor(Number(state.level) || 1));
  const diff = enemyLv - heroLv;
  return diff >= 0 ? (1 + diff * 0.10) : Math.max(0.10, 1 + diff * 0.10);
}
function calcHeroExpBase(e){
  if(!e) return 1;
  if(e.id === 'dark_sword_saint') return 1000;
  if(e.type === 'ボス' || e.type === '裏ボス') return 400;
  const kind = e.variant?.type || e.variantType || '';
  if(kind === 'named') return 100;
  if(kind === 'strong') return 75;
  return 50;
}
function calcHeroExpGain(e){
  return Math.max(1, Math.ceil(calcHeroExpBase(e) * heroEnemyLevelDiffMultiplier(e)));
}

function enemyDefeated(){
  const e=state.enemy;
  window.__mbhLastDefeatedEnemyForDrop = e;
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
  updateEnemyLevelProgressionOnDefeat(e);
  if(e && e.id === 'dark_sword_saint'){
    state.darkSwordSaintFirstEncountered = true;
    state.darkSwordSaintKills = Math.max(0, Math.floor(state.darkSwordSaintKills||0)) + 1;
    state.darkSwordSaintLevel = Math.max(1, Math.floor(state.darkSwordSaintLevel||1)) + 1;
    state.darkSwordSaintReturn = null;
  }else{
    {
      scheduleBossAfterNormalDefeat(e);
    }
  }
  markEnemyDefeated(e);
  const gainXp = calcHeroExpGain(e);
  state.lastXpGain = gainXp;
  state.xp += gainXp;
  if(e && e.id === 'dark_sword_saint'){
    const legendary = rarities.find(r=>r.id==='legendary') || rarities[rarities.length-1];
    const darkPool = [makeDarkHolySword, makeDarkShield, makeDarkAmulet, makeDarkArmor, makeDarkGauntlets, makeDarkHelm, makeDarkBoots];
    const defeatedLevel = Math.max(1, Math.floor(Number(e?.level) || Number(state.enemyLevelBase) || Number(state.level) || 1));
    const makeDarkReward = () => darkPool[Math.floor(Math.random()*darkPool.length)](defeatedLevel);
    const makeLegendReward = () => makeItem(slots[Math.floor(Math.random()*slots.length)], legendary, {isBossDrop:true, levelOverride:defeatedLevel});

    // ver0.1.3: 報酬枠を明示的に固定する。
    // rewards[0] = 1枠目、rewards[1] = 2枠目、rewards[2] = 3枠目。
    // 3枠目は必ず闇装備。1〜2枠目は確率で闇装備になってもよい。
    const rewards = [
      Math.random() < 0.18 ? makeDarkReward() : makeLegendReward(),
      Math.random() < 0.18 ? makeDarkReward() : makeLegendReward(),
      makeDarkReward()
    ];
    rewards.forEach((it, idx)=>{ it.dropSlotNo = idx + 1; it.darkSaintReward = true; });

    // 倉庫の上から「1枠目、2枠目、3枠目」の順で見えるように積む。
    for(let i=rewards.length-1;i>=0;i--) state.inventory.unshift(rewards[i]);
    log(`暗黒剣聖討伐報酬：1枠目=${rewards[0].name} / 2枠目=${rewards[1].name} / 3枠目=${rewards[2].name}（闇装備確定）`,'good');
    showDropSequence(rewards);
  }else{
    const isBossDrop = e?.type === 'ボス';
    const dropRate = isBossDrop ? 0.50 : 0.10;
    if(Math.random() < dropRate){
      const it=makeRandomItem(isBossDrop, Math.max(1, Math.floor(Number(e?.level) || Number(state.enemyLevelBase) || Number(state.level) || 1)));
      state.inventory.unshift(it);
      logItemDrop(it);
      showDropToast(it);
    }
  }
  // ver.0.2.9: 強化石ドロップは廃止。装備はドロップ時に敵Lv依存の+値が付く。
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
function effectiveXpNext(){
  state.xpNext = 1000;
  return 1000;
}
function checkLevelUp(){
  // ver0.1.3: 主人公の次Lv必要経験値を現行値の50%として扱う。
  while(state.xp>=effectiveXpNext()){
    const need = effectiveXpNext();
    state.xp-=need;
    state.level++;
    state.xpNext = 1000;
    state.hp=maxHp();
    showLevelUp();
    log(`LEVEL UP！ Lv.${state.level}`,'good');
    const levelTrigger = Math.floor((Number(state.level)||1) / 20);
    if(state.darkSwordSaintFirstEncountered && levelTrigger > Math.max(0, Math.floor(Number(state.darkSwordSaintLastLevelTrigger)||0))){
      state.darkSwordSaintLastLevelTrigger = levelTrigger;
      state.forceNextDarkSwordSaint = true;
      state.pendingBossForNext = null;
      state.pendingDarkSwordSaintDelay = false;
      log(`Lv.${state.level}到達。次の敵に暗黒剣聖が確定出現する。`, 'danger');
      banner('暗黒剣聖の試練！', 1800);
    }
  }
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
  clearHeroDebuffsForDeathDance();
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
  clearHeroDebuffsForDeathDance();
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
  log(`死線の剣舞発動！ すべてのデバフを解除し、発動中は新たなデバフを無効化。今回の戦闘中${state.deathDanceBattleCount}回目、威力${Math.pow(2,state.deathDanceBattleCount)}倍。`,'skilllog');
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
function floatDurationForClass(cls='damage'){
  const c = String(cls||'');
  if(c.includes('guard') || c.includes('immune')) return 3000;
  if(c.includes('breath-hit')) return 3000;
  return 2000;
}
function showFloat(text, cls='damage'){
  // 敵側：被ダメは中央寄り（敵の右側）、回復は外側（敵の左側）
  const c = String(cls||'damage');
  const side = c.includes('heal') ? 'enemy-heal-float' : 'enemy-damage-float';
  const div=document.createElement('div');
  div.className=`float ${c} ${side}`;
  div.textContent=text;
  els.enemyFloats.appendChild(div);
  setTimeout(()=>div.remove(), floatDurationForClass(c) + 200);
}
function showHeroFloat(text, cls='damage'){
  // 主人公側：被ダメは中央寄り（主人公の左側）、回復は外側（主人公の右側）
  const layer=els.heroCard.querySelector('.float-layer') || (()=>{const l=document.createElement('div'); l.className='float-layer'; els.heroCard.appendChild(l); return l;})();
  const c = String(cls||'damage');
  const side = c.includes('heal') ? 'hero-heal-float' : 'hero-damage-float';
  const div=document.createElement('div');
  div.className=`float ${c} ${side}`;
  div.textContent=text;
  layer.appendChild(div);
  setTimeout(()=>div.remove(), floatDurationForClass(c) + 200);
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
  if(!isTouchDevice || !isTouchDevice()) return;
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
  if(document.hidden){ if(isTouchDevice && isTouchDevice()) pauseBgmForPageHidden(); }
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



function rollDropPlusByEnemyLevel(enemyLevel){
  const lv = Math.max(1, Math.floor(Number(enemyLevel) || state?.enemy?.level || state?.level || 1));
  const min = Math.max(0, Math.floor(lv / 100));
  const max = Math.max(min, 10 + Math.floor(lv / 50));
  return randInt(min, max);
}
function getDropEnemyLevel(levelOverride){
  return Math.max(1, Math.floor(Number(levelOverride) || state?.enemy?.level || state?.level || 1));
}
function applyDropPlusToItem(it, enemyLevel){
  if(!it) return it;
  const lv = getDropEnemyLevel(enemyLevel);
  if(it.itemLevel == null) it.itemLevel = lv;
  if(it.level == null || Number(it.level) < 0) it.level = rollDropPlusByEnemyLevel(lv);
  const plus = Math.max(0, Math.floor(Number(it.level) || 0));
  // ドロップ+値は「後から強化」ではなく、拾った時点の品質。
  // 伸び幅は強すぎないよう、主能力は+1ごとに4%、特殊効果は+1ごとに0.2%程度。
  const statMul = 1 + plus * 0.04;
  if(!it.__dropPlusApplied){
    if(it.atk) it.atk = Math.max(1, Math.floor(it.atk * statMul));
    if(it.def) it.def = Math.max(1, Math.floor(it.def * statMul));
    if(it.hp) it.hp = Math.max(1, Math.floor(it.hp * statMul));
    const specialAdd = plus * 0.002;
    if(it.crit) it.crit = Math.min(0.65, +(it.crit + specialAdd).toFixed(3));
    if(it.lifeSteal) it.lifeSteal = Math.min(0.35, +(it.lifeSteal + specialAdd).toFixed(3));
    if(it.guard) it.guard = Math.min(0.55, +(it.guard + specialAdd).toFixed(3));
    if(it.fireRes) it.fireRes = Math.min(0.75, +(it.fireRes + specialAdd).toFixed(3));
    if(it.fireDmg) it.fireDmg = Math.min(1.5, +(it.fireDmg + specialAdd).toFixed(3));
    if(it.thunderDmg) it.thunderDmg = Math.min(1.5, +(it.thunderDmg + specialAdd).toFixed(3));
    if(it.fireSkillChance) it.fireSkillChance = Math.min(0.95, +(it.fireSkillChance + specialAdd).toFixed(3));
    if(it.thunderSkillChance) it.thunderSkillChance = Math.min(0.95, +(it.thunderSkillChance + specialAdd).toFixed(3));
    if(it.deathDanceChance && it.specialFrame === 'darkholy') it.deathDanceChance = Math.min(0.50, +(it.deathDanceChance + specialAdd).toFixed(3));
    it.__dropPlusApplied = true;
  }
  return it;
}
function formatItemNameWithPlus(it){
  if(!it) return '';
  const plus = Math.max(0, Math.floor(Number(it.level)||0));
  return `${it.name}+${plus}`;
}

function darkEquipLevelFromSource(levelOverride){
  const raw = Math.max(1, Math.floor(Number(levelOverride) || Number(state?.enemy?.level) || Number(state?.darkSwordSaintLevel) || Number(state?.level) || 1));
  // ver.0.2.9: 闇装備は暗黒剣聖の独立Lv1を通常敵Lv100相当として扱う。
  // すでに通常敵Lv100以上が渡された場合はそのまま使う。
  return raw < 100 ? raw * 100 : raw;
}
function makeDarkHolySword(levelOverride){
  const lv = darkEquipLevelFromSource(levelOverride);
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('武器', legendary, {levelOverride: lv});
  it.name = '闇の聖剣';
  it.rarity = 'legendary';
  it.rarityName = 'レジェンダリー';
  it.specialFrame = 'darkholy';
  it.atk = Math.floor((34 + lv * 7) * legendary.mult);
  it.crit = Math.max(it.crit||0, 0.08);
  it.heroDarkBleedChance = 0.10;
  it.skill = {id:'multi', name:'連続攻撃', chance:1, element:'physical'};
  it.flavor = '暗黒剣聖を超えた証。通常攻撃と剣舞の1ヒットごとに暗黒出血を刻む。';
  it.itemLevel = lv; it.__dropPlusApplied = false; applyDropPlusToItem(it, lv);
  return it;
}

function makeDarkShield(levelOverride){
  const lv = darkEquipLevelFromSource(levelOverride);
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('盾', legendary, {levelOverride: lv});
  it.name = '闇の盾';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'darkholy';
  it.def = Math.floor((18 + lv * 5) * legendary.mult);
  it.hp = Math.floor((70 + lv * 14) * legendary.mult);
  it.darkShield = true;
  it.flavor = '毎ターン被ダメージ軽減+1%（最大50%）。受けたダメージの半分を回復。';
  it.itemLevel = lv; it.__dropPlusApplied = false; applyDropPlusToItem(it, lv);
  return it;
}
function makeDarkAmulet(levelOverride){
  const lv = darkEquipLevelFromSource(levelOverride);
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('アミュレット', legendary, {levelOverride: lv});
  it.name = '闇のアミュレット';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'darkholy';
  it.hp = Math.floor((90 + lv * 16) * legendary.mult);
  it.deathDanceChance = 0.25;
  it.darkAmulet = true;
  it.flavor = '死線の剣舞発動率+25%。死線の剣舞効果時間2倍。';
  it.itemLevel = lv; it.__dropPlusApplied = false; applyDropPlusToItem(it, lv);
  return it;
}
function makeMasterAmulet(){
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('アミュレット', legendary, {levelOverride: 1});
  it.id = 'master_amulet_fixed';
  it.name = '師匠のアミュレット';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー';
  it.hp = 120;
  it.deathDanceChance = 0.10;
  it.masterRegen = true;
  it.unsellable = true;
  it.level = 0; it.itemLevel = 1;
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
function makeRandomItem(isBossDrop=false, levelOverride=null){
  const slot=slots[Math.floor(Math.random()*slots.length)];
  const r=Math.random(); const rarity = r<.70?rarities[0]:r<.94?rarities[1]:rarities[2];
  return makeItem(slot, rarity, {isBossDrop, levelOverride});
}
function makeItem(slot, rarity, opts={}){
  const lv=getDropEnemyLevel(opts.levelOverride);
  const plus=rollDropPlusByEnemyLevel(lv);
  const name=(equipNames[slot]||[slot])[Math.floor(Math.random()*(equipNames[slot]||[slot]).length)];
  const m=rarity.mult;
  const it={id:crypto.randomUUID?.()||String(Math.random()), slot, rarity:rarity.id, rarityName:rarity.name, name, itemLevel:lv, level:plus, atk:0, def:0, hp:0, fireRes:0, fireDmg:0, fireSkillChance:0, fireDamageHeal:0, thunderDmg:0, thunderSkillChance:0, crit:0, lifeSteal:0, guard:0, deathDanceChance:0};
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
  applyDropPlusToItem(it, lv);
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
  log('強化システムは廃止されました。装備はドロップ時の+値で厳選します。','system');
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
function ensureEnemyDebugStatsLine(){
  if(!els.enemyCard) return null;
  let line = document.getElementById('enemyDebugStatsLine');
  if(!line){
    line = document.createElement('div');
    line.id = 'enemyDebugStatsLine';
    line.className = 'enemy-debug-stats-line hidden';
    const hp = els.enemyCard.querySelector('.enemy-hp');
    if(hp && hp.parentNode) hp.parentNode.insertBefore(line, hp);
  }
  return line;
}
function updateEnemyDebugStatsLine(){
  const line = ensureEnemyDebugStatsLine();
  if(!line) return;
  const enabled = !!(state.debug && state.debug.showEnemyStats);
  if(!enabled || !state.enemy){ line.classList.add('hidden'); line.textContent=''; return; }
  const atk = Math.floor((Number(state.enemy.atk)||0) * (1 + darkSwordBuffCount() * 0.5));
  const def = Math.floor(Number(state.enemy.def)||0);
  line.textContent = `ATK：${atk.toLocaleString()}　DEF：${def.toLocaleString()}`;
  line.classList.remove('hidden');
}
function renderBattle(){
  installVersionLabel();
  const mh=maxHp(); els.heroLevel.textContent=`Lv.${state.level}`; els.heroHpFill.style.width=`${Math.max(0,state.hp/mh*100)}%`; els.heroHpText.textContent=`${Math.floor(state.hp)} / ${Math.floor(mh)}`;
  if(state.enemy){ els.enemyName.textContent=state.enemy.name; if(els.enemyLevel) els.enemyLevel.textContent=`Lv.${state.enemy.level||1}`; els.enemyTag.textContent=state.enemy.type==='ボス'?'BOSS':''; els.enemyHpFill.style.width=`${Math.max(0,state.enemyHp/state.enemy.maxHp*100)}%`; els.enemyHpText.textContent=`${Math.floor(state.enemyHp)} / ${state.enemy.maxHp}`; }
  updateEnemyDebugStatsLine();
  if(els.chests) els.chests.textContent=state.chests; els.mats.textContent=state.mats;
  const need = effectiveXpNext();
  if(els.expFill){ els.expFill.style.width=`${Math.max(0,Math.min(100,state.xp/need*100))}%`; els.expLabel.textContent=`Lv.${state.level} EXP ${state.xp} / ${need}`; els.expGainLabel.textContent=formatExpDelta(state.lastXpGain); }
  if(state.deathDance){ els.deathDanceStatus.textContent = `死線の剣舞 残り${Math.max(0, Math.ceil((state.deathDanceUntil-performance.now())/1000))}秒`; }
  renderStatusLists();
}
function renderStats(){ const st=calcStats(); const need=effectiveXpNext(); els.statLv.textContent=state.level; els.statXp.textContent=`${state.xp} / ${need}`; els.statXpNext.textContent=need; els.statXpGain.textContent=formatExpDelta(state.lastXpGain); els.statAtk.textContent=Math.floor(st.atk); els.statDef.textContent=Math.floor(st.def); els.statFireRes.textContent=`${Math.round(st.fireRes*100)}%`; renderMonsterRecords(); }
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
  slots.forEach(slot=>{ const it=state.equip[slot]; const div=document.createElement('div'); div.className='equip'+(it?` ${itemFrameClass(it)} ${it.rarity}`:'')+(state.selectedEquip===slot?' selected':''); div.innerHTML=it?`<b style="color:${itemNameColor(it)}">${slot}: ${formatItemNameWithPlus(it)}</b><small>${itemSummary(it)}</small>`:`<b>${slot}: 未装備</b>`; div.onclick=()=>{state.selectedEquip=slot; renderEquip();}; if(it){ div.onmousemove=(e)=>showTip(e,it); div.onmouseleave=()=>els.tooltip.classList.add('hidden'); } els.equipList.appendChild(div); });
  const it=state.selectedEquip && state.equip[state.selectedEquip];
  if(els.upgradeBtn){ els.upgradeBtn.disabled=true; els.upgradeBtn.classList.add('hidden'); els.upgradeBtn.classList.remove('attention'); }
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
  menu.innerHTML = `<div class="inventory-action-title"><b>${escapeHtml(formatItemNameWithPlus(it))}</b><small>${escapeHtml(it.slot)} / ${escapeHtml(it.rarityName||it.rarity)}</small></div><div class="inventory-action-summary">${escapeHtml(itemSummary(it)||'追加能力なし')}${current?`<br>現在: ${escapeHtml(formatItemNameWithPlus(current))} / 戦力差: ${diff>=0?'+':''}${diff}`:'<br>現在: 未装備'}</div><div class="inventory-action-buttons"><button type="button" data-action="equip">装備</button><button type="button" data-action="cancel">キャンセル</button></div>`;
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
  if(it.itemLevel) arr.push(`ドロップLv${Math.floor(Number(it.itemLevel)||1)}`);
  arr.push(`品質+${Math.max(0, Math.floor(Number(it.level)||0))}`);
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
  const current=state.equip[it.slot]; let html=`<b style="color:${itemNameColor(it)}">${formatItemNameWithPlus(it)}</b><br>${it.slot} / ${it.rarityName}<br>${itemSummary(it)}<hr>`;
  html+= current ? `現在: ${formatItemNameWithPlus(current)}<br>戦力差: ${Math.round(itemPower(it)-itemPower(current))}` : '現在: 未装備';
  els.tooltip.innerHTML=html; els.tooltip.style.left=(e.clientX+14)+'px'; els.tooltip.style.top=(e.clientY+14)+'px'; els.tooltip.classList.remove('hidden');
}

function escapeHtml(v){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function rarityColor(r){ return r==='darkholy' ? '#b86cff' : r==='legendary' ? '#ff9b24' : r==='rare' ? '#4d8dff' : '#eeeeee'; }
function logItemDrop(it){
  const color = itemNameColor(it);
  const rarity = it.rarityName || (rarities.find(r=>r.id===it.rarity)?.name || it.rarity);
  const slotLabel = it && it.darkSaintReward ? `<span class="log-slot">${it.dropSlotNo}枠目${it.dropSlotNo===3?'確定':''}：</span>` : '';
  log(`装備ドロップ：${slotLabel}<span class="log-item ${itemFrameClass(it)} ${it.rarity}" style="color:${color}">${escapeHtml(formatItemNameWithPlus(it))}</span> <span class="log-rarity ${itemFrameClass(it)} ${it.rarity}" style="color:${color}">${escapeHtml(rarity)}</span>`, 'good', true);
}

function showDropSequence(items){
  if(state.dropToastQueueTimers){ state.dropToastQueueTimers.forEach(t=>clearTimeout(t)); }
  state.dropToastQueueTimers = [];
  const list = (items||[]).filter(Boolean);
  list.forEach((it,i)=>{
    const t=setTimeout(()=>{
      logItemDrop(it);
      showDropToast(it, i);
      renderInventory();
      scheduleSave();
    }, i*140);
    state.dropToastQueueTimers.push(t);
  });
}

function showDropToast(it, stackIndex=0){
  if(!els.dropToast) return;
  const color = itemNameColor(it);
  const rarity = it.rarityName || (rarities.find(r=>r.id===it.rarity)?.name || it.rarity);
  const summary = escapeHtml(itemSummary(it) || '追加能力なし');
  const slotLabel = it && it.darkSaintReward ? `<strong class="drop-slot-label">${it.dropSlotNo}枠目${it.dropSlotNo===3?'・闇装備確定':''}</strong>` : '';
  const toast = els.dropToast.cloneNode(false);
  toast.removeAttribute('id');
  toast.innerHTML = `${slotLabel}<span style="color:${color}">${escapeHtml(formatItemNameWithPlus(it))}</span><small style="color:${color}">${escapeHtml(rarity)}</small><em class="drop-performance">${summary}</em>`;
  toast.className = `drop-toast drop-toast-stacked ${itemFrameClass(it)} ${it.rarity}`;
  toast.style.setProperty('--drop-y', `${18 + Math.min(stackIndex, 5) * 82}px`);
  toast.style.zIndex = String(30 + stackIndex);
  els.dropToast.parentElement.appendChild(toast);

  els.dropToast.classList.add('hidden');
  const timer = setTimeout(()=>{ toast.remove(); }, 3200);
  state.dropToastQueueTimers.push(timer);
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
  state.xpNext = 1000;
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
// ver0.1.3: disable old stacked v94 menu/debug tap binding; clean patch below owns UI events.
// setTimeout(v94InstallTouchControls, 0);


window.addEventListener("load",()=>{ state.mobileMuted = true; updateMuteButton(); applyVolume(); stopAllAudioForMute(); });
window.addEventListener("pageshow",()=>{ if(state.mobileMuted) stopAllAudioForMute(); });
window.addEventListener("focus",()=>{ if(state.mobileMuted) stopAllAudioForMute(); });


/* ver0.1.3 clean stabilization patch: single source, no stacked UI injection */
(function(){
  'use strict';
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  const byId = (id)=>document.getElementById(id);
  function safe(fn){ try{ return fn && fn(); }catch(e){ console.warn('[ver0.1.3]', e); return null; } }

  // --- version: one source only, no floating badge ---
  window.GAME_VERSION = BUILD;
  document.documentElement.dataset.buildVersion = BUILD;
  function syncVersion(){
    document.querySelectorAll('.build-version').forEach(el=>{ el.textContent = 'ver.' + BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ver.' + BUILD; });
    document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent = '進行デバッグログ ver.' + BUILD; });
    const fixed = byId('fixedBuildVersion');
    if(fixed) fixed.remove();
  }

  // --- dark equipment canonical definitions ---
  function legendary(){ return (typeof rarities !== 'undefined' && rarities.find(r=>r.id==='legendary')) || {id:'legendary', name:'レジェンダリー', mult:3.2, color:'#ffad31'}; }
  function lv(v){ return (typeof darkEquipLevelFromSource === 'function') ? darkEquipLevelFromSource(v) : Math.max(1, Math.floor(v || (window.state && state.level) || 1)); }
  function baseItem(slot, name, levelOverride){
    const r = legendary();
    const n = lv(levelOverride);
    let it;
    if(typeof makeItem === 'function') it = makeItem(slot, r, {levelOverride:n});
    else it = {id:'dark_'+Date.now()+'_'+Math.random().toString(36).slice(2), slot, level:(typeof rollDropPlusByEnemyLevel==='function'?rollDropPlusByEnemyLevel(n):0), itemLevel:n};
    it.name = name;
    it.slot = slot;
    it.rarity = 'legendary';
    it.rarityName = 'レジェンダリー';
    it.specialFrame = 'darkholy';
    it.itemLevel = n;
    if(typeof applyDropPlusToItem === 'function'){ it.__dropPlusApplied = false; applyDropPlusToItem(it, n); }
    return it;
  }
  window.makeDarkArmor = makeDarkArmor = function(levelOverride){
    const n=lv(levelOverride), it=baseItem('鎧','闇の鎧',n);
    it.def=Math.floor(26+n*7); it.hp=Math.floor(190+n*22); it.fireRes=(it.fireRes||0)+0.10; it.darkArmor=true;
    it.flavor='火軽減10%。火被ダメージ回復70%。';
    if(typeof applyDropPlusToItem === 'function'){ it.__dropPlusApplied=false; applyDropPlusToItem(it,n); }
    return it;
  };
  window.makeDarkGauntlets = makeDarkGauntlets = function(levelOverride){
    const n=lv(levelOverride), it=baseItem('腕','闇の籠手',n);
    it.atk=Math.floor(22+n*6); it.def=Math.floor(10+n*3); it.darkGauntlets=true;
    it.flavor='暗黒の力を宿す籠手。暗黒出血と剣舞を支える。';
    if(typeof applyDropPlusToItem === 'function'){ it.__dropPlusApplied=false; applyDropPlusToItem(it,n); }
    return it;
  };
  window.makeDarkHelm = makeDarkHelm = function(levelOverride){
    const n=lv(levelOverride), it=baseItem('兜','闇の兜',n);
    it.def=Math.floor(18+n*5); it.hp=Math.floor(110+n*15); it.darkHelm=true;
    it.flavor='暗黒の力を宿す兜。神秘と詠唱を強める。';
    if(typeof applyDropPlusToItem === 'function'){ it.__dropPlusApplied=false; applyDropPlusToItem(it,n); }
    return it;
  };
  window.makeDarkBoots = makeDarkBoots = function(levelOverride){
    const n=lv(levelOverride), it=baseItem('足','暗黒の靴',n);
    it.def=Math.floor(14+n*4); it.hp=Math.floor(85+n*12); it.darkBoots=true;
    it.flavor='暗黒の力を宿す靴。火被ダメージ回復50%。';
    if(typeof applyDropPlusToItem === 'function'){ it.__dropPlusApplied=false; applyDropPlusToItem(it,n); }
    return it;
  };
  function makeDarkByName(name){
    const n=(state && (state.darkSwordSaintLevel || state.level)) || 1;
    if(name==='闇の聖剣' && typeof makeDarkHolySword==='function') return makeDarkHolySword(n);
    if(name==='闇の盾' && typeof makeDarkShield==='function') return makeDarkShield(n);
    if(name==='闇のアミュレット' && typeof makeDarkAmulet==='function') return makeDarkAmulet(n);
    if(name==='闇の鎧') return makeDarkArmor(n);
    if(name==='闇の籠手') return makeDarkGauntlets(n);
    if(name==='闇の兜') return makeDarkHelm(n);
    if(name==='暗黒の靴') return makeDarkBoots(n);
    return null;
  }
  const DARK_NAMES = ['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴'];

  // --- debug menu: reconstruct once, remove duplicates ---
  function cleanDebugPanel(){
    const panel = byId('debugPanel'); if(!panel) return;
    panel.innerHTML = `
      <div class="debug-head">デバッグ</div>
      <button id="debugAddChests" type="button">装備+50</button>
      <button id="debugResetData" type="button">ユーザーデータリセット</button>
      <button id="debugDarkSwordSaint" type="button">暗黒剣聖を次の敵にセット</button>
      <div class="debug-subhead">次のボスを指定</div>
      <div id="debugBossButtons" class="debug-grid"></div>
      <button id="debugGrantDarkSet" type="button">闇装備7種セット付与</button>
      <div id="debugGrantDarkItems" class="debug-grid"></div>
      <button id="debugHp0Kill" type="button">HP0即撃破</button>
      <button id="debugForceDefeated" type="button">dead/defeated即確定</button>
      <button id="debugClearBleed" type="button">出血・暗黒出血解除</button>
      <button id="debugStopDot" type="button">DOTタイマー停止</button>
      <button id="debugStopDarkDance" type="button">暗黒剣舞タイマー停止</button>
      <div id="mbhTraceBox" class="debug-trace-box">
        <div class="debug-trace-title">進行デバッグログ ver.${BUILD}</div>
        <button id="mbhTraceMark" type="button">現在状態を記録</button>
        <button id="mbhTraceCopy" type="button">ログコピー</button>
        <button id="mbhTraceDownload" type="button">DL</button>
        <button id="mbhTraceClear" type="button">消去</button>
        <pre id="mbhTraceOut" class="debug-trace-output"></pre>
      </div>
      <label><input id="debugShowEnemyStats" type="checkbox"> 敵ATK/DEF表示</label>
      <label><input id="debugKillEnemy" type="checkbox"> 敵への攻撃で即死</label>
      <label><input id="debugKillHero" type="checkbox"> 敵からの攻撃で即死</label>
      <div class="debug-version">Build: ver.${BUILD}</div>
      <button id="debugClose" type="button">閉じる</button>`;
    const grid = byId('debugGrantDarkItems');
    if(grid){
      grid.innerHTML = DARK_NAMES.map(n=>`<button type="button" data-dark-grant="${n}">${n}</button>`).join('');
    }
    const bossGrid = byId('debugBossButtons');
    if(bossGrid){
      const bossList = [
        ['slime_king','スライムキング'], ['orc','オーク'], ['dragon','ドラゴン'], ['fire_king','火の精霊王']
      ];
      bossGrid.innerHTML = bossList.map(([id,name])=>`<button type="button" data-boss-next="${id}">${name}</button>`).join('');
    }
  }

  function grantDark(name){
    const it = makeDarkByName(name); if(!it) return;
    state.inventory.unshift(it);
    if(typeof log === 'function') log('デバッグ：'+name+'を倉庫に追加。','drop');
    safe(()=>renderAll()); safe(()=>scheduleSave());
  }
  function grantDarkSet(){ DARK_NAMES.slice().reverse().forEach(n=>{ const it=makeDarkByName(n); if(it) state.inventory.unshift(it); }); if(typeof log==='function') log('デバッグ：闇装備7種を倉庫に追加。','drop'); safe(()=>renderAll()); safe(()=>scheduleSave()); }
  function forceNextDarkSaint(){ state.forceNextDarkSwordSaint = true; state.debugForcedBossNext = null; if(typeof log==='function') log('デバッグ：暗黒剣聖を次の敵にセット。','system'); safe(()=>scheduleSave()); }
  function forceNextBoss(id){
    const boss = (typeof ENEMIES !== 'undefined' ? ENEMIES : []).find(e=>e && e.id===id);
    if(!boss){ if(typeof log==='function') log('デバッグ：ボス指定に失敗。','danger'); return; }
    const lv = Math.max(1, Math.floor(Number(state.enemy?.level || state.enemyLevelBase || state.level || 1)));
    state.debugForcedBossNext = {id:boss.id, level:lv, debug:true};
    state.pendingBossForNext = null;
    state.forceNextDarkSwordSaint = false;
    if(typeof log==='function') log(`デバッグ：${boss.name}Lv.${lv}を次の敵にセット。`, 'system');
    safe(()=>scheduleSave());
  }
  function clearDots(){
    if(state.heroStatuses){ state.heroStatuses.bleed=[]; state.heroStatuses.darkBleed=[]; state.heroStatuses.burnUntil=0; }
    if(state.enemyStatuses){ state.enemyStatuses.bleed=[]; state.enemyStatuses.darkBleed=[]; state.enemyStatuses.burnUntil=0; }
    safe(()=>renderStatusLists()); if(typeof log==='function') log('デバッグ：出血・暗黒出血を解除。','system');
  }
  function stopDarkDanceTimers(){
    ['darkSwordReviveTimer','deathDanceCutinTimer','defeatCountdownTimer'].forEach(k=>{ if(state[k]){ clearTimeout(state[k]); clearInterval(state[k]); state[k]=null; } });
    ['darkSwordComboTimers','deathDanceSeqTimers','dropToastQueueTimers'].forEach(k=>{ (state[k]||[]).forEach(t=>{clearTimeout(t); clearInterval(t);}); state[k]=[]; });
    state.darkSwordCutinActive=false; state.deathDanceCutin=false; safe(()=>hideDeathDanceCutin()); if(typeof log==='function') log('デバッグ：暗黒剣舞タイマーを停止。','system');
  }

  function bindCleanDebug(){
    // ver0.1.3: debug panel must be idempotent. Clone once to remove stacked click/pointer handlers.
    let panel = byId('debugPanel');
    if(panel){
      const fresh = panel.cloneNode(false);
      fresh.id = 'debugPanel';
      fresh.className = panel.className;
      panel.parentNode.replaceChild(fresh, panel);
    }
    cleanDebugPanel();
    panel = byId('debugPanel');
    const once = (fn)=>{ let lock=false; return (e)=>{ e.preventDefault(); e.stopPropagation(); if(lock) return false; lock=true; try{ safe(fn); } finally { setTimeout(()=>{lock=false;}, 180); } return false; }; };
    const bindBtn = (id, fn)=>{ const b=byId(id); if(b) b.onclick=once(fn); };
    bindBtn('debugAddChests', ()=>{ for(let i=0;i<50;i++) state.inventory.unshift(makeRandomItem()); safe(()=>renderAll()); safe(()=>scheduleSave()); log('デバッグ：装備を50個追加。','drop'); });
    bindBtn('debugResetData', ()=>resetUserData());
    bindBtn('debugDarkSwordSaint', forceNextDarkSaint);
    bindBtn('debugGrantDarkSet', grantDarkSet);
    bindBtn('debugHp0Kill', ()=>{ if(state.enemy){ state.enemyHp=0; state.enemy.dead=true; state.enemy.defeated=true; safe(()=>enemyDefeated()); } });
    bindBtn('debugForceDefeated', ()=>{ if(state.enemy){ state.enemyHp=0; state.enemy.dead=true; state.enemy.defeated=true; } safe(()=>enemyDefeated()); });
    bindBtn('debugClearBleed', clearDots);
    bindBtn('debugStopDot', clearDots);
    bindBtn('debugStopDarkDance', stopDarkDanceTimers);
    const showEnemyStatsBox = byId('debugShowEnemyStats'); if(showEnemyStatsBox) showEnemyStatsBox.checked = !!(state.debug && state.debug.showEnemyStats);
    bindBtn('debugClose', ()=>{ if(panel) panel.classList.add('hidden'); });
    if(panel){
      let darkGrantLock = false;
      panel.addEventListener('click', (e)=>{
        const b=e.target.closest('[data-dark-grant]'); if(!b) return;
        e.preventDefault(); e.stopPropagation();
        if(darkGrantLock) return false;
        darkGrantLock = true;
        grantDark(b.dataset.darkGrant);
        setTimeout(()=>{ darkGrantLock=false; }, 180);
        return false;
      }, {capture:true});
      let bossNextLock = false;
      panel.addEventListener('click', (e)=>{
        const b=e.target.closest('[data-boss-next]'); if(!b) return;
        e.preventDefault(); e.stopPropagation();
        if(bossNextLock) return false;
        bossNextLock = true;
        forceNextBoss(b.dataset.bossNext);
        setTimeout(()=>{ bossNextLock=false; }, 180);
        return false;
      }, {capture:true});
      panel.addEventListener('change', (e)=>{ if(e.target && e.target.id==='debugShowEnemyStats'){ state.debug.showEnemyStats = !!e.target.checked; safe(()=>renderBattle()); } if(e.target && e.target.id==='debugKillEnemy') state.debug.killEnemy = !!e.target.checked; if(e.target && e.target.id==='debugKillHero') state.debug.killHero = !!e.target.checked; });
    }
  }

  // --- debug trace copy/download ---
  function traceSnapshot(reason){
    const enemy = state.enemy || {};
    return {
      t:new Date().toISOString(), reason:reason||'mark', build:BUILD,
      enemy:{name:enemy.name,id:enemy.id,hp:state.enemyHp,maxHp:enemy.maxHp,dead:enemy.dead,defeated:enemy.defeated,level:enemy.level},
      hero:{hp:state.hp,down:state.down,deathDance:state.deathDance,deathDanceBattleCount:state.deathDanceBattleCount},
      flags:{defeatSequence:state.defeatSequence,darkSwordCutinActive:state.darkSwordCutinActive,forceNextDarkSwordSaint:state.forceNextDarkSwordSaint},
      heroStatuses:state.heroStatuses, enemyStatuses:state.enemyStatuses
    };
  }
  function traceText(){
    try{ return JSON.stringify((window.__mbhTraceLog||[]).concat([traceSnapshot('copy')]), null, 2); }catch(e){ return String(e); }
  }
  window.__mbhTraceLog = window.__mbhTraceLog || [];
  window.mbhTraceMark = function(reason){ window.__mbhTraceLog.push(traceSnapshot(reason)); const out=byId('mbhTraceOut'); if(out) out.textContent=traceText(); };
  window.mbhCopyTrace = async function(){
    const text=traceText();
    const out=byId('mbhTraceOut'); if(out) out.textContent=text;
    try{ await navigator.clipboard.writeText(text); if(typeof log==='function') log('デバッグログをコピーしました。','system'); }
    catch(e){
      let ta=byId('mbhTraceManualCopy');
      if(!ta){ ta=document.createElement('textarea'); ta.id='mbhTraceManualCopy'; ta.style.cssText='width:100%;height:120px;margin-top:6px;'; byId('mbhTraceBox')?.appendChild(ta); }
      ta.value=text; ta.focus(); ta.select();
      try{ document.execCommand('copy'); }catch(_){}
    }
  };
  window.mbhDownloadTrace = function(){
    const text=traceText();
    const blob=new Blob([text],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='mbh-debug-trace-ver'+BUILD+'.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  };
  function bindTrace(){
    const bind=(id,fn)=>{ const b=byId(id); if(b) b.onclick=(e)=>{e.preventDefault(); e.stopPropagation(); fn(); return false;}; };
    bind('mbhTraceMark',()=>window.mbhTraceMark('manual'));
    bind('mbhTraceCopy',window.mbhCopyTrace);
    bind('mbhTraceDownload',window.mbhDownloadTrace);
    bind('mbhTraceClear',()=>{ window.__mbhTraceLog=[]; const out=byId('mbhTraceOut'); if(out) out.textContent=''; });
  }

  // --- log filter canonical override ---
  function classifyLog(l){
    const c=(l.cls||'').toLowerCase(); const m=String(l.msg||'');
    if(c.includes('drop') || /装備ドロップ|倉庫に追加|付与|獲得/.test(m)) return 'drop';
    if(c.includes('damage') || /ダメージ|攻撃|斬|雷撃|炎/.test(m)) return 'damage';
    if(c.includes('system') || c.includes('good') || c.includes('danger') || /出現|撃破|回復|経験値|デバッグ|解除|セット|リセット/.test(m)) return 'system';
    return 'system';
  }
  function renderLogFiltered(){
    const el=byId('log'); if(!el) return;
    const f=state.logFilter || 'all';
    const rows=(state.log||[]).filter(l=>f==='all' || classifyLog(l)===f);
    el.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time}] ${l.msg}</div>`).join('');
    document.querySelectorAll('#logFilterBar button').forEach(b=>b.classList.toggle('active',(b.dataset.logFilter||'all')===f));
  }
  function installLogFilter(){
    state.logFilter = state.logFilter || 'all';
    const bar=byId('logFilterBar'); if(!bar) return;
    bar.innerHTML='<button type="button" data-log-filter="all">すべて</button><button type="button" data-log-filter="damage">ダメージ</button><button type="button" data-log-filter="system">システム</button><button type="button" data-log-filter="drop">ドロップ</button>';
    bar.onclick=(e)=>{ const b=e.target.closest('button[data-log-filter]'); if(!b) return; e.preventDefault(); state.logFilter=b.dataset.logFilter||'all'; renderLogFiltered(); };
    renderLogFiltered();
  }
  const oldLog = (typeof log === 'function') ? log : null;
  if(oldLog){
    log = function(msg, cls='', html=false){
      const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
      const safeMsg = html ? msg : (typeof escapeHtml==='function' ? escapeHtml(msg) : String(msg).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])));
      state.log.unshift({time,msg:safeMsg,cls,html:true});
      state.log=state.log.slice(0,100);
      renderLogFiltered();
    };
  }

  // --- menu stable behavior ---
  function isOverlayMenu(){ return window.matchMedia('(max-width: 1279px), (max-height: 700px), (pointer: coarse)').matches; }
  function applyMenuState(){
    const side=document.querySelector('.side-panel'); const btn=byId('equipToggleBtn'); if(!side) return;
    if(isOverlayMenu()){
      side.classList.toggle('open', !!state.uiOpen);
      side.style.pointerEvents = state.uiOpen ? 'auto' : 'none';
      if(btn) btn.textContent = state.uiOpen ? '閉じる' : 'メニュー';
    }else{
      side.classList.add('open');
      side.style.pointerEvents = 'auto';
      if(btn) btn.textContent = 'メニュー';
    }
  }
  function setMenuPageClean(page){
    state.menuPage = page || state.menuPage || localStorage.getItem('mbh-last-menu-page') || 'stats';
    try{ localStorage.setItem('mbh-last-menu-page', state.menuPage); }catch(e){}
    if(typeof setMenuPage==='function') safe(()=>setMenuPage(state.menuPage));
    document.querySelectorAll('.mobile-menu-tabs button').forEach(b=>b.classList.toggle('active', b.dataset.menuPage===state.menuPage));
  }
  function bindMenu(){
    state.menuPage = localStorage.getItem('mbh-last-menu-page') || state.menuPage || 'stats';
    const btn=byId('equipToggleBtn');
    if(btn) btn.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); state.uiOpen=!state.uiOpen; setMenuPageClean(state.menuPage); applyMenuState(); safe(()=>startAudio()); safe(()=>playUiClick()); return false; };
    document.querySelectorAll('.mobile-menu-tabs button').forEach(b=>{ b.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); setMenuPageClean(b.dataset.menuPage); return false; }; });
    window.addEventListener('resize', applyMenuState);
    applyMenuState(); setMenuPageClean(state.menuPage);
  }

  // --- PC: keep BGM on blur/hidden. Mobile remains normal safe behavior. ---
  function pcOnly(){ return !window.matchMedia('(pointer: coarse), (max-width: 760px)').matches; }
  function keepPcBgm(){ if(pcOnly() && !state.mobileMuted && state.audioUnlocked) safe(()=>playBgm()); }
  function installPcBgmKeep(){
    safe(()=>window.removeEventListener('blur', pauseBgmForPageHidden));
    safe(()=>document.removeEventListener('visibilitychange', handlePageVisibility));
    window.addEventListener('blur', ()=>setTimeout(keepPcBgm,50));
    document.addEventListener('visibilitychange', ()=>{ if(pcOnly()) setTimeout(keepPcBgm,50); else safe(()=>handlePageVisibility()); });
  }

  // --- tooltip wording ---
  function fixUpgradeWording(){ document.querySelectorAll('button').forEach(b=>{ if((b.textContent||'').trim()==='強化選択') b.textContent='強化ボタン'; }); }

  function boot(){
    if(window.__mbh9916Booted) return;
    window.__mbh9916Booted = true;
    safe(syncVersion);
    safe(bindCleanDebug);
    safe(bindTrace);
    safe(installLogFilter);
    safe(bindMenu);
    safe(installPcBgmKeep);
    safe(fixUpgradeWording);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else setTimeout(boot,0);
  window.addEventListener('load', boot, {once:true});
})();

/* ver.0.2.9: audio restore - use lexical state/audio functions, not window fallback */
(function(){
  'use strict';
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  const $=(id)=>document.getElementById(id);
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH0.1.3]', e); } }
  function setVersion(){
    window.GAME_VERSION=BUILD;
    document.documentElement.setAttribute('data-build-version', BUILD);
    document.querySelectorAll('[data-version],#versionText,.version-badge,.brand span').forEach(el=>{ if(el) el.textContent='ver.'+BUILD; });
    const dv=$('debugPanel')?.querySelector('.debug-version'); if(dv) dv.textContent='Build: ver.'+BUILD;
    const title=$('mbhTraceBox')?.querySelector('.debug-trace-title'); if(title) title.textContent='進行デバッグログ ver.'+BUILD;
  }
  function injectCss(){
    if($('mbh-9917-control-css')) return;
    const st=document.createElement('style'); st.id='mbh-9917-control-css';
    st.textContent=`
      .topbar{position:relative!important;z-index:9999!important;pointer-events:auto!important;}
      .topbar .controls,.topbar button,#equipToggleBtn,#debugBtn,#muteBtn{position:relative!important;z-index:10000!important;pointer-events:auto!important;touch-action:manipulation!important;user-select:none!important;}
      #debugPanel{z-index:10001!important;pointer-events:auto!important;}
      #debugPanel.hidden{display:none!important;}
      .side-panel:not(.open){pointer-events:none!important;}
      .side-panel.open{pointer-events:auto!important;}
    `;
    document.head.appendChild(st);
  }
  function stopEvent(e){ if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); } }
  function bindOneTap(el, fn){
    if(!el) return;
    const fresh=el.cloneNode(true);
    el.parentNode.replaceChild(fresh, el);
    let lock=0;
    const handler=(e)=>{
      stopEvent(e);
      const now=Date.now(); if(now-lock<220) return false; lock=now;
      safe(fn);
      return false;
    };
    fresh.addEventListener('pointerup', handler, {capture:true, passive:false});
    fresh.addEventListener('click', handler, {capture:true, passive:false});
    fresh.addEventListener('touchend', handler, {capture:true, passive:false});
    return fresh;
  }
  function isOverlay(){ return matchMedia('(max-width: 1279px), (max-height: 700px), (pointer: coarse)').matches; }
  function applyMenu(open){
    const side=document.querySelector('.side-panel'); const btn=$('equipToggleBtn');
    if(!side) return;
    if(isOverlay()){
      side.classList.toggle('open', !!open);
      side.style.display = open ? '' : 'none';
      side.style.pointerEvents = open ? 'auto' : 'none';
      if(typeof state !== 'undefined') state.uiOpen=!!open;
      if(btn) btn.textContent=open?'閉じる':'メニュー';
    }else{
      side.style.display='';
      side.classList.add('open');
      side.style.pointerEvents='auto';
      if(typeof state !== 'undefined') state.uiOpen=true;
      if(btn) btn.textContent='メニュー';
    }
  }
  function toggleMenu(){
    const side=document.querySelector('.side-panel');
    const open = !(side && side.classList.contains('open') && isOverlay());
    applyMenu(open);
    safe(()=>{ if(typeof startAudio==='function') startAudio(); });
    safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
  }
  function toggleDebug(){
    let panel=$('debugPanel');
    if(!panel) return;
    panel.classList.toggle('hidden');
    panel.style.pointerEvents='auto';
    safe(()=>{ if(typeof startAudio==='function') startAudio(); });
    safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
  }
  function toggleMute(){
    safe(()=>{
      // top-level state / setMobileMuted are lexical globals in this same script.
      // window.state is undefined, so the old fallback only changed the icon and left the game muted.
      if(typeof state !== 'undefined' && typeof setMobileMuted === 'function'){
        setMobileMuted(!state.mobileMuted);
        if(!state.mobileMuted && typeof startAudio === 'function') startAudio();
      }else{
        const b=$('muteBtn');
        const pressed = b && b.getAttribute('aria-pressed') === 'true';
        if(b){ b.setAttribute('aria-pressed', pressed ? 'false' : 'true'); b.textContent = pressed ? '🔊' : '🔇'; }
      }
      if(typeof playUiClick === 'function') playUiClick();
    });
  }
  function bindTopControls(){
    injectCss(); setVersion();
    bindOneTap($('equipToggleBtn'), toggleMenu);
    bindOneTap($('debugBtn'), toggleDebug);
    bindOneTap($('muteBtn'), toggleMute);
    bindOneTap($('debugClose'), ()=>{ const p=$('debugPanel'); if(p) p.classList.add('hidden'); });
    applyMenu(typeof state !== 'undefined' ? !!state.uiOpen : false);
  }
  function boot(){ setTimeout(bindTopControls, 80); setTimeout(bindTopControls, 600); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', boot, {once:true});
  window.addEventListener('resize', ()=>safe(()=>applyMenu(typeof state !== 'undefined' ? !!state.uiOpen : false)));


  /* ver.0.2.9: mute icon sync fix
     bindOneTap() clones top buttons, so els.muteBtn can point to a removed old node.
     Always sync els.muteBtn to the current DOM button before updating the icon. */
  const __mbhOriginalUpdateMuteButton = updateMuteButton;
  updateMuteButton = function(){
    const btn = document.getElementById('muteBtn');
    if(btn) els.muteBtn = btn;
    if(!els.muteBtn) return;
    els.muteBtn.style.display = 'inline-flex';
    els.muteBtn.textContent = state.mobileMuted ? '🔇' : '🔊';
    els.muteBtn.title = state.mobileMuted ? 'ミュート中' : '音ON';
    els.muteBtn.setAttribute('aria-pressed', state.mobileMuted ? 'true' : 'false');
    els.muteBtn.dataset.muted = state.mobileMuted ? '1' : '0';
    if(els.audioHint) els.audioHint.classList.add('hidden');
  };
  const __mbhOriginalSetMobileMuted = setMobileMuted;
  setMobileMuted = function(flag){
    __mbhOriginalSetMobileMuted(!!flag);
    updateMuteButton();
    setTimeout(updateMuteButton, 0);
    setTimeout(updateMuteButton, 120);
  };
  setTimeout(updateMuteButton, 0);
  setTimeout(updateMuteButton, 500);



  /* ver.0.2.9: UI-only patch
     - hide EXP/flee behind overlay menu
     - revive inventory filters
     - keep inventory/log inside viewport with unified scrollbars
  */
  function mbh9920Safe(fn){ try{return fn();}catch(e){ console.error('[MBH0.1.3]', e); } }
  function mbh9920IsOverlay(){
    return matchMedia('(max-width: 1279px), (max-height: 700px), (pointer: coarse)').matches;
  }
  function mbh9920SyncMenuClass(){
    const side=document.querySelector('.side-panel');
    const open=!!(side && side.classList.contains('open') && mbh9920IsOverlay());
    document.body.classList.toggle('mbh-menu-overlay-open', open);
  }
  const mbh9920MenuObserverTarget = document.querySelector('.side-panel');
  if(mbh9920MenuObserverTarget){
    new MutationObserver(mbh9920SyncMenuClass).observe(mbh9920MenuObserverTarget,{attributes:true,attributeFilter:['class','style']});
  }
  window.addEventListener('resize', ()=>setTimeout(mbh9920SyncMenuClass, 0));
  setInterval(mbh9920SyncMenuClass, 700);
  setTimeout(mbh9920SyncMenuClass, 0);

  function mbh9920EnsureInventoryFilter(){
    const panel=document.querySelector('.inventory-panel');
    const inv=document.getElementById('inventory');
    if(!panel || !inv) return null;
    let bar=document.getElementById('inventoryFilterBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='inventoryFilterBar';
      bar.className='inventory-filter-bar';
      bar.innerHTML=[
        ['all','すべて'],['weapon','武器'],['armor','防具'],['accessory','装飾'],['dark','闇装備'],['legendary','レジェンド']
      ].map(([k,t])=>`<button type="button" data-inv-filter="${k}">${t}</button>`).join('');
      panel.insertBefore(bar, inv);
    }
    state.inventoryFilter = state.inventoryFilter || 'all';
    bar.querySelectorAll('button[data-inv-filter]').forEach(b=>{
      b.classList.toggle('active',(b.dataset.invFilter||'all')===state.inventoryFilter);
    });
    if(!bar.dataset.bound9920){
      bar.dataset.bound9920='1';
      const handler=(e)=>{
        const b=e.target.closest('button[data-inv-filter]');
        if(!b) return;
        e.preventDefault(); e.stopPropagation();
        state.inventoryFilter=b.dataset.invFilter||'all';
        renderInventory();
      };
      bar.addEventListener('click', handler, {passive:false});
      bar.addEventListener('pointerup', handler, {passive:false});
    }
    return bar;
  }
  function mbh9920InventoryMatch(it){
    const f=state.inventoryFilter || 'all';
    if(f==='all') return true;
    if(f==='dark') return !!(it && (it.specialFrame==='darkholy' || /^闇の|^暗黒/.test(it.name||'')));
    if(f==='legendary') return it && it.rarity==='legendary';
    if(f==='weapon') return it && ['剣','弓','杖','斧'].includes(it.slot);
    if(f==='armor') return it && ['盾','鎧','兜','籠手','靴'].includes(it.slot);
    if(f==='accessory') return it && ['リング','アミュレット'].includes(it.slot);
    return true;
  }
  const mbh9920OriginalRenderInventory = renderInventory;
  renderInventory = function(){
    const inv=document.getElementById('inventory');
    if(!inv){ return mbh9920OriginalRenderInventory(); }
    mbh9920EnsureInventoryFilter();
    inv.innerHTML='';
    const selectedId = state.inventoryMenuItemId;
    const items=(state.inventory||[]).filter(mbh9920InventoryMatch);
    if(items.length===0){
      const empty=document.createElement('div');
      empty.className='inventory-empty';
      empty.textContent='この条件の装備はありません';
      inv.appendChild(empty);
    }
    items.forEach(it=>{
      const div=document.createElement('div');
      div.className=`item ${it.rarity} ${itemFrameClass(it)}${selectedId===it.id?' selected-inventory':''}`;
      div.dataset.itemId = String(it.id);
      div.innerHTML=`<b style="color:${itemNameColor(it)}">${it.name}</b><span>${it.slot}</span>`;
      div.onpointerdown=(e)=>{ if(e.pointerType && e.pointerType !== 'mouse'){ setPointerMode('touch'); els.tooltip.classList.add('hidden'); } };
      const openItemMenu=(e)=>{ if(e){ e.preventDefault(); e.stopPropagation(); } els.tooltip.classList.add('hidden'); showInventoryActionMenu(it, div); };
      div.onclick=openItemMenu;
      div.onpointerup=(e)=>{ if(e.pointerType && e.pointerType !== 'mouse') openItemMenu(e); };
      div.ontouchend=openItemMenu;
      div.onpointerenter=(e)=>{
        if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); }
        else { setPointerMode('touch'); els.tooltip.classList.add('hidden'); }
      };
      div.onpointermove=(e)=>{
        if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); }
        else { setPointerMode('touch'); els.tooltip.classList.add('hidden'); }
      };
      div.onmousemove=(e)=>{ setPointerMode('mouse'); showTip(e,it); };
      div.onmouseleave=()=>{ if(state.inventoryMenuItemId!==it.id) els.tooltip.classList.add('hidden'); };
      inv.appendChild(div);
      if(selectedId===it.id) setTimeout(()=>showInventoryActionMenu(it, div), 0);
    });
    if(els.openAllBtn){ els.openAllBtn.style.display='none'; }
    updateSellButtonState();
    mbh9920EnsureInventoryFilter();
  };
  setTimeout(()=>mbh9920Safe(()=>{ mbh9920EnsureInventoryFilter(); renderInventory(); }), 300);

  // Ensure latest visible build number is single and clear.
  document.documentElement.setAttribute('data-build-version', (window.APP_VERSION || window.GAME_VERSION || '0.0'));
  document.querySelectorAll('.build-version').forEach(el=>{ el.textContent='ver.'+(window.APP_VERSION || window.GAME_VERSION || '0.0'); });
  document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+(window.APP_VERSION || window.GAME_VERSION || '0.0'); });

  // PCでは非アクティブ時もBGMを止めない。スマホだけ従来どおり停止。
  window.__mbhPcKeepBgm = true;
})();


/* ver.0.2.9: inventory filter and log viewport final fix */
(function(){
  'use strict';
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  const $=(id)=>document.getElementById(id);
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH0.1.3]', e); } }
  function setVersion(){
    window.GAME_VERSION=BUILD;
    document.documentElement.setAttribute('data-build-version', BUILD);
    document.querySelectorAll('.build-version').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    const title=$('mbhTraceBox')?.querySelector('.debug-trace-title'); if(title) title.textContent='進行デバッグログ ver.'+BUILD;
  }
  function normalizeSlot(slot){
    const s=String(slot||'');
    if(s==='武器' || /剣|弓|杖|斧|槍|短剣|刀|銃|矢|ボルト/.test(s)) return 'weapon';
    if(['盾','兜','鎧','腕','足','籠手','靴','頭','胴','手'].includes(s) || /盾|兜|鎧|腕|籠手|靴|ブーツ|足|ヘルム|アーマー|ガントレット/.test(s)) return 'armor';
    if(['リング','アミュレット','指輪','護符'].includes(s) || /リング|アミュレット|指輪|護符/.test(s)) return 'accessory';
    return 'other';
  }
  function isDarkItem(it){ return !!(it && (it.specialFrame==='darkholy' || it.dark || /^闇の|^暗黒/.test(String(it.name||'')))); }
  function inventoryMatch9922(it){
    const f=(state && state.inventoryFilter) || 'all';
    if(f==='all') return true;
    if(f==='weapon') return normalizeSlot(it?.slot)==='weapon';
    if(f==='armor') return normalizeSlot(it?.slot)==='armor';
    if(f==='accessory') return normalizeSlot(it?.slot)==='accessory';
    if(f==='dark') return isDarkItem(it);
    return true;
  }
  function ensureInventoryFilter9922(){
    const panel=document.querySelector('.inventory-panel');
    const inv=$('inventory');
    if(!panel || !inv) return;
    let bar=$('inventoryFilterBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='inventoryFilterBar';
      bar.className='inventory-filter-bar';
      panel.insertBefore(bar, inv);
    }
    // レジェンドタブは不要なので完全に消す
    bar.innerHTML=[
      ['all','すべて'],['weapon','武器'],['armor','防具'],['accessory','装飾'],['dark','闇装備']
    ].map(([k,t])=>`<button type="button" data-inv-filter="${k}">${t}</button>`).join('');
    if(!['all','weapon','armor','accessory','dark'].includes(state.inventoryFilter)) state.inventoryFilter='all';
    bar.querySelectorAll('button[data-inv-filter]').forEach(b=>{
      b.classList.toggle('active',(b.dataset.invFilter||'all')===state.inventoryFilter);
      b.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); state.inventoryFilter=b.dataset.invFilter||'all'; safe(()=>renderInventory()); return false; };
      b.onpointerup=(e)=>{ e.preventDefault(); e.stopPropagation(); b.click(); return false; };
    });
  }
  function installInventoryRender9922(){
    if(window.__mbhInventoryRender9922) return;
    window.__mbhInventoryRender9922=true;
    renderInventory=function(){
      const inv=$('inventory'); if(!inv) return;
      ensureInventoryFilter9922();
      inv.innerHTML='';
      const selectedId=state.inventoryMenuItemId;
      const items=(state.inventory||[]).filter(inventoryMatch9922);
      if(items.length===0){
        const empty=document.createElement('div');
        empty.className='inventory-empty';
        empty.textContent='この条件の装備はありません';
        inv.appendChild(empty);
      }
      items.forEach(it=>{
        const div=document.createElement('div');
        div.className=`item ${it.rarity} ${itemFrameClass(it)}${selectedId===it.id?' selected-inventory':''}`;
        div.dataset.itemId=String(it.id);
        div.innerHTML=`<b style="color:${itemNameColor(it)}">${it.name}</b><span>${it.slot}</span>`;
        div.onpointerdown=(e)=>{ if(e.pointerType && e.pointerType!=='mouse'){ setPointerMode('touch'); els.tooltip.classList.add('hidden'); } };
        const openItemMenu=(e)=>{ if(e){ e.preventDefault(); e.stopPropagation(); } els.tooltip.classList.add('hidden'); showInventoryActionMenu(it, div); };
        div.onclick=openItemMenu;
        div.onpointerup=(e)=>{ if(e.pointerType && e.pointerType!=='mouse') openItemMenu(e); };
        div.ontouchend=openItemMenu;
        div.onpointerenter=(e)=>{ if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); } else { setPointerMode('touch'); els.tooltip.classList.add('hidden'); } };
        div.onpointermove=(e)=>{ if(isMouseLikePointer(e)){ setPointerMode('mouse'); showTip(e,it); } else { setPointerMode('touch'); els.tooltip.classList.add('hidden'); } };
        div.onmousemove=(e)=>{ setPointerMode('mouse'); showTip(e,it); };
        div.onmouseleave=()=>{ if(state.inventoryMenuItemId!==it.id) els.tooltip.classList.add('hidden'); };
        inv.appendChild(div);
        if(selectedId===it.id) setTimeout(()=>showInventoryActionMenu(it, div),0);
      });
      if(els.openAllBtn) els.openAllBtn.style.display='none';
      updateSellButtonState();
      ensureInventoryFilter9922();
      fitScrollablePanels9922();
    };
  }
  function classifyLog9922(l){
    const c=String(l.cls||'').toLowerCase(); const m=String(l.msg||'');
    if(c.includes('drop') || /装備ドロップ|倉庫に追加|付与|獲得|闇装備|レジェンダリー/.test(m)) return 'drop';
    if(c.includes('damage') || c.includes('skilllog') || /ダメージ|攻撃|斬|雷撃|炎斬り|連続攻撃|剣舞/.test(m)) return 'damage';
    return 'system';
  }
  function renderLogFiltered9922(){
    const el=$('log'); if(!el) return;
    const f=state.logFilter||'all';
    const rows=(state.log||[]).filter(l=>f==='all' || classifyLog9922(l)===f);
    el.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time}] ${l.msg}</div>`).join('');
    document.querySelectorAll('#logFilterBar button').forEach(b=>b.classList.toggle('active',(b.dataset.logFilter||'all')===f));
    // 新しいログが上に入る設計。フィルター変更時も先頭を見せる。
    el.scrollTop=0;
    fitScrollablePanels9922();
  }
  function installLogFilter9922(){
    const bar=$('logFilterBar'); if(!bar) return;
    state.logFilter=state.logFilter||'all';
    bar.innerHTML='<button type="button" data-log-filter="all">すべて</button><button type="button" data-log-filter="damage">ダメージ</button><button type="button" data-log-filter="system">システム</button><button type="button" data-log-filter="drop">ドロップ</button>';
    bar.querySelectorAll('button[data-log-filter]').forEach(b=>{
      b.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); state.logFilter=b.dataset.logFilter||'all'; renderLogFiltered9922(); return false; };
      b.onpointerup=(e)=>{ e.preventDefault(); e.stopPropagation(); b.click(); return false; };
    });
    if(!window.__mbhLogOverride9922 && typeof log==='function'){
      window.__mbhLogOverride9922=true;
      const escape=(s)=> typeof escapeHtml==='function' ? escapeHtml(s) : String(s).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      log=function(msg, cls='', html=false){
        const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
        const safeMsg=html ? msg : escape(msg);
        state.log.unshift({time,msg:safeMsg,cls,html:true});
        state.log=state.log.slice(0,160);
        renderLogFiltered9922();
      };
    }
    renderLogFiltered9922();
  }
  function fitScrollablePanels9922(){
    const side=document.querySelector('.side-panel');
    const invPanel=document.querySelector('.inventory-panel');
    const logPanel=document.querySelector('.log-panel');
    const inv=$('inventory');
    const logEl=$('log');
    if(side){ side.style.overflow='hidden'; }
    const fit=(panel, body, min=80)=>{
      if(!panel || !body) return;
      const pr=panel.getBoundingClientRect();
      const br=body.getBoundingClientRect();
      const bottomPad=18;
      const available=Math.max(min, window.innerHeight - br.top - bottomPad);
      // パネル外枠より内側で止める。下枠に食い込ませない。
      const inside=Math.max(min, pr.bottom - br.top - 14);
      body.style.maxHeight=Math.max(min, Math.min(available, inside))+'px';
      body.style.overflowY='auto';
      body.style.overflowX='hidden';
      body.style.paddingBottom='16px';
      body.style.boxSizing='border-box';
    };
    fit(invPanel, inv, 100);
    fit(logPanel, logEl, 90);
  }
  function boot(){
    setVersion();
    installInventoryRender9922();
    ensureInventoryFilter9922();
    installLogFilter9922();
    safe(()=>renderInventory());
    fitScrollablePanels9922();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else setTimeout(boot,0);
  window.addEventListener('load', boot, {once:true});
  window.addEventListener('resize', ()=>setTimeout(fitScrollablePanels9922,0));
  setTimeout(boot,250);
  setTimeout(fitScrollablePanels9922,800);
})();

/* ver.0.2.9: mobile tap recovery only. PC mouse behavior is untouched. */
(function(){
  'use strict';
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  const isMobileTapEnv = () => {
    try { return window.matchMedia('(pointer: coarse), (max-width: 760px)').matches; }
    catch(_) { return window.innerWidth <= 760; }
  };
  function syncBuild(){
    document.documentElement.setAttribute('data-build-version', BUILD);
    window.GAME_VERSION = BUILD;
    document.querySelectorAll('.build-version').forEach(el => { el.textContent = 'ver.' + BUILD; });
    document.querySelectorAll('.debug-version').forEach(el => { el.textContent = 'Build: ver.' + BUILD; });
    document.querySelectorAll('.debug-trace-title').forEach(el => { el.textContent = '進行デバッグログ ver.' + BUILD; });
  }
  function injectMobileCss(){
    if(document.getElementById('mbh-9926-mobile-tap-css')) return;
    const st = document.createElement('style');
    st.id = 'mbh-9926-mobile-tap-css';
    st.textContent = `
      @media (pointer: coarse), (max-width: 760px){
        .topbar, .topbar .controls, .topbar button,
        .side-panel.open, .side-panel.open * ,
        #debugPanel:not(.hidden), #debugPanel:not(.hidden) *{
          pointer-events:auto!important;
          touch-action:manipulation!important;
        }
        .side-panel:not(.open){ pointer-events:none!important; }
        .battle-panel{ pointer-events:auto!important; }
        button, input, label, .item, .equip-slot, .status-pill, [data-menu-page], [data-log-filter], [data-inv-filter]{
          touch-action:manipulation!important;
          -webkit-tap-highlight-color:rgba(255,210,75,.28);
        }
      }
    `;
    document.head.appendChild(st);
  }
  function closestActionTarget(start){
    if(!start || !start.closest) return null;
    return start.closest('button, input[type="checkbox"], input[type="button"], input[type="submit"], label, .item, .equip-slot, .status-pill, [role="button"], [data-menu-page], [data-log-filter], [data-inv-filter], #muteBtn, #debugBtn, #equipToggleBtn');
  }
  let lastTapAt = 0;
  let lastTapEl = null;
  function runMobileTap(e){
    if(!isMobileTapEnv()) return;
    if(e.type === 'pointerup' && e.pointerType === 'mouse') return;
    const el = closestActionTarget(e.target);
    if(!el) return;
    // Safariでrange操作を壊さない
    if(el.matches && el.matches('input[type="range"]')) return;
    const now = Date.now();
    if(lastTapEl === el && now - lastTapAt < 260){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      return;
    }
    lastTapEl = el;
    lastTapAt = now;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    try { if(typeof startAudio === 'function') startAudio(); } catch(_) {}
    setTimeout(() => {
      try {
        // 既存のPC用click/onchange処理をそのまま使う。スマホだけ疑似クリックを通す。
        if(el.tagName === 'LABEL'){
          const input = el.querySelector('input');
          if(input) input.click(); else el.click();
        }else{
          el.click();
        }
      } catch(err) {
        console.warn('[MBH0.1.3 mobile tap]', err);
      }
    }, 0);
  }
  function boot(){
    syncBuild();
    injectMobileCss();
    if(window.__mbh9926MobileTapRecovery) return;
    window.__mbh9926MobileTapRecovery = true;
    // document captureで先に拾う。既存の二重click/pointer処理はPC側へ残す。
    document.addEventListener('touchend', runMobileTap, {capture:true, passive:false});
    document.addEventListener('pointerup', runMobileTap, {capture:true, passive:false});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('load', boot, {once:true});
})();

/* ver.0.2.9: mobile equipment tap + mobile background audio pause only */
(function(){
  'use strict';
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  const $=(id)=>document.getElementById(id);
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH0.1.3]', e); } }
  function isMobileLike(){
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse), (max-width: 760px)').matches) || ('ontouchstart' in window) || ((navigator.maxTouchPoints||0)>0);
  }
  function syncVersion9927(){
    window.GAME_VERSION=BUILD;
    document.documentElement.setAttribute('data-build-version', BUILD);
    document.querySelectorAll('[data-version],#versionText,.version-badge,.build-version').forEach(el=>{ if(el) el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ if(el) el.textContent='Build: ver.'+BUILD; });
    const traceTitle=$('mbhTraceBox')?.querySelector('.debug-trace-title');
    if(traceTitle) traceTitle.textContent='進行デバッグログ ver.'+BUILD;
  }

  function installMobileEquipTapRecover(){
    if(window.__mbh9927EquipTapRecover) return;
    window.__mbh9927EquipTapRecover=true;
    const css=document.createElement('style');
    css.id='mbh-9927-mobile-equip-tap-css';
    css.textContent=`
      @media (pointer: coarse), (max-width: 760px){
        #inventory,.inventory-panel,#equipList,.equip-panel{pointer-events:auto!important;touch-action:manipulation!important;}
        #inventory .item,#equipList .equip{pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;}
        #inventoryActionMenu,.inventory-action-menu,.inventory-action-menu button{pointer-events:auto!important;touch-action:manipulation!important;}
      }
    `;
    document.head.appendChild(css);

    let lastItemTap=0;
    const openInventoryItem=(e)=>{
      if(!isMobileLike()) return;
      const itemEl=e.target && e.target.closest ? e.target.closest('#inventory .item') : null;
      if(!itemEl) return;
      const now=Date.now();
      if(now-lastItemTap<260){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); return false; }
      lastItemTap=now;
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      safe(()=>{ if(typeof setPointerMode==='function') setPointerMode('touch'); });
      safe(()=>{ if(els && els.tooltip) els.tooltip.classList.add('hidden'); });
      const id=itemEl.dataset ? itemEl.dataset.itemId : '';
      let it=null;
      if(typeof state!=='undefined' && Array.isArray(state.inventory)){
        it=state.inventory.find(x=>String(x && x.id)===String(id));
      }
      if(!it && typeof state!=='undefined' && Array.isArray(state.inventory)){
        const nodes=Array.from(document.querySelectorAll('#inventory .item'));
        const idx=nodes.indexOf(itemEl);
        if(idx>=0) it=state.inventory[idx];
      }
      if(it && typeof showInventoryActionMenu==='function') showInventoryActionMenu(it, itemEl);
      return false;
    };

    let lastEquipTap=0;
    const selectCurrentEquip=(e)=>{
      if(!isMobileLike()) return;
      const equipEl=e.target && e.target.closest ? e.target.closest('#equipList .equip') : null;
      if(!equipEl) return;
      const now=Date.now();
      if(now-lastEquipTap<260){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); return false; }
      lastEquipTap=now;
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      safe(()=>{ if(typeof setPointerMode==='function') setPointerMode('touch'); });
      const nodes=Array.from(document.querySelectorAll('#equipList .equip'));
      const idx=nodes.indexOf(equipEl);
      if(idx>=0 && typeof slots!=='undefined' && slots[idx] && typeof state!=='undefined'){
        state.selectedEquip=slots[idx];
        if(typeof renderEquip==='function') renderEquip();
      }
      return false;
    };

    ['touchend','pointerup','click'].forEach(type=>{
      document.addEventListener(type, openInventoryItem, {capture:true, passive:false});
      document.addEventListener(type, selectCurrentEquip, {capture:true, passive:false});
    });
  }

  function installMobileAudioPause(){
    if(window.__mbh9927MobileAudioPause) return;
    window.__mbh9927MobileAudioPause=true;
    function pauseMobileAudio(){
      if(!isMobileLike()) return;
      safe(()=>{ if(typeof pauseBgmForPageHidden==='function') pauseBgmForPageHidden(); });
      // 念のためHTML Audioを直接止める。PCでは実行しない。
      safe(()=>{
        if(typeof state==='undefined') return;
        state.bgmPausedByVisibility=true;
        [state.normalBgm,state.swordDanceBgm,state.darkSwordSaintBgm,state.darkSwordSaintVoice].forEach(a=>{ try{ if(a) a.pause(); }catch(e){} });
      });
    }
    function resumeMobileAudio(){
      if(!isMobileLike()) return;
      if(document.hidden) return;
      safe(()=>{ if(typeof resumeBgmForPageVisible==='function') resumeBgmForPageVisible(); });
    }
    document.addEventListener('visibilitychange', ()=>{ document.hidden ? pauseMobileAudio() : resumeMobileAudio(); }, {capture:true});
    window.addEventListener('pagehide', pauseMobileAudio, {capture:true});
    window.addEventListener('blur', pauseMobileAudio, {capture:true});
    window.addEventListener('pageshow', resumeMobileAudio, {capture:true});
    window.addEventListener('focus', resumeMobileAudio, {capture:true});
  }

  function boot9927(){
    safe(syncVersion9927);
    safe(installMobileEquipTapRecover);
    safe(installMobileAudioPause);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot9927, {once:true}); else boot9927();
  window.addEventListener('load', boot9927, {once:true});
})();


/* ver.0.2.9: enhancement removal + enemy-level drop plus finalizer */
(function(){
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH0.1.3]', e); } }
  safe(()=>{
    document.documentElement.setAttribute('data-build-version', BUILD);
    document.querySelectorAll('.build-version').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    document.querySelectorAll('.resources').forEach(el=>{ el.classList.add('hidden'); el.style.display='none'; });
    document.querySelectorAll('[data-menu-page="equip"]').forEach(el=>{ el.textContent='装備'; });
    const up=document.getElementById('upgradeBtn');
    if(up){ up.disabled=true; up.classList.add('hidden'); up.style.display='none'; up.textContent='強化システムは廃止されました'; }
    const h=document.querySelector('.equip-panel h2'); if(h) h.textContent='装備';
    const panel=document.querySelector('.equip-panel');
    if(panel && !document.getElementById('dropPlusHelp')){
      const p=document.createElement('p'); p.id='dropPlusHelp'; p.className='drop-plus-help'; p.textContent='装備はドロップ時に敵Lv依存の品質+値が付きます。高Lvほど品質の最低値・最大値が上がります。';
      const list=document.getElementById('equipList'); panel.insertBefore(p, list||panel.firstChild);
    }
  });
})();

/* ver.0.2.9: do not stop BGM on ordinary outside click/blur */
(function(){
  'use strict';
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH0.1.3]', e); } }
  function setVersion(){
    safe(()=>{ window.GAME_VERSION=BUILD; });
    safe(()=>document.documentElement.setAttribute('data-build-version', BUILD));
    safe(()=>document.querySelectorAll('.build-version').forEach(el=>{ el.textContent='ver.'+BUILD; }));
    safe(()=>document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; }));
  }
  const oldPause = (typeof pauseBgmForPageHidden === 'function') ? pauseBgmForPageHidden : null;
  const oldResume = (typeof resumeBgmForPageVisible === 'function') ? resumeBgmForPageVisible : null;
  let realPageHide = false;
  function isActuallyHidden(){
    return !!document.hidden || realPageHide;
  }
  function isTouchLike(){
    return (typeof isTouchDevice === 'function' && isTouchDevice()) || matchMedia('(pointer: coarse), (max-width: 760px)').matches;
  }
  function directPauseAudio(){
    safe(()=>{
      if(typeof state === 'undefined') return;
      state.bgmPausedByVisibility = true;
      [state.normalBgm,state.swordDanceBgm,state.darkSwordSaintBgm,state.darkSwordSaintVoice].forEach(a=>{ try{ if(a && !a.paused) a.pause(); }catch(e){} });
    });
  }
  function directResumeAudio(){
    safe(()=>{
      if(typeof state === 'undefined') return;
      if(state.mobileMuted || !state.audioUnlocked) return;
      state.bgmPausedByVisibility = false;
      if(typeof playBgm === 'function') playBgm();
    });
  }
  window.pauseBgmForPageHidden = function(){
    // 通常のクリック/フォーカス外れでは止めない。本当に非表示/ページ離脱の時だけ停止。
    if(!isActuallyHidden()) return;
    if(!isTouchLike()) return;
    if(oldPause) safe(()=>oldPause()); else directPauseAudio();
  };
  window.resumeBgmForPageVisible = function(){
    if(document.hidden) return;
    if(oldResume) safe(()=>oldResume()); else directResumeAudio();
  };
  function resumeIfAccidentalBlur(){
    // 古いパッチのblur処理が先に走って止めた場合の復旧。
    if(document.hidden || realPageHide) return;
    directResumeAudio();
  }
  function install(){
    setVersion();
    if(oldPause){
      safe(()=>window.removeEventListener('blur', oldPause));
      safe(()=>window.removeEventListener('pagehide', oldPause));
      safe(()=>document.removeEventListener('visibilitychange', oldPause));
    }
    if(oldResume){
      safe(()=>window.removeEventListener('focus', oldResume));
      safe(()=>window.removeEventListener('pageshow', oldResume));
    }
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden) window.pauseBgmForPageHidden();
      else window.resumeBgmForPageVisible();
    }, {capture:true});
    window.addEventListener('pagehide', ()=>{
      realPageHide = true;
      window.pauseBgmForPageHidden();
      setTimeout(()=>{ realPageHide=false; }, 1000);
    }, {capture:true});
    window.addEventListener('pageshow', ()=>{
      realPageHide = false;
      window.resumeBgmForPageVisible();
    }, {capture:true});
    window.addEventListener('blur', ()=>setTimeout(resumeIfAccidentalBlur, 80), {capture:false});
    window.addEventListener('focus', ()=>setTimeout(()=>window.resumeBgmForPageVisible(), 80), {capture:false});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install, {once:true}); else install();
  window.addEventListener('load', install, {once:true});
})();

/* ver.0.2.9: battle log scroll-position preserve + lower padding fix */
(function(){
  'use strict';
  const BUILD=(window.APP_VERSION || window.GAME_VERSION || '0.0');
  const $=(id)=>document.getElementById(id);
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH0.1.3]', e); } }
  function setVersion(){
    window.GAME_VERSION=BUILD;
    document.documentElement.setAttribute('data-build-version', BUILD);
    document.querySelectorAll('[data-version],#versionText,.version-badge,.brand span').forEach(el=>{ if(el) el.textContent='ver.'+BUILD; });
    const dv=$('debugPanel')?.querySelector('.debug-version'); if(dv) dv.textContent='Build: ver.'+BUILD;
  }
  function escapeLog(s){
    return (typeof escapeHtml==='function') ? escapeHtml(s) : String(s).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function classify(l){
    const c=String(l?.cls||'').toLowerCase();
    const m=String(l?.msg||'');
    if(c.includes('drop') || /装備ドロップ|倉庫に追加|付与|獲得|闇装備|レジェンダリー|品質/.test(m)) return 'drop';
    if(c.includes('damage') || c.includes('skilllog') || /ダメージ|攻撃|斬|雷撃|炎斬り|連続攻撃|剣舞|ブレス|火傷|出血|GUARD|無効|MISS/.test(m)) return 'damage';
    return 'system';
  }
  function currentRows(){
    const f=(typeof state!=='undefined' && state.logFilter) ? state.logFilter : 'all';
    const list=(typeof state!=='undefined' && Array.isArray(state.log)) ? state.log : [];
    return list.filter(l=>f==='all' || classify(l)===f);
  }
  function updateActiveFilter(){
    const f=(typeof state!=='undefined' && state.logFilter) ? state.logFilter : 'all';
    document.querySelectorAll('#logFilterBar button').forEach(b=>b.classList.toggle('active',(b.dataset.logFilter||'all')===f));
  }
  function renderLogPreserve(reason){
    const el=$('log'); if(!el || typeof state==='undefined') return;
    const beforeTop=el.scrollTop;
    const beforeHeight=el.scrollHeight;
    const nearTop=beforeTop<=4;
    const rows=currentRows();
    el.innerHTML=rows.map(l=>`<div class="${l.cls||''}">[${l.time}] ${l.msg}</div>`).join('');
    updateActiveFilter();
    requestAnimationFrame(()=>{
      const afterHeight=el.scrollHeight;
      if(reason==='filter'){
        el.scrollTop=0;
        return;
      }
      if(nearTop){
        el.scrollTop=0;
      }else{
        // 新ログは先頭に追加されるため、増えた高さ分だけ下げて読んでいる行を固定する。
        el.scrollTop=Math.max(0, beforeTop + (afterHeight - beforeHeight));
      }
    });
  }
  function installLog(){
    if(typeof state==='undefined') return;
    state.logFilter=state.logFilter||'all';
    const bar=$('logFilterBar');
    if(bar){
      bar.innerHTML='<button type="button" data-log-filter="all">すべて</button><button type="button" data-log-filter="damage">ダメージ</button><button type="button" data-log-filter="system">システム</button><button type="button" data-log-filter="drop">ドロップ</button>';
      bar.querySelectorAll('button[data-log-filter]').forEach(b=>{
        const on=(e)=>{ e.preventDefault(); e.stopPropagation(); state.logFilter=b.dataset.logFilter||'all'; renderLogPreserve('filter'); return false; };
        b.onclick=on;
        b.onpointerup=(e)=>{ if(e.pointerType && e.pointerType==='mouse') return; return on(e); };
        b.ontouchend=on;
      });
    }
    log=function(msg, cls='', html=false){
      const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
      const safeMsg=html ? msg : escapeLog(msg);
      state.log.unshift({time,msg:safeMsg,cls,html:true});
      state.log=state.log.slice(0,180);
      renderLogPreserve('append');
    };
    renderLogPreserve('filter');
  }
  function installCss(){
    if($('mbh-9947-log-css')) return;
    const st=document.createElement('style'); st.id='mbh-9947-log-css';
    st.textContent=`
      .log-panel .log,#log{
        padding-bottom:2.2em!important;
        scroll-padding-bottom:2.2em!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        box-sizing:border-box!important;
      }
      .log-panel{padding-bottom:.9em!important;}
    `;
    document.head.appendChild(st);
  }
  function boot(){ safe(setVersion); safe(installCss); safe(installLog); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else setTimeout(boot,0);
  window.addEventListener('load', boot, {once:true});
})();


/* ver.APP_VERSION: debug enemy stats, debug layout, option label unification, status/equip summaries */
(function(){
  'use strict';
  const APP_VERSION = (window.APP_VERSION || window.GAME_VERSION || document.documentElement.dataset.buildVersion || '0.0');
  function $(id){ return document.getElementById(id); }
  function safe(fn){ try{ return fn(); }catch(e){ console.error('[MBH '+APP_VERSION+' final-ui]', e); } }
  function pct(v){ return Math.round((Number(v)||0)*100) + '%'; }
  function num(v){ return Math.floor(Number(v)||0).toLocaleString(); }
  function esc(s){ return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  const OPTION_LABELS = window.MBH_OPTION_LABELS = Object.freeze({
    hp:'HP', atk:'攻撃力', def:'防御力',
    fireRes:'火軽減', fireDamageHeal:'火吸収', fireDmg:'火ダメージ', fireSkillChance:'炎斬り発動率',
    thunderDmg:'雷ダメージ', thunderSkillChance:'雷撃発動率',
    deathDanceChance:'死線の剣舞発動率', deathDanceDefIgnore:'死線の剣舞防御無視', deathDanceDurationMul:'死線の剣舞時間',
    heroDarkBleedChance:'暗黒出血付与', lifeSteal:'HP吸収', guard:'ガード率', crit:'会心率',
    masterRegen:'HP自動回復', masterRegenRate:'HP自動回復', killHeal:'撃破時HP回復',
    darkShield:'闇の盾', darkAmulet:'闇のアミュレット', quality:'品質', itemLevel:'ドロップLv',
    bossDamageReduction:'被ダメ軽減', defensePierce:'防御無視', skill:'武器スキル'
  });
  function label(k){ return OPTION_LABELS[k] || k; }

  function syncVersion(){
    window.GAME_VERSION = APP_VERSION;
    document.documentElement.dataset.buildVersion = APP_VERSION;
    document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent = 'ver.' + APP_VERSION; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ver.' + APP_VERSION; });
    const tt = $('mbhTraceBox')?.querySelector('.debug-trace-title');
    if(tt) tt.textContent = '進行デバッグログ ver.' + APP_VERSION;
  }

  function finalEnemyAtkDef(){
    if(typeof state === 'undefined' || !state.enemy) return {atk:0, def:0};
    let atk = Number(state.enemy.atk)||0;
    safe(()=>{ if(typeof darkSwordBuffCount === 'function') atk *= (1 + darkSwordBuffCount()*0.5); });
    return {atk:Math.floor(atk), def:Math.floor(Number(state.enemy.def)||0)};
  }
  function ensureEnemyDebugStatsLineFixed(){
    let line = $('enemyDebugStatsLine');
    const hp = document.querySelector('.enemy-zone .enemy-hp');
    if(!line){
      line = document.createElement('div');
      line.id = 'enemyDebugStatsLine';
      line.className = 'enemy-debug-stats-line hidden';
    }
    if(hp && line.parentNode !== hp.parentNode){ hp.parentNode.insertBefore(line, hp); }
    else if(hp && line.nextSibling !== hp){ hp.parentNode.insertBefore(line, hp); }
    return line;
  }
  function updateEnemyDebugStatsLineFixed(){
    const line = ensureEnemyDebugStatsLineFixed();
    if(!line) return;
    const enabled = !!(state && state.debug && state.debug.showEnemyStats);
    if(!enabled || !state.enemy){ line.classList.add('hidden'); line.textContent=''; return; }
    const v = finalEnemyAtkDef();
    line.textContent = `ATK：${v.atk.toLocaleString()}　DEF：${v.def.toLocaleString()}`;
    line.classList.remove('hidden');
  }

  function itemOptionRows(it, mode='summary'){
    if(!it) return [];
    const rows=[];
    const add=(k, val, suffix='', raw=false)=>{ if(!val) return; rows.push([label(k), raw ? String(val) : String(val)+suffix]); };
    if(it.itemLevel) rows.push([label('itemLevel'), Math.floor(Number(it.itemLevel)||1)]);
    rows.push([label('quality'), '+' + Math.max(0, Math.floor(Number(it.level)||0))]);
    add('hp', it.hp, '', false); add('atk', it.atk, '', false); add('def', it.def, '', false);
    if(it.fireRes) rows.push([label('fireRes'), pct(it.fireRes)]);
    if(it.fireDamageHeal) rows.push([label('fireDamageHeal'), pct(it.fireDamageHeal)]);
    if(it.fireDmg) rows.push([label('fireDmg'), '+'+pct(it.fireDmg)]);
    if(it.fireSkillChance) rows.push([label('fireSkillChance'), '+'+pct(it.fireSkillChance)]);
    if(it.thunderDmg) rows.push([label('thunderDmg'), '+'+pct(it.thunderDmg)]);
    if(it.thunderSkillChance) rows.push([label('thunderSkillChance'), '+'+pct(it.thunderSkillChance)]);
    if(it.deathDanceChance) rows.push([label('deathDanceChance'), '+'+pct(it.deathDanceChance)]);
    if(it.deathDanceDefIgnore) rows.push([label('deathDanceDefIgnore'), pct(it.deathDanceDefIgnore)]);
    if(it.heroDarkBleedChance) rows.push([label('heroDarkBleedChance'), pct(it.heroDarkBleedChance)]);
    if(it.lifeSteal) rows.push([label('lifeSteal'), pct(it.lifeSteal)]);
    if(it.guard) rows.push([label('guard'), '+'+pct(it.guard)]);
    if(it.crit) rows.push([label('crit'), '+'+pct(it.crit)]);
    if(it.darkShield) rows.push([label('darkShield'), '毎ターン被ダメ軽減+1% / 被ダメ50%回復']);
    if(it.darkAmulet) rows.push([label('darkAmulet'), '剣舞時間2倍']);
    if(it.masterRegen) rows.push([label('masterRegen'), (typeof masterAmuletRegenRate==='function' ? (masterAmuletRegenRate()*100).toFixed(1) : '3.0') + '% / 10秒']);
    if(it.masterRegen) rows.push([label('killHeal'), '25%']);
    if(it.skill){
      let extra = 0;
      if(it.skill.id === 'fire') extra = it.fireSkillChance || 0;
      if(it.skill.id === 'thunder') extra = it.thunderSkillChance || 0;
      rows.push([label('skill'), `${it.skill.name} ${pct((it.skill.chance||0)+extra)}`]);
      if(it.skill.id==='thunder') rows.push([label('defensePierce'), '25%']);
      if(it.skill.id==='fire') rows.push(['火傷付与', '20%']);
    }
    if(mode==='summary' && it.flavor) rows.push(['説明', it.flavor]);
    return rows;
  }
  function itemSummaryUnified(it){
    return itemOptionRows(it,'summary').map(([k,v])=>`${k}${String(v).startsWith('+')||/^\d|^-/.test(String(v))?'':'：'}${v}`).join(' / ');
  }
  function equipmentTotals(){
    const t = {hp:0, atk:0, def:0, fireRes:0, fireDamageHeal:0, fireDmg:0, fireSkillChance:0, thunderDmg:0, thunderSkillChance:0, deathDanceChance:0, deathDanceDefIgnore:0, heroDarkBleedChance:0, lifeSteal:0, guard:0, crit:0, darkShield:false, darkAmulet:false, masterRegen:false, killHeal:0};
    if(typeof state === 'undefined' || !state.equip) return t;
    Object.values(state.equip).filter(Boolean).forEach(it=>{
      ['hp','atk','def','fireRes','fireDamageHeal','fireDmg','fireSkillChance','thunderDmg','thunderSkillChance','deathDanceChance','deathDanceDefIgnore','heroDarkBleedChance','lifeSteal','guard','crit'].forEach(k=>{ t[k] += Number(it[k])||0; });
      if(it.darkShield) t.darkShield = true;
      if(it.darkAmulet) t.darkAmulet = true;
      if(it.masterRegen){ t.masterRegen = true; t.killHeal = Math.max(t.killHeal, .25); }
    });
    return t;
  }
  function totalRowsFromObject(t){
    const rows=[];
    const addNum=(k,v)=>{ if(v) rows.push([label(k), (v>0?'+':'')+num(v)]); };
    const addPct=(k,v,plus=true)=>{ if(v) rows.push([label(k), (plus?'+':'')+pct(v)]); };
    addNum('hp',t.hp); addNum('atk',t.atk); addNum('def',t.def);
    addPct('fireRes',t.fireRes,false); addPct('fireDamageHeal',t.fireDamageHeal,false); addPct('fireDmg',t.fireDmg); addPct('fireSkillChance',t.fireSkillChance);
    addPct('thunderDmg',t.thunderDmg); addPct('thunderSkillChance',t.thunderSkillChance);
    addPct('deathDanceChance',t.deathDanceChance); addPct('deathDanceDefIgnore',t.deathDanceDefIgnore,false); addPct('heroDarkBleedChance',t.heroDarkBleedChance,false);
    addPct('lifeSteal',t.lifeSteal,false); addPct('guard',t.guard); addPct('crit',t.crit);
    if(t.darkShield) rows.push([label('darkShield'), '有効']);
    if(t.darkAmulet) rows.push([label('darkAmulet'), '有効']);
    if(t.masterRegen) rows.push([label('masterRegen'), (typeof masterAmuletRegenRate==='function' ? (masterAmuletRegenRate()*100).toFixed(1) : '3.0') + '% / 10秒']);
    if(t.killHeal) rows.push([label('killHeal'), pct(t.killHeal)]);
    return rows;
  }
  function specialEffectRows(){
    if(typeof calcStats !== 'function') return [];
    const st = calcStats();
    const rows=[];
    const addPct=(k,v,plus=false)=>{ if(v) rows.push([label(k), (plus?'+':'')+pct(v)]); };
    addPct('fireRes', st.fireRes); addPct('fireDamageHeal', st.fireDamageHeal); addPct('fireDmg', st.fireDmg, true); addPct('fireSkillChance', st.fireSkillChance, true);
    addPct('thunderDmg', st.thunderDmg, true); addPct('thunderSkillChance', st.thunderSkillChance, true);
    addPct('deathDanceChance', st.deathDanceChance, false); addPct('deathDanceDefIgnore', st.deathDanceDefIgnore, false); addPct('heroDarkBleedChance', st.heroDarkBleedChance, false);
    addPct('lifeSteal', st.lifeSteal, false); addPct('guard', st.guard, false); addPct('crit', st.crit, false);
    if(st.deathDanceDurationMul && st.deathDanceDurationMul !== 1) rows.push([label('deathDanceDurationMul'), Math.round(st.deathDanceDurationMul*100)+'%']);
    if(st.masterRegen) rows.push([label('masterRegen'), (st.masterRegenRate*100).toFixed(1)+'% / 10秒']);
    if(st.darkShield) rows.push([label('darkShield'), '有効']);
    if(st.darkAmulet) rows.push([label('darkAmulet'), '有効']);
    return rows;
  }
  function rowsHtml(rows, empty='効果なし'){
    if(!rows.length) return `<div class="effect-empty">${esc(empty)}</div>`;
    return rows.map(([k,v])=>`<div class="effect-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  }
  function ensureStatusEffectPanel(){
    const stats = document.querySelector('.hero-stats');
    if(!stats) return null;
    let box = $('statusSpecialEffects');
    if(!box){
      box=document.createElement('div'); box.id='statusSpecialEffects'; box.className='status-special-effects';
      box.innerHTML='<h3>特殊効果</h3><div class="effect-scroll"></div>';
      const records = stats.querySelector('.monster-records');
      if(records) stats.insertBefore(box, records); else stats.appendChild(box);
    }
    return box.querySelector('.effect-scroll');
  }
  function ensureEquipUtilityPanel(){
    const panel=document.querySelector('.equip-panel'); if(!panel) return null;
    let btn=$('bestEquipBtnEquip');
    if(!btn){
      btn=document.createElement('button'); btn.id='bestEquipBtnEquip'; btn.type='button'; btn.className='wide best-equip-in-equip'; btn.textContent='最強装備';
      const list=$('equipList'); panel.insertBefore(btn, list || panel.firstChild);
      btn.onclick=(e)=>{ e.preventDefault(); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); safe(()=>{ if(typeof bestEquip==='function') bestEquip(); }); };
    }
    let box=$('equipEffectTotals');
    if(!box){
      box=document.createElement('div'); box.id='equipEffectTotals'; box.className='equip-effect-totals';
      box.innerHTML='<h3>装備効果合計</h3><div class="effect-scroll"></div>';
      const up=$('upgradeBtn'); panel.insertBefore(box, up || null);
    }
    return box.querySelector('.effect-scroll');
  }
  function renderExtraPanels(){
    const sbox=ensureStatusEffectPanel(); if(sbox) sbox.innerHTML=rowsHtml(specialEffectRows(), '特殊効果なし');
    const ebox=ensureEquipUtilityPanel(); if(ebox) ebox.innerHTML=rowsHtml(totalRowsFromObject(equipmentTotals()), '装備効果なし');
  }

  function installDebugUi(){
    const panel=$('debugPanel'); if(!panel) return;
    panel.classList.add('debug-two-col');
    const box=$('debugShowEnemyStats');
    if(box){
      box.checked = !!(state && state.debug && state.debug.showEnemyStats);
      box.onchange = ()=>{ state.debug = state.debug || {}; state.debug.showEnemyStats = !!box.checked; safe(()=>{ if(typeof renderBattle==='function') renderBattle(); else updateEnemyDebugStatsLineFixed(); }); safe(()=>{ if(typeof scheduleSave==='function') scheduleSave(); }); };
    }
    if(!window.__mbhDebugOutsideClose9957){
      window.__mbhDebugOutsideClose9957 = true;
      document.addEventListener('pointerdown', (e)=>{
        const p=$('debugPanel'); const b=$('debugBtn');
        if(!p || p.classList.contains('hidden')) return;
        if(p.contains(e.target) || (b && b.contains(e.target))) return;
        p.classList.add('hidden');
      }, {capture:true});
    }
  }

  function installCss(){
    if($('mbh-9957-ui-css')) return;
    const st=document.createElement('style'); st.id='mbh-9957-ui-css';
    st.textContent = `
      .enemy-debug-stats-line{margin:0 0 5px;padding:3px 7px;border:1px solid rgba(255,215,107,.55);border-radius:6px;background:rgba(0,0,0,.55);color:#9ee8ff;font-size:12px;font-weight:900;text-align:center;text-shadow:0 1px 2px #000;}
      #debugPanel.debug-two-col{grid-template-columns:1fr 1fr!important;width:min(560px,calc(100vw - 24px))!important;max-height:calc(100dvh - 86px)!important;overflow:auto!important;}
      #debugPanel.debug-two-col .debug-head,#debugPanel.debug-two-col .debug-subhead,#debugPanel.debug-two-col .debug-trace-box,#debugPanel.debug-two-col .debug-version,#debugPanel.debug-two-col #debugClose{grid-column:1 / -1!important;}
      #debugPanel.debug-two-col .debug-grid{grid-column:1 / -1!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;}
      #debugPanel.debug-two-col label{min-width:0!important;}
      .status-special-effects,.equip-effect-totals{margin-top:10px;border-top:1px solid #513917;padding-top:8px;min-height:0;}
      .status-special-effects h3,.equip-effect-totals h3,.monster-records h3{margin:0 0 6px;color:#ffd76b;font-size:14px;}
      .effect-scroll{max-height:150px;overflow-y:auto;overflow-x:hidden;padding-right:6px;scrollbar-color:#9d742a #111;scrollbar-width:thin;}
      .effect-scroll::-webkit-scrollbar,.monster-record-list::-webkit-scrollbar{width:8px}.effect-scroll::-webkit-scrollbar-thumb,.monster-record-list::-webkit-scrollbar-thumb{background:#8b6628;border-radius:8px}.effect-scroll::-webkit-scrollbar-track,.monster-record-list::-webkit-scrollbar-track{background:#120b06}
      .effect-row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px;line-height:1.35}.effect-row span{color:#e8d0a2}.effect-row b{color:#fff7c8}.effect-empty{color:#a99670;font-size:12px;padding:4px 0;}
      .monster-records{margin-top:12px;min-height:0}.monster-record-list{max-height:240px!important;overflow-y:auto!important;padding-right:6px!important}.monster-record-row{padding:5px 0!important;line-height:1.35!important;}
      .best-equip-in-equip{margin:4px 0 8px!important;}
      @media(max-width:760px){#debugPanel.debug-two-col{left:8px!important;right:8px!important;width:auto!important;grid-template-columns:1fr 1fr!important}.effect-scroll{max-height:130px}.monster-record-list{max-height:220px!important}}
    `;
    document.head.appendChild(st);
  }

  function patchRenderFunctions(){
    if(!window.__mbhOriginalItemSummary9957 && typeof itemSummary === 'function') window.__mbhOriginalItemSummary9957 = itemSummary;
    window.itemSummary = itemSummaryUnified;
    try{ itemSummary = itemSummaryUnified; }catch(_){ }

    if(!window.__mbhRenderBattle9957 && typeof renderBattle === 'function'){
      window.__mbhRenderBattle9957 = renderBattle;
      renderBattle = function(){ const r=window.__mbhRenderBattle9957.apply(this, arguments); updateEnemyDebugStatsLineFixed(); return r; };
    }
    if(!window.__mbhRenderStats9957 && typeof renderStats === 'function'){
      window.__mbhRenderStats9957 = renderStats;
      renderStats = function(){ const r=window.__mbhRenderStats9957.apply(this, arguments); renderExtraPanels(); return r; };
    }
    if(!window.__mbhRenderEquip9957 && typeof renderEquip === 'function'){
      window.__mbhRenderEquip9957 = renderEquip;
      renderEquip = function(){ const r=window.__mbhRenderEquip9957.apply(this, arguments); renderExtraPanels(); return r; };
    }
  }

  function boot(){
    syncVersion(); installCss(); patchRenderFunctions(); installDebugUi(); renderExtraPanels(); updateEnemyDebugStatsLineFixed();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else setTimeout(boot,0);
  window.addEventListener('load', boot, {once:true});
  setInterval(()=>{ safe(syncVersion); safe(installDebugUi); safe(updateEnemyDebugStatsLineFixed); }, 1000);
})();


/* ver.0.2.9: strong/named variants, drop source, quality/luck bonuses, deathdance count-only reset補強 */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  const PREFIXES = ['狡猾な','獰猛な','蛮勇な','エリート','頂点の','原点の','キラー'];
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH 0.1.3]', e); } }
  function syncVersion9959(){
    safe(()=>{ window.APP_VERSION = APP_VERSION; window.GAME_VERSION = APP_VERSION; document.documentElement.dataset.buildVersion = APP_VERSION; });
    safe(()=>{ document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+APP_VERSION; }); });
    safe(()=>{ document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+APP_VERSION; }); });
    safe(()=>{ const tt=document.querySelector('#mbhTraceBox .debug-trace-title'); if(tt) tt.textContent='進行デバッグログ ver.'+APP_VERSION; });
  }
  function isVariantTarget(e){ return !!e && e.id !== 'dark_sword_saint' && (e.type === '雑魚' || e.type === 'ボス'); }
  function variantLabel(v){ return v?.type === 'named' ? '異名持ち' : v?.type === 'strong' ? '強個体' : ''; }
  function variantBonus(v){ return v?.type === 'named' ? 25 : v?.type === 'strong' ? 10 : 0; }
  function currentDropSource(){ return window.__mbhLastDefeatedEnemyForDrop || state?.enemy || null; }
  function randIntLocal(min,max){ min=Math.floor(min); max=Math.floor(max); return Math.floor(Math.random()*(max-min+1))+min; }
  function pctLocal(v){ return Math.round((Number(v)||0)*100)+'%'; }
  function sourceText(it){
    if(!it) return '';
    const nm = it.dropSourceName || it.dropMonsterName || '';
    const lv = Math.max(0, Math.floor(Number(it.dropSourceLevel || it.dropMonsterLevel)||0));
    const va = it.dropSourceVariantLabel || '';
    if(!nm && !lv) return '';
    return `ドロップ元：${va?va+' ':''}${nm || '不明'}${lv?` Lv.${lv}`:''}`;
  }
  function annotateDropSource(it, source=currentDropSource()){
    if(!it || !source) return it;
    const lv = Math.max(1, Math.floor(Number(source.level)||Number(source.itemLevel)||1));
    it.dropSourceName = source.name || source.baseName || source.id || '不明';
    it.dropMonsterName = it.dropSourceName;
    it.dropSourceLevel = lv;
    it.dropMonsterLevel = lv;
    if(source.variant?.type){
      it.dropSourceVariant = source.variant.type;
      it.dropSourceVariantLabel = variantLabel(source.variant);
    }
    return it;
  }
  function applyIncrementalQuality(it, add){
    add = Math.max(0, Math.floor(Number(add)||0));
    if(!it || !add) return it;
    it.level = Math.max(0, Math.floor(Number(it.level)||0)) + add;
    const statMul = 1 + add * 0.04;
    if(it.atk) it.atk = Math.max(1, Math.floor(it.atk * statMul));
    if(it.def) it.def = Math.max(1, Math.floor(it.def * statMul));
    if(it.hp) it.hp = Math.max(1, Math.floor(it.hp * statMul));
    const specialAdd = add * 0.002;
    if(it.crit) it.crit = Math.min(0.65, +(it.crit + specialAdd).toFixed(3));
    if(it.lifeSteal) it.lifeSteal = Math.min(0.35, +(it.lifeSteal + specialAdd).toFixed(3));
    if(it.guard) it.guard = Math.min(0.55, +(it.guard + specialAdd).toFixed(3));
    if(it.fireRes) it.fireRes = Math.min(0.75, +(it.fireRes + specialAdd).toFixed(3));
    if(it.fireDamageHeal) it.fireDamageHeal = Math.min(1, +(it.fireDamageHeal + specialAdd).toFixed(3));
    if(it.fireDmg) it.fireDmg = Math.min(1.5, +(it.fireDmg + specialAdd).toFixed(3));
    if(it.thunderDmg) it.thunderDmg = Math.min(1.5, +(it.thunderDmg + specialAdd).toFixed(3));
    if(it.fireSkillChance) it.fireSkillChance = Math.min(0.95, +(it.fireSkillChance + specialAdd).toFixed(3));
    if(it.thunderSkillChance) it.thunderSkillChance = Math.min(0.95, +(it.thunderSkillChance + specialAdd).toFixed(3));
    if(it.deathDanceChance) it.deathDanceChance = Math.min(it.specialFrame === 'darkholy' ? 0.50 : 0.25, +(it.deathDanceChance + specialAdd).toFixed(3));
    if(it.heroDarkBleedChance) it.heroDarkBleedChance = Math.min(0.50, +(it.heroDarkBleedChance + specialAdd).toFixed(3));
    it.qualityBonusFromVariant = (Math.max(0, Math.floor(Number(it.qualityBonusFromVariant)||0)) + add);
    return it;
  }
  function improveGoodOptions(it, source=currentDropSource()){
    if(!it) return it;
    const v = source?.variant;
    const luck = v?.type === 'named' ? 0.45 : v?.type === 'strong' ? 0.28 : (source?.type === 'ボス' ? 0.14 : 0.06);
    const boost = v?.type === 'named' ? 1.8 : v?.type === 'strong' ? 1.35 : 1.0;
    const addPct = (key, val, cap)=>{ it[key] = Math.min(cap, +((Number(it[key])||0) + val).toFixed(3)); };
    if(it.slot === '武器'){
      if(!it.skill && Math.random() < luck && typeof randomWeaponSkill === 'function') it.skill = randomWeaponSkill(rarities.find(r=>r.id===it.rarity) || rarities[0]);
      if(Math.random() < luck) addPct('crit', 0.03*boost, 0.65);
      if(Math.random() < luck*0.75) addPct(Math.random()<0.5?'fireDmg':'thunderDmg', 0.08*boost, 1.5);
      if(Math.random() < luck*0.45) addPct('deathDanceDefIgnore', 0.04*boost, 0.90);
    }else if(it.slot === 'リング' || it.slot === 'アミュレット'){
      if(Math.random() < luck) addPct('lifeSteal', 0.025*boost, 0.35);
      if(Math.random() < luck) addPct('guard', 0.025*boost, 0.55);
      if(Math.random() < luck*0.85) addPct('deathDanceChance', 0.03*boost, 0.25);
      if(Math.random() < luck*0.55) addPct('heroDarkBleedChance', 0.025*boost, 0.50);
      if(Math.random() < luck*0.6) addPct('fireDamageHeal', 0.10*boost, 1.0);
    }else{
      if(Math.random() < luck) addPct('fireRes', 0.04*boost, 0.75);
      if(Math.random() < luck*0.75) addPct('guard', 0.02*boost, 0.55);
      if(Math.random() < luck*0.55) addPct('fireDamageHeal', 0.12*boost, 1.0);
      if(Math.random() < luck*0.4) addPct('thunderDmg', 0.04*boost, 1.5);
    }
    return it;
  }
  function finalizeDropItem9959(it, source=currentDropSource()){
    if(!it) return it;
    annotateDropSource(it, source);
    const bonus = variantBonus(source?.variant);
    if(bonus && !it.__variantDropBonusApplied9959){
      applyIncrementalQuality(it, bonus);
      it.__variantDropBonusApplied9959 = true;
    }
    improveGoodOptions(it, source);
    return it;
  }

  const oldMakeScaledEnemy = (typeof makeScaledEnemy === 'function') ? makeScaledEnemy : null;
  if(oldMakeScaledEnemy && !window.__mbhMakeScaledEnemy9959){
    window.__mbhMakeScaledEnemy9959 = oldMakeScaledEnemy;
    makeScaledEnemy = function(base, forceLevel=null){
      const e = window.__mbhMakeScaledEnemy9959.apply(this, arguments);
      if(isVariantTarget(e) && !e.variant){
        const r = Math.random();
        if(r < 0.05){
          const prefix = PREFIXES[Math.floor(Math.random()*PREFIXES.length)];
          e.baseName = e.name;
          e.variant = {type:'named', label:'異名持ち', prefix};
          e.name = `${prefix}${e.name}`;
          e.maxHp = Math.max(1, Math.floor(e.maxHp * 2.0));
          e.atk = Math.max(1, Math.floor(e.atk * 1.25));
          e.def = Math.max(0, Math.floor(e.def * 1.10));
        }else if(r < 0.15){
          e.baseName = e.name;
          e.variant = {type:'strong', label:'強個体'};
          e.maxHp = Math.max(1, Math.floor(e.maxHp * 1.5));
          e.atk = Math.max(1, Math.floor(e.atk * 1.10));
        }
      }
      return e;
    };
  }

  const oldProcessStatusDots = (typeof processStatusDots === 'function') ? processStatusDots : null;
  if(oldProcessStatusDots && !window.__mbhProcessDots9959){
    window.__mbhProcessDots9959 = oldProcessStatusDots;
    processStatusDots = function(now){
      const r = window.__mbhProcessDots9959.apply(this, arguments);
      safe(()=>{
        if(state?.enemy?.variant?.type === 'named' && state.enemyHp > 0 && state.enemyHp < state.enemy.maxHp){
          ensureStatusContainers();
          if(!state.enemyStatuses.namedRegenLast) state.enemyStatuses.namedRegenLast = now;
          const ticks = Math.min(20, Math.floor((now - state.enemyStatuses.namedRegenLast)/1000));
          if(ticks > 0){
            state.enemyStatuses.namedRegenLast += ticks*1000;
            const heal = Math.max(1, Math.floor(state.enemy.maxHp * 0.02 * ticks));
            state.enemyHp = Math.min(state.enemy.maxHp, state.enemyHp + heal);
            if(typeof showFloat === 'function') showFloat(`異名再生 +${heal.toLocaleString()}`, 'heal named-regen');
            if(typeof renderBattle === 'function') renderBattle();
          }
        }
      });
      return r;
    };
  }

  const oldStatusTooltipHtml = (typeof statusTooltipHtml === 'function') ? statusTooltipHtml : null;
  if(oldStatusTooltipHtml && !window.__mbhStatusTooltip9959){
    window.__mbhStatusTooltip9959 = oldStatusTooltipHtml;
    statusTooltipHtml = function(kind, target){
      if(kind === 'strong_variant') return `<b>強個体</b><br>HP1.5倍。<br>攻撃力10%アップ。<br>ドロップ品質+10。<br>良い効果が少し付きやすい。`;
      if(kind === 'named_variant') return `<b>異名持ち</b><br>HP2倍。<br>攻撃力25%アップ。<br>防御力10%アップ。<br>毎秒最大HP2%回復。<br>ドロップ品質+25。<br>良い効果が付きやすい。`;
      return window.__mbhStatusTooltip9959.apply(this, arguments);
    };
  }

  const oldRenderStatusLists = (typeof renderStatusLists === 'function') ? renderStatusLists : null;
  if(oldRenderStatusLists && !window.__mbhRenderStatus9959){
    window.__mbhRenderStatus9959 = oldRenderStatusLists;
    renderStatusLists = function(){
      const r = window.__mbhRenderStatus9959.apply(this, arguments);
      safe(()=>{
        const list = els?.enemyStatusList;
        const v = state?.enemy?.variant;
        if(list && v?.type){
          const btn = document.createElement('button');
          btn.type='button';
          btn.className = `status-badge ${v.type === 'named' ? 'named-variant' : 'strong-variant'}`;
          btn.dataset.statusKind = v.type === 'named' ? 'named_variant' : 'strong_variant';
          btn.dataset.statusTarget = 'enemy';
          btn.textContent = v.type === 'named' ? '異名持ち' : '強個体';
          list.insertBefore(btn, list.firstChild);
          if(typeof bindStatusBadgeEvents === 'function') bindStatusBadgeEvents();
        }
      });
      return r;
    };
  }

  const oldRenderBattle = (typeof renderBattle === 'function') ? renderBattle : null;
  if(oldRenderBattle && !window.__mbhRenderBattle9959Variant){
    window.__mbhRenderBattle9959Variant = oldRenderBattle;
    renderBattle = function(){
      const r = window.__mbhRenderBattle9959Variant.apply(this, arguments);
      safe(()=>{
        const n = els?.enemyName;
        if(n){
          n.classList.remove('enemy-strong-name','enemy-named-name');
          if(state?.enemy?.variant?.type === 'strong') n.classList.add('enemy-strong-name');
          if(state?.enemy?.variant?.type === 'named') n.classList.add('enemy-named-name');
        }
      });
      return r;
    };
  }

  const oldSetEnemy = (typeof setEnemy === 'function') ? setEnemy : null;
  if(oldSetEnemy && !window.__mbhSetEnemy9959){
    window.__mbhSetEnemy9959 = oldSetEnemy;
    setEnemy = function(e){
      const r = window.__mbhSetEnemy9959.apply(this, arguments);
      safe(()=>{
        if(e?.variant?.type === 'strong') log(`強個体：${e.name} が出現！`, 'danger');
        if(e?.variant?.type === 'named') log(`異名持ち：${e.name} が出現！`, 'danger');
      });
      return r;
    };
  }

  const oldMakeItem = (typeof makeItem === 'function') ? makeItem : null;
  if(oldMakeItem && !window.__mbhMakeItem9959){
    window.__mbhMakeItem9959 = oldMakeItem;
    makeItem = function(slot, rarity, opts={}){
      const it = window.__mbhMakeItem9959.apply(this, arguments);
      const source = currentDropSource();
      return finalizeDropItem9959(it, source);
    };
  }
  const oldMakeRandomItem = (typeof makeRandomItem === 'function') ? makeRandomItem : null;
  if(oldMakeRandomItem && !window.__mbhMakeRandomItem9959){
    window.__mbhMakeRandomItem9959 = oldMakeRandomItem;
    makeRandomItem = function(isBossDrop=false, levelOverride=null){
      const it = window.__mbhMakeRandomItem9959.apply(this, arguments);
      return finalizeDropItem9959(it, currentDropSource());
    };
  }

  function wrapDarkMaker(name){
    const fn = window[name] || (typeof globalThis !== 'undefined' ? globalThis[name] : null);
    try{
      if(typeof eval(name) === 'function'){
        const old = eval(name);
        if(!old.__mbh9959Wrapped){
          const wrapped = function(){ const it = old.apply(this, arguments); return finalizeDropItem9959(it, currentDropSource()); };
          wrapped.__mbh9959Wrapped = true;
          eval(name + ' = wrapped');
        }
      }
    }catch(e){}
  }
  ['makeDarkHolySword','makeDarkShield','makeDarkAmulet','makeDarkArmor','makeDarkGauntlets','makeDarkHelm','makeDarkBoots'].forEach(wrapDarkMaker);

  const oldItemSummary = (typeof itemSummary === 'function') ? itemSummary : null;
  if(oldItemSummary && !window.__mbhItemSummary9959){
    window.__mbhItemSummary9959 = oldItemSummary;
    itemSummary = function(it){
      let base = window.__mbhItemSummary9959.apply(this, arguments) || '';
      const src = sourceText(it);
      const vb = it?.qualityBonusFromVariant ? `品質補正+${Math.floor(Number(it.qualityBonusFromVariant)||0)}` : '';
      const extra = [src, vb].filter(Boolean).join(' / ');
      return extra ? (base ? base + ' / ' + extra : extra) : base;
    };
  }
  const oldLogItemDrop = (typeof logItemDrop === 'function') ? logItemDrop : null;
  if(oldLogItemDrop && !window.__mbhLogItemDrop9959){
    window.__mbhLogItemDrop9959 = oldLogItemDrop;
    logItemDrop = function(it){
      const r = window.__mbhLogItemDrop9959.apply(this, arguments);
      const src = sourceText(it);
      if(src && typeof log === 'function') log(`　└ ${src}`, 'drop');
      return r;
    };
  }

  function installCss9959(){
    if(document.getElementById('mbh-9959-variant-css')) return;
    const st=document.createElement('style'); st.id='mbh-9959-variant-css';
    st.textContent = `
      .enemy-strong-name{color:#55aaff!important;text-shadow:0 0 10px #116dff,0 2px 4px #000!important;}
      .enemy-named-name{color:#ff9d2e!important;text-shadow:0 0 12px #ff6a00,0 2px 4px #000!important;}
      .status-badge.strong-variant{border-color:#55aaff!important;color:#bfe0ff!important;background:rgba(20,70,140,.45)!important;}
      .status-badge.named-variant{border-color:#ff9d2e!important;color:#ffd29a!important;background:rgba(145,75,10,.45)!important;}
    `;
    document.head.appendChild(st);
  }

  function boot9959(){ syncVersion9959(); installCss9959(); safe(()=>{ if(typeof renderAll === 'function') renderAll(); }); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot9959, {once:true}); else setTimeout(boot9959,0);
  window.addEventListener('load', boot9959, {once:true});
  setInterval(syncVersion9959, 1500);
})();


/* ver.0.2.9: 敵防御を軽減式へ変更、敵レベル経験値制御、Lv100までの戦闘テンポ調整 */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  const ENEMY_LEVEL_XP_KEY = 'mini-browser-hero-enemy-level-xp-v9960';
  const ENEMY_LEVEL_XP_NEXT = 1000;
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH 0.1.3]', e); } }
  function syncVersion9960(){
    safe(()=>{ window.APP_VERSION = APP_VERSION; window.GAME_VERSION = APP_VERSION; document.documentElement.dataset.buildVersion = APP_VERSION; });
    safe(()=>{ document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+APP_VERSION; }); });
    safe(()=>{ document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+APP_VERSION; }); });
    safe(()=>{ const tt=document.querySelector('#mbhTraceBox .debug-trace-title'); if(tt) tt.textContent='進行デバッグログ ver.'+APP_VERSION; });
  }
  function loadEnemyLevelXp9960(){
    safe(()=>{
      if(typeof state === 'undefined') return;
      const v = Number(localStorage.getItem(ENEMY_LEVEL_XP_KEY));
      if(Number.isFinite(v)) state.enemyLevelXp = Math.max(0, Math.floor(v));
      else if(state.enemyLevelXp == null) state.enemyLevelXp = 0;
    });
  }
  function saveEnemyLevelXp9960(){
    safe(()=>{ if(typeof state !== 'undefined') localStorage.setItem(ENEMY_LEVEL_XP_KEY, String(Math.max(0, Math.floor(Number(state.enemyLevelXp)||0)))); });
  }
  function isBossType(e){ return !!e && (e.type === 'ボス' || e.type === '裏ボス'); }
  function enemyLevel(e){ return Math.max(1, Math.floor(Number(e?.level)||Number(state?.enemyLevelBase)||Number(state?.level)||1)); }
  function variantKind(e){ return e?.variant?.type || ''; }
  function enemyLevelXpBaseGain(e){
    if(!e || e.id === 'dark_sword_saint') return 0;
    if(isBossType(e)) return 1000;
    if(variantKind(e) === 'named') return 120;
    if(variantKind(e) === 'strong') return 80;
    return 50;
  }
  function enemyLevelXpGain(e){
    const base = enemyLevelXpBaseGain(e);
    if(!base) return 0;
    const current = Math.max(1, Math.floor(Number(state?.enemyLevelBase)||enemyLevel(e)));
    const diff = enemyLevel(e) - current;
    const mult = diff >= 0 ? (1 + diff * 0.10) : Math.max(0.10, 1 + diff * 0.10);
    return Math.max(1, Math.ceil(base * mult));
  }
  function addEnemyLevelXp(e){
    if(typeof state === 'undefined' || !e) return;
    if(state.enemyLevelXp == null) loadEnemyLevelXp9960();
    const lv = enemyLevel(e);
    if(e.id === 'dark_sword_saint'){
      if(state.darkSwordSaintReturn && state.darkSwordSaintReturn.milestoneDarkSaint){
        state.enemyLevelBase = lv + 1;
        state.enemyLevelXp = 0;
        state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
        if(typeof log === 'function') log(`100レベルの試練突破！ 敵レベルがLv.${lv}→Lv.${state.enemyLevelBase}に上昇。`, 'system');
      }
      saveEnemyLevelXp9960();
      return;
    }
    const gain = enemyLevelXpGain(e);
    state.enemyLevelXp = Math.max(0, Math.floor(Number(state.enemyLevelXp)||0)) + gain;
    let up = 0;
    while(state.enemyLevelXp >= ENEMY_LEVEL_XP_NEXT){
      state.enemyLevelXp -= ENEMY_LEVEL_XP_NEXT;
      up++;
    }
    if(up > 0){
      const before = Math.max(1, Math.floor(Number(state.enemyLevelBase)||lv));
      state.enemyLevelBase = Math.max(before, lv) + up;
      state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
      if(typeof log === 'function') log(`敵Lv経験値 +${gain}。敵レベルがLv.${before}→Lv.${state.enemyLevelBase}に上昇。`, 'system');
    }else{
      state.enemyLevelBase = Math.max(1, Math.floor(Number(state.enemyLevelBase)||lv));
      if(typeof log === 'function') log(`敵Lv経験値 +${gain}（${state.enemyLevelXp}/${ENEMY_LEVEL_XP_NEXT}）`, 'system');
    }
    saveEnemyLevelXp9960();
  }

  const oldMakeScaledEnemy9960 = (typeof makeScaledEnemy === 'function') ? makeScaledEnemy : null;
  if(oldMakeScaledEnemy9960 && !window.__mbhMakeScaledEnemy9960){
    window.__mbhMakeScaledEnemy9960 = oldMakeScaledEnemy9960;
    makeScaledEnemy = function(base, forceLevel=null){
      const e = window.__mbhMakeScaledEnemy9960.apply(this, arguments);
      safe(()=>{
        if(!e || !base || e.id === 'dark_sword_saint') return;
        const lv = enemyLevel(e);
        const boss = isBossType(e);
        // HPは指数ではなく線形成長。Lv100で雑魚は約13倍、ボスは約19倍にする。
        let hp = Math.floor((Number(base.hp)||1) * (1 + lv * (boss ? 0.18 : 0.12)));
        // 0.1.3の強個体/異名持ち補正を再適用。
        if(e.variant?.type === 'named') hp = Math.floor(hp * 2.0);
        else if(e.variant?.type === 'strong') hp = Math.floor(hp * 1.5);
        e.maxHp = Math.max(1, hp);
        // ATKは既存のLv成長を維持しつつ、強個体/異名補正を明示。
        const statScale = 1 + Math.max(0, lv - 1) * 0.08;
        let atk = Math.floor((Number(base.atk)||1) * statScale);
        if(e.variant?.type === 'named') atk = Math.floor(atk * 1.25);
        else if(e.variant?.type === 'strong') atk = Math.floor(atk * 1.10);
        e.atk = Math.max(1, atk);
        // 防御は軽減式に合わせた値へ再設計。Lv100で雑魚150前後、ボス250前後。
        let def = Math.floor((Number(base.def)||0) * 2 + lv * (boss ? 2.0 : 1.35));
        if(e.variant?.type === 'named') def = Math.floor(def * 1.10);
        e.def = Math.max(0, def);
        e.__v9960Scaled = true;
      });
      return e;
    };
  }

  if(typeof updateEnemyLevelProgressionOnDefeat === 'function' && !window.__mbhUpdateEnemyLevelProgression9960){
    window.__mbhUpdateEnemyLevelProgression9960 = updateEnemyLevelProgressionOnDefeat;
    updateEnemyLevelProgressionOnDefeat = function(e){
      addEnemyLevelXp(e);
    };
  }

  // 逃走/敗北で敵レベルが下がった場合、低レベル狩りで稼げないよう進行経験値は維持しつつ保存。
  if(typeof fleeBattle === 'function' && !window.__mbhFleeBattle9960){
    window.__mbhFleeBattle9960 = fleeBattle;
    fleeBattle = function(){ const r = window.__mbhFleeBattle9960.apply(this, arguments); saveEnemyLevelXp9960(); return r; };
  }
  if(typeof handleHeroDeath === 'function' && !window.__mbhHandleHeroDeath9960){
    window.__mbhHandleHeroDeath9960 = handleHeroDeath;
    handleHeroDeath = function(){ const r = window.__mbhHandleHeroDeath9960.apply(this, arguments); saveEnemyLevelXp9960(); return r; };
  }

  function calcHeroDamage9960(st, mult, element, crit){
    const atkRoll = (Number(st.atk)||1) * mult + (typeof rand === 'function' ? rand(0,(Number(st.atk)||1)*0.45) : Math.random()*(Number(st.atk)||1)*0.45);
    let defMul = 1;
    safe(()=>{ if(typeof enemyDefenseMultiplierFor === 'function') defMul = enemyDefenseMultiplierFor(element); });
    const effectiveDef = Math.max(0, (Number(state.enemy?.def)||0) * defMul);
    let dmg = Math.max(1, Math.floor(atkRoll * (100 / (100 + effectiveDef))));
    if(crit) dmg = Math.floor(dmg * 1.85);
    return Math.max(1, dmg);
  }

  if(typeof applyHeroHit === 'function' && !window.__mbhApplyHeroHit9960){
    window.__mbhApplyHeroHit9960 = applyHeroHit;
    applyHeroHit = function(skill){
      if(!state.enemy) return;
      if(typeof isDarkSwordSaintReviving === 'function' && isDarkSwordSaintReviving()){ if(typeof showFloat === 'function') showFloat('無効','guard'); if(typeof renderBattle === 'function') renderBattle(); return; }
      const st = calcStats();
      let mult=1, element='physical', fx='slash', label='斬撃';
      if(skill==='fire'){mult=1.45;element='fire';fx='fire';label='炎斬り';}
      if(skill==='thunder'){mult=1.35;element='thunder';fx='thunder';label='雷撃';}
      if(skill==='multi'){mult=.72;element='physical';fx='slash';label='連続攻撃';}
      if(skill==='heavy'){mult=2.25;element='physical';fx='heavy';label='大攻撃';}
      if(skill==='deathdance'){mult=0.95*Math.pow(2, Math.max(0, state.deathDanceBattleCount||0));element='physical';fx='slash';label='死線の剣舞';}
      if(element==='fire') mult *= (1 + (st.fireDmg||0));
      if(element==='thunder') mult *= (1 + (st.thunderDmg||0));
      const crit = Math.random() < (st.crit||0);
      let dmg = calcHeroDamage9960(st, mult, element, crit);
      if(state.debug && state.debug.killEnemy){ dmg = state.enemyHp; }
      let absorbed=false, resisted=false;
      if(element==='fire' && state.enemy.fireAbsorb){
        state.enemyHp=Math.min(state.enemy.maxHp, state.enemyHp + dmg);
        absorbed=true;
      }else{
        if(element==='fire' && state.enemy.fireResist){ dmg=Math.max(1, Math.floor(dmg*(1-state.enemy.fireResist))); resisted=true; }
        if(typeof isSpeciesBoss === 'function' && isSpeciesBoss()) dmg = Math.max(1, Math.floor(dmg * (1 - bossCommonDamageReduction())));
        if(state.enemy?.bossBuff === 'apex') dmg = Math.max(1, Math.floor(dmg * 0.5));
        if(typeof isDarkSwordSaint === 'function' && isDarkSwordSaint()){
          const auraReduce = Math.min(1, (typeof darkAuraStacks === 'function' ? darkAuraStacks() : 0) * 0.10);
          dmg = Math.max(0, Math.floor(dmg * (1 - auraReduce)));
        }
        state.enemyHp=Math.max(0, state.enemyHp - dmg);
        if(state.enemy?.bossBuff === 'acid_body' && state.enemyHp <= 0){
          state.enemyHp = 0; state.enemy.dead = true; state.enemy.defeated = true;
          if(typeof renderBattle === 'function') renderBattle();
          if(typeof enemyDefeated === 'function') enemyDefeated();
          return;
        }
        if(state.enemy?.bossBuff === 'acid_body' && dmg > 0 && !state.enemy.dead && !state.enemy.defeated){
          const ref = Math.max(1, Math.floor(dmg * 0.10));
          state.hp = Math.max(0, state.hp - ref);
          if(typeof showHeroFloat === 'function') showHeroFloat(`反射 ${ref}`, 'acid');
          if(state.hp <= 0){ if(typeof tryHeroDeathDance === 'function' && tryHeroDeathDance()) return; if(typeof handleHeroDeath === 'function') handleHeroDeath(); return; }
        }
        if(state.enemy?.bossBuff === 'spirit_king'){ safe(()=>addBurn('hero')); if(typeof log === 'function') log('精霊王の炎が騎士に火傷を刻んだ。','danger'); }
      }
      if(typeof showFx === 'function') showFx(fx);
      if(typeof playSfx === 'function') playSfx(skill==='fire'?'fire':skill==='thunder'?'thunder':skill==='heavy'?'heavy':'slash');
      if(skill==='heavy') { document.querySelector('.battle-panel')?.classList.add('shake'); setTimeout(()=>document.querySelector('.battle-panel')?.classList.remove('shake'),260); }
      if(absorbed){ if(typeof showFloat === 'function') showFloat(`吸収 +${dmg}`,'heal'); if(typeof log === 'function') log(`${state.enemy.name} は火属性を吸収した！`,'danger'); }
      else { if(typeof showFloat === 'function') showFloat(`${crit?'CRIT! ':''}${dmg}${resisted?' 半減':''}`, crit?'crit':skill==='fire'?'fire':skill==='thunder'?'thunder':'damage'); }
      if(!absorbed && els?.enemyCard){ els.enemyCard.classList.remove('hit'); void els.enemyCard.offsetWidth; els.enemyCard.classList.add('hit'); setTimeout(()=>els.enemyCard.classList.remove('hit'),220); }
      safe(()=>{ if(typeof tryApplyHeroHitDebuffs === 'function') tryApplyHeroHitDebuffs(element, absorbed, skill); });
      if(!absorbed && (skill==='fire'||skill==='thunder'||skill==='heavy'||skill==='deathdance') && typeof log === 'function') log(`${label}（${typeof elementName === 'function' ? elementName(element) : element}）！ ${dmg}ダメージ`, 'skilllog');
      if((st.lifeSteal||0) && !absorbed){ const heal=Math.floor(dmg*st.lifeSteal); if(heal>0){state.hp=Math.min(maxHp(),state.hp+heal); if(typeof showHeroFloat === 'function') showHeroFloat(`+${heal}`,'heal');} }
      if(state.enemyHp<=0){
        state.enemyHp = 0;
        if(typeof renderBattle === 'function') renderBattle();
        if(typeof tryDarkSwordDanceRevive === 'function' && tryDarkSwordDanceRevive()) return;
        setTimeout(enemyDefeated, 120);
        return;
      }
      if(typeof renderBattle === 'function') renderBattle();
    };
  }

  function renderEnemyLevelXp9960(){
    safe(()=>{
      if(typeof state === 'undefined') return;
      if(state.enemyLevelXp == null) loadEnemyLevelXp9960();
      const panel = document.querySelector('.hero-stats .stat-grid');
      if(!panel) return;
      let labelEl = document.getElementById('statEnemyLevelXpLabel');
      let valEl = document.getElementById('statEnemyLevelXp');
      if(!labelEl){
        labelEl = document.createElement('span'); labelEl.id='statEnemyLevelXpLabel'; labelEl.textContent='敵Lv経験値';
        valEl = document.createElement('b'); valEl.id='statEnemyLevelXp';
        panel.appendChild(labelEl); panel.appendChild(valEl);
      }
      if(valEl) valEl.textContent = `${Math.max(0, Math.floor(Number(state.enemyLevelXp)||0))} / ${ENEMY_LEVEL_XP_NEXT}`;
    });
  }
  if(typeof renderStats === 'function' && !window.__mbhRenderStats9960){
    window.__mbhRenderStats9960 = renderStats;
    renderStats = function(){ const r = window.__mbhRenderStats9960.apply(this, arguments); renderEnemyLevelXp9960(); return r; };
  }
  if(typeof resetUserData === 'function' && !window.__mbhResetUserData9960){
    window.__mbhResetUserData9960 = resetUserData;
    resetUserData = function(){ const r = window.__mbhResetUserData9960.apply(this, arguments); state.enemyLevelXp = 0; saveEnemyLevelXp9960(); return r; };
  }

  function boot9960(){ loadEnemyLevelXp9960(); syncVersion9960(); renderEnemyLevelXp9960(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot9960, {once:true}); else setTimeout(boot9960,0);
  window.addEventListener('load', boot9960, {once:true});
  setInterval(()=>{ syncVersion9960(); renderEnemyLevelXp9960(); saveEnemyLevelXp9960(); }, 1500);
})();

/* ver.0.2.9: 敵Lv経験値完全固定 + 敵攻撃を防御軽減式へ変更 */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  const ENEMY_LEVEL_XP_KEY_NEW = 'mini-browser-hero-enemy-level-xp-v9961';
  const ENEMY_LEVEL_XP_KEY_OLD = 'mini-browser-hero-enemy-level-xp-v9960';
  const ENEMY_LEVEL_XP_NEXT = 1000;
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH 0.1.3]', e); } }
  function syncVersion9961(){
    safe(()=>{ window.APP_VERSION = APP_VERSION; window.GAME_VERSION = APP_VERSION; document.documentElement.dataset.buildVersion = APP_VERSION; });
    safe(()=>{ document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+APP_VERSION; }); });
    safe(()=>{ document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+APP_VERSION; }); });
    safe(()=>{ const tt=document.querySelector('#mbhTraceBox .debug-trace-title'); if(tt) tt.textContent='進行デバッグログ ver.'+APP_VERSION; });
  }
  function loadEnemyLevelXp9961(){
    safe(()=>{
      if(typeof state === 'undefined') return;
      const rawNew = localStorage.getItem(ENEMY_LEVEL_XP_KEY_NEW);
      const rawOld = localStorage.getItem(ENEMY_LEVEL_XP_KEY_OLD);
      const v = Number(rawNew != null ? rawNew : rawOld);
      state.enemyLevelXp = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : Math.max(0, Math.floor(Number(state.enemyLevelXp)||0));
    });
  }
  function saveEnemyLevelXp9961(){
    safe(()=>{
      if(typeof state === 'undefined') return;
      const v = String(Math.max(0, Math.floor(Number(state.enemyLevelXp)||0)));
      localStorage.setItem(ENEMY_LEVEL_XP_KEY_NEW, v);
      localStorage.setItem(ENEMY_LEVEL_XP_KEY_OLD, v);
    });
  }
  function isBossType9961(e){ return !!e && (e.type === 'ボス' || e.type === '裏ボス'); }
  function enemyLevel9961(e){ return Math.max(1, Math.floor(Number(e?.level)||Number(state?.enemyLevelBase)||Number(state?.level)||1)); }
  function variantKind9961(e){ return e?.variant?.type || e?.variantType || ''; }
  function enemyLevelXpBaseGain9961(e){
    if(!e || e.id === 'dark_sword_saint') return 0;
    if(isBossType9961(e)) return 1000;
    if(variantKind9961(e) === 'named') return 120;
    if(variantKind9961(e) === 'strong') return 80;
    return 50;
  }
  function enemyLevelXpGain9961(e){
    const base = enemyLevelXpBaseGain9961(e);
    if(!base) return 0;
    const targetLv = Math.max(1, Math.floor(Number(state?.enemyLevelBase)||enemyLevel9961(e)));
    const diff = enemyLevel9961(e) - targetLv;
    const mult = diff >= 0 ? (1 + diff * 0.10) : Math.max(0.10, 1 + diff * 0.10);
    return Math.max(1, Math.ceil(base * mult));
  }
  function addEnemyLevelXp9961(e){
    if(typeof state === 'undefined' || !e) return;
    loadEnemyLevelXp9961();
    const lv = enemyLevel9961(e);
    if(e.id === 'dark_sword_saint'){
      if(state.darkSwordSaintReturn && state.darkSwordSaintReturn.milestoneDarkSaint){
        const before = Math.max(1, Math.floor(Number(state.enemyLevelBase)||lv));
        state.enemyLevelBase = Math.max(before, lv) + 1;
        state.enemyLevelXp = 0;
        state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
        if(typeof log === 'function') log(`100レベルの試練突破！ 敵レベルがLv.${before}→Lv.${state.enemyLevelBase}に上昇。`, 'system');
      }
      saveEnemyLevelXp9961();
      return;
    }
    const gain = enemyLevelXpGain9961(e);
    let beforeBase = Math.max(1, Math.floor(Number(state.enemyLevelBase)||lv));
    state.enemyLevelXp = Math.max(0, Math.floor(Number(state.enemyLevelXp)||0)) + gain;
    let up = 0;
    while(state.enemyLevelXp >= ENEMY_LEVEL_XP_NEXT){
      state.enemyLevelXp -= ENEMY_LEVEL_XP_NEXT;
      up++;
    }
    if(up > 0){
      state.enemyLevelBase = Math.max(beforeBase, lv) + up;
      state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
      if(typeof log === 'function') log(`敵Lv経験値 +${gain}。敵レベルがLv.${beforeBase}→Lv.${state.enemyLevelBase}に上昇。`, 'system');
    }else{
      // ここで敵Lvを抽選上昇させない。経験値のみ貯める。
      state.enemyLevelBase = beforeBase;
      if(typeof log === 'function') log(`敵Lv経験値 +${gain}（${state.enemyLevelXp}/${ENEMY_LEVEL_XP_NEXT}）`, 'system');
    }
    saveEnemyLevelXp9961();
  }
  // 旧10%抽選や旧パッチを完全に上書き
  window.__mbhUpdateEnemyLevelProgression9961 = updateEnemyLevelProgressionOnDefeat;
  updateEnemyLevelProgressionOnDefeat = function(e){ addEnemyLevelXp9961(e); };

  // 敵ステータス再調整：HPは0.1.3方針維持、攻撃力は防御装備が意味を持つ範囲まで上昇
  const prevMakeScaledEnemy9961 = (typeof makeScaledEnemy === 'function') ? makeScaledEnemy : null;
  if(prevMakeScaledEnemy9961){
    makeScaledEnemy = function(base, forceLevel=null){
      const e = prevMakeScaledEnemy9961.apply(this, arguments);
      safe(()=>{
        if(!e || !base || e.id === 'dark_sword_saint') return;
        const lv = enemyLevel9961(e);
        const boss = isBossType9961(e);
        const variant = variantKind9961(e);
        let hp = Math.floor((Number(base.hp)||1) * (1 + lv * (boss ? 0.18 : 0.12)));
        if(variant === 'named') hp = Math.floor(hp * 2.0);
        else if(variant === 'strong') hp = Math.floor(hp * 1.5);
        e.maxHp = Math.max(1, hp);
        // Lv100で雑魚もちゃんと痛い。防御で軽減される前提の攻撃値。
        const atkLvScale = 1 + Math.max(0, lv - 1) * 0.10;
        let atk = Math.floor((Number(base.atk)||1) * atkLvScale * (boss ? 2.85 : 2.25));
        if(variant === 'named') atk = Math.floor(atk * 1.25);
        else if(variant === 'strong') atk = Math.floor(atk * 1.10);
        e.atk = Math.max(1, atk);
        let def = Math.floor((Number(base.def)||0) * 2 + lv * (boss ? 2.0 : 1.35));
        if(variant === 'named') def = Math.floor(def * 1.10);
        e.def = Math.max(0, def);
        e.__v9961Scaled = true;
      });
      return e;
    };
  }

  function enemyDamage9961(e, st, element){
    let atk = (Number(e?.atk)||1) * (1 + (typeof darkSwordBuffCount === 'function' ? darkSwordBuffCount() * 0.5 : 0));
    const bossPierce = (typeof bossCommonDefensePierce === 'function') ? bossCommonDefensePierce() : 0;
    let def = Math.max(0, (Number(st.def)||0) * (typeof heroDefenseMultiplier === 'function' ? heroDefenseMultiplier() : 1) * (1 - bossPierce));
    // 防御は軽減式。防御が高いほど確実に被ダメが下がるが、完全1ダメ化しにくい。
    let raw = atk * (0.90 + Math.random() * 0.35);
    let dmg = Math.max(1, Math.floor(raw * (100 / (100 + def))));
    if(element === 'fire') dmg = Math.max(0, Math.floor(dmg * (1 - (Number(st.fireRes)||0))));
    return Math.max(1, dmg);
  }
  if(typeof enemyAttack === 'function'){
    window.__mbhEnemyAttack9961 = enemyAttack;
    enemyAttack = function(now){
      if(state.dragonBreathActive) return;
      state.lastEnemyAttack = now;
      const e = state.enemy, st = calcStats();
      if(!e) return;
      if(typeof isDragonEnemy === 'function' && isDragonEnemy()){
        if(typeof ensureStatusContainers === 'function') ensureStatusContainers();
        state.enemyStatuses.dragonBreathCount = (Number(state.enemyStatuses?.dragonBreathCount)||0) + 1;
        if(state.enemyStatuses.dragonBreathCount >= 5){
          state.enemyStatuses.dragonBreathCount = 0;
          if(typeof dragonFireBreath === 'function') dragonFireBreath();
          return;
        }
        if(typeof renderStatusLists === 'function') renderStatusLists();
      }
      if(typeof isDarkSwordSaint === 'function' && isDarkSwordSaint() && state.enemyStatuses?.darkTechniqueAwakened){
        if(typeof startDarkSwordTechnique === 'function') startDarkSwordTechnique(false);
        if(typeof renderBattle === 'function') renderBattle();
        return;
      }
      const isPureFireAttacker = e && (e.id === 'fire_spirit' || e.id === 'fire_king');
      let element = (typeof isDarkSwordSaint === 'function' && isDarkSwordSaint()) ? 'dark' : (isPureFireAttacker ? 'fire' : (e.element==='fire' && Math.random()<.55 ? 'fire':'normal'));
      let name = element==='dark' ? '暗黒攻撃' : (e.enemySkill && element==='fire' ? e.enemySkill:'攻撃');
      if(Math.random() < (st.guard||0)){
        if(typeof showHeroFloat === 'function') showHeroFloat('GUARD','guard');
        if(typeof playSfx === 'function') playSfx('guard');
        if(typeof log === 'function') log(`${e.name} の${name}をGUARD！`,'good');
        return;
      }
      let dmg = enemyDamage9961(e, st, element);
      if(state.debug && state.debug.killHero){ dmg = Math.max(dmg, state.hp + 999999); }
      if(typeof applyDarkShieldToDamage === 'function') dmg = applyDarkShieldToDamage(dmg);
      if(state.hp - dmg <= 0){
        if(typeof tryHeroDeathDance === 'function' && tryHeroDeathDance()) return;
        state.hp = 0;
        if(typeof renderBattle === 'function') renderBattle();
        if(typeof handleHeroDeath === 'function') handleHeroDeath();
        return;
      }
      state.hp = Math.max(0, state.hp - dmg);
      if(element === 'fire' && st.fireDamageHeal){
        const heal = Math.floor(dmg * st.fireDamageHeal);
        if(heal > 0){ state.hp = Math.min(maxHp(), state.hp + heal); if(typeof showHeroFloat === 'function') showHeroFloat(`+${heal}`,'heal'); if(typeof log === 'function') log(`炎属性被ダメ回復 +${heal}`,'good'); }
      }
      if(els?.heroCard){ els.heroCard.classList.remove('hit'); void els.heroCard.offsetWidth; els.heroCard.classList.add('hit'); setTimeout(()=>els.heroCard.classList.remove('hit'),220); }
      if(typeof showHeroFloat === 'function') showHeroFloat(dmg, element==='fire'?'fire':(element==='dark'?'dark':'damage'));
      if(typeof playSfx === 'function') playSfx('hit');
      if(typeof tryApplyEnemyHitDebuffs === 'function') tryApplyEnemyHitDebuffs(element);
      if(typeof isDarkSwordSaint === 'function' && isDarkSwordSaint()){
        if(typeof ensureStatusContainers === 'function') ensureStatusContainers();
        if(!state.enemyStatuses.darkTechniqueAwakened && element === 'dark' && dmg === 1){
          state.enemyStatuses.darkOneDamageCount = (state.enemyStatuses.darkOneDamageCount || 0) + 1;
          if(state.enemyStatuses.darkOneDamageCount >= 20){
            state.enemyStatuses.darkTechniqueAwakened = true;
            state.enemyStatuses.darkOneDamageCount = 20;
            if(typeof log === 'function') log('1ダメージを20回見切った。暗黒剣聖が暗黒剣技へ覚醒！','danger');
            setTimeout(()=>{ if(typeof startDarkSwordTechnique === 'function') startDarkSwordTechnique(true); }, 80);
          }
        }
      }
      if(typeof log === 'function') log(`${e.name} の${name}！ ${dmg}ダメージ`, element==='fire'?'danger':'');
      if(typeof renderBattle === 'function') renderBattle();
    };
  }

  function renderEnemyLevelXp9961(){
    safe(()=>{
      if(typeof state === 'undefined') return;
      loadEnemyLevelXp9961();
      const panel = document.querySelector('.hero-stats .stat-grid');
      if(!panel) return;
      let labelEl = document.getElementById('statEnemyLevelXpLabel');
      let valEl = document.getElementById('statEnemyLevelXp');
      if(!labelEl){
        labelEl = document.createElement('span'); labelEl.id='statEnemyLevelXpLabel'; labelEl.textContent='敵Lv経験値';
        valEl = document.createElement('b'); valEl.id='statEnemyLevelXp';
        panel.appendChild(labelEl); panel.appendChild(valEl);
      }
      if(valEl) valEl.textContent = `${Math.max(0, Math.floor(Number(state.enemyLevelXp)||0))} / ${ENEMY_LEVEL_XP_NEXT}`;
    });
  }
  if(typeof renderStats === 'function'){
    const prevRenderStats9961 = renderStats;
    renderStats = function(){ const r = prevRenderStats9961.apply(this, arguments); renderEnemyLevelXp9961(); return r; };
  }
  if(typeof resetUserData === 'function'){
    const prevReset9961 = resetUserData;
    resetUserData = function(){ const r = prevReset9961.apply(this, arguments); state.enemyLevelXp = 0; saveEnemyLevelXp9961(); return r; };
  }
  function boot9961(){ loadEnemyLevelXp9961(); syncVersion9961(); renderEnemyLevelXp9961(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot9961, {once:true}); else setTimeout(boot9961,0);
  window.addEventListener('load', boot9961, {once:true});
  setInterval(()=>{ syncVersion9961(); renderEnemyLevelXp9961(); saveEnemyLevelXp9961(); }, 1500);
})();


/* ver.0.2.9: 暗黒剣聖の独立Lv表示 + 主人公必要経験値固定 */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  const HERO_XP_NEXT_FIXED = 40;
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH 0.1.3]', e); } }
  function syncVersion9962(){
    safe(()=>{ window.APP_VERSION = APP_VERSION; window.GAME_VERSION = APP_VERSION; document.documentElement.dataset.buildVersion = APP_VERSION; });
    safe(()=>{ document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+APP_VERSION; }); });
    safe(()=>{ document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+APP_VERSION; }); });
    safe(()=>{ const tt=document.querySelector('#mbhTraceBox .debug-trace-title'); if(tt) tt.textContent='進行デバッグログ ver.'+APP_VERSION; });
  }

  function milestoneTrialLevel9962(){
    const r = (typeof state !== 'undefined') ? state.darkSwordSaintReturn : null;
    if(!r || !r.milestoneDarkSaint) return 0;
    return Math.max(1, Math.floor(Number(r.level)||Number(r.pendingBoss?.level)||Number(state.enemyLevelBase)||1));
  }
  function darkSaintDisplayLevel9962(){
    return Math.max(1, Math.floor(Number(state?.darkSwordSaintLevel)||1));
  }

  // 100レベルごとの試練でも、暗黒剣聖自身は独立Lvで表示・計算する。
  // 通常敵レベル100の試練情報は trialLevel に保持する。
  if(typeof makeScaledEnemy === 'function' && !window.__mbhMakeScaledEnemy9962){
    window.__mbhMakeScaledEnemy9962 = makeScaledEnemy;
    makeScaledEnemy = function(base, forceLevel=null){
      if(base && base.id === 'dark_sword_saint'){
        const trial = Math.max(0, Math.floor(Number(forceLevel)||0));
        const displayLv = darkSaintDisplayLevel9962();
        const e = window.__mbhMakeScaledEnemy9962.call(this, base, displayLv);
        if(trial >= 100){
          e.trialLevel = trial;
          e.trialLabel = `通常敵Lv.${trial}試練`;
        }
        e.level = displayLv;
        return e;
      }
      return window.__mbhMakeScaledEnemy9962.apply(this, arguments);
    };
  }

  // マイルストーン暗黒剣聖の勝利時は、暗黒剣聖Lvではなく試練元の通常敵Lvを+1する。
  if(typeof updateEnemyLevelProgressionOnDefeat === 'function' && !window.__mbhUpdateEnemyLevelProgression9962){
    window.__mbhUpdateEnemyLevelProgression9962 = updateEnemyLevelProgressionOnDefeat;
    updateEnemyLevelProgressionOnDefeat = function(e){
      if(e && e.id === 'dark_sword_saint' && state?.darkSwordSaintReturn?.milestoneDarkSaint){
        const trialLv = Math.max(1, Math.floor(Number(e.trialLevel)||milestoneTrialLevel9962()||Number(state.enemyLevelBase)||1));
        state.enemyLevelBase = trialLv + 1;
        state.enemyLevelXp = 0;
        state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
        try{ localStorage.setItem('mini-browser-hero-enemy-level-xp-v9961','0'); localStorage.setItem('mini-browser-hero-enemy-level-xp-v9960','0'); }catch(_e){}
        if(typeof log === 'function') log(`100レベルの試練突破！ 敵レベルがLv.${trialLv}→Lv.${state.enemyLevelBase}に上昇。暗黒剣聖Lvは独立して成長します。`, 'system');
        return;
      }
      return window.__mbhUpdateEnemyLevelProgression9962.apply(this, arguments);
    };
  }

  // 敗北/逃走時も、マイルストーン処理は試練元通常敵Lvを基準にする。
  function withMilestoneLevelTemporarily9962(fn, args){
    if(!(state?.enemy?.id === 'dark_sword_saint' && state?.darkSwordSaintReturn?.milestoneDarkSaint)){
      return fn.apply(this, args);
    }
    const oldLv = state.enemy.level;
    const trialLv = Math.max(1, Math.floor(Number(state.enemy.trialLevel)||milestoneTrialLevel9962()||oldLv||1));
    state.enemy.level = trialLv;
    try{ return fn.apply(this, args); }
    finally{ if(state.enemy) state.enemy.level = oldLv; }
  }
  if(typeof handleHeroDeath === 'function' && !window.__mbhHandleHeroDeath9962){
    window.__mbhHandleHeroDeath9962 = handleHeroDeath;
    handleHeroDeath = function(){ return withMilestoneLevelTemporarily9962(window.__mbhHandleHeroDeath9962, arguments); };
  }
  if(typeof fleeBattle === 'function' && !window.__mbhFleeBattle9962){
    window.__mbhFleeBattle9962 = fleeBattle;
    fleeBattle = function(){ return withMilestoneLevelTemporarily9962(window.__mbhFleeBattle9962, arguments); };
  }

  // 主人公の必要経験値を固定。レベルアップしても増加させない。
  effectiveXpNext = function(){ return HERO_XP_NEXT_FIXED; };
  checkLevelUp = function(){
    while(state.xp >= HERO_XP_NEXT_FIXED){
      state.xp -= HERO_XP_NEXT_FIXED;
      state.level++;
      state.xpNext = HERO_XP_NEXT_FIXED * 2; // 旧effectiveXpNext互換用。表示は固定40を使う。
      state.hp = (typeof maxHp === 'function') ? maxHp() : state.hp;
      if(typeof showLevelUp === 'function') showLevelUp();
      if(typeof log === 'function') log(`LEVEL UP！ Lv.${state.level}`, 'good');
      const levelTrigger = Math.floor((Number(state.level)||1) / 20);
      if(state.darkSwordSaintFirstEncountered && levelTrigger > Math.max(0, Math.floor(Number(state.darkSwordSaintLastLevelTrigger)||0))){
        state.darkSwordSaintLastLevelTrigger = levelTrigger;
        state.forceNextDarkSwordSaint = true;
        state.pendingBossForNext = null;
        state.pendingDarkSwordSaintDelay = false;
        if(typeof log === 'function') log(`Lv.${state.level}到達。次の敵に暗黒剣聖が確定出現する。`, 'danger');
        if(typeof banner === 'function') banner('暗黒剣聖の試練！', 1800);
      }
    }
  };

  function boot9962(){
    safe(()=>{ if(typeof state !== 'undefined') state.xpNext = HERO_XP_NEXT_FIXED * 2; });
    syncVersion9962();
    safe(()=>{ if(typeof renderAll === 'function') renderAll(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot9962, {once:true}); else setTimeout(boot9962,0);
  window.addEventListener('load', boot9962, {once:true});
  setInterval(syncVersion9962, 1500);
})();

/* ver.0.2.9 hotfix: hero debug stats, dark equipment list visibility, low-level enemy HP trim */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  function safe(fn){ try{return fn();}catch(e){ console.error('[MBH 0.1.3 hotfix]', e); } }
  function esc(s){ return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function pct(v){ return Math.round((Number(v)||0)*100)+'%'; }
  function darkEquipRows(){
    if(typeof state === 'undefined' || !state.equip) return [];
    const rows=[];
    const eq=state.equip || {};
    const hasName=(name)=>Object.values(eq).some(it=>it && it.name===name);
    const hasFlag=(flag)=>Object.values(eq).some(it=>it && it[flag]);
    if(hasName('闇の聖剣')) rows.push(['闇の聖剣','暗黒出血付与10% / 連続攻撃100%']);
    if(hasName('闇の盾') || hasFlag('darkShield')) rows.push(['闇の盾','毎ターン被ダメ軽減+1%(最大50%) / 被ダメ50%回復']);
    if(hasName('闇のアミュレット') || hasFlag('darkAmulet')) rows.push(['闇のアミュレット','死線の剣舞発動率+25% / 効果時間2倍']);
    if(hasName('闇の鎧') || hasFlag('darkArmor')) rows.push(['闇の鎧','火軽減+10% / 火吸収+70%']);
    if(hasName('闇の籠手') || hasFlag('darkGauntlets')) rows.push(['闇の籠手','攻撃力上昇 / 暗黒装備']);
    if(hasName('闇の兜') || hasFlag('darkHelm')) rows.push(['闇の兜','HP・防御力上昇 / 暗黒装備']);
    if(hasName('暗黒の靴') || hasFlag('darkBoots')) rows.push(['暗黒の靴','火吸収+50% / 暗黒装備']);
    return rows;
  }
  function appendDarkRows(container){
    if(!container) return;
    const rows = darkEquipRows();
    if(!rows.length) return;
    container.querySelectorAll('.effect-row.dark-equip-row').forEach(n=>n.remove());
    rows.forEach(([k,v])=>{
      // 既存表示がある場合は重複させない
      const exists=[...container.querySelectorAll('.effect-row span')].some(s=>s.textContent.trim()===k);
      if(exists) return;
      const div=document.createElement('div');
      div.className='effect-row dark-equip-row';
      div.innerHTML=`<span>${esc(k)}</span><b>${esc(v)}</b>`;
      container.appendChild(div);
    });
  }
  function updateDarkEquipOptionProperties(){
    if(typeof state === 'undefined' || !state.equip) return;
    Object.values(state.equip).filter(Boolean).forEach(it=>{
      if(it.name==='闇の鎧'){
        it.darkArmor = true;
        it.fireRes = Math.max(Number(it.fireRes)||0, 0.10);
        it.fireDamageHeal = Math.max(Number(it.fireDamageHeal)||0, 0.70);
      }
      if(it.name==='暗黒の靴'){
        it.darkBoots = true;
        it.fireDamageHeal = Math.max(Number(it.fireDamageHeal)||0, 0.50);
      }
      if(it.name==='闇の籠手') it.darkGauntlets = true;
      if(it.name==='闇の兜') it.darkHelm = true;
    });
  }
  if(typeof itemSummary === 'function' && !window.__mbhItemSummary9962Hotfix){
    window.__mbhItemSummary9962Hotfix = itemSummary;
    itemSummary = function(it){
      let s = window.__mbhItemSummary9962Hotfix.apply(this, arguments) || '';
      const add=[];
      if(it && it.name==='闇の鎧') add.push('闇の鎧：火軽減+10% / 火吸収70%');
      if(it && it.name==='暗黒の靴') add.push('暗黒の靴：火吸収50%');
      if(it && it.name==='闇の籠手') add.push('闇の籠手：暗黒装備');
      if(it && it.name==='闇の兜') add.push('闇の兜：暗黒装備');
      if(add.length) s += (s ? ' / ' : '') + add.join(' / ');
      return s;
    };
  }

  function ensureHeroDebugStatsLine(){
    let line=document.getElementById('heroDebugStatsLine');
    const hp=document.querySelector('.hero-zone .hero-hp');
    if(!line){
      line=document.createElement('div');
      line.id='heroDebugStatsLine';
      line.className='hero-debug-stats-line hidden';
    }
    if(hp && line.parentNode !== hp.parentNode) hp.parentNode.insertBefore(line, hp);
    else if(hp && line.nextSibling !== hp) hp.parentNode.insertBefore(line, hp);
    return line;
  }
  function updateHeroDebugStatsLine(){
    const line=ensureHeroDebugStatsLine();
    if(!line) return;
    const enabled=!!(typeof state!=='undefined' && state.debug && state.debug.showEnemyStats);
    if(!enabled){ line.classList.add('hidden'); line.textContent=''; return; }
    const st=(typeof calcStats==='function') ? calcStats() : {atk:0,def:0};
    line.textContent=`ATK：${Math.floor(Number(st.atk)||0).toLocaleString()}　DEF：${Math.floor(Number(st.def)||0).toLocaleString()}`;
    line.classList.remove('hidden');
  }

  // Lv1の敵HPが重すぎるため、序盤だけ大きく下げつつLv100付近の伸びは残す。
  if(typeof makeScaledEnemy === 'function' && !window.__mbhMakeScaledEnemy9962Hotfix){
    window.__mbhMakeScaledEnemy9962Hotfix = makeScaledEnemy;
    makeScaledEnemy = function(base, forceLevel=null){
      const e=window.__mbhMakeScaledEnemy9962Hotfix.apply(this, arguments);
      safe(()=>{
        if(!e || !base || e.id==='dark_sword_saint') return;
        const lv=Math.max(1, Math.floor(Number(e.level)||1));
        const boss=!!(e.type==='ボス' || e.type==='裏ボス');
        const variant=e.variant?.type || e.variantType || '';
        // Lv1 雑魚: baseの約22% / Lv100 雑魚: 約10.12倍
        // Lv1 ボス: baseの約41% / Lv100 ボス: 約16.25倍
        let hp=Math.floor((Number(base.hp)||1) * ((boss ? 0.25 : 0.12) + lv * (boss ? 0.16 : 0.10)));
        if(variant==='named') hp=Math.floor(hp*2.0);
        else if(variant==='strong') hp=Math.floor(hp*1.5);
        e.maxHp=Math.max(1,hp);
        if(typeof state !== 'undefined' && state.enemy === e) state.enemyHp=Math.min(state.enemyHp||e.maxHp, e.maxHp);
      });
      return e;
    };
  }

  function hotfixRender(){
    safe(updateDarkEquipOptionProperties);
    safe(()=>appendDarkRows(document.querySelector('#statusSpecialEffects .effect-scroll')));
    safe(()=>appendDarkRows(document.querySelector('#equipEffectTotals .effect-scroll')));
    safe(updateHeroDebugStatsLine);
  }
  if(typeof renderBattle === 'function' && !window.__mbhRenderBattle9962Hotfix){
    window.__mbhRenderBattle9962Hotfix = renderBattle;
    renderBattle = function(){ const r=window.__mbhRenderBattle9962Hotfix.apply(this, arguments); hotfixRender(); return r; };
  }
  if(typeof renderStats === 'function' && !window.__mbhRenderStats9962Hotfix){
    window.__mbhRenderStats9962Hotfix = renderStats;
    renderStats = function(){ const r=window.__mbhRenderStats9962Hotfix.apply(this, arguments); hotfixRender(); return r; };
  }
  if(typeof renderEquip === 'function' && !window.__mbhRenderEquip9962Hotfix){
    window.__mbhRenderEquip9962Hotfix = renderEquip;
    renderEquip = function(){ const r=window.__mbhRenderEquip9962Hotfix.apply(this, arguments); hotfixRender(); return r; };
  }
  function boot(){
    safe(()=>{ window.APP_VERSION=APP_VERSION; window.GAME_VERSION=APP_VERSION; document.documentElement.dataset.buildVersion=APP_VERSION; });
    safe(()=>{ document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+APP_VERSION; }); });
    hotfixRender();
    safe(()=>{ if(typeof renderAll==='function') renderAll(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else setTimeout(boot,0);
  window.addEventListener('load', boot, {once:true});
  setInterval(hotfixRender, 1200);
})();

/* ver.0.2.9: 装備名・接頭辞・説明文を実効果へ統一 */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  const DARK_FIXED_NAMES = new Set(['闇の聖剣','闇の盾','闇のアミュレット','闇の鎧','闇の籠手','闇の兜','暗黒の靴']);
  const DARK_NAME_BY_SLOT = { '武器':'闇の聖剣', '盾':'闇の盾', 'アミュレット':'闇のアミュレット', '鎧':'闇の鎧', '腕':'闇の籠手', '兜':'闇の兜', '足':'暗黒の靴' };
  const BASE_BY_SLOT = { '武器':'剣', '盾':'盾', '兜':'兜', '鎧':'鎧', '腕':'腕甲', '足':'ブーツ', 'リング':'リング', 'アミュレット':'アミュレット' };
  function safe(fn){ try{ return fn(); }catch(e){ console.warn('[MBH 0.1.3]', e); return null; } }
  function pct(v){ return Math.round((Number(v)||0)*100) + '%'; }
  function num(v){ return Math.floor(Number(v)||0).toLocaleString(); }
  function isDarkItem(it){ return !!it && (it.specialFrame === 'darkholy' || DARK_FIXED_NAMES.has(it.name)); }
  function hasFireEffect(it){ return !!(it && ((Number(it.fireRes)||0) > 0 || (Number(it.fireDamageHeal)||0) > 0 || (Number(it.fireDmg)||0) > 0 || (Number(it.fireSkillChance)||0) > 0 || it.skill?.id === 'fire')); }
  function hasThunderEffect(it){ return !!(it && ((Number(it.thunderDmg)||0) > 0 || (Number(it.thunderSkillChance)||0) > 0 || it.skill?.id === 'thunder')); }
  function hasBleedEffect(it){ return !!(it && ((Number(it.heroDarkBleedChance)||0) > 0 || (Number(it.bleedChance)||0) > 0 || (Number(it.darkBleedChance)||0) > 0)); }
  function hasUnyieldingEffect(it){ return !!(it && ((Number(it.deathDanceChance)||0) > 0 || (Number(it.deathDanceDefIgnore)||0) > 0 || it.darkAmulet || it.masterRegen)); }
  function hasDefenseEffect(it){ return !!(it && ((Number(it.def)||0) > 0 || (Number(it.guard)||0) > 0 || it.darkShield)); }
  function hasSpeedEffect(it){ return !!(it && ((Number(it.attackSpeed)||0) > 0 || it.skill?.id === 'multi')); }
  function hasLifeEffect(it){ return !!(it && ((Number(it.hp)||0) > 0 || (Number(it.lifeSteal)||0) > 0 || it.masterRegen)); }
  function darkCanonicalName(it){ return DARK_NAME_BY_SLOT[it?.slot] || it?.name || '闇装備'; }
  function neutralName(it){
    const slot = it?.slot || '装備';
    if(slot === '武器') return '鉄の剣';
    if(slot === '盾') return '守りの盾';
    if(slot === '兜') return '革の兜';
    if(slot === '鎧') return '旅人の鎧';
    if(slot === '腕') return '革の腕甲';
    if(slot === '足') return '革のブーツ';
    if(slot === 'リング') return '銀のリング';
    if(slot === 'アミュレット') return '勇気のアミュレット';
    return slot;
  }
  function effectPrefix(it){
    // 効果がある時だけ接頭辞を付ける。火効果なしの火守、雷効果なしの雷鳴は絶対に出さない。
    if(hasFireEffect(it)) return '火守';
    if(hasThunderEffect(it)) return '雷鳴';
    if(hasBleedEffect(it)) return '血染め';
    if(hasUnyieldingEffect(it)) return '不屈';
    if(hasSpeedEffect(it)) return '俊足';
    if(hasDefenseEffect(it)) return '鉄壁';
    if(hasLifeEffect(it)) return '生命';
    return '';
  }
  function canonicalName(it){
    if(!it) return '';
    if(it.name === '師匠のアミュレット') return '師匠のアミュレット';
    if(isDarkItem(it)) return darkCanonicalName(it);
    const prefix = effectPrefix(it);
    const base = BASE_BY_SLOT[it.slot] || it.slot || '装備';
    return prefix ? `${prefix}の${base}` : neutralName(it);
  }
  function sanitizeItemName9969(it){
    if(!it) return it;
    const before = String(it.name || '');
    // 古い説明文・誤説明を消す。説明は itemSummary で実効果から生成する。
    if(it.flavor && /(神秘|影響|詠唱|ブーツ|靴|兜|鎧|籠手|腕甲|リング|アミュレット)/.test(String(it.flavor))){
      it.flavor = '';
    }
    const after = canonicalName(it);
    if(after) it.name = after;
    // 火属性効果がないのに火系名だった既存品を中立名へ戻す。
    if(!hasFireEffect(it) && /火|炎|火守/.test(before) && /火|炎|火守/.test(String(it.name))){
      it.name = neutralName(it);
    }
    // 雷効果なしの雷名も戻す。
    if(!hasThunderEffect(it) && /雷|雷鳴/.test(before) && /雷|雷鳴/.test(String(it.name))){
      it.name = neutralName(it);
    }
    return it;
  }
  function sanitizeAllItems9969(){
    safe(()=>{ if(state?.equip) Object.values(state.equip).forEach(sanitizeItemName9969); });
    safe(()=>{ if(Array.isArray(state?.inventory)) state.inventory.forEach(sanitizeItemName9969); });
  }
  function itemSummary9969(it){
    if(!it) return '';
    sanitizeItemName9969(it);
    const arr = [];
    if(it.itemLevel) arr.push(`ドロップLv${Math.max(1, Math.floor(Number(it.itemLevel)||1))}`);
    arr.push(`品質+${Math.max(0, Math.floor(Number(it.level)||0))}`);
    if(it.atk) arr.push(`攻撃力+${num(it.atk)}`);
    if(it.def) arr.push(`防御力+${num(it.def)}`);
    if(it.hp) arr.push(`HP+${num(it.hp)}`);
    if(it.fireRes) arr.push(`火軽減${pct(it.fireRes)}`);
    if(it.fireDamageHeal) arr.push(`火吸収${pct(it.fireDamageHeal)}`);
    if(it.fireDmg) arr.push(`火ダメージ+${pct(it.fireDmg)}`);
    if(it.fireSkillChance) arr.push(`炎斬り発動率+${pct(it.fireSkillChance)}`);
    if(it.thunderDmg) arr.push(`雷ダメージ+${pct(it.thunderDmg)}`);
    if(it.thunderSkillChance) arr.push(`雷撃発動率+${pct(it.thunderSkillChance)}`);
    if(it.deathDanceChance) arr.push(`死線の剣舞発動率+${pct(it.deathDanceChance)}`);
    if(it.deathDanceDefIgnore) arr.push(`死線の剣舞防御無視${pct(it.deathDanceDefIgnore)}`);
    if(it.heroDarkBleedChance) arr.push(`暗黒出血付与${pct(it.heroDarkBleedChance)}`);
    if(it.lifeSteal) arr.push(`HP吸収${pct(it.lifeSteal)}`);
    if(it.guard) arr.push(`ガード率+${pct(it.guard)}`);
    if(it.crit) arr.push(`会心率+${pct(it.crit)}`);
    if(it.darkShield) arr.push('毎ターン被ダメ軽減+1%（最大50%）');
    if(it.darkShield) arr.push('被ダメージ50%回復');
    if(it.darkAmulet) arr.push('死線の剣舞時間2倍');
    if(it.masterRegen){
      const rate = (typeof masterAmuletRegenRate === 'function') ? masterAmuletRegenRate() : 0.03;
      arr.push(`10秒ごとにHP${(rate*100).toFixed(1)}%回復`);
      arr.push('撃破時HP25%回復');
    }
    if(it.skill){
      let extra = 0;
      if(it.skill.id === 'fire') extra = Number(it.fireSkillChance)||0;
      if(it.skill.id === 'thunder') extra = Number(it.thunderSkillChance)||0;
      arr.push(`武器スキル:${it.skill.name} ${pct((Number(it.skill.chance)||0)+extra)}`);
      if(it.skill.id === 'thunder') arr.push('雷撃:防御25%無視');
      if(it.skill.id === 'fire') arr.push('炎斬り:火傷20%');
    }
    // 説明文末尾に別装備名や未使用文言を出さないため、flavorは表示しない。
    return arr.join(' / ');
  }
  function syncVersion9969(){
    safe(()=>{ window.APP_VERSION=APP_VERSION; window.GAME_VERSION=APP_VERSION; document.documentElement.dataset.buildVersion=APP_VERSION; });
    safe(()=>{ document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+APP_VERSION; }); });
    safe(()=>{ document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+APP_VERSION; }); });
    safe(()=>{ const t=document.querySelector('#mbhTraceBox .debug-trace-title'); if(t) t.textContent='進行デバッグログ ver.'+APP_VERSION; });
  }
  function patchDarkMakers9969(){
    function wrap(name){
      const old = safe(()=>eval(name));
      if(typeof old !== 'function' || old.__mbh9969Wrapped) return;
      const wrapped = function(){
        const it = old.apply(this, arguments);
        sanitizeItemName9969(it);
        return it;
      };
      wrapped.__mbh9969Wrapped = true;
      safe(()=>eval(name + ' = wrapped'));
      safe(()=>{ window[name] = wrapped; });
    }
    ['makeDarkHolySword','makeDarkShield','makeDarkAmulet','makeDarkArmor','makeDarkGauntlets','makeDarkHelm','makeDarkBoots'].forEach(wrap);
  }
  function patchMakeItem9969(){
    if(typeof makeItem === 'function' && !window.__mbhMakeItem9969){
      window.__mbhMakeItem9969 = makeItem;
      makeItem = function(){
        const it = window.__mbhMakeItem9969.apply(this, arguments);
        return sanitizeItemName9969(it);
      };
    }
    if(typeof makeRandomItem === 'function' && !window.__mbhMakeRandomItem9969){
      window.__mbhMakeRandomItem9969 = makeRandomItem;
      makeRandomItem = function(){
        const it = window.__mbhMakeRandomItem9969.apply(this, arguments);
        return sanitizeItemName9969(it);
      };
    }
  }
  function patchRender9969(){
    if(typeof itemSummary === 'function' && !window.__mbhItemSummary9969){
      window.__mbhItemSummary9969 = itemSummary;
      itemSummary = itemSummary9969;
      window.itemSummary = itemSummary9969;
    }
    if(typeof renderInventory === 'function' && !window.__mbhRenderInventory9969){
      window.__mbhRenderInventory9969 = renderInventory;
      renderInventory = function(){ sanitizeAllItems9969(); return window.__mbhRenderInventory9969.apply(this, arguments); };
    }
    if(typeof renderEquip === 'function' && !window.__mbhRenderEquip9969){
      window.__mbhRenderEquip9969 = renderEquip;
      renderEquip = function(){ sanitizeAllItems9969(); return window.__mbhRenderEquip9969.apply(this, arguments); };
    }
    if(typeof showTip === 'function' && !window.__mbhShowTip9969){
      window.__mbhShowTip9969 = showTip;
      showTip = function(e,it){ sanitizeItemName9969(it); return window.__mbhShowTip9969.apply(this, arguments); };
    }
  }
  function boot9969(){
    syncVersion9969();
    patchMakeItem9969();
    patchDarkMakers9969();
    patchRender9969();
    sanitizeAllItems9969();
    safe(()=>{ if(typeof renderAll === 'function') renderAll(); });
    safe(()=>{ if(typeof scheduleSave === 'function') scheduleSave(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot9969, {once:true}); else setTimeout(boot9969, 0);
  window.addEventListener('load', boot9969, {once:true});
  setInterval(syncVersion9969, 1500);
})();


/* ver.0.2.9: final XP single-source correction */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  const HERO_XP_NEXT = 1000;
  function safe(fn){ try{ return fn && fn(); }catch(e){ console.warn('[MBH 0.1.3 final]', e); } }
  function syncFinalVersion(){
    window.APP_VERSION = APP_VERSION;
    window.GAME_VERSION = APP_VERSION;
    document.documentElement.dataset.buildVersion = APP_VERSION;
    document.querySelectorAll('.build-version').forEach(el=>{ el.textContent = 'ver.' + APP_VERSION; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ver.' + APP_VERSION; });
    document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent = '進行デバッグログ ver.' + APP_VERSION; });
  }
  effectiveXpNext = function(){ state.xpNext = HERO_XP_NEXT; return HERO_XP_NEXT; };
  totalCurrentExp = function(){ return Math.max(1, (Math.max(1, Math.floor(Number(state.level)||1))-1) * HERO_XP_NEXT + Math.max(0, Math.floor(Number(state.xp)||0))); };
  heroEnemyLevelDiffMultiplier = function(e){
    const enemyLv = Math.max(1, Math.floor(Number(e?.level) || Number(state.enemyLevelBase) || 1));
    const heroLv = Math.max(1, Math.floor(Number(state.level) || 1));
    const diff = enemyLv - heroLv;
    return diff >= 0 ? (1 + diff * 0.10) : Math.max(0.10, 1 + diff * 0.10);
  };
  calcHeroExpBase = function(e){
    if(!e) return 1;
    if(e.id === 'dark_sword_saint') return 1000;
    if(e.type === 'ボス' || e.type === '裏ボス') return 400;
    const kind = e.variant?.type || e.variantType || '';
    if(kind === 'named') return 100;
    if(kind === 'strong') return 75;
    return 50;
  };
  calcHeroExpGain = function(e){ return Math.max(1, Math.ceil(calcHeroExpBase(e) * heroEnemyLevelDiffMultiplier(e))); };
  checkLevelUp = function(){
    state.xpNext = HERO_XP_NEXT;
    while(state.xp >= HERO_XP_NEXT){
      state.xp -= HERO_XP_NEXT;
      state.level++;
      state.xpNext = HERO_XP_NEXT;
      state.hp = maxHp();
      showLevelUp();
      log(`LEVEL UP！ Lv.${state.level}`,'good');
      const levelTrigger = Math.floor((Number(state.level)||1) / 20);
      if(state.darkSwordSaintFirstEncountered && levelTrigger > Math.max(0, Math.floor(Number(state.darkSwordSaintLastLevelTrigger)||0))){
        state.darkSwordSaintLastLevelTrigger = levelTrigger;
        state.forceNextDarkSwordSaint = true;
        state.pendingBossForNext = null;
        state.pendingDarkSwordSaintDelay = false;
        log(`Lv.${state.level}到達。次の敵に暗黒剣聖が確定出現する。`, 'danger');
        banner('暗黒剣聖の試練！', 1800);
      }
    }
  };
  const oldEnemyDefeated = enemyDefeated;
  enemyDefeated = function(){
    const e = state.enemy;
    if(e) e.xp = calcHeroExpGain(e);
    return oldEnemyDefeated.apply(this, arguments);
  };
  const oldRenderBattle = renderBattle;
  renderBattle = function(){ state.xpNext = HERO_XP_NEXT; return oldRenderBattle.apply(this, arguments); };
  const oldRenderStats = renderStats;
  renderStats = function(){ state.xpNext = HERO_XP_NEXT; return oldRenderStats.apply(this, arguments); };
  safe(()=>{ state.xpNext = HERO_XP_NEXT; syncFinalVersion(); renderAll(); });
  setInterval(syncFinalVersion, 2500);
})();


/* ver.APP_VERSION: variant badge/regen float/legal links visibility final fix */
(function(){
  'use strict';
  const APP_VERSION = '0.2.9';
  function safe(fn){ try{ return fn && fn(); }catch(e){ console.warn('[MBH variant/legal fix]', e); return null; } }
  function syncVersion012(){
    safe(()=>{ window.APP_VERSION = APP_VERSION; window.GAME_VERSION = APP_VERSION; document.documentElement.dataset.buildVersion = APP_VERSION; });
    safe(()=>{ document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+APP_VERSION; }); });
    safe(()=>{ document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+APP_VERSION; }); });
    safe(()=>{ document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+APP_VERSION; }); });
  }
  function variantLabel012(v){ return v?.type === 'named' ? '異名持ち' : v?.type === 'strong' ? '強個体' : ''; }
  function variantKind012(){ return state?.enemy?.variant?.type || state?.enemy?.variantType || ''; }
  function ensureVariantBadge012(){
    const list = els?.enemyStatusList || document.getElementById('enemyStatusList');
    if(!list) return;
    list.querySelectorAll('[data-status-kind="strong_variant"],[data-status-kind="named_variant"]').forEach(el=>el.remove());
    const kind = variantKind012();
    if(!kind) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'status-badge ' + (kind === 'named' ? 'named-variant' : 'strong-variant');
    btn.dataset.statusKind = kind === 'named' ? 'named_variant' : 'strong_variant';
    btn.dataset.statusTarget = 'enemy';
    btn.textContent = kind === 'named' ? '異名持ち' : '強個体';
    btn.setAttribute('aria-label', btn.textContent + ' の効果を見る');
    list.insertBefore(btn, list.firstChild);
    if(typeof bindStatusBadgeEvents === 'function') bindStatusBadgeEvents();
  }
  const oldStatusTooltip012 = (typeof statusTooltipHtml === 'function') ? statusTooltipHtml : null;
  if(oldStatusTooltip012 && !window.__mbhStatusTooltip012){
    window.__mbhStatusTooltip012 = oldStatusTooltip012;
    statusTooltipHtml = function(kind, target){
      if(kind === 'strong_variant') return '<b>強個体</b><br>HP1.5倍。<br>攻撃力10%アップ。<br>ドロップ品質+10。<br>良い効果が少し付きやすい。';
      if(kind === 'named_variant') return '<b>異名持ち</b><br>HP2倍。<br>攻撃力25%アップ。<br>防御力10%アップ。<br>毎秒最大HP2%回復。<br>ドロップ品質+25。<br>良い効果が付きやすい。';
      return window.__mbhStatusTooltip012.apply(this, arguments);
    };
  }
  const oldRenderStatus012 = (typeof renderStatusLists === 'function') ? renderStatusLists : null;
  if(oldRenderStatus012 && !window.__mbhRenderStatus012){
    window.__mbhRenderStatus012 = oldRenderStatus012;
    renderStatusLists = function(){
      const r = window.__mbhRenderStatus012.apply(this, arguments);
      safe(ensureVariantBadge012);
      return r;
    };
  }
  const oldRenderBattle012 = (typeof renderBattle === 'function') ? renderBattle : null;
  if(oldRenderBattle012 && !window.__mbhRenderBattle012){
    window.__mbhRenderBattle012 = oldRenderBattle012;
    renderBattle = function(){
      const r = window.__mbhRenderBattle012.apply(this, arguments);
      safe(ensureVariantBadge012);
      return r;
    };
  }
  const oldShowFloat012 = (typeof showFloat === 'function') ? showFloat : null;
  if(oldShowFloat012 && !window.__mbhShowFloat012){
    window.__mbhShowFloat012 = oldShowFloat012;
    showFloat = function(text, cls='damage'){
      const c = String(text||'').includes('異名再生') && !String(cls||'').includes('named-regen') ? String(cls||'heal') + ' named-regen' : cls;
      return window.__mbhShowFloat012.call(this, text, c);
    };
  }
  function ensureFixedLegalLinks012(){
    let box = document.getElementById('fixedLegalLinks');
    if(!box){
      box = document.createElement('div');
      box.id = 'fixedLegalLinks';
      box.className = 'fixed-legal-links';
      box.setAttribute('aria-label','公開情報');
      box.innerHTML = '<button type="button" data-legal-open="credit">クレジット</button><button type="button" data-legal-open="terms">利用規約</button><button type="button" data-legal-open="privacy">プライバシー</button>';
      document.body.appendChild(box);
      box.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-legal-open]');
        if(!btn) return;
        e.preventDefault(); e.stopPropagation();
        if(typeof playUiClick === 'function') playUiClick();
        if(typeof openLegalModal === 'function') openLegalModal(btn.dataset.legalOpen);
      });
    }
    document.querySelectorAll('.legal-links').forEach(el=>{ el.classList.remove('hidden'); });
  }
  function boot012(){ syncVersion012(); ensureFixedLegalLinks012(); ensureVariantBadge012(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot012, {once:true}); else setTimeout(boot012,0);
  window.addEventListener('load', boot012, {once:true});
  setInterval(()=>safe(()=>{ syncVersion012(); ensureFixedLegalLinks012(); ensureVariantBadge012(); }), 1000);
})();


/* ver.0.2.9: variant buff list, named regen position, legal links only inside menu, boss low-level tuning, BGM accidental-stop guard */
(function(){
  'use strict';
  const BUILD = (window.APP_VERSION || window.GAME_VERSION || '0.2.9');
  function safe(fn){ try{return fn && fn();}catch(e){ console.error('[MBH0.1.3]', e); return null; } }
  function syncVersion013(){
    window.APP_VERSION = BUILD;
    window.GAME_VERSION = BUILD;
    document.documentElement.dataset.buildVersion = BUILD;
    document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent = 'ver.' + BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ver.' + BUILD; });
    document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent = '進行デバッグログ ver.' + BUILD; });
  }

  function currentVariantKind013(){
    const e = (typeof state !== 'undefined') ? state.enemy : null;
    return e?.variant?.type || e?.variantType || '';
  }
  function variantBadgeKind013(){
    const k = currentVariantKind013();
    return k === 'named' ? 'named_variant' : k === 'strong' ? 'strong_variant' : '';
  }

  // バフ一覧ポップアップ側にも強個体/異名持ちを必ず入れる。
  if(typeof activeStatusEntries === 'function' && !window.__mbhActiveStatus013){
    window.__mbhActiveStatus013 = activeStatusEntries;
    activeStatusEntries = function(target){
      const entries = window.__mbhActiveStatus013.apply(this, arguments) || [];
      if(target === 'enemy'){
        const k = variantBadgeKind013();
        if(k && !entries.some(x=>x && x[0]===k)) entries.unshift([k, 'enemy']);
      }
      return entries;
    };
  }

  // ステータスバッジ側にも再チェック。古い色名/クラス名を表示しない。
  function ensureVariantBadge013(){
    const list = (typeof els !== 'undefined' && els.enemyStatusList) ? els.enemyStatusList : document.getElementById('enemyStatusList');
    if(!list) return;
    list.querySelectorAll('[data-status-kind="strong_variant"],[data-status-kind="named_variant"],.strong-variant,.named-variant').forEach(el=>el.remove());
    const k = variantBadgeKind013();
    if(!k) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'status-badge ' + (k === 'named_variant' ? 'named-variant' : 'strong-variant');
    btn.dataset.statusKind = k;
    btn.dataset.statusTarget = 'enemy';
    btn.textContent = k === 'named_variant' ? '異名持ち' : '強個体';
    btn.setAttribute('aria-label', btn.textContent + ' の効果を見る');
    list.insertBefore(btn, list.firstChild);
    if(typeof bindStatusBadgeEvents === 'function') bindStatusBadgeEvents();
  }

  // 0.1.3の中央上表示をやめ、敵カードの左外へ出す専用クラスにする。
  if(typeof showFloat === 'function' && !window.__mbhShowFloat013){
    window.__mbhShowFloat013 = showFloat;
    showFloat = function(text, cls='damage'){
      let c = String(cls || 'damage');
      if(String(text || '').includes('異名再生')){
        c = c.replace(/\bnamed-regen\b/g,'').trim();
        c = (c ? c + ' ' : '') + 'named-regen-left';
      }
      return window.__mbhShowFloat013.call(this, text, c);
    };
  }

  // クレジット等は常時固定表示しない。メニュー内の最下部だけに表示。
  function syncLegalLinks013(){
    const fixed = document.getElementById('fixedLegalLinks');
    if(fixed) fixed.remove();

    const panel = (typeof els !== 'undefined' && els.sidePanel) ? els.sidePanel : document.querySelector('.side-panel');
    let box = panel ? panel.querySelector('.legal-links') : document.querySelector('.legal-links');
    if(!box && panel){
      box = document.createElement('div');
      box.className = 'legal-links';
      box.setAttribute('aria-label','公開情報');
      box.innerHTML = '<button id="creditBtn" type="button">クレジット</button><button id="termsBtn" type="button">利用規約</button><button id="privacyBtn" type="button">プライバシーポリシー</button>';
      panel.appendChild(box);
    }
    if(!box) return;

    // メニュー表示時だけ表示。PC常時サイドパネル時は表示してOK、スマホ/狭幅ではopen時のみ。
    const compact = (typeof isCompactMenuMode === 'function' ? isCompactMenuMode() : (window.innerWidth < 1280 || window.innerHeight < 760));
    const open = !compact || !!(panel && panel.classList.contains('open'));
    box.classList.toggle('hidden', !open);
    box.classList.toggle('legal-links-in-menu', true);

    const bind = (id, type)=>{
      const btn = document.getElementById(id) || box.querySelector('#'+id);
      if(btn && !btn.__mbhLegal013){
        btn.__mbhLegal013 = true;
        btn.addEventListener('click', (e)=>{
          e.preventDefault(); e.stopPropagation();
          if(typeof playUiClick === 'function') playUiClick();
          if(typeof openLegalModal === 'function') openLegalModal(type);
        });
      }
    };
    bind('creditBtn','credit'); bind('termsBtn','terms'); bind('privacyBtn','privacy');
  }

  // 低レベルボスだけ攻撃/防御を緩和。Lv40で元倍率に戻す。
  if(typeof makeScaledEnemy === 'function' && !window.__mbhMakeScaledEnemy013){
    window.__mbhMakeScaledEnemy013 = makeScaledEnemy;
    makeScaledEnemy = function(base, forceLevel=null){
      const e = window.__mbhMakeScaledEnemy013.apply(this, arguments);
      safe(()=>{
        if(!e || e.id === 'dark_sword_saint') return;
        const boss = e.type === 'ボス' || e.type === '裏ボス';
        const lv = Math.max(1, Math.floor(Number(e.level)||1));
        if(boss && lv <= 40){
          const factor = 0.55 + (lv / 40) * 0.45; // Lv1約56%、Lv40で100%
          e.atk = Math.max(1, Math.floor((Number(e.atk)||1) * factor));
          e.def = Math.max(0, Math.floor((Number(e.def)||0) * factor));
        }
      });
      return e;
    };
  }

  // 空クリック/フォーカス揺れで止まったBGMを即復旧。
  function resumeBgmIfAccidentallyStopped013(){
    safe(()=>{
      if(typeof state === 'undefined' || state.mobileMuted || !state.audioUnlocked) return;
      if(document.hidden) return;
      if(typeof playBgm === 'function') playBgm();
    });
  }
  ['pointerdown','click','touchend'].forEach(type=>{
    document.addEventListener(type, ()=>setTimeout(resumeBgmIfAccidentallyStopped013, 90), {capture:false, passive:true});
  });
  window.addEventListener('focus', ()=>setTimeout(resumeBgmIfAccidentallyStopped013, 80), {capture:false});
  window.addEventListener('blur', ()=>setTimeout(resumeBgmIfAccidentallyStopped013, 120), {capture:false});

  function boot013(){
    safe(syncVersion013);
    safe(syncLegalLinks013);
    safe(ensureVariantBadge013);
    safe(resumeBgmIfAccidentallyStopped013);
  }

  if(typeof renderStatusLists === 'function' && !window.__mbhRenderStatus013){
    window.__mbhRenderStatus013 = renderStatusLists;
    renderStatusLists = function(){ const r=window.__mbhRenderStatus013.apply(this, arguments); safe(ensureVariantBadge013); return r; };
  }
  if(typeof renderBattle === 'function' && !window.__mbhRenderBattle013){
    window.__mbhRenderBattle013 = renderBattle;
    renderBattle = function(){ const r=window.__mbhRenderBattle013.apply(this, arguments); safe(ensureVariantBadge013); safe(syncLegalLinks013); return r; };
  }
  if(typeof syncCompactLayout === 'function' && !window.__mbhSyncCompactLayout013){
    window.__mbhSyncCompactLayout013 = syncCompactLayout;
    syncCompactLayout = function(){ const r=window.__mbhSyncCompactLayout013.apply(this, arguments); safe(syncLegalLinks013); return r; };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot013, {once:true}); else setTimeout(boot013,0);
  window.addEventListener('load', boot013, {once:true});
  window.addEventListener('resize', ()=>setTimeout(syncLegalLinks013, 50));
  setInterval(()=>safe(()=>{ syncVersion013(); syncLegalLinks013(); ensureVariantBadge013(); }), 1200);
})();



/* ver.0.2.9: enemy missing watchdog + debug enemy level/variant restore */
(function(){
  'use strict';
  const BUILD = '0.2.9';
  function safe(fn){ try{ return fn && fn(); }catch(e){ console.warn('[MBH '+BUILD+']', e); return null; } }
  function syncVersion028(){
    safe(()=>{ window.APP_VERSION = BUILD; window.GAME_VERSION = BUILD; document.documentElement.dataset.buildVersion = BUILD; });
    safe(()=>document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent = 'ver.' + BUILD; }));
    safe(()=>document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ver.' + BUILD; }));
    safe(()=>document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent = '進行デバッグログ ver.' + BUILD; }));
  }

  function clearRemovedDebugButtons028(){
    ['debugHp0Kill','debugForceDefeated','debugClearBleed','debugStopDot','debugStopDarkDance'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.remove();
    });
  }

  function currentSpawnLevel028(){
    const st = (typeof state !== 'undefined') ? state : null;
    return Math.max(1, Math.floor(Number(st?.enemy?.level) || Number(st?.enemyLevelBase) || Number(st?.level) || 1));
  }
  function setEnemyLevelBase028(v){
    if(typeof state === 'undefined') return;
    const lv = Math.max(1, Math.floor(Number(v)||1));
    state.enemyLevelBase = lv;
    state.enemyLevelBaseDefeated = Math.max(0, Math.floor(Number(state.defeated)||0));
    if(typeof log === 'function') log('デバッグ：敵出現レベルをLv.' + lv + 'に設定。', 'system');
    if(typeof renderAll === 'function') renderAll();
    if(typeof scheduleSave === 'function') scheduleSave();
    updateDebugEnemyLevelText028();
  }
  function adjustEnemyLevel028(delta){ setEnemyLevelBase028(currentSpawnLevel028() + delta); }
  function forceNextVariant028(kind){
    if(typeof state === 'undefined') return;
    state.debugNextEnemyVariant = kind;
    const label = kind === 'named' ? '異名持ち' : '強個体';
    if(typeof log === 'function') log('デバッグ：次の敵を' + label + 'に設定。', 'system');
    if(typeof scheduleSave === 'function') scheduleSave();
    updateDebugEnemyLevelText028();
  }
  function variantLabel028(kind){ return kind === 'named' ? '異名持ち' : kind === 'strong' ? '強個体' : 'なし'; }
  function updateDebugEnemyLevelText028(){
    const el = document.getElementById('mbhDebugEnemyLevelText');
    if(!el || typeof state === 'undefined') return;
    el.textContent = '現在出現Lv: ' + currentSpawnLevel028() + ' / 次個体: ' + variantLabel028(state.debugNextEnemyVariant);
  }
  function installDebugEnemyControls028(){
    const panel = document.getElementById('debugPanel');
    if(!panel || document.getElementById('mbhDebugEnemyBox')) return;
    const box = document.createElement('div');
    box.id = 'mbhDebugEnemyBox';
    box.className = 'mbh-debug-enemy-box';
    box.innerHTML = `
      <div class="mbh-debug-enemy-title">敵操作</div>
      <div id="mbhDebugEnemyLevelText" class="mbh-debug-enemy-level">現在出現Lv: - / 次個体: なし</div>
      <div class="mbh-debug-enemy-buttons">
        <button type="button" data-mbh-lv="-10">Lv-10</button>
        <button type="button" data-mbh-lv="-5">Lv-5</button>
        <button type="button" data-mbh-lv="5">Lv+5</button>
        <button type="button" data-mbh-lv="10">Lv+10</button>
      </div>
      <div class="mbh-debug-enemy-buttons">
        <button type="button" data-mbh-variant="strong">次 強個体</button>
        <button type="button" data-mbh-variant="named">次 異名持ち</button>
        <button type="button" data-mbh-spawn="1">敵再出現</button>
        <button type="button" data-mbh-clear="1">予約解除</button>
      </div>`;
    const anchor = document.getElementById('debugDarkSwordSaint') || panel.querySelector('.debug-head');
    if(anchor && anchor.parentNode) anchor.insertAdjacentElement('afterend', box);
    else panel.appendChild(box);
    box.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      e.preventDefault(); e.stopPropagation();
      if(typeof playUiClick === 'function') playUiClick();
      if(btn.dataset.mbhLv) adjustEnemyLevel028(Number(btn.dataset.mbhLv));
      if(btn.dataset.mbhVariant) forceNextVariant028(btn.dataset.mbhVariant);
      if(btn.dataset.mbhClear){ if(typeof state !== 'undefined') state.debugNextEnemyVariant = null; updateDebugEnemyLevelText028(); if(typeof log==='function') log('デバッグ：次個体予約を解除。','system'); }
      if(btn.dataset.mbhSpawn) recoverEnemy028(true);
    });
    updateDebugEnemyLevelText028();
  }

  function applyVariant028(e){
    if(!e || typeof state === 'undefined') return e;
    const kind = state.debugNextEnemyVariant;
    if(kind !== 'strong' && kind !== 'named') return e;
    state.debugNextEnemyVariant = null;
    e.variant = {type: kind, label: variantLabel028(kind)};
    e.variantType = kind;
    if(!e.__mbh028VariantApplied){
      if(kind === 'named'){
        e.maxHp = Math.max(1, Math.floor((Number(e.maxHp)||1) * 2.0));
        e.atk = Math.max(1, Math.floor((Number(e.atk)||1) * 1.25));
        e.def = Math.max(0, Math.floor((Number(e.def)||0) * 1.10));
      }else{
        e.maxHp = Math.max(1, Math.floor((Number(e.maxHp)||1) * 1.5));
        e.atk = Math.max(1, Math.floor((Number(e.atk)||1) * 1.10));
      }
      e.__mbh028VariantApplied = true;
    }
    if(typeof log === 'function') log('デバッグ：' + variantLabel028(kind) + 'を生成。', 'system');
    return e;
  }
  if(typeof makeScaledEnemy === 'function' && !window.__mbhMakeScaledEnemy028){
    window.__mbhMakeScaledEnemy028 = makeScaledEnemy;
    makeScaledEnemy = function(){
      const e = window.__mbhMakeScaledEnemy028.apply(this, arguments);
      return applyVariant028(e);
    };
  }

  let badSince = 0;
  function enemyInvalid028(){
    if(typeof state === 'undefined') return false;
    if(state.defeatSequence || state.down || state.deathDanceCutin || state.darkSwordCutinActive) return false;
    if(state.enemyStatuses && Number(state.enemyStatuses.darkRevivingUntil||0) > performance.now()) return false;
    if(!state.enemy) return true;
    if(Number(state.enemyHp||0) <= 0 && !state.enemy.dead && !state.enemy.defeated) return true;
    return false;
  }
  function recoverEnemy028(manual=false){
    if(typeof state === 'undefined') return;
    safe(()=>{ if(state.defeatCountdownTimer){ clearInterval(state.defeatCountdownTimer); state.defeatCountdownTimer = null; } });
    safe(()=>{ if(typeof clearDarkSwordTimers === 'function') clearDarkSwordTimers(); });
    safe(()=>{ if(typeof clearDeathDanceSequence === 'function') clearDeathDanceSequence(); });
    state.enemy = null;
    state.enemyHp = 0;
    state.defeatSequence = false;
    state.down = false;
    state.deathDanceCutin = false;
    state.darkSwordCutinActive = false;
    safe(()=>{ document.getElementById('enemyCard')?.classList.remove('dead','defeated-gone','hit','attack'); });
    safe(()=>{ if(typeof resetTransientStatuses === 'function') resetTransientStatuses(); });
    safe(()=>{ if(typeof spawnEnemy === 'function') spawnEnemy(false); });
    safe(()=>{ if(typeof renderAll === 'function') renderAll(); });
    if(typeof log === 'function') log(manual ? 'デバッグ：敵を再出現させた。' : '自動復帰：敵が空の状態を検知したため再出現。', 'system');
    badSince = 0;
  }
  function watchdog028(){
    syncVersion028();
    clearRemovedDebugButtons028();
    installDebugEnemyControls028();
    updateDebugEnemyLevelText028();
    if(!enemyInvalid028()){ badSince = 0; return; }
    const now = performance.now();
    if(!badSince) badSince = now;
    if(now - badSince > 1800) recoverEnemy028(false);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{ syncVersion028(); clearRemovedDebugButtons028(); installDebugEnemyControls028(); }, {once:true});
  else setTimeout(()=>{ syncVersion028(); clearRemovedDebugButtons028(); installDebugEnemyControls028(); }, 0);
  window.addEventListener('load', ()=>{ syncVersion028(); clearRemovedDebugButtons028(); installDebugEnemyControls028(); }, {once:true});
  setInterval(watchdog028, 500);
  safe(()=>{ window.mbhRecoverEnemy = recoverEnemy028; window.mbhSetEnemyLevel = setEnemyLevelBase028; });
})();


/* ver.0.2.9: verified stable menu footer + log category finalizer */
(function(){
  'use strict';
  const BUILD = '0.2.9';
  const $ = (id)=>document.getElementById(id);
  function safe(fn){ try{ return fn && fn(); }catch(e){ console.warn('[MBH '+BUILD+']', e); return null; } }
  function syncVersion029(){
    safe(()=>{ window.APP_VERSION = BUILD; window.GAME_VERSION = BUILD; document.documentElement.dataset.buildVersion = BUILD; });
    safe(()=>document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent = 'ver.' + BUILD; }));
    safe(()=>document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent = 'Build: ver.' + BUILD; }));
    safe(()=>document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent = '進行デバッグログ ver.' + BUILD; }));
  }
  function ensureLegalFooter029(){
    const panel = document.querySelector('.side-panel');
    if(!panel) return;
    document.querySelectorAll('#fixedLegalLinks,.fixed-legal-links').forEach(el=>el.remove());
    let box = panel.querySelector(':scope > .menu-right > .legal-links') || panel.querySelector(':scope > .legal-links') || document.querySelector('.legal-links');
    if(!box){
      box = document.createElement('div');
      box.className = 'legal-links';
      box.setAttribute('aria-label','公開情報');
      box.innerHTML = '<button id="creditBtn" type="button">クレジット</button><button id="termsBtn" type="button">利用規約</button><button id="privacyBtn" type="button">プライバシーポリシー</button>';
    }
    const right = panel.querySelector(':scope > .menu-right') || panel;
    if(box.parentElement !== right) right.appendChild(box);
    box.classList.remove('hidden');
    box.classList.add('legal-links-in-menu');
    // パネル内に紛れ込んだ複製を除去
    panel.querySelectorAll('.panel .legal-links').forEach(el=>el.remove());
    const bind=(id,type)=>{
      const btn = box.querySelector('#'+id) || $(id);
      if(!btn || btn.__mbhLegal029) return;
      btn.__mbhLegal029 = true;
      btn.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); safe(()=>{ if(typeof openLegalModal==='function') openLegalModal(type); }); });
    };
    bind('creditBtn','credit'); bind('termsBtn','terms'); bind('privacyBtn','privacy');
  }
  function cleanseStatus029(){
    const grid = document.querySelector('.hero-stats .stat-grid');
    if(grid){
      const nodes = Array.from(grid.children);
      for(let i=0;i<nodes.length;i++){
        const t = (nodes[i].textContent||'').trim();
        if(/敵Lv経験値|敵Lv経験|敵レベル経験値/.test(t)){
          const a=nodes[i], b=nodes[i+1];
          a.remove(); if(b) b.remove();
        }
      }
    }
    const stats = document.querySelector('.hero-stats');
    if(stats){
      const all = Array.from(stats.querySelectorAll('.status-special-effects,#statusSpecialEffects'));
      all.slice(1).forEach(el=>el.remove());
      let box = all[0] || $('statusSpecialEffects');
      if(!box){
        box = document.createElement('div'); box.id='statusSpecialEffects'; box.className='status-special-effects';
        box.innerHTML='<h3>特殊効果</h3><div class="effect-scroll"></div>';
      }
      const records = stats.querySelector('.monster-records');
      if(records && box.parentElement===stats) stats.insertBefore(box, records);
      else if(box.parentElement!==stats) stats.appendChild(box);
      if(records && records.parentElement!==stats) stats.appendChild(records);
    }
    const equip = document.querySelector('.equip-panel');
    if(equip){
      const all = Array.from(equip.querySelectorAll('.equip-effect-totals,#equipEffectTotals'));
      all.slice(1).forEach(el=>el.remove());
      let box = all[0] || $('equipEffectTotals');
      if(!box){
        box = document.createElement('div'); box.id='equipEffectTotals'; box.className='equip-effect-totals';
        box.innerHTML='<h3>装備効果合計</h3><div class="effect-scroll"></div>';
      }
      if(box.parentElement!==equip) equip.appendChild(box);
    }
  }
  function esc(s){ return String(s).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function pct(v){ return Math.round((Number(v)||0)*100)+'%'; }
  function renderEffectSummaries029(){
    cleanseStatus029();
    safe(()=>{
      const st = (typeof calcStats==='function') ? calcStats() : null;
      const rows=[];
      if(st){
        if(st.fireRes) rows.push(['火軽減', pct(st.fireRes)]);
        if(st.fireDamageHeal) rows.push(['火被ダメ回復', pct(st.fireDamageHeal)]);
        if(st.fireDmg) rows.push(['火ダメージ', '+'+pct(st.fireDmg)]);
        if(st.fireSkillChance) rows.push(['炎斬り率', '+'+pct(st.fireSkillChance)]);
        if(st.thunderDmg) rows.push(['雷ダメージ', '+'+pct(st.thunderDmg)]);
        if(st.thunderSkillChance) rows.push(['雷撃率', '+'+pct(st.thunderSkillChance)]);
        if(st.deathDanceChance) rows.push(['死線の剣舞率', pct(st.deathDanceChance)]);
        if(st.deathDanceDefIgnore) rows.push(['剣舞防御無視', pct(st.deathDanceDefIgnore)]);
        if(st.heroDarkBleedChance) rows.push(['暗黒出血付与', pct(st.heroDarkBleedChance)]);
        if(st.lifeSteal) rows.push(['吸収', pct(st.lifeSteal)]);
        if(st.guard) rows.push(['GUARD', pct(st.guard)]);
        if(st.crit) rows.push(['会心', pct(st.crit)]);
        if(st.masterRegen) rows.push(['師匠のアミュレット', ((st.masterRegenRate||0)*100).toFixed(1)+'% / 10秒']);
        if(st.darkShield) rows.push(['闇の盾', '有効']);
        if(st.darkAmulet) rows.push(['闇のアミュレット', '有効']);
      }
      const box = document.querySelector('#statusSpecialEffects .effect-scroll');
      if(box) box.innerHTML = rows.length ? rows.map(r=>'<div class="effect-row"><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></div>').join('') : '<div class="effect-empty">特殊効果なし</div>';
    });
    safe(()=>{
      const totals={hp:0,atk:0,def:0,fireRes:0,fireDamageHeal:0,fireDmg:0,fireSkillChance:0,thunderDmg:0,thunderSkillChance:0,deathDanceChance:0,deathDanceDefIgnore:0,heroDarkBleedChance:0,lifeSteal:0,guard:0,crit:0,darkShield:false,darkAmulet:false,masterRegen:false};
      if(typeof state!=='undefined' && state.equip) Object.values(state.equip).filter(Boolean).forEach(it=>{
        Object.keys(totals).forEach(k=>{ if(typeof totals[k]==='number') totals[k]+=Number(it[k])||0; });
        if(it.darkShield) totals.darkShield=true; if(it.darkAmulet) totals.darkAmulet=true; if(it.masterRegen) totals.masterRegen=true;
      });
      const rows=[];
      if(totals.hp) rows.push(['HP','+'+Math.floor(totals.hp)]); if(totals.atk) rows.push(['攻撃','+'+Math.floor(totals.atk)]); if(totals.def) rows.push(['防御','+'+Math.floor(totals.def)]);
      ['fireRes','fireDamageHeal','fireDmg','fireSkillChance','thunderDmg','thunderSkillChance','deathDanceChance','deathDanceDefIgnore','heroDarkBleedChance','lifeSteal','guard','crit'].forEach(k=>{ if(totals[k]) rows.push([{fireRes:'火軽減',fireDamageHeal:'火被ダメ回復',fireDmg:'火ダメージ',fireSkillChance:'炎斬り率',thunderDmg:'雷ダメージ',thunderSkillChance:'雷撃率',deathDanceChance:'死線の剣舞率',deathDanceDefIgnore:'剣舞防御無視',heroDarkBleedChance:'暗黒出血付与',lifeSteal:'吸収',guard:'GUARD',crit:'会心'}[k], pct(totals[k])]); });
      if(totals.darkShield) rows.push(['闇の盾','有効']); if(totals.darkAmulet) rows.push(['闇のアミュレット','有効']); if(totals.masterRegen) rows.push(['師匠のアミュレット','有効']);
      const box = document.querySelector('#equipEffectTotals .effect-scroll');
      if(box) box.innerHTML = rows.length ? rows.map(r=>'<div class="effect-row"><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></div>').join('') : '<div class="effect-empty">装備効果なし</div>';
    });
  }
  function classifyLog029(cls,msg){
    const c=String(cls||'').toLowerCase();
    const raw=String(msg||'');
    const m=raw.replace(/<[^>]*>/g,'');
    if(c.includes('drop') || /装備ドロップ|ドロップ元|drop source/i.test(m)) return 'drop';
    if(/火属性を吸収|吸収 \+|出血を付与|出血した|暗黒出血|火傷|ダメージ|攻撃|斬|雷撃|炎斬り|連続攻撃|剣舞|ブレス|GUARD|反射|回復|無効|MISS/i.test(m)) return 'damage';
    if(c.includes('damage') || c.includes('skilllog') || c.includes('danger')) return 'damage';
    return 'system';
  }
  function renderLog029(reason='append'){
    const el=$('log'); if(!el || typeof state==='undefined') return;
    const f=state.logFilter||'all';
    const beforeTop=el.scrollTop, beforeHeight=el.scrollHeight, nearTop=beforeTop<=4;
    const rows=(state.log||[]).filter(l=>{ const t=l.type || classifyLog029(l.cls,l.msg); return f==='all' || t===f; });
    el.innerHTML=rows.map(l=>'<div class="'+esc(l.cls||'')+'" data-log-type="'+esc(l.type||classifyLog029(l.cls,l.msg))+'">['+esc(l.time||'')+'] '+(l.msg||'')+'</div>').join('');
    document.querySelectorAll('#logFilterBar button').forEach(b=>b.classList.toggle('active',(b.dataset.logFilter||'all')===f));
    requestAnimationFrame(()=>{
      if(reason==='filter') el.scrollTop=0;
      else if(nearTop) el.scrollTop=0;
      else el.scrollTop=Math.max(0,beforeTop+(el.scrollHeight-beforeHeight));
    });
  }
  function installLog029(){
    if(typeof state==='undefined') return;
    state.logFilter=state.logFilter||'all';
    const bar=$('logFilterBar');
    if(bar){
      bar.innerHTML='<button type="button" data-log-filter="all">すべて</button><button type="button" data-log-filter="damage">ダメージ</button><button type="button" data-log-filter="system">システム</button><button type="button" data-log-filter="drop">ドロップ</button>';
      bar.querySelectorAll('button[data-log-filter]').forEach(b=>{
        const on=(e)=>{ e.preventDefault(); e.stopPropagation(); state.logFilter=b.dataset.logFilter||'all'; renderLog029('filter'); return false; };
        b.onclick=on; b.onpointerup=(e)=>{ if(e.pointerType==='mouse') return; return on(e); }; b.ontouchend=on;
      });
    }
    log=function(msg, cls='', html=false){
      const time=new Date().toLocaleTimeString('ja-JP',{hour12:false});
      const safeMsg=html ? msg : esc(msg);
      const type=classifyLog029(cls, safeMsg);
      state.log.unshift({time,msg:safeMsg,cls,html:true,type});
      state.log=state.log.slice(0,180);
      renderLog029('append');
    };
    state.log=(state.log||[]).map(l=>Object.assign(l,{type:l.type||classifyLog029(l.cls,l.msg)}));
    renderLog029('filter');
  }
  function boot029(){ syncVersion029(); ensureLegalFooter029(); renderEffectSummaries029(); installLog029(); }
  if(typeof renderStats==='function' && !window.__mbhRenderStats029){ window.__mbhRenderStats029=renderStats; renderStats=function(){ const r=window.__mbhRenderStats029.apply(this,arguments); renderEffectSummaries029(); return r; }; }
  if(typeof renderEquip==='function' && !window.__mbhRenderEquip029){ window.__mbhRenderEquip029=renderEquip; renderEquip=function(){ const r=window.__mbhRenderEquip029.apply(this,arguments); renderEffectSummaries029(); return r; }; }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot029, {once:true}); else setTimeout(boot029,0);
  window.addEventListener('load', boot029, {once:true});
  window.addEventListener('resize', ()=>setTimeout(()=>{ ensureLegalFooter029(); renderEffectSummaries029(); }, 30));
  setInterval(()=>{ syncVersion029(); ensureLegalFooter029(); cleanseStatus029(); }, 300);
  safe(()=>{ window.mbhRenderLog = renderLog029; });
})();
