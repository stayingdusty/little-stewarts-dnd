import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractInventoryItemsFromRecord } from './inventory-utils.mjs';
import { createSlug } from './source-doc-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..');

const STRUCTURED_CHAR_DIR = path.join(repoRoot, 'campaigns/the-dark-arcs/characters');
const SUMMARY_DIR = path.join(repoRoot, 'DND-Source-Docs/the-dark-arcs/playthrough-summaries');
const STRUCTURED_WORLD_DIR = path.join(repoRoot, 'campaigns/the-dark-arcs/world');
const CANON_NAMES_PATH = path.join(repoRoot, 'campaigns/the-dark-arcs/canon/names.json');

let canonicalAliases = new Map();

const PARTY_NAMES = ['Calvin', 'Nameloc', 'Fiona', 'Golo', 'Sertraline', 'Queen Flower'];
const LOCATION_ALLOWLIST = new Set([
  'Petaltown',
  'Veylathar',
  'Wayward Flame',
  'Emberhold',
  'Luminary Dome',
  'Ethereal Realm',
  'Material Realm',
  'Crucible District',
  'Academy of Sparks',
  'Academy of Antiquities',
  'Great Tree',
  'Dream Plane',
  'Convergence',
  'Thorn Court',
  'Mirewood Bog',
  'Izdari Sands',
  'Frostgrim',
  'Icewind Port',
  'Dawnmoor',
  'Serenth Canyon',
  'Sunreach',
  'Ethereum Academy',
  'Castle Tower'
]);
const LOCATION_BLOCKLIST_WORDS = [
  'core',
  'shift',
  'important',
  'supports',
  'future',
  'reports',
  'passive',
  'holds',
  'after',
  'once',
  'chapter',
  'arc',
  'item',
  'outstanding'
];

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const stripTags = (html) =>
  decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

const toSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const unique = (values) => [...new Set(values.filter(Boolean))];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const aliasesFor = (name) => canonicalAliases.get(name) || [];
const recordMetadata = (sourcePath, visibility = 'player') => ({
  visibility,
  canonStatus: 'confirmed',
  evidence: [{ type: 'source-document', path: sourcePath }]
});

const readHtmlFiles = async (dirPath) => {
  const names = await readdir(dirPath);
  const htmlNames = names.filter((name) => name.endsWith('.html')).sort((a, b) => a.localeCompare(b));
  const pairs = await Promise.all(
    htmlNames.map(async (name) => {
      const fullPath = path.join(dirPath, name);
      const html = await readFile(fullPath, 'utf-8');
      return { name, fullPath, html };
    })
  );
  return pairs;
};

const readStructuredCharacterRecords = async () => {
  const names = await readdir(STRUCTURED_CHAR_DIR).catch(() => []);
  const records = [];

  for (const name of names.filter((entry) => entry.endsWith('.json')).sort((a, b) => a.localeCompare(b))) {
    const record = JSON.parse(await readFile(path.join(STRUCTURED_CHAR_DIR, name), 'utf8'));
    const anchor = record.source?.anchor || createSlug(record.name);
    records.push({
      ...record,
      source: {
        ...record.source,
        type: 'generated_character_sheet',
        path: 'characters/index.html',
        anchor
      }
    });
  }

  return records;
};

const readStructuredWorldRecords = async () => {
  const tracker = JSON.parse(await readFile(path.join(STRUCTURED_WORLD_DIR, 'old-world-encounters.json'), 'utf8'));
  const loreDocument = JSON.parse(await readFile(path.join(STRUCTURED_WORLD_DIR, 'lore-cosmology-mythology.json'), 'utf8'));
  const source = (document, anchor) => ({
    type: 'generated_world_document',
    path: `world/index.html?document=${document}#${anchor}`,
    anchor
  });

  const encounters = tracker.encounters.map((encounter) => ({
    id: encounter.id,
    domain: 'encounter',
    name: encounter.name,
    summary: encounter.hook,
    details: [encounter.location, encounter.roster, encounter.battlefield, encounter.motivation, encounter.alternateEndings, encounter.reward].filter(Boolean).join(' '),
    aliases: [],
    tags: encounter.tags,
    relatedIds: [],
    visibility: encounter.visibility,
    canonStatus: encounter.canonStatus,
    evidence: tracker.evidence,
    source: source('encounters', encounter.id)
  }));

  const blockText = (blocks) => blocks.flatMap((block) => [block.text, block.headers, block.rows, block.items]).flat(3).filter(Boolean).join(' ');
  const lore = loreDocument.sections.map((section) => ({
    id: `lore-${section.id}`,
    domain: 'lore',
    name: section.title,
    summary: blockText(section.blocks).slice(0, 240),
    details: blockText(section.blocks),
    aliases: [],
    tags: [...loreDocument.tags, section.id],
    relatedIds: [],
    visibility: loreDocument.visibility,
    canonStatus: loreDocument.canonStatus,
    evidence: loreDocument.evidence,
    source: source('lore', section.id)
  }));

  return { encounters, lore, secrets: [] };
};

