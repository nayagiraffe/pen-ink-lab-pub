// 로컬 우선 동작 테스트: 저장 유지·저장 불가·백업 알림·백업/복원 라운드트립·iPhone/Android 안내·영구 저장·용량
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const BUILD = path.resolve(__dirname, '../site/index.html');
const KEY = 'pil_pen_ink_lab_v01';
let browser;
before(async () => {
  const root = path.resolve(__dirname, '..');
  const built = fs.statSync(BUILD).mtimeMs;
  const newest = [...fs.readdirSync(root + '/src/parts').map(f => root + '/src/parts/' + f), root + '/src/manifest.json'].reduce((m, f) => Math.max(m, fs.statSync(f).mtimeMs), 0);
  if (newest > built) throw new Error('site/index.html 이 소스보다 오래됐습니다. npm run build 후 다시 실행하세요.');
  browser = await chromium.launch();
});
after(async () => { if (browser) await browser.close(); });

// opts: seed(db 객체를 localStorage 에 미리 저장), kv(미리 넣을 키-값), ua, init(추가 초기 스크립트)
// 주의: 시드는 addInitScript 가 아니라 "한 번 열고 → 값을 넣고 → 다시 열기"로 넣는다.
//       매 로드마다 초기 스크립트가 localStorage 를 건드리면 Chromium(file://)에서 직후 새로고침 때 다른 키의 쓰기가 간헐적으로 유실된다(테스트 장치 문제, 앱 문제 아님).
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 }, acceptDownloads: true, ...(opts.ua ? { userAgent: opts.ua } : {}) });
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  page.on('dialog', d => d.accept());
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto('file://' + BUILD);
  await page.waitForFunction(() => typeof PIL !== 'undefined' && typeof save === 'function');
  if (opts.seed || opts.kv) {
    await page.evaluate(({ seed, kv, key }) => {
      if (seed) localStorage.setItem(key, JSON.stringify(seed));
      for (const [k, v] of Object.entries(kv || {})) localStorage.setItem(k, String(v));
    }, { seed: opts.seed, kv: opts.kv, key: KEY });
    await page.reload();
    await page.waitForFunction(() => typeof PIL !== 'undefined' && typeof save === 'function');
  }
  return { ctx, page, errors, requests };
}
const data = () => ({ pens: F.pens, inks: F.inks, history: [], testReviews: [] });
const DAY = 864e5;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

test('입력한 데이터는 새로고침해도 이 기기에 남고 상태가 "저장 완료"로 보인다', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => { PIL.ensureInk(INK_CATALOG.find(i => i.name === 'Oxblood')); save(); });
  assert.equal(await page.textContent('#syncStatus'), '저장 완료');
  assert.match(await page.textContent('#syncDetails'), /이 기기\(브라우저\)에 저장됨/);
  await page.reload(); await page.waitForFunction(() => typeof save === 'function');
  assert.equal(await page.evaluate(() => db.inks.map(i => i.name).join()), 'Oxblood');
  assert.deepEqual(errors, []); await ctx.close();
});

test('저장 시 토스트로 알려 준다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { PIL.ensureInk(INK_CATALOG[0]); save(); });
  await page.waitForFunction(() => { const t = document.getElementById('uiToast'); return t && !t.hidden && /이 기기에 저장/.test(t.textContent); });
  await ctx.close();
});

test('브라우저가 저장을 막으면 "저장 실패"와 백업 안내를 보여 준다', async () => {
  const { ctx, page } = await open({ init: () => { Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); }; } });
  await page.evaluate(() => { PIL.ensureInk(INK_CATALOG[0]); save(); });
  assert.equal(await page.textContent('#syncStatus'), '저장 실패');
  assert.equal(await page.isVisible('#storageWarning'), true);
  assert.match(await page.textContent('#storageWarning'), /백업/);
  await ctx.close();
});

test('처음 쓰는 사람(데이터 3개 미만)에게는 백업 알림이 뜨지 않는다', async () => {
  const { ctx, page } = await open({ seed: { pens: [F.pens[0]], inks: [F.inks[0]], history: [], testReviews: [] } });
  assert.equal(await page.locator('#pilBackupBanner').count(), 0);
  await ctx.close();
});

