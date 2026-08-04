import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addAnchorsToHtml } from './source-doc-utils.mjs';

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

const dmGuardMarkup = `
    <style>html:not(.dm-unlocked) body{display:none}</style>
    <script src="../../../dm-doc-guard.js"></script>`;

const addDmGuard = (html) => html.includes('dm-doc-guard.js')
  ? html
  : html.replace(/<\/head>/i, `${dmGuardMarkup}\n  </head>`);

const writeDirectoryIndex = async (dirPath, title, dmOnly = false) => {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name)
    .sort();

  const links = htmlFiles.map((name) => `<li><a href="./${name}">${name}</a></li>`).join('');
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>body{font-family:system-ui,sans-serif;max-width:48rem;margin:2rem auto;padding:0 1rem;line-height:1.5;}a{color:#2563eb;}</style>${dmOnly ? dmGuardMarkup : ''}
  </head>
  <body>
    <h1>${title}</h1>
    <p>Source documents for this section.</p>
    <ul>${links}</ul>
  </body>
</html>`;

  await writeFile(path.join(dirPath, 'index.html'), html);
};

const copyAnchoredSourceDocs = async () => {
  const sourceRoot = path.resolve(root, '../DND-Source-Docs/the-dark-arcs');
  const outputRoot = path.join(root, 'site/source-docs/the-dark-arcs');
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const walk = async (dirPath, dmOnly = false) => {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, dmOnly);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const relativePath = path.relative(sourceRoot, fullPath);
        const outputPath = path.join(outputRoot, relativePath);
        await mkdir(path.dirname(outputPath), { recursive: true });
        const html = await readFile(fullPath, 'utf-8');
        const anchoredHtml = addAnchorsToHtml(html);
        await writeFile(outputPath, dmOnly ? addDmGuard(anchoredHtml) : anchoredHtml);
      }
    }
  };

  const sourceDirectories = ['characters', 'playthrough-summaries'];
  for (const directory of sourceDirectories) {
    const sourceDirectory = path.join(sourceRoot, directory);
    const dmOnly = directory === 'world';
    await walk(sourceDirectory, dmOnly);
    await writeDirectoryIndex(path.join(outputRoot, directory), directory, dmOnly);
  }

  const rootIndex = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Dark Arcs campaign documents</title></head><body><h1>The Dark Arcs campaign documents</h1><ul><li><a href="./characters/">Character sheets</a></li><li><a href="./playthrough-summaries/">Playthrough summaries</a></li><li><a href="../../../world/index.html">Generated DM world documents (spoiler mode required)</a></li></ul></body></html>`;
  await writeFile(path.join(outputRoot, 'index.html'), rootIndex);
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
      aliases: item.aliases || [],
      visibility: item.visibility,
      sourceType: item.source?.type || '',
      sourcePath: item.source?.path || '',
      sourceAnchor: item.source?.anchor || '',
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
      visibility: event.visibility,
      source: event.source,
      chapter: event.source?.chapter || 0
    }, 'canon'))
  ];

  await copyAnchoredSourceDocs();

  const outputDir = path.join(root, 'site/data');
  await mkdir(outputDir, { recursive: true });

  await writeFile(path.join(outputDir, 'entities.json'), JSON.stringify(entities, null, 2));
  await writeFile(path.join(outputDir, 'canon-events.json'), JSON.stringify(canonEvents, null, 2));
  await writeFile(path.join(outputDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

  const dmCount = searchIndex.filter((record) => record.visibility === 'dm-only').length;
  console.log(`Generated ${searchIndex.length} searchable records (${dmCount} DM-only).`);
};

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
