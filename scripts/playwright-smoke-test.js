'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const HOST = '127.0.0.1';
const PORT = 8765;
const BASE_URL = `http://${HOST}:${PORT}`;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROJECT_VERSION = require('../package.json').version;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
};

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);

  const executablePath = candidates.find(candidate => fs.existsSync(candidate));
  if (!executablePath) {
    throw new Error('ChromeまたはEdgeが見つかりません。PLAYWRIGHT_EXECUTABLE_PATHを指定してください。');
  }
  return executablePath;
}

function createStaticServer() {
  return http.createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url, BASE_URL);
      const relativePath = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
      const filePath = path.resolve(PROJECT_ROOT, `.${relativePath}`);
      if (!filePath.startsWith(`${PROJECT_ROOT}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      });
      fs.createReadStream(filePath).pipe(response);
    } catch (_) {
      response.writeHead(404).end('Not Found');
    }
  });
}

async function isServerAvailable() {
  try {
    const response = await fetch(`${BASE_URL}/index.html`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function ensureServer() {
  if (await isServerAvailable()) return null;
  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, HOST, resolve);
  });
  return server;
}

async function run() {
  const executablePath = findBrowserExecutable();
  const ownedServer = await ensureServer();
  let browser;

  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--autoplay-policy=no-user-gesture-required'],
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const consoleErrors = [];
    const pageErrors = [];
    const failedLocalRequests = [];

    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => {
      if (request.url().startsWith(BASE_URL)) {
        failedLocalRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText || 'failed'}`);
      }
    });
    await page.route('https://static.cloudflareinsights.com/**', route =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
    );

    const response = await page.goto(`${BASE_URL}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    if (!response || !response.ok()) throw new Error(`index.htmlの読込に失敗しました: ${response?.status()}`);

    await page.waitForSelector('#enemyName', { state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const hpText = document.querySelector('#enemyHpText')?.textContent?.trim();
      return Boolean(hpText && hpText !== '0 / 0');
    }, null, { timeout: 10000 });

    const initialBattle = await page.evaluate(() => ({
      enemyHpText: document.querySelector('#enemyHpText')?.textContent?.trim() || '',
      enemyName: document.querySelector('#enemyName')?.textContent?.trim() || '',
      logText: document.querySelector('#log')?.textContent?.trim() || '',
    }));
    try {
      await page.waitForFunction(
        initial => {
          const enemyHpText = document.querySelector('#enemyHpText')?.textContent?.trim() || '';
          const enemyName = document.querySelector('#enemyName')?.textContent?.trim() || '';
          const logText = document.querySelector('#log')?.textContent?.trim() || '';
          return enemyHpText !== initial.enemyHpText || enemyName !== initial.enemyName || logText !== initial.logText;
        },
        initialBattle,
        { timeout: 10000 }
      );
    } catch (error) {
      const currentBattle = await page.evaluate(() => ({
        enemyHpText: document.querySelector('#enemyHpText')?.textContent?.trim() || '',
        enemyName: document.querySelector('#enemyName')?.textContent?.trim() || '',
        heroHpText: document.querySelector('#heroHpText')?.textContent?.trim() || '',
        logText: document.querySelector('#log')?.textContent?.trim() || '',
      }));
      throw new Error(`戦闘進行を確認できませんでした: ${JSON.stringify({ initialBattle, currentBattle, consoleErrors, pageErrors, failedLocalRequests }, null, 2)}\n${error.message}`);
    }

    const masterAmulet = await page.evaluate(() => {
      const findMaster = () => Object.values(state.equip || {}).find(item => item?.name === '師匠のアミュレット')
        || (state.inventory || []).find(item => item?.name === '師匠のアミュレット');
      const before = findMaster();
      if (!before) throw new Error('師匠のアミュレットが見つかりません。');
      state.level = 36;
      state.xp = effectiveXpNext();
      before.level = 0;
      before.itemLevel = 1;
      checkLevelUp();
      renderAll();
      const after = findMaster();
      const displayedName = Array.from(document.querySelectorAll('#equipList .equip b, #inventory .item b'))
        .map(element => element.textContent?.trim() || '')
        .find(text => text.includes('師匠のアミュレット')) || '';
      return {
        displayedName,
        heroLevel: state.level,
        itemLevel: after?.itemLevel,
        plusLevel: after?.level,
      };
    });
    if (masterAmulet.heroLevel !== 37 || masterAmulet.plusLevel !== 37 || masterAmulet.itemLevel !== 37 || !masterAmulet.displayedName.includes('+37')) {
      throw new Error(`師匠のアミュレットが主人公Lvと同期していません: ${JSON.stringify(masterAmulet)}`);
    }

    await page.evaluate(() => {
      const master = Object.values(state.equip || {}).find(item => item?.name === '師匠のアミュレット')
        || (state.inventory || []).find(item => item?.name === '師匠のアミュレット');
      master.level = 0;
      master.itemLevel = 1;
      saveGame();
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => typeof state !== 'undefined' && typeof renderAll === 'function' && Boolean(state.enemy), null, { timeout: 10000 });
    const masterAmuletReload = await page.evaluate(() => {
      const master = Object.values(state.equip || {}).find(item => item?.name === '師匠のアミュレット')
        || (state.inventory || []).find(item => item?.name === '師匠のアミュレット');
      return {
        heroLevel: state.level,
        itemLevel: master?.itemLevel,
        plusLevel: master?.level,
      };
    });
    if (masterAmuletReload.heroLevel !== 37 || masterAmuletReload.plusLevel !== 37 || masterAmuletReload.itemLevel !== 37) {
      throw new Error(`既存セーブ読込時に師匠のアミュレットが補正されません: ${JSON.stringify(masterAmuletReload)}`);
    }

    await page.waitForTimeout(700);
    const versionState = await page.evaluate(() => ({
      appVersion: window.APP_VERSION,
      datasetVersion: document.documentElement.dataset.buildVersion,
      debugVersion: document.querySelector('.debug-version')?.textContent?.trim() || '',
      gameVersion: window.GAME_VERSION,
      labelVersion: document.querySelector('.build-version')?.textContent?.trim() || '',
    }));
    if (versionState.appVersion !== PROJECT_VERSION || versionState.gameVersion !== PROJECT_VERSION || versionState.datasetVersion !== PROJECT_VERSION
      || !versionState.labelVersion.includes(PROJECT_VERSION) || !versionState.debugVersion.includes(PROJECT_VERSION)) {
      throw new Error(`バージョン表記が単一値へ同期していません: ${JSON.stringify({ expected: PROJECT_VERSION, versionState })}`);
    }

    await page.evaluate(() => showSharedCutin({
      img: 'assets/cutin_eye_1.jpg',
      quote: '切替前',
      title: '切替前',
      mode: 'hero',
    }));
    await page.waitForFunction(() => document.querySelector('#deathDanceCutin')?.classList.contains('show'));
    const delayedCutinUrl = `${BASE_URL}/assets/cutin_dark_sword_dance.png?cutin-transition-test=1`;
    await page.route(delayedCutinUrl, async route => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.continue();
    });
    await page.evaluate(url => showSharedCutin({
      img: url,
      quote: '切替後',
      title: '暗黒剣舞',
      mode: 'dark',
    }), delayedCutinUrl);
    const cutinPending = await page.evaluate(() => {
      const cutin = document.querySelector('#deathDanceCutin');
      const image = document.querySelector('#deathDanceCutinImg');
      return {
        cutinHidden: Boolean(cutin?.classList.contains('hidden')),
        imageHidden: image ? getComputedStyle(image).visibility === 'hidden' : false,
        loading: Boolean(cutin?.classList.contains('cutin-loading')),
        shown: Boolean(cutin?.classList.contains('show')),
      };
    });
    if (!cutinPending.cutinHidden || !cutinPending.imageHidden || !cutinPending.loading || cutinPending.shown) {
      throw new Error(`カットイン画像の切替中に旧画像が露出します: ${JSON.stringify(cutinPending)}`);
    }
    await page.waitForFunction(url => {
      const cutin = document.querySelector('#deathDanceCutin');
      const image = document.querySelector('#deathDanceCutinImg');
      return Boolean(cutin?.classList.contains('show') && !cutin.classList.contains('hidden')
        && image?.complete && image.naturalWidth > 0 && image.currentSrc === url);
    }, delayedCutinUrl, { timeout: 5000 });
    await page.unroute(delayedCutinUrl);
    const cutinTransition = await page.evaluate(() => ({
      image: document.querySelector('#deathDanceCutinImg')?.currentSrc || '',
      loading: document.querySelector('#deathDanceCutin')?.classList.contains('cutin-loading') || false,
      title: document.querySelector('.death-dance-cutin-title')?.textContent?.trim() || '',
    }));

    await page.evaluate(() => showSharedCutin({
      img: HOLY_SWORD_RELEASE_CUTIN.img,
      quote: HOLY_SWORD_RELEASE_CUTIN.quote,
      title: '聖剣解放',
      mode: 'holy',
    }));
    await page.waitForFunction(() => {
      const cutin = document.querySelector('#deathDanceCutin');
      const image = document.querySelector('#deathDanceCutinImg');
      return Boolean(cutin?.classList.contains('show') && image?.complete && image.naturalWidth > 0);
    });
    const holyCutinLayout = await page.evaluate(() => {
      const strip = document.querySelector('.death-dance-cutin-strip');
      const image = document.querySelector('#deathDanceCutinImg');
      const stripRect = strip?.getBoundingClientRect();
      const style = image ? getComputedStyle(image) : null;
      return {
        imageComplete: Boolean(image?.complete && image.naturalWidth > 0),
        objectFit: style?.objectFit || '',
        stripHeight: Math.round(stripRect?.height || 0),
        title: document.querySelector('.death-dance-cutin-title')?.textContent?.trim() || '',
      };
    });
    if (!holyCutinLayout.imageComplete || holyCutinLayout.objectFit !== 'contain' || holyCutinLayout.stripHeight < 280
      || holyCutinLayout.title !== '聖剣解放') {
      throw new Error(`聖剣解放カットインの全体表示が不正です: ${JSON.stringify(holyCutinLayout)}`);
    }
    await page.evaluate(() => hideDeathDanceCutin());

    await page.evaluate(() => setMenuPage('stats'));
    const wideTabs = page.locator('.side-panel > .mobile-menu-tabs [data-menu-page]');
    if (await wideTabs.count() !== 3) throw new Error('横長画面のページ切替ボタンが3個ではありません。');
    for (const pageName of ['stats', 'equip', 'inventory']) {
      const tab = page.locator(`.side-panel > .mobile-menu-tabs [data-menu-page="${pageName}"]`);
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await page.waitForFunction(name => {
        const active = document.querySelector('.side-panel > .menu-content-fixed > .panel.active-page');
        const expected = name === 'stats' ? 'hero-stats' : name === 'equip' ? 'equip-panel' : 'inventory-panel';
        return Boolean(active?.classList.contains(expected) && getComputedStyle(active).display !== 'none');
      }, pageName);
    }
    await page.locator('.side-panel > .mobile-menu-tabs [data-menu-page="stats"]').click();
    const wideMenuLayout = await page.evaluate(() => {
      const side = document.querySelector('.side-panel');
      const footer = document.querySelector('.side-panel > .menu-footer');
      const records = document.querySelector('.hero-stats.active-page .monster-record-list');
      const panels = Array.from(document.querySelectorAll('.side-panel > .menu-content-fixed > .panel'));
      const sideRect = side?.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();
      const recordsRect = records?.getBoundingClientRect();
      return {
        activePanelCount: panels.filter(panel => getComputedStyle(panel).display !== 'none').length,
        footerInside: Boolean(sideRect && footerRect && footerRect.left >= sideRect.left - 1 && footerRect.right <= sideRect.right + 1
          && footerRect.bottom <= sideRect.bottom + 1),
        recordsFooterGap: footerRect && recordsRect ? Math.round(footerRect.top - recordsRect.bottom) : 9999,
        recordsHeight: Math.round(recordsRect?.height || 0),
        sideRect: sideRect ? {left:Math.round(sideRect.left), top:Math.round(sideRect.top), right:Math.round(sideRect.right), bottom:Math.round(sideRect.bottom)} : null,
        footerRect: footerRect ? {left:Math.round(footerRect.left), top:Math.round(footerRect.top), right:Math.round(footerRect.right), bottom:Math.round(footerRect.bottom), height:Math.round(footerRect.height)} : null,
        footerStyle: footer ? {
          display:getComputedStyle(footer).display,
          gridColumn:getComputedStyle(footer).gridColumn,
          gridRow:getComputedStyle(footer).gridRow,
          left:getComputedStyle(footer).left,
          margin:getComputedStyle(footer).margin,
          offsetLeft:footer.offsetLeft,
          parentClass:footer.parentElement?.className || '',
          position:getComputedStyle(footer).position,
          transform:getComputedStyle(footer).transform,
        } : null,
        sideGrid: side ? {columns:getComputedStyle(side).gridTemplateColumns, display:getComputedStyle(side).display,
          direction:getComputedStyle(side).direction, offsetLeft:side.offsetLeft, rows:getComputedStyle(side).gridTemplateRows,
          transform:getComputedStyle(side).transform} : null,
        recordsRect: recordsRect ? {top:Math.round(recordsRect.top), bottom:Math.round(recordsRect.bottom)} : null,
        tabsVisible: Array.from(document.querySelectorAll('.side-panel > .mobile-menu-tabs button'))
          .every(button => getComputedStyle(button).display !== 'none' && button.getBoundingClientRect().height > 0),
      };
    });
    if (!wideMenuLayout.tabsVisible || wideMenuLayout.activePanelCount !== 1 || !wideMenuLayout.footerInside
      || wideMenuLayout.recordsFooterGap > 40 || wideMenuLayout.recordsHeight < 300) {
      throw new Error(`横長メニューレイアウトが不正です: ${JSON.stringify(wideMenuLayout)}`);
    }

    await page.setViewportSize({ width: 1680, height: 710 });
    const inventoryFixture = await page.evaluate(() => {
      const current = makeDarkHolySword(state.level);
      const candidate = makeDebugSword();
      current.flavor = Array.from({ length: 18 }, (_, index) => `current-effect-${index + 1}`).join(' / ');
      candidate.flavor = Array.from({ length: 18 }, (_, index) => `selected-effect-${index + 1}`).join(' / ');
      state.equip['武器'] = current;
      state.inventory = [candidate];
      for (let i = 0; i < 120; i++) state.inventory.push(makeRandomItem());
      localStorage.setItem('mbh-inventory-slot-filter', 'all');
      setMenuPage('inventory');
      renderAll();
      const anchor = document.querySelector(`#inventory [data-item-id="${candidate.id}"]`);
      anchor?.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1080, clientY: 260 }));
      showInventoryActionMenu(candidate, anchor);
      return {
        currentName: formatItemNameWithPlus(current),
        currentSummary: itemSummary(current),
        selectedName: formatItemNameWithPlus(candidate),
        selectedSummary: itemSummary(candidate),
      };
    });
    const inventoryUi = await page.evaluate(expected => {
      const inventory = document.querySelector('#inventory');
      const menu = document.querySelector('#inventoryActionMenu');
      const columns = Array.from(document.querySelectorAll('#inventoryActionMenu .inventory-compare-col'));
      const before = inventory?.scrollTop || 0;
      if (inventory) inventory.scrollTop = inventory.scrollHeight;
      const after = inventory?.scrollTop || 0;
      if (menu) menu.style.setProperty('max-height', '120px', 'important');
      const menuBefore = menu?.scrollTop || 0;
      if (menu) menu.scrollTop = menu.scrollHeight;
      const menuAfter = menu?.scrollTop || 0;
      const tooltip = document.querySelector('#tooltip');
      const tooltipSections = Array.from(tooltip?.querySelectorAll('.inventory-tooltip-section') || []);
      const tooltipRect = tooltip?.getBoundingClientRect();
      const includesSummary = (section, summary) => summary.split(' / ').every(part => section?.textContent.includes(part));
      return {
        columns: columns.length,
        currentComplete: Boolean(columns[1]?.textContent.includes(expected.currentName)
          && columns[1]?.querySelector('pre')?.textContent === expected.currentSummary),
        overflowY: inventory ? getComputedStyle(inventory).overflowY : '',
        scrollbarGutter: inventory ? getComputedStyle(inventory).scrollbarGutter : '',
        scrollbarColor: inventory ? getComputedStyle(inventory).scrollbarColor : '',
        scrollHeight: inventory?.scrollHeight || 0,
        clientHeight: inventory?.clientHeight || 0,
        scrolled: after > before,
        menuOverflowY: menu ? getComputedStyle(menu).overflowY : '',
        menuScrollbarColor: menu ? getComputedStyle(menu).scrollbarColor : '',
        menuScrollHeight: menu?.scrollHeight || 0,
        menuClientHeight: menu?.clientHeight || 0,
        menuScrolled: menuAfter > menuBefore,
        selectedComplete: Boolean(columns[0]?.textContent.includes(expected.selectedName)
          && columns[0]?.querySelector('pre')?.textContent === expected.selectedSummary),
        tooltipCurrentComplete: Boolean(tooltipSections[1]?.textContent.includes(expected.currentName)
          && includesSummary(tooltipSections[1], expected.currentSummary)),
        tooltipSelectedComplete: Boolean(tooltipSections[0]?.textContent.includes(expected.selectedName)
          && includesSummary(tooltipSections[0], expected.selectedSummary)),
        tooltipSectionCount: tooltipSections.length,
        tooltipScrollbarColor: tooltip ? getComputedStyle(tooltip).scrollbarColor : '',
        tooltipFitsViewport: Boolean(tooltipRect && tooltipRect.left >= 0 && tooltipRect.top >= 0
          && tooltipRect.right <= window.innerWidth && tooltipRect.bottom <= window.innerHeight),
      };
    }, inventoryFixture);
    if (inventoryUi.columns !== 2 || !inventoryUi.currentComplete || !inventoryUi.selectedComplete
      || inventoryUi.overflowY !== 'scroll' || !inventoryUi.scrollbarGutter.includes('stable')
      || inventoryUi.scrollHeight <= inventoryUi.clientHeight || !inventoryUi.scrolled
      || inventoryUi.scrollbarColor === 'auto' || inventoryUi.menuOverflowY !== 'auto'
      || inventoryUi.menuScrollbarColor === 'auto' || inventoryUi.menuScrollHeight <= inventoryUi.menuClientHeight
      || !inventoryUi.menuScrolled || inventoryUi.tooltipSectionCount !== 2
      || !inventoryUi.tooltipCurrentComplete || !inventoryUi.tooltipSelectedComplete
      || inventoryUi.tooltipScrollbarColor === 'auto' || !inventoryUi.tooltipFitsViewport) {
      throw new Error(`倉庫スクロールまたは装備比較が不正です: ${JSON.stringify(inventoryUi)}`);
    }
    await page.evaluate(() => cancelInventoryActionMenu());

    await page.evaluate(() => {
      grantHolySet();
      setMenuPage('inventory');
      renderAll();
    });
    const holyFilter = page.locator('#inventorySlotFilter059 [data-slot-filter="holy"]');
    await holyFilter.waitFor({ state: 'visible', timeout: 5000 });
    await holyFilter.click();
    await page.waitForFunction(() => {
      const items = Array.from(document.querySelectorAll('#inventory .item'));
      return items.length === 7 && items.every(item => item.classList.contains('holy'));
    }, null, { timeout: 5000 });

    const holyInventory = await page.evaluate(() => {
      const filter = document.querySelector('#inventorySlotFilter059 [data-slot-filter="holy"]');
      const items = Array.from(document.querySelectorAll('#inventory .item'));
      const name = items[0]?.querySelector('b');
      const style = name ? getComputedStyle(name) : null;
      return {
        filterActive: Boolean(filter?.classList.contains('active')),
        filterLabel: filter?.textContent?.trim() || '',
        itemCount: items.length,
        allHoly: items.every(item => item.classList.contains('holy')),
        rainbowBackground: style?.backgroundImage || '',
        textFillColor: style?.webkitTextFillColor || style?.color || '',
      };
    });
    if (!holyInventory.filterActive || holyInventory.itemCount !== 7 || !holyInventory.allHoly) {
      throw new Error(`聖剣フィルターの表示が不正です: ${JSON.stringify(holyInventory)}`);
    }
    if (!holyInventory.rainbowBackground.includes('linear-gradient')) {
      throw new Error(`倉庫の聖剣名が虹色表示ではありません: ${JSON.stringify(holyInventory)}`);
    }

    await page.evaluate(() => {
      const holyItem = state.inventory.find(item => item?.specialFrame === 'holy');
      if (!holyItem) throw new Error('装備確認用の聖剣が見つかりません。');
      equipItem(holyItem);
      renderEquip();
    });
    const holyEquip = await page.evaluate(() => {
      const name = document.querySelector('#equipList .equip.holy > b');
      const style = name ? getComputedStyle(name) : null;
      return {
        found: Boolean(name),
        rainbowBackground: style?.backgroundImage || '',
        text: name?.textContent?.trim() || '',
      };
    });
    if (!holyEquip.found || !holyEquip.rainbowBackground.includes('linear-gradient')) {
      throw new Error(`装備欄の聖剣名が虹色表示ではありません: ${JSON.stringify(holyEquip)}`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => showSharedCutin({
      img: HOLY_SWORD_RELEASE_CUTIN.img,
      quote: HOLY_SWORD_RELEASE_CUTIN.quote,
      title: '聖剣解放',
      mode: 'holy',
    }));
    await page.waitForFunction(() => document.querySelector('#deathDanceCutin')?.classList.contains('show'));
    await page.waitForTimeout(550);
    const holyCutinMobile = await page.evaluate(() => {
      const strip = document.querySelector('.death-dance-cutin-strip');
      const image = document.querySelector('#deathDanceCutinImg');
      const rect = strip?.getBoundingClientRect();
      return {
        fitsViewport: Boolean(rect && rect.left >= -1 && rect.right <= window.innerWidth + 1),
        objectFit: image ? getComputedStyle(image).objectFit : '',
        stripHeight: Math.round(rect?.height || 0),
        stripWidth: Math.round(rect?.width || 0),
      };
    });
    if (!holyCutinMobile.fitsViewport || holyCutinMobile.objectFit !== 'contain' || holyCutinMobile.stripHeight < 250) {
      throw new Error(`スマートフォン幅の聖剣解放カットインが不正です: ${JSON.stringify(holyCutinMobile)}`);
    }
    await page.evaluate(() => hideDeathDanceCutin());
    await page.locator('#equipToggleBtn').click();
    await holyFilter.waitFor({ state: 'visible', timeout: 5000 });
    const holyMobile = await page.evaluate(() => {
      const bar = document.querySelector('#inventorySlotFilter059');
      const buttons = Array.from(bar?.querySelectorAll('[data-slot-filter]') || []);
      const barRect = bar?.getBoundingClientRect();
      return {
        buttonCount: buttons.length,
        filterVisible: Boolean(barRect && barRect.width > 0 && barRect.height > 0),
        fitsViewport: Boolean(barRect && barRect.left >= 0 && barRect.right <= window.innerWidth),
        buttonsFitBar: Boolean(barRect && buttons.every(button => {
          const rect = button.getBoundingClientRect();
          return rect.left >= barRect.left - 1 && rect.right <= barRect.right + 1;
        })),
      };
    });
    if (holyMobile.buttonCount !== 11 || !holyMobile.filterVisible || !holyMobile.fitsViewport || !holyMobile.buttonsFitBar) {
      throw new Error(`スマートフォン幅の聖剣フィルター配置が不正です: ${JSON.stringify(holyMobile)}`);
    }

    const result = await page.evaluate(() => ({
      brand: document.querySelector('.brand')?.textContent?.trim() || '',
      enemyName: document.querySelector('#enemyName')?.textContent?.trim() || '',
      finalBattle: {
        enemyHpText: document.querySelector('#enemyHpText')?.textContent?.trim() || '',
        heroHpText: document.querySelector('#heroHpText')?.textContent?.trim() || '',
        logText: document.querySelector('#log')?.textContent?.trim() || '',
      },
      title: document.title,
      version: window.APP_VERSION,
    }));

    if (!result.title.includes('ミニブラウザヒーロー')) throw new Error(`タイトルが不正です: ${result.title}`);
    if (!result.brand.includes('ver.')) throw new Error(`バージョン表示がありません: ${result.brand}`);
    if (!result.enemyName) throw new Error('敵名が表示されていません。');
    if (consoleErrors.length || pageErrors.length || failedLocalRequests.length) {
      throw new Error(JSON.stringify({ consoleErrors, pageErrors, failedLocalRequests }, null, 2));
    }

    console.log(JSON.stringify({
      status: 'PASS',
      browser: executablePath,
      url: page.url(),
      initialBattle,
      ...result,
      masterAmulet,
      masterAmuletReload,
      versionState,
      cutinPending,
      cutinTransition,
      holyCutinLayout,
      holyCutinMobile,
      wideMenuLayout,
      inventoryUi,
      holyEquip,
      holyInventory,
      holyMobile,
      consoleErrors,
      pageErrors,
      failedLocalRequests,
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    if (ownedServer) await new Promise(resolve => ownedServer.close(resolve));
  }
}

run().catch(error => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
