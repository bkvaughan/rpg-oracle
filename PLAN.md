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
- Part 8: done; live at https://bkvaughan.github.io/rpg-oracle/ (deploy run for `5eb4187` succeeded 2026-11-05; smoke-tested: page, CSP, card and dice art, fonts, no console errors). Safari download fallback and Chrome autosave checked by Brandon (2026-11-05). Remaining: a real Interpret
- Part 9 (Activity Die, plus all dice faces from the official templates): done, approved, committed and pushed
- Part 10 (Activity & Reaction): done, approved, committed and pushed
- Part 11 (code review fixes): done, approved, committed and pushed
- Part 8 remaining check: real Interprets run live by Brandon, working (2026-11-06)
- Part 12 (Activity & Reaction follow-ups): done, approved, committed and pushed (deploy for `a88a449` succeeded 2026-11-06)
- Part 12 reverted (2026-11-06): Brandon tried Reaction follow-ups in play and they didn't feel right; committed and pushed (deploy for `833f76e` succeeded)
- Part 13 (play notes, choosing the alternate, tighter layout): done, approved, committed and pushed (deploy for `1caf652` succeeded 2026-11-06)
- Part 14 (remove the PC and location): done, approved, committed and pushed. A "don't repeat recent cards" option was built and reverted before commit at Brandon's request
- Part 15 (interpret automatically): built and committed, then reverted at Brandon's request (2026-11-06: worse in use than it sounded). Interpret stays a button
- Signs time and direction beside the cards: committed and pushed with Parts 14-15 (deploy for `a99e6ba` succeeded 2026-11-06)
- Part 16 (UI/UX pass, run as a 5-iteration loop): done, approved, committed and pushed
- Part 17 (drop Or, When and Where from readings): done, approved, committed and pushed with Part 16 (deploy for `d8c431a` succeeded 2026-11-06)
- Part 18 (second UI/UX loop, 10 iterations): done, approved, committed and pushed (deploy for `0480e19` succeeded 2026-11-06)
- Part 19 (session context): done, approved, committed and pushed. Review fixes: done, committed
- Part 20 (plain rulings, Open without a file-type filter): done, approved, committed and pushed

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

- [x] `scripts/build-assets.ts` (using `sharp`): convert `data/cards/NN.png` to `public/cards/NN.webp` at 400 px wide, plus `NN@2x.webp` at the full 771 px source width (rather than upscaling to 800) for high-DPI screens. Copy `data/dice/*.webp` to `public/dice/` (superseded in Part 9: faces are now cut from the official templates)
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

## Part 9: Activity Die

Brandon asked for the Activity Die (Tales of Argosa p.66): a d6 the GM rolls, usually alongside a Reaction check, to see what an encountered creature is doing. There are six results (1 Threat, 2 Socialising, 3 Eating, 4 Working, 5 Traveling, 6 Resting), each with example activities for intelligent creatures and for other creatures. The Exploring and travel tables call for it ("Roll for Reaction and Activity").

- [x] `ORACLE_SPEC.md`: an Activity Die section with the table (examples in our own words, page reference)
- [x] `src/data/activity.ts`: the six results with both example lists, our wording, citing p.66
- [x] Engine: `rollActivity(rng)` (1d6 via the secure RNG)
- [x] Session: a new `activity` result (`roll`, `creature: 'intelligent' | 'other'`). It's an added union member, so existing session files still load and the schema version stays 1
- [x] Ask form: a fourth oracle, **Activity Die**, with an Intelligent / Other creature choice. The question is optional (e.g. "The goblins at the ford"). Superseded in Part 10: now rolled as part of Reaction & Activity
- [x] Result view: an Activity die face with our own icon, the status name, and the chosen column's examples (the other column shown smaller)
- [x] Journal line and AI prompt: describe the roll; the system prompt explains the Activity Die so readings can use it
- [x] Tests: data, engine, ask, schema, describeResult, prompt, component, e2e flow, axe on the new view

