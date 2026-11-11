// 앨범·카메라 사진: 기기 안 저장(IndexedDB), 카드 표시, 정리, 사진 포함 백업(.zip)·복원
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const BUILD = path.resolve(__dirname, '../site/index.html');
let browser, FIX;
before(async () => {
  const root = path.resolve(__dirname, '..');
  const built = fs.statSync(BUILD).mtimeMs;
  const newest = [...fs.readdirSync(root + '/src/parts').map(f => root + '/src/parts/' + f), root + '/src/manifest.json'].reduce((m, f) => Math.max(m, fs.statSync(f).mtimeMs), 0);
  if (newest > built) throw new Error('site/index.html 이 소스보다 오래됐습니다. npm run build 후 다시 실행하세요.');
  FIX = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-ph-'));
  execFileSync('python3', ['-I', path.join(__dirname, 'make_photos.py'), FIX]);
  browser = await chromium.launch();
});
after(async () => { if (browser) await browser.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage(); const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url()));
  page.on('dialog', d => d.accept());
  await page.goto('file://' + BUILD);
  await page.waitForFunction(() => typeof PIL !== 'undefined' && typeof save === 'function');
  await page.evaluate(s => { db.pens = JSON.parse(JSON.stringify(s.pens)); db.inks = JSON.parse(JSON.stringify(s.inks)); db.history = []; db.testReviews = []; refresh(); }, F.base);
  return { ctx, page, errors, requests };
}
const idbCount = page => page.evaluate(() => new Promise(res => {
  const r = indexedDB.open('pil-photos'); r.onsuccess = () => { const d = r.result; const t = d.transaction(['thumbs', 'full']); const a = t.objectStore('thumbs').count(), b = t.objectStore('full').count(); t.oncomplete = () => { d.close(); res([a.result, b.result]); }; }; r.onerror = () => res(null);
}));
async function addInkPhoto(page, inkId, file, kind = 'album') {
  await page.evaluate(() => openTab('inks'));
  await page.click(`[data-inkphoto="${inkId}"]`);
  await page.setInputFiles(`.sheet [data-pick=${kind}], [data-pick=${kind}]`, file);
  await page.waitForFunction(id => (db.inks.find(i => i.id === id) || {}).photo && String(db.inks.find(i => i.id === id).photo).startsWith('local:'), inkId);
}

test('잉크 카드: 앨범 사진을 넣으면 줄어서 저장되고 카드에 보이며 새로고침 후에도 남는다 (EXIF 회전 반영)', async () => {
  const { ctx, page, errors } = await open();
  const ink = F.inks[0].id;
  await addInkPhoto(page, ink, path.join(FIX, 'rot.jpg'));
  await page.waitForSelector(`[data-inkphoto="${ink}"]`);
  assert.equal(await page.locator('.ink-card .ink-photo').count(), 1);
  assert.deepEqual(await idbCount(page), [1, 1]);
  // 원본 3000x2000(세로로 회전되어야 함) → 최대 1280 으로 축소, 회전 반영
  const info = await page.evaluate(async () => {
    const ref = db.inks[0].photo; const b = await PIL.photos.fullBlob(ref);
    const bm = await createImageBitmap(b); return { w: bm.width, h: bm.height, size: b.size, type: b.type };
  });
  assert.equal(info.type, 'image/jpeg'); assert.ok(Math.max(info.w, info.h) <= 1280); assert.ok(info.h > info.w, 'EXIF 회전이 반영된 세로 사진'); assert.ok(info.size < 600 * 1024);
  await page.reload(); await page.waitForFunction(() => typeof PIL !== 'undefined');
  await page.evaluate(() => openTab('inks'));
  await page.waitForSelector('.ink-card .ink-photo');
  assert.equal(await page.evaluate(() => db.inks[0].photo.startsWith('local:')), true);
  assert.deepEqual(errors, []); await ctx.close();
});

test('잉크 카드의 사진 버튼은 상세 창을 열지 않고, 투명 PNG는 흰 배경이 된다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('inks'));
  await page.click(`[data-inkphoto="${F.inks[0].id}"]`);
  assert.ok(await page.locator('.sheet [data-pick=album], [data-pick=album]').count() >= 1);
  await page.setInputFiles('[data-pick=album]', path.join(FIX, 'alpha.png'));
  await page.waitForFunction(() => String(db.inks[0].photo || '').startsWith('local:'));
  const px = await page.evaluate(async () => {
    const b = await PIL.photos.fullBlob(db.inks[0].photo), bm = await createImageBitmap(b);
    const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; const g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const p = g.getImageData(bm.width - 5, 5, 1, 1).data; return [p[0], p[1], p[2]];
  });
  assert.ok(px.every(v => v > 240), '투명 → 흰색: ' + px);
  await ctx.close();
});

