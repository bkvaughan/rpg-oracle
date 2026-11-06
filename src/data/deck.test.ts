import { describe, expect, test } from 'vitest'
import { CARDS, cardImage, deckSchema } from './deck.ts'
import raw from './deck_of_signs.json'

describe('Deck of Signs data', () => {
  test('matches the schema', () => {
    expect(() => deckSchema.parse(raw)).not.toThrow()
  })

  test('ids run 1 to 50 in order', () => {
    expect(CARDS.map((c) => c.id)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1))
  })

  // Distribution from ORACLE_SPEC.md Part 1, counted from the card art.
  test('time icon distribution', () => {
    const count = (icon: string) => CARDS.filter((c) => c.time_icon === icon).length
    expect([count('dark-sun'), count('light-sun'), count('dark-moon'), count('light-moon')]).toEqual([13, 12, 13, 12])
  })

  test('direction distribution', () => {
    const counts = Object.fromEntries(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((d) => [d, CARDS.filter((c) => c.direction === d).length]))
    expect(counts).toEqual({ N: 6, NE: 4, E: 7, SE: 6, S: 7, SW: 6, W: 8, NW: 6 })
  })

  test('time text matches the time icon', () => {
    const periods = { 'light-sun': 'Morning', 'dark-sun': 'Afternoon', 'light-moon': 'Evening', 'dark-moon': 'Late Night' }
    for (const c of CARDS) expect(c.time.startsWith(periods[c.time_icon])).toBe(true)
  })

  test('the book example cards (p.213)', () => {
    expect(CARDS[30]).toMatchObject({ noun: 'Magician', verb: 'Conjuring', adjective: 'Learned', mood: 'Enchanted' })
    expect(CARDS[45]).toMatchObject({ noun: 'Death', verb: 'Decaying', adjective: 'Uncaring', mood: 'Doomed' })
  })

  test('cardImage builds padded WebP paths', () => {
    expect(cardImage(7)).toEqual({ src: 'cards/07.webp', srcSet: 'cards/07.webp 1x, cards/07@2x.webp 2x' })
  })
})
