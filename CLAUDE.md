# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# RPG Oracle

A web-based solo-play oracle for *Tales of Argosa*. It simulates the book's two oracle tools, **Read the Signs** (Deck of Signs, p.213) and **Consult the Bones** (dice, p.212). An optional AI layer interprets the results in the context of the player's session. `ORACLE_SPEC.md` holds the rules, data, algorithm and AI contract, and is the source of truth.

**One principle above all:** randomness is done by code, never by the model. The site draws and rolls with a secure RNG and hands the results to the AI, which only interprets them.

## Technical Decisions

- Static single-page app: Vite + React + TypeScript (strict mode). No backend
- npm as the package manager; current Node LTS
- Vitest + React Testing Library for unit and component tests; Playwright (Chromium only) with `@axe-core/playwright` for end-to-end and accessibility tests
- oxlint (Vite React TypeScript template default) and `tsc -b` for typechecking
- Plain CSS with custom properties. No UI component library
- zod for the card data, session files and AI responses
- AI: bring-your-own-key. The Anthropic SDK runs in the browser with the player's own key, stored only in their browser. All network access goes through `src/ai/client.ts`
- Sessions: JSON files on disk via the File System Access API (autosave to the open file); Download / Open fallback on browsers without it; IndexedDB copy for crash recovery. `schemaVersion` on every file
- Art: card and dice art bundled as WebP, generated from the source images by `npm run assets`
- Deployment: GitHub Pages at `bkvaughan/rpg-oracle`, built and published by `.github/workflows/deploy.yml` on every push to `main`. Vite `base` is `./`
- Security: Content-Security-Policy meta tag limiting `connect-src` to `https://api.anthropic.com`; no third-party scripts; fonts self-hosted

### Architecture rules

- **The engine is pure.** Dice, deck and resolution logic live in `src/engine/` as pure TypeScript with no React imports. The UI never calculates oracle results itself.
- **Randomness is injectable.** Every engine function that draws or rolls takes an `rng` argument. Production uses `crypto.getRandomValues` with rejection sampling (never `Math.random`); tests use a seeded generator.
- **The AI only interprets.** The prompt states the result as fact. The AI is never asked to pick a card, roll, or override an outcome. The oracle works fully without AI.
- **The session stores facts, the AI suggests them.** `new_facts` from the AI are suggestions; nothing is pinned until the player accepts it.

### Folder layout

```
rpg-oracle/
  CLAUDE.md  PLAN.md  ORACLE_SPEC.md
  data/               source data: deck_of_signs.json, cards/*.png (gitignored), dice/*.webp
  reference/          bones.py (reference roller) and the dice contact sheet
  scripts/            build-assets (source images -> public/ WebP)
  public/             generated card and dice WebP served by the site
  src/
    data/             typed card data
    engine/           rng, signs, bones
    state/            Session type, reducer, file store, prompt context
    ai/               settings, schema, prompt, client
    ui/               React components
  tests/e2e/          Playwright tests
```

Unit tests sit next to the code they test (`foo.ts` and `foo.test.ts`).

## Copyright and licensing

*Tales of Argosa* and the Deck of Signs are by Pickpocket Press. The card art is credited on the official Perchance deck as "© and used with permission under various stock art licences" (Earl Geier, Jeffrey Koch, Dean Spencer, Felipe da Silva, Bradley K McDevitt, and others). The dice faces come from the official dddice set.

- **Decision (Brandon, 2026-11-05):** the public repo and site ship as an **unofficial fan tool** with the bundled art. The site footer and README say it is unofficial and not affiliated with Pickpocket Press, credit the book and artists, and link to the official deck, dice and book. If Pickpocket Press objects, switch to a words-only build.
- Never copy the book's prose into the app. Help text is short, in our own words, with a page reference ("see Tales of Argosa p.212").
- Never commit the book PDF.
- The card `art` descriptions in `deck_of_signs.json` are our own words.

## Coding Standards

1. Use the latest stable versions of libraries and idiomatic approaches
2. Keep it simple. Never over-engineer; no features beyond PLAN.md
3. Be concise. Keep the README minimal. No emojis in code, UI, docs or commit messages
4. When hitting issues, find the root cause with evidence before fixing
5. Every oracle rule has a unit test; the Bones probabilities are tested against the spec's table
6. If the rules are unclear, stop and ask Brandon. Do not invent a ruling; record the answer in ORACLE_SPEC.md
7. UI text uses the book's terms exactly (Read the Signs, Consult the Bones, Hammer of Judgment, Twins of Fate, Fortune die)

## Commands

Filled in during Part 2 (scaffolding).

## Working Documentation

PLAN.md is the plan and the checklist. Read it before starting work, work through it in order, tick items off as they are completed, and do not start a part until Brandon has approved the previous one.

- The Status section at the top of PLAN.md says where work stands. Update it at the end of each part
- At the end of each part: run all checks (test, e2e, typecheck, lint, build), report to Brandon, and commit (one commit per part, present tense) only after he approves. Push only with his confirmation
