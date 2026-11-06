import { expect, test } from 'vitest'
import { ACTIVITIES, activityFor } from './activity.ts'

// Tales of Argosa p.66.
test('six results in the book order, each with both example lists', () => {
  expect(ACTIVITIES.map((a) => `${a.roll} ${a.status}`)).toEqual([
    '1 Threat',
    '2 Socialising',
    '3 Eating',
    '4 Working',
    '5 Traveling',
    '6 Resting',
  ])
  for (const a of ACTIVITIES) {
    expect(a.intelligent.length).toBeGreaterThan(10)
    expect(a.other.length).toBeGreaterThan(10)
  }
})

test('activityFor looks up by roll', () => {
  expect(activityFor(3).status).toBe('Eating')
})
