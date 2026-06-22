'use strict';

// ver0.6.5: ボス表示整理・火炎ブレスタグカウント・ボスランダム出現。
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
  equipList:$('equipList'), upgradeBtn:$('upgradeBtn'), bestEquipBtnEquip:$('bestEquipBtnEquip'), inventory:$('inventory'), tooltip:$('tooltip'), log:$('log'),
  equipToggleBtn:$('equipToggleBtn'), sidePanel:document.querySelector('.side-panel'), volumeSlider:$('volumeSlider'), volumeText:$('volumeText'), debugBtn:$('debugBtn'), debugPanel:$('debugPanel'), debugAddChests:$('debugAddChests'), debugResetData:$('debugResetData'), debugBestSword:$('debugBestSword'), debugBestAccessory:$('debugBestAccessory'), debugKillEnemy:$('debugKillEnemy'), debugKillHero:$('debugKillHero'), debugDarkSwordSaint:$('debugDarkSwordSaint'), debugClose:$('debugClose'), openAllBtn:$('openAllBtn'), bestEquipBtn:$('bestEquipBtn'), sellSelectedBtn:$('sellSelectedBtn'), sellNormalChk:$('sellNormalChk'), sellRareChk:$('sellRareChk'), sellLegendaryChk:$('sellLegendaryChk'), creditBtn:$('creditBtn'), termsBtn:$('termsBtn'), privacyBtn:$('privacyBtn'), legalModal:$('legalModal'), legalModalTitle:$('legalModalTitle'), legalModalBody:$('legalModalBody'), legalModalClose:$('legalModalClose'), deathDanceCutin:$('deathDanceCutin'), deathDanceCutinImg:$('deathDanceCutinImg'), deathDanceCutinQuote:$('deathDanceCutinQuote'), deathDanceCutinTitle:document.querySelector('.death-dance-cutin-title'), mobileExpBar:$('mobileExpBar'), mobileExpLevel:$('mobileExpLevel'), mobileExpText:$('mobileExpText'), mobileExpFill:$('mobileExpFill')
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
const TENSEI_KNIGHT_CUTIN = {quote:'勇者の力、ここに覚醒する。', img:'assets/cutin_hero_awakening.png'};
const HOLY_SWORD_RELEASE_CUTIN = {quote:'聖剣解放。すべてを砕く光となれ。', img:'assets/cutin_holy_sword_release.png'};
const GAME_VERSION = String(window.APP_VERSION || document.documentElement.dataset.buildVersion);

const DARK_SWORD_SAINT = {
  id:'dark_sword_saint', name:'暗黒剣聖', type:'裏ボス', img:'assets/enemy_dark_sword_saint.png', element:'dark',
  hp:32000, atk:260, def:95, xp:2600, gold:5000, bossChance:0, enemySkill:'暗黒斬'
};
const TENSEI_KNIGHT = {
  id:'tensei_knight', name:'天聖騎士', type:'裏ボス', img:'assets/enemy_tensei_knight.png', element:'holy',
  hp:52000, atk:340, def:155, xp:4200, gold:9000, bossChance:0, enemySkill:'聖剣解放'
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
  log:[], debug:{killEnemy:false, killHero:false}, audio:null, masterGain:null, bgmMode:'normal', normalBgm:null, swordDanceBgm:null, darkSwordSaintBgm:null, tenseiKnightBgm:null, bossBgm:null, darkSwordSaintVoice:null, darkSwordReviveTimer:null, darkSwordComboTimers:[], darkSwordCutinActive:false, audioUnlocked:false, mobileMuted:true, menuPage:'stats', inventoryMenuItemId:null, enemyRecords:{}, forceFirstEnemy:false, bgmPausedByVisibility:false, heroStatuses:null, enemyStatuses:null, darkShieldStacks:0, dropToastTimer:null, dropToastQueueTimers:[], winStreak:0, bestWinStreak:0, forceNextDarkSwordSaint:false, pendingBossForNext:null, darkSwordSaintFirstEncountered:false, darkSwordSaintLevel:1, darkSwordSaintKills:0, darkSwordSaintLastLevelTrigger:0, darkSwordSaintReturn:null, debugForcedBossNext:null, tenseiKnightLevel:1, tenseiKnightKills:0
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
function syncTopbarRealHeight(){
  const topbar=document.querySelector('.topbar');
  if(!topbar) return;
  document.documentElement.style.setProperty('--mbh-topbar-real-h',Math.ceil(topbar.getBoundingClientRect().height)+'px');
}
function syncCompactLayout(){
  syncTopbarRealHeight();
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
  syncAllSpecialEquipmentParameters();
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
      volume:state.volume, mobileMuted:state.mobileMuted, debug:state.debug, enemyRecords:state.enemyRecords, enemyLevelBase:state.enemyLevelBase, enemyLevelBaseDefeated:state.enemyLevelBaseDefeated, winStreak:state.winStreak, bestWinStreak:state.bestWinStreak, forceNextDarkSwordSaint:state.forceNextDarkSwordSaint, pendingBossForNext:state.pendingBossForNext, darkSwordSaintFirstEncountered:state.darkSwordSaintFirstEncountered, darkSwordSaintLevel:state.darkSwordSaintLevel, darkSwordSaintKills:state.darkSwordSaintKills, darkSwordSaintLastLevelTrigger:state.darkSwordSaintLastLevelTrigger, darkSwordSaintReturn:state.darkSwordSaintReturn, debugForcedBossNext:state.debugForcedBossNext, tenseiKnightLevel:state.tenseiKnightLevel, tenseiKnightKills:state.tenseiKnightKills,
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
    state.tenseiKnightLevel = Math.max(1, Math.floor(Number(data.tenseiKnightLevel)||1));
    state.tenseiKnightKills = Math.max(0, Math.floor(Number(data.tenseiKnightKills)||0));
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
      return syncMasterAmuletLevel(it);
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
  /* disabled 0.6.18: pagehide audio guard caused battle freeze */
  /* disabled 0.6.18: freeze audio guard caused battle freeze */
  /* disabled 0.6.18: visibility audio guard caused battle freeze */

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
  /* disabled 0.6.18: visibility bgm handler caused battle freeze */
  /* disabled 0.6.18: pagehide bgm handler caused battle freeze */
  /* disabled 0.6.18: pageshow bgm handler caused battle freeze */
  /* disabled 0.6.18: blur audio guard caused battle freeze */
  window.addEventListener('focus', ()=>{});
  setTimeout(()=>{ if(!state.mobileMuted) startAudio(); }, 300);
  els.debugBtn.onclick = () => { els.debugPanel.classList.toggle('hidden'); startAudio(); playUiClick(); };
  if(els.muteBtn) els.muteBtn.onclick = (e) => { e.preventDefault(); setMobileMuted(!state.mobileMuted); playUiClick(); };
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
  const runBestEquip=()=>{ playUiClick(); bestEquip(); };
  if(els.bestEquipBtn) els.bestEquipBtn.onclick=runBestEquip;
  if(els.bestEquipBtnEquip) els.bestEquipBtnEquip.onclick=runBestEquip;
  els.sellSelectedBtn.onclick = () => { if(els.sellSelectedBtn.disabled) return; playUiClick(); sellSelectedRarities(); };
  els.upgradeBtn.onclick = () => { if(!els.upgradeBtn.disabled) playUiClick(); upgradeSelected(); };
  window.addEventListener('resize', syncMenuByWidth);
  window.addEventListener('resize', syncTopbarRealHeight);
  window.addEventListener('orientationchange', syncCompactLayout);
  bindStatusCardPopupEvents();
  syncMenuByWidth();
  syncTopbarRealHeight();
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
    darkShield:false, darkAmulet:false, masterRegen:false, masterRegenRate:0, deathDanceDurationMul:1,
    holyDamageReduce:0, holyAtkSpeed:0, holyRegenRate:0, holyAilmentReduce:0
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
    s.holyDamageReduce += it.holyDamageReduce||0;
    s.holyAtkSpeed += it.holyAtkSpeed||0;
    s.holyRegenRate += it.holyRegenRate||0;
    if(it.holyAilmentReduce){ s.holyAilmentReduce = 1 - (1 - s.holyAilmentReduce) * (1 - it.holyAilmentReduce); }
  });
  s.deathDanceChance += Math.min(0.25, normalDanceBonus) + Math.min(0.50, darkDanceBonus);
  if(hasUnyieldingBuff()) s.deathDanceChance += 0.50;
  s.fireRes=Math.min(.75,s.fireRes); s.fireDamageHeal=Math.min(1,s.fireDamageHeal);
  s.guard=Math.min(.45,s.guard); s.holyDamageReduce=Math.min(.70,s.holyDamageReduce); s.holyAtkSpeed=Math.min(.75,s.holyAtkSpeed); s.holyRegenRate=Math.min(.20,s.holyRegenRate); s.holyAilmentReduce=Math.min(.95,s.holyAilmentReduce); s.crit=Math.min(.55,s.crit); s.deathDanceChance=Math.min(1,s.deathDanceChance); s.deathDanceDefIgnore=Math.min(.9,s.deathDanceDefIgnore);
  return s;
}
function maxHp(){return calcStats().hp}

function nowMs(){ return performance.now(); }

function makeEmptyEnemyStatuses(t=0){
  return {bleeds:[], darkBleeds:[], burnUntil:0, lastBleedTick:t, lastDarkBleedTick:t, darkAuraStacks:0, darkAuraLastTick:t, darkSwordBuffs:[], darkDanceCount:0, darkRevivingUntil:0, darkReviveStart:0, darkOneDamageCount:0, darkTechniqueAwakened:false, bossRegenLast:t, dragonBreathCount:0, bossBuffStart:t, bossPierceStart:t};
}
function isDarkSwordSaint(e=state.enemy){ return !!e && e.id === 'dark_sword_saint'; }
function hasUnyieldingBuff(){ return (isDarkSwordSaint() || isTenseiKnight?.()) && !state.down; }
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
  if(!state.down && !state.deathDanceCutin && (calcStats().masterRegen || calcStats().holyRegenRate)){
    const holyRateNow = calcStats().holyRegenRate||0;
    if(holyRateNow){
      if(!state.heroStatuses.holyRegenLast) state.heroStatuses.holyRegenLast = now;
      const holyTicks = Math.floor((now - state.heroStatuses.holyRegenLast)/10000);
      if(holyTicks > 0){
        state.heroStatuses.holyRegenLast += holyTicks*10000;
        const holyHeal = Math.max(1, Math.floor(maxHp() * holyRateNow * holyTicks));
        if(state.hp > 0 && state.hp < maxHp()){ state.hp = Math.min(maxHp(), state.hp + holyHeal); showHeroFloat(`+${holyHeal}`, 'heal'); }
      }
    }
    if(calcStats().masterRegen){
    if(!state.heroStatuses.masterRegenLast) state.heroStatuses.masterRegenLast = now;
    const ticks = Math.floor((now - state.heroStatuses.masterRegenLast)/10000);
    if(ticks > 0){
      state.heroStatuses.masterRegenLast += ticks*10000;
      const heal = Math.max(1, Math.floor(maxHp() * masterAmuletRegenRate() * ticks));
      if(state.hp > 0 && state.hp < maxHp()){ state.hp = Math.min(maxHp(), state.hp + heal); showHeroFloat(`+${heal}`, 'heal'); }
    }
    }
  }
  if(state.enemy && state.enemy.id === 'tensei_knight'){ processTenseiKnight(now); }
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
      const dmg = Math.max(1, Math.floor(maxHp() * 0.01 * state.heroStatuses.bleeds.length * ticks * (1 - (calcStats().holyAilmentReduce||0))));
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
      const dmg = Math.max(1, Math.floor(maxHp() * 0.01 * darkBleedCount('hero') * ticks * (1 - (calcStats().holyAilmentReduce||0))));
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
  setBgmMode(bgmModeForEnemy(state.enemy));
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
  setBgmMode(bgmModeForEnemy(state.enemy));
  renderAll();
  scheduleSave();
}
function fleeBattle(){
  const tenseiBattle = isTenseiKnight();
  const darkSaintBattle = isDarkSwordSaint();
  const currentLevel = Math.max(1, Math.floor(state.enemy?.level || state.enemyLevelBase || state.level || 1));
  if(tenseiBattle){
    state.winStreak = 0;
    log('天聖騎士戦から離脱した。天聖騎士は独立レベルのため、逃走してもレベルは下がらない。', 'danger');
    banner('天聖騎士から離脱');
    spawnWeakEnemyAfterEscape();
    return;
  }
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
    desc.innerHTML = isTenseiKnight()
      ? '天聖騎士は独立レベルのため、逃走しても天聖騎士レベルは下がりません。<br>経験値は失いません。'
      : (isDarkSwordSaint()
        ? '暗黒剣聖は独立レベルのため、逃走しても敵の出現レベルは下がりません。<br>経験値は失いません。'
        : '敵の出現レベルが20下がります。<br>経験値は失いません。');
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
    // ver.0.6.5: 100レベルごとの暗黒剣聖は、勝敗に関係なく通常敵レベル+1。
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
  if(kind === 'unyielding') return `<b>不屈</b><br>暗黒剣聖・天聖騎士と対峙中のみ発動。<br>死線の剣舞発動率+50%。<br>現在の剣舞発動率：${Math.round(calcStats().deathDanceChance*100)}%。`;
  if(kind === 'holy_protection') return `<b>光の加護</b><br>天聖騎士の常時効果。<br>被ダメージ90%軽減。<br>毎秒HP1%回復。HP50%以下では毎秒HP2%回復。`;
  if(kind === 'holy_awakening') return `<b>勇者の覚醒</b><br>HP50%以下で発動。<br>攻撃力+300%。<br>攻撃速度+100%。<br>状態異常90%軽減。`;
  if(kind === 'holy_release') return `<b>聖剣解放</b><br>天聖騎士の必殺技。<br>一定回数ごとに防御をほぼ無視する光属性特大ダメージを放つ。<br>発動後5秒間、0.2秒ごとに最大HPの3%を回復。`;
  if(kind === 'holy_ailment_guard') return `<b>聖域浄化</b><br>天聖騎士の状態異常軽減。<br>状態異常の時間・ダメージ・デバフ量を90%軽減。`;
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
    dmg = applyDarkShieldToDamage(Math.max(1, Math.floor(dmg * (1 - (st.holyDamageReduce||0)))));
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
    if(isTenseiKnight()){
      parts.push(makeStatusBadge('✨光の加護', 'bossbuff', 'holy_protection', 'enemy'));
      parts.push(makeStatusBadge(`⚔️聖剣解放${(state.enemyStatuses?.holyReleaseHealUntil||0)>nowMs()?'：回復中':''}`, 'bossbuff', 'holy_release', 'enemy'));
      parts.push(makeStatusBadge('🕊️聖域浄化', 'bossbuff', 'holy_ailment_guard', 'enemy'));
      if(state.enemyStatuses?.holyAwakened) parts.push(makeStatusBadge('🌈勇者の覚醒', 'bossbuff', 'holy_awakening', 'enemy'));
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
  // ver.0.6.5: 通常敵レベルは撃破時抽選で上昇。ボスはLv10刻み予約からランダム出現。
  return {...normals[Math.floor(Math.random()*normals.length)]};
}
function getBossForNormal(normalId){
  const bossId = BOSS_BY_NORMAL_ID[normalId];
  return bossId ? ENEMIES.find(e=>e.id===bossId) : null;
}
function getEnemyTemplateById(id){
  if(id === 'dark_sword_saint') return DARK_SWORD_SAINT;
  if(id === 'tensei_knight') return TENSEI_KNIGHT;
  return ENEMIES.find(e=>e.id===id) || null;
}
function shouldReplaceBossWithDarkSaint(){
  return !!state.darkSwordSaintFirstEncountered && Math.random() < 0.01;
}
function scheduleBossAfterNormalDefeat(e){
  // ver.0.6.5: 雑魚Lv10刻みで、種族ボスからランダム出現。レベルは撃破した雑魚と共通。
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
    console.error('[MBH0.6.5 scheduleBossAfterNormalDefeat]', err);
    state.pendingBossForNext = null;
  }
}
function makeScaledEnemy(base, forceLevel=null){
  const e = {...base};
  if(e.id === 'dark_sword_saint' && forceLevel == null){ forceLevel = Math.max(1, Math.floor(state.darkSwordSaintLevel || 1)); }
  if(e.id === 'tensei_knight' && forceLevel == null){ forceLevel = Math.max(1, Math.floor(Number(state.tenseiKnightLevel)||1)); }
  const bossBonus = e.type==='ボス' || e.type==='裏ボス' ? 4 : 0;
  if(forceLevel){
    e.level = forceLevel;
  }else{
    // ver.0.6.5: 敵レベルは撃破数で自動上昇させず、撃破時の抽選/ボス撃破で更新する。
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
  // ver.0.6.5: 敵ATK/DEFのレベル成長が弱すぎたため、HPとは別の成長係数へ分離。
  // HPは既存の伸びを維持し、攻撃力・防御力だけ敵Lvに応じてしっかり伸ばす。
  const statScale=1 + Math.max(0, (Number(e.level)||1)-1) * 0.08 + Math.floor(scaledDefeated/10)*.03;
  const normalHpGrowth = e.type === '雑魚' ? Math.pow(1.01, Math.max(0, (Number(e.level)||1) - 1)) : 1;
  e.maxHp=Math.max(1, Math.floor(e.hp * hpScale * 0.1 * normalHpGrowth));
  e.atk=Math.max(1, Math.floor(e.atk*statScale));
  e.def=Math.max(0, Math.floor(e.def*statScale));
  e.xp=Math.floor(e.xp*(1+e.level*.045));
  if(e.id === 'tensei_knight'){ e.maxHp = Math.max(e.maxHp, Math.floor(e.maxHp * 1.20)); e.atk = Math.max(e.atk, Math.floor(e.atk * 1.15)); e.def = Math.max(e.def, Math.floor(e.def * 1.20)); }
  return e;
}
function setEnemy(e){
  state.deathDanceBattleCount = 0;
  state.darkShieldStacks = 0;
  state.enemy=e; state.enemyHp=e.maxHp; state.enemyStatuses = makeEmptyEnemyStatuses(performance.now());
  if(e && e.id === 'tensei_knight'){
    ensureStatusContainers();
    state.enemyStatuses.holyAwakened = false;
    state.enemyStatuses.holyReleaseCount = 0;
    state.enemyStatuses.holyRegenLast = performance.now();
    state.enemyStatuses.holyProtection = true;
    state.enemyStatuses.holyReleaseHealUntil = 0;
    state.enemyStatuses.holyAilmentReduce = .90;
  }else if(isDarkSwordSaint(e)){
    state.darkSwordSaintFirstEncountered = true;
    state.enemyStatuses.darkAuraStacks = 10;
    state.enemyStatuses.darkAuraLastTick = performance.now();
    state.enemyStatuses.darkSwordBuffs = [];
    state.enemyStatuses.darkDanceCount = 0;
    state.enemyStatuses.darkOneDamageCount = 0;
    state.enemyStatuses.darkTechniqueAwakened = false;
  }
  setBgmMode(bgmModeForEnemy(e));
  markEnemySeen(e);
  els.enemyImg.src=e.img; els.enemyCard.className='card enemy-card enter';
  setTimeout(()=>els.enemyCard.classList.remove('enter'),600);
  renderBattle();
  log(`${e.name} が現れた。${e.type==='ボス'||e.type==='裏ボス'?'ボス出現！':''}`, e.type==='ボス'||e.type==='裏ボス'?'danger':'');
}
function forceSpawnDarkSwordSaint(){
  // ver0.6.5: 即時召喚ではなく、次の敵として暗黒剣聖を予約する
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
  try{
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
    const interval = Math.max(280, (state.deathDance ? 360 : 1150) / (1 + (calcStats().holyAtkSpeed||0)));
    if(now - state.lastHeroAttack > interval){ heroAttack(now); }
    if(now - state.lastEnemyAttack > enemyInterval()){ enemyAttack(now); }
  }
  if(state.deathDance){
    const target=maxHp()*0.5;
    if(state.hp < target){ state.hp=Math.min(target, state.hp + maxHp()/600); renderBattle(); }
  }
  requestAnimationFrame(loop);
  }catch(err){ console.error('[MBH loop protected]', err); try{ requestAnimationFrame(loop); }catch(_){} }
}
function enemyInterval(){ return (state.enemy?.type==='ボス' || state.enemy?.type==='裏ボス') ? 1350 : 1700; }

