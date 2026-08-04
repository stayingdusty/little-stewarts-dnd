import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const summaryDir = path.join(repoRoot, 'campaigns/the-dark-arcs/sessions/arc-01');

test('all migrated Arc 1 summaries have structured sections and generated routes', async () => {
  const names = (await readdir(summaryDir)).filter((name) => /^chapter-\d+\.json$/.test(name)).sort();
  assert.equal(names.length, 9);

  for (const [index, name] of names.entries()) {
    const record = JSON.parse(await readFile(path.join(summaryDir, name), 'utf8'));
    assert.equal(record.arc, 1);
    assert.equal(record.chapter, index + 1);
    assert.equal(record.visibility, 'player');
    assert.equal(record.source.type, 'generated_playthrough_summary');
    assert.equal(record.source.path, 'playthrough-summaries/index.html');
    assert.ok(record.summary);
    assert.ok(record.majorOutcome);
    assert.ok(record.sections.length > 0);
    assert.ok(record.sections.every((section) => section.heading && section.bodyHtml));
  }
});

test('published summary manifest points every chapter at the shared renderer', async () => {
  const manifest = JSON.parse(await readFile(path.join(repoRoot, 'knowledge-base-app/site/data/playthrough-summaries.json'), 'utf8'));
  assert.equal(manifest.length, 9);
  assert.ok(manifest.every((entry) => entry.documentRoute === `playthrough-summaries/index.html#${entry.id}`));
});
