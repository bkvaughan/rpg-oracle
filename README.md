# RPG Oracle

A solo-play oracle for *Tales of Argosa*: **Read the Signs** (Deck of Signs) and **Consult the Bones** (dice), with optional AI interpretation using your own Anthropic API key.

Unofficial fan tool, not affiliated with Pickpocket Press. Full rules and design: `ORACLE_SPEC.md`.

## Commands

```
npm install
npm run dev         # development server
npm test            # unit and component tests
npm run test:e2e    # end-to-end tests (first run: npx playwright install chromium)
npm run lint
npm run typecheck
npm run build
npm run assets      # regenerate WebP card and dice art (needs the source PNGs in data/cards)
```
