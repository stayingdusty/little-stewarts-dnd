import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(appRoot, '../campaigns/the-dark-arcs/world');
const dataRoot = path.join(appRoot, 'site/data/world');

await mkdir(dataRoot, { recursive: true });

for (const name of ['lore-cosmology-mythology.json', 'old-world-encounters.json']) {
  const value = JSON.parse(await readFile(path.join(sourceRoot, name), 'utf8'));
  await writeFile(path.join(dataRoot, name), `${JSON.stringify(value, null, 2)}\n`);
}

console.log('Published structured lore, world map, and encounters.');
