// 원본 Index.html 을 <style>/<script>/HTML 조각으로 무손실 분할 → src/parts + src/manifest.json
// 사용: node scripts/split.mjs <Index.html> (1회성 마이그레이션 도구)
import fs from 'node:fs';
import path from 'node:path';
const src = fs.readFileSync(process.argv[2], 'utf8');
const out = 'src/parts';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const re = /<(style|script)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;
const manifest = [];
let last = 0, m, n = 0;
const slug = s => s.toLowerCase().replace(/[^a-z0-9가-힣.]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
const emit = (kind, open, body, close) => {
  n++;
  const first = (body.match(/\/\*\s*([^*]{1,60})/) || [])[1] || '';
  const ext = kind === 'style' ? 'css' : kind === 'script' ? 'js' : 'html';
  const name = `${String(n).padStart(2, '0')}-${kind}${first ? '-' + slug(first) : ''}.${ext}`;
  fs.writeFileSync(path.join(out, name), body);
  manifest.push({ file: name, kind, open, close });
};
while ((m = re.exec(src))) {
  if (m.index > last) emit('html', '', src.slice(last, m.index), '');
  emit(m[1], `<${m[1]}${m[2] || ''}>`, m[3], `</${m[1]}>`);
  last = re.lastIndex;
}
if (last < src.length) emit('html', '', src.slice(last), '');
fs.writeFileSync('src/manifest.json', JSON.stringify(manifest, null, 1));
console.log(`분할 완료: ${manifest.length}개 조각`);