function heroAttack(now){
  state.lastHeroAttack=now;
  const skill = state.deathDance ? 'deathdance' : 'slash';
  els.heroCard.classList.remove('attack'); void els.heroCard.offsetWidth; els.heroCard.classList.add('attack');
  // v70: 攻撃開始時にも短い斬撃SEを鳴らし、自動攻撃でも確実に聞こえるようにする。
  try{ playSfx(skill==='deathdance'?'dance':'slash'); }catch(_){ }
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
    if(isTenseiKnight()) dmg = Math.max(1, Math.floor(dmg * 0.10));
    if(isDarkSwordSaint()){
      const auraReduce = Math.min(1, darkAuraStacks() * 0.10);
      dmg = Math.floor(dmg * (1 - auraReduce));
    }
    state.enemyHp=Math.max(0, state.enemyHp - dmg);
    if(isTenseiKnight() && state.enemyStatuses?.holyAwakened && skill==='deathdance' && dmg > 0){
      const danceHeal = Math.max(1, Math.floor(dmg * 0.90));
      if(state.enemyHp > 0){
        state.enemyHp = Math.min(state.enemy.maxHp, state.enemyHp + danceHeal);
        showFloat(`剣舞吸収 +${danceHeal}`, 'heal');
      }
    }
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
  showFx(fx); try{ playSfx(skill==='fire'?'fire':skill==='thunder'?'thunder':skill==='heavy'?'heavy':'slash'); }catch(_){ }
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
  // ver0.6.5: 火の精霊・火の精霊王の通常攻撃は必ず火属性。
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
  dmg = applyDarkShieldToDamage(Math.max(1, Math.floor(dmg * (1 - (st.holyDamageReduce||0)))));
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
  // ver.0.6.5: 暗黒剣舞でリセットするのは死線の剣舞の発動回数だけ。
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
  dmg = applyDarkShieldToDamage(Math.max(1, Math.floor(dmg * (1 - (st.holyDamageReduce||0)))));
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
let cutinDisplayToken = 0;
function showSharedCutin({img, quote='', title='', mode='hero', alt='カットイン'}, onShown){
  const cutin = els.deathDanceCutin;
  const image = els.deathDanceCutinImg;
  if(!cutin || !image || !img) return null;
  const token = ++cutinDisplayToken;
  cutin.classList.remove('show','hero-cutin','dark-cutin','holy-cutin');
  cutin.classList.add('hidden','cutin-loading',`${mode}-cutin`);
  if(els.deathDanceCutinQuote) els.deathDanceCutinQuote.textContent = quote;
  if(els.deathDanceCutinTitle) els.deathDanceCutinTitle.textContent = title;
  image.alt = alt;
  let revealed = false;
  const reveal = ()=>{
    if(revealed || token !== cutinDisplayToken) return;
    revealed = true;
    image.onload = null;
    image.onerror = null;
    cutin.classList.remove('hidden','cutin-loading');
    void cutin.offsetWidth;
    cutin.classList.add('show');
    if(typeof onShown === 'function') onShown();
  };
  image.onload = reveal;
  image.onerror = reveal;
  image.src = img;
  if(typeof image.decode === 'function') image.decode().then(reveal).catch(()=>{ if(image.complete) reveal(); });
  else if(image.complete) queueMicrotask(reveal);
  return token;
}
function scheduleSharedCutinHide(token, delay, after){
  return setTimeout(()=>{
    if(token === cutinDisplayToken) hideDeathDanceCutin(token);
    if(typeof after === 'function') after();
  }, delay);
}
function showDarkSwordDanceCutin(){
  showSharedCutin({
    img:DARK_SWORD_SAINT_CUTIN.img,
    quote:DARK_SWORD_SAINT_CUTIN.quote,
    title:'暗黒剣舞',
    mode:'dark',
    alt:'暗黒剣舞カットイン'
  }, ()=>{ playSfx('cutin'); playDarkSwordSaintVoice(); });
}

function showDarkSwordTechniqueCutin(){
  showSharedCutin({
    img:DARK_SWORD_TECHNIQUE_CUTIN.img,
    quote:DARK_SWORD_TECHNIQUE_CUTIN.quote,
    title:'暗黒剣技',
    mode:'dark',
    alt:'暗黒剣技カットイン'
  }, ()=>playSfx('cutin'));
}
function updateEnemyLevelProgressionOnDefeat(e){
  // ver.0.6.5: 雑魚撃破は10%で敵レベル+1。ボス撃破は確定+1。
  // 暗黒剣聖は通常敵進行に影響させない。
  try{
    if(!e) return;
    const lv = Math.max(1, Math.floor(Number(e.level) || Number(state.enemyLevelBase) || Number(state.level) || 1));
    if(e.id === 'tensei_knight'){ return; }
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
    console.error('[MBH0.6.5 updateEnemyLevelProgressionOnDefeat]', err);
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
  if(e && e.id === 'tensei_knight'){
    setBgmMode('normal');
  }
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
  if(e && e.id === 'tensei_knight'){
    state.tenseiKnightKills = Math.max(0, Math.floor(Number(state.tenseiKnightKills)||0)) + 1;
    state.tenseiKnightLevel = Math.max(1, Math.floor(Number(state.tenseiKnightLevel)||1)) + 1;
    log(`天聖騎士の独自レベルがLv.${state.tenseiKnightLevel}に上昇。`, 'system');
    const defeatedLevel = Math.max(1, Math.floor(Number(e?.level) || Number(state.enemyLevelBase) || Number(state.level) || 1));
    const holySlots = ['武器','盾','兜','鎧','腕','足','アミュレット'];
    const makeHolyReward = () => makeHolyItem(holySlots[Math.floor(Math.random()*holySlots.length)], defeatedLevel);
    const legendary = rarities.find(r=>r.id==='legendary') || rarities[rarities.length-1];
    const makeLegendReward = () => makeItem(slots[Math.floor(Math.random()*slots.length)], legendary, {isBossDrop:true, levelOverride:defeatedLevel});
    const rewards = [
      Math.random() < 0.18 ? makeHolyReward() : makeLegendReward(),
      Math.random() < 0.18 ? makeHolyReward() : makeLegendReward(),
      makeHolyReward()
    ];
    rewards.forEach((it, idx)=>{ it.dropSlotNo = idx + 1; it.darkSaintReward = true; it.holyKnightReward = true; });
    for(let i=rewards.length-1;i>=0;i--) state.inventory.unshift(rewards[i]);
    log(`天聖騎士討伐報酬：1枠目=${rewards[0].name} / 2枠目=${rewards[1].name} / 3枠目=${rewards[2].name}（聖剣シリーズ確定）`,'good');
    showDropSequence(rewards);
  }else if(e && e.id === 'dark_sword_saint'){
    const legendary = rarities.find(r=>r.id==='legendary') || rarities[rarities.length-1];
    const darkPool = [makeDarkHolySword, makeDarkShield, makeDarkAmulet, makeDarkArmor, makeDarkGauntlets, makeDarkHelm, makeDarkBoots];
    const defeatedLevel = Math.max(1, Math.floor(Number(e?.level) || Number(state.enemyLevelBase) || Number(state.level) || 1));
    const makeDarkReward = () => darkPool[Math.floor(Math.random()*darkPool.length)](defeatedLevel);
    const makeLegendReward = () => makeItem(slots[Math.floor(Math.random()*slots.length)], legendary, {isBossDrop:true, levelOverride:defeatedLevel});

    // ver0.6.5: 報酬枠を明示的に固定する。
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
  // ver.0.6.5: 強化石ドロップは廃止。装備はドロップ時に敵Lv依存の+値が付く。
  if(calcStats().masterRegen && state.hp > 0){
    const heal = Math.max(1, Math.floor(maxHp() * 0.25));
    const beforeHp = state.hp;
    state.hp = Math.min(maxHp(), state.hp + heal);
    if(state.hp > beforeHp){ showHeroFloat(`+${Math.floor(state.hp-beforeHp)}`, 'heal'); log(`師匠のアミュレット：撃破時HP${Math.floor(state.hp-beforeHp).toLocaleString()}回復。`,'good'); }
  }
  log(`${e.name} を撃破！ 経験値+${gainXp}`,'good'); try{ playSfx('win'); }catch(_){ }
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
  // ver0.6.5: 主人公の次Lv必要経験値を現行値の50%として扱う。
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
  syncAllMasterAmuletLevels();
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
  const data = DEATH_DANCE_CUTINS[Math.floor(Math.random() * DEATH_DANCE_CUTINS.length)];
  showSharedCutin({img:data.img, quote:data.quote, title:'死線の剣舞', mode:'hero', alt:'死線の剣舞カットイン'}, ()=>playSfx('cutin'));
}
function hideDeathDanceCutin(expectedToken=null){
  if(!els.deathDanceCutin) return;
  if(expectedToken != null && expectedToken !== cutinDisplayToken) return;
  cutinDisplayToken++;
  if(els.deathDanceCutinImg){ els.deathDanceCutinImg.onload=null; els.deathDanceCutinImg.onerror=null; }
  els.deathDanceCutin.classList.remove('show');
  els.deathDanceCutin.classList.remove('cutin-loading');
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
  setBgmMode(bgmModeForEnemy(state.enemy));
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
const BGM_CONFIG = Object.freeze({
  normal:{stateKey:'normalBgm', src:'Petals_on_the_Water.mp3', volumeScale:.05},
  boss:{stateKey:'bossBgm', src:'Before_the_Gate_Falls.mp3', volumeScale:.05},
  dark_sword_saint:{stateKey:'darkSwordSaintBgm', src:'March_of_the_Iron_Saint.mp3', volumeScale:.05},
  tensei_knight:{stateKey:'tenseiKnightBgm', src:'Judicium_Divinum.mp3', volumeScale:.08},
  dance:{stateKey:'swordDanceBgm', src:'Steel_At_The_Gate.mp3', volumeScale:.05},
});
function createBgmAudio(src){
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'auto';
  return audio;
}
function bgmModeForEnemy(enemy=state.enemy){
  if(enemy && enemy.id === 'tensei_knight') return 'tensei_knight';
  if(enemy && enemy.id === 'dark_sword_saint') return 'dark_sword_saint';
  if(enemy && (enemy.type === 'ボス' || enemy.type === '裏ボス')) return 'boss';
  return 'normal';
}
function bgmAudioForMode(mode=state.bgmMode){
  const config = BGM_CONFIG[mode] || BGM_CONFIG.normal;
  return state[config.stateKey] || null;
}
function allBgmAudio(){
  return Object.values(BGM_CONFIG).map(config=>state[config.stateKey]).filter(Boolean);
}
function ensureBgmAudio(){
  Object.values(BGM_CONFIG).forEach(config=>{
    if(!state[config.stateKey]) state[config.stateKey] = createBgmAudio(config.src);
  });
  if(!state.darkSwordSaintVoice){
    state.darkSwordSaintVoice = new Audio('DarkKnigtVoice.mp3');
    state.darkSwordSaintVoice.loop = false;
    state.darkSwordSaintVoice.preload = 'auto';
  }
  updateBgmVolume();
}
function updateBgmVolume(){
  const volume = Math.max(0, Math.min(2, Number(state.volume)||0));
  Object.values(BGM_CONFIG).forEach(config=>{
    const audio = state[config.stateKey];
    if(audio) audio.volume = state.mobileMuted ? 0 : volume * config.volumeScale;
  });
  if(state.darkSwordSaintVoice) state.darkSwordSaintVoice.volume = state.mobileMuted ? 0 : Math.max(0, Math.min(2, state.volume)) * 0.25;
}
function safePlayAudio(a){
  if(!a || state.mobileMuted || !a.paused) return;
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
  try{ pauseHtmlAudio(state.darkSwordSaintVoice); state.darkSwordSaintVoice.load(); }catch(e){}
  safePlayAudio(state.darkSwordSaintVoice);
}
function pauseHtmlAudio(a){
  if(!a) return;
  try{ if(!a.paused) a.pause(); }catch(e){}
}
function pauseAllBgm(){
  allBgmAudio().forEach(pauseHtmlAudio);
}
function stopAllBgm(){
  pauseAllBgm();
  pauseHtmlAudio(state.darkSwordSaintVoice);
}
function stopAllAudioForMute(){
  ensureBgmAudio();
  stopAllBgm();
  if(state.masterGain) state.masterGain.gain.value = 0;
  if(state.audio && state.audio.state === 'running'){
    try{ state.audio.suspend(); }catch(e){}
  }
}

function pauseBgmForPageHidden(){
  if(!isTouchDevice || !isTouchDevice()) return;
  ensureBgmAudio();
  state.bgmPausedByVisibility = true;
  stopAllBgm();
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
    }
    if(state.audio && !state.masterGain){
      state.masterGain = state.audio.createGain();
      state.masterGain.connect(state.audio.destination);
    }
    if(state.audio && state.audio.state === 'suspended'){
      try{
        const p = state.audio.resume();
        if(p && typeof p.catch === 'function') p.catch(()=>{});
      }catch(_){}
    }
    if(state.masterGain){
      state.masterGain.gain.value = state.mobileMuted ? 0 : Math.max(0, Math.min(2, Number(state.volume)||1));
    }
    state.audioUnlocked = true;
    return !!state.audio && !!state.masterGain && !state.mobileMuted;
  }catch(_){
    return false;
  }
}

function tone(freq=440, dur=.08, type='sine', vol=.05, delay=0){
  try{
    if(!ensureSfxReady()) return;
    const ctx = state.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(state.masterGain);
    const t = ctx.currentTime + Math.max(0, delay||0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, vol||0.01), t + .008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(.025, dur||.05));
    o.start(t);
    o.stop(t + (dur||.05) + .03);
  }catch(_){}
}

function noiseBurst(dur=.06, vol=.025, delay=0, filterFreq=1400){
  try{
    if(!ensureSfxReady()) return;
    const ctx = state.audio;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<len;i++) data[i] = (Math.random()*2-1) * (1-i/len);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.value = filterFreq;
    g.gain.value = vol;
    src.buffer = buffer;
    src.connect(filter);
    filter.connect(g);
    g.connect(state.masterGain);
    src.start(ctx.currentTime + Math.max(0, delay||0));
  }catch(_){}
}

const SFX_VOL = 0.5;
const SFX_COMBAT_VOL = 0.25;
function sv(v, kind){
  try{
    const combatKinds = new Set(['slash','fire','thunder','heavy','hit','guard','dance']);
    const rate = combatKinds.has(kind) ? SFX_COMBAT_VOL : SFX_VOL;
    return Math.max(0, Math.min(1, v * rate));
  }catch(_){ return 0.05; }
}

function playSfx(kind){
  try{
    if(!ensureSfxReady()) return;
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
  }catch(_){}
}

function playUiClick(){
  try{
    if(!ensureSfxReady()) return;
    tone(520,.045,'triangle',sv(.12, 'ui'));
  }catch(_){}
}

function setBgmMode(mode){
  state.bgmMode = BGM_CONFIG[mode] ? mode : 'normal';
  if(!state.audioUnlocked || state.mobileMuted) return;
  playBgm();
}
function playBgm(){
  if(!state.audioUnlocked || state.mobileMuted) return;
  ensureBgmAudio();
  updateBgmVolume();
  const current = bgmAudioForMode();
  allBgmAudio().forEach(audio=>{
    if(audio !== current) pauseHtmlAudio(audio);
  });
  safePlayAudio(current);
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
  return Math.max(1, Math.floor(Number(levelOverride) || Number(state?.enemy?.level) || Number(state?.darkSwordSaintLevel) || Number(state?.level) || 1));
}
const SPECIAL_EQUIPMENT_BASE_LEVEL = Object.freeze({darkholy:500, holy:1000});
function specialEquipmentParameterLevel(frame, quality){
  const base=SPECIAL_EQUIPMENT_BASE_LEVEL[frame];
  if(!base) return 0;
  return base + Math.max(0,Math.floor(Number(quality)||0))*50;
}
function applySpecialEquipmentParameters(it){
  if(!it || !SPECIAL_EQUIPMENT_BASE_LEVEL[it.specialFrame]) return it;
  const lv=specialEquipmentParameterLevel(it.specialFrame,it.level);
  const legendary=rarities.find(r=>r.id==='legendary') || {mult:3.2};
  const m=legendary.mult;
  if(it.specialFrame==='darkholy'){
    if(it.slot==='武器') it.atk=Math.floor((34+lv*7)*m);
    else if(it.slot==='盾'){ it.def=Math.floor((18+lv*5)*m); it.hp=Math.floor((70+lv*14)*m); }
    else if(it.slot==='アミュレット') it.hp=Math.floor((90+lv*16)*m);
    else if(it.slot==='鎧'){ it.def=Math.floor(26+lv*7); it.hp=Math.floor(190+lv*22); }
    else if(it.slot==='腕'){ it.atk=Math.floor(22+lv*6); it.def=Math.floor(10+lv*3); }
    else if(it.slot==='兜'){ it.def=Math.floor(14+lv*4); it.hp=Math.floor(80+lv*12); }
    else if(it.slot==='足'){ it.def=Math.floor(10+lv*3); it.hp=Math.floor(70+lv*10); }
  }else{
    if(it.slot==='武器') it.atk=Math.floor((34+lv*7)*m);
    else if(it.slot==='盾'){ it.def=Math.floor((20+lv*5)*m); it.hp=Math.floor((80+lv*14)*m); }
    else if(it.slot==='兜'){ it.def=Math.floor((14+lv*4)*m); it.hp=Math.floor((45+lv*10)*m); }
    else if(it.slot==='鎧'){ it.def=Math.floor((24+lv*6)*m); it.hp=Math.floor((120+lv*18)*m); }
    else if(it.slot==='腕'){ it.def=Math.floor((12+lv*4)*m); it.hp=Math.floor((40+lv*9)*m); }
    else if(it.slot==='足'){ it.def=Math.floor((12+lv*4)*m); it.hp=Math.floor((55+lv*10)*m); }
    else if(it.slot==='アミュレット') it.hp=Math.floor((100+lv*16)*m);
  }
  it.parameterLevel=lv;
  it.__dropPlusApplied=true;
  return it;
}
function syncAllSpecialEquipmentParameters(){
  Object.values(state?.equip||{}).forEach(applySpecialEquipmentParameters);
  if(Array.isArray(state?.inventory)) state.inventory.forEach(applySpecialEquipmentParameters);
}
function makeDarkHolySword(levelOverride){
  const lv = darkEquipLevelFromSource(levelOverride);
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('武器', legendary, {levelOverride: lv});
  it.name = '闇の聖剣';
  it.rarity = 'legendary';
  it.rarityName = 'レジェンダリー';
  it.specialFrame = 'darkholy';
  it.crit = Math.max(it.crit||0, 0.08);
  it.heroDarkBleedChance = 0.10;
  it.skill = {id:'multi', name:'連続攻撃', chance:1, element:'physical'};
  it.flavor = '暗黒剣聖を超えた証。通常攻撃と剣舞の1ヒットごとに暗黒出血を刻む。';
  it.itemLevel = lv;
  return applySpecialEquipmentParameters(it);
}

