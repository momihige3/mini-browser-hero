const $ = (id) => document.getElementById(id);

const SAVE_KEY = 'mini-browser-hero-save-v5';
const BAG_PAGES = 7;
let currentBagPage = 1;
let selectedItemId = null;
const OLD_KEYS = ['mini-browser-hero-save-v3','mini-browser-hero-save-v2','mini-auto-hero-save'];
const STAGE_KILLS_NEEDED = 5;
const SLOT_LABEL = { weapon:'武器', armor:'防具', ring:'指輪' };
const RARITIES = [
  {key:'Common', name:'コモン', rate:5200, mul:1.00, cls:'common'},
  {key:'Rare', name:'レア', rate:2600, mul:1.35, cls:'rare'},
  {key:'Epic', name:'エピック', rate:1300, mul:1.85, cls:'epic'},
  {key:'Legendary', name:'レジェンダリー', rate:650, mul:2.65, cls:'legendary'},
  {key:'Divine', name:'ディヴァイン', rate:180, mul:3.5, cls:'divine'},
  {key:'Celestial', name:'セレスティアル', rate:55, mul:4.4, cls:'celestial'},
  {key:'Arcana', name:'アルカナ', rate:12, mul:5.4, cls:'arcana'},
  {key:'Beyond', name:'ビヨンド', rate:3, mul:6.8, cls:'beyond'},
  {key:'Cosmic', name:'コズミック', rate:1, mul:8.5, cls:'cosmic'}
];

const defaultState = {
  level: 1, exp: 0, gold: 0,
  stageWorld: 1, stageArea: 1, maxStageWorld: 1, maxStageArea: 1, stageKills: 0,
  heroHp: 100, weaponLv: 1, armorLv: 1, ringLv: 1,
  chestCount: 0, totalChests: 0,
  inventory: [],
  equipped: { weapon:null, armor:null, ring:null },
  sound: { muted:false, volume:0.35 },
  lastSave: Date.now()
};

let state = load();
let enemy = makeEnemy();
let lastAttack = 0;
let lastEnemyAttack = 0;
let saveTimer = 0;
let audioCtx = null;
let enemyDying = false;
let enemySpawning = false;
let uiDirty = true;
let inventoryDirty = true;
let stageSelectDirty = true;

function load(){
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) for (const k of OLD_KEYS) { raw = localStorage.getItem(k); if (raw) break; }
    if (!raw) return structuredClone(defaultState);
    const saved = JSON.parse(raw);
    const merged = {...structuredClone(defaultState), ...saved};
    merged.equipped = {...defaultState.equipped, ...(saved.equipped || {})};
    merged.sound = {...defaultState.sound, ...(saved.sound || {})};
    merged.inventory ||= [];
    return merged;
  } catch { return structuredClone(defaultState); }
}

function markDirty(){ uiDirty = true; inventoryDirty = true; stageSelectDirty = true; }
function markUiDirty(){ uiDirty = true; }
function markInventoryDirty(){ inventoryDirty = true; uiDirty = true; }

function save(showLog = true){
  state.lastSave = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (showLog) log('セーブした！');
}

function reset(){
  if (!confirm('本当にリセットする？')) return;
  localStorage.removeItem(SAVE_KEY);
  OLD_KEYS.forEach(k => localStorage.removeItem(k));
  state = structuredClone(defaultState);
  enemy = makeEnemy();
  markDirty();
  log('データをリセットした');
  spawnEnemyAnimation();
  render();
}

function stageNumber(w = state.stageWorld, a = state.stageArea){ return (w - 1) * 10 + a; }
function stageText(w = state.stageWorld, a = state.stageArea){ return `${w}-${a}`; }
function maxStageNumber(){ return stageNumber(state.maxStageWorld, state.maxStageArea); }
function setMaxStageByNumber(n){ state.maxStageWorld = Math.floor((n - 1) / 10) + 1; state.maxStageArea = ((n - 1) % 10) + 1; }
function nextStage(){
  const n = stageNumber() + 1;
  state.stageWorld = Math.floor((n - 1) / 10) + 1;
  state.stageArea = ((n - 1) % 10) + 1;
  if (n > maxStageNumber()) setMaxStageByNumber(n);
  state.stageKills = 0;
  stageSelectDirty = true; uiDirty = true;
  showStageClear();
  log(`<b>ステージ ${stageText()} に進んだ！</b>`);
}

