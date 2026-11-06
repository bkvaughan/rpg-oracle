import { expect, test } from 'vitest'
import { reactionTotal, rollReaction } from './reaction.ts'
import { scriptedRng } from './rng.ts'

test('rollReaction rolls two d6 in order', () => {
  expect(rollReaction(scriptedRng([0, 5]))).toEqual([1, 6])
  expect(reactionTotal([3, 2])).toBe(5)
})

// The book's example: 3 + 2 = 5, and the leftmost die (3) is the Activity Die: Eating.
test('the book example: 3 and 2', () => {
  const dice = rollReaction(scriptedRng([2, 1]))
  expect(reactionTotal(dice)).toBe(5)
  expect(dice[0]).toBe(3)
})