function makeDarkShield(levelOverride){
  const lv = darkEquipLevelFromSource(levelOverride);
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('盾', legendary, {levelOverride: lv});
  it.name = '闇の盾';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'darkholy';
  it.darkShield = true;
  it.flavor = '毎ターン被ダメージ軽減+1%（最大50%）。受けたダメージの半分を回復。';
  it.itemLevel = lv;
  return applySpecialEquipmentParameters(it);
}
function makeDarkAmulet(levelOverride){
  const lv = darkEquipLevelFromSource(levelOverride);
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem('アミュレット', legendary, {levelOverride: lv});
  it.name = '闇のアミュレット';
  it.rarity = 'legendary'; it.rarityName = 'レジェンダリー'; it.specialFrame = 'darkholy';
  it.deathDanceChance = 0.25;
  it.darkAmulet = true;
  it.flavor = '死線の剣舞発動率+25%。死線の剣舞効果時間2倍。';
  it.itemLevel = lv;
  return applySpecialEquipmentParameters(it);
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
  it.flavor = '師匠より託された護符。強化値は主人公Lvと同期。10秒ごとにHP回復（Lvで成長、最大10%）。敵撃破時HP25%回復。死線の剣舞発動率+10%。';
  return syncMasterAmuletLevel(it);
}
function syncMasterAmuletLevel(it){
  if(!it || it.name !== '師匠のアミュレット') return it;
  const heroLevel = Math.max(1, Math.floor(Number(state?.level)||1));
  it.level = heroLevel;
  it.itemLevel = heroLevel;
  return it;
}
function syncAllMasterAmuletLevels(){
  Object.values(state?.equip||{}).forEach(syncMasterAmuletLevel);
  if(Array.isArray(state?.inventory)) state.inventory.forEach(syncMasterAmuletLevel);
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

function renderAll(){ syncAllMasterAmuletLevels(); renderBattle(); renderStats(); renderEquip(); renderInventory(); }
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

/* v0.6.5: mobile fixed EXP bar + safer audio focus handling */
function updateMobileExpBar(){
  const bar = document.getElementById('mobileExpBar');
  if(!bar) return;
  const lv = document.getElementById('mobileExpLevel');
  const text = document.getElementById('mobileExpText');
  const fill = document.getElementById('mobileExpFill');
  const need = Math.max(1, Math.floor(Number(state.xpNext || 1000) || 1000));
  const xp = Math.max(0, Math.floor(Number(state.xp || 0) || 0));
  const pct = Math.max(0, Math.min(100, xp / need * 100));
  if(lv) lv.textContent = `Lv.${Math.max(1, Math.floor(Number(state.level || 1) || 1))}`;
  if(text) text.textContent = `EXP ${xp.toLocaleString()} / ${need.toLocaleString()}`;
  if(fill) fill.style.width = `${pct}%`;
}

function isMobileOrIOSAudioMode(){
  return isIOSDevice?.() || isMobileAudioMode?.() || window.matchMedia('(max-width:760px), (pointer:coarse)').matches;
}

function pauseAllManagedAudioForBackground(){ return; }

function handleMobileBackgroundAudioPause(){ return; }

function resumeAudioContextForSfx(){
  try{
    if(state.mobileMuted) return;
    if(state.audio && state.audio.state === 'suspended'){
      const p = state.audio.resume();
      if(p && typeof p.catch === 'function') p.catch(()=>{});
    }
  }catch(e){}
}


function renderBattle(){
  updateMobileExpBar();
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
function itemNameColor(it){
  if(it?.specialFrame === 'darkholy') return '#b86cff';
  if(it?.specialFrame === 'holy') return '#ffe36e';
  return rarityColor(it?.rarity);
}
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
  if(it.parameterLevel) arr.push(`性能Lv${Math.floor(Number(it.parameterLevel)||0)}相当`);
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
  const current=state.equip[it.slot];
  const summaryHtml=(item)=>escapeHtml(itemSummary(item)||'追加能力なし').replace(/ \/ /g,'<br>');
  let html=`<div class="inventory-tooltip-section"><strong>選択装備</strong><b style="color:${itemNameColor(it)}">${escapeHtml(formatItemNameWithPlus(it))}</b><small>${escapeHtml(it.slot)} / ${escapeHtml(it.rarityName||it.rarity)}</small><div>${summaryHtml(it)}</div></div>`;
  if(current){
    const diff=Math.round(itemPower(it)-itemPower(current));
    html+=`<div class="inventory-tooltip-section current"><strong>現在装備</strong><b style="color:${itemNameColor(current)}">${escapeHtml(formatItemNameWithPlus(current))}</b><div>${summaryHtml(current)}</div><em>戦力差: ${diff>=0?'+':''}${diff}</em></div>`;
  }else{
    html+='<div class="inventory-tooltip-section current"><strong>現在装備</strong><div>未装備</div></div>';
  }
  if(els.tooltip.parentElement!==document.body) document.body.appendChild(els.tooltip);
  els.tooltip.innerHTML=html;
  els.tooltip.classList.remove('hidden');
  const rect=els.tooltip.getBoundingClientRect();
  const pad=8;
  const gap=18;
  const fitsRight=e.clientX+gap+rect.width<=window.innerWidth-pad;
  const fitsLeft=e.clientX-gap-rect.width>=pad;
  const left=fitsRight
    ? e.clientX+gap
    : fitsLeft
      ? e.clientX-gap-rect.width
      : Math.max(pad,Math.min(e.clientX-(rect.width/2),window.innerWidth-rect.width-pad));
  const fitsBelow=e.clientY+gap+rect.height<=window.innerHeight-pad;
  const top=fitsBelow
    ? e.clientY+gap
    : Math.max(pad,Math.min(e.clientY-gap-rect.height,window.innerHeight-rect.height-pad));
  els.tooltip.style.left=left+'px';
  els.tooltip.style.top=top+'px';
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
  setBgmMode('normal');
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
  state.tenseiKnightLevel = 1;
  state.tenseiKnightKills = 0;
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


/* MBH ver.0.6.5: clean menu controller. No redirect URL params. No BGM assets. */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const safe=(fn)=>{ try{ return fn&&fn(); }catch(e){ console.error('[MBH0.6.5]', e); return null; } };

  function syncVersion054(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.documentElement.dataset.mbhVersion=BUILD;
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD+' debug'; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  function ensureBattleVisible054(){
    const bg=$('.battle-bg');
    if(bg && (!bg.style.backgroundImage || bg.style.backgroundImage==='none')) bg.style.backgroundImage="url('assets/bg_forest_ruins.jpg')";
    const bp=$('.battle-panel');
    if(bp){ bp.style.display='block'; bp.style.visibility='visible'; bp.style.opacity='1'; }
  }

  function ensureMenuDom054(){
    const side=$('.side-panel'); if(!side) return null;
    let tabs=side.querySelector(':scope > .mobile-menu-tabs, :scope > .side-tabs') || $('.mobile-menu-tabs,.side-tabs');
    if(!tabs){
      tabs=document.createElement('nav');
      tabs.className='mobile-menu-tabs side-tabs';
      tabs.setAttribute('aria-label','右側タブ');
      tabs.innerHTML='<button type="button" data-menu-page="stats">ステータス</button><button type="button" data-menu-page="equip">装備</button><button type="button" data-menu-page="inventory">倉庫</button>';
      side.insertBefore(tabs, side.firstChild);
    }
    if(tabs.parentElement!==side) side.insertBefore(tabs, side.firstChild);

    // Clone tabs once to remove old stacked handlers.
    if(tabs.dataset.mbh054Clean!=='1'){
      const clone=tabs.cloneNode(true);
      clone.dataset.mbh054Clean='1';
      tabs.replaceWith(clone);
      tabs=clone;
    }

    let footer=side.querySelector(':scope > .menu-footer, :scope > .legal-links') || $('.menu-footer,.legal-links');
    if(!footer){
      footer=document.createElement('div');
      footer.className='legal-links menu-footer';
      footer.setAttribute('aria-label','公開情報');
      footer.innerHTML='<button id="creditBtn" type="button">クレジット</button><button id="termsBtn" type="button">利用規約</button><button id="privacyBtn" type="button">プライバシーポリシー</button>';
    }
    footer.className='legal-links menu-footer';
    if(footer.dataset.mbh054Clean!=='1'){
      const clone=footer.cloneNode(true);
      clone.dataset.mbh054Clean='1';
      footer.replaceWith(clone);
      footer=clone;
    }

    let content=$('#mbhMenuContent054');
    if(!content){
      content=document.createElement('div');
      content.id='mbhMenuContent054';
      content.className='menu-content-fixed';
    }
    if(content.parentElement!==side) side.insertBefore(content, footer.parentElement===side?footer:null);

    ['.hero-stats','.equip-panel','.inventory-panel'].forEach(sel=>{
      const p=$(sel);
      if(p && p.parentElement!==content) content.appendChild(p);
    });

    // remove old wrappers after moving panels
    $$('.menu-col,.menu-left,.menu-right', side).forEach(el=>{ if(!el.querySelector('.panel')) el.remove(); else el.style.display='none'; });
    $$('.log-panel', side).forEach(el=>el.remove());
    $$('[data-menu-page="log"]', side).forEach(el=>el.remove());

    // footer must be direct final child and never inside a panel/content.
    if(footer.parentElement!==side) side.appendChild(footer);
    if(side.lastElementChild!==footer) side.appendChild(footer);
    return content;
  }

  function currentPage054(){ return (typeof state!=='undefined' && state.menuPage) || 'stats'; }
  function panelFor054(page){ return page==='equip' ? $('.equip-panel') : page==='inventory' ? $('.inventory-panel') : $('.hero-stats'); }
  function setPage054(page){
    page = (page==='equip' || page==='inventory') ? page : 'stats';
    if(typeof state!=='undefined') state.menuPage=page;
    ensureMenuDom054();
    $$('.side-panel [data-menu-page]').forEach(btn=>btn.classList.toggle('active', btn.dataset.menuPage===page));
    $$('#mbhMenuContent054>.panel').forEach(p=>p.classList.remove('active-page'));
    const target=panelFor054(page) || panelFor054('stats');
    if(target) target.classList.add('active-page');
    safe(()=>{ if(typeof renderInventory==='function' && page==='inventory') renderInventory(); });
  }

  function setMenuOpen054(open){
    const side=$('.side-panel'); if(!side) return;
    const btn=$('#equipToggleBtn');
    open=!!open;
    side.classList.toggle('open',open);
    document.body.classList.toggle('mbh-menu-open',open);
    if(typeof state!=='undefined') state.uiOpen=open;
    if(btn) btn.textContent=open?'閉じる':'メニュー';
    if(open) setPage054(currentPage054());
  }

  function replaceTopButtons054(){
    const old=$('#equipToggleBtn');
    if(old && old.dataset.mbh054Clean!=='1'){
      const clone=old.cloneNode(true);
      clone.dataset.mbh054Clean='1';
      old.replaceWith(clone);
    }
  }

  function bindMenu054(){
    replaceTopButtons054();
    const side=$('.side-panel');
    const btn=$('#equipToggleBtn');
    if(btn && btn.dataset.mbh054Bound!=='1'){
      btn.dataset.mbh054Bound='1';
      const onToggle=(e)=>{
        e.preventDefault(); e.stopPropagation();
        setMenuOpen054(!document.body.classList.contains('mbh-menu-open'));
        safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
        return false;
      };
      btn.addEventListener('click', onToggle, true);
    }
    $$('.side-panel [data-menu-page]').forEach(b=>{
      if(b.dataset.mbh054Bound==='1') return;
      b.dataset.mbh054Bound='1';
      const onPage=(e)=>{ e.preventDefault(); e.stopPropagation(); setPage054(b.dataset.menuPage||'stats'); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); return false; };
      b.addEventListener('click', onPage, true);
    });
    [['creditBtn','credit'],['termsBtn','terms'],['privacyBtn','privacy']].forEach(([id,type])=>{
      const b=document.getElementById(id); if(!b || b.dataset.mbh054Bound==='1') return;
      b.dataset.mbh054Bound='1';
      const onLegal=(e)=>{ e.preventDefault(); e.stopPropagation(); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); safe(()=>{ if(typeof openLegalModal==='function') openLegalModal(type); }); return false; };
      b.addEventListener('click', onLegal, true);
    });
  }

  function installDebug054(){
    const p=document.getElementById('debugPanel'); if(!p) return;
    const close=document.getElementById('debugClose');
    const add=(id,text,fn)=>{
      let b=document.getElementById(id);
      if(!b){ b=document.createElement('button'); b.id=id; b.type='button'; b.textContent=text; p.insertBefore(b,close||null); }
      if(b.dataset.mbh054Bound==='1') return;
      b.dataset.mbh054Bound='1';
      b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); fn(); return false; },true);
    };
    const adjust=(d)=>{
      if(typeof state==='undefined') return;
      const cur=Math.max(1,Math.floor(Number(state.enemyLevelBase)||Number(state.enemy?.level)||Number(state.level)||1));
      state.enemyLevelBase=Math.max(1,cur+d);
      state.enemyLevelBaseDefeated=Math.max(0,Math.floor(Number(state.defeated)||0));
      safe(()=>{ if(typeof log==='function') log('デバッグ：敵出現レベルをLv.'+cur+'→Lv.'+state.enemyLevelBase+'に変更。','system'); });
      safe(()=>{ if(typeof scheduleSave==='function') scheduleSave(); });
    };
    add('debugNextStrong','次の敵を強個体',()=>{ if(typeof state!=='undefined') state.debugNextVariant054='strong'; safe(()=>{ if(typeof log==='function') log('デバッグ：次の敵を強個体に設定。','system'); }); });
    add('debugNextNamed','次の敵を異名持ち',()=>{ if(typeof state!=='undefined') state.debugNextVariant054='named'; safe(()=>{ if(typeof log==='function') log('デバッグ：次の敵を異名持ちに設定。','system'); }); });
    add('debugEnemyLvMinus10','敵Lv -10',()=>adjust(-10));
    add('debugEnemyLvMinus5','敵Lv -5',()=>adjust(-5));
    add('debugEnemyLvPlus5','敵Lv +5',()=>adjust(5));
    add('debugEnemyLvPlus10','敵Lv +10',()=>adjust(10));
  }

  function patchEnemyVariant054(){
    if(typeof makeScaledEnemy==='function' && !makeScaledEnemy.__mbh054){
      const old=makeScaledEnemy;
      makeScaledEnemy=function(base,forceLevel){
        const e=old.apply(this,arguments);
        safe(()=>{
          if(!e || e.id==='dark_sword_saint' || typeof state==='undefined') return;
          const kind=state.debugNextVariant054 || state.debugNextVariant031 || state.debugNextEnemyVariant;
          if(kind!=='strong' && kind!=='named') return;
          state.debugNextVariant054=null; state.debugNextVariant031=null; state.debugNextEnemyVariant=null;
          e.variant={type:kind,label:kind==='named'?'異名持ち':'強個体'};
          e.variantType=kind;
          if(!e.__mbh054VariantApplied){
            e.maxHp=Math.max(1,Math.floor((Number(e.maxHp)||1)*(kind==='named'?2.0:1.5)));
            e.atk=Math.max(1,Math.floor((Number(e.atk)||1)*(kind==='named'?1.25:1.10)));
            e.__mbh054VariantApplied=true;
          }
        });
        return e;
      };
      makeScaledEnemy.__mbh054=true;
    }
    if(typeof showFloat==='function' && !showFloat.__mbh054){
      const old=showFloat;
      showFloat=function(text,cls){
        let t=String(text??'').replace(/異名再生\s*/g,'').replace(/^再生\s*/,'');
        return old.call(this,t,cls);
      };
      showFloat.__mbh054=true;
    }
  }

  function boot054(){
    /* syncVersion removed */
    ensureBattleVisible054();
    ensureMenuDom054();
    bindMenu054();
    installDebug054();
    patchEnemyVariant054();
    setPage054(currentPage054());
    setMenuOpen054(false);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot054,{once:true}); else setTimeout(boot054,0);
  window.addEventListener('load',()=>{ boot054(); setTimeout(()=>{ ensureBattleVisible054(); setMenuOpen054(false); },60); },{once:true});
  window.addEventListener('resize',()=>setTimeout(()=>{ ensureBattleVisible054(); if(!document.body.classList.contains('mbh-menu-open')) setMenuOpen054(false); },60));
  safe(()=>{ window.mbh054Check=()=>({build:document.documentElement.dataset.buildVersion, menuOpen:document.body.classList.contains('mbh-menu-open'), sideOpen:$('.side-panel')?.classList.contains('open')||false, page:typeof state!=='undefined'?state.menuPage:null, footerParent:$('.menu-footer')?.parentElement?.className||'', inventoryOverflow:getComputedStyle($('#inventory')).overflowY, battleBg:getComputedStyle($('.battle-bg')).backgroundImage}); });
})();


/* MBH ver.0.6.5: single-click menu/debug stabilizer */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.5]', e); return null; } };

  function syncVersion055(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.documentElement.dataset.mbhVersion=BUILD;
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD+' debug'; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  function ensureMenuDom055(){
    const side=$('.side-panel'); if(!side) return null;
    let tabs=side.querySelector(':scope > .mobile-menu-tabs, :scope > .side-tabs');
    if(!tabs){
      tabs=document.createElement('nav');
      tabs.className='mobile-menu-tabs side-tabs';
      tabs.setAttribute('aria-label','右側タブ');
      tabs.innerHTML='<button type="button" data-menu-page="stats">ステータス</button><button type="button" data-menu-page="equip">装備</button><button type="button" data-menu-page="inventory">倉庫</button>';
      side.insertBefore(tabs, side.firstChild);
    }
    if(tabs.parentElement!==side) side.insertBefore(tabs, side.firstChild);

    let footer=side.querySelector(':scope > .menu-footer, :scope > .legal-links');
    if(!footer){
      footer=document.createElement('div');
      footer.className='legal-links menu-footer';
      footer.setAttribute('aria-label','公開情報');
      footer.innerHTML='<button id="creditBtn" type="button">クレジット</button><button id="termsBtn" type="button">利用規約</button><button id="privacyBtn" type="button">プライバシーポリシー</button>';
      side.appendChild(footer);
    }
    footer.className='legal-links menu-footer';

    let content=$('#mbhMenuContent055') || $('#mbhMenuContent054') || $('#mbhMenuContent052') || $('#mbhMenuContent051') || $('#mbhMenuContent050');
    if(!content){
      content=document.createElement('div');
      content.className='menu-content-fixed';
      side.insertBefore(content, footer);
    }
    content.id='mbhMenuContent055';
    content.className='menu-content-fixed';
    if(content.parentElement!==side) side.insertBefore(content, footer);

    ['.hero-stats','.equip-panel','.inventory-panel'].forEach(sel=>{
      const p=$(sel);
      if(p && p.parentElement!==content) content.appendChild(p);
    });
    $$('.log-panel', side).forEach(el=>el.remove());
    $$('[data-menu-page="log"]', side).forEach(el=>el.remove());
    $$('.menu-col,.menu-left,.menu-right', side).forEach(el=>{ if(el.parentElement===side) el.remove(); });
    if(footer.parentElement!==side || side.lastElementChild!==footer) side.appendChild(footer);
    return content;
  }

  function setPage055(page){
    page=(page==='equip'||page==='inventory')?page:'stats';
    if(typeof state!=='undefined') state.menuPage=page;
    const content=ensureMenuDom055();
    $$('.side-panel [data-menu-page]').forEach(b=>b.classList.toggle('active', b.dataset.menuPage===page));
    if(content){
      $$('#mbhMenuContent055>.panel').forEach(p=>p.classList.remove('active-page'));
      const target=page==='equip'?$('.equip-panel'):page==='inventory'?$('.inventory-panel'):$('.hero-stats');
      if(target) target.classList.add('active-page');
    }
    if(page==='inventory') safe(()=>{ if(typeof renderInventory==='function') renderInventory(); });
  }

  function setMenuOpen055(open){
    const side=$('.side-panel'); if(!side) return;
    open=!!open;
    side.classList.toggle('open', open);
    document.body.classList.toggle('mbh-menu-open', open);
    if(typeof state!=='undefined') state.uiOpen=open;
    const btn=$('#equipToggleBtn');
    if(btn) btn.textContent=open?'閉じる':'メニュー';
    if(open) setPage055((typeof state!=='undefined'&&state.menuPage)||'stats');
  }

  function replaceAndBind055(id, handler){
    const old=document.getElementById(id); if(!old) return null;
    const clone=old.cloneNode(true);
    clone.dataset.mbh055Bound='1';
    old.replaceWith(clone);
    clone.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      handler(e);
      return false;
    }, true);
    return clone;
  }

  function bind055(){
    ensureMenuDom055();
    replaceAndBind055('equipToggleBtn', ()=>{
      setMenuOpen055(!document.body.classList.contains('mbh-menu-open'));
      safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
    });
    replaceAndBind055('debugBtn', ()=>{
      const p=$('#debugPanel'); if(!p) return;
      p.classList.toggle('hidden');
      safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
    });
    const close=replaceAndBind055('debugClose', ()=>{ const p=$('#debugPanel'); if(p) p.classList.add('hidden'); });
    $$('.side-panel [data-menu-page]').forEach(b=>{
      const clone=b.cloneNode(true);
      b.replaceWith(clone);
      clone.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        setPage055(clone.dataset.menuPage||'stats');
        safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
        return false;
      }, true);
    });
    [['creditBtn','credit'],['termsBtn','terms'],['privacyBtn','privacy']].forEach(([id,type])=>{
      replaceAndBind055(id, ()=>{
        safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
        safe(()=>{ if(typeof openLegalModal==='function') openLegalModal(type); });
      });
    });
  }

  function boot055(){
    /* syncVersion removed */
    ensureMenuDom055();
    bind055();
    setPage055((typeof state!=='undefined'&&state.menuPage)||'stats');
    setMenuOpen055(false);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot055, {once:true}); else setTimeout(boot055, 0);
  window.addEventListener('load', ()=>setTimeout(boot055, 0), {once:true});
  window.mbh055Check=()=>({
    build:document.documentElement.dataset.buildVersion,
    menuOpen:document.body.classList.contains('mbh-menu-open'),
    sideOpen:$('.side-panel')?.classList.contains('open')||false,
    debugHidden:$('#debugPanel')?.classList.contains('hidden'),
    page:typeof state!=='undefined'?state.menuPage:null,
    inventoryOverflow:$('#inventory')?getComputedStyle($('#inventory')).overflowY:null
  });
})();

