const GROUP_ORDER = {
  canon: 0,
  character: 1,
  npc: 2,
  location: 3,
  encounter: 4,
  lore: 5,
  secret: 6,
  'inventory-item': 7
};

const SPOILER_KINDS = new Set(['lore', 'secret']);
const SAFE_SOURCE_TYPES = new Set(['character_sheet', 'playthrough_summary']);

const getKindPriority = (record) => GROUP_ORDER[record.kind] ?? 99;
const getTimelineValue = (record) => Number(record.timelineValue ?? record.chapter ?? record.chapterNumber ?? 0);

const getSourceType = (record) => record.sourceType || record.source?.type || '';

export const filterSpoilers = (records, includeSpoilers = false) => {
  if (includeSpoilers) {
    return records;
  }

  return records.filter((record) => {
    if (SPOILER_KINDS.has(record.kind)) {
      return false;
    }

    if (record.kind === 'encounter') {
      return false;
    }

    const sourceType = getSourceType(record);
    if (sourceType === 'dm_lore_reference' || sourceType === 'world_tracker') {
      return false;
    }

    return SAFE_SOURCE_TYPES.has(sourceType) || record.kind === 'canon' || record.kind === 'character' || record.kind === 'npc' || record.kind === 'location' || record.kind === 'inventory-item';
  });
};

export const sortRecords = (records) => {
  return [...records].sort((left, right) => {
    const leftKindPriority = getKindPriority(left);
    const rightKindPriority = getKindPriority(right);

    if (leftKindPriority !== rightKindPriority) {
      return leftKindPriority - rightKindPriority;
    }

    const leftTimeline = getTimelineValue(left);
    const rightTimeline = getTimelineValue(right);

    if (leftTimeline !== rightTimeline) {
      return rightTimeline - leftTimeline;
    }

    return left.name.localeCompare(right.name);
  });
};