function equipBonus(){
  const bonus = {atk:0, def:0, hp:0, speed:0, reduce:0, leech:0, crit:0};
  Object.values(state.equipped).forEach(item => {
    if (!item) return;
    bonus.atk += item.atk || 0;
    bonus.def += item.def || 0;
    bonus.hp += item.hp || 0;
    bonus.speed += item.speed || 0;
    bonus.reduce += item.reduce || 0;
    bonus.leech += item.leech || 0;
    bonus.crit += item.crit || 0;
  });
  return bonus;
}

function stats(){
  const b = equipBonus();
  const maxHp = 90 + state.level * 12 + state.armorLv * 20 + b.hp;
  const atk = 7 + state.level * 3 + state.weaponLv * 6 + b.atk;
  const def = Math.floor(state.armorLv * 2 + state.level * 0.6 + b.def);
  const atkSpeed = Math.max(300, 1120 - state.ringLv * 30 - state.level * 4 - b.speed);
  return {maxHp, atk, def, atkSpeed, reduce:Math.min(80,b.reduce), leech:Math.min(30,b.leech), crit:0.12 + Math.min(0.5,b.crit/100)};
}

function expNeed(){ return 45 + state.level * 30; }
function upgradeCost(kind){ return Math.floor(35 * Math.pow(state[kind], 1.55)); }

function makeEnemy(){
  const sn = stageNumber();
  const isBoss = state.stageArea === 10 || state.stageKills === STAGE_KILLS_NEEDED - 1;
  const hpBase = 30 + sn * 16 + Math.pow(sn, 1.23) * 7;
  const hp = Math.floor(isBoss ? hpBase * 2.6 : hpBase);
  return {
    name: isBoss ? `ボススライム ${stageText()}` : `スライム ${stageText()}`,
    isBoss, maxHp: hp, hp,
    atk: Math.floor((5 + sn * 1.5) * (isBoss ? 1.7 : 1)),
    gold: Math.floor((9 + sn * 4) * (isBoss ? 3 : 1)),
    exp: Math.floor((12 + sn * 5.5) * (isBoss ? 3 : 1))
  };
}

function attack(){
  if (enemyDying || enemySpawning) return;
  const s = stats();
  const crit = Math.random() < s.crit;
  const damage = Math.max(1, Math.floor(s.atk * (crit ? 1.8 : 1) * (0.85 + Math.random() * 0.3)));
  enemy.hp -= damage;
  if (s.leech > 0) state.heroHp = Math.min(s.maxHp, state.heroHp + Math.ceil(damage * s.leech / 100));
  showSlash(); showDamage((crit ? 'CRIT ' : '') + damage); flashEnemy(); playSE(crit ? 'crit' : 'hit');
  if (enemy.hp <= 0) win();
}

function enemyAttack(){
  if (enemyDying || enemySpawning) return;
  const s = stats();
  const rawDamage = Math.max(1, enemy.atk - s.def + Math.floor(Math.random() * 3));
  const damage = Math.max(1, Math.floor(rawDamage * (1 - s.reduce / 100)));
  state.heroHp -= damage;
  flashHero();
  if (state.heroHp <= 0) {
    state.heroHp = Math.ceil(s.maxHp * 0.45);
    state.gold = Math.max(0, Math.floor(state.gold * 0.9));
    playSE('down');
    log('倒れた……Goldを少し落として復活');
  }
}

function win(){
  if (enemyDying) return;
  enemyDying = true;
  const defeated = {...enemy};
  enemy.hp = 0;
  playSE(enemy.isBoss ? 'boss' : 'win');
  defeatEnemyAnimation();

  setTimeout(() => {
    markDirty();
    state.gold += defeated.gold;
    state.exp += defeated.exp;
    state.stageKills++;
    log(`<b>${defeated.name}</b>を倒した！ +${defeated.gold} Gold / +${defeated.exp} EXP`);
    rollChest(defeated.isBoss);
    levelCheck();
    if (state.stageKills >= STAGE_KILLS_NEEDED) nextStage();
    enemy = makeEnemy();
    enemyDying = false;
    spawnEnemyAnimation();
    render();
  }, 520);
}

