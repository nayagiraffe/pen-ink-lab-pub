// 내보내기 테스트: 엑셀(.xlsx)을 openpyxl·LibreOffice 로 실제 열어 검증하고, 인쇄 화면을 확인한다
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const BUILD = path.resolve(__dirname, '../site/index.html');
const KEY = 'pil_pen_ink_lab_v01';
const have = c => spawnSync('sh', ['-c', `command -v ${c}`]).status === 0;
const HAS_PY = (() => { try { execFileSync('python3', ['-c', 'import openpyxl']); return true; } catch (e) { return false; } })();
const HAS_SOFFICE = have('soffice');
let browser, tmp;
before(async () => {
  const root = path.resolve(__dirname, '..');
  const built = fs.statSync(BUILD).mtimeMs;
  const newest = [...fs.readdirSync(root + '/src/parts').map(f => root + '/src/parts/' + f), root + '/src/manifest.json'].reduce((m, f) => Math.max(m, fs.statSync(f).mtimeMs), 0);
  if (newest > built) throw new Error('site/index.html 이 소스보다 오래됐습니다. npm run build 후 다시 실행하세요.');
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-export-'));
  browser = await chromium.launch();
});
after(async () => { if (browser) await browser.close(); });

const NASTY = { id: 'pX', brand: 'A&B <Co> "Q"', name: "Pen 'x' 🖋 한글", nib: 'F', inkBrand: 'Ink & <Sons>', inkName: 'Blue "Night" 🌙', status: '현재 잉입', fillVerified: true, fillDate: '2026-03-01', notes: '줄1\n줄2  끝공백  \u0007제어문자' };
function rich() {
  const inks = [...F.inks, { id: 'iX', brand: 'Ink & <Sons>', name: 'Blue "Night" 🌙', family: '블루 & 터콰이즈', hue: '네이비', effect: 'Sheen', flow: '약간 <건조>', packageType: 'cartridge', capacityMl: 1.5, remainingMl: 0.5, notes: 'a&b' }];
  return {
    pens: [...F.pens, NASTY], inks,
    history: [{ id: 'h1', penId: 'pX', inkId: 'iX', type: '잉입', when: '2026-03-01', rating: '좋음', note: '메모 & <b>', previousInk: 'Old "ink"' }, { id: 'h2', penId: 'gone', inkId: 'i2', type: '세척', when: '2026-02-01' }],
    testReviews: [{ id: 't1', penId: 'pX', inkId: 'iX', date: '2026-03-02', paper: 'Rhodia', flow: '3', width: '2', smooth: '4', feather: '0', rating: '5', evidence: 'hands-on', memo: '번짐 없음 & 좋음' }],
  };
}
async function open(seed) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.addInitScript(({ seed, key }) => { try { if (seed) localStorage.setItem(key, JSON.stringify(seed)); } catch (e) {} }, { seed, key: KEY });
  await page.goto('file://' + BUILD);
  await page.waitForFunction(() => typeof PIL !== 'undefined' && typeof PIL.exportXlsx === 'function');
  return { ctx, page, errors };
}
async function downloadXlsx(page, name) {
  await page.evaluate(() => openTab('backup'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportXlsx')]);
  const file = path.join(tmp, name); await dl.saveAs(file);
  return { file, name: dl.suggestedFilename() };
}
const readXlsx = file => JSON.parse(execFileSync('python3', [path.join(__dirname, 'xlsx_check.py'), file], { encoding: 'utf8' }));
const norm = v => (v === '' || v === undefined ? null : v);
// 엑셀은 XML 에서 허용되지 않는 제어문자를 제거하고 저장하므로 기대값도 같게 맞춘다
const clean = v => typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') : v;

test('엑셀 저장: 파일명·시트 구성·ZIP 무결성(CRC)이 올바르다', { skip: !HAS_PY && 'python3+openpyxl 필요' }, async () => {
  const { ctx, page, errors } = await open(rich());
  const { file, name } = await downloadXlsx(page, 'rich.xlsx');
  assert.match(name, /^pen_ink_lab_\d{4}-\d{2}-\d{2}\.xlsx$/);
  const x = readXlsx(file);
  assert.equal(x.zipBad, null, 'ZIP 항목 CRC 오류');
  assert.deepEqual(x.order, ['만년필', '잉크', '잉입 기록', '시필 노트']);
  assert.ok(x.names.includes('[Content_Types].xml') && x.names.includes('xl/workbook.xml') && x.names.includes('xl/styles.xml'));
  assert.deepEqual(errors, []); await ctx.close();
});

test('엑셀 저장: 모든 셀 값이 앱 데이터와 같다 (특수문자·이모지·줄바꿈·숫자 포함)', { skip: !HAS_PY && 'python3+openpyxl 필요' }, async () => {
  const { ctx, page } = await open(rich());
  const expected = await page.evaluate(() => PIL.exportTables());
  const { file } = await downloadXlsx(page, 'values.xlsx');
  const x = readXlsx(file);
  for (const sh of expected) {
    const got = x.sheets[sh.name].rows;
    assert.deepEqual(got[0], sh.head, sh.name + ' 머리글');
    assert.equal(got.length, sh.rows.length + 1, sh.name + ' 행 수');
    sh.rows.forEach((r, i) => assert.deepEqual(got[i + 1], r.map(v => norm(clean(v))), `${sh.name} ${i + 2}행`));
  }
  // 직접 확인: 위험한 문자열이 그대로 보존됨
  const pens = x.sheets['만년필'].rows;
  const row = pens.find(r => r[0] === 'A&B <Co> "Q"');
  assert.ok(row, '특수문자 브랜드 행'); assert.equal(row[1], "Pen 'x' 🖋 한글"); assert.equal(row[7], '줄1\n줄2  끝공백  제어문자');
  // 숫자는 숫자 셀로 저장됨
  const ink = x.sheets['잉크'].rows.find(r => r[1] === 'Blue "Night" 🌙');
  assert.equal(ink[6], '카트리지'); assert.strictEqual(ink[7], 1.5); assert.strictEqual(ink[8], 0.5);
  const test = x.sheets['시필 노트'].rows[1];
  assert.deepEqual(test.slice(4, 9), [3, 2, 4, 0, 5]);
  // 삭제된 만년필 참조도 깨지지 않음
  assert.ok(x.sheets['잉입 기록'].rows.some(r => r[2] === '(삭제된 만년필)'));
  await ctx.close();
});

test('엑셀 저장: 머리글 고정·필터·굵은 머리글·열 너비가 적용된다', { skip: !HAS_PY && 'python3+openpyxl 필요' }, async () => {
  const { ctx, page } = await open(rich());
  const { file } = await downloadXlsx(page, 'format.xlsx');
  const s = readXlsx(file).sheets['만년필'];
  assert.equal(s.freeze, 'A2'); assert.match(s.filter, /^A1:H\d+$/); assert.equal(s.headBold, true);
  assert.ok(Object.values(s.widths).every(w => w >= 9 && w <= 48), JSON.stringify(s.widths));
  await ctx.close();
});

test('데이터가 없어도 머리글만 있는 올바른 파일이 만들어진다', { skip: !HAS_PY && 'python3+openpyxl 필요' }, async () => {
  const { ctx, page } = await open();
  const { file } = await downloadXlsx(page, 'empty.xlsx');
  const x = readXlsx(file);
  assert.equal(x.zipBad, null);
  for (const n of x.order) assert.equal(x.sheets[n].rows.length, 1, n + ' 은 머리글 한 줄');
  await ctx.close();
});

test('LibreOffice 로 실제로 열린다 (PDF 변환 + 모든 시트 CSV)', { skip: !HAS_SOFFICE && 'soffice 필요', timeout: 180000 }, async () => {
  const { ctx, page } = await open(rich());
  const { file } = await downloadXlsx(page, 'lo.xlsx'); await ctx.close();
  const out = path.join(tmp, 'lo'); fs.mkdirSync(out, { recursive: true });
  const env = { ...process.env, HOME: tmp, LC_ALL: 'C.UTF-8', LANG: 'C.UTF-8' };  // ASCII 로케일에서는 한글 시트 이름 파일을 만들 수 없다
  execFileSync('soffice', ['--headless', '--norestore', '--convert-to', 'pdf', '--outdir', out, file], { env, timeout: 150000, stdio: 'pipe' });
  assert.ok(fs.statSync(path.join(out, 'lo.pdf')).size > 1000, 'PDF 가 만들어짐');
  execFileSync('soffice', ['--headless', '--norestore', '--convert-to', 'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,false,false,false,-1', '--outdir', out, file], { env, timeout: 150000, stdio: 'pipe' });
  const csvs = fs.readdirSync(out).filter(f => f.endsWith('.csv'));
  assert.ok(csvs.length >= 4, 'CSV 시트 수: ' + csvs.join());
  const pens = fs.readFileSync(path.join(out, csvs.find(f => f.includes('만년필'))), 'utf8');
  assert.match(pens, /브랜드,모델,닙/); assert.match(pens, /Lamy,Safari,F/); assert.match(pens, /Pen 'x' 🖋 한글/);
});

test('인쇄: 선택한 항목만 표로 만들고 인쇄 후 정리한다', async () => {
  const { ctx, page } = await open(rich());
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; window.__html = document.getElementById('pilPrint').innerHTML; window.__cls = document.body.classList.contains('pil-printing'); }; openTab('backup'); });
  await page.click('#printSheetBtn');
  assert.equal(await page.evaluate(() => window.__printed), 1);
  assert.equal(await page.evaluate(() => window.__cls), true, '인쇄 중에는 인쇄용 화면만 표시');
  const html = await page.evaluate(() => window.__html);
  assert.match(html, /<h2>만년필 <small>\d+/); assert.match(html, /<h2>잉크 <small>\d+/);
  assert.ok(!/<h2>잉입 기록/.test(html) && !/<h2>시필 노트/.test(html), '체크 안 한 항목은 제외');
  assert.match(html, /A&amp;B &lt;Co&gt; "Q"/, '특수문자는 이스케이프됨');
  assert.ok(!/<Co>/.test(html), '태그가 그대로 들어가지 않음');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  assert.equal(await page.evaluate(() => document.body.classList.contains('pil-printing')), false);
  assert.equal(await page.evaluate(() => document.getElementById('pilPrint').innerHTML), '');
  await ctx.close();
});

