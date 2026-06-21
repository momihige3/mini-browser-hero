'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const HOST = '127.0.0.1';
const PORT = 8765;
const BASE_URL = `http://${HOST}:${PORT}`;
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
