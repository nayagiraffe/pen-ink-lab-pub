// PWA 테스트: 매니페스트·아이콘, 서비스 워커 등록·캐시, 오프라인 사용, 새 버전 교체
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright');
const SITE = path.resolve(__dirname, '../site');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
let browser, server, base, variant = 'A';

before(async () => {
  const root = path.resolve(__dirname, '..');
  const built = fs.statSync(SITE + '/index.html').mtimeMs;
  const newest = [...fs.readdirSync(root + '/src/parts').map(f => root + '/src/parts/' + f), root + '/src/manifest.json', root + '/web/sw.js', root + '/web/manifest.webmanifest'].reduce((m, f) => Math.max(m, fs.statSync(f).mtimeMs), 0);
  if (newest > built) throw new Error('site/ 가 소스보다 오래됐습니다. npm run build 후 다시 실행하세요.');
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x'); let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
    const file = path.join(SITE, p);
    if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    let body = fs.readFileSync(file);
    if (p === '/sw.js' && variant === 'B') body = Buffer.from(body.toString('utf8').replace(/pil-v[\d.]+-[0-9a-f]+/, 'pil-v9.9.9-bbbbbbbb'));
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port + '/';
  browser = await chromium.launch();
});
after(async () => { if (browser) await browser.close(); if (server) server.close(); });

async function open(init) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  if (init) await page.addInitScript(init);
  await page.goto(base);
  await page.waitForFunction(() => typeof PIL !== 'undefined');
  return { ctx, page, errors };
}
const ready = page => page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
const cacheKeys = page => page.evaluate(() => caches.keys());
const until = async (fn, ms = 10000) => { const t0 = Date.now(); for (;;) { if (await fn()) return; if (Date.now() - t0 > ms) throw new Error('시간 초과'); await new Promise(r => setTimeout(r, 100)); } };
const pngSize = f => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('매니페스트: 설치 가능 조건(이름·시작 주소·standalone·192/512 아이콘·maskable)을 갖춘다', () => {
  const m = JSON.parse(fs.readFileSync(SITE + '/manifest.webmanifest', 'utf8'));
  assert.ok(m.name && m.short_name && m.start_url === './' && m.scope === './');
  assert.equal(m.display, 'standalone'); assert.equal(m.lang, 'ko');
  const has = (sz, purpose) => m.icons.some(i => i.sizes === sz && i.purpose === purpose && i.type === 'image/png');
  assert.ok(has('192x192', 'any') && has('512x512', 'any') && has('512x512', 'maskable'));
  for (const i of m.icons) {
    const f = path.join(SITE, i.src); assert.ok(fs.existsSync(f), i.src + ' 없음');
    assert.deepEqual(pngSize(f), i.sizes.split('x').map(Number), i.src + ' 실제 크기');
  }
  assert.deepEqual(pngSize(SITE + '/icons/icon-180.png'), [180, 180]);
  assert.ok(m.short_name.length <= 12, '홈 화면 이름이 잘리지 않을 길이');
});

test('앱 HTML 이 매니페스트·아이콘·iOS 설정을 연결한다', () => {
  const html = fs.readFileSync(SITE + '/index.html', 'utf8');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/icon-180\.png">/);
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /name="theme-color"/);
  assert.ok(fs.existsSync(SITE + '/.nojekyll'));
});

test('서비스 워커: 등록되고 앱 파일 전체가 캐시된다', async () => {
  const { ctx, page, errors } = await open();
  assert.equal(await ready(page), true);
  const keys = await cacheKeys(page);
  assert.equal(keys.length, 1); assert.match(keys[0], /^pil-v[\d.]+-[0-9a-f]{8}$/);
  const cached = await page.evaluate(async k => (await (await caches.open(k)).keys()).map(r => new URL(r.url).pathname).sort(), keys[0]);
  const expected = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-180.png', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'].sort();
  assert.deepEqual(cached, expected);
  assert.deepEqual(errors, []); await ctx.close();
});

