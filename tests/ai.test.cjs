// AI 앱 사용 기능 테스트: 사진으로 등록(만년필·잉크), 시필 사진 초안. 서버·API 없이 복사·붙여넣기로 동작한다.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const BUILD = path.resolve(__dirname, '../site/index.html');
let browser;
before(async () => {
  const root = path.resolve(__dirname, '..');
  const built = fs.statSync(BUILD).mtimeMs;
  const newest = [...fs.readdirSync(root + '/src/parts').map(f => root + '/src/parts/' + f), root + '/src/manifest.json'].reduce((m, f) => Math.max(m, fs.statSync(f).mtimeMs), 0);
  if (newest > built) throw new Error('site/index.html 이 소스보다 오래됐습니다. npm run build 후 다시 실행하세요.');
  browser = await chromium.launch();
});
after(async () => { if (browser) await browser.close(); });

async function open(seed = F.base) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 } });
  const page = await ctx.newPage(); const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('request', r => requests.push(r.url())); page.on('dialog', d => d.accept());
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__clip = t; return Promise.resolve(); }, readText: () => Promise.resolve(window.__paste || '') }, configurable: true }); });
  await page.goto('file://' + BUILD);
  await page.waitForFunction(() => typeof PIL !== 'undefined' && typeof save === 'function');
  await page.evaluate(s => { db.pens = s.pens; db.inks = s.inks; db.history = []; db.testReviews = []; refresh(); }, seed);
  return { ctx, page, errors, requests };
}
const fence = o => '```json\n' + JSON.stringify(o, null, 2) + '\n```';
const INK = { type: 'ink', brand: 'Pilot', name: 'Iroshizuku Ama-iro', family: '블루 & 터콰이즈', hue: '하늘색', value: '높음', saturation: '중간', effect: 'Standard', flow: '미확인', package: 'bottle', capacityMl: 50, confidence: 'high', note: '라벨 글자가 선명함' };
const PEN = { type: 'pen', brand: 'Pilot', name: 'Custom 823 Amber', nib: 'fm', confidence: 'medium', note: '닙 각인 FM' };
const msg = (page, root) => page.textContent(`#${root} [data-ai=msg]`);
async function answer(page, root, text) {
  await page.evaluate(({ root, text }) => { const c = document.getElementById(root); c.open = true; c.querySelector('[data-ai=answer]').value = text; }, { root, text });
  await page.click(`#${root} [data-ai=fill]`);
}

test('사진 등록 카드가 보이고, 특정 AI 앱에 묶이지 않는 안내와 개인정보 문구가 있다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('inks'));
  for (const id of ['aiCard_ink', 'aiCard_pen']) {
    const text = await page.evaluate(id => document.getElementById(id).textContent, id);
    assert.match(text, /ChatGPT·Claude·Gemini/); assert.match(text, /내가 고른 AI 앱으로만/); assert.match(text, /사진을 보거나 저장하지 않아요/);
    assert.ok(!/Claude 앱 프로젝트|공유 → Claude|Claude 지침/.test(text), '특정 앱 전용 안내가 남아 있음');
    assert.equal(await page.evaluate(id => getComputedStyle(document.getElementById(id)).display !== 'none', id), true, id + ' 표시');
  }
  await ctx.close();
});

