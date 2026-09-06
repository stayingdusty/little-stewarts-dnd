import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const legacyWorldRoot = path.resolve(appRoot, '../DND-Source-Docs/the-dark-arcs/world');
const sourceRoot = path.resolve(appRoot, '../campaigns/the-dark-arcs/world');
const dataRoot = path.join(appRoot, 'site/data/world');
const worldSiteRoot = path.join(appRoot, 'site/world');

await mkdir(dataRoot, { recursive: true });

for (const name of ['lore-cosmology-mythology.json', 'old-world-encounters.json']) {
  const value = JSON.parse(await readFile(path.join(sourceRoot, name), 'utf8'));
  await writeFile(path.join(dataRoot, name), `${JSON.stringify(value, null, 2)}\n`);
}

const mapSource = await readFile(path.join(legacyWorldRoot, 'old_world_map.html'), 'utf8');
const guardedMap = mapSource.replace(
  '</head>',
  '  <style>html:not(.dm-unlocked) body{display:none}</style>\n  <script src="../dm-doc-guard.js"></script>\n</head>'
);
await mkdir(worldSiteRoot, { recursive: true });
await writeFile(path.join(worldSiteRoot, 'old_world_map.html'), guardedMap);

console.log('Published structured lore, world map, and encounters.');
