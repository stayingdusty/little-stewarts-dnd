import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');

const entityFiles = [
  'data/normalized/characters/characters.json',
  'data/normalized/npcs/npcs.json',
  'data/normalized/locations/locations.json',
  'data/normalized/encounters/encounters.json',
  'data/normalized/lore/lore.json',
  'data/normalized/secrets/secrets.json',
  'data/normalized/inventory/inventory-items.json'
];

const allowedDomains = new Set(['character', 'npc', 'location', 'encounter', 'lore', 'secret', 'inventory-item']);
const allowedVisibility = new Set(['player', 'dm-only']);
const allowedCanonStatus = new Set(['proposed', 'confirmed', 'superseded', 'unresolved']);
const errors = [];

const readJson = async (relativePath) => JSON.parse(await readFile(path.join(appRoot, relativePath), 'utf8'));
const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

const validateEvidence = (record, label) => {
  requireValue(Array.isArray(record.evidence) && record.evidence.length > 0, `${label} must contain evidence.`);
  for (const evidence of record.evidence || []) {
    requireValue(Boolean(evidence?.type && evidence?.path), `${label} has incomplete evidence.`);
  }
};

const validateEntities = async () => {
  const groups = await Promise.all(entityFiles.map(readJson));
  const entities = groups.flat();
  const ids = new Set();

  for (const entity of entities) {
    const label = entity.id || '<missing entity id>';
    requireValue(Boolean(entity.id && entity.name && entity.summary !== undefined), `${label} is missing required identity fields.`);
    requireValue(!ids.has(entity.id), `Duplicate entity ID: ${entity.id}`);
    ids.add(entity.id);
    requireValue(allowedDomains.has(entity.domain), `${label} has unsupported domain: ${entity.domain}`);
    requireValue(allowedVisibility.has(entity.visibility), `${label} has invalid visibility: ${entity.visibility}`);
    requireValue(allowedCanonStatus.has(entity.canonStatus), `${label} has invalid canonStatus: ${entity.canonStatus}`);
    requireValue(Array.isArray(entity.tags), `${label} must contain tags.`);
    requireValue(Boolean(entity.source?.type && entity.source?.path), `${label} has an incomplete source.`);
    validateEvidence(entity, label);
  }

  for (const entity of entities) {
    for (const relatedId of entity.relatedIds || []) {
      requireValue(ids.has(relatedId), `${entity.id} references missing related ID: ${relatedId}`);
    }
  }

  return entities;
};

const validateStructuredCharacterSources = async () => {
  const characterDir = path.join(repoRoot, 'campaigns/the-dark-arcs/characters');
  const names = (await readdir(characterDir)).filter((name) => name.endsWith('.json'));
  requireValue(names.length > 0, 'No structured character sources were found.');

  for (const name of names) {
    const character = JSON.parse(await readFile(path.join(characterDir, name), 'utf8'));
    const label = `Structured character ${name}`;
    requireValue(character.domain === 'character', `${label} must use the character domain.`);
    requireValue(character.source?.type === 'generated_character_sheet', `${label} must link to the generated character sheet.`);
    requireValue(Boolean(character.source?.anchor), `${label} must declare a stable source anchor.`);
    requireValue(Array.isArray(character.powers), `${label} must contain a powers array.`);
    requireValue(Array.isArray(character.attacks), `${label} must contain an attacks array.`);
    requireValue(Array.isArray(character.inventory), `${label} must contain an inventory array.`);
    requireValue(Boolean(character.abilityScores && character.combat && character.currency), `${label} is missing sheet data sections.`);
    validateEvidence(character, label);
  }
};

