// CSS/markup cross-check: brace balance in the inline <style>, plus the two directions
// of a broken stylesheet — a rule that targets nothing, and a class the markup uses but
// nothing styles. Run: node scripts/check_style.mjs
import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

for (const f of ['index.html', '404.html']) {
  const html = await readFile(new URL(`../${f}`, import.meta.url), 'utf8');
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];

  check(`${f}: style block braces balance`, () => {
    assert.equal(style.split('{').length, style.split('}').length, 'unbalanced { }');
    assert.ok(!/;;/.test(style), 'double semicolon');
    assert.ok(!/:\s*;/.test(style), 'empty declaration value');
  });

  check(`${f}: every class rule targets markup that exists`, () => {
    const used = new Set(html.replace(/<style>[\s\S]*?<\/style>/, '').match(/class="([^"]*)"/g)
      .flatMap(m => m.slice(7, -1).split(/\s+/)));
    const targeted = [...style.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]);
    const dead = [...new Set(targeted)].filter(c => !used.has(c));
    assert.equal(dead.length, 0, `dead rules: ${dead.join(', ')}`);
  });

  check(`${f}: every class in markup is styled`, () => {
    const styled = new Set([...style.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
    const used = new Set(html.replace(/<style>[\s\S]*?<\/style>/, '').match(/class="([^"]*)"/g)
      .flatMap(m => m.slice(7, -1).split(/\s+/)));
    const bare = [...used].filter(c => c && !styled.has(c));
    assert.equal(bare.length, 0, `unstyled classes: ${bare.join(', ')}`);
  });

  check(`${f}: every var(--x) resolves`, () => {
    // A custom property may be declared in the stylesheet or inline on the element
    // (`style="--d:.08s"` feeds the stagger delays), so collect both before judging.
    const declared = new Set([...html.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
    const usedVars = [...html.matchAll(/var\((--[\w-]+)(\s*,[^)]*)?\)/g)];
    const missing = usedVars
      .filter(m => !declared.has(m[1]) && !m[2]) // an explicit fallback is a legitimate default
      .map(m => m[1]);
    assert.equal(missing.length, 0, `undeclared: ${[...new Set(missing)].join(', ')}`);
  });
}

console.log(failed ? `\n${failed} style check(s) failed` : '\nstyle checks passed');
process.exit(failed ? 1 : 0);
