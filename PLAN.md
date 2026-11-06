# Plan: RPG Oracle v1 (Deck of Signs & Consult the Bones)

Work through the parts in order and tick each box when it is done. Each part ends with Brandon reviewing the result, and the next part does not start until he approves it. `ORACLE_SPEC.md` is the rules source of truth. `CLAUDE.md` (created in Part 1) holds the decisions and coding standards.

## Status

- Part 1: done and approved. Commit `24ee6b5`
- Part 2: done and approved, committed and pushed to `origin/main`
- Design: adopted the Torchlit Chronicles look from `../personal-blog` (2026-11-05). Approved, committed and pushed
- Part 3: done and approved, committed and pushed
- Part 4: done and approved, committed and pushed
- Part 5: done and approved, committed and pushed
- Part 6: done and approved, committed and pushed
- Part 7: done and approved, committed and pushed
- Part 8: done and approved; Pages enabled by Brandon, committed and pushed. Remaining: Brandon's live checks (Chrome autosave, Safari download fallback, a real Interpret)

## Decisions (from Brandon, 2026-11-05)

| Topic | Decision | Why |
|---|---|---|
| Hosting | Public GitHub repo `bkvaughan/rpg-oracle`, deployed to GitHub Pages by GitHub Actions, the same as mythras-chargen | Brandon's call. Free, with no server to run |
| Stack | **Vite + React + TypeScript (strict)**, a static site, mirroring mythras-chargen | Best performance: static files on a CDN with no backend latency. Best security: no server to attack and no shared API key, because the only key is the user's own (BYOK). The tooling already works in mythras |
| AI access | BYOK. The Anthropic SDK runs in the browser with the user's key, stored only in their browser. All network calls go through one module (`src/ai/client.ts`) so a proxy can replace it later | GitHub Pages can't hold secrets, and this is the same approach as mythras Part 12 |
| Sessions | **JSON files on disk.** Open and save a session file with the File System Access API, autosaving to the same file (Chrome, Edge, Arc). On Safari and Firefox, fall back to Download / Open file. A browser copy is kept for crash recovery | A static site can't write to disk without the browser's file picker. This is the closest match to "local JSON files" |
| Art | Bundled art, resized to WebP at build time | Brandon's call |
| Design | Follow Brandon's blog Torchlit Chronicles (`../personal-blog`): grimdark palette, Pirata One / IM Fell English SC / Alegreya, fog, embers and torchlight background, bracket-corner panels | Brandon's call (2026-11-05). Replaces "propose two visual directions" in Part 6 |
| Licence | Ship publicly as an unofficial fan tool: credits, a not-affiliated notice, and links to the official deck, dice and book | Brandon's call (Part 1). Fall back to a words-only build if Pickpocket Press objects |

---

## Part 1: Spec fixes, project setup and licence gate