/* MBH ver.0.6.5: restore effect panels and sell EXP display */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.5]', e); return null; } };
  function syncVersion056(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.documentElement.dataset.mbhVersion=BUILD;
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD+' debug'; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }
  function hideHeaderMats056(){
    $$('.topbar .resources').forEach(el=>{ el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); });
  }
  function esc(v){ return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function pct(v){ return Math.round((Number(v)||0)*100); }
  function rarityColor056(it){
    if(!it) return '#eeeeee';
    if(it.specialFrame==='darkholy') return '#b86cff';
    if(typeof rarityColor==='function') return rarityColor(it.rarity);
    return it.rarity==='legendary'?'#ff9b24':it.rarity==='rare'?'#4d8dff':'#eeeeee';
  }
  function addEffect(map,key,label,value,it){
    if(!value && value!==0) return;
    const color=rarityColor056(it);
    if(map.has(key)){
      const row=map.get(key);
      row.value += value;
      if(it?.specialFrame==='darkholy') row.color=color;
      else if(row.color==='#eeeeee' && color!=='#eeeeee') row.color=color;
    }else map.set(key,{label,value,color});
  }
  function fixedEffectRows056(){
    const map=new Map();
    const eq=(typeof state!=='undefined' && state.equip) ? Object.values(state.equip).filter(Boolean) : [];
    eq.forEach(it=>{
      if(it.fireRes) addEffect(map,'fireRes','火軽減',it.fireRes,it);
      if(it.fireDamageHeal) addEffect(map,'fireDamageHeal','火被ダメ回復',it.fireDamageHeal,it);
      if(it.fireDmg) addEffect(map,'fireDmg','火ダメージ',it.fireDmg,it);
      if(it.fireSkillChance) addEffect(map,'fireSkillChance','炎斬り率',it.fireSkillChance,it);
      if(it.thunderDmg) addEffect(map,'thunderDmg','雷ダメージ',it.thunderDmg,it);
      if(it.thunderSkillChance) addEffect(map,'thunderSkillChance','雷撃率',it.thunderSkillChance,it);
      if(it.deathDanceChance) addEffect(map,'deathDanceChance','死線の剣舞率',it.deathDanceChance,it);
      if(it.deathDanceDefIgnore) addEffect(map,'deathDanceDefIgnore','剣舞時防御無視',it.deathDanceDefIgnore,it);
      if(it.heroDarkBleedChance) addEffect(map,'heroDarkBleedChance','暗黒出血付与',it.heroDarkBleedChance,it);
      if(it.lifeSteal) addEffect(map,'lifeSteal','HP吸収',it.lifeSteal,it);
      if(it.guard) addEffect(map,'guard','GUARD',it.guard,it);
      if(it.crit) addEffect(map,'crit','会心',it.crit,it);
      if(it.darkShield) map.set('darkShield',{label:'闇の盾',text:'被ダメ軽減+1%/ターン 最大50%・被ダメ50%回復',color:rarityColor056(it)});
      if(it.darkAmulet) map.set('darkAmulet',{label:'闇のアミュレット',text:'死線の剣舞 効果時間2倍',color:rarityColor056(it)});
      if(it.masterRegen) map.set('masterRegen',{label:'師匠のアミュレット',text:'10秒ごとHP回復・撃破時HP25%回復',color:rarityColor056(it)});
      if(it.skill?.name) map.set('skill_'+it.slot,{label:'武器スキル',text:String(it.skill.name),color:rarityColor056(it)});
    });
    const pctKeys=new Set(['fireRes','fireDamageHeal','fireDmg','fireSkillChance','thunderDmg','thunderSkillChance','deathDanceChance','deathDanceDefIgnore','heroDarkBleedChance','lifeSteal','guard','crit']);
    return Array.from(map.entries()).map(([key,row])=>{
      const text=row.text || ((pctKeys.has(key)?(pct(row.value)+'%'):String(row.value)));
      return {label:row.label,text,color:row.color||'#eeeeee'};
    });
  }
  function renderEffectBox056(sel){
    const box=$(sel); if(!box) return;
    let scroll=box.querySelector('.effect-scroll');
    if(!scroll){ scroll=document.createElement('div'); scroll.className='effect-scroll'; box.appendChild(scroll); }
    const rows=fixedEffectRows056();
    scroll.innerHTML=rows.length ? rows.map(r=>`<div class="effect-row"><span style="color:${esc(r.color)}">${esc(r.label)}</span><b style="color:${esc(r.color)}">${esc(r.text)}</b></div>`).join('') : '<div class="effect-empty">装備由来の特殊効果なし</div>';
  }
  function renderEffectPanels056(){
    renderEffectBox056('#statusSpecialEffects');
    renderEffectBox056('#equipEffectTotals');
  }
  function sellBase056(it){
    if(!it) return 0;
    const rarity=it.rarity;
    const base=(it.specialFrame==='darkholy'||rarity==='legendary')?5:(rarity==='rare'?3:1);
    const plus=Math.max(0,Math.floor(Number(it.level)||0));
    return base + plus;
  }
  function selectedSellRarities056(){
    const targets=[];
    if(document.getElementById('sellNormalChk')?.checked) targets.push('normal');
    if(document.getElementById('sellRareChk')?.checked) targets.push('rare');
    if(document.getElementById('sellLegendaryChk')?.checked) targets.push('legendary');
    return targets;
  }
  function sellPreview056(){
    if(typeof state==='undefined' || !Array.isArray(state.inventory)) return {count:0,total:0};
    const targets=selectedSellRarities056();
    const items=state.inventory.filter(it=>targets.includes(it.rarity)&&!it.unsellable);
    return {count:items.length,total:items.reduce((sum,it)=>sum+sellBase056(it),0)};
  }
  function updateSellButton056(){
    const btn=document.getElementById('sellSelectedBtn'); if(!btn) return;
    const targets=selectedSellRarities056();
    const p=sellPreview056();
    btn.disabled=targets.length===0 || p.count===0;
    btn.textContent=`経験値化 (${p.count}) +${p.total}`;
  }
  function ensureStatusHeight056(){
    const mc=$('#mbhMenuContent055')||$('#mbhMenuContent056')||$('.menu-content-fixed');
    if(mc && mc.id!=='mbhMenuContent056') mc.id='mbhMenuContent056';
    renderEffectPanels056();
    updateSellButton056();
  }
  function patchFunctions056(){
    if(typeof sellExpValue==='function' && !sellExpValue.__mbh056){
      sellExpValue=function(it){ return sellBase056(it); };
      sellExpValue.__mbh056=true;
    }
    if(typeof updateSellButtonState==='function' && !updateSellButtonState.__mbh056){
      updateSellButtonState=function(){ updateSellButton056(); };
      updateSellButtonState.__mbh056=true;
    }
    if(typeof renderStats==='function' && !renderStats.__mbh056){
      const old=renderStats;
      renderStats=function(){ const r=old.apply(this,arguments); renderEffectPanels056(); return r; };
      renderStats.__mbh056=true;
    }
    if(typeof renderEquip==='function' && !renderEquip.__mbh056){
      const old=renderEquip;
      renderEquip=function(){ const r=old.apply(this,arguments); renderEffectPanels056(); return r; };
      renderEquip.__mbh056=true;
    }
    if(typeof renderInventory==='function' && !renderInventory.__mbh056){
      const old=renderInventory;
      renderInventory=function(){ const r=old.apply(this,arguments); updateSellButton056(); return r; };
      renderInventory.__mbh056=true;
    }
  }
  function boot056(){
    /* syncVersion removed */
    hideHeaderMats056();
    patchFunctions056();
    ensureStatusHeight056();
    [document.getElementById('sellNormalChk'),document.getElementById('sellRareChk'),document.getElementById('sellLegendaryChk')].filter(Boolean).forEach(chk=>{
      if(chk.dataset.mbh056Bound==='1') return;
      chk.dataset.mbh056Bound='1';
      chk.addEventListener('change',updateSellButton056,true);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot056,{once:true}); else setTimeout(boot056,0);
  window.addEventListener('load',()=>setTimeout(boot056,0),{once:true});
  window.mbh056Check=()=>({build:document.documentElement.dataset.buildVersion, resourcesVisible:!!$('.topbar .resources')&&getComputedStyle($('.topbar .resources')).display!=='none', statusEffects:$('#statusSpecialEffects .effect-scroll')?.innerText||'', equipEffects:$('#equipEffectTotals .effect-scroll')?.innerText||'', sellText:$('#sellSelectedBtn')?.textContent||'', monsterHeight:$('.monster-records')?.getBoundingClientRect().height||0, inventoryOverflow:$('#inventory')?getComputedStyle($('#inventory')).overflowY:null});
})();

/* MBH ver.0.6.5: removed duplicate 0.5.7 inventory slot filter block. */

/* MBH ver.0.6.5: mobile tap recovery + status detail outside-close */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.5]', e); return null; } };
  function syncVersion058(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.documentElement.dataset.mbhVersion=BUILD;
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD+' debug'; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  function stripStatusCloseButton058(panel){
    if(!panel) return;
    panel.querySelectorAll('.status-detail-close').forEach(b=>b.remove());
    panel.classList.add('mbh-no-close-button');
  }

  function installStatusPanelOverride058(){
    safe(()=>{
      const oldEnsure = typeof ensureStatusDetailPanel === 'function' ? ensureStatusDetailPanel : null;
      window.__mbhOldEnsureStatusDetailPanel058 = window.__mbhOldEnsureStatusDetailPanel058 || oldEnsure;
      ensureStatusDetailPanel = function(){
        let panel = document.getElementById('statusDetailPanel');
        if(!panel){
          panel = document.createElement('div');
          panel.id = 'statusDetailPanel';
          panel.className = 'status-detail-panel hidden mbh-no-close-button';
          panel.innerHTML = '<div class="status-detail-title">状態詳細</div><div class="status-detail-body"></div>';
          document.body.appendChild(panel);
        }else{
          stripStatusCloseButton058(panel);
        }
        return panel;
      };
      const p=document.getElementById('statusDetailPanel');
      stripStatusCloseButton058(p);
    });
  }

  function isPanelOpen058(panel){ return !!panel && !panel.classList.contains('hidden'); }
  function shouldKeepStatusPanel058(target){
    if(!target || !target.closest) return false;
    if(target.closest('#statusDetailPanel')) return true;
    if(target.closest('.status-badge')) return true;
    // カードタップはバフ一覧を開く操作なので、外側タップ扱いにしない。
    if(target.closest('#enemyCard,#heroCard,.enemy-card,.hero-card')) return true;
    return false;
  }
  function installOutsideClose058(){
    if(window.__mbhStatusOutsideClose058) return;
    window.__mbhStatusOutsideClose058 = true;
    const close = (e)=>{
      const panel=document.getElementById('statusDetailPanel');
      if(!isPanelOpen058(panel)) return;
      const t=e.target;
      if(shouldKeepStatusPanel058(t)) return;
      safe(()=>{ if(typeof hideStatusTooltip==='function') hideStatusTooltip(); });
      safe(()=>{ if(typeof hideStatusDetailPanel==='function') hideStatusDetailPanel(); else panel.classList.add('hidden'); });
    };
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('touchstart', close, {capture:true, passive:true});
    document.addEventListener('click', close, true);
  }

  function isTouchEnv058(){
    try{ return matchMedia('(pointer: coarse), (max-width: 760px)').matches || navigator.maxTouchPoints>0; }catch(_){ return innerWidth<=760; }
  }
  function installMobileButtonTap058(){
    if(window.__mbhMobileButtonTap058) return;
    window.__mbhMobileButtonTap058 = true;
    const shouldTap = (el)=>{
      if(!el || !el.closest) return false;
      const target = el.closest('button,[role="button"],.item,.equip,[data-menu-page],#enemyCard,#heroCard');
      if(!target) return null;
      // バフ詳細パネル内は通常操作。×ボタンは存在させない。
      if(target.closest('#statusDetailPanel')) return null;
      return target;
    };
    document.addEventListener('touchend', (e)=>{
      if(!isTouchEnv058() || window.__mbhSyntheticTap058) return;
      const target = shouldTap(e.target);
      if(!target) return;
      // input/label はブラウザ標準に任せる。
      if(target.matches('input,label,select,textarea') || e.target.closest('label,input,select,textarea')) return;
      e.preventDefault();
      e.stopPropagation();
      window.__mbhSyntheticTap058 = true;
      try{
        target.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}));
      }finally{
        setTimeout(()=>{ window.__mbhSyntheticTap058 = false; }, 0);
      }
    }, {capture:true, passive:false});
  }

  function normalizeStatusOpenHandlers058(){
    // 既存のカードタップ処理が効かない環境向けに、pointerupでも開けるよう補助する。
    const bindCard=(sel,target)=>{
      const el=$(sel); if(!el || el.dataset.mbh058StatusTap==='1') return;
      el.dataset.mbh058StatusTap='1';
      const open=(e)=>{
        if(!isTouchEnv058()) return;
        e.preventDefault(); e.stopPropagation();
        safe(()=>{ if(typeof showStatusListPanel==='function') showStatusListPanel(target); });
      };
      el.addEventListener('pointerup', open, true);
    };
    bindCard('#enemyCard','enemy');
    bindCard('#heroCard','hero');
  }

  function boot058(){
    /* syncVersion removed */
    installStatusPanelOverride058();
    installOutsideClose058();
    installMobileButtonTap058();
    normalizeStatusOpenHandlers058();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot058, {once:true}); else boot058();
  window.addEventListener('load', boot058, {once:true});
  setTimeout(boot058, 250);
})();



