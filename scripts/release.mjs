// 배포 압축파일을 만든다: 정적 호스팅에 올릴 사이트 파일 + 안내 문서.
// 사용: npm run release  (테스트 → 빌드 → dist/pen-ink-lab-vX.Y.Z.zip)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const name = `pen-ink-lab-v${pkg.version}`;
const out = path.join('dist', name);
const site = path.join(out, '사이트파일');          // 호스팅에 올릴 폴더(이 안의 내용 전체)

if (!fs.existsSync('site/index.html')) throw new Error('site/index.html 이 없습니다 — 먼저 npm run build');
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk('site')) {
  const to = path.join(site, path.relative('site', f));
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(f, to);
}
const copy = (from, to) => fs.copyFileSync(from, path.join(out, to));
copy('docs/DEPLOY.md', '1-올리는-방법.md');
copy('docs/USER_GUIDE.md', '2-사용자-안내.md');
copy('docs/DATA-SOURCES.md', 'DATA-SOURCES.md');
copy('LICENSE', 'LICENSE');
copy('THIRD-PARTY-NOTICES.md', 'THIRD-PARTY-NOTICES.md');

// ── 안전 검사: 개인 정보·구글 서버 흔적·외부 주소가 배포물에 섞이면 중단 ──
const bad = /nayagiraffe|김규환|ghim|AKfycb|1LuN_m_4|1ahaFV|sk-ant-|형님|mountainofink|well-?appointed ?desk|fountainpennetwork|inky ?inspirations|\bV[67]\b|168종|91개/i;
for (const f of walk(out)) {
  if (/\.png$/.test(f)) continue;
  const text = fs.readFileSync(f, 'utf8');
  const m = text.match(bad);
  if (m) throw new Error(`${f} 에 개인 정보로 의심되는 값: ${m[0]}`);
}
const index = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
if (/google\.script|script\.google\.com|\/exec\b/.test(index)) throw new Error('앱에 구글 Apps Script 의존이 남아 있습니다');
const hosts = [...index.matchAll(/https?:\/\/([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)].map(m => m[1]).filter(h => !['www.w3.org', 'schemas.openxmlformats.org'].includes(h));
if (hosts.length) throw new Error('허용되지 않은 외부 주소: ' + [...new Set(hosts)].join(', '));
const mf = JSON.parse(fs.readFileSync(path.join(site, 'manifest.webmanifest'), 'utf8'));
for (const i of mf.icons) if (!fs.existsSync(path.join(site, i.src))) throw new Error('매니페스트 아이콘 없음: ' + i.src);
const swSrc = fs.readFileSync(path.join(site, 'sw.js'), 'utf8');
const assets = JSON.parse(swSrc.match(/const ASSETS = (\[.*\]);/)[1]);
for (const a of assets) { const p = path.join(site, a === './' ? 'index.html' : a); if (!fs.existsSync(p)) throw new Error('서비스 워커 자산 없음: ' + a); }
if (!/const CACHE = 'pil-v[\d.]+-[0-9a-f]{8}'/.test(swSrc)) throw new Error('서비스 워커 캐시 이름 형식 오류');

execFileSync('zip', ['-rq', `${name}.zip`, name], { cwd: 'dist' });
console.log(`릴리스 생성: dist/${name}.zip`);
for (const f of walk(out)) console.log(' ', path.relative(out, f), `(${fs.statSync(f).size.toLocaleString()}B)`);
