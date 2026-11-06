import { z } from 'zod'
import raw from './deck_of_signs.json'

// The Deck of Signs (Tales of Argosa p.213). Transcribed from the official card art;
// see ORACLE_SPEC.md Part 1. deck.test.ts validates the JSON against this schema.

export const TIME_ICONS = ['light-sun', 'dark-sun', 'light-moon', 'dark-moon'] as const
export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

export const cardSchema = z.object({
  id: z.number().int().min(1).max(50),
  noun: z.string().min(1),
  verb: z.string().min(1),
  adjective: z.string().min(1),
  mood: z.string().min(1),
  time_icon: z.enum(TIME_ICONS),
  time: z.string().min(1),
  direction: z.enum(DIRECTIONS),
  image: z.string(),
  image_url: z.url(),
  art: z.string().min(1),
})

export const deckSchema = z.object({
  deck: z.string(),
  source: z.string(),
  cards: z.array(cardSchema).length(50),
})

export type Card = z.infer<typeof cardSchema>
export type TimeIcon = Card['time_icon']
export type Direction = Card['direction']

export const CARDS: readonly Card[] = raw.cards as Card[]

/** Card art paths in public/, relative so they resolve under the GitHub Pages base. */
export function cardImage(id: number): { src: string; srcSet: string } {
  const name = String(id).padStart(2, '0')
  return { src: `cards/${name}.webp`, srcSet: `cards/${name}.webp 1x, cards/${name}@2x.webp 2x` }
}