const collectLocationCandidates = (text) => {
  const locationWords = [
    'town',
    'village',
    'city',
    'port',
    'woods',
    'wood',
    'forest',
    'road',
    'pass',
    'sands',
    'bog',
    'cliffs',
    'canyon',
    'dome',
    'realm',
    'plane',
    'court',
    'hold',
    'convergence'
  ];

  const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g) || [];

  return unique(
    matches.filter((name) => {
      const lower = name.toLowerCase();
      if (PARTY_NAMES.some((party) => party.toLowerCase() === lower)) return false;
      if (name.length < 4) return false;
      if (LOCATION_BLOCKLIST_WORDS.some((word) => lower.includes(word))) return false;
      if (LOCATION_ALLOWLIST.has(name)) return true;
      return locationWords.some((word) => lower.includes(word));
    })
  );
};

const extractCanonAndLocationsAndNpcs = async (characterRecords) => {
  const files = await readHtmlFiles(SUMMARY_DIR);
  const canonEvents = [];
  const locationSet = new Set();
  const npcMap = new Map();

  const characterByName = new Map();
  for (const character of characterRecords) {
    characterByName.set(character.name.toLowerCase(), character.id);
    for (const alias of character.aliases || []) {
      characterByName.set(alias.toLowerCase(), character.id);
    }
  }

  const ensureNpc = (name, summary, sourcePath, metadata = {}) => {
    const id = `npc-${toSlug(name)}`;
    if (!npcMap.has(id)) {
      npcMap.set(id, {
        id,
        domain: 'npc',
        name,
        summary,
        details: summary,
        ...metadata,
        aliases: aliasesFor(name),
        tags: ['npc', 'arc-1'],
        relatedIds: [],
        ...recordMetadata(sourcePath),
        source: {
          type: 'playthrough_summary',
          path: sourcePath
        }
      });
    }
  };

  for (const { name, html } of files) {
    const sourcePath = `DND-Source-Docs/the-dark-arcs/playthrough-summaries/${name}`;
    const chapterTitle = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || name.replace(/\.html$/, ''));
    const chapterSnapshot = stripTags((html.match(/<h3>Chapter Snapshot<\/h3>\s*<p>([\s\S]*?)<\/p>/i) || [])[1] || '');
    const majorOutcome = stripTags((html.match(/<h3>Major Outcome<\/h3>\s*<p>([\s\S]*?)<\/p>/i) || [])[1] || '');
    const bodyText = stripTags(html);

    const titleMatch = name.match(/arc_(\d+)_chapter_(\d+)_/i);
    const arc = titleMatch ? titleMatch[1] : '1';
    const chapter = titleMatch ? titleMatch[2] : '0';

    const participants = [];
    for (const [label, id] of characterByName.entries()) {
      const regex = new RegExp(`\\b${escapeRegex(label)}\\b`, 'i');
      if (regex.test(bodyText)) participants.push(id);
    }

    const titleLocations = chapterTitle
      .split(':')
      .slice(1)
      .join(':')
      .split(/\bto\b|\bfrom\b|&|,|\//i)
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => LOCATION_ALLOWLIST.has(part));

    const locations = unique([...collectLocationCandidates(bodyText), ...titleLocations]).filter(
      (loc) => LOCATION_ALLOWLIST.has(loc)
    );
    locations.forEach((loc) => locationSet.add(loc));

    const npcRules = [
      ['man in the white suit', 'Jerry Mander', 'The recurring antagonist publicly known as the Man in the White Suit.'],
      ['jerry mander', 'Jerry Mander', 'A recurring figure tied to Dark Arc routes and deceptive trails.'],
      ['burgle', 'Burgle', 'An amphibious fish-person who hoards shiny objects and later becomes an ally.'],
      ['dr. fizzlebig', 'Dr. Fizzlebig', 'A scholar tied to security structures and dark arc investigations.'],
      ['dr fizzlebig', 'Dr. Fizzlebig', 'A scholar tied to security structures and dark arc investigations.'],
      ['garoth', 'Garoth', 'A major security figure with key intelligence about dark arc anomalies.'],
      ['frederick', 'Frederick', 'A trusted local ally connected to the party\'s city life in Veylathar.'],
      ['tindily migrot', 'Tindily Migrot', 'A figure tied to the ancient pendant and Academy of Antiquities council dynamics.', { pronouns: 'she/her' }]
    ];
    for (const [needle, npcName, description, metadata] of npcRules) {
      if (bodyText.toLowerCase().includes(needle)) {
        ensureNpc(npcName, description, sourcePath, metadata);
      }
    }

    canonEvents.push({
      id: `canon-arc${arc}-chapter${chapter}`,
      title: chapterTitle,
      summary: [chapterSnapshot, majorOutcome].filter(Boolean).join(' '),
      participants: unique(participants),
      locations,
      visibility: 'player',
      canonStatus: 'confirmed',
      evidence: [{ type: 'playthrough-summary', path: sourcePath }],
      source: {
        path: sourcePath,
        arc,
        chapter,
        anchor: createSlug(chapterTitle)
      }
    });
  }

  const locations = [...locationSet]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      id: `location-${toSlug(name)}`,
      domain: 'location',
      name,
      summary: `Location referenced in Arc 1 source material: ${name}.`,
      details: 'Extracted from playthrough summaries and world references.',
      aliases: aliasesFor(name),
      tags: ['location', 'arc-1'],
      relatedIds: [],
      ...recordMetadata('DND-Source-Docs/the-dark-arcs/playthrough-summaries/'),
      source: {
        type: 'playthrough_summary',
        path: 'DND-Source-Docs/the-dark-arcs/playthrough-summaries/'
      }
    }));

  const npcs = [...npcMap.values()];
  if (!npcs.some((npc) => npc.name === 'Jerry Mander')) {
    npcs.push({
      id: 'npc-jerry-mander',
      domain: 'npc',
      name: 'Jerry Mander',
      summary: 'Mysterious passenger introduced early and intended to recur.',
      details: 'Foreshadowed as an unresolved thread in Chapter 1.',
      aliases: aliasesFor('Jerry Mander'),
      tags: ['npc', 'arc-1', 'mystery'],
      relatedIds: [],
      ...recordMetadata('DND-Source-Docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_1_playthrough_summary.html'),
      source: {
        type: 'playthrough_summary',
        path: 'DND-Source-Docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_1_playthrough_summary.html'
      }
    });
  }

  return { canonEvents, locations, npcs };
};