function levelCheck(){
  let leveled = false;
  while (state.exp >= expNeed()) {
    state.exp -= expNeed(); state.level++; leveled = true;
    state.heroHp = stats().maxHp;
    log(`レベルアップ！ Lv ${state.level} / 攻撃・防御・最大HPが上がった`);
  }
  if (leveled) { showLevelUp(); playSE('level'); }
}

function rollChest(isBoss){
  const dropRate = isBoss ? 1 : 0.14;
  if (Math.random() > dropRate) return;
  state.chestCount++; state.totalChests++;
  showChestDrop(); playSE('chest');
  log(isBoss ? '<b>ボス宝箱</b>が落ちた！' : '<b>宝箱</b>が落ちた！');
}

function openChest(){
  if (state.chestCount <= 0) return log('開ける宝箱がないよ');
  markDirty();
  state.chestCount--;
  const sn = stageNumber();
  const gold = Math.floor(25 + sn * 7 + Math.random() * (35 + state.level * 8));
  const exp = Math.floor(15 + state.level * 8 + Math.random() * 25);
  state.gold += gold; state.exp += exp;
  showChestDrop(); playSE('open');
  let msg = `<b>宝箱を開けた！</b> +${gold} Gold / +${exp} EXP`;
  if (Math.random() < 0.55) {
    const item = makeItem();
    state.inventory.unshift(item);
    markInventoryDirty();
    state.inventory = state.inventory.slice(0, 30);
    msg += `<br>装備ドロップ：<b class="${item.rarityCls}">${item.name}</b>`;
    playSE('drop');
  }
  log(msg); levelCheck(); render();
}

function pickRarity(){
  const total = RARITIES.reduce((a,r)=>a+r.rate,0);
  let roll = Math.random() * total;
  for (const r of RARITIES) { roll -= r.rate; if (roll <= 0) return r; }
  return RARITIES[0];
}

function makeItem(){
  const slot = ['weapon','armor','ring'][Math.floor(Math.random()*3)];
  const rarity = pickRarity();
  const sn = stageNumber();
  const power = Math.max(1, Math.floor((state.level + sn * 1.5) * rarity.mul));
  const item = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), slot, rarity:rarity.name, rarityCls:rarity.cls, atk:0, def:0, hp:0, speed:0, reduce:0, leech:0, crit:0 };
  if (slot === 'weapon') { item.atk = power + rand(1, 5); item.crit = rand(0, Math.floor(power/3)); }
  if (slot === 'armor') { item.def = Math.floor(power/2) + rand(1, 4); item.hp = power * 4 + rand(5, 18); item.reduce = rand(0, Math.floor(power/4)); }
  if (slot === 'ring') { item.atk = rand(0, Math.floor(power/2)); item.hp = rand(0, power * 2); item.speed = 15 + Math.floor(power * 2.3); item.leech = rand(0, Math.floor(power/4)); }
  const base = slot === 'weapon' ? 'ソード' : slot === 'armor' ? 'アーマー' : 'オーブ';
  const prefix = rarity.cls === 'cosmic' ? '次元の' : rarity.cls === 'beyond' ? '超越の' : rarity.cls === 'arcana' ? '秘奥の' : rarity.cls === 'celestial' ? '星天の' : rarity.cls === 'divine' ? '神威の' : rarity.name;
  item.name = `${prefix}${base}`;
  return item;
}
function rand(min,max){ return Math.floor(min + Math.random() * (max - min + 1)); }
function itemPower(i){ return (i.atk||0) + (i.def||0) + Math.floor((i.hp||0)/4) + Math.floor((i.speed||0)/12) + (i.reduce||0)*2 + (i.leech||0)*2 + (i.crit||0); }
function itemIcon(i){ return i.slot === 'weapon' ? '⚔️' : i.slot === 'armor' ? '🛡️' : '🔮'; }
function itemText(i){ return `${SLOT_LABEL[i.slot]} / 攻撃+${i.atk||0} 防御+${i.def||0} HP+${i.hp||0} 速度+${i.speed||0} 軽減+${i.reduce||0}% 吸収+${i.leech||0}% クリ+${i.crit||0}%`; }
function itemLines(i){
  if (!i) return '<div class="muted">未装備</div>';
  return `
    <div class="tip-title ${i.rarityCls}">${itemIcon(i)} ${i.name}</div>
    <div class="tip-rarity ${i.rarityCls}">${i.rarity} 等級</div>
    <div class="tip-main">${SLOT_LABEL[i.slot]} / 戦力 ${itemPower(i)}</div>
    <hr>
    <div>攻撃力 +${i.atk||0}</div><div>防御力 +${i.def||0}</div><div>最大HP +${i.hp||0}</div><div>攻撃速度 +${i.speed||0}</div><div>ダメージ軽減 +${i.reduce||0}%</div><div>ライフ吸収 +${i.leech||0}%</div><div>クリ率 +${i.crit||0}%</div>`;
}

