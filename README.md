# Little Stewarts D&D

This repository is the campaign source and player-facing knowledge base for **Little Stewarts D&D**.

## Operating model

- GitHub pull requests are the canon review boundary.
- `campaigns/the-dark-arcs/` contains structured character, lore, world-map, encounter, policy, canonical-name, and session intake records.
- `DND-Source-Docs/` contains legacy printable campaign documents.
- `knowledge-base-app/` publishes structured records, validates them, and builds the static GitHub Pages site; only unmigrated playthrough summaries still use legacy HTML extraction.
- `AGENTS.md` defines the standing rules for Codex and other repository agents.

## Player site and DM material

The Pages app opens in player-safe mode. Completed playthrough summaries, character sheets, inventories, and player-known entities are immediately searchable. A password prompt enables DM Spoilers Mode in the same app, adding encounter plans, unrevealed lore, secrets, and DM world documents to the search results.

The password is deliberately a spoiler deterrent for family and players, not a security boundary. The repository and Pages files remain public and plaintext so the project can stay on GitHub Free with one public GitHub Pages app.

## Verify locally

```bash
cd knowledge-base-app
npm run verify
```

The verification command rebuilds normalized data and the site, validates canon names and references, checks player/DM mode behavior and print rules, and runs the automated tests.