test('데이터가 쌓였는데 백업이 없으면 알림이 뜬다', async () => {
  const { ctx, page } = await open({ seed: data() });
  assert.equal(await page.locator('#pilBackupBanner').count(), 1);
  assert.match(await page.textContent('#pilBackupBanner'), /마지막 백업: 아직 없음/);
  await ctx.close();
});

test('백업 받기: 날짜가 붙은 JSON 이 내려받아지고 알림이 사라지며 시각이 기록된다', async () => {
  const { ctx, page } = await open({ seed: data() });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#pilBackupBanner [data-pil="backup"]')]);
  assert.match(dl.suggestedFilename(), /^pen_ink_lab_backup_\d{4}-\d{2}-\d{2}\.json$/);
  const saved = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  assert.equal(saved.pens.length, F.pens.length); assert.equal(saved.inks.length, F.inks.length);
  await page.waitForFunction(() => !document.getElementById('pilBackupBanner'));
  assert.ok(Number(await page.evaluate(() => localStorage.getItem('pil_last_backup'))) > Date.now() - 5000);
  assert.match(await page.textContent('#backupInfo'), /마지막 백업: 오늘/);
  await ctx.close();
});

test('백업 → 다른 기기(새 브라우저)에서 복원하면 같은 데이터가 된다', async () => {
  const a = await open({ seed: { ...data(), history: [{ id: 'h1', penId: 'p4', inkId: 'i2', type: '잉입', when: '2026-01-05', rating: '좋음' }], testReviews: [{ id: 't1', penId: 'p1', inkId: 'i12', date: '2026-01-02', rating: '4', evidence: 'hands-on' }] } });
  await a.page.evaluate(() => openTab('backup'));
  const [dl] = await Promise.all([a.page.waitForEvent('download'), a.page.click('#downloadJson')]);
  const file = path.join(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pil-')), 'backup.json'); await dl.saveAs(file); const original = await a.page.evaluate(() => JSON.stringify(db)); await a.ctx.close();
  const b = await open();   // 빈 새 브라우저
  assert.equal(await b.page.evaluate(() => db.pens.length + db.inks.length), 0);
  await b.page.evaluate(() => openTab('backup'));
  await b.page.setInputFiles('#restore', file);
  await b.page.waitForFunction(() => db.pens.length > 0);
  const restored = await b.page.evaluate(() => db);
  assert.deepEqual(restored.pens.map(p => p.id), F.pens.map(p => p.id));
  assert.deepEqual(restored.inks.map(i => i.id), F.inks.map(i => i.id));
  assert.equal(restored.history.length, 1); assert.equal(restored.testReviews.length, 1);
  assert.deepEqual(JSON.parse(original).history, restored.history);
  assert.equal(await b.page.evaluate(k => JSON.parse(localStorage.getItem(k)).pens.length, KEY), F.pens.length, '복원 내용이 이 기기에 저장됨');
  await b.ctx.close();
});

test('"나중에"를 누르면 3일간 숨고, 새로고침해도 유지된다', async () => {
  const { ctx, page } = await open({ seed: data() });
  await page.click('#pilBackupBanner [data-pil="snooze"]');
  assert.equal(await page.locator('#pilBackupBanner').count(), 0);
  await page.reload(); await page.waitForFunction(() => typeof save === 'function');
  assert.equal(await page.locator('#pilBackupBanner').count(), 0);
  const until = Number(await page.evaluate(() => localStorage.getItem('pil_backup_snooze')));
  assert.ok(until > Date.now() + 2.9 * DAY && until < Date.now() + 3.1 * DAY);
  await ctx.close();
});

test('백업 주기: 14일 이내면 조용하고, 지나면 다시 알린다', async () => {
  const recent = await open({ seed: data(), kv: { pil_last_backup: Date.now() - 10 * DAY } });
  assert.equal(await recent.page.locator('#pilBackupBanner').count(), 0); await recent.ctx.close();
  const old = await open({ seed: data(), kv: { pil_last_backup: Date.now() - 15 * DAY } });
  assert.equal(await old.page.locator('#pilBackupBanner').count(), 1);
  assert.match(await old.page.textContent('#pilBackupBanner'), /15일 전/); await old.ctx.close();
});

test('iPhone Safari(홈 화면 앱 아님)에서는 "먼저 홈 화면에 추가" 안내가 뜬다', async () => {
  const { ctx, page } = await open({ ua: IPHONE });
  assert.equal(await page.locator('#pilIosBanner').count(), 1);
  assert.match(await page.textContent('#pilIosBanner'), /따로/);
  assert.equal(await page.locator('#pilIosBanner [data-pil="backup"]').count(), 0, '데이터가 없으면 백업 버튼 없음');
  await page.click('#pilIosBanner [data-pil="ios-off"]');
  assert.equal(await page.locator('#pilIosBanner').count(), 0);
  await page.reload(); await page.waitForFunction(() => typeof save === 'function');
  assert.equal(await page.locator('#pilIosBanner').count(), 0, '다시 열어도 숨김 유지');
  await ctx.close();
});

test('iPhone 에서 이미 데이터가 있으면 백업 후 복원하라고 안내한다', async () => {
  const { ctx, page } = await open({ ua: IPHONE, seed: data() });
  assert.match(await page.textContent('#pilIosBanner'), /먼저 <b>백업|먼저 백업/);
  assert.equal(await page.locator('#pilIosBanner [data-pil="backup"]').count(), 1);
  await ctx.close();
});

test('홈 화면 앱(standalone)으로 열면 iPhone 안내가 없다', async () => {
  const { ctx, page } = await open({ ua: IPHONE, init: () => { Object.defineProperty(navigator, 'standalone', { value: true, configurable: true }); } });
  assert.equal(await page.locator('#pilIosBanner').count(), 0);
  await ctx.close();
});

test('데스크톱에는 iPhone 안내가 없다', async () => {
  const { ctx, page } = await open();
  assert.equal(await page.locator('#pilIosBanner').count(), 0);
  await ctx.close();
});

test('Android·Chrome: 설치 가능 이벤트가 오면 "앱으로 설치" 버튼을 보여 준다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = () => { window.__prompted = true; }; e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  });
  assert.equal(await page.locator('#pilInstallBanner').count(), 1);
  await page.click('#pilInstallBanner [data-pil="install"]');
  assert.equal(await page.evaluate(() => window.__prompted), true);
  await ctx.close();
});

