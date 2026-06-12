const $ = (id) => document.getElementById(id);

const SAVE_KEY = 'mini-browser-hero-save-v2';
const OLD_SAVE_KEY = 'mini-auto-hero-save';

const defaultState = {
  level: 1,
  exp: 0,
  gold: 0,
  wave: 1,
  heroHp: 100,
  weaponLv: 1,
  armorLv: 1,
  ringLv: 1,
  chestCount: 0,
  totalChests: 0,
  lastSave: Date.now()
};

let state = load();
let enemy = makeEnemy();
let lastAttack = 0;
let lastEnemyAttack = 0;
let saveTimer = 0;

function load(){
  try {
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY);
    if (!raw) return {...defaultState};
    const saved = JSON.parse(raw);
    return {...defaultState, ...saved};
  } catch {
    return {...defaultState};
  }
}

function save(showLog = true){
  state.lastSave = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (showLog) log('セーブした！');
}

function reset(){
  if (!confirm('本当にリセットする？')) return;
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(OLD_SAVE_KEY);
  state = {...defaultState};
  enemy = makeEnemy();
  log('データをリセットした');
  spawnEnemyAnimation();
  render();
}

function stats(){
  const maxHp = 90 + state.level * 12 + state.armorLv * 20;
  const atk = 7 + state.level * 3 + state.weaponLv * 6;
  const def = Math.floor(state.armorLv * 2 + state.level * 0.6);
  const atkSpeed = Math.max(380, 1120 - state.ringLv * 30 - state.level * 4);
  return {maxHp, atk, def, atkSpeed};
}

function expNeed(){ return 45 + state.level * 30; }
function upgradeCost(kind){
  const lv = state[kind];
  return Math.floor(35 * Math.pow(lv, 1.55));
}

function makeEnemy(){
  const isBoss = state.wave % 10 === 0;
  const hpBase = 24 + state.wave * 13 + Math.pow(state.wave, 1.28) * 6;
  const hp = Math.floor(isBoss ? hpBase * 2.7 : hpBase);
  return {
    name: isBoss ? 'ボススライム' : 'スライム',
    isBoss,
    maxHp: hp,
    hp,
    atk: Math.floor((4 + state.wave * 1.4) * (isBoss ? 1.7 : 1)),
    gold: Math.floor((8 + state.wave * 3.5) * (isBoss ? 3 : 1)),
    exp: Math.floor((12 + state.wave * 5) * (isBoss ? 3 : 1))
  };
}

function attack(){
  const s = stats();
  const crit = Math.random() < 0.12;
  const damage = Math.max(1, Math.floor(s.atk * (crit ? 1.8 : 1) * (0.85 + Math.random() * 0.3)));
  enemy.hp -= damage;
  showSlash();
  showDamage((crit ? 'CRIT ' : '') + damage);
  if (enemy.hp <= 0) win();
}

function enemyAttack(){
  const s = stats();
  const damage = Math.max(1, enemy.atk - s.def + Math.floor(Math.random() * 3));
  state.heroHp -= damage;
  if (state.heroHp <= 0) {
    state.heroHp = Math.ceil(s.maxHp * 0.45);
    state.gold = Math.max(0, Math.floor(state.gold * 0.9));
    log('倒れた……Goldを少し落として復活');
  }
}

function win(){
  state.gold += enemy.gold;
  state.exp += enemy.exp;
  log(`<b>${enemy.name}</b>を倒した！ +${enemy.gold} Gold / +${enemy.exp} EXP`);

  rollChest(enemy.isBoss);

  let leveled = false;
  while (state.exp >= expNeed()) {
    state.exp -= expNeed();
    state.level++;
    leveled = true;
    const s = stats();
    state.heroHp = s.maxHp;
    log(`レベルアップ！ Lv ${state.level} / 攻撃・防御・最大HPが上がった`);
  }
  if (leveled) showLevelUp();

  state.wave++;
  enemy = makeEnemy();
  spawnEnemyAnimation();
}

function rollChest(isBoss){
  const dropRate = isBoss ? 1 : 0.12;
  if (Math.random() > dropRate) return;
  state.chestCount++;
  state.totalChests++;
  showChestDrop();
  log(isBoss ? '<b>ボス宝箱</b>が落ちた！' : '<b>宝箱</b>が落ちた！');
}

