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

  await check(`${f}: English only`, () => {
    // The page is written for readers outside the Chinese-font fallback chain, so a stray CJK character is
    // a bug in the copy, not a font problem: match ideographs and CJK punctuation, not § or the em dash.
    const cjk = html.match(/[\u3000-\u303f\u4e00-\u9fff\uff01-\uff5e]/g);
    assert.equal(cjk, null, `CJK text found: ${[...new Set(cjk || [])].join(' ')}`);
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

await check('index.html: the figures it states are the source repos\' figures', async () => {
  // The hub is a signpost, so its numbers are only honest if the repos beside it still print them.
  // Each pair is [source README, the figures the hub copies from it]; a figure that drifted on either
  // side fails here rather than living on the front page.
  const SOURCES = [
    ['../../XploreSim_dev/README.md', ['627', '615.7', '79.7', 'n=96']],
    ['../../XploreSim_dev/reefscape/README.md', ['237-225', '156 CORAL', '42 ALGAE', '30 BARGE', '265.4 ± 1.7', '263.5 ± 2.4', '1.85 ± 2.29', '130.7 ± 6.1', '8.5 ± 1.9', '8.4 CORAL', '9.5 deposits a MATCH', '26.4 ± 2.3', '6.1 ± 4.1', '5.3 ± 3.5', '8.2 ± 4.6', '17.0 to 14.4', '1.29 ± 0.29', '1.00 ± 0.25', '8.1 ± 1.4', '2.6 ± 1.6', '28.83 ± 2.74', '56.3', '56.0', '240.1', '260.56', '1.70 ± 0.74', '17 to 13', '95531e05', '1bee40b6', 'f32cee33', '86ddb30e', 'netLaneSpread', 'netCapacity', '13.2 ± 2.3', '7.6 ± 2.4', '16.3 ± 2.4', '7.1 ± 2.6', '7.0 ± 1.7', '7.5 ± 2.3', '17.31', '7.23', '0.83', '1.82', 'up to five points']],
  ];
  for (const [from, nums] of SOURCES) {
    let text;
    try {
      text = await readFile(new URL(from, import.meta.url), 'utf8');
    } catch {
      // Cloning the hub alone is legitimate, so say what was not checked instead of failing on it.
      console.log(`       (not checked: ${from} is not checked out beside the hub)`);
      continue;
    }
    for (const n of nums) {
      assert.ok(src['index.html'].includes(n), `the hub does not print ${n}`);
      assert.ok(text.includes(n), `${n} is on the hub but not in ${from} — one of the two drifted`);
    }
  }
  // Stage 2 shipped, so the hub must not still carry the "planner is Stage 2" placeholder. What it must also
  // keep saying is the unfavourable half of the result: on this seed construction an identical pairing is worth
  // up to five points to whichever side is served first, and the re-plan has not yet bought a separable gain.
  // If that qualifier ever disappears from the front page, the card is selling something the measurements do not
  // support.
  assert.doesNotMatch(src['index.html'], /planner = Stage 2/);
  assert.match(src['index.html'], /being served first is worth up to five points/);
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
