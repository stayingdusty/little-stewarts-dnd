# Little Stewarts Knowledge Base App

This app is a standalone, static knowledge base layer for campaign content. It does not modify files under `DND-Source-Docs/`.

## Goals

- Keep campaign source assets intact.
- Normalize campaign knowledge into searchable JSON.
- Publish a static search UI on GitHub Pages.

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
- Secrets
- Canon events from playthrough summaries

## Local Workflow

1. Extract normalized records from campaign source HTML:
   - `npm run extract:data`
2. Build search data for the static site:
   - `npm run build:data`
3. Or run both in one step:
   - `npm run build:all`
4. Preview static site:
   - `npm run serve`

## GitHub Pages

A workflow in `.github/workflows/deploy-pages.yml` runs extraction + index build, then deploys `knowledge-base-app/site/`.
