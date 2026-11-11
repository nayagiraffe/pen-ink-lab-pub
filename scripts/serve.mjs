// site/ 를 로컬에서 미리 보는 정적 서버. 사용: npm run serve  →  http://localhost:8080
// (서비스 워커·홈 화면 설치는 https 또는 localhost 에서만 동작한다. 같은 와이파이의 휴대폰에서 http://컴퓨터IP:8080 으로 열면 화면은 보이지만 설치·오프라인은 안 된다.)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('site');
const port = Number(process.env.PORT || process.argv[2] || 8080);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
if (!fs.existsSync(path.join(root, 'index.html'))) { console.error('site/index.html 이 없습니다. 먼저 npm run build 를 실행하세요.'); process.exit(1); }

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`미리보기: http://localhost:${port}  (종료: Ctrl+C)`));