test('사진이 아닌 파일은 거절하고 데이터를 바꾸지 않는다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('inks'));
  await page.click(`[data-inkphoto="${F.inks[0].id}"]`);
  await page.setInputFiles('[data-pick=album]', path.join(FIX, 'note.txt'));
  await page.waitForFunction(() => /읽을 수 없|사진 파일이 아니/.test(document.getElementById('pilPhMsg').textContent));
  assert.equal(await page.evaluate(() => db.inks[0].photo), undefined);
  assert.deepEqual(await idbCount(page), [0, 0]);
  await ctx.close();
});

test('만년필 카드: 사진을 넣으면 .local 사진으로 보이고, 바꾸면 이전 사진은 지워진다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('pens'));
  const pen = F.pens[0].id;
  await page.click(`[data-penphoto="${pen}"]`);
  await page.setInputFiles('[data-pick=album]', path.join(FIX, 'rot.jpg'));
  await page.waitForFunction(id => String((db.pens.find(p => p.id === id) || {}).photo || '').startsWith('local:'), pen);
  await page.waitForSelector('.pen-card img.pen-photo.local');
  const first = await page.evaluate(id => db.pens.find(p => p.id === id).photo, pen);
  await page.click(`[data-penphoto="${pen}"]`);
  await page.setInputFiles('[data-pick=camera]', path.join(FIX, 'alpha.png'));
  await page.waitForFunction(({ id, first }) => { const p = db.pens.find(p => p.id === id).photo; return p !== first && String(p).startsWith('local:'); }, { id: pen, first });
  assert.deepEqual(await idbCount(page), [1, 1], '이전 사진 삭제');
  await ctx.close();
});

test('사진 지우기 · 항목 삭제 · 초기화하면 저장된 사진도 정리된다', async () => {
  const { ctx, page } = await open();
  await addInkPhoto(page, F.inks[0].id, path.join(FIX, 'rot.jpg'));
  await addInkPhoto(page, F.inks[1].id, path.join(FIX, 'alpha.png'));
  assert.deepEqual(await idbCount(page), [2, 2]);
  await page.click(`[data-inkphoto="${F.inks[0].id}"]`); await page.click('[data-ph=remove]');
  await page.waitForFunction(() => db.inks[0].photo === undefined);
  assert.deepEqual(await idbCount(page), [1, 1]);
  await page.click(`[data-deleteink="${F.inks[1].id}"]`);
  await page.waitForFunction(() => db.inks.length === 1 || !db.inks.find(i => i.photo));
  await page.waitForTimeout(200);
  assert.deepEqual(await idbCount(page), [0, 0]);
  await addInkPhoto(page, F.inks[0].id, path.join(FIX, 'rot.jpg'));
  await page.evaluate(() => openTab('backup')); await page.click('#reset');
  await page.waitForFunction(() => db.inks.length === 0 || !db.inks.some(i => i.photo));
  await page.waitForTimeout(200);
  assert.deepEqual(await idbCount(page), [0, 0]);
  await ctx.close();
});

test('사진이 없으면 백업은 예전과 같은 .json, 있으면 .zip(data.json + photos/)', async () => {
  const a = await open();
  await a.page.evaluate(() => openTab('backup'));
  let [dl] = await Promise.all([a.page.waitForEvent('download'), a.page.click('#downloadJson')]);
  assert.match(dl.suggestedFilename(), /^pen_ink_lab_backup_\d{4}-\d\d-\d\d\.json$/);
  await addInkPhoto(a.page, F.inks[0].id, path.join(FIX, 'rot.jpg'));
  await a.page.evaluate(() => openTab('backup'));
  [dl] = await Promise.all([a.page.waitForEvent('download'), a.page.click('#downloadJson')]);
  assert.match(dl.suggestedFilename(), /\.zip$/);
  const zf = path.join(FIX, 'b.zip'); await dl.saveAs(zf);
  const listing = execFileSync('python3', ['-I', '-c', 'import zipfile,sys,json;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(json.dumps(sorted(z.namelist())))', zf]).toString();
  const names = JSON.parse(listing);
  assert.equal(names.length, 3); assert.ok(names.includes('data.json'));
  assert.ok(names.some(n => /^photos\/[\w-]+\.jpg$/.test(n)) && names.some(n => /^photos\/[\w-]+\.t\.jpg$/.test(n)));
  await a.ctx.close();
});

