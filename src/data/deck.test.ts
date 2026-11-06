import { expect, test } from 'vitest'
import deck from '../../data/deck_of_signs.json'

// Placeholder until Part 3 moves the deck into src/data as a typed, zod-validated import.
test('the source deck has 50 cards', () => {
  expect(deck.cards).toHaveLength(50)
})
