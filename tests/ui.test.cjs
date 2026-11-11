// 5단계 UI 테스트: 30초 시작·검색 자동완성·잉크 교체 3탭·용어 풀이·선택 기능
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./harness.cjs'), F = require('./fixtures.cjs');
before(() => h.start());
after(() => h.stop());
const empty = () => h.scenario({ pens: [], inks: [] });
const withData = async () => { const s = await h.scenario(F.base); await s.page.evaluate(() => { refresh(); openTab('pens'); }); return s; };

test('검색: 영어·한글 별칭 모두 찾는다', async () => {
  const s = await empty();
  const r = await s.page.evaluate(() => ({
    ko: PIL.searchCatalog(INK_CATALOG, '이로시주쿠 콘', 5).map(x => x.name),
    mb: PIL.searchCatalog(INK_CATALOG, '몽블랑', 3).map(x => x.brand),
    en: PIL.searchCatalog(PEN_CATALOG, 'lamy saf', 3).map(x => x.name),
    none: PIL.searchCatalog(INK_CATALOG, 'zzzz', 3).length,
  }));
  assert.ok(r.ko.includes('Iroshizuku Kon-peki'));
  assert.ok(r.mb.every(b => b === 'Montblanc') && r.mb.length > 0);
  assert.deepEqual(r.en, ['Safari']);
  assert.equal(r.none, 0);
  assert.deepEqual(s.errors, []); await s.close();
});

test('30초 시작: 만년필 1자루 + 잉크 1병으로 첫 추천 결과가 나온다', async () => {
  const s = await empty(); const p = s.page;
  assert.equal(await p.locator('#pilStart').count(), 1, '빈 상태에서 시작 카드가 보임');
  await p.fill('#pilS_pen', 'lamy saf'); await p.locator('#pilS_pen_list li').first().click();
  await p.fill('#pilS_ink', 'diamine mar'); await p.locator('#pilS_ink_list li').first().click();
  await p.click('#pilS_go');
  await p.waitForSelector('#pilStart .pil-score');
  const score = Number(await p.locator('#pilStart .pil-score b').textContent());
  assert.ok(score >= 8 && score <= 95, '점수 범위: ' + score);
  const d = await p.evaluate(() => ({ pens: db.pens.map(x => x.brand + ' ' + x.name), inks: db.inks.map(x => x.brand + ' ' + x.name), rec: $('recResults').textContent.length }));
  assert.deepEqual(d.pens, ['Lamy Safari']); assert.deepEqual(d.inks, ['Diamine Marine']);
  assert.ok(d.rec > 20, '일반 추천 영역도 채워짐');
  assert.deepEqual(s.errors, []); await s.close();
});

test('30초 시작: 목록에 없는 제품은 직접 입력으로도 진행된다', async () => {
  const s = await empty(); const p = s.page;
  await p.evaluate(() => document.querySelectorAll('.pil-manual').forEach(d => d.open = true));
  await p.fill('#pilS_pen_b', 'Nemosine'); await p.fill('#pilS_pen_n', 'Singularity');
  await p.fill('#pilS_ink_b', 'Mystery'); await p.fill('#pilS_ink_n', 'Blue X');
  await p.click('#pilS_go'); await p.waitForSelector('#pilStart .pil-score');
  assert.equal(await p.evaluate(() => db.pens[0].brand + '/' + db.inks[0].name), 'Nemosine/Blue X');
  await s.close();
});

test('30초 시작: 입력이 비면 안내하고 아무것도 만들지 않는다', async () => {
  const s = await empty(); const p = s.page;
  await p.click('#pilS_go');
  assert.match(await p.locator('#pilS_msg').textContent(), /만년필을 검색/);
  assert.equal(await p.evaluate(() => db.pens.length + db.inks.length), 0);
  await s.close();
});

test('잉크 등록 검색: 고르면 폼이 채워지고 등록 시 색조·특성이 반영된다', async () => {
  const s = await empty(); const p = s.page;
  await p.evaluate(() => { openTab('inks'); document.querySelector('#inks details.add-card').open = true; });
  await p.fill('#pilInkFind', 'oxblood'); await p.locator('#pilInkList li').first().click();
  const f = await p.evaluate(() => [$('iBrand').value, $('iName').value, $('iEffect').value, $('iFamily').value]);
  assert.deepEqual(f, ['Diamine', 'Oxblood', 'Sheen', '레드 / 오렌지 / 버건디 브라운']);
  await p.click('#addInk');
  const ink = await p.evaluate(() => db.inks[0]);
  assert.equal(ink.hue, '버건디'); assert.equal(ink.effect, 'Sheen');
  await s.close();
});

test('만년필 등록 검색: 닙 후보와 지역 경향이 나오고 닙을 바꿀 수 있다', async () => {
  const s = await empty(); const p = s.page;
  await p.evaluate(() => { openTab('pens'); document.querySelector('#pens details.add-card').open = true; });
  await p.fill('#pilPenFind', 'pilot custom 74'); await p.locator('#pilPenList li').first().click();
  assert.equal(await p.inputValue('#pNib'), 'F');
  assert.match(await p.locator('#pilPenMsg').textContent(), /일본 제조사/);
  await p.locator('#pilPenMsg .chip-btn', { hasText: /^M$/ }).click();
  assert.equal(await p.inputValue('#pNib'), 'M');
  await p.click('#addPen');
  assert.equal(await p.evaluate(() => db.pens[0].name + '/' + db.pens[0].nib), 'Custom 74/M');
  await s.close();
});