const writeJson = async (relativePath, value) => {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, JSON.stringify(value, null, 2) + '\n');
};

const sortByName = (items) => [...items].sort((a, b) => a.name.localeCompare(b.name));

const main = async () => {
  const canonNames = JSON.parse(await readFile(CANON_NAMES_PATH, 'utf8'));
  canonicalAliases = new Map(canonNames.records.map((record) => [record.canonical, record.aliases || []]));

  const characters = await readStructuredCharacterRecords();
  const { encounters, lore, secrets: loreSecrets } = await readStructuredWorldRecords();
  const { canonEvents, locations, npcs } = await extractCanonAndLocationsAndNpcs(characters);

  const inventoryItems = characters.flatMap((character) => extractInventoryItemsFromRecord(character));

  const secrets = sortByName(loreSecrets);

  await writeJson('data/normalized/characters/characters.json', sortByName(characters));
  await writeJson('data/normalized/npcs/npcs.json', sortByName(npcs));
  await writeJson('data/normalized/locations/locations.json', sortByName(locations));
  await writeJson('data/normalized/inventory/inventory-items.json', sortByName(inventoryItems));
  await writeJson('data/normalized/encounters/encounters.json', sortByName(encounters));
  await writeJson('data/normalized/lore/lore.json', sortByName(lore));
  await writeJson('data/normalized/secrets/secrets.json', secrets);
  await writeJson('data/normalized/canon/canon_events.json', canonEvents.sort((a, b) => Number(a.source.chapter) - Number(b.source.chapter)));

  console.log(
    [
      `characters=${characters.length}`,
      `npcs=${npcs.length}`,
      `locations=${locations.length}`,
      `encounters=${encounters.length}`,
      `lore=${lore.length}`,
      `secrets=${secrets.length}`,
      `canonEvents=${canonEvents.length}`
    ].join(' ')
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
