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

const getKindPriority = (record) => GROUP_ORDER[record.kind] ?? 99;
const getTimelineValue = (record) => Number(record.timelineValue ?? record.chapter ?? record.chapterNumber ?? 0);

export const filterPlayerVisible = (records) => records.filter((record) => record.visibility !== 'dm-only');

export const filterVisibleForMode = (records, dmMode = false) => (
  dmMode ? [...records] : filterPlayerVisible(records)
);

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
