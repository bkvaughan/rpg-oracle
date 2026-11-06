import { expect, test } from 'vitest'
import { rollActivity } from './activity.ts'
import { scriptedRng } from './rng.ts'

test('rollActivity is a d6 from 1 to 6', () => {
  expect([0, 1, 2, 3, 4, 5].map((v) => rollActivity(scriptedRng([v])))).toEqual([1, 2, 3, 4, 5, 6])
})
