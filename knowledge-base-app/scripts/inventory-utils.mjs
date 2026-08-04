const normalizeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const toSlug = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const extractInventoryItemsFromRecord = (character) => {
  const records = new Map();
  const ownerName = character.name;
  const sourcePath = character.source?.path || 'characters/index.html';

  for (const item of character.inventory || []) {
    const itemName = normalizeText(item.name);
    if (!itemName) continue;

    const detailParts = [
      item.quantity ? `Qty: ${item.quantity}` : '',
      item.charges ? `Charges: ${item.charges}` : '',
      item.details || ''
    ].filter(Boolean);
    // Keep inventory IDs stable when a character's displayed name changes.
    const ownerIdPrefix = character.inventoryIdPrefix || ownerName;
    const slug = toSlug(`${ownerIdPrefix}-${itemName}`);
    const id = `inventory-item-${slug}`;

    records.set(id, {
      id,
      domain: 'inventory-item',
      name: itemName,
      summary: `Inventory entry for ${ownerName}.`,
      details: detailParts.join(' | ') || `Tracked in ${ownerName}'s inventory.`,
      aliases: [ownerName],
      tags: ['inventory-item', 'arc-1', 'inventory'],
      relatedIds: [character.id],
      visibility: character.visibility,
      canonStatus: character.canonStatus,
      evidence: character.evidence || [{ type: 'character-record', path: sourcePath }],
      source: {
        type: 'generated_character_sheet',
        path: sourcePath,
        anchor: character.source?.anchor
      },
      ownerName
    });
  }

  return [...records.values()];
};
