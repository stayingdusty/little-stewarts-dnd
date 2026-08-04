# Little Stewarts Knowledge Base App

This app is the static, player-facing knowledge base layer for campaign content. Extraction reads legacy files under `DND-Source-Docs/`; generated site files are written under `site/`.

## Goals

- Keep campaign source assets intact.
- Normalize campaign knowledge into searchable JSON.
- Publish a player-safe static search UI on GitHub Pages.
- Exclude DM-only data and documents before the Pages artifact is created.

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

DM lore, secrets, and planned encounters are normalized for local validation but are not included in the public build.

## Local Workflow

1. Extract normalized records from campaign source HTML:
   - `npm run extract:data`
2. Build search data for the static site:
   - `npm run build:data`
3. Or run both in one step:
   - `npm run build:all`
4. Validate and test the complete output:
   - `npm run verify`
5. Preview static site:
   - `npm run serve`

## GitHub Pages

A workflow in `.github/workflows/deploy-pages.yml` runs the full verification suite on pull requests. Merges to `main` deploy `knowledge-base-app/site/` only after verification passes.