- [x] Copy this plan to `PLAN.md`. Create a project `CLAUDE.md` with the purpose, the decisions table, the folder layout, coding standards (copied from mythras where they apply) and a Commands section
- [x] `ORACLE_SPEC.md`: make likelihood names consistent (`even` / `likely-yes` / `likely-no`; Part 4 currently says "unlikely")
- [x] `ORACLE_SPEC.md`: state the reroll rule for the edge case: when both Twins show the unlikely answer, reroll the first one (identical dice, so it doesn't matter which)
- [x] `ORACLE_SPEC.md`: add an "AI call" subsection to Part 3 covering the model choices, structured-output schema, prompt caching and error handling
- [x] Card art descriptions: decided to write them. A one-line `art` field has been added to all 50 cards in `deck_of_signs.json`
- [x] Brandon reviews the 50 `art` descriptions (approved 2026-11-05)
- [x] **Licence gate.** A public repo and Pages site will show the card art and words. Brandon decides: (a) ask Pickpocket Press first, (b) ship anyway as a fan tool with credits and a link to the official deck, or (c) words-only build. Record the decision in CLAUDE.md (decided: (b), recorded in CLAUDE.md and ORACLE_SPEC.md)
- [x] `git init` on a `main` branch with an initial commit of the existing docs. Brandon created the GitHub repo `bkvaughan/rpg-oracle`, and it's added as `origin` (not pushed yet)

**Success criteria:** the spec has no open inconsistencies, the licence decision is recorded, and the repo exists.

---

## Part 2: Scaffolding

- [x] Vite + React + TypeScript project in this folder (strict). `vite.config.ts` uses `base: './'` for Pages, as mythras does
- [x] Vitest + React Testing Library (jsdom). Playwright, Chromium only, plus `@axe-core/playwright`
- [x] oxlint and a `typecheck` script
- [x] npm scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `typecheck`, `assets`
- [x] `.gitignore` copied from mythras (`node_modules`, `dist`, test output, `.env*`), plus the original card PNGs (see Part 3)
- [x] Folder layout: `src/data`, `src/engine`, `src/state`, `src/ai`, `src/ui`, `scripts/`, `tests/e2e`, `public/`
- [x] Hello-world page, one unit test (the source deck has 50 cards), one component test, one Playwright test
- [x] Minimal README and the CLAUDE.md Commands section

**Tests:** every script passes on a clean `npm ci`.

Notes: the Vite template now ships TypeScript 7 (`~7.0.2`), Vite 8 and Vitest 5. `strict` was added to both tsconfigs. `tsconfig.node.json` also covers `playwright.config.ts`, `scripts/` and `tests/`. The `assets` script is wired up now, and its file is written in Part 3.

---

## Part 3: Asset pipeline

- [x] `scripts/build-assets.ts` (using `sharp`): convert `data/cards/NN.png` to `public/cards/NN.webp` at 400 px wide, plus `NN@2x.webp` at the full 771 px source width (rather than upscaling to 800) for high-DPI screens. Copy `data/dice/*.webp` to `public/dice/`
- [x] Commit only the generated WebP files. Keep the 47 MB of source PNGs out of git (gitignored, kept locally) so the repo stays small
- [x] Move `deck_of_signs.json` into `src/data/` as a typed import (`src/data/deck.ts`), validated with zod in a test (50 cards, ids 1–50 in order, valid time icons and directions, distributions, time text matches icon, the book's example cards). Image existence is checked in `scripts/assets.test.ts`
- [x] Test: all 50 cards (1x and 2x) and 7 dice faces exist, and the 1x card set is under 3 MB (actual: 2.1 MB at 1x, 4.5 MB at 2x; a reading loads only two cards)

---

## Part 4: Oracle engine (pure TypeScript, no UI)

- [x] `src/engine/rng.ts`: a secure RNG built on `crypto.getRandomValues`, with rejection sampling so dice aren't biased. Injectable, with a seeded version for tests. `Math.random` is never used
- [x] `src/engine/signs.ts`: draw 2 distinct cards from a fresh 50-card deck. The first card drawn is primary for time and direction, and the second card's are shown too. `rollHour(timeIcon)` returns a 1d6-hour offset
- [x] `src/engine/bones.ts`: port `reference/bones.py` as-is, with `cast`, `resolve` and `consult(likelihood)` returning the first cast, the reroll and the final result. Add `rollFortune()` for Lone Wolf
- [x] Tests: enumerating every cast reproduces the spec probability table to 0.1%. Both book worked examples (p.212 and Part 4) resolve as stated. Reroll rules (Judgment first, one reroll only, never Fortune). Deck draws are never duplicates. A chi-square sanity check on the RNG

**Success criteria:** the engine matches the spec exactly and is covered by tests.

Notes: `Rng` is `(n) => integer in [0, n)`, so modules ask for the range they need. Rerolls are structured (`{ die, from, to }`) for the UI rather than the Python version's text strings. `scriptedRng` lets tests choose exact dice faces, and the probability test enumerates all 1,296 Judgment × Twin × Twin × reroll sequences. 42 tests in total.

---

## Part 5: Session model and persistence

- [x] `Session` type with `schemaVersion`: PC name, class and level; current location (hex, site, room); journal entries (question, tool, likelihood, raw result, AI reading, timestamp); a pinned facts list. Validated with zod
- [x] Reducer and actions: ask, record result, attach reading, add/edit/remove fact, edit PC/location, delete entry
- [x] `src/state/fileStore.ts`: New / Open / Save As with the File System Access API, autosaving to the open file after each change
- [x] Fallback when that API isn't available: Download JSON and Open file, with a clear "unsaved changes" indicator
- [x] Crash-recovery copy in IndexedDB, offered on load if it's newer than the file
- [x] `promptContext(session)`: the last 20 journal entries plus all pinned facts, so prompts stay small
- [x] Tests: round-trip save and load, a clear error on bad files, fallback selection

Notes:
- Stored results hold what the dice and cards showed (card ids, cast, reroll, final dice). Answers are always re-derived by the engine.
- Every reducer action carries its own timestamp, and new ids are made by the caller, so the reducer stays pure.
- The AI reading schema (`src/ai/schema.ts`) was pulled forward from Part 7 so sessions can store readings. `alternate`, `time`, `direction` and follow-up `likelihood` are nullable rather than optional, to suit structured outputs.
- `fileStore.ts` provides the functions; Part 6 wires them into the UI (buttons, the file input for the fallback, autosave on change).
- Recovery: at startup, offer the IndexedDB copy only if it holds unsaved changes. After opening a file, offer it only if it's the same session and newer than the file. Tested with `fake-indexeddb`.
- `describeResult()` gives the one-line summary used both in the prompt and in the journal.
- 73 tests in total.

---

## Part 6: Design direction and UI

- [x] Visual direction: the Torchlit Chronicles design from `../personal-blog`, recorded under Design Rules in CLAUDE.md. Tokens, fonts, atmosphere layers, header, footer and hero were ported into the shell ahead of Part 3
- [x] App shell: session bar (file name, save state, PC, location), question box, tool picker (**Read the Signs** / **Consult the Bones** with Even, Likely Yes and Likely No / **Fortune die**)
- [x] Signs result: both cards' art and the four words, the time icon and period, a compass showing primary and secondary direction, and a "roll exact hour" button
- [x] Bones result: dice faces for the first cast, any reroll shown as "Judgment No → Yes", the final answer with its strength (Double or Triple), and the Fortune twist
- [x] Journal view and an editor for the facts list
- [x] Keyboard-usable and screen-reader-labelled (e.g. dice results as text). Works on phones

**Tests:** component tests for each result view. e2e: ask → draw → journal entry appears.

Notes:
- Files: `src/ui/App.tsx`, `AskPanel`, `SessionBar`, `Journal`, `FactsPanel`, `RecoveryBanner`, `result/*` (Signs, Bones, Fortune, Die, Compass, TimeIcon). `ask.ts` turns a request into a journal entry. `useSessionStore.ts` ties the session to the file and the recovery copy. Styles are in `src/styles/oracle.css`, on the Torchlit tokens.
- Saving: Chromium shows Save (picks a file the first time, then autosaves) and Save as. Other browsers show Open (a file input) and Download, and the status line shows when changes haven't been downloaded yet.
- No browser dialogs: New with unsaved changes and journal deletes both use inline Discard/Keep and Delete/Keep confirmations.
- Added `setEntryHour` to the reducer for "Roll exact hour".
- Card and dice reveals use the blog's fade and ink animations plus a card turn and a dice tumble. All of them stop under reduced motion.
- `tsconfig.node.json` now includes the DOM lib for Playwright tests. Added `@testing-library/user-event`.
- Tests: 86 unit/component tests. 5 e2e tests (load; Signs, hour and journal; Bones, likelihood, Fortune die and reselecting an entry; recovery after reload; axe with no violations), stable across 15 repeated runs.

---

## Part 7: AI interpretation layer

- [x] Load the `claude-api` skill before writing this part
- [x] `src/ai/settings.ts`: BYOK key and model picker (Claude Opus 5.5, Sonnet 5.5, Haiku 5.5), stored only in the browser, with a "forget key" button. The default is **Opus 5.5**, changed from the planned Sonnet 5.5 to follow the Claude API guidance; it's one click in AI settings to switch
- [x] `src/ai/schema.ts`: zod schema for the Part 3 reading (`ruling`, `why`, `alternate`, `time`, `direction`, `follow_ups[]`, `new_facts[]`), sent to the API as a structured output
- [x] `src/ai/prompt.ts`: a system prompt built from the spec's interpretation guidelines and the book's example voice, sent as a cached block. The user message carries the question, the result stated as fact plus the raw dice, and `promptContext`
- [x] `src/ai/client.ts`: the only network module, with typed errors (no key, auth, rate limit, refusal, invalid, network, cancelled), as in mythras
- [x] UI: an "Interpret" button (the oracle works without AI), the reading laid out by section, `new_facts` shown as suggestions the player accepts or edits before they're pinned, and follow-up buttons that prefill question, tool and likelihood
- [x] Guard: the AI only interprets. The result is passed in and never asked for
- [x] Tests: prompt-building snapshots, schema validation, error mapping (mocked SDK)

Notes:
- Request: `client.beta.messages.create` with `output_config: { effort: 'medium', format: betaZodOutputFormat(readingSchema) }`, the system prompt as a cached block, and `fallbacks: 'default'` with beta `server-side-fallback-2026-07-01` for Opus and Sonnet (Haiku 5.5 has none). The thinking parameter is left out, because it's adaptive by default. Refusal and max_tokens stop reasons are handled before the text is parsed, and the response is validated again with zod.
- The SDK (1.6.0, API version 2026-10-21) sends the key as `Authorization: Bearer`.
- The system prompt holds the spec's interpretation guidelines, a worked example in our own words (no book prose), and all 50 cards with their art descriptions. The user message holds the question, the settled result with the raw dice, the PC, location, facts, and the last 20 earlier entries with their rulings (the current entry is excluded).
- UI: an AI settings panel (key, model, Save, Forget key), plus Interpret / Interpret again with Cancel on each result. Suggested facts can be edited, then pinned or dismissed. Follow-ups prefill the ask form and scroll to it.
- Performance: `AiError` lives in `src/ai/errors.ts` and the client is loaded with `import()`. The initial JS is 367 KB (112 KB gzipped); the SDK chunk (84 KB gzipped) loads on the first Interpret.
- Tests: 112 unit/component tests. The browser test intercepts `api.anthropic.com` to check the real request (key, model, fallbacks, effort, question) without spending money. The real API has not been called with a live key yet; Brandon to try one.

---

## Part 8: Hardening and deploy

- [x] Content-Security-Policy meta tag: `connect-src` limited to `https://api.anthropic.com`, no third-party scripts, fonts self-hosted. Allow `data:` in `img-src`, because the atmosphere's noise and fog textures are inline SVG data URIs. Injected at build time by a small Vite plugin (`vite.config.ts`), since the dev server needs inline styles. The e2e tests fail on any CSP violation; checked by hand that a forbidden fetch is blocked and caught, and that the full-motion atmosphere is clean
- [x] Accessibility pass with axe on every view (start, Signs, Bones, AI reading, Fortune, facts, delete confirmation, recovery banner), at desktop and phone widths: no violations
- [x] `.github/workflows/deploy.yml` copied from mythras (lint, typecheck, unit tests, e2e, build, deploy to Pages); uploads the Playwright results if a run fails
- [x] Enable Pages on the repo (Brandon, 2026-11-05). Push to `main` only after Brandon confirms
- [x] README: what it is, BYOK note, session files, credits and links to the official deck, dice and book (wording follows the licence decision)

**Success criteria:** the live Pages URL works end-to-end in Chrome (file autosave) and Safari (download fallback).

---

## Later (not v1)

- One-click book tables that feed the AI: Activities p.66, Exploring p.136, Fortune examples p.135, Complications p.221
- A "don't repeat recent cards" session option
- A serverless proxy instead of BYOK
- Cross-device sync

## Verification (whole project)
`npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build` passes locally and in CI. Then do a manual playthrough of the spec's Part 4 examples on the deployed site.