const validateStructuredWorldSources = async () => {
  const worldDir = path.join(repoRoot, 'campaigns/the-dark-arcs/world');
  const lore = JSON.parse(await readFile(path.join(worldDir, 'lore-cosmology-mythology.json'), 'utf8'));
  const tracker = JSON.parse(await readFile(path.join(worldDir, 'old-world-encounters.json'), 'utf8'));

  for (const [label, document] of [['Lore document', lore], ['World encounter document', tracker]]) {
    requireValue(Boolean(document.id && document.title && document.summary), `${label} is missing required identity fields.`);
    requireValue(allowedVisibility.has(document.visibility), `${label} has invalid visibility: ${document.visibility}`);
    requireValue(allowedCanonStatus.has(document.canonStatus), `${label} has invalid canonStatus: ${document.canonStatus}`);
    validateEvidence(document, label);
  }

  requireValue(Array.isArray(lore.sections) && lore.sections.length > 0, 'Lore document must contain structured sections.');
  requireValue(Array.isArray(tracker.encounters) && tracker.encounters.length > 0, 'World encounter document must contain encounters.');
  requireValue(Boolean(tracker.map?.coordinateSystem?.width && tracker.map?.coordinateSystem?.height), 'World encounter document must define map coordinates.');
  requireValue(Array.isArray(tracker.map?.regions) && tracker.map.regions.length > 0, 'World encounter document must define map regions.');
  requireValue(Array.isArray(tracker.map?.landmarks) && tracker.map.landmarks.length > 0, 'World encounter document must define map landmarks.');
  requireValue(tracker.map?.encounterMarkers?.length === tracker.encounters.length, 'Every structured encounter must have a map marker.');

  const ids = new Set();
  for (const encounter of tracker.encounters || []) {
    requireValue(Boolean(encounter.id && encounter.name && encounter.hook && encounter.location), 'A structured encounter is missing required fields.');
    requireValue(!ids.has(encounter.id), `Duplicate structured encounter ID: ${encounter.id}`);
    ids.add(encounter.id);
    requireValue(allowedVisibility.has(encounter.visibility), `${encounter.id} has invalid visibility: ${encounter.visibility}`);
    requireValue(allowedCanonStatus.has(encounter.canonStatus), `${encounter.id} has invalid canonStatus: ${encounter.canonStatus}`);
  }
  for (const marker of tracker.map?.encounterMarkers || []) {
    requireValue(ids.has(marker.encounterId), `Map marker references missing encounter: ${marker.encounterId}`);
    requireValue(Number.isFinite(marker.x) && Number.isFinite(marker.y), `Map marker ${marker.marker} has invalid coordinates.`);
  }
};

const validateCanonEvents = async (entityIds) => {
  const events = await readJson('data/normalized/canon/canon_events.json');
  const ids = new Set();

  for (const event of events) {
    const label = event.id || '<missing canon event id>';
    requireValue(Boolean(event.id && event.title && event.source?.path), `${label} is missing required fields.`);
    requireValue(!ids.has(event.id), `Duplicate canon event ID: ${event.id}`);
    ids.add(event.id);
    requireValue(allowedVisibility.has(event.visibility), `${label} has invalid visibility: ${event.visibility}`);
    requireValue(allowedCanonStatus.has(event.canonStatus), `${label} has invalid canonStatus: ${event.canonStatus}`);
    validateEvidence(event, label);
    for (const participant of event.participants || []) {
      requireValue(entityIds.has(participant), `${label} references missing participant: ${participant}`);
    }
  }
};

const validateCanonicalNames = async (entities) => {
  const registryPath = path.join(repoRoot, 'campaigns/the-dark-arcs/canon/names.json');
  const registry = JSON.parse(await readFile(registryPath, 'utf8'));
  const canonical = new Set();
  const aliases = new Map();

  for (const record of registry.records || []) {
    requireValue(Boolean(record.id && record.canonical), 'Canonical name record is missing an ID or canonical value.');
    requireValue(!canonical.has(record.canonical.toLowerCase()), `Duplicate canonical name: ${record.canonical}`);
    canonical.add(record.canonical.toLowerCase());
    for (const alias of record.aliases || []) aliases.set(alias.toLowerCase(), record.canonical);
  }

  for (const entity of entities.filter((item) => item.visibility === 'player')) {
    const replacement = aliases.get(entity.name.toLowerCase());
    requireValue(!replacement, `${entity.id} uses alias '${entity.name}' as its canonical name; use '${replacement}'.`);
  }
};

