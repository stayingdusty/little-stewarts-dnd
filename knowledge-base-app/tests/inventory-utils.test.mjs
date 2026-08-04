import assert from 'node:assert/strict';
import test from 'node:test';

import { extractInventoryItemsFromRecord } from '../scripts/inventory-utils.mjs';

test('extractInventoryItemsFromRecord keeps an explicit owner ID prefix stable', () => {
  const [item] = extractInventoryItemsFromRecord({
    id: 'character-fiona',
    name: 'Fiona Blossom Flare',
    inventoryIdPrefix: 'fiona',
    inventory: [{ name: 'Radiant Sword of Aureth', quantity: '1' }],
    visibility: 'player',
    canonStatus: 'confirmed',
    source: { path: 'characters/index.html', anchor: 'fiona' }
  });

  assert.equal(item.id, 'inventory-item-fiona-radiant-sword-of-aureth');
  assert.equal(item.ownerName, 'Fiona Blossom Flare');
});
