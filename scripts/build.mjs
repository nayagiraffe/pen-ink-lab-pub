// src/manifest.json 순서대로 조각을 이어 붙여 site/index.html 을 만들고, web/ 의 PWA 파일(매니페스트·아이콘·서비스 워커)을 site/ 에 함께 둔다.
// site/ 폴더 전체가 정적 호스팅(GitHub Pages 등)에 올릴 배포물이다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const outFile = process.argv[2] || 'site/index.html';
const outDir = path.dirname(outFile);
const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf8'));
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const html = manifest.map(p => p.open + fs.readFileSync(path.join('src/parts', p.file), 'utf8') + p.close).join('').split('__APP_VERSION__').join(version);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html);

// ── PWA 정적 파일 ──
const ICONS = ['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
fs.mkdirSync(path.join(outDir, 'icons'), { recursive: true });
for (const f of ICONS) fs.copyFileSync(path.join('web/icons', f), path.join(outDir, 'icons', f));
const webmanifest = fs.readFileSync('web/manifest.webmanifest', 'utf8');
JSON.parse(webmanifest);                                   // 형식 오류를 빌드에서 바로 잡는다
fs.writeFileSync(path.join(outDir, 'manifest.webmanifest'), webmanifest);
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');       // GitHub Pages 가 파일을 가공하지 않게

// 서비스 워커: 캐시 이름에 앱 내용의 해시를 넣어, 앱이 바뀌면 자동으로 새 캐시로 교체된다
const assets = ['./', './index.html', './manifest.webmanifest', ...ICONS.map(f => './icons/' + f)];
const hash = crypto.createHash('sha1').update(html).update(webmanifest).digest('hex').slice(0, 8);
const cache = `pil-v${version}-${hash}`;
const sw = fs.readFileSync('web/sw.js', 'utf8').split('__CACHE__').join(cache).split('__ASSETS__').join(JSON.stringify(assets));
fs.writeFileSync(path.join(outDir, 'sw.js'), sw);

console.log(`빌드 완료: ${outFile} (${html.length}자) · 캐시 ${cache}`);
