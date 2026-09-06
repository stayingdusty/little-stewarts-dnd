import test from 'node:test';
import assert from 'node:assert/strict';
import { getSourceDocNavGroups } from '../site/source-docs-nav.js';

test('character navigation opens generated sheets backed by structured data', () => {
  const characterGroup = getSourceDocNavGroups().find((group) => group.title === 'Character sheets');
  const characterLinks = characterGroup.branches.flatMap((branch) => branch.items);

  assert.ok(characterLinks.length > 0);
  for (const item of characterLinks) {
    assert.match(item.href, /^\.\/characters\/index\.html#[a-z0-9-]+$/);
  }
});