Notes:
- Source: printed p.66 (PDF page 68), checked against the extracted text. The book's companion Reaction table (2d6, balanced) sits beside it and is not included.
- Die faces from the official Activity Die template Brandon provided (replacing the first-draft hand-drawn SVGs): `npm run assets` cuts the six faces out of the net in `data/dice/templates/activity-die.png`. Shown on a teal die body (`--mist`) to set it apart from the Bones. At Brandon's request, every die now comes from the official templates (`data/dice/templates/`): the asset script cuts each face out of its die net in the die's glyph colour, replacing the faces copied from the dddice set. The old dddice face files and the dice contact sheet were deleted at Brandon's request.
- 122 unit/component tests; e2e and axe pass across 5 repeated runs.

---

## Part 10: Activity & Reaction

Brandon asked for the Reaction table (Tales of Argosa p.66), then decided to roll it together with the Activity Die as one oracle, as the book does. When the PCs meet a creature the GM rolls 2d6 for its reaction on a balanced chart (2-3 Hostile, 4-5 Unfriendly, 6-8 Neutral, 9-10 Fairly friendly, 11-12 Affable); the book's gate-guard example (p.67) reads the leftmost die as the Activity Die.

- [x] `ORACLE_SPEC.md`: a Reaction & Activity section with the balanced chart (descriptions in our own words) and the one-roll reading
- [x] `src/data/reaction.ts`: the five bands, with labels in the book's terms and descriptions in our words
- [x] Engine: `rollReaction(rng)`, returning 2d6 as two dice; the first is the Activity Die
- [x] Session: a `reaction` result (`dice`, `creature`); the Activity roll is `dice[0]`, not stored twice. The standalone `activity` result from Part 9 stays readable for sessions saved with it
- [x] Ask form: one oracle, **Reaction & Activity** ("A creature you meet: how it reacts and what it's doing"), with the Intelligent / Other creature choice. It replaces the separate Activity Die option
- [x] Result view: the teal Activity Die and a plain pip die, "Reaction (3 + 2 = 5)", the band and its meaning, then the Activity status and examples
- [x] Journal line and AI prompt
- [x] Tests across data, engine, schema, ask, describeResult, prompt, components, e2e and axe

Notes: removed `src/engine/activity.ts` (the standalone roll is no longer offered). Follow-up (Brandon): renamed to **Activity & Reaction**, Activity section first with its die, then Reaction with both dice as plain white d6 with black pips. The journal line and the AI prompt list the activity first. 131 unit/component tests; e2e and axe pass across 3 repeated runs.

Not included: each monster's own Reac ranges from its stat block. Those vary per creature and the balanced chart is the book's general fallback; the 2d6 total is shown so it can be read against them.

---

## Part 11: Code review fixes

A full critical code pass (2026-11-05) found ways a player can lose work in the save and recovery wiring, plus smaller issues.

- [x] Recovery: while the recovery banner is waiting for an answer, nothing overwrites the crash copy; Discard then backs up the current session. Restore asks for an inline confirm when the current session has entries or facts
- [x] Open (picker and fallback) asks the same inline confirm as New when there are unsaved changes or a recovery offer pending
- [x] Autosave: writes run one at a time in order, and the status only says Saved (and the crash copy is only marked saved) when the newest change has been written
- [x] Download fallback: revoke the object URL after a delay, not straight after `click()` (Safari can cancel the download)
- [x] Interpret: abort the request when its result view closes, so a second click can't send a duplicate paid call
- [x] New: a crash copy that can't be cleared (no IndexedDB) is not reported as a save error
- [x] AI settings: a key that can't be stored (private window) is kept for the visit and the panel says so, instead of throwing
- [x] Reaction dice: the first die's label says it is the Activity Die; e2e checks both dice are visible; stray blank line in `oracle.css`
- [x] Tests for each fix

