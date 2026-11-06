import { existsSync, statSync } from 'node:fs'
import { expect, test } from 'vitest'

// Guards the committed output of `npm run assets`.
const ids = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0'))
const DICE = ['judgment-yes', 'judgment-no', 'fate-yes', 'fate-no', 'blank', 'fortune-sun', 'misfortune-skull']

test('every card has 1x and 2x WebP art', () => {
  const missing = ids.flatMap((n) => [`public/cards/${n}.webp`, `public/cards/${n}@2x.webp`]).filter((f) => !existsSync(f))
  expect(missing).toEqual([])
})

test('every die face is in public/dice', () => {
  expect(DICE.filter((d) => !existsSync(`public/dice/${d}.webp`))).toEqual([])
})

test('the 1x card set stays under 3 MB', () => {
  const total = ids.reduce((sum, n) => sum + statSync(`public/cards/${n}.webp`).size, 0)
  expect(total).toBeLessThan(3 * 1024 * 1024)
})
