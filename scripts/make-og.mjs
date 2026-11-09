/*
 * Builds public/og.png (1200x630), the image shown when the page is shared.
 * Run `npm run make:og` after changing the headline or logo, then commit the PNG.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../public/', import.meta.url);
const logoBuf = await sharp(readFileSync(fileURLToPath(new URL('trellis-logo.png', root))))
  .resize({ width: 300 })
  .png()
  .toBuffer();

const W = 1200, H = 630;
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#F7F4EC"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#1F2226" stroke-opacity=".16"/>
  <g font-family="Times New Roman, Times, serif" fill="#1F2226">
    <text x="96" y="318" font-size="124" letter-spacing="-3">Scale</text>
    <text x="96" y="446" font-size="124" font-style="italic" letter-spacing="-3">newer heights</text>
  </g>
  <text x="98" y="520" font-family="Menlo, Courier New, monospace" font-size="22" fill="#47433C" letter-spacing="1">Design of experiments for faster bioprocess scale-up</text>
  <rect x="1020" y="470" width="84" height="84" fill="#DF681E"/>
</svg>`;

const png = await sharp(Buffer.from(svg))
  .composite([{ input: logoBuf, left: 92, top: 92 }])
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(fileURLToPath(new URL('og.png', root)), png);
console.log(`og.png written (${(png.length / 1024).toFixed(0)} KB)`);