test('사진 포함 백업(.zip)을 새 브라우저에 복원하면 사진까지 돌아온다', async () => {
  const a = await open();
  await addInkPhoto(a.page, F.inks[0].id, path.join(FIX, 'rot.jpg'));
  await a.page.evaluate(() => openTab('backup'));
  const [dl] = await Promise.all([a.page.waitForEvent('download'), a.page.click('#downloadJson')]);
  const zf = path.join(FIX, 'c.zip'); await dl.saveAs(zf);
  const origRef = await a.page.evaluate(() => db.inks[0].photo); await a.ctx.close();
  const b = await open(); await b.page.evaluate(() => { db.inks = []; db.pens = []; refresh(); openTab('backup'); });
  await b.page.setInputFiles('#restore', zf);
  await b.page.waitForFunction(() => db.inks.length > 0);
  assert.equal(await b.page.evaluate(() => db.inks[0].photo), origRef);
  await b.page.evaluate(() => openTab('inks')); await b.page.waitForSelector('.ink-card .ink-photo');
  assert.deepEqual(await idbCount(b.page), [1, 1]);
  await b.page.reload(); await b.page.waitForFunction(() => typeof PIL !== 'undefined'); await b.page.evaluate(() => openTab('inks'));
  await b.page.waitForSelector('.ink-card .ink-photo');
  await b.ctx.close();
});

test('압축(deflate)된 zip 도 복원되고, 손상·위험한 zip 은 거절된다', async () => {
  const a = await open();
  await addInkPhoto(a.page, F.inks[0].id, path.join(FIX, 'rot.jpg'));
  await a.page.evaluate(() => openTab('backup'));
  const [dl] = await Promise.all([a.page.waitForEvent('download'), a.page.click('#downloadJson')]);
  const zf = path.join(FIX, 'd.zip'); await dl.saveAs(zf); await a.ctx.close();
  // 다른 도구(파이썬)가 deflate 로 다시 묶은 zip, 그리고 이상한 이름이 섞인 zip
  const z2 = path.join(FIX, 'e.zip'), z3 = path.join(FIX, 'f.zip'), z4 = path.join(FIX, 'g.zip');
  execFileSync('python3', ['-I', '-c', `
import zipfile,sys
src=zipfile.ZipFile(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as o:
    for n in src.namelist(): o.writestr(n,src.read(n))
with zipfile.ZipFile(sys.argv[3],'w',zipfile.ZIP_DEFLATED) as o:
    for n in src.namelist(): o.writestr(n,src.read(n))
    o.writestr('../evil.txt','x'); o.writestr('photos/../../x.jpg','x')
d=open(sys.argv[1],'rb').read(); open(sys.argv[4],'wb').write(d[:len(d)//2])
`, zf, z2, z3, z4]);
  const b = await open(); const dialogs = [];
  b.page.removeAllListeners('dialog'); b.page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
  await b.page.evaluate(() => { db.inks = []; db.pens = []; refresh(); openTab('backup'); });
  await b.page.setInputFiles('#restore', z2);
  await b.page.waitForFunction(() => db.inks.length > 0);
  assert.deepEqual(await idbCount(b.page), [1, 1]);
  // 이상한 이름은 무시하고 정상 항목만
  await b.page.evaluate(() => { db.inks = []; refresh(); });
  await b.page.setInputFiles('#restore', z3);
  await b.page.waitForFunction(() => db.inks.length > 0);
  assert.deepEqual(await idbCount(b.page), [1, 1]);
  // 손상된 zip: 데이터 그대로
  const before = await b.page.evaluate(() => JSON.stringify(db));
  dialogs.length = 0;
  await b.page.setInputFiles('#restore', z4);
  await b.page.waitForTimeout(600);
  assert.equal(await b.page.evaluate(() => JSON.stringify(db)), before);
  assert.ok(dialogs.length >= 1 && dialogs.every(m => !/복원 완료/.test(m)), dialogs.join('|'));
  await b.ctx.close();
});

test('저장소를 쓸 수 없으면(사생활 보호 모드 등) 안내만 하고 앱은 멀쩡하다', async () => {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 } });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); });
  await page.goto('file://' + BUILD);
  await page.waitForFunction(() => typeof PIL !== 'undefined' && typeof save === 'function');
  await page.evaluate(s => { db.pens = s.pens; db.inks = s.inks; refresh(); openTab('inks'); }, F.base);
  await page.click(`[data-inkphoto="${F.inks[0].id}"]`);
  await page.setInputFiles('[data-pick=album]', path.join(FIX, 'rot.jpg'));
  await page.waitForFunction(() => /저장할 수 없/.test(document.getElementById('pilPhMsg').textContent));
  assert.equal(await page.evaluate(() => db.inks[0].photo), undefined);
  assert.deepEqual(errors, []); await ctx.close();
});

test('사진 기능은 외부 서버에 접속하지 않는다', async () => {
  const { ctx, page, requests } = await open();
  await addInkPhoto(page, F.inks[0].id, path.join(FIX, 'rot.jpg'));
  await page.evaluate(() => openTab('backup'));
  await Promise.all([page.waitForEvent('download'), page.click('#downloadJson')]);
  assert.deepEqual(requests.filter(u => !/^(file|blob|data):/.test(u)), []);
  await ctx.close();
});