/* MBH ver.0.6.5: inventory lock restore + slot filter fit + auto-lock valuables */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $id=(id)=>document.getElementById(id);
  const $q=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.5]', e); return null; } };

  function syncVersion059(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.documentElement.dataset.mbhVersion=BUILD;
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  function isDarkItem059(it){
    if(!it) return false;
    const name=String(it.name||'');
    return it.specialFrame==='darkholy' || /^闇/.test(name) || /^暗黒/.test(name) || name.includes('闇の') || name.includes('暗黒の');
  }
  function isHolyItem059(it){
    if(!it) return false;
    const name=String(it.name||'');
    return it.specialFrame==='holy' || /^(聖剣|聖盾|聖兜|聖鎧|聖籠手|聖靴|聖アミュレット)/.test(name);
  }
  function isAutoLockItem059(it){
    if(!it) return false;
    const name=String(it.name||'');
    return isDarkItem059(it) || name==='師匠のアミュレット';
  }
  function applyAutoLock059(it){
    if(it && isAutoLockItem059(it)){
      it.locked = true;
      it.unsellable = true;
    }
    return it;
  }
  function normalizeLocks059(){
    if(typeof state==='undefined') return;
    Object.values(state.equip||{}).forEach(applyAutoLock059);
    if(Array.isArray(state.inventory)) state.inventory.forEach(applyAutoLock059);
  }

  function getSlotFilter059(){
    return localStorage.getItem('mbh-inventory-slot-filter') || 'all';
  }
  function setSlotFilter059(v){
    localStorage.setItem('mbh-inventory-slot-filter', v || 'all');
  }
  function slotMatch059(it){
    const f=getSlotFilter059();
    if(f==='all') return true;
    if(f==='dark') return isDarkItem059(it);
    if(f==='holy') return isHolyItem059(it);
    return String(it?.slot||'')===f;
  }
  function rarityTargets059(){
    const out=[];
    if($id('sellNormalChk')?.checked) out.push('normal');
    if($id('sellRareChk')?.checked) out.push('rare');
    if($id('sellLegendaryChk')?.checked) out.push('legendary');
    return out;
  }
  function sellValue059(it){
    if(!it) return 0;
    const base = (it.specialFrame==='darkholy' || it.rarity==='legendary') ? 5 : (it.rarity==='rare' ? 3 : 1);
    const plus = Math.max(0, Math.floor(Number(it.level)||0));
    return base + plus;
  }
  function canSell059(it, targets=rarityTargets059()){
    return !!it && targets.includes(it.rarity) && !it.unsellable && !it.locked && slotMatch059(it);
  }
  function sellTargets059(){
    const targets=rarityTargets059();
    if(typeof state==='undefined' || !Array.isArray(state.inventory)) return [];
    return state.inventory.filter(it=>canSell059(it, targets));
  }
  function updateSellButton059(){
    const btn=$id('sellSelectedBtn'); if(!btn) return;
    const targets=rarityTargets059();
    const items=sellTargets059();
    const total=items.reduce((s,it)=>s+sellValue059(it),0);
    btn.disabled = targets.length===0 || items.length===0;
    btn.textContent = `経験値化 (${items.length}) +${total}`;
  }

  function ensureSlotFilter059(){
    const panel=$q('.inventory-panel');
    const actions=$q('.inventory-panel .inventory-actions');
    if(!panel || !actions) return;
    let bar=$id('inventorySlotFilter057') || $id('inventorySlotFilter059');
    if(!bar){
      bar=document.createElement('div');
      actions.insertAdjacentElement('afterend', bar);
    }
    bar.id='inventorySlotFilter059';
    bar.className='inventory-slot-filter-bar mbh059-slot-filter';
    const filters=[
      ['all','すべて'],['武器','武器'],['盾','盾'],['兜','兜'],['鎧','鎧'],['腕','腕'],['足','足'],['リング','指輪'],['アミュレット','護符'],['dark','闇'],['holy','聖剣']
    ];
    bar.innerHTML=filters.map(([v,t])=>`<button type="button" data-slot-filter="${v}" title="${v==='all'?'すべて':v==='dark'?'闇装備':v==='holy'?'聖剣シリーズ':v}">${t}</button>`).join('');
    if(bar.dataset.mbh059Bound!=='1'){
      bar.dataset.mbh059Bound='1';
      bar.addEventListener('click',(e)=>{
        const btn=e.target.closest?.('[data-slot-filter]');
        if(!btn) return;
        e.preventDefault(); e.stopPropagation();
        setSlotFilter059(btn.dataset.slotFilter||'all');
        syncSlotFilter059();
        if(typeof cancelInventoryActionMenu==='function') safe(()=>cancelInventoryActionMenu());
        if(typeof renderInventory==='function') safe(()=>renderInventory());
        updateSellButton059();
      },true);
      bar.addEventListener('touchend',(e)=>{
        const btn=e.target.closest?.('[data-slot-filter]');
        if(!btn) return;
        e.preventDefault(); e.stopPropagation();
        btn.click();
      },{passive:false});
    }
    syncSlotFilter059();
  }
  function syncSlotFilter059(){
    const f=getSlotFilter059();
    $$('#inventorySlotFilter059 [data-slot-filter]').forEach(btn=>{
      btn.classList.toggle('active',(btn.dataset.slotFilter||'all')===f);
    });
  }

  function itemNameColor059(it){
    if(typeof itemNameColor==='function') return itemNameColor(it);
    if(it?.specialFrame==='darkholy') return '#d58cff';
    if(it?.rarity==='legendary') return '#ffad31';
    if(it?.rarity==='rare') return '#4fa2ff';
    return '#f2f2f2';
  }
  function itemFrameClass059(it){
    if(typeof itemFrameClass==='function') return itemFrameClass(it);
    return it?.specialFrame || it?.rarity || '';
  }
  function fmtName059(it){
    if(typeof formatItemNameWithPlus==='function') return formatItemNameWithPlus(it);
    const plus=Math.max(0,Math.floor(Number(it?.level)||0));
    return `${it?.name||'装備'}${plus?` +${plus}`:''}`;
  }
  function summary059(it){
    if(typeof itemSummary==='function') return itemSummary(it)||'追加能力なし';
    return '追加能力なし';
  }
  function renderInventory059(){
    const inv=$id('inventory');
    if(!inv || typeof state==='undefined') return;
    normalizeLocks059();
    ensureSlotFilter059();
    inv.innerHTML='';
    const items=Array.isArray(state.inventory) ? state.inventory.filter(slotMatch059) : [];
    const selectedId=state.inventoryMenuItemId;
    if(!items.length){
      const empty=document.createElement('div');
      empty.className='inventory-empty';
      empty.textContent='このフィルターに該当する装備はありません。';
      inv.appendChild(empty);
      updateSellButton059();
      return;
    }
    items.forEach(it=>{
      const div=document.createElement('div');
      div.className=`item ${it.rarity||''} ${itemFrameClass059(it)} ${it.locked?'locked':''}${selectedId===it.id?' selected-inventory':''}`;
      div.dataset.itemId=String(it.id);
      const lock=it.locked ? '<em class="item-lock-mark">🔒</em>' : '';
      div.innerHTML=`<b style="color:${itemNameColor059(it)}">${lock}${escapeHtml(fmtName059(it))}</b><span>${escapeHtml(it.slot||'')}</span>`;
      const open=(e)=>{ if(e){ e.preventDefault(); e.stopPropagation(); } if(typeof setPointerMode==='function') setPointerMode(e?.pointerType && e.pointerType!=='mouse'?'touch':'mouse'); if(els?.tooltip) els.tooltip.classList.add('hidden'); showInventoryActionMenu059(it, div); };
      div.onclick=open;
      div.onpointerup=(e)=>{ if(e.pointerType && e.pointerType!=='mouse') open(e); };
      div.ontouchend=open;
      div.onpointerenter=(e)=>{ if(typeof isMouseLikePointer==='function' && isMouseLikePointer(e) && typeof showTip==='function') showTip(e,it); };
      div.onpointermove=(e)=>{ if(typeof isMouseLikePointer==='function' && isMouseLikePointer(e) && typeof showTip==='function') showTip(e,it); };
      div.onmousemove=(e)=>{ if(typeof showTip==='function') showTip(e,it); };
      div.onmouseleave=()=>{ if(state.inventoryMenuItemId!==it.id && els?.tooltip) els.tooltip.classList.add('hidden'); };
      inv.appendChild(div);
    });
    updateSellButton059();
  }

  function closeAction059(){
    const menu=$id('inventoryActionMenu');
    if(menu) menu.remove();
    if(typeof state!=='undefined') state.inventoryMenuItemId=null;
    $$('.item.selected-inventory').forEach(el=>el.classList.remove('selected-inventory'));
    if(els?.tooltip) els.tooltip.classList.add('hidden');
  }
  function positionAction059(menu, anchor){
    const width=Math.min(680, window.innerWidth-16);
    menu.style.width=width+'px';
    if((typeof isTouchDevice==='function' && isTouchDevice()) || window.innerWidth<=760){
      menu.style.left='50%';
      menu.style.right='auto';
      menu.style.top='auto';
      menu.style.bottom='12px';
      menu.style.transform='translateX(-50%)';
    }else{
      const r=anchor?.getBoundingClientRect?.() || {left:8,bottom:80,top:80};
      let left=Math.min(Math.max(8,r.left),window.innerWidth-width-8);
      let top=r.bottom+6;
      menu.style.left=left+'px';
      menu.style.right='auto';
      menu.style.top=top+'px';
      menu.style.bottom='auto';
      menu.style.transform='none';
      requestAnimationFrame(()=>{
        const mr=menu.getBoundingClientRect();
        if(mr.bottom>window.innerHeight-8) menu.style.top=Math.max(8,r.top-mr.height-6)+'px';
      });
    }
  }
  function showInventoryActionMenu059(it, anchor){
    if(!it) return;
    if(typeof state!=='undefined') state.inventoryMenuItemId=it.id;
    $$('.item.selected-inventory').forEach(el=>el.classList.remove('selected-inventory'));
    if(anchor) anchor.classList.add('selected-inventory');
    let menu=$id('inventoryActionMenu');
    if(!menu){
      menu=document.createElement('div');
      menu.id='inventoryActionMenu';
      menu.className='inventory-action-menu mbh059-action-menu';
      document.body.appendChild(menu);
    }
    const current=typeof state!=='undefined' ? state.equip?.[it.slot] : null;
    const diff=current && typeof itemPower==='function' ? Math.round(itemPower(it)-itemPower(current)) : 0;
    const locked=!!it.locked;
    const auto=isAutoLockItem059(it);
    const selectedSummary=summary059(it);
    const currentSummary=current ? summary059(current) : '未装備';
    menu.className='inventory-action-menu mbh059-action-menu inventory-action-menu-compare';
    menu.innerHTML=`
      <div class="inventory-action-title">
        <b>${locked?'🔒 ':''}${escapeHtml(fmtName059(it))}</b>
        <small>${escapeHtml(it.slot||'')} / ${escapeHtml(it.rarityName||it.rarity||'')}</small>
      </div>
      <div class="inventory-action-summary">
        <div class="inventory-compare-box">
          <div class="inventory-compare-col"><strong>選択装備</strong><b>${escapeHtml(fmtName059(it))}</b><pre>${escapeHtml(selectedSummary)}</pre></div>
          <div class="inventory-compare-col"><strong>現在装備</strong><b>${current?escapeHtml(fmtName059(current)):'未装備'}</b><pre>${escapeHtml(currentSummary)}</pre></div>
        </div>
        ${current?`<div class="inventory-power-diff">戦力差: ${diff>=0?'+':''}${diff}</div>`:''}
        ${auto?'<br><span class="auto-lock-note">自動ロック対象</span>':''}
      </div>
      <div class="inventory-action-buttons">
        <button type="button" data-action="equip">装備</button>
        <button type="button" data-action="lock">${locked?'ロック解除':'ロック'}</button>
        <button type="button" data-action="cancel">閉じる</button>
      </div>`;
    positionAction059(menu, anchor);
    const bind=(sel,fn)=>{
      const b=menu.querySelector(sel); if(!b) return;
      let last=0;
      const run=(e)=>{
        if(e){ e.preventDefault(); e.stopPropagation(); }
        const n=performance.now?performance.now():Date.now();
        if(n-last<250) return;
        last=n;
        if(typeof playUiClick==='function') safe(()=>playUiClick());
        fn();
      };
      b.onclick=run;
      b.onpointerup=(e)=>{ if(e.pointerType && e.pointerType!=='mouse') run(e); };
      b.ontouchend=run;
    };
    bind('[data-action="equip"]',()=>{ closeAction059(); if(typeof equipItem==='function') equipItem(it); });
    bind('[data-action="lock"]',()=>{
      if(!auto){
        it.locked=!it.locked;
        it.unsellable=!!it.locked;
      }else{
        it.locked=true; it.unsellable=true;
      }
      if(typeof scheduleSave==='function') scheduleSave();
      renderInventory059();
      const found=$id('inventory')?.querySelector(`[data-item-id="${String(it.id).replace(/["\\]/g,"\\$&")}"]`);
      showInventoryActionMenu059(it, found||anchor);
    });
    bind('[data-action="cancel"]',()=>{ closeAction059(); renderInventory059(); });
    menu.onclick=(e)=>e.stopPropagation();
    menu.onpointerup=(e)=>e.stopPropagation();
    menu.ontouchend=(e)=>e.stopPropagation();
  }
  function sellSelected059(){
    const items=sellTargets059();
    if(!items.length){ if(typeof log==='function') log('現在のフィルター内に経験値化できる装備がありません。',''); updateSellButton059(); return; }
    const ids=new Set(items.map(it=>it.id));
    state.inventory=state.inventory.filter(it=>!ids.has(it.id));
    const total=items.reduce((s,it)=>s+sellValue059(it),0);
    state.xp+=total;
    state.lastXpGain=total;
    const filterLabel=$q('#inventorySlotFilter059 [data-slot-filter].active')?.textContent || 'すべて';
    if(typeof log==='function') log(`${filterLabel}内の装備を${items.length}個経験値化。経験値+${total.toLocaleString()}。`,'good');
    if(typeof checkLevelUp==='function') checkLevelUp();
    if(typeof renderAll==='function') renderAll(); else renderInventory059();
    if(typeof scheduleSave==='function') scheduleSave();
  }

  function patchMakers059(){
    ['makeDarkHolySword','makeDarkShield','makeDarkAmulet','makeDarkArmor','makeDarkGauntlets','makeDarkHelm','makeDarkBoots'].forEach(name=>{
      const old=window[name];
      if(typeof old==='function' && !old.__mbh059){
        const wrapped=function(...args){ return applyAutoLock059(old.apply(this,args)); };
        wrapped.__mbh059=true;
        window[name]=wrapped;
        try{ eval(name+'=window["'+name+'"]'); }catch(_){}
      }
    });
    if(typeof makeItem==='function' && !makeItem.__mbh059){
      const oldMake=makeItem;
      makeItem=function(...args){ return applyAutoLock059(oldMake.apply(this,args)); };
      makeItem.__mbh059=true;
    }
    if(typeof makeRandomItem==='function' && !makeRandomItem.__mbh059){
      const oldRandom=makeRandomItem;
      makeRandomItem=function(...args){ return applyAutoLock059(oldRandom.apply(this,args)); };
      makeRandomItem.__mbh059=true;
    }
  }

  function patch059(){
    /* syncVersion removed */
    normalizeLocks059();
    patchMakers059();
    window.showInventoryActionMenu=showInventoryActionMenu059;
    window.cancelInventoryActionMenu=closeAction059;
    if(typeof renderInventory==='function') renderInventory=renderInventory059;
    if(typeof updateSellButtonState==='function') updateSellButtonState=updateSellButton059;
    if(typeof sellExpValue==='function') sellExpValue=sellValue059;
    if(typeof sellSelectedRarities==='function') sellSelectedRarities=sellSelected059;
    ensureSlotFilter059();
    const sellBtn=$id('sellSelectedBtn');
    if(sellBtn){
      sellBtn.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); if(sellBtn.disabled) return; if(typeof playUiClick==='function') safe(()=>playUiClick()); sellSelected059(); };
    }
    [$id('sellNormalChk'),$id('sellRareChk'),$id('sellLegendaryChk')].filter(Boolean).forEach(chk=>{
      if(chk.dataset.mbh059Bound==='1') return;
      chk.dataset.mbh059Bound='1';
      chk.addEventListener('change',()=>updateSellButton059(),true);
    });
    safe(()=>renderInventory059());
    updateSellButton059();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',patch059,{once:true}); else setTimeout(patch059,0);
  window.addEventListener('load',()=>setTimeout(patch059,80),{once:true});
  window.mbh059Check=()=>({
    build:document.documentElement.dataset.buildVersion,
    filter:getSlotFilter059(),
    sellText:$id('sellSelectedBtn')?.textContent||'',
    locked:Array.isArray(state?.inventory)?state.inventory.filter(x=>x.locked).length:0,
    visible:$id('inventory')?.children.length||0
  });
})();


/* MBH ver.0.6.5: inventory filter single-source cleanup */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(id)=>document.getElementById(id);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.5]', e); return null; } };
  function syncVersion060(){
    window.APP_VERSION=BUILD; window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.documentElement.dataset.mbhVersion=BUILD;
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }
  function removeDuplicateSlotFilters060(){
    const bars=$$('.inventory-slot-filter-bar');
    if(!bars.length) return;
    let keep = $('inventorySlotFilter059') || bars[bars.length-1];
    bars.forEach(bar=>{ if(bar!==keep) bar.remove(); });
    keep.id='inventorySlotFilter059';
    keep.className='inventory-slot-filter-bar mbh059-slot-filter';
    const labels=[['all','全て'],['武器','武器'],['盾','盾'],['兜','兜'],['鎧','鎧'],['腕','腕'],['足','足'],['リング','指輪'],['アミュレット','護符'],['dark','闇'],['holy','聖剣']];
    const current=localStorage.getItem('mbh-inventory-slot-filter') || 'all';
    keep.innerHTML=labels.map(([v,t])=>`<button type="button" data-slot-filter="${v}" title="${v==='all'?'全て':v==='dark'?'闇装備':v==='holy'?'聖剣シリーズ':v}" class="${v===current?'active':''}">${t}</button>`).join('');
  }
  function boot060(){
    /* syncVersion removed */
    removeDuplicateSlotFilters060();
    if(typeof renderInventory==='function') safe(()=>renderInventory());
    setTimeout(removeDuplicateSlotFilters060, 80);
    setTimeout(removeDuplicateSlotFilters060, 300);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot060, {once:true}); else boot060();
  window.addEventListener('load', boot060, {once:true});
})();


/* ver0.6.5: debug enemy level +/-1,+/-10 and next specified boss buttons */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(id)=>document.getElementById(id);
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.5]',e); return null; } };

  function syncVersion061(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  function currentEnemyLevel061(){
    if(typeof state==='undefined') return 1;
    return Math.max(1, Math.floor(Number(state.enemyLevelBase)||Number(state.enemy?.level)||Number(state.level)||1));
  }

  function setEnemyLevel061(next){
    if(typeof state==='undefined') return;
    const cur=currentEnemyLevel061();
    const n=Math.max(1, Math.floor(Number(next)||1));
    state.enemyLevelBase=n;
    state.enemyLevelBaseDefeated=Math.max(0,Math.floor(Number(state.defeated)||0));
    safe(()=>{ if(typeof log==='function') log('デバッグ：敵出現レベルをLv.'+cur+'→Lv.'+n+'に変更。','system'); });
    safe(()=>{ if(typeof renderAll==='function') renderAll(); });
    safe(()=>{ if(typeof scheduleSave==='function') scheduleSave(); });
  }

  function adjustEnemyLevel061(delta){ setEnemyLevel061(currentEnemyLevel061()+delta); }

  function getBossBase061(id){
    if(id==='dark_sword_saint') return (typeof DARK_SWORD_SAINT!=='undefined') ? DARK_SWORD_SAINT : {id:'dark_sword_saint',name:'暗黒剣聖'};
    if(typeof ENEMIES!=='undefined' && Array.isArray(ENEMIES)) return ENEMIES.find(e=>e.id===id) || null;
    return null;
  }

  function setNextBoss061(id){
    if(typeof state==='undefined') return;
    const boss=getBossBase061(id);
    if(!boss){ console.warn('[MBH0.6.5] unknown boss', id); return; }
    const lv=currentEnemyLevel061();
    state.debugForcedBossNext={id:boss.id, level:lv, from:'debug061'};
    state.pendingBossForNext=null;
    state.forceNextDarkSwordSaint=false;
    if(boss.id==='dark_sword_saint'){
      state.forceNextDarkSwordSaint=true;
      state.debugForcedBossNext=null;
    }
    safe(()=>{ if(typeof log==='function') log('デバッグ：次の敵を'+(boss.name||boss.id)+' Lv.'+lv+'に設定。','danger'); });
    safe(()=>{ if(typeof banner==='function') banner('次の敵：'+(boss.name||boss.id),1400); });
    safe(()=>{ if(typeof scheduleSave==='function') scheduleSave(); });
  }

  function forceRespawn061(){
    safe(()=>{
      if(typeof spawnEnemy==='function'){
        if(typeof state!=='undefined'){
          state.enemy=null;
          state.enemyHp=0;
        }
        spawnEnemy(false);
      }
    });
  }

  function removeOldLevelButtons061(){
    ['debugEnemyLvMinus5','debugEnemyLvPlus5'].forEach(id=>{ const b=$(id); if(b) b.remove(); });
    const textKill=['敵Lv -5','敵Lv +5'];
    Array.from(document.querySelectorAll('#debugPanel button')).forEach(b=>{ if(textKill.includes((b.textContent||'').trim())) b.remove(); });
  }

  function makeBtn061(id,text,fn,anchor){
    const p=$('debugPanel'); if(!p) return null;
    let b=$(id);
    if(!b){
      b=document.createElement('button');
      b.id=id;
      b.type='button';
      b.textContent=text;
      p.insertBefore(b, anchor || $('debugClose') || null);
    }else{
      b.textContent=text;
      b.type='button';
    }
    if(b.dataset.mbh061Bound==='1') return b;
    b.dataset.mbh061Bound='1';
    b.addEventListener('click',e=>{
      e.preventDefault(); e.stopPropagation();
      safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
      fn();
      return false;
    },true);
    return b;
  }

  function installDebug061(){
    const p=$('debugPanel'); if(!p) return;
    removeOldLevelButtons061();
    let block=$('debugBossPicker061');
    if(!block){
      block=document.createElement('div');
      block.id='debugBossPicker061';
      block.className='debug-grid debug-boss-picker';
      const close=$('debugClose');
      p.insertBefore(block, close || null);
    }
    block.innerHTML='';

    makeBtn061('debugEnemyLvMinus10','敵Lv -10',()=>adjustEnemyLevel061(-10),block);
    makeBtn061('debugEnemyLvMinus1','敵Lv -1',()=>adjustEnemyLevel061(-1),block);
    makeBtn061('debugEnemyLvPlus1','敵Lv +1',()=>adjustEnemyLevel061(1),block);
    makeBtn061('debugEnemyLvPlus10','敵Lv +10',()=>adjustEnemyLevel061(10),block);

    const bossTitle=document.createElement('div');
    bossTitle.className='debug-section-title';
    bossTitle.textContent='次の敵を指定ボスに設定';
    block.appendChild(bossTitle);
    const bosses=[
      ['debugBossSlimeKing061','スライムキング','slime_king'],
      ['debugBossOrc061','オーク','orc'],
      ['debugBossDragon061','ドラゴン','dragon'],
      ['debugBossFireKing061','火の精霊王','fire_king'],
      ['debugBossDarkSaint061','暗黒剣聖','dark_sword_saint']
    ];
    bosses.forEach(([id,text,bossId])=>{
      const b=document.createElement('button');
      b.id=id; b.type='button'; b.textContent=text;
      b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); setNextBoss061(bossId); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); return false; },true);
      block.appendChild(b);
    });
    // ver0.6.5: 『設定した次の敵と戦闘』ボタンは削除。次の敵予約のみ残す。
  }

  function installStyle061(){
    if($('mbh061-debug-css')) return;
    const st=document.createElement('style'); st.id='mbh061-debug-css';
    st.textContent=`
      #debugPanel .debug-boss-picker{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;margin-top:6px!important;}
      #debugPanel .debug-boss-picker .debug-section-title{grid-column:1/-1;color:#ffd76b;font-weight:900;font-size:12px;border-top:1px solid rgba(255,215,107,.35);padding-top:6px;margin-top:2px;}
      #debugPanel .debug-boss-picker button{min-width:0!important;width:100%!important;white-space:normal!important;line-height:1.15!important;}
      #debugRespawnBoss061{grid-column:1/-1!important;}
    `;
    document.head.appendChild(st);
  }

  function boot061(){ /* syncVersion removed */ installStyle061(); installDebug061(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot061,{once:true}); else setTimeout(boot061,0);
  window.addEventListener('load',()=>setTimeout(boot061,80),{once:true});
})();


