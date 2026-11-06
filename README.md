# RPG Oracle

A solo-play oracle for *Tales of Argosa*: **Read the Signs** (the Deck of Signs) for open questions and **Consult the Bones** for yes/no questions, with an optional AI interpretation of each result.

Live site: https://bkvaughan.github.io/rpg-oracle/

**Unofficial fan tool, not affiliated with Pickpocket Press.** *Tales of Argosa*, the Deck of Signs and Consult the Bones are by Pickpocket Press. Card art is by Earl Geier, Jeffrey Koch, Dean Spencer, Felipe da Silva, Bradley K McDevitt and others, as credited on the [official Deck of Signs](https://perchance.org/tales-of-argosa-read-the-signs). Dice faces are from the [official Consult the Bones set](https://dddice.com/dice/consult-the-bones-lnutsc0l). Get the book for the full rules.

## How it works

- Cards and dice use the browser's cryptographic random generator, following the book's rules: two cards drawn without replacement, and the Bones' cancelling, tie-break and likelihood rerolls. The rules readings are in `ORACLE_SPEC.md`.
- **Sessions are JSON files on your disk.** In Chrome and Edge, Save picks a file once and every change autosaves to it. In Safari and Firefox, Open reads a file and Download saves a copy. The browser also keeps a recovery copy in case a tab closes before you save.
- **AI interpretation is optional and uses your own Anthropic API key.** The key is stored only in your browser and sent only to `api.anthropic.com`, and calls are billed to your account. The AI only interprets: it is given the result as fact and never picks cards or rolls dice.

## Development

```
npm install
npm run dev         # development server
npm test            # unit and component tests
npm run test:e2e    # end-to-end and accessibility tests (first run: npx playwright install chromium)
npm run lint
npm run typecheck
npm run build
npm run assets      # regenerate WebP card and dice art (needs the source PNGs in data/cards, which are not committed)
```

Every push to `main` runs the checks and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
