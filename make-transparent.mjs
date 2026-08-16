// make-transparent.mjs — remove white backgrounds from the built-in
// background images (assets/backgrounds/*) so they blend seamlessly.
//
// Method: flood-fill near-white pixels from the image BORDERS and make them
// transparent (interior whites like a whale's belly are preserved because they
// are not connected to the border). Boundary pixels get a whiteness-based
// feather so edges stay smooth. Outputs WebP with alpha, replacing the input.
//
// Usage:
//   node make-transparent.mjs                 # process all images in the dir
//   node make-transparent.mjs <file...>       # process specific files
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets", "backgrounds");
const IMG_RE = /\.(png|jpe?g|webp)$/i;

/** Load sharp from the repo, the dsh profile, or fail with install guidance. */
async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch { /* fall through */ }
  const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
  try {
    const req = createRequire(pathToFileURL(path.join(home, "profiles", "web", "package.json")).href);
    return (await import(pathToFileURL(req.resolve("sharp")).href)).default;
  } catch { /* try next */ }
  throw new Error(
    "sharp not found — run `npm i -D sharp` inside this repo, or install pnpm globally so `pnpm add -D sharp` works here"
  );
}

// whiteness tolerance: a pixel is "white-ish" when its max channel is >= WHITE_MIN
const WHITE_MIN = 243;
// feather: how many units below WHITE_MIN a boundary pixel's alpha ramps to 0
const FEATHER = 26;

function processImage(raw, info) {
  const data = raw; // already the RGBA pixel buffer
  const ch = info.channels; // 4 (ensureAlpha)
  const W = info.width, H = info.height;
  const n = W * H;
  const visited = new Uint8Array(n);
  const stack = new Int32Array(n);
  let top = 0;

  const isWhite = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return 255 - (r > g ? (r > b ? r : b) : (g > b ? g : b)) <= 255 - WHITE_MIN;
  };

  // seed: all border pixels that are white-ish
  const seed = (x, y) => {
    const i = (y * W + x) * ch;
    if (!visited[y * W + x] && isWhite(i)) {
      visited[y * W + x] = 1;
      stack[top++] = y * W + x;
    }
  };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }

  // flood fill (4-connected)
  while (top > 0) {
    const p = stack[--top];
    const x = p % W, y = (p / W) | 0;
    if (x > 0) { const q = p - 1; if (!visited[q] && isWhite(q * ch)) { visited[q] = 1; stack[top++] = q; } }
    if (x < W - 1) { const q = p + 1; if (!visited[q] && isWhite(q * ch)) { visited[q] = 1; stack[top++] = q; } }
    if (y > 0) { const q = p - W; if (!visited[q] && isWhite(q * ch)) { visited[q] = 1; stack[top++] = q; } }
    if (y < H - 1) { const q = p + W; if (!visited[q] && isWhite(q * ch)) { visited[q] = 1; stack[top++] = q; } }
  }

  // mask: background -> alpha 0; boundary ring -> whiteness feather
  const whitePx = new Uint8Array(n);
  for (let p = 0; p < n; p++) whitePx[p] = visited[p] ? 255 : 0;
  for (let p = 0; p < n; p++) {
    if (visited[p]) { data[p * ch + 3] = 0; continue; }
    // boundary if any 4-neighbor is background
    const x = p % W, y = (p / W) | 0;
    const near = (x > 0 && visited[p - 1]) || (x < W - 1 && visited[p + 1]) ||
                 (y > 0 && visited[p - W]) || (y < H - 1 && visited[p + W]);
    if (near) {
      const i = p * ch;
      const maxc = Math.max(data[i], data[i + 1], data[i + 2]);
      const t = Math.max(0, Math.min(1, (WHITE_MIN - maxc) / FEATHER));
      data[i + 3] = Math.round(data[i + 3] * t);
    }
  }

  const removed = whitePx.reduce((a, v) => a + (v === 255 ? 1 : 0), 0);
  return { removed, total: n };
}

async function processFile(file) {
  const full = path.join(DIR, file);
  const out = path.join(DIR, file.replace(/\.[^.]+$/, "") + ".webp");
  try {
    const sharp = await loadSharp();
    // read the input fully first so no file handle lingers (Windows locks the
    // same-path read/write otherwise)
    const input = fs.readFileSync(full);
    const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { removed, total } = processImage(data, info);
    const buf = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .webp({ quality: 88, effort: 4 })
      .toBuffer();
    const tmp = `${out}.tmp`;
    fs.writeFileSync(tmp, buf);
    try { fs.unlinkSync(out); } catch { /* target may not exist yet */ }
    fs.renameSync(tmp, out);
    const pct = (removed / total * 100).toFixed(1);
    console.log(`${file.padEnd(50)} -> ${path.basename(out).padEnd(50)} bg-removed ${pct}%  (${buf.length} bytes)`);
    if (out !== full) fs.unlinkSync(full);
    return true;
  } catch (e) {
    console.error(`FAIL ${file}: ${e.message}`);
    return false;
  }
}

const targets = process.argv.slice(2);
const files = targets.length > 0 ? targets : fs.readdirSync(DIR).filter((f) => IMG_RE.test(f));
let ok = 0;
for (const f of files) if (await processFile(f)) ok++;
console.log(`\ndone: ${ok}/${files.length} processed -> ${DIR}`);