function openChest(){
  if (state.chestCount <= 0) return log('開ける宝箱がないよ');
  state.chestCount--;
  const gold = Math.floor(25 + state.wave * 5 + Math.random() * (30 + state.level * 8));
  const exp = Math.floor(15 + state.level * 8 + Math.random() * 25);
  state.gold += gold;
  state.exp += exp;
  showChestDrop();
  log(`<b>宝箱を開けた！</b> +${gold} Gold / +${exp} EXP`);

  let leveled = false;
  while (state.exp >= expNeed()) {
    state.exp -= expNeed();
    state.level++;
    leveled = true;
    state.heroHp = stats().maxHp;
    log(`レベルアップ！ Lv ${state.level}`);
  }
  if (leveled) showLevelUp();
  render();
}

function upgrade(kind){
  const cost = upgradeCost(kind);
  if (state.gold < cost) return;
  state.gold -= cost;
  state[kind]++;
  if (kind === 'armorLv') state.heroHp = Math.min(stats().maxHp, state.heroHp + 35);
  log('装備を強化した！');
  render();
}

function heal(){
  const cost = Math.max(10, Math.floor(stats().maxHp * 0.25));
  if (state.gold < cost) return log(`回復には ${cost} Gold 必要`);
  state.gold -= cost;
  state.heroHp = stats().maxHp;
  log('宿屋で全回復！');
  render();
}

function showSlash(){
  const el = $('slash');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function showDamage(text){
  const el = $('damagePop');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function showLevelUp(){
  const el = $('levelupPop');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function showChestDrop(){
  const el = $('chestDrop');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function spawnEnemyAnimation(){
  const el = $('enemy');
  el.classList.toggle('boss', enemy.isBoss);
  el.classList.remove('enemy-spawn');
  void el.offsetWidth;
  el.classList.add('enemy-spawn');
}

function log(text){
  const box = $('log');
  const line = document.createElement('div');
  line.innerHTML = text;
  box.prepend(line);
  while (box.children.length > 80) box.lastChild.remove();
}

function render(){
  const s = stats();
  state.heroHp = Math.min(state.heroHp, s.maxHp);
  $('heroLevel').textContent = state.level;
  $('heroLevelBadge').textContent = state.level;
  $('gold').textContent = state.gold;
  $('wave').textContent = state.wave;
  $('chestCount').textContent = state.chestCount;
  $('openChestCount').textContent = state.chestCount;
  $('atk').textContent = s.atk;
  $('def').textContent = s.def;
  $('maxHp').textContent = s.maxHp;
  $('atkSpeed').textContent = `${(1000 / s.atkSpeed).toFixed(2)}回/秒`;
  $('heroHpText').textContent = `${state.heroHp}/${s.maxHp}`;
  $('enemyHpText').textContent = `${Math.max(0, enemy.hp)}/${enemy.maxHp}`;
  $('expText').textContent = `${state.exp}/${expNeed()}`;
  $('heroHpBar').style.width = `${(state.heroHp / s.maxHp) * 100}%`;
  $('enemyHpBar').style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
  $('expBar').style.width = `${(state.exp / expNeed()) * 100}%`;
  $('weaponLv').textContent = state.weaponLv;
  $('armorLv').textContent = state.armorLv;
  $('ringLv').textContent = state.ringLv;
  $('weaponCost').textContent = upgradeCost('weaponLv');
  $('armorCost').textContent = upgradeCost('armorLv');
  $('ringCost').textContent = upgradeCost('ringLv');
  $('weaponBtn').disabled = state.gold < upgradeCost('weaponLv');
  $('armorBtn').disabled = state.gold < upgradeCost('armorLv');
  $('ringBtn').disabled = state.gold < upgradeCost('ringLv');
  $('openChestBtn').disabled = state.chestCount <= 0;
  $('enemy').classList.toggle('boss', enemy.isBoss);
}

function gameLoop(now){
  const s = stats();
  if (now - lastAttack > s.atkSpeed) { attack(); lastAttack = now; }
  if (now - lastEnemyAttack > 1300) { enemyAttack(); lastEnemyAttack = now; }
  saveTimer += 16;
  if (saveTimer > 5000) { save(false); saveTimer = 0; }
  render();
  requestAnimationFrame(gameLoop);
}

$('weaponBtn').addEventListener('click', () => upgrade('weaponLv'));
$('armorBtn').addEventListener('click', () => upgrade('armorLv'));
$('ringBtn').addEventListener('click', () => upgrade('ringLv'));
$('healBtn').addEventListener('click', heal);
$('openChestBtn').addEventListener('click', openChest);
$('saveBtn').addEventListener('click', () => save(true));
$('resetBtn').addEventListener('click', reset);

log('冒険開始！敵は右から出てきて自動で戦うよ');
spawnEnemyAnimation();
render();
requestAnimationFrame(gameLoop);
