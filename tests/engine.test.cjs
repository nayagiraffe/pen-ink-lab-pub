// 추천 엔진 테스트: 문서화된 규칙 + 통합 전후 동일성(골든)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./harness.cjs'), F = require('./fixtures.cjs');
const scenarios = require('./scenarios.cjs');
const golden = require('./golden/engine.json');
const find = (rows, id) => rows.find(r => r.id === id);
const hasText = (arr, re) => arr.some(x => re.test(x));

before(() => h.start());
after(() => h.stop());

test('골든: 모든 시나리오의 추천 순위·점수·근거가 기준과 같다', async () => {
  for (const [name, def] of Object.entries(scenarios)) {
    const s = await h.scenario(def.data(F));
    const got = await def.run(s);
    assert.deepEqual(s.errors, [], name + ' 실행 중 오류');
    assert.deepEqual(got, golden[name], '시나리오 불일치: ' + name);
    await s.close();
  }
});

test('빈 컬렉션에서도 오류 없이 동작한다', async () => {
  const s = await h.scenario({ pens: [], inks: [] });
  assert.deepEqual(s.errors, []);
  await s.close();
});

test('v3.2: 다른 만년필에 잉입 중인 잉크는 1자루당 5점 감점, 그 펜 자신에게는 감점 없음', async () => {
  const s = await h.scenario(F.base);
  const other = await s.calc('p1', 'i2'), own = await s.calc('p4', 'i2');
  assert.ok(hasText(other.warn, /다른 만년필 1자루에 잉입 중 \(−5\)/));
  assert.ok(!hasText(own.warn, /다른 만년필/));
  await s.close();
});

test('v3.2: 최근 자주 잉입한 잉크는 감점되고 상한(−6)을 넘지 않는다', async () => {
  const s = await h.scenario(scenarios.최근_자주_쓴_잉크.data(F));
  const r = await s.calc('p1', 'i7');
  assert.ok(hasText(r.warn, /최근 자주 쓴 잉크 \(−6\)/));
  await s.close();
});

test('v3.2: 안 써 본 조합 +2, 써 본 조합은 가점 없음', async () => {
  const s = await h.scenario(scenarios.최근_자주_쓴_잉크.data(F));
  assert.ok(hasText((await s.calc('p5', 'i1')).why, /아직 안 써 본 조합 \(\+2\)/));
  assert.ok(!hasText((await s.calc('p1', 'i7')).why, /아직 안 써 본 조합/));
  await s.close();
});

test('v3.2: 굵은 닙 + 테/농담 잉크 +3, 극세 닙 + 테 잉크 −2', async () => {
  const s = await h.scenario(F.base);
  assert.ok(hasText((await s.calc('p2', 'i4')).why, /굵은·특수 닙.*\(\+3\)/));
  assert.ok(hasText((await s.calc('p3', 'i4')).warn, /극세 닙에서는 테가 잘 안 보임 \(−2\)/));
  assert.ok(!hasText((await s.calc('p3', 'i1')).warn, /극세 닙에서는 테/), '테 없는 잉크는 극세 닙 감점 제외');
  await s.close();
});

test('v3.2: 이 펜에서 좋았던 색 계열 +2', async () => {
  const s = await h.scenario(scenarios.좋았던_색_계열.data(F));
  assert.ok(hasText((await s.calc('p2', 'i3')).why, /좋았던 색 계열 \(\+2\)/));
  await s.close();
});

test('v3.2: 상위 12개 안에서 같은 브랜드는 2개까지', async () => {
  const s = await h.scenario(F.base);
  const rows = await s.rank('p1');
  const brand = id => F.inks.find(i => i.id === id).brand;
  const count = {};
  rows.slice(0, 12).forEach(r => { count[brand(r.id)] = (count[brand(r.id)] || 0) + 1; });
  Object.entries(count).forEach(([b, n]) => assert.ok(n <= 2, `${b} 이(가) 상위 12개에 ${n}개`));
  assert.ok(rows.some(r => r.capped), '상한에 걸려 뒤로 밀린 후보가 표시된다');
  await s.close();
});

test('v3.2: 동점 순서(tieOrder)는 같은 만년필에서는 항상 같다', async () => {
  const s = await h.scenario(F.base);
  const orders = await s.page.evaluate(() => {
    const ids = db.inks.map(i => i.id);
    const ord = seed => ids.slice().sort((a, b) => tieOrder(a, seed) - tieOrder(b, seed)).join(',');
    return { p1: ord('p1'), p1again: ord('p1') };
  });
  assert.equal(orders.p1, orders.p1again);
  await s.close();
});

test('v3.2: 만년필마다 동점 순서가 달라야 한다 (p1·p2·p3·p4가 모두 다름)', async () => {
  const s = await h.scenario(F.base);
  const o = await s.page.evaluate(() => {
    const ids = db.inks.map(i => i.id);
    const ord = seed => ids.slice().sort((a, b) => tieOrder(a, seed) - tieOrder(b, seed)).join(',');
    return [ord('p1'), ord('p2'), ord('p3'), ord('p4')];
  });
  assert.equal(new Set(o).size, 4);
  await s.close();
});

test('v3.3: 전용 잉크는 가점과 이유가 붙고 브랜드 상한에서 제외된다', async () => {
  const s = await h.scenario(F.base);
  const r = await s.calc('p5', 'i16');
  assert.equal(r.comp, true);
  assert.ok(hasText(r.why, /함께 나온 전용 잉크 \(\+\d+\)/));
  const rows = await s.rank('p5');
  assert.equal(find(rows, 'i16').capped, false);
  await s.close();
});

test('v3.3: 전용 잉크라도 닙에 맞지 않으면 가점이 줄고 경고가 붙는다 (펄 + 가는 닙)', async () => {
  const pens = F.pens.map(p => p.id === 'p5' ? { ...p, nib: 'F' } : p);
  const s = await h.scenario({ pens, inks: F.inks });
  const r = await s.calc('p5', 'i16');
  assert.ok(hasText(r.why, /\(\+6\)/), '가는 닙+펄은 +6: ' + r.why);
  assert.ok(hasText(r.warn, /전용 잉크 · 펄 잉크라/));
  await s.close();
});

test('v3.3: 전용 잉크가 아닌 조합에는 전용 표시가 없다', async () => {
  const s = await h.scenario(F.base);
  assert.equal((await s.calc('p1', 'i16')).comp, false);
  await s.close();
});
