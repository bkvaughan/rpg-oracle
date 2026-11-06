import { CARDS, type Card, type TimeIcon } from '../data/deck.ts'
import type { Rng } from './rng.ts'

// Read the Signs (Tales of Argosa p.213). See ORACLE_SPEC.md Part 1 for the decisions:
// draw without replacement from a fresh deck each reading; the first card is primary.

export interface SignsReading {
  /** In draw order; cards[0] is primary for time and direction. */
  cards: Card[]
}

/** Draws `count` distinct cards from a full, freshly shuffled deck (partial Fisher-Yates). */
export function readTheSigns(rng: Rng, count: 1 | 2 = 2): SignsReading {
  const deck = [...CARDS]
  for (let i = 0; i < count; i++) {
    const j = i + rng(deck.length - i)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return { cards: deck.slice(0, count) }
}

// Each time icon covers six hours; the exact hour is 1d6 hours after the start (p.213).
const PERIOD_START: Record<TimeIcon, number> = {
  'light-sun': 6,
  'dark-sun': 12,
  'light-moon': 18,
  'dark-moon': 0,
}

export interface HourRoll {
  roll: number
  /** 0-23 */
  hour: number
  label: string
}

export function formatHour(hour: number): string {
  if (hour === 0) return 'Midnight'
  if (hour === 12) return 'Noon'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

export function rollHour(icon: TimeIcon, rng: Rng): HourRoll {
  const roll = rng(6) + 1
  const hour = (PERIOD_START[icon] + roll) % 24
  return { roll, hour, label: formatHour(hour) }
}