function equipItem(id){
  const idx = state.inventory.findIndex(i => i.id === id);
  if (idx < 0) return;
  const item = state.inventory.splice(idx,1)[0];
  const old = state.equipped[item.slot];
  if (old) state.inventory.unshift(old);
  state.equipped[item.slot] = item;
  state.heroHp = Math.min(stats().maxHp, state.heroHp + (item.hp || 0));
  markInventoryDirty(); playSE('equip'); log(`<b>${item.name}</b>を装備した！`); render(true);
}
function sellItem(id){
  const idx = state.inventory.findIndex(i => i.id === id);
  if (idx < 0) return;
  const item = state.inventory.splice(idx,1)[0];
  const price = 10 + itemPower(item) * 6;
  state.gold += price;
  markInventoryDirty(); playSE('sell'); log(`${item.name}を売った +${price} Gold`); render(true);
}

function upgrade(kind){
  const cost = upgradeCost(kind);
  if (state.gold < cost) return;
  state.gold -= cost; state[kind]++;
  if (kind === 'armorLv') state.heroHp = Math.min(stats().maxHp, state.heroHp + 35);
  markUiDirty(); playSE('equip'); log('装備を強化した！'); render(true);
}

function heal(){
  const cost = Math.max(10, Math.floor(stats().maxHp * 0.25));
  if (state.gold < cost) return log(`回復には ${cost} Gold 必要`);
  state.gold -= cost; state.heroHp = stats().maxHp;
  markUiDirty(); playSE('heal'); log('宿屋で全回復！'); render(true);
}

function changeStage(){
  const n = Number($('stageSelect').value);
  state.stageWorld = Math.floor((n - 1) / 10) + 1;
  state.stageArea = ((n - 1) % 10) + 1;
  state.stageKills = 0;
  markDirty();
  enemy = makeEnemy();
  spawnEnemyAnimation();
  log(`ステージ ${stageText()} に移動した`);
  render();
}

function setupStageSelect(force=false){
  const sel = $('stageSelect');
  if (!sel) return;
  if (!force && !stageSelectDirty) return;
  const selectedStage = stageNumber();
  sel.innerHTML = '';
  for (let n = 1; n <= maxStageNumber(); n++) {
    const w = Math.floor((n - 1) / 10) + 1;
    const a = ((n - 1) % 10) + 1;
    const op = document.createElement('option');
    op.value = n; op.textContent = `${w}-${a}`;
    if (n === selectedStage) op.selected = true;
    sel.appendChild(op);
  }
  stageSelectDirty = false;
}

function ensureAudio(){ if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSE(type){
  if (state.sound.muted || state.sound.volume <= 0) return;
  try {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const now = audioCtx.currentTime;
    const map = { hit:[220,0.05], crit:[520,0.08], win:[660,0.09], boss:[180,0.18], chest:[880,0.12], open:[740,0.14], drop:[980,0.18], level:[1040,0.22], equip:[430,0.08], sell:[330,0.06], heal:[620,0.12], down:[120,0.22] };
    const [freq,dur] = map[type] || map.hit;
    o.type = type === 'down' ? 'sawtooth' : 'square';
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.55), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(state.sound.volume * 0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + dur + 0.02);
  } catch {}
}

