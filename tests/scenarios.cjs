// 골든 검증에 쓰는 시나리오 (data: 컬렉션 구성, run: 측정할 결과)
const allPens = (s, ids, opts) => Promise.all(ids.map(async id => [id, await s.rank(id, opts)]));
const obj = async p => Object.fromEntries(await p);
module.exports = {
  빈_기록: { data: F => F.base, run: s => obj(allPens(s, ['p1', 'p2', 'p3', 'p5', 'p6'])) },
  우선순위별: { data: F => F.base, run: async s => ({ fine: await s.rank('p3', { priority: 'fine' }), color: await s.rank('p1', { priority: 'color' }), sheen: await s.rank('p2', { priority: 'sheen' }), care: await s.rank('p6', { priority: 'care' }) }) },
  다른_펜에_잉입_중: { data: F => F.base, run: s => obj(allPens(s, ['p1', 'p4'])) },
  최근_자주_쓴_잉크: { data: F => ({ ...F.base, history: [
    { id: 'h1', penId: 'p1', inkId: 'i7', type: '잉입', daysAgo: 10 }, { id: 'h2', penId: 'p2', inkId: 'i7', type: '잉입', daysAgo: 20 },
    { id: 'h3', penId: 'p3', inkId: 'i7', type: '잉입', daysAgo: 30 }, { id: 'h4', penId: 'p6', inkId: 'i7', type: '잉입', daysAgo: 40 } ] }),
    run: s => obj(allPens(s, ['p1', 'p5'])) },
  좋았던_색_계열: { data: F => ({ ...F.base, history: [{ id: 'h1', penId: 'p2', inkId: 'i9', type: '잉입', daysAgo: 10, rating: '좋음' }] }), run: s => obj(allPens(s, ['p2'])) },
  시필_평가: { data: F => ({ ...F.base, testReviews: [{ id: 't1', penId: 'p1', inkId: 'i12', date: '2026-01-01', paper: 'A', flow: '3', width: '2', smooth: '4', feather: '0', rating: '4', evidence: 'hands-on' }] }), run: s => obj(allPens(s, ['p1'])) },
  소분_본병_우선: { data: F => F.base, run: s => obj(allPens(s, ['p1'], { policy: 'preferBottle' })) },
};
