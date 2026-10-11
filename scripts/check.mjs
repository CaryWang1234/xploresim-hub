// Static guard for the hub page. No dependencies. The page is a signpost, so the
// guard checks three things: the file is intact, the links are real, and the numbers
// it prints are still the numbers the source repos print.
// Run: npm run check        (SKIP_NET=1 npm run check to skip the reachability HEAD)
import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const FILES = ['index.html', '404.html'];
// The two season sites. These URLs are the product of this page; a typo here is a dead entry.
const LIVE = [
  'https://frc-rebuilt-tactics-0ssdesrlvzc.qoder.zone/',
  'https://frc-reefscape-tactics-0ssdesrlvzc.qoder.zone/',
];

let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}

const src = {};
for (const f of FILES) src[f] = await readFile(new URL(`../${f}`, import.meta.url), 'utf8');

for (const [f, html] of Object.entries(src)) {
  await check(`${f}: UTF-8 clean (no BOM, no replacement chars)`, () => {
    assert.ok(!html.startsWith('\uFEFF'), 'has BOM');
    assert.ok(!html.includes('\uFFFD'), 'contains U+FFFD — the file is not valid UTF-8');
    assert.equal(Buffer.from(html, 'utf8').toString('utf8'), html, 'round-trip mismatch');
  });

  await check(`${f}: every external link is https and opens safely`, () => {
    for (const m of html.matchAll(/<a [^>]*href="(http[^"]+)"/g)) {
      assert.match(m[1], /^https:\/\//, `not https: ${m[1]}`);
      const tag = html.slice(m.index, m.index + 300);
      assert.match(tag.split('>')[0], /rel="[^"]*noopener/, `missing rel=noopener: ${m[1]}`);
    }
  });

  await check(`${f}: balanced block tags`, () => {
    for (const tag of ['html', 'body', 'div', 'section', 'article', 'main', 'header', 'footer',
      'ul', 'li', 'details', 'summary', 'svg', 'style', 'head']) {
      const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
      const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      assert.equal(open, close, `<${tag}>: ${open} open vs ${close} close`);
    }
  });

  await check(`${f}: no webfont / CDN / JS dependency`, () => {
    assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(html), 'pulls Google Fonts');
    // No <script> tag, and no JS event-handler attributes either — the page must be
    // readable by a browser that runs nothing.
    assert.ok(!/<script/.test(html), 'ships a <script>');
    assert.ok(!/\son(click|load|error|mouse\w+|key\w+)\s*=/.test(html), 'ships an inline event handler');
    assert.ok(!/rel="stylesheet"/.test(html), 'links an external stylesheet');
    // var() is not resolved inside SVG presentation attributes, only inside style="".
    assert.ok(!/="var\(--/.test(html), 'CSS variable used inside a presentation attribute');
  });
}

await check('index.html: both season entry points are present', () => {
  for (const url of LIVE) assert.ok(src['index.html'].includes(url), `missing ${url}`);
  assert.equal((src['index.html'].match(/class="go"/g) || []).length, 2, 'expected 2 entry buttons');
});

await check('index.html: the figures it states are the source repos\' figures', () => {
  // 2026: README.md of XploreSim_dev. 2025: reefscape/README.md + its calibration note.
  for (const n of ['627', '615.7', '79.7', 'n=96', '276', '271.4', '87.4', '48'])
    assert.ok(src['index.html'].includes(n), `missing ${n}`);
  // The 2025 page must not be sold as a planner: its build has no search layer.
  assert.doesNotMatch(src['index.html'], /REEFSCAPE[^<]*规划器可用/);
  assert.match(src['index.html'], /规划器 = Stage 2/);
});

await check('CNAME points at the domain this page is bound to', async () => {
  const cname = await readFile(new URL('../CNAME', import.meta.url), 'utf8');
  assert.equal(cname.trim(), 'xploresim.salmoncat0304.xyz');
  assert.ok(src['index.html'].includes(cname.trim()), 'the page does not name its own domain');
});

if (!process.env.SKIP_NET) {
  for (const url of LIVE) {
    await check(`live: ${url}`, async () => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      assert.equal(res.status, 200, `HTTP ${res.status}`);
      const body = await res.text();
      assert.match(body, /XploreSim/, 'served page is not the simulator');
    });
  }
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
