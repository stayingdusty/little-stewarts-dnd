import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const domainFiles = [
  'data/normalized/characters/characters.json',
  'data/normalized/npcs/npcs.json',
  'data/normalized/locations/locations.json',
  'data/normalized/encounters/encounters.json',
  'data/normalized/lore/lore.json',
  'data/normalized/secrets/secrets.json'
];

const canonFile = 'data/normalized/canon/canon_events.json';

const readJson = async (relativePath) => {
  const fullPath = path.join(root, relativePath);
  const content = await readFile(fullPath, 'utf-8');
  return JSON.parse(content);
};

const normalizeText = (value) => String(value ?? '').toLowerCase();

const build = async () => {
  const entitiesByDomain = await Promise.all(domainFiles.map((file) => readJson(file)));
  const entities = entitiesByDomain.flat();
  const canonEvents = await readJson(canonFile);

  const searchIndex = [
    ...entities.map((item) => ({
      id: item.id,
      kind: item.domain,
      name: item.name,
      summary: item.summary,
      tags: item.tags || [],
      sourcePath: item.source?.path || '',
      searchableText: normalizeText([
        item.name,
        item.summary,
        item.details,
        (item.aliases || []).join(' '),
        (item.tags || []).join(' ')
      ].join(' '))
    })),
    ...canonEvents.map((event) => ({
      id: event.id,
      kind: 'canon',
      name: event.title,
      summary: event.summary,
      tags: ['canon', `arc-${event.source?.arc || 'unknown'}`, `chapter-${event.source?.chapter || 'unknown'}`],
      sourcePath: event.source?.path || '',
      searchableText: normalizeText([
        event.title,
        event.summary,
        (event.participants || []).join(' '),
        (event.locations || []).join(' '),
        (event.secretsRevealed || []).join(' ')
      ].join(' '))
    }))
  ];

  const outputDir = path.join(root, 'site/data');
  await mkdir(outputDir, { recursive: true });

  await writeFile(path.join(outputDir, 'entities.json'), JSON.stringify(entities, null, 2));
  await writeFile(path.join(outputDir, 'canon-events.json'), JSON.stringify(canonEvents, null, 2));
  await writeFile(path.join(outputDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

  console.log(`Generated ${searchIndex.length} searchable records.`);
};

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
