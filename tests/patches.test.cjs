// 화면 패치(구 v3.0~v3.10) 통합 전후 동일성: 통합 전 빌드에서 만든 골든과 같아야 한다.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./harness.cjs'), obs = require('./observe.cjs');
const golden = require('./golden/patches.json');
before(() => h.start()); after(() => h.stop());
for (const name of Object.keys(obs)) {
  test('화면 동작 동일: ' + name, async () => { assert.deepEqual(await obs[name](), golden[name]); });
}
