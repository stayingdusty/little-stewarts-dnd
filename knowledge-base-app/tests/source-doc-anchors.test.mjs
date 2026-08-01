import test from 'node:test';
import assert from 'node:assert/strict';
import { addAnchorsToHtml } from '../scripts/source-doc-utils.mjs';

test('addAnchorsToHtml injects ids for heading text', () => {
  const html = '<h2>Character Overview</h2><p>Example</p>';
  const withAnchors = addAnchorsToHtml(html);

  assert.match(withAnchors, /<h2[^>]*id="character-overview"/);
});
