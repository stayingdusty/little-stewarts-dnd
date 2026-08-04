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
- Treat generated HTML pages as build artifacts, even when they are committed for GitHub Pages hosting.
- Do not hand-edit generated character sheets, playthrough summaries, search indexes, `knowledge-base-app/site/data/**`, or `knowledge-base-app/site/source-docs/**`; update source records and run the build instead.
- `DND-Source-Docs/**` is legacy source material during migration. Preserve its layout and content unless the task explicitly updates that document or corrects confirmed canon.
- New campaign records belong under `campaigns/the-dark-arcs/**`, not in generated site files.
- Use stable lowercase kebab-case IDs and lowercase snake_case legacy HTML filenames.
- Search results should link to generated app pages or generated printable HTML documents when those exist, not to legacy source documents.

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
- Character sheets must be generated from structured character data once that data exists.
- Character sheets may use up to two printed pages, designed as the front and back of one physical sheet of paper.
- Use an intentional print page break between character-sheet page 1 and page 2.
- Page 1 should prioritize primary character information, abilities, and core equipment.
- Page 2 should hold expanded inventory, notes, spells, relationships, and session developments.
- Prevent clipping, accidental content splits, and unintended third pages in browser print preview.
- Print validation must pass before a regenerated sheet is complete.
- Do not generate or store PDFs for character sheets or summaries. Browser printing should support both physical printing and Save as PDF.
- Playthrough summaries may use the number of printed pages their content needs, but should avoid awkward breaks and clipped content.

## Required workflow

1. Start from current `main` on a new `agent/*` branch.
2. Inspect session evidence and create proposed structured changes.
3. Flag canon conflicts for review.
4. Apply approved changes to source records.
5. Regenerate app pages, printable HTML, search indexes, and other generated outputs from source records.
6. Run `npm run verify` from `knowledge-base-app`.
7. Inspect the diff for correct player/DM visibility labels and unrelated changes.
8. Open a draft pull request. Do not merge it automatically.
9. Return the clickable pull request link in the final response.

## GitHub publishing preference

- Prefer the branch to draft pull request path for repository changes instead of leaving instructions only in chat.
- Use the connected GitHub app to create branches, commits, and pull requests when local command-line authentication is unavailable.
- Do not treat a missing local `gh` binary as a blocker when the connected GitHub app can safely publish the same scoped change.
- Keep pull requests small and reviewable when the user asks for a repository instruction or workflow update.
- Always report the branch name, commit or change summary, validation performed, and pull request link.

## Definition of done

- Canon names validate.
- Structured records and references validate.
- Player-safe mode hides DM-only data and documents by default.
- DM Spoilers Mode makes DM-only data and documents searchable after password entry.
- Search index and links rebuild successfully.
- Character sheets retain the two-page duplex printable layout requirement.
- Browser print preview has no clipping, accidental content splits, or unintended third page for character sheets.
- No generated or stored PDFs are required.
- Tests pass and the pull request explains any unresolved canon questions.