test('지침 복사: 사진 판독 지침에 내 브랜드 목록·선택지가 들어간다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { openTab('inks'); document.getElementById('aiCard_ink').open = true; });
  await page.click('#aiCard_ink [data-ai=copy]');
  await page.waitForFunction(() => !!window.__clip);
  const clip = await page.evaluate(() => window.__clip);
  assert.match(clip, /만년필·잉크 제품 사진 판독 도우미/); assert.match(clip, /\{"type":"pen"/); assert.match(clip, /\{"type":"ink"/);
  assert.match(clip, /블루 & 터콰이즈/, '색 계열 선택지'); assert.match(clip, /Shimmer/, '특성 선택지'); assert.match(clip, /기존 브랜드\(잉크\): .*Diamine/, '내 브랜드'); assert.match(clip, /기존 브랜드\(만년필\): .*Lamy/);
  assert.match(clip, /추측으로 채우지/, '추측 금지 규칙');
  assert.match(await msg(page, 'aiCard_ink'), /쓰는 AI 앱에 사진과 함께/);
  await ctx.close();
});

test('잉크 답변(코드블록)을 붙여넣으면 폼이 채워지고, 등록해야만 저장된다', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => openTab('inks'));
  const before = await page.evaluate(() => db.inks.length);
  await answer(page, 'aiCard_ink', fence(INK));
  assert.match(await msg(page, 'aiCard_ink'), /잉크 정보를 폼에 채웠어요/);
  const f = await page.evaluate(() => ['iBrand', 'iName', 'iFamily', 'iEffect', 'iPackage', 'iCapacity'].map(id => document.getElementById(id).value));
  assert.deepEqual(f, ['Pilot', 'Iroshizuku Ama-iro', '블루 & 터콰이즈', 'Standard', 'bottle', '50']);
  assert.equal(await page.evaluate(() => db.inks.length), before, '등록 전에는 저장되지 않음');
  await page.click('#addInk');
  const ink = await page.evaluate(() => db.inks.find(i => i.name === 'Iroshizuku Ama-iro'));
  assert.ok(ink, '등록됨');
  assert.equal(ink.hue, '하늘색'); assert.equal(ink.value, '높음'); assert.equal(ink.saturation, '중간'); assert.equal(ink.capacityMl, 50);
  assert.match(ink.notes, /AI 판독 high/); assert.match(ink.notes, /라벨 글자가 선명함/);
  assert.deepEqual(errors, []); await ctx.close();
});

test('AI 가 잡담을 섞거나 코드블록 없이 답해도 읽는다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('inks'));
  await answer(page, 'aiCard_ink', '네, 사진을 확인했어요! 결과입니다:\n' + JSON.stringify(INK) + '\n더 필요하면 말씀해 주세요 :)');
  assert.match(await msg(page, 'aiCard_ink'), /채웠어요/);
  assert.equal(await page.inputValue('#iName'), 'Iroshizuku Ama-iro');
  await ctx.close();
});

test('만년필 답변: 닙은 목록에 있으면 선택하고, 없으면 "기타"+메모로 남긴다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('pens'));
  await answer(page, 'aiCard_pen', fence(PEN));
  assert.match(await msg(page, 'aiCard_pen'), /만년필 정보를 폼에 채웠어요/);
  assert.deepEqual(await page.evaluate(() => ['pBrand', 'pName', 'pNib'].map(id => document.getElementById(id).value)), ['Pilot', 'Custom 823 Amber', 'FM']);
  await answer(page, 'aiCard_pen', fence({ ...PEN, name: 'Zoom 742', nib: 'Zoom' }));
  assert.equal(await page.inputValue('#pNib'), '기타'); assert.match(await page.inputValue('#pNotes'), /닙: Zoom/);
  await page.click('#addPen');
  assert.ok(await page.evaluate(() => db.pens.some(p => p.name === 'Zoom 742' && /AI 판독 medium/.test(p.notes))));
  await ctx.close();
});

test('잘못된 답변은 이유를 알려 주고 폼을 건드리지 않는다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('inks'));
  const cases = [['그냥 글만 있는 답변입니다', /JSON을 찾지 못했어요/], ['{ "type": "ink", "brand": "A", }', /JSON 형식이 올바르지 않아요/], [JSON.stringify({ type: 'tool', brand: 'A', name: 'B' }), /type이 pen 또는 ink가 아니에요/], [JSON.stringify({ type: 'ink', brand: '', name: '' }), /브랜드나 이름을 읽지 못했어요/]];
  for (const [text, re] of cases) {
    await answer(page, 'aiCard_ink', text);
    assert.match(await msg(page, 'aiCard_ink'), re, text);
    assert.equal(await page.inputValue('#iBrand'), '', '폼이 채워지지 않음');
  }
  await ctx.close();
});

test('이미 등록된 제품이면 알려 준다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => openTab('inks'));
  await answer(page, 'aiCard_ink', fence({ ...INK, brand: 'Diamine', name: 'Marine' }));
  assert.match(await msg(page, 'aiCard_ink'), /이미 등록된 제품/);
  await ctx.close();
});

