import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(appRoot, '../campaigns/the-dark-arcs/sessions');
const outputDir = path.join(appRoot, 'site/data/playthrough-summaries');
const manifestPath = path.join(appRoot, 'site/data/playthrough-summaries.json');

const readRecords = async () => {
  const records = [];
  for (const arcEntry of await readdir(sourceRoot, { withFileTypes: true })) {
    if (!arcEntry.isDirectory()) continue;
    const arcDir = path.join(sourceRoot, arcEntry.name);
    for (const name of (await readdir(arcDir)).filter((entry) => /^chapter-\d+\.json$/.test(entry)).sort()) {
      records.push(JSON.parse(await readFile(path.join(arcDir, name), 'utf8')));
    }
  }
  return records.sort((a, b) => a.arc - b.arc || a.chapter - b.chapter);
};

const publish = async () => {
  const records = await readRecords();
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  for (const record of records) {
    await writeFile(path.join(outputDir, `${record.id}.json`), JSON.stringify(record, null, 2) + '\n');
  }

  const manifest = records.map((record) => ({
    id: record.id,
    title: record.title,
    arc: record.arc,
    chapter: record.chapter,
    visibility: record.visibility,
    path: `data/playthrough-summaries/${record.id}.json`,
    documentRoute: `playthrough-summaries/index.html#${record.source.anchor}`
  }));
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Published ${records.length} structured playthrough summary record(s) for app rendering.`);
};

publish().catch((error) => {
  console.error(error);
  process.exit(1);
});
