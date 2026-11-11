// 데이터 출처·저작권 가드: 공개 빌드에 외부 리뷰 원문·출처 사이트·개인 프로젝트 흔적이 섞이지 않게 막는다
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const h = require('./harness.cjs');
const BUILD = fs.readFileSync(path.resolve(__dirname, '../site/index.html'), 'utf8');
before(() => h.start());
after(() => h.stop());

test('빌드에 외부 리뷰 사이트 이름·도메인이 없다', () => {
  const bad = /mountainofink|well-?appointed ?desk|wellappointeddesk|fountainpennetwork|inky ?inspirations|inkyinspirations|pennaquod|inkcompare|goulet|reddit\.com/i;
  const m = BUILD.match(bad);
  assert.equal(m, null, '출처 사이트 이름이 포함됨: ' + (m && m[0]));
});

test('사용자에게 보이는 개인 프로젝트 용어(V6·V7·168종·91개)가 없다', () => {
  const m = BUILD.match(/\bV[67]\b|168종|91개|91자루|Ink_Detail_Sync|V7_Research_Sync/);
  assert.equal(m, null, '잔여: ' + (m && m[0]));
});

test('빌드에 외부 서버 주소가 없다 (XML 이름공간 식별자만 허용)', () => {
  // 로컬 우선 앱은 외부 서버에 접속하지 않는다. 허용하는 것은 접속 대상이 아닌 XML 이름공간 식별자뿐이다
  // (SVG, 엑셀 .xlsx 파일 형식). 진짜 접속 여부는 tests/local.test.cjs 가 요청을 기록해 확인한다.
  const allowed = new Set(['www.w3.org', 'schemas.openxmlformats.org']);
  const hosts = new Set([...BUILD.matchAll(/https?:\/\/([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)].map(m => m[1]));
  const extra = [...hosts].filter(x => !allowed.has(x));
  assert.deepEqual(extra, [], '허용되지 않은 외부 호스트: ' + extra.join(', '));
});

test('라이선스·서드파티 고지가 있고 배포물에 포함된다', () => {
  const root = path.resolve(__dirname, '..');
  assert.match(fs.readFileSync(root + '/LICENSE', 'utf8'), /^MIT License/);
  assert.match(fs.readFileSync(root + '/THIRD-PARTY-NOTICES.md', 'utf8'), /Pretendard/);
  assert.match(fs.readFileSync(root + '/scripts/release.mjs', 'utf8'), /LICENSE/);
  assert.equal(JSON.parse(fs.readFileSync(root + '/package.json', 'utf8')).license, 'MIT');
});

test('빌드에 구글 서버·Apps Script·드라이브 연동 코드가 없다', () => {
  const m = BUILD.match(/google\.script|script\.google\.com|Apps Script|Drive|드라이브|\/exec\b/);
  assert.equal(m, null, '구글 서버 흔적: ' + (m && m[0]));
});

test('화면에 보이는 모든 글(숨은 탭 포함)에 구글·동기화·클라우드 안내가 없다', async () => {
  const s = await h.scenario({ pens: [], inks: [] });
  const text = await s.page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style').forEach(e => e.remove()); return c.textContent.replace(/\s+/g, ' '); });
  const m = text.match(/구글|Google|드라이브|Apps Script|클라우드|동기화|서버에 저장/);
  assert.equal(m, null, '남은 문구: ' + (m && text.slice(Math.max(0, m.index - 30), m.index + 40)));
  await s.close();
});

test('서버가 없을 때 옛 사진 저장 코드는 던지지 않고 정상 실패로 알린다 (PIL.noServer)', async () => {
  const s = await h.scenario({ pens: [], inks: [] });
  const r = await s.page.evaluate(() => new Promise(res => {
    const out = { ok: false, err: null, threw: false };
    try { PIL.noServer().withSuccessHandler(() => { out.ok = true; }).withFailureHandler(e => { out.err = e.message; }).saveWritingPhoto('x', 'y'); } catch (e) { out.threw = true; }
    setTimeout(() => res(out), 50);
  }));
  assert.deepEqual(r, { ok: false, err: '이 버전에서는 사진 저장·판독을 지원하지 않아요.', threw: false });
  // 실패 처리기가 없어도 던지지 않는다
  assert.equal(await s.page.evaluate(() => { try { PIL.noServer().getPhotoThumbs([1]); return 'ok'; } catch (e) { return 'threw'; } }), 'ok');
  await s.close();
});

test('내장 조사 자료·시트 연동은 꺼져 있다', async () => {
  const s = await h.scenario({ pens: [], inks: [] });
  const r = await s.page.evaluate(() => ({ research: Object.keys(RESEARCH_V16).length, sync: typeof RESEARCH_SYNC, cloud: typeof cloudAvailable, seed: [SEED.pens.length, SEED.inks.length], photos: Object.keys(PEN_PHOTOS).length, vol: Object.keys(MASTER_VOLUME).length }));
  assert.deepEqual(r, { research: 0, sync: 'undefined', cloud: 'undefined', seed: [0, 0], photos: 0, vol: 0 });
  await s.close();
});

test('카탈로그는 제품 사실 필드만 담고 리뷰 문장·링크가 없다', async () => {
  const s = await h.scenario({ pens: [], inks: [] });
  const cat = await s.page.evaluate(() => ({ inks: INK_CATALOG, pens: PEN_CATALOG }));
  const inkKeys = ['brand', 'name', 'family', 'hue', 'effect', 'ko'].sort(), penKeys = ['brand', 'name', 'nibs', 'ko'].sort();
  for (const i of cat.inks) {
    assert.deepEqual(Object.keys(i).sort(), inkKeys, i.name + ': 허용되지 않은 필드');
    for (const k of inkKeys) assert.ok(String(i[k]).length <= 60, `${i.name}.${k} 가 너무 깁니다(문장 복제 의심)`);
  }
  for (const p of cat.pens) assert.deepEqual(Object.keys(p).sort(), penKeys, p.name + ': 허용되지 않은 필드');
  const text = JSON.stringify(cat);
  assert.ok(!/https?:\/\//i.test(text), '카탈로그에 URL 이 있음');
  assert.ok(!/review|리뷰|평가|추천 이유/i.test(text), '카탈로그에 리뷰성 문구가 있음');
  assert.ok(cat.inks.length > 50 && cat.pens.length > 30, '카탈로그 규모');
  await s.close();
});

test('초기화 안내가 실제 동작(빈 상태로 복귀)과 맞는다', async () => {
  const s = await h.scenario({ pens: [], inks: [] });
  const t = await s.page.evaluate(() => document.querySelector('#reset').parentElement.textContent);
  assert.match(t, /빈 상태로 돌아갑니다/); assert.match(t, /먼저 백업/);
  await s.close();
});

test('외부 리뷰 입력란에 원문 복제 금지 안내와 링크 전용 입력이 있다', async () => {
  const s = await h.scenario({ pens: [], inks: [] });
  const r = await s.page.evaluate(() => ({ hint: document.getElementById('inkDetailEditor').textContent, urlType: document.getElementById('diReviewSource').type }));
  assert.match(r.hint, /그대로 옮겨 적지 말고/); assert.equal(r.urlType, 'url');
  await s.close();
});

test('버전 표기는 package.json 값으로 채워진다 (개발 이력 버전이 화면에 없음)', async () => {
  const v = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')).version;
  assert.ok(!BUILD.includes('__APP_VERSION__'), '치환되지 않은 버전 토큰');
  const s = await h.scenario({ pens: [], inks: [] });
  const foot = await s.page.evaluate(() => document.querySelector('.foot').textContent);
  assert.ok(foot.includes('v' + v) && !/2026-10-28|1\.9\.4/.test(foot), foot);
  await s.close();
});
