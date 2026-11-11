// 현재 빌드의 추천 결과를 골든 파일로 저장한다 (엔진을 고치기 전에 한 번 실행).
const fs = require('node:fs'), h = require('./harness.cjs'), F = require('./fixtures.cjs');
const scenarios = require('./scenarios.cjs');
(async () => {
  await h.start();
  const out = {};
  for (const [name, def] of Object.entries(scenarios)) {
    const s = await h.scenario(def.data(F));
    out[name] = await def.run(s);
    if (s.errors.length) throw Error(name + ': ' + s.errors.join('; '));
    await s.close();
  }
  await h.stop();
  fs.writeFileSync(__dirname + '/golden/engine.json', JSON.stringify(out, null, 1));
  console.log('골든 저장:', Object.keys(out).join(', '));
})();