Notes: new `src/ui/useSessionStore.test.tsx` (recovery hold, Discard, Restore, banner confirm) and `src/ai/settings.test.ts`; autosave ordering, delayed revoke, Open confirm and Interpret abort tests added to existing files. Checked that the recovery-hold test fails without the fix. 142 unit/component tests; e2e and axe pass.

---

## Part 12: Activity & Reaction follow-ups

Brandon asked whether readings should suggest the other tools as follow-ups too. Decided (2026-11-06): a reading can suggest **Activity & Reaction** when it introduces a creature whose attitude is unknown. The **Fortune die** is not a follow-up tool. It answers no question, and the AI suggesting when to roll for a twist would have it decide when randomness happens.

- [x] `ORACLE_SPEC.md`: the reading contract and AI call sections allow `tool: "reaction"` with a nullable `creature` (`intelligent` / `other`), meaningful only for Reaction, the way `likelihood` is only for the Bones; add the interpretation guideline for when to suggest it
- [x] `src/ai/schema.ts`: `followUpSchema.tool` adds `'reaction'`; add nullable `creature`. Widening the enum keeps existing session files loading, so the schema version stays 1
- [x] `src/ai/prompt.ts`: the follow_ups instruction covers Reaction (only for a creature or person the reading introduces whose attitude is unknown; set `creature`), with null `likelihood` and null `creature` where they don't apply
- [x] Follow-up button label shows "Activity & Reaction, intelligent/other creature"; clicking it prefills the ask form with the Reaction tool and the creature choice
- [x] Tests: schema (old readings without `creature` still load), prompt, ReadingView label, App prefill, e2e follow-up click into Reaction

Notes: `followUpSchema` (sent to the API) keeps `creature` required, since structured outputs need every field; `storedReadingSchema` (session files) defaults a missing `creature` to null so older files load. Follow-up button names have no space before the bracket in the accessibility tree, so tests match them with a regex. 146 unit/component tests; e2e and axe pass.

---

## Part 12 revert

Brandon tried Reaction follow-ups in play (2026-11-06) and they didn't feel right. Follow-ups go back to the Signs and the Bones only.

- [x] Revert the Part 12 spec, schema, prompt, UI and tests
- [x] Session files saved with a Reaction follow-up still load; `storedReadingSchema` drops those follow-ups (unit test)

---

## Part 13: Play notes, choosing the alternate, tighter layout

Brandon asked how the site could be improved (2026-11-06) and picked these three: there's nowhere to write what happened in play, the alternate reading can't be adopted, and the page scrolls too much. He chose to keep one column, tightened.

- [x] Play notes: `note` on each entry (default `''`, so old files load at schema version 1), a `setEntryNote` action, a "What happened" box on the result (saved on blur), shown in the journal, and sent to the AI as established play
- [x] Choose the alternate: `useAlternate` on each entry (default false), a `chooseReading` action (Interpret again resets it), a "Use this reading" button, and later prompts get the chosen reading via `chosenRuling()`
- [x] Tighter one column: smaller hero, compact ask form, smaller card art and dice, one line per journal entry, and the result scrolls into view after Ask or selecting an entry
- [x] `ORACLE_SPEC.md`: notes and the chosen reading in "What the AI receives"
- [x] Tests: schema defaults, reducer actions, prompt context and prompt text, note and alternate components, e2e request body carries the note and the chosen alternate; axe

Notes: the journal shows one line per field (question and time, result, note), each truncated, rather than one line per entry, since the half-width column can't fit a whole entry. The oracle choices sit two by two on a phone. The desktop page with one result is about 250px shorter; the hero, oracle choices, card art (max 22rem for the pair) and compass are all smaller. The e2e test checks that the second Interpret request carries the chosen alternate and the note. 153 unit/component tests; e2e and axe pass. `sessions/testing-responses.json` loads with the defaults.

---

## Part 14: Remove the PC and location