function showSlash(){ const el = $('slash'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function showDamage(text){ const el = $('damagePop'); el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function showLevelUp(){ const el = $('levelupPop'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function showStageClear(){ const el = $('stagePop'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function showChestDrop(){ const el = $('chestDrop'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function flashHero(){ const el = $('hero'); el.classList.remove('hit-flash'); void el.offsetWidth; el.classList.add('hit-flash'); }
function flashEnemy(){ const el = $('enemy'); el.classList.remove('hit-flash'); void el.offsetWidth; el.classList.add('hit-flash'); }
function defeatEnemyAnimation(){ const el = $('enemy'); el.classList.remove('enemy-spawn','enemy-defeat'); void el.offsetWidth; el.classList.add('enemy-defeat'); }
function spawnEnemyAnimation(){
  const el = $('enemy');
  enemySpawning = true;
  el.classList.toggle('boss', enemy.isBoss);
  el.classList.remove('enemy-defeat','enemy-spawn','hit-flash');
  void el.offsetWidth;
  el.classList.add('enemy-spawn');
  setTimeout(() => { enemySpawning = false; }, 850);
}

function log(text){
  const box = $('log'); const line = document.createElement('div'); line.innerHTML = text; box.prepend(line);
  while (box.children.length > 100) box.lastChild.remove();
}

function renderTabs(){
  const tabs = $('bagTabs');
  if (!tabs) return;
  tabs.innerHTML = '';
  for (let i=1;i<=BAG_PAGES;i++){
    const b=document.createElement('button');
    b.textContent=i;
    b.className = i===currentBagPage ? 'active' : '';
    b.onclick=()=>{currentBagPage=i; renderInventory();};
    tabs.appendChild(b);
  }
}

function showTooltip(item, x=0, y=0){
  const tip = $('itemTooltip');
  if (!tip || !item) return;
  const eq = state.equipped[item.slot];
  const diff = itemPower(item) - itemPower(eq || {slot:item.slot});
  tip.innerHTML = `<div class="compare-grid"><div>${itemLines(item)}<div class="tip-actions"><button onclick="equipItem('${item.id}')">装備</button><button onclick="sellItem('${item.id}')">売却</button></div></div><div>${eq ? itemLines(eq) : '<div class="tip-title">現在装備</div><div class="muted">未装備</div>'}<hr><div class="diff ${diff>=0?'plus':'minus'}">戦力差 ${diff>=0?'+':''}${diff}</div></div></div>`;
  tip.classList.add('show');
  tip.style.left = Math.min(window.innerWidth - 360, Math.max(12, x + 12)) + 'px';
  tip.style.top = Math.min(window.innerHeight - 260, Math.max(12, y - 20)) + 'px';
}
function hideTooltip(){ const tip=$('itemTooltip'); if(tip) tip.classList.remove('show'); }

function renderInventory(){
  renderTabs();
  const eq = $('equippedList');
  eq.innerHTML = ['weapon','armor','ring'].map(slot => {
    const i = state.equipped[slot];
    return `<div class="equip-card ${i ? i.rarityCls : ''}" data-eqid="${slot}"><div class="slot-icon">${i ? itemIcon(i) : '⬚'}</div><div><b>${SLOT_LABEL[slot]}</b><br>${i ? `<span class="${i.rarityCls}">${i.name}</span><small>${itemText(i)}</small>` : '<span class="muted">未装備</span>'}</div></div>`;
  }).join('');

  const grid = $('inventoryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const pageSize = 35;
  const start = (currentBagPage-1)*pageSize;
  const items = state.inventory.slice(start, start+pageSize);
  for(let i=0;i<pageSize;i++){
    const item=items[i];
    const cell=document.createElement('button');
    cell.className='inv-cell' + (item ? ` filled ${item.rarityCls}` : '');
    if(item){
      cell.innerHTML = `<span class="cell-icon">${itemIcon(item)}</span><span class="cell-rank">${itemPower(item)}</span>`;
      cell.onclick = (e)=>{ selectedItemId=item.id; showTooltip(item, e.clientX, e.clientY); };
      cell.onmouseenter = (e)=> showTooltip(item, e.clientX, e.clientY);
      cell.onmousemove = (e)=> showTooltip(item, e.clientX, e.clientY);
      cell.onmouseleave = hideTooltip;
    }
    grid.appendChild(cell);
  }
}

function sortInventory(){
  state.inventory.sort((a,b)=> itemPower(b)-itemPower(a));
  markInventoryDirty();
  playSE('equip'); renderInventory(); save(false);
}

function render(force=false){
  const s = stats();
  state.heroHp = Math.min(state.heroHp, s.maxHp);

  // HPバーなど、戦闘中に動く場所だけ毎フレーム更新
  $('heroHpText').textContent = `${state.heroHp}/${s.maxHp}`;
  $('enemyHpText').textContent = `${Math.max(0, enemy.hp)}/${enemy.maxHp}`;
  $('expText').textContent = `${state.exp}/${expNeed()}`;
  $('heroHpBar').style.width = `${(state.heroHp / s.maxHp) * 100}%`;
  $('enemyHpBar').style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
  $('expBar').style.width = `${(state.exp / expNeed()) * 100}%`;

  if (!force && !uiDirty) return;
  uiDirty = false;

  $('heroLevel').textContent = state.level; $('heroLevelBadge').textContent = state.level;
  $('gold').textContent = state.gold; $('stageText').textContent = stageText(); $('battleStageText').textContent = stageText();
  $('chestCount').textContent = state.chestCount; $('openChestCount').textContent = state.chestCount;
  $('atk').textContent = s.atk; $('def').textContent = s.def; $('maxHp').textContent = s.maxHp;
  $('atkSpeed').textContent = `${(1000 / s.atkSpeed).toFixed(2)}回/秒`;
  $('stageKills').textContent = `${state.stageKills}/${STAGE_KILLS_NEEDED}`;
  $('weaponLv').textContent = state.weaponLv; $('armorLv').textContent = state.armorLv; $('ringLv').textContent = state.ringLv;
  $('weaponCost').textContent = upgradeCost('weaponLv'); $('armorCost').textContent = upgradeCost('armorLv'); $('ringCost').textContent = upgradeCost('ringLv');
  $('weaponBtn').disabled = state.gold < upgradeCost('weaponLv'); $('armorBtn').disabled = state.gold < upgradeCost('armorLv'); $('ringBtn').disabled = state.gold < upgradeCost('ringLv');
  $('openChestBtn').disabled = state.chestCount <= 0; $('enemy').classList.toggle('boss', enemy.isBoss);
  $('muteBtn').textContent = state.sound.muted ? '🔇 SE OFF' : '🔊 SE ON';
  $('volumeRange').value = Math.round(state.sound.volume * 100);
  setupStageSelect(force);
  if (inventoryDirty || force) { inventoryDirty = false; renderInventory(); }
}


function gameLoop(now){
  try {
    const s = stats();
    if (!enemyDying && !enemySpawning && now - lastAttack > s.atkSpeed) { attack(); lastAttack = now; }
    if (!enemyDying && !enemySpawning && now - lastEnemyAttack > 1300) { enemyAttack(); lastEnemyAttack = now; }
    saveTimer += 16; if (saveTimer > 5000) { save(false); saveTimer = 0; }
    render(false);
  } catch (e) {
    console.error(e);
    log('エラーが出たので戦闘を継続できるように復帰するよ: ' + e.message);
  }
  requestAnimationFrame(gameLoop);
}

$('weaponBtn').addEventListener('click', () => upgrade('weaponLv'));
$('armorBtn').addEventListener('click', () => upgrade('armorLv'));
$('ringBtn').addEventListener('click', () => upgrade('ringLv'));
$('healBtn').addEventListener('click', heal);
$('openChestBtn').addEventListener('click', openChest);
$('saveBtn').addEventListener('click', () => save(true));
$('resetBtn').addEventListener('click', reset);
$('sortBtn').addEventListener('click', sortInventory);
$('goStageBtn').addEventListener('click', changeStage);
$('muteBtn').addEventListener('click', () => { state.sound.muted = !state.sound.muted; playSE('equip'); markUiDirty(); render(true); save(false); });
$('volumeRange').addEventListener('input', e => { state.sound.volume = Number(e.target.value) / 100; state.sound.muted = state.sound.volume === 0; playSE('hit'); markUiDirty(); render(true); save(false); });
window.addEventListener('pointerdown', ensureAudio, {once:true});

log('冒険開始！ヒーローは右、敵は左から出てくるよ');
spawnEnemyAnimation(); render(true); requestAnimationFrame(gameLoop);
