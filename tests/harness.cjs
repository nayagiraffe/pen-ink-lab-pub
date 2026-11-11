// 빌드된 site/index.html 을 헤드리스 크롬에서 열어 추천 엔진을 실제 환경 그대로 검사한다.
const { chromium } = require('playwright');
const path = require('node:path');
const BUILD = process.env.PIL_BUILD || path.resolve(__dirname, '../site/index.html');
let browser;
async function start() {
  // 소스가 빌드보다 새로우면 오래된 빌드로 테스트하게 되므로 바로 알린다
  const fsx = require('node:fs'), root = path.resolve(__dirname, '..');
  const built = fsx.statSync(BUILD).mtimeMs;
  const newest = [...fsx.readdirSync(root + '/src/parts').map(f => root + '/src/parts/' + f), root + '/src/manifest.json'].reduce((m, f) => Math.max(m, fsx.statSync(f).mtimeMs), 0);
  if (newest > built) throw new Error('site/index.html 이 소스보다 오래됐습니다. npm run build 후 다시 실행하세요 (npm test 는 자동으로 빌드합니다).');
  browser = await chromium.launch();
}
async function stop() { if (browser) await browser.close(); }
const DAY = 864e5;
// 시나리오마다 새 페이지(엔진 내부 캐시를 초기화하기 위해). setup 은 db 를 채우는 데이터.
async function scenario(setup) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + BUILD);
  await page.waitForFunction(() => typeof calc === 'function' && typeof recommendations === 'function');
  if (setup) await page.evaluate(({ s, DAY }) => {
    const ago = d => new Date(Date.now() - d * DAY).toISOString().slice(0, 10);
    db.pens = s.pens; db.inks = s.inks;
    db.history = (s.history || []).map(h => ({ ...h, when: h.daysAgo !== undefined ? ago(h.daysAgo) : h.when }));
    db.testReviews = s.testReviews || [];
  }, { s: setup, DAY });
  return {
    page, errors,
    close: () => page.close(),
    // 만년필 → 잉크 방향 추천 결과(요약)
    rank: (penId, { priority = 'balance', policy = 'flag' } = {}) => page.evaluate(({ penId, priority, policy }) => {
      $('direction').value = 'pen';
      $('target').innerHTML = db.pens.map(p => `<option value="${p.id}">${p.id}</option>`).join('');
      $('target').value = penId; $('priority').value = priority; $('samplePolicy').value = policy;
      recommendations();
      return latestRecommendationRows.map(r => ({ id: r.ink.id, score: r.score, why: r.why || [], warn: r.warnings || [], comp: !!r.companion, capped: !!r.brandCapped }));
    }, { penId, priority, policy }),
    calc: (penId, inkId, priority = 'balance') => page.evaluate(({ penId, inkId, priority }) => {
      const r = calc(db.pens.find(p => p.id === penId), db.inks.find(i => i.id === inkId), priority);
      return { score: r.score, why: r.why || [], warn: r.warnings || [], comp: !!r.companion };
    }, { penId, inkId, priority }),
  };
}
module.exports = { start, stop, scenario };
