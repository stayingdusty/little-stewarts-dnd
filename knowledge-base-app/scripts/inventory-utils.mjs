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

const normalizeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const toSlug = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const extractInventoryItems = (html, ownerName, sourcePath) => {
  const records = new Map();
  const inventoryRows = [...html.matchAll(/<div class="inventory-row">([\s\S]*?)<\/div>/gi)];

  inventoryRows.forEach((rowMatch) => {
    const cellMatches = [...rowMatch[1].matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi)];
    const cells = cellMatches.map((match) => normalizeText(stripTags(match[1])));
    const fallbackText = normalizeText(stripTags(rowMatch[1]));
    const rawItemName = cells[0] || fallbackText;
    const itemName = rawItemName.replace(/\s+[—-]\s+details TBD$/i, '').trim();
    if (!itemName) return;

    const detailText = cells.slice(1).filter(Boolean).join(' — ');
    const slug = toSlug(`${ownerName}-${itemName}`);
    const id = `inventory-item-${slug}`;
    const existing = records.get(id);

    if (existing) {
      if (detailText && !existing.details.includes(detailText)) {
        existing.details = `${existing.details} | ${detailText}`;
      }
      return;
    }

    records.set(id, {
      id,
      domain: 'inventory-item',
      name: itemName,
      summary: `Inventory entry for ${ownerName}.`,
      details: detailText || `Tracked in ${ownerName}'s inventory.`,
      aliases: [ownerName],
      tags: ['inventory-item', 'arc-1', 'inventory'],
      relatedIds: [],
      visibility: 'player',
      canonStatus: 'confirmed',
      evidence: [{ type: 'character-sheet', path: sourcePath }],
      source: {
        type: 'character_sheet',
        path: sourcePath
      },
      ownerName
    });
  });

  return [...records.values()];
};