Brandon (2026-11-06): the site is just a source of answers. He tried a "don't repeat recent cards" option and had it reverted before commit, and asked for the PC fields to go.

- [x] Remove the "Character and location" panel (PC name, class, level, hex, site, room), the `setPc` / `setLocation` actions, and the fields from `Session`. Zod drops them from older files, so they still load at schema version 1
- [x] The AI prompt no longer has a Session section
- [x] `ORACLE_SPEC.md` "What the AI receives" updated
- [x] Tests: an old file with the fields loads without them; prompt, context, reducer and file tests updated

---

## Part 16: UI/UX pass

Brandon asked (2026-11-06) for a significant UI/UX improvement, with thorough tests, run as a five-iteration loop. Scope follows his steer that the site stays a lean source of answers: layout, clarity and feedback, no new mechanics. Nothing is committed until he reviews it.

Iteration 1
- [x] Session and AI settings share one compact bar (one row on desktop), so the ask form starts about 230px higher
- [x] The API key field gets the site's input style (password inputs were unstyled); model names are no longer cut off
- [x] Interpretation controls sit above the reading; while re-interpreting, the old reading stays visible but dimmed, and the region is `aria-busy`
- [x] Tests: component test for the re-interpret busy state; e2e and axe pass

Iteration 2
- [x] The journal shows each interpreted entry's answer (the chosen reading, one line), so a session can be scanned without opening entries
- [x] The reading's When and Where share one row
- [x] Coverage: `@vitest/coverage-v8` and `npm run test:coverage` (v8, `src/`, tests and fixtures excluded). Baseline 74% of lines
- [x] Tests: `SessionBar.test.tsx` (every save status, rename, New/Open confirm with Keep and Discard, Save / Save as / Download, the fallback file picker), `Journal.test.tsx` (order, answer and note lines, selection, delete confirm), `FactsPanel.test.tsx` (blank fact removed on blur, remove button); e2e checks the journal shows the ruling and then the chosen alternate. SessionBar 48% -> 100% of lines; overall 77% (most of the rest is the decorative `atmosphere.ts`). 170 unit/component tests

Iteration 3
- [x] Keyboard: "/" jumps to the question from anywhere outside a text field (`src/ui/keys.ts`); Escape cancels a running interpretation (`aria-keyshortcuts` on Cancel)
- [x] First visit: a short "How to ask" guide sits where the result goes until the first question, in our own words with page references, and mentions the "/" shortcut
- [x] Tests: `keys.test.ts`; Escape cancel; App tests for the guide, "/", the exact hour and a note reaching the journal, choosing the alternate and its reset, Forget key; new e2e for the guide, "/" and Escape against a hanging API call. App.tsx 84% -> 98% of lines; overall 79%. 177 unit/component tests, 9 e2e

Iteration 4
- [x] Touch screens (`pointer: coarse`): small buttons get a 44px target (WCAG 2.5.5); before, the journal's delete was 30x29 and most small buttons 32px tall
- [x] After a failed interpretation the button says "Try again"; the facts placeholder reads as an example ("e.g. ...")
- [x] Tests: e2e on an emulated phone (touch, 390px) measures every visible button after a full reading; checked that it fails, listing eight buttons, without the new CSS. 10 e2e

Iteration 5
- [x] Review pass: a screenshot tour of a full session at desktop and phone widths
- [x] Direction: the compass and its reading sit side by side, which shortens the phone layout
- [x] All checks: 177 unit/component tests, 10 e2e (axe on every view at both widths, touch targets), typecheck, lint, build. Coverage 79% of lines (74% before Part 16); App.tsx 98%, SessionBar 100%

Notes: uncommitted, for Brandon's review. Each iteration is a separable change if he wants to keep only some: the top bar, interpretation controls, journal answers, keyboard and first-visit guide, touch targets.

---

## Part 17: Drop Or, When and Where from readings