/* MBH ver.0.6.5: UI label, mobile audio background stop, invincible debug, dark grant repair, SP expbar */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(id)=>document.getElementById(id);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.5]',e); return null; } };

  function syncVersion062(){
    window.APP_VERSION=BUILD; window.GAME_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.documentElement.dataset.mbhVersion=BUILD;
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  function fixEquipLabels062(){
    $$('[data-menu-page="equip"]').forEach(b=>{ b.textContent='装備'; });
    $$('button').forEach(b=>{ if((b.textContent||'').trim()==='装備・強化') b.textContent='装備'; });
  }

  function isMobileLike062(){
    try{ return matchMedia('(pointer: coarse), (max-width: 760px)').matches || navigator.maxTouchPoints>0; }
    catch(_){ return innerWidth<=760; }
  }
  function stopForMobileBackground062(){ return; }
  function resumeFromMobileBackground062(){
    window.__mbhMobileBackgroundMuted062=false;
    if(!isMobileLike062()) return;
    if(document.hidden) return;
    // スマホはユーザー操作なしで勝手に音を再開しない。既存の音ON操作に任せる。
    safe(()=>{ if(typeof state!=='undefined') state.bgmPausedByVisibility=false; });
  }
  function installMobileAudioGuard062(){ return; }

  function ensureDebugFlags062(){
    if(typeof state==='undefined') return;
    if(!state.debug) state.debug={};
    state.debug.heroInvincible=!!state.debug.heroInvincible;
    state.debug.enemyInvincible=!!state.debug.enemyInvincible;
  }
  function addDebugToggle062(id,label,flag,anchor){
    const p=$('debugPanel'); if(!p || typeof state==='undefined') return null;
    ensureDebugFlags062();
    let b=$(id);
    if(!b){ b=document.createElement('button'); b.id=id; b.type='button'; p.insertBefore(b, anchor || $('debugClose') || null); }
    const refresh=()=>{ b.textContent=label+'：'+(state.debug[flag]?'ON':'OFF'); b.classList.toggle('active',!!state.debug[flag]); };
    refresh();
    if(b.dataset.mbh062Bound!=='1'){
      b.dataset.mbh062Bound='1';
      b.addEventListener('click',e=>{
        e.preventDefault(); e.stopPropagation();
        ensureDebugFlags062(); state.debug[flag]=!state.debug[flag]; refresh();
        safe(()=>{ if(typeof playUiClick==='function') playUiClick(); });
        safe(()=>{ if(typeof log==='function') log('デバッグ：'+label+' '+(state.debug[flag]?'ON':'OFF'),'system'); });
        safe(()=>{ if(typeof scheduleSave==='function') scheduleSave(); });
        return false;
      },true);
    }
    return b;
  }
  function installInvincibleDebug062(){
    const p=$('debugPanel'); if(!p) return;
    ensureDebugFlags062();
    const anchor=$('debugGrantDarkSet') || $('mbhTraceBox') || $('debugClose');
    addDebugToggle062('debugHeroInvincible062','主人公無敵','heroInvincible',anchor);
    addDebugToggle062('debugEnemyInvincible062','敵無敵','enemyInvincible',anchor);
  }
  function isHeroInv062(){ return !!(typeof state!=='undefined' && state.debug && state.debug.heroInvincible); }
  function isEnemyInv062(){ return !!(typeof state!=='undefined' && state.debug && state.debug.enemyInvincible); }
  function patchInvincibleLogic062(){
    if(window.__mbh062InvLogicInstalled) return;
    window.__mbh062InvLogicInstalled=true;
    if(typeof applyHeroHit==='function' && !applyHeroHit.__mbh062){
      const old=applyHeroHit;
      applyHeroHit=function(skill){
        if(isEnemyInv062() && typeof state!=='undefined' && state.enemy){
          safe(()=>{ if(typeof showFloat==='function') showFloat('敵無敵','guard'); });
          safe(()=>{ if(typeof renderBattle==='function') renderBattle(); });
          return;
        }
        return old.apply(this,arguments);
      };
      applyHeroHit.__mbh062=true;
    }
    if(typeof enemyAttack==='function' && !enemyAttack.__mbh062){
      const old=enemyAttack;
      enemyAttack=function(now){
        if(isHeroInv062()){
          if(typeof state!=='undefined') state.lastEnemyAttack=now || performance.now();
          safe(()=>{ if(typeof showHeroFloat==='function') showHeroFloat('主人公無敵','guard'); });
          safe(()=>{ if(typeof renderBattle==='function') renderBattle(); });
          return;
        }
        return old.apply(this,arguments);
      };
      enemyAttack.__mbh062=true;
    }
    if(typeof applyDarkSwordDanceHit==='function' && !applyDarkSwordDanceHit.__mbh062){
      const old=applyDarkSwordDanceHit;
      applyDarkSwordDanceHit=function(){
        if(isHeroInv062()){
          safe(()=>{ if(typeof showHeroFloat==='function') showHeroFloat('主人公無敵','guard'); });
          safe(()=>{ if(typeof renderBattle==='function') renderBattle(); });
          return;
        }
        return old.apply(this,arguments);
      };
      applyDarkSwordDanceHit.__mbh062=true;
    }
    if(typeof dragonFireBreath==='function' && !dragonFireBreath.__mbh062){
      const old=dragonFireBreath;
      dragonFireBreath=function(){
        if(isHeroInv062()){
          safe(()=>{ if(typeof banner==='function') banner('主人公無敵'); });
          safe(()=>{ if(typeof showHeroFloat==='function') showHeroFloat('主人公無敵','guard'); });
          if(typeof state!=='undefined') state.dragonBreathActive=false;
          return;
        }
        return old.apply(this,arguments);
      };
      dragonFireBreath.__mbh062=true;
    }
    if(typeof processStatusDots==='function' && !processStatusDots.__mbh062){
      const old=processStatusDots;
      processStatusDots=function(now){
        const hp=(typeof state!=='undefined')?state.hp:null;
        const ehp=(typeof state!=='undefined')?state.enemyHp:null;
        const ret=old.apply(this,arguments);
        if(isHeroInv062() && hp!=null) state.hp=hp;
        if(isEnemyInv062() && ehp!=null && state.enemy) state.enemyHp=ehp;
        return ret;
      };
      processStatusDots.__mbh062=true;
    }
    if(typeof handleHeroDeath==='function' && !handleHeroDeath.__mbh062){
      const old=handleHeroDeath;
      handleHeroDeath=function(){
        if(isHeroInv062()){
          if(typeof state!=='undefined') state.hp=Math.max(1, state.hp||1);
          safe(()=>{ if(typeof renderBattle==='function') renderBattle(); });
          return;
        }
        return old.apply(this,arguments);
      };
      handleHeroDeath.__mbh062=true;
    }
    if(typeof startDown==='function' && !startDown.__mbh062){
      const old=startDown;
      startDown=function(){
        if(isHeroInv062()){
          if(typeof state!=='undefined') state.hp=Math.max(1, state.hp||1);
          return;
        }
        return old.apply(this,arguments);
      };
      startDown.__mbh062=true;
    }
    if(typeof addBleed==='function' && !addBleed.__mbh062){
      const old=addBleed;
      addBleed=function(target){ if(target==='hero' && isHeroInv062()) return false; return old.apply(this,arguments); };
      addBleed.__mbh062=true;
    }
    if(typeof addBurn==='function' && !addBurn.__mbh062){
      const old=addBurn;
      addBurn=function(target){ if(target==='hero' && isHeroInv062()) return false; return old.apply(this,arguments); };
      addBurn.__mbh062=true;
    }
    if(typeof addDarkBleed==='function' && !addDarkBleed.__mbh062){
      const old=addDarkBleed;
      addDarkBleed=function(target='hero'){ if(target!=='enemy' && isHeroInv062()) return false; return old.apply(this,arguments); };
      addDarkBleed.__mbh062=true;
    }
  }

  function legendary062(){
    return (typeof rarities!=='undefined' && Array.isArray(rarities) && rarities.find(r=>r.id==='legendary')) || {id:'legendary',name:'レジェンダリー',mult:3.2,color:'#ffad31'};
  }
  function darkLevel062(levelOverride){
    if(typeof darkEquipLevelFromSource==='function') return darkEquipLevelFromSource(levelOverride);
    const raw=Math.max(1,Math.floor(Number(levelOverride)||Number(state?.enemy?.level)||Number(state?.level)||1));
    return raw<100 ? raw*100 : raw;
  }
  function applyLock062(it){
    if(!it) return it;
    if(it.specialFrame==='darkholy' || /^闇の|^暗黒の/.test(String(it.name||'')) || it.name==='師匠のアミュレット'){
      it.locked=true; it.unsellable=true;
    }
    return it;
  }
  function baseDarkItem062(slot,name,levelOverride){
    const lv=darkLevel062(levelOverride), r=legendary062();
    let it;
    if(typeof makeItem==='function') it=makeItem(slot,r,{levelOverride:lv});
    else it={id:'dark_'+Date.now()+'_'+Math.random().toString(36).slice(2),slot,level:0,itemLevel:lv};
    it.name=name; it.slot=slot; it.rarity='legendary'; it.rarityName='レジェンダリー'; it.specialFrame='darkholy'; it.itemLevel=lv;
    return applyLock062(it);
  }
  function defineMissingDarkMakers062(){
    if(typeof makeDarkArmor!=='function'){
      window.makeDarkArmor=makeDarkArmor=function(levelOverride){ const lv=darkLevel062(levelOverride), it=baseDarkItem062('鎧','闇の鎧',lv); it.fireRes=(it.fireRes||0)+0.10; it.darkArmor=true; it.flavor='被ダメージ軽減25%。火軽減10%。暗黒出血上限を20まで軽減。'; return applyLock062(applySpecialEquipmentParameters(it)); };
    }
    if(typeof makeDarkGauntlets!=='function'){
      window.makeDarkGauntlets=makeDarkGauntlets=function(levelOverride){ const lv=darkLevel062(levelOverride), it=baseDarkItem062('腕','闇の籠手',lv); it.deathDanceCountBonus=2; it.darkGauntlets=true; it.flavor='死線の剣舞の連続回数+2。'; return applyLock062(applySpecialEquipmentParameters(it)); };
    }
    if(typeof makeDarkHelm!=='function'){
      window.makeDarkHelm=makeDarkHelm=function(levelOverride){ const lv=darkLevel062(levelOverride), it=baseDarkItem062('兜','闇の兜',lv); it.deathDanceChance=0.10; it.darkHelm=true; it.flavor='死線の剣舞発動率+10%。剣舞中は状態異常無効。'; return applyLock062(applySpecialEquipmentParameters(it)); };
    }
    if(typeof makeDarkBoots!=='function'){
      window.makeDarkBoots=makeDarkBoots=function(levelOverride){ const lv=darkLevel062(levelOverride), it=baseDarkItem062('足','暗黒の靴',lv); it.evasion=(it.evasion||0)+0.25; it.darkBoots=true; it.flavor='回避+25%。HP半分以下でさらに回避+25%。'; return applyLock062(applySpecialEquipmentParameters(it)); };
    }
    ['makeDarkHolySword','makeDarkShield','makeDarkAmulet','makeDarkArmor','makeDarkGauntlets','makeDarkHelm','makeDarkBoots'].forEach(name=>{
      const old=window[name];
      if(typeof old==='function' && !old.__mbh062Lock){
        const wrapped=function(...args){ return applyLock062(old.apply(this,args)); };
        wrapped.__mbh062Lock=true;
        window[name]=wrapped;
        try{ eval(name+'=window["'+name+'"]'); }catch(_){ }
      }
    });
  }
  function callDarkMaker062(name,level){
    defineMissingDarkMakers062();
    const fn=window[name] || safe(()=>eval(name));
    if(typeof fn!=='function') return null;
    return applyLock062(fn(level));
  }
  const DARK_DEBUG_ITEMS062=[
    ['makeDarkHolySword','闇の聖剣'],['makeDarkShield','闇の盾'],['makeDarkAmulet','闇のアミュレット'],['makeDarkArmor','闇の鎧'],['makeDarkGauntlets','闇の籠手'],['makeDarkHelm','闇の兜'],['makeDarkBoots','暗黒の靴']
  ];
  function grantDark062(name){
    if(typeof state==='undefined') return;
    const lv=Math.max(1,Math.floor(Number(state.level)||1));
    const it=callDarkMaker062(name,lv);
    if(!it){ safe(()=>{ if(typeof log==='function') log('デバッグ：闇装備付与に失敗。','danger'); }); return; }
    state.inventory.unshift(it);
    safe(()=>{ if(typeof renderAll==='function') renderAll(); });
    safe(()=>{ if(typeof scheduleSave==='function') scheduleSave(); });
    safe(()=>{ if(typeof log==='function') log('デバッグ：'+it.name+'を倉庫に追加（自動ロック）。','good'); });
  }
  function installDarkGrantDebug062(){
    const box=$('debugGrantDarkItems');
    if(box){
      box.innerHTML='';
      DARK_DEBUG_ITEMS062.forEach(([fn,label])=>{
        const b=document.createElement('button'); b.type='button'; b.textContent=label; b.dataset.darkMaker=fn;
        b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); grantDark062(fn); return false; },true);
        box.appendChild(b);
      });
    }
    const setBtn=$('debugGrantDarkSet');
    if(setBtn && setBtn.dataset.mbh062Bound!=='1'){
      setBtn.dataset.mbh062Bound='1';
      setBtn.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); safe(()=>{ if(typeof playUiClick==='function') playUiClick(); }); DARK_DEBUG_ITEMS062.forEach(([fn])=>grantDark062(fn)); return false; },true);
    }
  }

  function removeRespawnBossButton062(){
    const b=$('debugRespawnBoss061'); if(b) b.remove();
    $$('button').forEach(btn=>{ if((btn.textContent||'').trim()==='設定した次の敵と戦闘') btn.remove(); });
  }

  function installSpExpbar062(){
    if($('mbh062-sp-exp-style')) return;
    const st=document.createElement('style'); st.id='mbh062-sp-exp-style';
    st.textContent=`
      @media (max-width:760px), (pointer:coarse){
        html[data-build-version="0.6.8"] .battle-panel .expbar{
          display:block!important;visibility:visible!important;opacity:1!important;
          position:absolute!important;left:8px!important;right:8px!important;
          bottom:max(8px, env(safe-area-inset-bottom, 0px))!important;
          height:28px!important;z-index:120!important;pointer-events:none!important;
          border:2px solid #c99b39!important;background:rgba(10,6,3,.9)!important;
          box-shadow:0 0 14px #000,inset 0 0 8px #000!important;overflow:hidden!important;
        }
        html[data-build-version="0.6.8"] .battle-panel .expbar span{line-height:24px!important;font-size:12px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;padding:0 48px 0 6px!important;}
        html[data-build-version="0.6.8"] .battle-panel .expbar b{display:block!important;right:8px!important;top:3px!important;font-size:12px!important;}
        html[data-build-version="0.6.8"] .battle-panel{padding-bottom:36px!important;}
      }
    `;
    document.head.appendChild(st);
  }

  function boot062(){
    /* syncVersion removed */
    fixEquipLabels062();
    /* disabled 0.6.18: installMobileAudioGuard062 caused click freeze */
    installInvincibleDebug062();
    patchInvincibleLogic062();
    defineMissingDarkMakers062();
    installDarkGrantDebug062();
    removeRespawnBossButton062();
    installSpExpbar062();
    safe(()=>{ if(typeof renderAll==='function') renderAll(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot062,{once:true}); else setTimeout(boot062,0);
  window.addEventListener('load',()=>setTimeout(boot062,120),{once:true});
  setTimeout(boot062,600);
  window.mbh062Check=()=>({
    build:document.documentElement.dataset.buildVersion,
    equipTabs:$$('[data-menu-page="equip"]').map(x=>x.textContent),
    respawnButton:!!$('debugRespawnBoss061'),
    darkButtons:$('debugGrantDarkItems')?.children.length||0,
    heroInvincible:!!state?.debug?.heroInvincible,
    enemyInvincible:!!state?.debug?.enemyInvincible,
    expbar:{w:$('expLabel')?.offsetWidth,h:$('expLabel')?.offsetHeight,text:$('expLabel')?.textContent}
  });
})();


/* MBH ver.0.6.5: legal modal front-layer fix */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $=(id)=>document.getElementById(id);
  function safe(fn){try{return fn&&fn();}catch(e){console.error('[MBH0.6.5 legal]', e);}}
  function setBuild(){
    window.GAME_VERSION=BUILD;
    window.APP_VERSION=BUILD;
    document.documentElement.dataset.buildVersion=BUILD;
    document.querySelectorAll('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{el.textContent='ver.'+BUILD;});
    document.querySelectorAll('.debug-version').forEach(el=>{el.textContent='Build: ver.'+BUILD;});
  }
  function liftLegal(){
    const modal=$('legalModal');
    if(!modal) return;
    if(modal.parentElement!==document.body) document.body.appendChild(modal);
    modal.style.zIndex='2147483600';
    const bg=modal.querySelector('.legal-modal-backdrop'); if(bg) bg.style.zIndex='2147483601';
    const card=modal.querySelector('.legal-modal-card'); if(card) card.style.zIndex='2147483602';
    document.body.classList.toggle('mbh-legal-open', !modal.classList.contains('hidden'));
  }
  const oldOpen = (typeof window.openLegalModal==='function') ? window.openLegalModal : null;
  window.openLegalModal=function(type){
    if(oldOpen) safe(()=>oldOpen(type));
    else {
      const modal=$('legalModal');
      const title=$('legalModalTitle');
      if(title) title.textContent = type==='terms'?'利用規約':(type==='privacy'?'プライバシーポリシー':'クレジット');
      modal?.classList.remove('hidden');
    }
    liftLegal();
  };
  const oldClose = (typeof window.closeLegalModal==='function') ? window.closeLegalModal : null;
  window.closeLegalModal=function(){
    if(oldClose) safe(()=>oldClose());
    else $('legalModal')?.classList.add('hidden');
    document.body.classList.remove('mbh-legal-open');
    liftLegal();
  };
  function bind(){
    /* setBuild removed */
    liftLegal();
    [['creditBtn','credit'],['termsBtn','terms'],['privacyBtn','privacy']].forEach(([id,type])=>{
      const b=$(id); if(!b || b.dataset.mbh064Legal==='1') return;
      b.dataset.mbh064Legal='1';
      b.addEventListener('click', e=>{e.preventDefault();e.stopPropagation();safe(()=>{if(typeof playUiClick==='function')playUiClick();});window.openLegalModal(type);return false;}, true);
      b.addEventListener('touchend', e=>{e.preventDefault();e.stopPropagation();window.openLegalModal(type);return false;}, {capture:true, passive:false});
    });
    const close=$('legalModalClose');
    if(close && close.dataset.mbh064Legal!=='1'){
      close.dataset.mbh064Legal='1';
      close.addEventListener('click', e=>{e.preventDefault();e.stopPropagation();window.closeLegalModal();return false;}, true);
      close.addEventListener('touchend', e=>{e.preventDefault();e.stopPropagation();window.closeLegalModal();return false;}, {capture:true, passive:false});
    }
    const modal=$('legalModal');
    if(modal && modal.dataset.mbh064Backdrop!=='1'){
      modal.dataset.mbh064Backdrop='1';
      modal.addEventListener('click', e=>{ if(e.target?.dataset?.legalClose){ e.preventDefault(); e.stopPropagation(); window.closeLegalModal(); }}, true);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind, {once:true}); else bind();
  window.addEventListener('load', bind, {once:true});
})();


// ===== ver0.6.6 天聖騎士・聖剣シリーズ追加 =====
function isTenseiKnight(e=state.enemy){ return !!e && e.id === 'tensei_knight'; }
function showHolyCutin(kind){
  const data = kind === 'release' ? HOLY_SWORD_RELEASE_CUTIN : TENSEI_KNIGHT_CUTIN;
  try{
    const token = showSharedCutin({
      img:data.img,
      quote:data.quote,
      title:kind === 'release' ? '聖剣解放' : '勇者の覚醒',
      mode:'holy',
      alt:kind === 'release' ? '聖剣解放カットイン' : '勇者の覚醒カットイン'
    });
    if(token != null) scheduleSharedCutinHide(token, 1400);
  }catch(e){}
}
function processTenseiKnight(now){
  if(!isTenseiKnight() || !state.enemyStatuses) return;
  if(!state.enemyStatuses.holyRegenLast) state.enemyStatuses.holyRegenLast = now;
  const ticks = Math.floor((now - state.enemyStatuses.holyRegenLast)/1000);
  if(ticks > 0){
    state.enemyStatuses.holyRegenLast += ticks*1000;
    const rate = state.enemyHp <= state.enemy.maxHp * .5 ? .02 : .01;
    const heal = Math.max(1, Math.floor(state.enemy.maxHp * rate * ticks));
    if(state.enemyHp > 0 && state.enemyHp < state.enemy.maxHp){ state.enemyHp = Math.min(state.enemy.maxHp, state.enemyHp + heal); showFloat(`+${heal}`, 'heal'); }
  }
  if(!state.enemyStatuses.holyAwakened && state.enemyHp <= state.enemy.maxHp * .5){
    state.enemyStatuses.holyAwakened = true;
    showHolyCutin('awake');
    banner('勇者の覚醒', 1800);
    log('天聖騎士が勇者の覚醒を発動！ 全身から聖なるオーラが噴き出す。','danger');
  }
}
function tenseiKnightIntervalMul(){ return isTenseiKnight() && state.enemyStatuses?.holyAwakened ? .5 : 1; }
const __oldEnemyInterval066 = enemyInterval;
enemyInterval = function(){ return Math.max(360, __oldEnemyInterval066() * tenseiKnightIntervalMul()); };
function makeHolyItem(slot, levelOverride){
  const lv = Math.max(1, Math.floor(Number(levelOverride)||Number(state.level)||1));
  const legendary = rarities.find(r=>r.id==='legendary') || {id:'legendary', name:'レジェンダリー', mult:3.2};
  const it = makeItem(slot, legendary, {levelOverride:lv});
  it.rarity='legendary'; it.rarityName='レジェンダリー'; it.specialFrame='holy'; it.itemLevel=lv; it.level=0;
  if(slot==='武器'){ it.name='聖剣エクシリア'; it.holyAtkSpeed=.10; it.skill={id:'heavy', name:'聖なる一閃', chance:.18, element:'physical'}; it.flavor='攻撃速度+10%。聖なる一閃で光の追加攻撃を放つ。'; }
  if(slot==='盾'){ it.name='聖盾アークガード'; it.holyDamageReduce=.05; it.flavor='被ダメージ軽減+5%。勇者を守る黄金の盾。'; }
  if(slot==='兜'){ it.name='聖兜セラフィム'; it.holyAilmentReduce=.50; it.flavor='状態異常の時間・ダメージ・デバフ量を50%軽減。重複は乗算。'; }
  if(slot==='鎧'){ it.name='聖鎧オーレリア'; it.holyDamageReduce=.10; it.holyRegenRate=.02; it.flavor='被ダメージ軽減+10%。10秒ごとにHP2%回復。'; }
  if(slot==='腕'){ it.name='聖籠手グランツ'; it.holyAtkSpeed=.20; it.flavor='攻撃速度+20%。神速の連撃を可能にする。'; }
  if(slot==='足'){ it.name='聖靴ルミナス'; it.guard=.15; it.flavor='回避/ガード+15%。光の歩法で攻撃をかわす。'; }
  if(slot==='アミュレット'){ it.name='聖アミュレット'; it.holyRegenRate=.05; it.holyAilmentReduce=.50; it.flavor='10秒ごとにHP5%回復。状態異常の時間・ダメージ・デバフ量を50%軽減。'; }
  return applySpecialEquipmentParameters(it);
}
function grantHolySet(){ ['武器','盾','兜','鎧','腕','足','アミュレット'].forEach(slot=>state.inventory.unshift(makeHolyItem(slot, state.level))); renderAll(); log('デバッグ：聖剣シリーズ7種を倉庫に追加。','good'); scheduleSave(); }
function installHolyDebug066(){
  const p=document.getElementById('debugPanel'); if(!p) return;
  const close=document.getElementById('debugClose');
  let b2=document.getElementById('debugGrantHolySet');
  if(!b2){ b2=document.createElement('button'); b2.id='debugGrantHolySet'; b2.textContent='聖剣シリーズ7種付与'; p.insertBefore(b2, close); }
  b2.onclick=()=>{playUiClick(); grantHolySet();};
}
setTimeout(installHolyDebug066, 300);

// ===== ver0.6.7 天聖騎士 独立Lv・不屈・バフ表示の補強 =====
(function(){
  const __oldHandleHeroDeath067 = handleHeroDeath;
  handleHeroDeath = function(){
    if(!isTenseiKnight()) return __oldHandleHeroDeath067.apply(this, arguments);
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
    resetTransientStatuses();
    state.hp = 0;
    state.winStreak = 0;
    state.forceNextDarkSwordSaint = false;
    const defeatedEnemyLevel = Math.max(1, Math.floor(state.enemy?.level || state.tenseiKnightLevel || 1));
    loseExpPercent(calcStats().effortRing ? 0 : (calcStats().humbleRing ? 0.09 : 0.25));
    const lostPct = calcStats().effortRing ? 0 : (calcStats().humbleRing ? 9 : 25);
    log(`天聖騎士に敗北した。経験値を${lostPct}%失ったが、天聖騎士は独立レベルのためLv.${defeatedEnemyLevel}から低下しない。`,'danger');
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
        log('戦闘を再開。天聖騎士レベルは低下していない。','good');
      }
    }, 1000);
  };
})();


