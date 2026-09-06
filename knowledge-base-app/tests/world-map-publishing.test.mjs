import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('encounter reference embeds the published interactive Old World map', async () => {
  const worldApp = await readFile(new URL('../site/world/world.js', import.meta.url), 'utf8');

  assert.match(worldApp, /<iframe class="map-embed" src="\.\/old_world_map\.html"/);
  assert.doesNotMatch(worldApp, /<canvas id="worldMap"/);
});

test('published Old World map retains the atlas and DM spoiler deterrent', async () => {
  const map = await readFile(new URL('../site/world/old_world_map.html', import.meta.url), 'utf8');

  assert.match(map, /<svg id="atlas"/);
  assert.match(map, /src="\.\.\/dm-doc-guard\.js"/);
  assert.match(map, /html:not\(\.dm-unlocked\) body\{display:none\}/);
});
