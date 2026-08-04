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
          { label: 'Queen Flower', href: './source-docs/the-dark-arcs/characters/character_sheet_queen_flower.html', icon: '🌸' },
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
          { label: 'Chapter 1', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_1_playthrough_summary.html', icon: '🗺️' },
          { label: 'Chapter 2', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_2_playthrough_summary.html', icon: '💡' },
          { label: 'Chapter 3', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_3_playthrough_summary.html', icon: '🤝' },
          { label: 'Chapter 4', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_4_playthrough_summary.html', icon: '⚔️' },
          { label: 'Chapter 5', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_5_playthrough_summary.html', icon: '🪄' },
          { label: 'Chapter 6', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_6_playthrough_summary.html', icon: '🧿' },
          { label: 'Chapter 7', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_7_playthrough_summary.html', icon: '🌌' },
          { label: 'Chapter 8', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_8_playthrough_summary.html', icon: '🧱' },
          { label: 'Chapter 9', href: './source-docs/the-dark-arcs/playthrough-summaries/arc_1_chapter_9_playthrough_summary.html', icon: '🔥' }
        ]
      }
    ]
  }
];

export const getSourceDocNavGroups = () => sourceDocGroups;