test('상자에 붙여 넣으면(paste) 자동으로 읽는다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { openTab('inks'); document.getElementById('aiCard_ink').open = true; });
  await page.evaluate(text => { const ta = document.querySelector('#aiCard_ink [data-ai=answer]'); ta.value = text; ta.dispatchEvent(new Event('paste')); }, fence(INK));
  await page.waitForFunction(() => /채웠어요/.test(document.querySelector('#aiCard_ink [data-ai=msg]').textContent));
  await ctx.close();
});

test('클립보드에서 붙여넣기 버튼이 동작한다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(text => { window.__paste = text; openTab('inks'); document.getElementById('aiCard_ink').open = true; }, fence(INK));
  await page.click('#aiCard_ink [data-ai=paste]');
  await page.waitForFunction(() => /채웠어요/.test(document.querySelector('#aiCard_ink [data-ai=msg]').textContent));
  assert.equal(await page.inputValue('#iName'), 'Iroshizuku Ama-iro');
  await ctx.close();
});

// ───────── 시필 사진 ─────────
const SAMPLE = { sheen: '뚜렷', sheenColor: '붉은빛', shading: '중간', feather: '약간', bleed: '없음', width: '굵다', shimmer: '없음', color: '짙은 블루블랙', observations: '획 끝에 붉은 광택이 보임. 종이 뒷면 비침은 없음.', confidence: '중간', caution: '' };
async function testTab(page) { await page.evaluate(() => { openTab('testing'); updateTestSelects(); $('tPen').value = 'p2'; $('tInk').value = 'i7'; $('tPaper').value = 'Rhodia'; }); }

test('시필 카드: 지침에 고른 만년필·잉크·종이가 들어가고 추정 금지 규칙이 있다', async () => {
  const { ctx, page } = await open();
  await testTab(page);
  await page.click('#aiCard_test summary'); await page.click('#aiCard_test [data-ai=copy]');
  await page.waitForFunction(() => !!window.__clip);
  const clip = await page.evaluate(() => window.__clip);
  assert.match(clip, /만년필: Pilot Custom 74/); assert.match(clip, /닙: M/); assert.match(clip, /잉크: Pilot Iroshizuku Kon-peki/); assert.match(clip, /종이: Rhodia/);
  assert.match(clip, /흐름, 필기 부드러움, 건조 시간은 사진으로 알 수 없으므로 절대 추정하지 마/); assert.match(clip, /판단불가/);
  for (const k of ['sheen', 'shading', 'feather', 'width', 'shimmer', 'confidence']) assert.ok(clip.includes('"' + k + '"'), k);
  assert.match(await msg(page, 'aiCard_test'), /시필 사진과 함께/);
  await ctx.close();
});

test('시필 초안: 비어 있는 칸만 채우고, 직접 입력한 값은 덮어쓰지 않는다', async () => {
  const { ctx, page, errors } = await open();
  await testTab(page);
  await page.evaluate(() => { $('tShade').value = '강함'; $('tWidth').value = '2'; $('tMemo').value = '내가 쓴 메모'; });
  await answer(page, 'aiCard_test', fence(SAMPLE));
  const v = await page.evaluate(() => ({ sheen: $('tSheen').value, shade: $('tShade').value, feather: $('tFeather').value, width: $('tWidth').value, memo: $('tMemo').value }));
  assert.equal(v.sheen, '뚜렷'); assert.equal(v.feather, '1');
  assert.equal(v.shade, '강함', '직접 입력한 농담은 그대로'); assert.equal(v.width, '2', '직접 입력한 선 굵기는 그대로');
  assert.match(v.memo, /^내가 쓴 메모\n\[AI 초안·신뢰도 중간\] 짙은 블루블랙 · 획 끝에/);
  const m = await msg(page, 'aiCard_test');
  assert.match(m, /채운 칸: 테 뚜렷\(붉은빛\), 번짐 약간/); assert.ok(!/농담|선 굵기/.test(m.split('\n')[0]), '덮어쓰지 않은 칸은 채웠다고 하지 않음');
  assert.match(m, /직접 확인한 뒤/);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#aiCard_test [data-ai=msg]')).whiteSpace), 'pre-line', '줄바꿈이 보이도록');
  assert.deepEqual(errors, []); await ctx.close();
});

