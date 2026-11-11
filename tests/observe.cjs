// 화면 패치(v3.x) 통합 전후 동일성 검증용 관찰 모음. 통합 전 빌드로 골든을 만들고, 통합 후 같은 값이 나와야 한다.
const crypto = require('node:crypto');
const h = require('./harness.cjs'), F = require('./fixtures.cjs');
const sha = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);
const norm = s => String(s).replace(/\d{4}-\d{2}-\d{2}/g, 'DATE');
const rich = () => ({
  ...F.base,
  history: [
    { id: 'h1', penId: 'p2', inkId: 'i2', type: '잉입', daysAgo: 40, rating: '좋음' },
    { id: 'h2', penId: 'p6', inkId: 'i2', type: '잉입', daysAgo: 70, rating: '별로' },
    { id: 'h3', penId: 'p1', inkId: 'i10', type: '잉입', daysAgo: 15 },
  ],
  testReviews: [{ id: 't1', penId: 'p3', inkId: 'i2', date: '2026-01-01', rating: '4', width: '2', smooth: '4', feather: '0', flow: '3', evidence: 'hands-on' }],
});
const extract = page => page.evaluate(() => {
  const q = s => [...document.querySelectorAll(s)].map(e => e.textContent.replace(/\s+/g, ' ').trim());
  return { now: q('#recResults .now-box'), comp: q('#recResults .comp-box'), pens: q('#recResults .rec-pens'), order: [...document.querySelectorAll('#recResults > *')].slice(0, 4).map(e => e.className.split(' ')[0]), html: document.getElementById('recResults').innerHTML };
});
const pack = async (page, label) => { const x = await extract(page); return { label, hash: sha(norm(x.html)), len: x.html.length, now: x.now.map(norm), comp: x.comp, pens: x.pens.map(norm), order: x.order }; };