test('잉크 교체: 든 잉크가 있으면 세척+잉입 기록, 되돌리기로 원복', async () => {
  const s = await withData(); const p = s.page;
  await p.click('[data-swapink="p4"]');
  await p.locator('.pil-sheet .pil-row[data-own]', { hasText: 'Oxblood' }).click();
  const after = await p.evaluate(() => ({ p: db.pens.find(x => x.id === 'p4'), h: db.history.map(x => x.type) }));
  assert.equal(after.p.inkName, 'Oxblood'); assert.equal(after.p.status, '현재 잉입');
  assert.deepEqual(after.h, ['세척', '잉입']);
  await p.click('#pilToast button');
  const undone = await p.evaluate(() => ({ p: db.pens.find(x => x.id === 'p4').inkName, n: db.history.length }));
  assert.deepEqual(undone, { p: 'Marine', n: 0 });
  assert.deepEqual(s.errors, []); await s.close();
});

test('잉크 교체: 빈 만년필은 세척 기록 없이 잉입만 남긴다', async () => {
  const s = await withData(); const p = s.page;
  await p.click('[data-swapink="p1"]');
  await p.locator('.pil-sheet .pil-row[data-own]', { hasText: 'Salix' }).click();
  assert.deepEqual(await p.evaluate(() => db.history.map(x => x.type)), ['잉입']);
  await s.close();
});

test('잉크 교체: 내 목록에 없는 잉크를 검색해 추가하고 바로 교체한다', async () => {
  const s = await withData(); const p = s.page;
  await p.click('[data-swapink="p2"]');
  await p.fill('#pilPickQ', 'iroshizuku ku-jaku');
  await p.locator('.pil-sheet .pil-row[data-cat]').first().click();
  const r = await p.evaluate(() => ({ ink: db.pens.find(x => x.id === 'p2').inkName, has: db.inks.some(i => i.name === 'Iroshizuku Ku-jaku'), n: db.inks.length }));
  assert.equal(r.ink, 'Iroshizuku Ku-jaku'); assert.ok(r.has); assert.equal(r.n, F.inks.length + 1);
  await s.close();
});

test('잉크 교체: 이미 든 잉크를 다시 고르면 기록을 늘리지 않는다', async () => {
  const s = await withData(); const p = s.page;
  await p.click('[data-swapink="p4"]');
  await p.locator('.pil-sheet .pil-row[data-own]', { hasText: 'Marine' }).first().click();
  assert.equal(await p.evaluate(() => db.history.length), 0);
  await s.close();
});

test('다른 펜에 잉입 중인 잉크는 교체 목록에 표시된다', async () => {
  const s = await withData(); const p = s.page;
  await p.click('[data-swapink="p1"]');
  assert.match(await p.locator('.pil-sheet .pil-row', { hasText: 'Marine' }).first().textContent(), /Kakuno에 잉입 중/);
  await s.close();
});

test('용어 풀이: ⓘ를 누르면 설명 시트가 열리고 Esc로 닫힌다', async () => {
  const s = await empty(); const p = s.page;
  await p.evaluate(() => { openTab('inks'); document.querySelector('#inks details.add-card').open = true; });
  await p.locator('#inks label:has(.pil-tip) .pil-tip').first().click();
  assert.equal(await p.locator('.pil-sheet svg').count() > 0, true, '예시 그림 포함');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('.pil-sheet').count(), 0);
  assert.ok(await p.locator('#pilGloss').count() === 1);
  await s.close();
});

test('서버가 필요한 사진 업로드·자동 판독 UI는 보이지 않고, AI 앱 복사·붙여넣기 카드는 보인다', async () => {
  const s = await empty(); const p = s.page;
  const vis = await p.evaluate(() => ['tAiBtn', 'tPhotos'].map(id => { const e = document.getElementById(id); return e ? getComputedStyle(e).display !== 'none' : null; }));
  assert.ok(vis.every(v => v === false || v === null), '보이는 서버 UI: ' + vis);
  assert.equal(await p.evaluate(() => ['aiCard_pen', 'aiCard_ink', 'aiCard_test'].every(id => document.getElementById(id) && getComputedStyle(document.getElementById(id)).display !== 'none')), true);
  assert.equal(await p.evaluate(() => typeof PIL.setFeatures + typeof google), 'undefinedundefined', '기능 플래그·서버 객체가 없음');
  await s.close();
});

test('시필 노트에 숫자가 아닌 값이 있어도 점수가 NaN이 되지 않는다', async () => {
  const s = await h.scenario({ ...F.base, testReviews: [{ id: 't1', penId: 'p1', inkId: 'i12', evidence: 'hands-on', rating: '4', width: '가늘다', smooth: '좋음', feather: 'x', flow: '보통' }] });
  const r = await s.calc('p1', 'i12');
  assert.ok(Number.isFinite(r.score), '점수: ' + r.score);
  await s.close();
});

test('기존 개인용 흔적이 화면에 남지 않는다', async () => {
  const s = await empty();
  const txt = await s.page.evaluate(() => document.documentElement.outerHTML);
  assert.ok(!/ghim|형님|nayagiraffe|김규환/i.test(txt));
  await s.close();
});