test('데이터가 생기면 영구 저장을 요청하고 결과를 백업 화면에 보여 준다', async () => {
  const { ctx, page } = await open({ init: () => {
    window.__persistCalls = 0;
    Object.defineProperty(navigator, 'storage', { value: { persist: () => { window.__persistCalls++; return Promise.resolve(true); }, persisted: () => Promise.resolve(window.__persistCalls > 0) }, configurable: true });
  } });
  assert.equal(await page.evaluate(() => window.__persistCalls), 0, '데이터가 없을 땐 요청하지 않음');
  await page.evaluate(() => { PIL.ensureInk(INK_CATALOG[0]); save(); refresh(); });
  await page.waitForFunction(() => window.__persistCalls === 1);
  await page.evaluate(() => refresh());
  assert.equal(await page.evaluate(() => window.__persistCalls), 1, '한 번만 요청');
  await page.waitForFunction(() => /영구 저장: 허용됨/.test(document.getElementById('backupInfo').textContent));
  await ctx.close();
});

test('저장 공간이 거의 차면(한도의 70% 초과) 경고한다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { db.inks = [{ id: 'big', brand: 'x', name: 'x'.repeat(3.9 * 1024 * 1024) }]; PIL.onRefresh(); });
  assert.equal(await page.locator('#pilQuotaBanner').count(), 1);
  assert.match(await page.textContent('#pilQuotaBanner'), /저장 공간이 거의 찼어요/);
  await ctx.close();
});

test('외부 서버에 접속하지 않는다 (파일 외 요청 없음, 서버 호출 코드 없음)', async () => {
  const { ctx, page, requests } = await open({ seed: data() });
  await page.evaluate(() => { openTab('inks'); openTab('pens'); openTab('backup'); });
  assert.deepEqual(requests.filter(u => !/^(file|data|about|blob):/.test(u)), []);
  assert.equal(await page.evaluate(() => typeof google), 'undefined');
  await ctx.close();
});