const out = {};
// 1) 추천 결과 화면 (v3.3 전용 박스 + v3.4 카드 블록 + v3.5 지금 상태)
out.rec = async () => {
  const r = {};
  for (const pen of ['p1', 'p4', 'p5']) {
    const s = await h.scenario(rich());
    await s.page.evaluate(() => refresh()); await s.rank(pen);
    r['pen:' + pen] = await pack(s.page, pen); await s.close();
  }
  for (const ink of ['i2', 'i16']) {
    const s = await h.scenario(rich());
    await s.page.evaluate(() => refresh());
    await s.page.evaluate(id => { $('direction').value = 'ink'; refreshTarget(); $('target').value = id; recommendations(); }, ink);
    r['ink:' + ink] = await pack(s.page, ink); await s.close();
  }
  return r;
};
// 2) AI에게 물어보기 질문 텍스트 (v3.8)
out.ask = async () => {
  const r = {};
  const run = async (name, setup) => {
    const s = await h.scenario(rich());
    await s.page.evaluate(() => { refresh(); Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__clip = t; return Promise.resolve(); } }, configurable: true }); });
    await s.page.evaluate(setup);
    await s.page.evaluate(() => document.getElementById('aiAsk').click());
    await s.page.waitForTimeout(150);
    r[name] = await s.page.evaluate(() => ({ clip: window.__clip || null, msg: document.getElementById('aiAskMsg').textContent }));
    r[name].clip = r[name].clip && norm(r[name].clip);
    await s.close();
  };
  await run('none', () => {});
  await run('pen', () => { $('direction').value = 'pen'; refreshTarget(); $('target').value = 'p4'; recommendations(); });
  await run('ink', () => { $('direction').value = 'ink'; refreshTarget(); $('target').value = 'i2'; recommendations(); });
  return r;
};
// 3) 시필 저장 + 잉입 반영 확인 (v3.6): 대화상자 순서와 결과 상태
out.testSave = async () => {
  const r = {};
  const run = async (name, { pen, ink, evidence = 'hands-on', accept }) => {
    const s = await h.scenario(rich()); const dialogs = [];
    s.page.on('dialog', d => { dialogs.push([d.type(), norm(d.message())]); (d.type() === 'confirm' && !accept) ? d.dismiss() : d.accept(); });
    await s.page.evaluate(({ pen, ink, evidence }) => { refresh(); updateTestSelects(); $('tPen').value = pen; $('tInk').value = ink; $('tEvidence').value = evidence; $('tRating').value = '4'; $('tDate').value = '2026-02-03'; }, { pen, ink, evidence });
    await s.page.evaluate(() => $('tSave').click());
    r[name] = await s.page.evaluate(({ pen }) => { const p = db.pens.find(x => x.id === pen); return { reviews: db.testReviews.length, ink: p.inkName, status: p.status, hist: db.history.map(x => x.type + '/' + (x.source || '')).slice(-2), nHist: db.history.length }; }, { pen });
    r[name].dialogs = dialogs; await s.close();
  };
  await run('빈펜_수락', { pen: 'p1', ink: 'i12', accept: true });
  await run('빈펜_거절', { pen: 'p1', ink: 'i12', accept: false });
  await run('같은잉크_확인없음', { pen: 'p4', ink: 'i2', accept: true });
  await run('다른잉크_수락', { pen: 'p4', ink: 'i12', accept: true });
  await run('사진근거_확인없음', { pen: 'p1', ink: 'i12', evidence: 'photo', accept: true });
  return r;
};
// 4) 폼 위치·보유 형태·로고 (v3.0, v3.9)
out.dom = async () => {
  const s = await h.scenario(rich());
  const r = await s.page.evaluate(() => {
    const kids = id => [...document.getElementById(id).children].map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className ? '.' + String(e.className).split(' ')[0] : ''));
    const opts = id => [...document.getElementById(id).options].map(o => o.value + ':' + o.text);
    const inv = t => inventoryText({ packageType: t, capacityMl: 5, remainingMl: null });
    const b = document.querySelector('#uiSidebar .brand');
    return {
      inksKids: kids('inks'), pensKids: kids('pens'), iPackage: opts('iPackage'), vPackage: opts('vPackage'),
      summaries: ['inks', 'pens'].map(id => document.querySelector('#' + id + ' details.add-card > summary').textContent.replace(/\s+/g, ' ').trim()),
      manualBtn: ['aiCard_ink', 'aiCard_pen'].map(id => { const e = document.querySelector('#' + id + ' .manual-btn'); return e ? e.textContent : null; }),
      formClass: document.querySelector('#inks details.add-card').className,
      inv: ['unknown', 'sample', 'bottle', 'cartridge'].map(inv),
      brand: b ? { role: b.getAttribute('role'), tabindex: b.getAttribute('tabindex'), title: b.getAttribute('title') } : null,
    };
  });
  await s.close(); return r;
};
// 5) 직접 시필 기록 검증 (v3.10)
out.inkDetail = async () => {
  const s = await h.scenario(rich()); const r = {};
  await s.page.evaluate(() => { refresh(); openInkDetailEditor('i1'); });
  const attempt = () => s.page.evaluate(() => { try { collectInkDetail(); return 'ok'; } catch (e) { return e.message; } });
  r.unconfirmed = await attempt();
  await s.page.evaluate(() => { const c = $('diDirectConfirmed'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
  r.dateAutoFilled = await s.page.evaluate(() => $('diDirectDate').value === localDate());
  r.noPenNoObs = await attempt();
  await s.page.evaluate(() => { $('diDirectPen').value = 'p1'; });
  r.noObs = await attempt();
  await s.page.evaluate(() => { $('diDirectDate').value = ''; $('diDirectFlow').selectedIndex = 1; });
  r.dateBlankThenFilledByCollect = await attempt();
  r.dateAfterCollect = await s.page.evaluate(() => $('diDirectDate').value === localDate());
  await s.close(); return r;
};
// 6) 계산된 스타일 (CSS 이동 시 우선순위가 바뀌지 않았는지)
out.styles = async () => {
  const sels = ['.rec-pens', '.rec-pens .lbl', '.rec-pens .pchip', '.now-box', '.now-box h4', '.now-row', '.now-dot', '.now-empty', '.now-q', '.comp-box',
    '.pen-card', '.pen-card .pen-body', '.pen-card .pen-foot', '.pen-card .pen-btns', '#uiSidebar .brand', '.manual-card', '.manual-card > summary', '.manual-card > summary h2', '.manual-card > summary .ai-sub'];
  const r = {};
  for (const vw of [390, 1200]) {
    const s = await h.scenario(rich());
    await s.page.setViewportSize({ width: vw, height: 900 });
    await s.page.evaluate(() => { refresh(); });
    await s.rank('p5');
    await s.page.evaluate(() => { openTab('pens'); document.querySelectorAll('details.manual-card').forEach(d => d.open = true); });
    // 진행 중인 전환·무한 반복 애니메이션(pulse 등)을 취소해 정착된 값만 비교한다 (타이밍에 따라 값이 흔들리던 원인)
    await s.page.evaluate(() => document.getAnimations().forEach(a => a.cancel()));
    const snap =await s.page.evaluate(sels => sels.map(sel => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); const o = {}; for (const p of [...cs].sort()) { if (/^(width|height|inline-size|block-size|perspective-origin|transform-origin)$/.test(p)) continue; /* 글꼴·화면 크기에 따라 달라지는 실측 크기는 제외 (규칙이 아니라 결과값) */ o[p] = cs.getPropertyValue(p); } /* 나열 순서(사용자 정의 속성 등)는 화면과 무관하므로 이름순으로 고정 */ return o; }), sels);
    sels.forEach((sel, i) => { r[vw + ' ' + sel] = snap[i] ? { hash: sha(JSON.stringify(snap[i])), display: snap[i].display, dir: snap[i]['flex-direction'], mt: snap[i]['margin-top'] } : null; });
    await s.close();
  }
  return r;
};
module.exports = out;
