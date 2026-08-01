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
  const records = [];
  const inventoryRows = [...html.matchAll(/<div class="inventory-row">([\s\S]*?)<\/div>/gi)];

  inventoryRows.forEach((rowMatch, rowIndex) => {
    const rowText = normalizeText(stripTags(rowMatch[1]));
    if (!rowText || rowText.toLowerCase() === 'none') return;

    const cells = rowText.split(/\s{2,}/).map((part) => normalizeText(part)).filter(Boolean);
    const itemName = cells[0];
    if (!itemName) return;

    const detailText = cells.slice(1).join(' — ');
    const slug = toSlug(`${ownerName}-${itemName}-${rowIndex + 1}`);

    records.push({
      id: `inventory-item-${slug}`,
      domain: 'inventory-item',
      name: itemName,
      summary: `Inventory entry for ${ownerName}.`,
      details: detailText || `Tracked in ${ownerName}'s inventory.`,
      aliases: [ownerName],
      tags: ['inventory-item', 'arc-1', 'inventory'],
      relatedIds: [],
      source: {
        type: 'character_sheet',
        path: sourcePath
      },
      ownerName
    });
  });

  return records;
};