test('인쇄: 기록·시필 노트를 체크하면 함께 인쇄된다', async () => {
  const { ctx, page } = await open(rich());
  await page.evaluate(() => { window.print = () => { window.__html = document.getElementById('pilPrint').innerHTML; }; openTab('backup'); });
  await page.check('[data-print="history"]'); await page.check('[data-print="tests"]');
  await page.click('#printSheetBtn');
  const html = await page.evaluate(() => window.__html);
  assert.match(html, /<h2>잉입 기록/); assert.match(html, /<h2>시필 노트/); assert.match(html, /Rhodia/);
  await ctx.close();
});

test('인쇄 화면(print 미디어)에서는 앱 화면이 숨겨지고 표만 보인다 + PDF 가 만들어진다', async () => {
  const { ctx, page } = await open(rich());
  await page.evaluate(() => { window.print = () => {}; openTab('backup'); });
  await page.click('#printSheetBtn');
  await page.emulateMedia({ media: 'print' });
  const vis = await page.evaluate(() => ({ app: getComputedStyle(document.querySelector('.app')).display, print: getComputedStyle(document.getElementById('pilPrint')).display }));
  assert.deepEqual(vis, { app: 'none', print: 'block' });
  // 표가 실제로 보이는지(앱의 section{display:none} 규칙에 가려지지 않는지)
  const tbl = await page.evaluate(() => { const e = document.querySelector('#pilPrint table'); return e ? { display: getComputedStyle(e).display, h: e.getBoundingClientRect().height } : null; });
  assert.ok(tbl && tbl.display === 'table' && tbl.h > 50, '인쇄 표가 보이지 않음: ' + JSON.stringify(tbl));
  const pdf = await page.pdf({ format: 'A4' });
  assert.ok(pdf.length > 3000 && pdf.slice(0, 4).toString() === '%PDF');
  if (have('pdftotext')) {   // PDF 안의 글자까지 확인
    const f = path.join(tmp, 'print.pdf'); fs.writeFileSync(f, pdf);
    const txt = execFileSync('pdftotext', [f, '-'], { encoding: 'utf8' }).replace(/\s+/g, ' ');
    assert.match(txt, /만년필/); assert.match(txt, /Lamy/); assert.match(txt, /Safari/); assert.match(txt, /Pen & Ink Lab/);
    assert.match(txt, /Iroshizuku/, '잉크 표도 인쇄됨');
    assert.ok(!/Standar d/.test(txt), '단어가 중간에서 끊기지 않음');
  }
  await ctx.close();
});

test('화면에서는 인쇄 영역이 보이지 않고, 인쇄 전에는 비어 있다', async () => {
  const { ctx, page } = await open(rich());
  assert.equal(await page.evaluate(() => { const e = document.getElementById('pilPrint'); return !e || getComputedStyle(e).display === 'none'; }), true);
  await page.evaluate(() => { window.print = () => {}; openTab('backup'); });
  await page.click('#printSheetBtn');
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('pilPrint')).display), 'none', '화면 미디어에서는 인쇄 영역이 숨겨진 채');
  await ctx.close();
});
