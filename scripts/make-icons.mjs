// 앱 아이콘(PNG)을 만든다: 만년필 펜촉 + 잉크 방울. 결과는 web/icons/ 에 저장하고 저장소에 포함한다.
// 사용: node scripts/make-icons.mjs   (Playwright 의 크로미움 필요 — 아이콘을 바꿀 때만 실행)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const out = path.resolve('web/icons');
fs.mkdirSync(out, { recursive: true });

// scale: 그림 크기 비율(마스크용은 가장자리가 잘려도 안전하도록 작게), rounded: 모서리 둥글기
const svg = ({ scale = 1, rounded = true }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f63bd"/><stop offset="1" stop-color="#12295c"/></linearGradient>
  <linearGradient id="nib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9dfec"/></linearGradient>
</defs>
<rect width="512" height="512" ${rounded ? 'rx="112"' : ''} fill="url(#bg)"/>
<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
  <path d="M256 78 L340 222 C354 246 354 276 340 300 L256 424 L172 300 C158 276 158 246 172 222 Z" fill="url(#nib)"/>
  <path d="M256 424 L256 282" stroke="#12295c" stroke-width="12" stroke-linecap="round"/>
  <circle cx="256" cy="252" r="26" fill="#12295c"/>
  <path d="M172 300 C196 292 220 296 256 330 C292 296 316 292 340 300" fill="none" stroke="#12295c" stroke-opacity=".18" stroke-width="8" stroke-linecap="round"/>
</g></svg>`;

const jobs = [
  ['icon-180.png', 180, svg({ scale: 1, rounded: false })],
  ['icon-192.png', 192, svg({ scale: 1 })],
  ['icon-512.png', 512, svg({ scale: 1 })],
  ['icon-maskable-512.png', 512, svg({ scale: 0.68, rounded: false })],
];
const browser = await chromium.launch();
for (const [name, size, markup] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
  await page.screenshot({ path: path.join(out, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log('아이콘 생성:', name, size + 'px');
}
await browser.close();