const validateSiteBuild = async () => {
  const entities = await readJson('site/data/entities.json');
  const canonEvents = await readJson('site/data/canon-events.json');
  const searchIndex = await readJson('site/data/search-index.json');

  requireValue(searchIndex.some((record) => record.visibility === 'player'), 'Site search index has no player-visible records.');
  requireValue(searchIndex.some((record) => record.visibility === 'dm-only'), 'Site search index has no DM-only records for spoilers mode.');
  for (const record of searchIndex) {
    requireValue(allowedVisibility.has(record.visibility), `Site search record has invalid visibility: ${record.id}`);
  }

  const dmWorldPath = path.join(appRoot, 'site/world');
  try {
    const names = (await readdir(dmWorldPath)).filter((name) => name.endsWith('.html'));
    requireValue(names.length > 0, 'Generated DM world directory contains no HTML documents.');
    for (const name of names) {
      const html = await readFile(path.join(dmWorldPath, name), 'utf8');
      requireValue(html.includes('dm-doc-guard.js'), `Generated DM document is missing the spoiler deterrent: ${name}`);
    }
  } catch {
    errors.push('Site is missing the generated DM world directory.');
  }

  for (const record of searchIndex) {
    if (!record.sourcePath) continue;
    if (record.sourceType === 'generated_character_sheet') {
      const characterDataPath = path.join(appRoot, 'site/data/characters', `${record.sourceAnchor}.json`);
      try {
        await access(characterDataPath);
        await access(path.join(appRoot, 'site/characters/index.html'));
      } catch {
        errors.push(`${record.id} links to a generated character sheet without published character data.`);
      }
      continue;
    }

    const relativeSource = record.sourcePath
      .replace(/^DND-Source-Docs\//i, 'source-docs/')
      .replace(/^\.\//, '')
      .replace(/\\/g, '/');
    const sourceWithoutQuery = relativeSource.split(/[?#]/)[0];
    const relativeTarget = sourceWithoutQuery.toLowerCase().endsWith('.html')
      ? sourceWithoutQuery
      : `${sourceWithoutQuery.replace(/\/+$/, '')}/index.html`;
    const targetPath = path.join(appRoot, 'site', relativeTarget);
    try {
      const html = await readFile(targetPath, 'utf8');
      if (record.sourceAnchor && record.sourceType !== 'generated_world_document') {
        requireValue(html.includes(`id="${record.sourceAnchor}"`), `${record.id} links to missing anchor #${record.sourceAnchor}.`);
      }
    } catch {
      errors.push(`${record.id} links to missing public source document: ${relativeTarget}`);
    }
  }

  const { getSourceDocNavGroups } = await import('../site/source-docs-nav.js');
  for (const group of getSourceDocNavGroups(true)) {
    for (const branch of group.branches) {
      for (const item of branch.items) {
        const navHref = item.href.replace(/^\.\//, '').split('#')[0].split('?')[0];
        const navTarget = path.join(appRoot, 'site', navHref);
        try {
          await access(navTarget);
        } catch {
          errors.push(`Source navigation links to missing file: ${item.href}`);
        }
      }
    }
  }
};

const validatePrintSources = async () => {
  const generatedSheetHtml = path.join(appRoot, 'site/characters/index.html');
  const generatedSheetCss = path.join(appRoot, 'site/characters/sheet.css');
  try {
    await access(generatedSheetHtml);
    const css = await readFile(generatedSheetCss, 'utf8');
    requireValue(/@media\s+print/i.test(css), 'Generated character sheet renderer is missing print-specific CSS.');
    requireValue(/@page\s*{/i.test(css), 'Generated character sheet renderer is missing an @page print rule.');
    requireValue(/page-break-after|break-after/i.test(css), 'Generated character sheet renderer is missing intentional page breaks.');
  } catch {
    errors.push('Generated character sheet renderer is missing.');
  }

  const characterDir = path.join(repoRoot, 'DND-Source-Docs/the-dark-arcs/characters');
  const names = (await readdir(characterDir)).filter((name) => /^character_sheet_.*\.html$/.test(name));
  for (const name of names) {
    const html = await readFile(path.join(characterDir, name), 'utf8');
    requireValue(/@media\s+print/i.test(html), `${name} is missing print-specific CSS.`);
    requireValue(/@page\s*{/i.test(html), `${name} is missing an @page print rule.`);
  }
};

await validateStructuredCharacterSources();
await validateStructuredWorldSources();
const entities = await validateEntities();
await validateCanonEvents(new Set(entities.map((entity) => entity.id)));
await validateCanonicalNames(entities);
await validateSiteBuild();
await validatePrintSources();

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Validated ${entities.length} entities, spoiler-mode visibility, canonical names, references, and print rules.`);
