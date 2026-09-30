#!/usr/bin/env node
/**
 * Render the UI gate's screenshots as one page you can scroll (HC-006).
 *
 *   npm run gallery          build e2e/__screenshots__/index.html
 *   npm run gallery -- --md  also print the readings as a markdown table
 *
 * ## Why this exists
 *
 * CI uploads the screenshots as an artefact, and an artefact is a zip of twelve PNGs. Nobody opens
 * twelve PNGs one at a time, which means nobody looks, which means the gate degrades into the
 * automated checks it was built to supplement.
 *
 * One page, in order, with the height printed under each picture. The height is the number that
 * matters: it is the cheap proxy for "this screen shows more than it was meant to", which is the
 * fault that shipped thirty times in the Foundry Studio with every other gate green (FB-124).
 *
 * Adapted from grassmarket's `scripts/ui-gallery.mjs`. No dependencies: the heights come from the
 * manifest the gate writes as it takes each picture (see `e2e/helpers.ts` for why they are measured
 * there and not read off the images).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'e2e/__screenshots__';
const OUT = join(DIR, 'index.html');

/**
 * The measured CSS height of each screen, written by `e2e/helpers.ts` as the picture was taken.
 *
 * NOT read out of the PNG header. The first version did, and reported every phone screen at roughly
 * 2.75 times its real size: the Pixel 5 profile has a device scale factor of 2.75, so a 727px page
 * is a 1,999px image. Both numbers are correct and only one of them is the height, and a gallery
 * whose job is to show "this screen is too tall" cannot show the inflated one.
 */
function readings() {
  try {
    return new Map(
      readFileSync(join(DIR, 'readings.jsonl'), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .map((r) => [r.file, r]),
    );
  } catch {
    return new Map();
  }
}

let files;
try {
  files = readdirSync(DIR).filter((f) => f.endsWith('.png')).sort();
} catch {
  console.error(`${DIR} does not exist. Run the gate first: npm run test:e2e`);
  process.exit(2);
}

if (files.length === 0) {
  console.error(`No screenshots in ${DIR}. Run the gate first: npm run test:e2e`);
  process.exit(2);
}

const measured = readings();
const shots = files.map((file) => {
  const d = measured.get(file) ?? { width: 0, height: 0 };
  // `01-login.png` -> "login", and the numbers order the walkthrough. Anything from 20 up is the
  // phone run, which is how the two viewports stay grouped without a second directory.
  const name = file.replace(/^\d+-/, '').replace(/\.png$/, '');
  const index = Number(file.slice(0, 2));
  return { file, name, ...d, phone: index >= 20 };
});

/**
 * One picture, with its height above it.
 *
 * `width`/`height` carry the CSS reading, NOT the pixel size of the file, and that is deliberate:
 * with `height: auto` in the stylesheet a browser uses the pair only as an aspect ratio, so the
 * image is reserved the right shape before it loads and the page does not jump as you scroll. The
 * ratio is the same either way - a 393x727 page photographed at 2.75x is a 1081x1999 file, which is
 * the same shape to within a rounding error. Checked, not assumed.
 */
const row = (s) => `
  <figure>
    <figcaption>
      <span class="name">${s.name}</span>
      <span class="size">${s.height.toLocaleString()}px tall at ${s.width}px wide</span>
    </figcaption>
    <img src="${s.file}" alt="${s.name}" width="${s.width}" height="${s.height}" loading="lazy" />
  </figure>`;

const desktop = shots.filter((s) => !s.phone);
const phone = shots.filter((s) => s.phone);

const html = `<!doctype html>
<meta charset="utf-8" />
<title>Holy Corner &mdash; the UI gate</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; padding: 2rem 1.5rem 4rem;
    background: #f7f6f2; color: #1c1c1a;
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  h1 { font-size: 1.4rem; font-weight: 500; margin: 0 0 0.25rem; }
  .lede { color: #5b5b55; max-width: 44rem; margin: 0 0 2rem; }
  h2 {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
    color: #5b5b55; margin: 2.5rem 0 1rem; padding-bottom: 0.4rem; border-bottom: 1px solid #ddd9d0;
  }
  .grid { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
  figure { margin: 0; max-width: 100%; }
  figcaption {
    display: flex; justify-content: space-between; gap: 1rem; align-items: baseline;
    padding-bottom: 0.4rem; border-bottom: 1px solid #ddd9d0; margin-bottom: 0.5rem;
  }
  .name { font-weight: 500; }
  .size { font-family: ui-monospace, monospace; font-size: 0.78rem; color: #5b5b55; }
  img { display: block; border: 1px solid #ddd9d0; background: #fff; max-width: 100%; height: auto; }
  .desktop img { width: 46rem; }
  .phone img { width: 15rem; }
</style>
<h1>Holy Corner &mdash; the UI gate</h1>
<p class="lede">
  Every screen, at both sizes, as a picture. The height beside each name is the whole page, not the
  part that fits. Height is the cheap proxy for &ldquo;this shows more than it was meant to&rdquo;,
  which is the one fault every other check in this repository is blind to.
</p>

<h2>Desktop &mdash; 1440 &times; 1000</h2>
<div class="grid desktop">${desktop.map(row).join('')}</div>

<h2>Phone &mdash; 393 &times; 851</h2>
<div class="grid phone">${phone.map(row).join('')}</div>
`;

writeFileSync(OUT, html);
console.log(`gallery: ${shots.length} screenshots → ${OUT}`);

if (process.argv.includes('--md')) {
  console.log('\n| Screen | Desktop 1440×1000 | Phone 393×851 |');
  console.log('|---|---|---|');
  const byName = new Map();
  for (const s of shots) {
    const key = s.name.replace(/^phone-/, '');
    const entry = byName.get(key) ?? { desktop: null, phone: null };
    entry[s.phone ? 'phone' : 'desktop'] = s.height;
    byName.set(key, entry);
  }
  for (const [name, { desktop: d, phone: p }] of byName) {
    console.log(`| \`${name}\` | ${d ? `${d.toLocaleString()}px` : '—'} | ${p ? `${p.toLocaleString()}px` : '—'} |`);
  }
}
