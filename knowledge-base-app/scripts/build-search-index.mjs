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
  'data/normalized/secrets/secrets.json',
  'data/normalized/inventory/inventory-items.json'
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

  const buildSearchRecord = (item, kindOverride) => {
    const kind = kindOverride || item.domain;
    const extraText = [
      item.name,
      item.summary,
      item.details,
      item.description,
      item.inventory,
      item.equipment,
      item.notes,
      item.aliases || [],
      item.tags || []
    ].flat().filter(Boolean);

    return {
      id: item.id,
      kind,
      name: item.name,
      summary: item.summary,
      tags: item.tags || [],
      sourcePath: item.source?.path || '',
      timelineValue: Number(item.source?.chapter || item.chapter || item.source?.arc || 0),
      searchableText: normalizeText(extraText.join(' '))
    };
  };

  const searchIndex = [
    ...entities.map((item) => buildSearchRecord(item)),
    ...canonEvents.map((event) => buildSearchRecord({
      id: event.id,
      name: event.title,
      summary: event.summary,
      details: [event.participants, event.locations, event.secretsRevealed].flat().join(' '),
      tags: ['canon', `arc-${event.source?.arc || 'unknown'}`, `chapter-${event.source?.chapter || 'unknown'}`],
      source: event.source,
      chapter: event.source?.chapter || 0
    }, 'canon'))
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
