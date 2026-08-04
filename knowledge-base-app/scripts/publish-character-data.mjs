import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSlug } from './source-doc-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');

const characterSourceDir = path.join(repoRoot, 'campaigns/the-dark-arcs/characters');
const characterOutputDir = path.join(appRoot, 'site/data/characters');
const manifestOutputPath = path.join(appRoot, 'site/data/characters.json');

const readCharacterRecords = async () => {
  const names = await readdir(characterSourceDir).catch(() => []);
  const jsonNames = names.filter((name) => name.endsWith('.json')).sort((a, b) => a.localeCompare(b));
  const records = [];

  for (const name of jsonNames) {
    const record = JSON.parse(await readFile(path.join(characterSourceDir, name), 'utf8'));
    const sourceAnchor = record.source?.anchor || createSlug(record.name);
    records.push({
      ...record,
      source: {
        ...record.source,
        type: 'generated_character_sheet',
        path: 'characters/index.html',
        anchor: sourceAnchor
      },
      sheetRoute: `characters/index.html#${sourceAnchor}`
    });
  }

  return records;
};

const publish = async () => {
  const records = await readCharacterRecords();

  await rm(characterOutputDir, { recursive: true, force: true });
  await mkdir(characterOutputDir, { recursive: true });
  await mkdir(path.dirname(manifestOutputPath), { recursive: true });

  for (const record of records) {
    await writeFile(
      path.join(characterOutputDir, `${record.source.anchor}.json`),
      JSON.stringify(record, null, 2) + '\n'
    );
  }

  const manifest = records.map((record) => ({
    id: record.id,
    name: record.name,
    visibility: record.visibility,
    sourceAnchor: record.source.anchor,
    path: `data/characters/${record.source.anchor}.json`,
    sheetRoute: record.sheetRoute
  }));

  await writeFile(manifestOutputPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Published ${records.length} structured character record(s) for app rendering.`);
};

publish().catch((error) => {
  console.error(error);
  process.exit(1);
});