test('시필 초안: 판단불가·모르는 값은 무시하고, 같은 초안 메모는 한 번만 붙는다', async () => {
  const { ctx, page } = await open();
  await testTab(page);
  await answer(page, 'aiCard_test', fence({ ...SAMPLE, sheen: '판단불가', shading: '판단불가', feather: '많이많이', width: '엄청굵다' }));
  const v = await page.evaluate(() => ({ s: $('tSheen').value, d: $('tShade').value, f: $('tFeather').value, w: $('tWidth').value }));
  assert.deepEqual(v, { s: '', d: '', f: '', w: '' });
  assert.match(await msg(page, 'aiCard_test'), /사진으로 판단할 수 있는 항목이 없었어요/);
  await answer(page, 'aiCard_test', fence(SAMPLE)); await answer(page, 'aiCard_test', fence(SAMPLE));
  assert.equal((await page.inputValue('#tMemo')).split('[AI 초안').length - 1, 1, '초안 메모 중복 없음');
  await ctx.close();
});

test('시필 초안: 펄·주의 문구를 알려 주고, 잘못된 답변은 거절한다', async () => {
  const { ctx, page } = await open();
  await testTab(page);
  await answer(page, 'aiCard_test', fence({ ...SAMPLE, shimmer: '있음', caution: '조명이 노랗고 사진이 약간 흐림' }));
  const m = await msg(page, 'aiCard_test');
  assert.match(m, /펄이 보인다고 판독/); assert.match(m, /참고: 조명이 노랗고/);
  for (const [text, re] of [['판독 결과 없음', /JSON을 찾지 못했어요/], ['{"type":"ink","brand":"A","name":"B"}', /시필 판독 답변 형식이 아니에요/], ['{ "sheen": "뚜렷", }', /JSON 형식이 올바르지 않아요/]]) {
    await answer(page, 'aiCard_test', text); assert.match(await msg(page, 'aiCard_test'), re, text);
  }
  await ctx.close();
});

test('시필 초안을 채운 뒤 저장하면 기록에 들어가고 서버·사진 업로드 UI 는 보이지 않는다', async () => {
  const { ctx, page } = await open();
  await testTab(page);
  await page.evaluate(() => { $('tEvidence').value = 'hands-on'; $('tRating').value = '4'; $('tDate').value = '2026-03-02'; });
  await answer(page, 'aiCard_test', fence(SAMPLE));
  await page.evaluate(() => $('tSave').click());
  const r = await page.evaluate(() => db.testReviews[0]);
  assert.equal(r.feather, 1); assert.equal(r.width, 4); assert.equal(r.sheen, '뚜렷'); assert.equal(r.shading, '중간');
  assert.match(r.memo, /\[AI 초안·신뢰도 중간\]/);
  const hidden = await page.evaluate(() => ['tAiBtn', 'tPhotos'].every(id => { const e = document.getElementById(id); return !e || getComputedStyle(e).display === 'none'; }) && [...document.querySelectorAll('.tx-file')].every(e => getComputedStyle(e).display === 'none'));
  assert.equal(hidden, true);
  await ctx.close();
});

test('AI 기능은 외부 서버에 접속하지 않고, 사진 데이터를 다루지 않는다', async () => {
  const { ctx, page, requests } = await open();
  await page.evaluate(() => { openTab('inks'); document.getElementById('aiCard_ink').open = true; });
  await page.click('#aiCard_ink [data-ai=copy]'); await answer(page, 'aiCard_ink', fence(INK));
  assert.deepEqual(requests.filter(u => !/^(file|data|blob|about):/.test(u)), []);
  assert.equal(await page.evaluate(() => document.querySelectorAll('#aiCard_ink input[type=file], #aiCard_pen input[type=file], #aiCard_test input[type=file]').length), 0, '이 앱에는 사진 업로드 입력이 없다');
  await ctx.close();
});