Brandon (2026-11-06): remove the alternate, time and direction under the interpreted result. They are removed from the AI contract too, so responses are shorter; the cards already show time and direction.

- [x] `readingSchema` loses `alternate`, `time` and `direction`; the system prompt drops those fields and its example, and the ruling ties in the primary card's time or direction when it matters
- [x] "Use this reading" goes: `useAlternate`, `chooseReading` and `chosenRuling` are removed. Older files load; an alternate the player had chosen becomes that entry's ruling (`adoptChosenAlternate` in `session.ts`)
- [x] `ORACLE_SPEC.md` reading contract and AI call updated
- [x] Tests: old readings load with a chosen alternate kept as the ruling; ReadingView shows no Or/When/Where; the prompt asks for none of them; e2e checks the structured-output schema has only ruling, why, follow_ups and new_facts. `sessions/testing-responses.json` still loads

---

## Part 18: Second UI/UX loop

Brandon asked (2026-11-06) for another UI/UX pass, as a loop of up to ten iterations. Same scope rule as Part 16: layout, clarity and feedback for a lean source of answers; no new mechanics. Uncommitted until he reviews it.

Iteration 1
- [x] Bones: on wide screens the answer and what it means sit beside the dice (like the Signs' time and direction), with the Fortune twist below across both
- [x] Interpret gets the primary style while a key is saved and there's no reading yet: it's the next step
- [x] Tests: component test for when Interpret is primary; e2e and axe pass

Iteration 2
- [x] Activity & Reaction: on wide screens Activity and Reaction sit side by side, split by a rule, about 250px shorter
- [x] Tests: `tests/e2e/layout.spec.ts` checks by position that Signs, Bones and Activity & Reaction put their halves side by side at 1280px and stack at 390px with no sideways scroll; checked that the desktop cases fail when the wide-screen CSS doesn't apply. 16 e2e

Iteration 3
- [x] Faster first reading: with a key saved, the SDK chunk (about 380 KB, as large as the rest of the app) is fetched while the browser is idle, not on the first Interpret click. No key, no fetch
- [x] A result with no question (Fortune, Activity & Reaction) gets a small, quiet "No question asked" heading instead of a large grey one; it still names the result for screen readers
- [x] Tests: e2e that the SDK chunk isn't fetched without a key and is fetched after saving one, before any click; component test for the heading. 177 unit/component, 17 e2e

Iteration 4
- [x] Without a key, "AI settings" in the result's hint is a link: it opens the settings, scrolls to them and puts the cursor in the key field
- [x] Tests: App test (settings closed, link opens them, key field focused); e2e (key field focused and in view). 178 unit/component, 18 e2e

Iteration 5
- [x] Fix: after a reload the browser restored the old scroll position, so the recovery banner (at the top) could be off screen; the page now starts at the top (`history.scrollRestoration = 'manual'` in `main.tsx`)
- [x] The recovery banner says what the copy holds ("1 question, 1 fact"), so the player can judge whether to restore it
- [x] Tests: `RecoveryBanner.test.tsx` (counts and plurals; Restore, and Replace/Keep when the current session holds work); the e2e recovery test now asks first (scrolling down), and checks the counts and that the banner is in view; checked that it fails without the fix. 180 unit/component, 18 e2e

Iteration 6
- [x] Bones: visible captions under the dice in the book's terms (Hammer of Judgment, Twins of Fate across both Twins, Fortune die); hidden from screen readers, since each die's label already names it
- [x] Tests: component test for the captions and their `aria-hidden`; axe passes. 181 unit/component, 18 e2e

Iteration 7
- [x] Coverage gap: the session store's file flows were 48% covered. `useSessionStore.files.test.tsx` runs them against a stand-in File System Access API: Save picks and writes, then later changes autosave to the same file; cancelling a picker changes nothing; a failed write is reported and the work stays in memory; Open loads a file and reports a damaged one; New starts empty; without the API, Save downloads and Open reads a file input. Store 48% -> 94%, `fileStore.ts` 100% of lines, overall 79% -> 87%
- [x] Established facts: a one-line hint says pinned facts go with every interpretation
- [x] Removed the banner tests duplicated in iteration 5 (the store tests already cover Restore/Replace/Keep). 188 unit/component, 18 e2e

Iteration 8
- [x] Phones: the title shrinks and the tagline is hidden, so the ask button sits on the first screen (its bottom was at 915px on an 844px phone, now 796px)
- [x] Tests: e2e that on a 390x844 phone the ask button is fully in view on load (key saved, settings closed); `AiSettingsPanel.test.tsx` (open without a key, trimmed key and chosen model saved, the visit-only message and its clearing, closed with a key, Forget key); settings fall back on corrupt or retired stored values. 192 unit/component, 19 e2e

Iteration 9
- [x] Fix: one long unbroken word in a question widened the main grid column to fit it, so every panel stretched and a 390px phone page scrolled sideways (730px wide). `.stack` now uses `minmax(0, 1fr)` and `overflow-wrap: break-word`, so long words wrap
- [x] Tests: e2e drives a long unbroken word through the session name, question, note and a fact at 390px and checks there's no sideways scroll; checked that it fails (730px) without the fix. 192 unit/component, 20 e2e

Iteration 10
- [x] Review pass: a screenshot tour of a full session at desktop and phone widths; no regressions found
- [x] All checks: 192 unit/component tests (176 at the start of Part 18), 20 e2e (17 at the start), typecheck, lint, build. Coverage 87% of lines (79% at the start); the rest is mostly the decorative `atmosphere.ts`

Notes: uncommitted, for Brandon's review. Two real bugs found and fixed with regression tests: the recovery banner hidden after a reload (iteration 5) and sideways scroll from long words (iteration 9). Each other iteration is a separable change.

---

## Later (not v1)

- One-click book tables that feed the AI: Activities p.66, Exploring p.136, Fortune examples p.135, Complications p.221
- A serverless proxy instead of BYOK
- Cross-device sync

## Verification (whole project)
`npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build` passes locally and in CI. Then do a manual playthrough of the spec's Part 4 examples on the deployed site.

## Part 19: Session context

Brandon, after his first real session (2026-11-06): a place for broader context that applies to every question and roll.

- [x] `context: z.string().default('')` on the session; older files load with an empty context, no schema bump
- [x] Reducer action `setContext`
- [x] Sent first in the user prompt as "# Session context (from the player)" when set; one system-prompt guideline to treat it as established
- [x] "Session context" fold-out in the toolbar, between the session bar and AI settings; the summary previews the first line; every keystroke goes to the session (first built to save on blur; changed after review, see below)
- [x] Tests: schema default, reducer, prompt context, prompt, ContextPanel component, App, and the e2e request body
- [x] ORACLE_SPEC.md updated
- [x] Review fixes (2026-11-06): a session holding only a context counts as work, so New, Open and Restore ask first; the recovery banner mentions the context; the context saves on every keystroke, because a crash-copy write started as the page unloads doesn't finish (checked in Chromium), so saving on blur or pagehide lost text typed just before a reload; the spec no longer gives two things the name "Session context"

## Part 20: Plain rulings

Brandon (2026-11-06): the ruling repeated the words that Why then explains. The ruling now states the answer plainly, and Why names the words.

- [x] System prompt: the ruling doesn't name the words, art or dice or explain itself; Why names the Signs words; the worked example follows suit
- [x] ORACLE_SPEC.md (target voice, the returned fields, the worked example) and the e2e mock reading updated
- [x] Prompt test for the new guidance
- [x] Open's file picker has no type filter: Chrome on macOS greyed out session files the first time it opened (Brandon, 2026-11-06). The contents are still checked, so a wrong file is reported and changes nothing. Save keeps the filter
