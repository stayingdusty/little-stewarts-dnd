const sourceDocGroups = [
  {
    title: 'Character sheets',
    spoiler: false,
    branches: [
      {
        title: 'Characters',
        items: [
          { label: 'Calvin / Nameloc', href: './source-docs/the-dark-arcs/characters/character_sheet_calvin_nameloc.html', icon: '🧑' },
          { label: 'Fiona', href: './source-docs/the-dark-arcs/characters/character_sheet_fiona.html', icon: '✨' },
          { label: 'Golo', href: './source-docs/the-dark-arcs/characters/character_sheet_golo.html', icon: '🛡️' },
          { label: 'Queen Flower', href: './characters/index.html#queen-flower-of-veylathar', icon: '🌸' },
          { label: 'Sertraline', href: './source-docs/the-dark-arcs/characters/character_sheet_sertraline.html', icon: '🕯️' }
        ]
      }
    ]
  },
  {
    title: 'Playthrough summaries',
    spoiler: false,
    branches: [
      {
        title: 'Arc 1',
        items: [
          { label: 'Chapter 1', href: './playthrough-summaries/index.html#arc-01-chapter-01', icon: '🗺️' },
          { label: 'Chapter 2', href: './playthrough-summaries/index.html#arc-01-chapter-02', icon: '💡' },
          { label: 'Chapter 3', href: './playthrough-summaries/index.html#arc-01-chapter-03', icon: '🤝' },
          { label: 'Chapter 4', href: './playthrough-summaries/index.html#arc-01-chapter-04', icon: '⚔️' },
          { label: 'Chapter 5', href: './playthrough-summaries/index.html#arc-01-chapter-05', icon: '🪄' },
          { label: 'Chapter 6', href: './playthrough-summaries/index.html#arc-01-chapter-06', icon: '🧿' },
          { label: 'Chapter 7', href: './playthrough-summaries/index.html#arc-01-chapter-07', icon: '🌌' },
          { label: 'Chapter 8', href: './playthrough-summaries/index.html#arc-01-chapter-08', icon: '🧱' },
          { label: 'Chapter 9', href: './playthrough-summaries/index.html#arc-01-chapter-09', icon: '🔥' }
        ]
      }
    ]
  },
  {
    title: 'DM world documents',
    spoiler: true,
    branches: [
      {
        title: 'The Dark Arcs',
        items: [
          { label: 'Lore, Cosmology & Mythology', href: './source-docs/the-dark-arcs/world/lore-cosmology-mythology.html', icon: '🌌' },
          { label: 'Old World Encounters & Map Tracker', href: './source-docs/the-dark-arcs/world/little_stewarts_old_world_encounters_map_tracker.html', icon: '🗺️' }
        ]
      }
    ]
  }
];

export const getSourceDocNavGroups = (includeSpoilers = false) => (
  sourceDocGroups.filter((group) => includeSpoilers || !group.spoiler)
);
