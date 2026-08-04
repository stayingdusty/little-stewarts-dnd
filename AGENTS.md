# Little Stewarts D&D Repository Playbook

This repository is the authoritative campaign record for **Little Stewarts D&D**. Treat changes as proposed canon until Michael reviews and merges the pull request.

## Canon and names

- Use `campaigns/the-dark-arcs/canon/names.json` for canonical spellings and aliases.
- Confirmed spellings include **Petaltown**, **Veylathar**, **Aureth**, **Tindily Migrot**, and **Garoth**.
- Tindily Migrot uses **she/her** pronouns.
- Never introduce a new spelling, retcon, identity merge, or canon fact silently.
- When evidence conflicts, preserve the evidence, mark the record `unresolved`, and describe the conflict in the pull request.
- A merged pull request promotes its proposed changes to canon unless the pull request explicitly says otherwise.

## Source and generated files

- Update structured campaign data before generated outputs whenever a structured source exists.
- Do not hand-edit `knowledge-base-app/site/data/**` or `knowledge-base-app/site/source-docs/**`; run the build instead.
- `DND-Source-Docs/**` is legacy source material during migration. Preserve its layout and content unless the task explicitly updates that document or corrects confirmed canon.
- New campaign records belong under `campaigns/the-dark-arcs/**`, not in generated site files.
- Use stable lowercase kebab-case IDs and lowercase snake_case legacy HTML filenames.

## Visibility and spoilers

- Every structured record must declare `visibility` as `player` or `dm-only`.
- GitHub Pages opens in player-safe mode and hides `dm-only` records and documents from the normal interface.
- DM Spoilers Mode uses a simple front-end password prompt and may reveal the same public plaintext records in the browser.
- This control is intentionally a family/player spoiler deterrent, not secure access control or encryption.
- Keep the mode locked by default and clearly label DM-only search results and documents after unlock.
- Do not claim that DM content is private: the repository, site files, and Git history are public.

## Character sheets and summaries

- Preserve the established printable character-sheet and playthrough-summary visual templates.
- Character-sheet updates start with an intake proposal that cites the uploaded note/photo evidence and identifies every changed field.
- Do not guess illegible handwriting or silently overwrite an unresolved value.
- Print validation must pass before a regenerated sheet is complete.

## Required workflow

1. Start from current `main` on a new `agent/*` branch.
2. Inspect session evidence and create proposed structured changes.
3. Flag canon conflicts for review.
4. Apply approved changes to source records.
5. Run `npm run verify` from `knowledge-base-app`.
6. Inspect the diff for correct player/DM visibility labels and unrelated changes.
7. Open a draft pull request. Do not merge it automatically.

## Definition of done

- Canon names validate.
- Structured records and references validate.
- Player-safe mode hides DM-only data and documents by default.
- DM Spoilers Mode makes DM-only data and documents searchable after password entry.
- Search index and links rebuild successfully.
- Character sheets retain printable layout requirements.
- Tests pass and the pull request explains any unresolved canon questions.
