# Visibility policy

The public GitHub Pages site opens as a player reference. Player mode shows completed playthrough summaries, player character sheets, player inventories, and facts about locations, NPCs, events, and lore already learned during play.

DM-only content includes future encounters, unrevealed lore, secret motivations, planned twists, hidden maps, and intake evidence that has not been reviewed. These records and documents are included in the public static site but hidden from the normal interface until DM Spoilers Mode is unlocked.

DM Spoilers Mode uses a simple front-end password as a family/player deterrent. It is not encryption or a security boundary: the public repository and deployed static files remain inspectable. Player mode must always be the default, and DM records must always retain `visibility: dm-only` so the interface can hide and label them correctly.
