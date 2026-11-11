const fs = require('node:fs'), h = require('./harness.cjs'), obs = require('./observe.cjs');
(async () => {
  await h.start(); const g = {};
  for (const [k, fn] of Object.entries(obs)) { g[k] = await fn(); console.log('관찰:', k); }
  await h.stop();
  fs.writeFileSync(__dirname + '/golden/patches.json', JSON.stringify(g, null, 1));
})();
