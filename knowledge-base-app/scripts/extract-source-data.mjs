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
const SUMMARY_DIR = path.join(repoRoot, 'campaigns/the-dark-arcs/sessions');
const WORLD_DIR = path.join(repoRoot, 'DND-Source-Docs/the-dark-arcs/world');
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

const extractTagMatches = (html, regex) => {
  const out = [];
  let match;
  while ((match = regex.exec(html))) {
    out.push(stripTags(match[1]));
  }
  return out;
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

const readStructuredSummaryRecords = async () => {
  const records = [];
  for (const arcEntry of await readdir(SUMMARY_DIR, { withFileTypes: true }).catch(() => [])) {
    if (!arcEntry.isDirectory()) continue;
    const arcDir = path.join(SUMMARY_DIR, arcEntry.name);
    const names = (await readdir(arcDir)).filter((name) => /^chapter-\d+\.json$/.test(name)).sort();
    for (const name of names) records.push(JSON.parse(await readFile(path.join(arcDir, name), 'utf8')));
  }
  return records.sort((a, b) => a.arc - b.arc || a.chapter - b.chapter);
};

const extractEncounterRecords = async () => {
  const trackerPath = path.join(WORLD_DIR, 'little_stewarts_old_world_encounters_map_tracker.html');
  const html = await readFile(trackerPath, 'utf-8');

  const rows = [];
  const rowRegex = /<td class="marker">\s*(\d+)\s*<\/td>\s*<td><b>([\s\S]*?)<\/b><br><span>([\s\S]*?)<\/span><\/td>/gi;
  let match;
  while ((match = rowRegex.exec(html))) {
    const idx = Number(match[1]);
    const name = stripTags(match[2]);
    const descriptor = stripTags(match[3]).replace(/\bPedle Town\b/g, 'Petaltown');
    rows.push({ idx, name, descriptor });
  }

  return rows.map(({ idx, name, descriptor }) => ({
    id: `encounter-arc1-map-${idx}`,
    domain: 'encounter',
    name,
    summary: descriptor,
    details: `Encounter marker ${idx} from Old World tracker.`,
    aliases: [],
    tags: unique(['encounter', 'arc-1', ...descriptor.toLowerCase().split(/[^a-z0-9]+/g).filter((w) => w.length > 3).slice(0, 6)]),
    relatedIds: [],
    ...recordMetadata('DND-Source-Docs/the-dark-arcs/world/little_stewarts_old_world_encounters_map_tracker.html', 'dm-only'),
    source: {
      type: 'world_tracker',
      path: 'DND-Source-Docs/the-dark-arcs/world/little_stewarts_old_world_encounters_map_tracker.html'
    }
  }));
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

const extractLoreAndSecrets = async () => {
  const lorePath = path.join(WORLD_DIR, 'lore-cosmology-mythology.html');
  const html = await readFile(lorePath, 'utf-8');

  const lore = [];
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  const sections = [];
  while ((match = h2Regex.exec(html))) {
    sections.push({ title: stripTags(match[1]), index: match.index, end: h2Regex.lastIndex });
  }

  for (let i = 0; i < sections.length; i += 1) {
    const start = sections[i].end;
    const end = i + 1 < sections.length ? sections[i + 1].index : html.length;
    const chunk = html.slice(start, end);
    const paragraph = stripTags((chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '');

    lore.push({
      id: `lore-${toSlug(sections[i].title)}`,
      domain: 'lore',
      name: sections[i].title,
      summary: paragraph || `Lore section: ${sections[i].title}`,
      details: stripTags(chunk).slice(0, 600),
      aliases: [],
      tags: unique(['lore', 'arc-1', ...sections[i].title.toLowerCase().split(/[^a-z0-9]+/g).filter((w) => w.length > 3)]),
      relatedIds: [],
      ...recordMetadata('DND-Source-Docs/the-dark-arcs/world/lore-cosmology-mythology.html', 'dm-only'),
      source: {
        type: 'dm_lore_reference',
        path: 'DND-Source-Docs/the-dark-arcs/world/lore-cosmology-mythology.html'
      }
    });
  }

  const secretBlocks = [
    ...extractTagMatches(html, /<div class="warning">([\s\S]*?)<\/div>/gi),
    ...extractTagMatches(html, /<div class="dm">([\s\S]*?)<\/div>/gi),
    ...extractTagMatches(html, /<div class="outstanding">([\s\S]*?)<\/div>/gi)
  ];

  const secrets = secretBlocks.map((text, index) => ({
    id: `secret-lore-${index + 1}`,
    domain: 'secret',
    name: `DM Secret ${index + 1}`,
    summary: text.slice(0, 200),
    details: text,
    aliases: [],
    tags: ['secret', 'gm-only', 'arc-1'],
    relatedIds: [],
    ...recordMetadata('DND-Source-Docs/the-dark-arcs/world/lore-cosmology-mythology.html', 'dm-only'),
    source: {
      type: 'dm_lore_reference',
      path: 'DND-Source-Docs/the-dark-arcs/world/lore-cosmology-mythology.html'
    }
  }));

  return { lore, secrets };
};

const extractCanonAndLocationsAndNpcs = async (characterRecords, summaryRecords) => {
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

  const ensureNpc = (name, summary, sourcePath, evidencePath, sourceAnchor, metadata = {}) => {
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
        ...recordMetadata(evidencePath),
        source: {
          type: 'generated_playthrough_summary',
          path: sourcePath,
          anchor: sourceAnchor
        }
      });
    }
  };

  for (const summaryRecord of summaryRecords) {
    const sourcePath = summaryRecord.source.path;
    const evidencePath = summaryRecord.evidence[0].path;
    const chapterTitle = summaryRecord.title;
    const chapterSnapshot = summaryRecord.summary;
    const majorOutcome = summaryRecord.majorOutcome;
    const bodyText = [chapterTitle, chapterSnapshot, majorOutcome, ...summaryRecord.sections.map((section) => `${section.heading} ${stripTags(section.bodyHtml)}`)].join(' ');
    const arc = String(summaryRecord.arc);
    const chapter = String(summaryRecord.chapter);

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
        ensureNpc(npcName, description, sourcePath, evidencePath, summaryRecord.source.anchor, metadata);
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
      evidence: [{ type: 'playthrough-summary', path: evidencePath }],
      source: {
        path: sourcePath,
        type: 'generated_playthrough_summary',
        arc,
        chapter,
        anchor: summaryRecord.source.anchor
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
      ...recordMetadata('campaigns/the-dark-arcs/sessions/arc-01/'),
      source: {
        type: 'playthrough_summary_collection',
        path: 'playthrough-summaries/index.html'
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
        type: 'generated_playthrough_summary',
        path: 'playthrough-summaries/index.html',
        anchor: 'arc-01-chapter-01'
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
  const summaries = await readStructuredSummaryRecords();
  const encounters = await extractEncounterRecords();
  const { lore, secrets: loreSecrets } = await extractLoreAndSecrets();
  const { canonEvents, locations, npcs } = await extractCanonAndLocationsAndNpcs(characters, summaries);

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
