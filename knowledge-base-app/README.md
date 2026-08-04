# Little Stewarts Knowledge Base App

This app is the static knowledge base layer for campaign content. Character sheets and DM world references are sourced from structured JSON under `campaigns/the-dark-arcs/`; extraction still reads legacy playthrough summaries under `DND-Source-Docs/` while that domain is migrated. Generated site files are written under `site/`.

## Goals

- Keep campaign source assets intact.
- Normalize campaign knowledge into searchable JSON.
- Publish one static search UI on GitHub Pages.
- Open player-safe by default and reveal DM-only content after a deterrent password is entered.

## Directory Layout

- `config/schema/`: JSON schemas for normalized entities.
- `data/raw/`: Source extracts by domain.
- `data/normalized/`: Canonical structured records.
- `scripts/`: Build scripts that generate site search data.
- `site/`: Static app deployed to GitHub Pages.

## Entity Domains

- Characters
- NPCs
- Locations
- Encounters
- Lore
- Canon events from completed playthrough summaries

DM lore, secrets, planned encounters, and DM documents are included in the public build but hidden by the interface until DM Spoilers Mode is unlocked. This is a convenience gate, not secure access control.

## Local Workflow

1. Add or update character JSON under `campaigns/the-dark-arcs/characters/` or world JSON under `campaigns/the-dark-arcs/world/`. Legacy HTML character and world documents are evidence only and are not scraped.
2. Publish structured records and extract the remaining legacy playthrough-summary domains:
   - `npm run extract:data`
3. Build search data for the static site:
   - `npm run build:data`
4. Or run publishing, normalization, and search builds in one step:
   - `npm run build:all`
5. Validate and test the complete output:
   - `npm run verify`
6. Preview static site:
   - `npm run serve`

## GitHub Pages

A workflow in `.github/workflows/deploy-pages.yml` runs the full verification suite on pull requests. Merges to `main` deploy `knowledge-base-app/site/` only after verification passes.
