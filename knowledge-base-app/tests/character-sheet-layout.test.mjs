import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rendererUrl = new URL('../site/characters/sheet.js', import.meta.url);
const stylesheetUrl = new URL('../site/characters/sheet.css', import.meta.url);

test('page-one powers can continue in the right column', async () => {
  const renderer = await readFile(rendererUrl, 'utf8');

  assert.match(renderer, /data-powers-primary/);
  assert.match(renderer, /data-powers-continuation/);
  assert.match(renderer, /data-powers-overflow/);
  assert.match(renderer, /overflow\.prepend\(powerCards\[index\]\)/);
  assert.match(renderer, /Math\.max\(leftColumn\.scrollHeight, rightColumn\.scrollHeight\)/);
});

test('power cards stay together when printed', async () => {
  const stylesheet = await readFile(stylesheetUrl, 'utf8');

  assert.match(stylesheet, /\.ability\{[^}]*break-inside:avoid[^}]*page-break-inside:avoid/);
});
