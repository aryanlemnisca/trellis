/**
 * Builds the app icons from one definition.
 *
 *   app/icon.svg        the mark, rounded — modern browsers, every size
 *   app/favicon.ico     16/32/48 raster — older browsers, Windows
 *   app/apple-icon.png  180×180, SQUARE — iOS home screen
 *
 * All three are BUILD OUTPUT, like `public/illustration`. Change MARK
 * here and re-run; do not hand-edit the files.
 *
 *   node scripts/build-icons.mjs
 *
 * `sharp` is resolved from Next's own dependency tree rather than being
 * declared here — this runs by hand, occasionally, not in the build, so
 * a transitive dep is a fair trade against another entry in
 * package.json. The script says so plainly if it ever goes missing.
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error(
    "build-icons: `sharp` is not resolvable. It normally comes in with\n" +
      "next; install it directly if that has changed:\n\n" +
      "  npm i -D sharp\n",
  );
  process.exit(1);
}

/**
 * The mark: a T knocked out of the board.
 *
 * Drawn as geometry rather than a <text> element on purpose — an icon is
 * rendered outside the page, so it cannot fetch Inter and a text node
 * would fall back to whatever the machine happens to have.
 *
 * Proportions are heavier than Inter's own T: at 16px a typographic stem
 * lands under 1.5 device pixels and greys out. Cap 15.2 on a 32 grid,
 * centred both ways — margins are 7 either side and 8.4 top and bottom.
 */
const MARK = "M7 8.4h18v4.6h-6.8v10.6h-4.4V13H7z";
const BOARD = "#000000";
const PAPER = "#ffffff";

/** `radius` is 22% of the square — the modern app-icon convention. */
const svg = (radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="${radius}" fill="${BOARD}" />
  <path d="${MARK}" fill="${PAPER}" />
</svg>
`;

const ROUNDED = svg(7);
/** iOS masks its own corners, so the source must be a full-bleed square. */
const SQUARE = svg(0);

const png = (source, size) =>
  sharp(Buffer.from(source), { density: 384 })
    .resize(size, size, { fit: "fill" })
    .png()
    .toBuffer();

/**
 * ICO container. Every entry is a whole PNG — the format has allowed
 * that since Vista, and it keeps the file a fraction of the size a BMP
 * entry would be.
 *
 * Header is 6 bytes, then one 16-byte directory entry per image, then
 * the payloads. A dimension of 256 is stored as 0; nothing here is that
 * large, but the encoding is cheap to get right.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette size — 0 for true colour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([
    header,
    ...entries,
    ...images.map((image) => image.data),
  ]);
}

const ICO_SIZES = [16, 32, 48];

writeFileSync("app/icon.svg", ROUNDED);

const rasters = await Promise.all(
  ICO_SIZES.map(async (size) => ({ size, data: await png(ROUNDED, size) })),
);
writeFileSync("app/favicon.ico", ico(rasters));

writeFileSync("app/apple-icon.png", await png(SQUARE, 180));

console.log("app/icon.svg");
console.log(`app/favicon.ico  ${ICO_SIZES.join(", ")}`);
console.log("app/apple-icon.png  180");