test('오프라인: 인터넷을 끊어도 앱이 열리고, 입력·저장·새로고침 후에도 데이터가 남는다', async () => {
  const { ctx, page, errors } = await open();
  await ready(page); await page.reload(); await page.waitForFunction(() => typeof PIL !== 'undefined' && !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForFunction(() => typeof PIL !== 'undefined');
  assert.match(await page.title(), /Pen & Ink Lab/);
  assert.equal(await page.isVisible('#match'), true);
  await page.evaluate(() => { PIL.ensureInk(INK_CATALOG.find(i => i.name === 'Oxblood')); save(); });
  assert.equal(await page.textContent('#syncStatus'), '저장 완료');
  await page.reload(); await page.waitForFunction(() => typeof PIL !== 'undefined');
  assert.equal(await page.evaluate(() => db.inks.map(i => i.name).join()), 'Oxblood');
  assert.deepEqual(errors, []); await ctx.close();
});

test('오프라인에서 아이콘·매니페스트도 캐시에서 제공된다', async () => {
  const { ctx, page } = await open();
  await ready(page); await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  const r = await page.evaluate(async () => { const a = await fetch('icons/icon-192.png'), b = await fetch('manifest.webmanifest'); return [a.status, a.headers.get('content-type'), b.status, (await b.json()).name]; });
  assert.deepEqual(r, [200, 'image/png', 200, 'Pen & Ink Lab']);
  await ctx.close();
});

test('실패한 요청(404)은 캐시하지 않는다', async () => {
  const { ctx, page } = await open();
  await ready(page); await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert.equal(await page.evaluate(async () => (await fetch('nope.png')).status), 404);
  const [key] = await cacheKeys(page);
  assert.equal(await page.evaluate(async k => !!(await (await caches.open(k)).match('nope.png')), key), false);
  await ctx.close();
});

test('새 버전: 옛 앱 캐시는 지우고 다른 사이트 캐시는 건드리지 않으며, 사용자 데이터는 그대로다', async () => {
  variant = 'A';
  const { ctx, page } = await open(() => { caches.open('other-app-cache'); caches.open('pil-v0.0.1-old00000'); });
  await ready(page);
  // 첫 설치 후: 옛 pil- 캐시는 정리되고 다른 앱 캐시는 남는다
  await until(async () => !(await cacheKeys(page)).includes('pil-v0.0.1-old00000'));
  assert.ok((await cacheKeys(page)).includes('other-app-cache'));
  await page.evaluate(() => { PIL.ensureInk(INK_CATALOG[0]); save(); });
  const before = await cacheKeys(page);
  // 서버가 새 서비스 워커(다른 캐시 이름)를 내려 주면 교체된다
  variant = 'B';
  await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await until(async () => { const k = await cacheKeys(page); return k.includes('pil-v9.9.9-bbbbbbbb') && !k.some(x => /^pil-v0\.1\.0/.test(x)); });
  const after = await cacheKeys(page);
  assert.ok(after.includes('other-app-cache') && after.includes('pil-v9.9.9-bbbbbbbb'));
  assert.ok(!after.some(k => before.some(b => b.startsWith('pil-v0.1.0') && b === k)), '옛 캐시 삭제');
  assert.equal(await page.evaluate(() => db.inks.length), 1, '사용자 데이터는 그대로');
  await page.waitForFunction(() => { const t = document.getElementById('pilToast'); return t && /새 버전이 준비됐어요/.test(t.textContent); });
  variant = 'A'; await ctx.close();
});

test('앱은 외부 사이트에 요청하지 않는다 (서버 접속은 같은 주소의 앱 파일뿐)', async () => {
  const ctx = await browser.newContext(); const page = await ctx.newPage(); const urls = [];
  page.on('request', r => urls.push(r.url()));
  await page.goto(base); await page.waitForFunction(() => typeof PIL !== 'undefined'); await ready(page);
  const foreign = urls.filter(u => !u.startsWith(base) && !/^(data|blob|about):/.test(u));
  assert.deepEqual(foreign, []); await ctx.close();
});
