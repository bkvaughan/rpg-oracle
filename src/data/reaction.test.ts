import { expect, test } from 'vitest'
import { reactionFor } from './reaction.ts'

// The balanced chart, Tales of Argosa p.66.
test('every 2d6 total falls in the right band, boundaries included', () => {
  const labels = Array.from({ length: 11 }, (_, i) => reactionFor(i + 2).label)
  expect(labels).toEqual([
    'Hostile', 'Hostile',
    'Unfriendly', 'Unfriendly',
    'Neutral', 'Neutral', 'Neutral',
    'Fairly friendly', 'Fairly friendly',
    'Affable', 'Affable',
  ])
})

test('impossible totals are rejected', () => {
  expect(() => reactionFor(1)).toThrow(RangeError)
  expect(() => reactionFor(13)).toThrow(RangeError)
})
