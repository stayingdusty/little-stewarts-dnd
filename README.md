# Little Stewarts D&D

This repository is the campaign source and player-facing knowledge base for **Little Stewarts D&D**.

## Operating model

- GitHub pull requests are the canon review boundary.
- `campaigns/the-dark-arcs/` contains campaign policy, canonical-name records, and session intake records as the structured migration proceeds.
- `DND-Source-Docs/` contains legacy printable campaign documents.
- `knowledge-base-app/` extracts normalized records, validates them, and builds the static GitHub Pages site.
- `AGENTS.md` defines the standing rules for Codex and other repository agents.

## Player site and DM material

The Pages build is intentionally player-safe. It publishes completed playthrough summaries, character sheets, inventories, and player-known entities. DM-only world documents, encounter plans, lore records, and secrets are excluded at build time and verified by automated tests.

This source repository has historically been public. Excluding a file from Pages does not protect a file that remains in the repository or its Git history. True DM secrecy requires moving the source repository to private storage and publishing only the filtered Pages artifact from a separate public destination, or using an authenticated server that never sends unauthorized plaintext to the browser.

## Verify locally

```bash
cd knowledge-base-app
npm run verify
```

The verification command rebuilds normalized data and the player site, validates canon names and references, checks spoiler boundaries and print rules, and runs the automated tests.
