import { describe, expect, test } from 'vitest'
import { CARDS } from '../data/deck.ts'
import { formatHour, readTheSigns, rollHour } from './signs.ts'
import { scriptedRng, seededRng } from './rng.ts'

describe('readTheSigns', () => {
  test('draws two distinct cards by default', () => {
    const rng = seededRng(1)
    for (let i = 0; i < 2_000; i++) {
      const { cards } = readTheSigns(rng)
      expect(cards).toHaveLength(2)
      expect(cards[0].id).not.toBe(cards[1].id)
    }
  })

  test('can draw a single card', () => {
    expect(readTheSigns(seededRng(2), 1).cards).toHaveLength(1)
  })

  test('first draw is the primary card, in draw order', () => {
    // First pick index 30 (Magician); second pick lands on the original index 45 (Death).
    const { cards } = readTheSigns(scriptedRng([30, 44]))
    expect(cards.map((c) => c.noun)).toEqual(['Magician', 'Death'])
  })

  test('every card can be drawn in either position', () => {
    const rng = seededRng(3)
    const primary = new Set<number>()
    const secondary = new Set<number>()
    for (let i = 0; i < 5_000; i++) {
      const { cards } = readTheSigns(rng)
      primary.add(cards[0].id)
      secondary.add(cards[1].id)
    }
    expect(primary.size).toBe(50)
    expect(secondary.size).toBe(50)
  })

  test('starts from a full deck every reading', () => {
    expect(CARDS).toHaveLength(50)
    readTheSigns(seededRng(4))
    expect(CARDS).toHaveLength(50)
    expect(CARDS[0].noun).toBe('Alien')
  })
})

describe('rollHour', () => {
  test('adds 1d6 hours to the start of each period (p.213)', () => {
    expect(rollHour('light-sun', scriptedRng([0]))).toEqual({ roll: 1, hour: 7, label: '7am' })
    expect(rollHour('light-sun', scriptedRng([5]))).toEqual({ roll: 6, hour: 12, label: 'Noon' })
    expect(rollHour('dark-sun', scriptedRng([2]))).toEqual({ roll: 3, hour: 15, label: '3pm' })
    expect(rollHour('light-moon', scriptedRng([5]))).toEqual({ roll: 6, hour: 0, label: 'Midnight' })
    expect(rollHour('dark-moon', scriptedRng([0]))).toEqual({ roll: 1, hour: 1, label: '1am' })
    expect(rollHour('dark-moon', scriptedRng([5]))).toEqual({ roll: 6, hour: 6, label: '6am' })
  })

  test('formatHour', () => {
    expect([0, 1, 11, 12, 13, 23].map(formatHour)).toEqual(['Midnight', '1am', '11am', 'Noon', '1pm', '11pm'])
  })
})
