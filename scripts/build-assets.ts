// Generates the web art in public/ from the source images in data/.
// The source card PNGs (about 47 MB) are gitignored; the generated WebP files are committed,
// so this only needs re-running if the source art changes.
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import sharp from 'sharp'

const CARD_COUNT = 50
// 400 px for normal screens; @2x for high-DPI uses the full source width (771 px) rather
// than upscaling to 800.
const WIDTHS = [
  { suffix: '', width: 400 },
  { suffix: '@2x', width: 771 },
]
const QUALITY = 78

async function buildCards() {
  await mkdir('public/cards', { recursive: true })
  for (let id = 1; id <= CARD_COUNT; id++) {
    const name = String(id).padStart(2, '0')
    for (const { suffix, width } of WIDTHS) {
      await sharp(`data/cards/${name}.png`)
        .resize({ width })
        .webp({ quality: QUALITY, alphaQuality: 90 })
        .toFile(`public/cards/${name}${suffix}.webp`)
    }
  }
}

async function copyDice() {
  await mkdir('public/dice', { recursive: true })
  for (const file of await readdir('data/dice')) {
    if (file.endsWith('.webp')) await copyFile(`data/dice/${file}`, `public/dice/${file}`)
  }
}

await buildCards()
await copyDice()
console.log('Assets built: public/cards, public/dice')
