import test from 'node:test';
import assert from 'node:assert/strict';
import { filterSpoilers, sortRecords } from '../site/search-utils.js';

test('sortRecords puts canon events first and newest first', () => {
  const records = [
    { id: 'char-1', kind: 'character', name: 'Ada', priority: 10, timelineValue: 0 },
    { id: 'canon-2', kind: 'canon', name: 'Chapter 2', priority: 0, timelineValue: 2 },
    { id: 'canon-1', kind: 'canon', name: 'Chapter 1', priority: 0, timelineValue: 1 },
    { id: 'npc-1', kind: 'npc', name: 'Ned', priority: 20, timelineValue: 0 }
  ];

  const sorted = sortRecords(records);

  assert.deepEqual(sorted.map((record) => record.id), ['canon-2', 'canon-1', 'char-1', 'npc-1']);
});

test('sortRecords keeps inventory items after character records', () => {
  const records = [
    { id: 'item-1', kind: 'inventory-item', name: 'Sword', priority: 40, timelineValue: 0 },
    { id: 'char-1', kind: 'character', name: 'Ada', priority: 10, timelineValue: 0 },
    { id: 'loc-1', kind: 'location', name: 'Town', priority: 30, timelineValue: 0 }
  ];

  const sorted = sortRecords(records);

  assert.deepEqual(sorted.map((record) => record.id), ['char-1', 'loc-1', 'item-1']);
});

test('filterSpoilers hides lore, secret, and encounter content by default', () => {
  const records = [
    { id: 'char-1', kind: 'character', name: 'Ada', sourceType: 'character_sheet' },
    { id: 'canon-1', kind: 'canon', name: 'Chapter 1', sourceType: 'playthrough_summary' },
    { id: 'lore-1', kind: 'lore', name: 'Secret Lore', sourceType: 'dm_lore_reference' },
    { id: 'secret-1', kind: 'secret', name: 'DM Secret', sourceType: 'dm_lore_reference' },
    { id: 'encounter-1', kind: 'encounter', name: 'Encounter', sourceType: 'world_tracker' }
  ];

  const filtered = filterSpoilers(records);

  assert.deepEqual(filtered.map((record) => record.id), ['char-1', 'canon-1']);
});
