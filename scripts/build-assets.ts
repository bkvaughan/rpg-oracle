// Generates the web art in public/ from the source images in data/.
// The source card PNGs (about 47 MB) are gitignored; the generated WebP files are committed,
// so this only needs re-running if the source art changes.
import { mkdir } from 'node:fs/promises'
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

// Die faces come from the official dice templates (Brandon, 2026-11-05). Each template is a
// die net: six faces in a staircase on a 3 x 3 grid of cells, with red cut lines on the
// cell borders. A face is cut from one cell ([row, column]) as a solid-colour glyph on
// transparency, drawn on the coloured die body by the UI. Blank faces need no image.
interface Face {
  cell: [number, number]
  file: string
}
interface DieTemplate {
  source: string
  /** Glyph colour for this die's body (white on the red Judgment die, dark on the bone Twins). */
  colour: string
  faces: Face[]
}

const TEMPLATES: DieTemplate[] = [
  {
    source: 'judgment.png',
    colour: '#ffffff',
    faces: [
      { cell: [1, 0], file: 'judgment-yes' },
      { cell: [0, 0], file: 'judgment-no' },
    ],
  },
  {
    source: 'twins-of-fate.png',
    colour: '#1c1b1d',
    faces: [
      { cell: [2, 0], file: 'fate-yes' },
      { cell: [1, 1], file: 'fate-no' },
    ],
  },
  {
    source: 'fortune.png',
    colour: '#f4c542',
    faces: [{ cell: [2, 0], file: 'fortune-sun' }],
  },
  {
    source: 'fortune.png',
    colour: '#f1ece0',
    faces: [{ cell: [1, 1], file: 'misfortune-skull' }],
  },
  {
    // Tales of Argosa p.66: 1 Threat, 2 Socialising, 3 Eating, 4 Working, 5 Traveling, 6 Resting.
    source: 'activity-die.png',
    colour: '#ffffff',
    faces: [
      { cell: [2, 2], file: 'activity-1' }, // dagger
      { cell: [1, 1], file: 'activity-2' }, // people
      { cell: [1, 0], file: 'activity-3' }, // drumstick
      { cell: [2, 1], file: 'activity-4' }, // shovel
      { cell: [2, 0], file: 'activity-5' }, // footprint
      { cell: [0, 0], file: 'activity-6' }, // campfire
    ],
  },
]

const FACE_SIZE = 256
// Trim inside each cell so the red cut lines are left out.
const CUT_LINE_INSET = 16

async function cutFace(source: string, [row, col]: [number, number], colour: string, out: string) {
  const { width = 0 } = await sharp(source).metadata()
  const cell = width / 3
  const size = Math.floor(cell) - 2 * CUT_LINE_INSET
  // Dark ink on white paper becomes opacity: black glyph -> opaque, white paper -> clear.
  const alpha = await sharp(source)
    .flatten({ background: '#ffffff' })
    .extract({ left: Math.round(col * cell) + CUT_LINE_INSET, top: Math.round(row * cell) + CUT_LINE_INSET, width: size, height: size })
    .resize(FACE_SIZE, FACE_SIZE)
    .greyscale()
    .negate()
    .raw()
    .toBuffer()
  await sharp({ create: { width: FACE_SIZE, height: FACE_SIZE, channels: 3, background: colour } })
    .joinChannel(alpha, { raw: { width: FACE_SIZE, height: FACE_SIZE, channels: 1 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(out)
}

async function buildDice() {
  await mkdir('public/dice', { recursive: true })
  for (const { source, colour, faces } of TEMPLATES) {
    for (const { cell, file } of faces) {
      await cutFace(`data/dice/templates/${source}`, cell, colour, `public/dice/${file}.webp`)
    }
  }
}

await buildCards()
await buildDice()
console.log('Assets built: public/cards, public/dice')