/* MBH ver.0.6.9: 天聖騎士HP10倍・カットイン画像表示修正・バフ一覧同期 */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const $id=(id)=>document.getElementById(id);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.9]', e); return null; } };

  function syncVersion069(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    if(document.documentElement){
      document.documentElement.dataset.buildVersion=BUILD;
      document.documentElement.dataset.mbhVersion=BUILD;
    }
    $$('.build-version,[data-version],#versionText,.version-badge').forEach(el=>{ el.textContent='ver.'+BUILD; });
    $$('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD; });
    $$('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  function isTensei069(e){
    try{ return !!(e || state.enemy) && (e || state.enemy).id === 'tensei_knight'; }catch(_){ return false; }
  }

  // 元データも10倍化。makeScaledEnemy側でも二重適用しないよう印を付ける。
  safe(()=>{
    if(typeof TENSEI_KNIGHT === 'object' && TENSEI_KNIGHT && !TENSEI_KNIGHT.__hp069){
      TENSEI_KNIGHT.hp = Math.max(1, Math.floor((Number(TENSEI_KNIGHT.hp)||52000) * 10));
      TENSEI_KNIGHT.__hp069 = true;
    }
  });

  if(typeof makeScaledEnemy === 'function' && !makeScaledEnemy.__mbh069Wrapped){
    const oldMakeScaledEnemy = makeScaledEnemy;
    makeScaledEnemy = function(base, forceLevel){
      const e = oldMakeScaledEnemy.apply(this, arguments);
      if(isTensei069(e) && !e.__tenseiHp10Applied069){
        // 旧版データのままでも必ず「0.6.8比で10倍」になるようにする。
        // TENSEI_KNIGHT.hpが既に10倍ならここでは増やさない。
        const sourceHp = Number(base && base.hp) || 0;
        if(sourceHp < 100000){
          e.maxHp = Math.max(1, Math.floor((Number(e.maxHp)||1) * 10));
        }
        e.__tenseiHp10Applied069 = true;
      }
      return e;
    };
    makeScaledEnemy.__mbh069Wrapped = true;
  }

  function setCutinVisible069(kind, data){
    const token = showSharedCutin({
      img:(data && data.img) || (kind === 'release' ? 'assets/cutin_holy_sword_release.png' : 'assets/cutin_hero_awakening.png'),
      quote:(data && data.quote) || (kind === 'release' ? '聖剣解放。すべてを砕く光となれ。' : '勇者の力、ここに覚醒する。'),
      title:kind === 'release' ? '聖剣解放' : '勇者の覚醒',
      mode:'holy',
      alt:kind === 'release' ? '聖剣解放カットイン' : '勇者の覚醒カットイン'
    });
    if(token == null) return false;
    scheduleSharedCutinHide(token, 1550);
    return true;
  }

  // 暗転だけで画像が見えない問題を修正：showクラスを必ず付け、画像を前面表示する。
  window.showHolyCutin = function(kind){
    const data = kind === 'release'
      ? (typeof HOLY_SWORD_RELEASE_CUTIN !== 'undefined' ? HOLY_SWORD_RELEASE_CUTIN : {quote:'聖剣解放。すべてを砕く光となれ。', img:'assets/cutin_holy_sword_release.png'})
      : (typeof TENSEI_KNIGHT_CUTIN !== 'undefined' ? TENSEI_KNIGHT_CUTIN : {quote:'勇者の力、ここに覚醒する。', img:'assets/cutin_hero_awakening.png'});
    return setCutinVisible069(kind, data);
  };
  try{ showHolyCutin = window.showHolyCutin; }catch(_){ }

  function makeBadge069(label, cls, kind, target){
    return `<button type="button" class="status-badge ${cls}" data-status-kind="${kind}" data-status-target="${target}" aria-label="${label} の効果を見る">${label}</button>`;
  }
  function ensureEnemyTenseiBadges069(){
    const list=$id('enemyStatusList');
    if(!list || !isTensei069()) return;
    const add=(kind, html)=>{ if(!list.querySelector(`[data-status-kind="${kind}"]`)) list.insertAdjacentHTML('afterbegin', html); };
    add('holy_ailment_guard', makeBadge069('🕊️聖域浄化','bossbuff','holy_ailment_guard','enemy'));
    add('holy_release', makeBadge069(`⚔️聖剣解放${(state.enemyStatuses?.holyReleaseHealUntil||0)>performance.now()?'：回復中':''}`,'bossbuff','holy_release','enemy'));
    if(state.enemyStatuses?.holyAwakened) add('holy_awakening', makeBadge069('🌈勇者の覚醒','bossbuff','holy_awakening','enemy'));
    add('holy_protection', makeBadge069('✨光の加護','bossbuff','holy_protection','enemy'));
    safe(()=>{ if(typeof bindStatusBadgeEvents==='function') bindStatusBadgeEvents(); });
  }
  if(typeof renderStatusLists === 'function' && !renderStatusLists.__mbh069Wrapped){
    const oldRenderStatusLists = renderStatusLists;
    renderStatusLists = function(){
      const r = oldRenderStatusLists.apply(this, arguments);
      ensureEnemyTenseiBadges069();
      return r;
    };
    renderStatusLists.__mbh069Wrapped = true;
  }

  if(typeof activeStatusEntries === 'function' && !activeStatusEntries.__mbh069Wrapped){
    const oldActiveStatusEntries = activeStatusEntries;
    activeStatusEntries = function(target){
      const entries = oldActiveStatusEntries.apply(this, arguments) || [];
      if(target === 'enemy' && isTensei069()){
        const has=(k)=>entries.some(x=>x && x[0]===k);
        if(!has('holy_protection')) entries.unshift(['holy_protection','enemy']);
        if(!has('holy_release')) entries.push(['holy_release','enemy']);
        if(!has('holy_ailment_guard')) entries.push(['holy_ailment_guard','enemy']);
        if(state.enemyStatuses?.holyAwakened && !has('holy_awakening')) entries.push(['holy_awakening','enemy']);
      }
      return entries;
    };
    activeStatusEntries.__mbh069Wrapped = true;
  }

  // 詳細文の回復量を0.6.8以降の実仕様に合わせる。
  if(typeof statusTooltipHtml === 'function' && !statusTooltipHtml.__mbh069Wrapped){
    const oldStatusTooltipHtml = statusTooltipHtml;
    statusTooltipHtml = function(kind, target){
      if(kind === 'holy_protection') return `<b>光の加護</b><br>天聖騎士の常時効果。<br>被ダメージ90%軽減。<br>毎秒HP2%回復。`;
      if(kind === 'holy_release') return `<b>聖剣解放</b><br>天聖騎士の必殺技。<br>防御をほぼ無視する光属性特大ダメージを放つ。<br>発動後5秒間、0.2秒ごとに最大HPの3%を回復。`;
      if(kind === 'holy_awakening') return `<b>勇者の覚醒</b><br>HP50%以下で発動。<br>攻撃力+300%。<br>攻撃速度+100%。<br>状態異常90%軽減。`;
      if(kind === 'holy_ailment_guard') return `<b>聖域浄化</b><br>天聖騎士の状態異常軽減。<br>状態異常の時間・ダメージ・デバフ量を90%軽減。`;
      return oldStatusTooltipHtml.apply(this, arguments);
    };
    statusTooltipHtml.__mbh069Wrapped = true;
  }

  function boot069(){
    /* syncVersion removed */
    ensureEnemyTenseiBadges069();
    safe(()=>{ if(typeof renderStatusLists==='function') renderStatusLists(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot069, {once:true}); else setTimeout(boot069, 0);
  window.addEventListener('load', ()=>setTimeout(boot069, 80), {once:true});
  /* version interval removed */
})();


/* MBH ver.0.6.11: 天聖騎士 次敵予約・覚醒吸収・聖剣解放カウント非表示・闇装備名補正 */
(function(){
  'use strict';
  const BUILD=GAME_VERSION;
  const safe=(fn)=>{ try{return fn&&fn();}catch(e){ console.error('[MBH0.6.11]', e); return null; } };

  function syncVersion0610(){
    window.APP_VERSION=BUILD;
    window.GAME_VERSION=BUILD;
    if(document.documentElement){ document.documentElement.dataset.buildVersion=BUILD; document.documentElement.dataset.buildDate='2026-06-19'; }
    document.querySelectorAll('.build-version').forEach(el=>{ el.textContent='ver.'+BUILD; });
    document.querySelectorAll('.debug-version').forEach(el=>{ el.textContent='Build: ver.'+BUILD+' debug'; });
    document.querySelectorAll('.debug-trace-title').forEach(el=>{ el.textContent='進行デバッグログ ver.'+BUILD; });
  }

  // 既存のバッジから 0/6 などのカウント表示を消す。
  function cleanHolyReleaseBadges0610(){
    document.querySelectorAll('.status-badge[data-status-kind="holy_release"]').forEach(btn=>{
      btn.textContent = (state?.enemyStatuses?.holyReleaseHealUntil||0) > performance.now() ? '⚔️聖剣解放：回復中' : '⚔️聖剣解放';
      btn.setAttribute('aria-label','聖剣解放 の効果を見る');
    });
  }
  if(typeof renderStatusLists==='function' && !renderStatusLists.__mbh0610Wrapped){
    const old=renderStatusLists;
    renderStatusLists=function(){ const r=old.apply(this,arguments); cleanHolyReleaseBadges0610(); return r; };
    renderStatusLists.__mbh0610Wrapped=true;
  }

  // 勇者の覚醒中：敵側の暗黒出血をダメージではなく回復へ変換する。
  function convertTenseiDarkBleed0610(){
    if(!(typeof isTenseiKnight==='function' && isTenseiKnight()) || !state.enemyStatuses?.holyAwakened) return;
    const stacks=(state.enemyStatuses.darkBleeds||[]).length;
    if(stacks<=0 || !state.enemy || state.enemyHp<=0) return;
    const heal=Math.max(1, Math.floor(state.enemy.maxHp * 0.01 * stacks));
    state.enemyStatuses.darkBleeds=[];
    state.enemyStatuses.lastDarkBleedTick=performance.now();
    state.enemyHp=Math.min(state.enemy.maxHp, state.enemyHp + heal);
    safe(()=>showFloat(`暗黒出血浄化 +${heal}`, 'heal'));
    safe(()=>log(`勇者の覚醒：暗黒出血${stacks}スタックを回復に変換。`, 'good'));
  }
  if(typeof processTenseiKnight==='function' && !processTenseiKnight.__mbh0610Wrapped){
    const old=processTenseiKnight;
    processTenseiKnight=function(now){ const r=old.apply(this,arguments); convertTenseiDarkBleed0610(); return r; };
    processTenseiKnight.__mbh0610Wrapped=true;
  }
  if(typeof addDarkBleed==='function' && !addDarkBleed.__mbh0610Wrapped){
    const old=addDarkBleed;
    addDarkBleed=function(target='hero'){
      if(target==='enemy' && typeof isTenseiKnight==='function' && isTenseiKnight() && state.enemyStatuses?.holyAwakened && state.enemy && state.enemyHp>0){
        const heal=Math.max(1, Math.floor(state.enemy.maxHp * 0.01));
        state.enemyHp=Math.min(state.enemy.maxHp, state.enemyHp + heal);
        safe(()=>showFloat(`暗黒出血浄化 +${heal}`, 'heal'));
        safe(()=>log('勇者の覚醒：暗黒出血を回復に変換。', 'good'));
        safe(()=>renderStatusLists());
        return true;
      }
      return old.apply(this, arguments);
    };
    addDarkBleed.__mbh0610Wrapped=true;
  }

  // 既存データや生成時の闇装備に、聖剣シリーズ由来の名前が残っていた場合に補正する。
  function normalizeDarkItemName0610(it){
    if(!it || it.specialFrame!=='darkholy') return it;
    const bySlot={武器:'闇の聖剣',盾:'闇の盾',兜:'闇の兜',鎧:'闇の鎧',腕:'闇の籠手',足:'暗黒の靴',アミュレット:'闇のアミュレット'};
    const expected=bySlot[it.slot];
    if(expected && (/^聖/.test(String(it.name||'')) || !/^闇の|^暗黒の/.test(String(it.name||'')))) it.name=expected;
    if(it.baseName && /^聖/.test(String(it.baseName))) delete it.baseName;
    if(it.displayName && /^聖/.test(String(it.displayName))) delete it.displayName;
    if(it.setName && /聖剣/.test(String(it.setName))) it.setName='闇装備';
    return it;
  }
  function normalizeAllDarkNames0610(){
    safe(()=>Object.keys(state.equip||{}).forEach(k=>normalizeDarkItemName0610(state.equip[k])));
    safe(()=>Array.isArray(state.inventory) && state.inventory.forEach(normalizeDarkItemName0610));
  }
  ['makeDarkHolySword','makeDarkShield','makeDarkAmulet','makeDarkArmor','makeDarkGauntlets','makeDarkHelm','makeDarkBoots'].forEach(name=>{
    const fn=window[name];
    if(typeof fn==='function' && !fn.__mbh0610NameWrap){
      const wrapped=function(...args){ return normalizeDarkItemName0610(fn.apply(this,args)); };
      wrapped.__mbh0610NameWrap=true;
      window[name]=wrapped;
      try{ eval(name+'=window["'+name+'"]'); }catch(_){ }
    }
  });

  if(typeof statusTooltipHtml==='function' && !statusTooltipHtml.__mbh0610Wrapped){
    const old=statusTooltipHtml;
    statusTooltipHtml=function(kind,target){
      if(kind==='holy_awakening') return `<b>勇者の覚醒</b><br>HP50%以下で発動。<br>攻撃力+300%。<br>攻撃速度+100%。<br>状態異常90%軽減。<br>死線の剣舞ダメージの90%を回復。<br>暗黒出血を回復へ変換。`;
      if(kind==='holy_release') return `<b>聖剣解放</b><br>天聖騎士の必殺技。<br>防御をほぼ無視する光属性特大ダメージを放つ。<br>発動後5秒間、0.2秒ごとに最大HPの3%を回復。`;
      return old.apply(this,arguments);
    };
    statusTooltipHtml.__mbh0610Wrapped=true;
  }

  function boot0610(){ /* syncVersion removed */ normalizeAllDarkNames0610(); cleanHolyReleaseBadges0610(); safe(()=>renderAll()); safe(()=>scheduleSave()); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot0610, {once:true}); else setTimeout(boot0610,0);
  window.addEventListener('load', ()=>setTimeout(boot0610,120), {once:true});
})();




/* MBH 0.6.18: clean audio guard */
(function(){
  'use strict';
  if(typeof playSfx === 'function' && !playSfx.__mbhCleanAudio){
    const raw = playSfx;
    playSfx = function(kind){
      try{ return raw.apply(this, arguments); }
      catch(e){ console.error('[MBH playSfx guarded]', e); }
    };
    playSfx.__mbhCleanAudio = true;
  }
  if(typeof playUiClick === 'function' && !playUiClick.__mbhCleanAudio){
    const raw = playUiClick;
    playUiClick = function(){
      try{ return raw.apply(this, arguments); }
      catch(e){ console.error('[MBH playUiClick guarded]', e); }
    };
    playUiClick.__mbhCleanAudio = true;
  }
  if(typeof startAudio === 'function' && !startAudio.__mbhCleanAudio){
    const raw = startAudio;
    startAudio = function(){
      try{ return raw.apply(this, arguments); }
      catch(e){ console.error('[MBH startAudio guarded]', e); try{ if(typeof state !== 'undefined') state.audioUnlocked = true; }catch(_){} }
    };
    startAudio.__mbhCleanAudio = true;
  }
})();


/* MBH 0.6.19: 天聖騎士 最新仕様復元 */
(function(){
'use strict';
const safe=(fn)=>{try{return fn&&fn();}catch(e){console.error('[MBH tensei 0.6.19]',e);return null;}};
const now=()=>performance&&performance.now?performance.now():Date.now();
function isTK(){try{return !!(state&&state.enemy&&state.enemy.id==='tensei_knight');}catch(_){return false;}}
window.isTenseiKnight=function(e){try{return !!(e||(state&&state.enemy))&&(e||state.enemy).id==='tensei_knight';}catch(_){return false;}};
function ensureTkStatus(){
 if(!isTK())return null;
 if(typeof ensureStatusContainers==='function')ensureStatusContainers();
 const s=state.enemyStatuses||(state.enemyStatuses={});
 s.holyProtection=true;
 if(!s.holyAilmentReduce)s.holyAilmentReduce=.90;
 if(!s.holyReleaseCount)s.holyReleaseCount=0;
 if(!s.holyReleasePower)s.holyReleasePower=1;
 if(!s.holyReleaseHealUntil)s.holyReleaseHealUntil=0;
 if(!s.holyRegenLast)s.holyRegenLast=now();
 if(s.holyAwakened==null)s.holyAwakened=false;
 return s;
}
const rawSetEnemy=typeof setEnemy==='function'?setEnemy:null;
if(rawSetEnemy&&!rawSetEnemy.__tkLatest){
 setEnemy=function(e){
  if(e&&e.id==='tensei_knight'){
   e.maxHp=Math.max(e.maxHp||1,Math.floor((e.maxHp||e.hp||1)*10));
   e.hp=e.maxHp;e.atk=Math.max(1,Math.floor((e.atk||1)*1.35));e.def=Math.max(0,Math.floor((e.def||0)*1.35));
  }
  const r=rawSetEnemy.apply(this,arguments);
  if(isTK())ensureTkStatus();
  return r;
 };
 setEnemy.__tkLatest=true;
}
const rawHasUnyieldingBuff=typeof hasUnyieldingBuff==='function'?hasUnyieldingBuff:null;
hasUnyieldingBuff=function(){try{return isTK()||(rawHasUnyieldingBuff?rawHasUnyieldingBuff.apply(this,arguments):false);}catch(_){return isTK();}};

const rawProcessStatusDots=typeof processStatusDots==='function'?processStatusDots:null;
if(rawProcessStatusDots&&!rawProcessStatusDots.__tkLatest){
 processStatusDots=function(t){
  const r=rawProcessStatusDots.apply(this,arguments);
  if(isTK()){
   const s=ensureTkStatus(),n=now();
   if(s&&state.enemy&&state.enemyHp>0){
    if(!s.holyRegenLast)s.holyRegenLast=n;
    const ticks=Math.floor((n-s.holyRegenLast)/1000);
    if(ticks>0){s.holyRegenLast+=ticks*1000;const rate=state.enemyHp<=state.enemy.maxHp*.5?.02:.01;const heal=Math.max(1,Math.floor(state.enemy.maxHp*rate*ticks));state.enemyHp=Math.min(state.enemy.maxHp,state.enemyHp+heal);if(typeof showFloat==='function')showFloat(`光の加護 +${heal.toLocaleString()}`,'heal');}
    if((s.holyReleaseHealUntil||0)>n){if(!s.holyReleaseHealLast)s.holyReleaseHealLast=n;const ht=Math.floor((n-s.holyReleaseHealLast)/200);if(ht>0){s.holyReleaseHealLast+=ht*200;const heal=Math.max(1,Math.floor(state.enemy.maxHp*.03*ht));state.enemyHp=Math.min(state.enemy.maxHp,state.enemyHp+heal);if(typeof showFloat==='function')showFloat(`聖光回復 +${heal.toLocaleString()}`,'heal');}}
    if(!s.holyAwakened&&state.enemyHp<=state.enemy.maxHp*.5){s.holyAwakened=true;state.enemy.atk=Math.floor((state.enemy.atk||1)*4);if(typeof banner==='function')banner('勇者の覚醒！',1400);if(typeof log==='function')log('天聖騎士が勇者の覚醒を発動。攻撃力上昇、攻撃速度上昇、状態異常大幅軽減。','danger');}
    if(s.holyAwakened&&state.enemyStatuses&&state.enemyStatuses.darkBleeds&&state.enemyStatuses.darkBleeds.length){const cnt=state.enemyStatuses.darkBleeds.length;state.enemyStatuses.darkBleeds=[];const heal=Math.max(1,Math.floor(state.enemy.maxHp*.01*cnt));state.enemyHp=Math.min(state.enemy.maxHp,state.enemyHp+heal);if(typeof showFloat==='function')showFloat(`暗黒浄化 +${heal.toLocaleString()}`,'heal');}
   }
  }
  return r;
 };
 processStatusDots.__tkLatest=true;
}
const rawApplyHeroHit=typeof applyHeroHit==='function'?applyHeroHit:null;
if(rawApplyHeroHit&&!rawApplyHeroHit.__tkLatest){
 applyHeroHit=function(skill){
  const beforeEnemy=state.enemy,beforeHp=state.enemyHp;
  const r=rawApplyHeroHit.apply(this,arguments);
  if(beforeEnemy&&beforeEnemy.id==='tensei_knight'&&state.enemy&&state.enemy.id==='tensei_knight'){
   const s=ensureTkStatus(),dealt=Math.max(0,beforeHp-state.enemyHp);
   if(s&&s.holyAwakened&&skill==='deathdance'&&dealt>0&&state.enemyHp>0){const heal=Math.max(1,Math.floor(dealt*.90));state.enemyHp=Math.min(state.enemy.maxHp,state.enemyHp+heal);if(typeof showFloat==='function')showFloat(`剣舞吸収 +${heal.toLocaleString()}`,'heal');}
  }
  return r;
 };
 applyHeroHit.__tkLatest=true;
}
const rawStatusTooltipHtml=typeof statusTooltipHtml==='function'?statusTooltipHtml:null;
if(rawStatusTooltipHtml&&!rawStatusTooltipHtml.__tkLatest){
 statusTooltipHtml=function(kind,target){
  if(kind==='holy_protection')return `<b>光の加護</b><br>天聖騎士の常時効果。<br>被ダメージ90%軽減。<br>毎秒HP1%回復。HP50%以下では毎秒HP2%回復。`;
  if(kind==='holy_awakening')return `<b>勇者の覚醒</b><br>HP50%以下で発動。<br>攻撃力+300%。<br>攻撃速度+100%。<br>状態異常90%軽減。<br>死線の剣舞ダメージの90%を回復。<br>暗黒出血を回復に変換。`;
  if(kind==='holy_release'){const s=state.enemyStatuses||{},pow=s.holyReleasePower||1,cnt=s.holyReleaseCount||0;return `<b>聖剣解放</b><br>現在倍率：x${pow}<br>発動回数：${cnt}回<br>発動ごとに威力が2倍。<br>ダメージ表示：聖剣解放 9999 の形式。<br>発動後5秒間、0.2秒ごとに最大HPの3%を回復。`;}
  if(kind==='holy_ailment_guard')return `<b>聖域浄化</b><br>状態異常の時間・ダメージ・デバフ量を90%軽減。`;
  return rawStatusTooltipHtml.apply(this,arguments);
 };
 statusTooltipHtml.__tkLatest=true;
}
const rawRenderStatusLists=typeof renderStatusLists==='function'?renderStatusLists:null;
if(rawRenderStatusLists&&!rawRenderStatusLists.__tkLatest){
 renderStatusLists=function(){
  const r=rawRenderStatusLists.apply(this,arguments);
  try{if(isTK()&&els&&els.enemyStatusList){const s=ensureTkStatus()||{};let html=els.enemyStatusList.innerHTML||'';html=html.replace(/⚔️聖剣解放[^<]*/g,`⚔️聖剣解放 x${s.holyReleasePower||1}${((s.holyReleaseHealUntil||0)>now())?'：回復中':''}`);els.enemyStatusList.innerHTML=html;if(typeof bindStatusBadgeEvents==='function')bindStatusBadgeEvents();}}catch(e){console.error('[MBH render tk status]',e);}
  return r;
 };
 renderStatusLists.__tkLatest=true;
}
function setTenseiNext(){state.debugForcedBossNext={id:'tensei_knight',level:Math.max(1,Math.floor(Number(state.tenseiKnightLevel)||1))};if(typeof banner==='function')banner('次の敵に天聖騎士をセット！',1400);if(typeof log==='function')log('デバッグ：天聖騎士を次の敵にセット。現在の敵を倒すと出現する。','danger');if(typeof scheduleSave==='function')scheduleSave();}
function bindDebug(){const btn=document.getElementById('debugTenseiKnight');if(btn&&!btn.__tkLatest){btn.textContent='天聖騎士召喚';btn.onclick=function(e){if(e){e.preventDefault();e.stopPropagation();}if(typeof playUiClick==='function')safe(()=>playUiClick());setTenseiNext();return false;};btn.__tkLatest=true;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindDebug,{once:true});else setTimeout(bindDebug,0);setTimeout(bindDebug,800);
setTimeout(()=>safe(()=>{if(typeof renderStatusLists==='function')renderStatusLists();}),500);
})();


/* MBH current: デバッグ外クリック・SPチェックボックス・聖剣解放調整 */
(function(){
'use strict';
const safe=(fn)=>{try{return fn&&fn();}catch(e){console.error(`[MBH ${GAME_VERSION}]`,e);return null;}};
const now=()=>performance&&performance.now?performance.now():Date.now();
function isTK(){try{return !!(state&&state.enemy&&state.enemy.id==='tensei_knight');}catch(_){return false;}}
function tkStatus(){
 if(!isTK())return null;
 if(typeof ensureStatusContainers==='function')ensureStatusContainers();
 const s=state.enemyStatuses||(state.enemyStatuses={});
 if(!s.holyReleasePower)s.holyReleasePower=1;
 if(!s.holyReleaseCount)s.holyReleaseCount=0;
 if(!s.holyLastReleaseAt)s.holyLastReleaseAt=0;
 return s;
}
function installDebugOutsideClose(){
 const panel=document.getElementById('debugPanel');
 if(!panel||panel.__mbhOutsideClose020)return;
 panel.__mbhOutsideClose020=true;
 const close=(e)=>{
  try{
   if(panel.classList.contains('hidden'))return;
   const btn=document.getElementById('debugBtn');
   const t=e.target;
   if(panel.contains(t))return;
   if(btn&&btn.contains(t))return;
   panel.classList.add('hidden');
  }catch(err){console.error(err);}
 };
 document.addEventListener('pointerdown',close,{capture:true,passive:true});
 document.addEventListener('touchstart',close,{capture:true,passive:true});
 document.addEventListener('click',close,{capture:true,passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installDebugOutsideClose,{once:true});else setTimeout(installDebugOutsideClose,0);
function installCheckboxTouchFix(){
 if(document.__mbhCheckboxFix020)return;
 document.__mbhCheckboxFix020=true;
 const stop=(e)=>{
  const input=e.target&&e.target.closest?e.target.closest('input[type="checkbox"]'):null;
  if(!input)return;
  e.stopPropagation();
 };
 const toggle=(e)=>{
  const label=e.target&&e.target.closest?e.target.closest('label'):null;
  if(!label)return;
  const input=label.querySelector('input[type="checkbox"]');
  if(!input||e.target===input)return;
  e.preventDefault();e.stopPropagation();
  input.checked=!input.checked;
  input.dispatchEvent(new Event('change',{bubbles:true}));
 };
 document.addEventListener('pointerdown',stop,{capture:true,passive:false});
 document.addEventListener('touchstart',stop,{capture:true,passive:false});
 document.addEventListener('click',stop,{capture:true,passive:false});
 document.addEventListener('touchend',toggle,{capture:true,passive:false});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installCheckboxTouchFix,{once:true});else setTimeout(installCheckboxTouchFix,0);
function showHolyReleaseCutin020(after){
 try{
  const token=showSharedCutin({
   img:'assets/cutin_holy_sword_release.png',
   quote:'聖剣解放。すべてを砕く光となれ。',
   title:'聖剣解放',
   mode:'holy',
   alt:'聖剣解放カットイン'
  },()=>{if(typeof playSfx==='function')safe(()=>playSfx('cutin'));});
  if(token==null){after&&after();return;}
  scheduleSharedCutinHide(token,1800,after);
 }catch(e){console.error(e);after&&after();}
}
function applyHolyReleaseDamage020(){
 if(!isTK()||!state.enemy||state.enemyHp<=0)return;
 const s=tkStatus();if(!s)return;
 s.holyReleaseCount=(s.holyReleaseCount||0)+1;
 s.holyReleasePower=Math.pow(2,Math.max(0,s.holyReleaseCount-1));
 s.holyLastReleaseAt=now();
 const st=typeof calcStats==='function'?calcStats():{holyDamageReduce:0};
 let dmg=Math.max(1,Math.floor(((state.enemy.atk||1)*3.2+(state.enemy.level||1)*16)*s.holyReleasePower));
 dmg=Math.max(1,Math.floor(dmg*(1-Math.min(.95,st.holyDamageReduce||0))));
 if(state.debug&&state.debug.killHero)dmg=Math.max(dmg,state.hp+999999);
 if(typeof applyDarkShieldToDamage==='function')dmg=applyDarkShieldToDamage(dmg);
 if(typeof showHeroFloat==='function')showHeroFloat(`聖剣解放 ${dmg.toLocaleString()}`,'holy damage');
 if(state.hp-dmg<=0){
  if(!state.debug?.killHero&&typeof tryHeroDeathDance==='function'&&tryHeroDeathDance()){if(typeof renderBattle==='function')renderBattle();}
  else{state.hp=0;if(typeof renderBattle==='function')renderBattle();if(typeof handleHeroDeath==='function')handleHeroDeath();}
 }else{
  state.hp=Math.max(0,state.hp-dmg);
  if(typeof log==='function')log(`天聖騎士の聖剣解放！ 倍率x${s.holyReleasePower} / ${dmg.toLocaleString()}ダメージ`,'danger');
  if(typeof renderBattle==='function')renderBattle();
 }
 s.holyReleaseHealUntil=now()+5000;
 s.holyReleaseHealLast=0;
 if(typeof renderStatusLists==='function')renderStatusLists();
}
function startHolyRelease020(){
 if(!isTK())return;
 const s=tkStatus();if(!s)return;
 if(s.holyReleaseCasting)return;
 const n=now();
 if(s.holyLastReleaseAt&&n-s.holyLastReleaseAt<10000)return;
 s.holyReleaseCasting=true;
 if(typeof banner==='function')banner('聖剣解放！',1200);
 showHolyReleaseCutin020(()=>{
  try{applyHolyReleaseDamage020();}finally{const ss=tkStatus();if(ss)ss.holyReleaseCasting=false;}
 });
}
const rawEnemyAttack020=typeof enemyAttack==='function'?enemyAttack:null;
if(rawEnemyAttack020&&!rawEnemyAttack020.__mbh020){
 enemyAttack=function(t){
  if(isTK()){
   const s=tkStatus();const n=now();
   if(s&&!s.holyReleaseCasting&&(!s.holyLastReleaseAt||n-s.holyLastReleaseAt>=10000)){
    startHolyRelease020();
    return;
   }
  }
  return rawEnemyAttack020.apply(this,arguments);
 };
 enemyAttack.__mbh020=true;
}
const rawSetEnemy020=typeof setEnemy==='function'?setEnemy:null;
if(rawSetEnemy020&&!rawSetEnemy020.__mbh020){
 setEnemy=function(e){
  const r=rawSetEnemy020.apply(this,arguments);
  if(e&&e.id==='tensei_knight'){
   const s=tkStatus();
   if(s){s.holyReleasePower=1;s.holyReleaseCount=0;s.holyLastReleaseAt=now();s.holyReleaseCasting=false;}
   if(typeof renderStatusLists==='function')renderStatusLists();
  }
  return r;
 };
 setEnemy.__mbh020=true;
}
const rawStatusTooltipHtml020=typeof statusTooltipHtml==='function'?statusTooltipHtml:null;
if(rawStatusTooltipHtml020&&!rawStatusTooltipHtml020.__mbh020){
 statusTooltipHtml=function(kind,target){
  if(kind==='holy_release'){
   const s=state.enemyStatuses||{},pow=s.holyReleasePower||1,cnt=s.holyReleaseCount||0;
   const left=s.holyLastReleaseAt?Math.max(0,Math.ceil((10000-(now()-s.holyLastReleaseAt))/1000)):0;
   return `<b>聖剣解放</b><br>現在倍率：x${pow}<br>発動回数：${cnt}回<br>次回まで：約${left}秒<br>発動間隔：10秒。<br>カットイン後に「聖剣解放 9999」形式でダメージ表示。<br>発動ごとに威力が2倍。<br>発動後5秒間、0.2秒ごとに最大HPの3%を回復。`;
  }
  return rawStatusTooltipHtml020.apply(this,arguments);
 };
 statusTooltipHtml.__mbh020=true;
}
const rawRenderStatusLists020=typeof renderStatusLists==='function'?renderStatusLists:null;
if(rawRenderStatusLists020&&!rawRenderStatusLists020.__mbh020){
 renderStatusLists=function(){
  const r=rawRenderStatusLists020.apply(this,arguments);
  try{
   if(isTK()&&els&&els.enemyStatusList){
    const s=tkStatus()||{};
    let html=els.enemyStatusList.innerHTML||'';
    html=html.replace(/⚔️聖剣解放[^<]*/g,`⚔️聖剣解放 x${s.holyReleasePower||1}${s.holyReleaseCasting?'：詠唱中':(((s.holyReleaseHealUntil||0)>now())?'：回復中':'')}`);
    els.enemyStatusList.innerHTML=html;
    if(typeof bindStatusBadgeEvents==='function')bindStatusBadgeEvents();
   }
  }catch(e){console.error(e);}
  return r;
 };
 renderStatusLists.__mbh020=true;
}
})();

/* MBH current hotfix */
(function(){
if(typeof statusTooltipHtml==='function'&&!statusTooltipHtml.__mbh021){
 const raw=statusTooltipHtml;
 statusTooltipHtml=function(kind,target){
  let r=raw.apply(this,arguments);
  if(kind==='holy_release'&&typeof r==='string'){
    r=r.replace(/<br>カットイン後に「聖剣解放 9999」形式でダメージ表示。/g,'');
  }
  return r;
 };
 statusTooltipHtml.__mbh021=true;
}
})();
