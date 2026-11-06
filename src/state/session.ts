import { z } from 'zod'
import { storedReadingSchema } from '../ai/schema.ts'
import { resolve, type BonesResult } from '../engine/bones.ts'

// A session is one play-through's journal: who the PC is, where they are, every question
// asked with its raw oracle result, and the facts the player has pinned. Saved as a JSON file.

export const SCHEMA_VERSION = 1

const answer = z.enum(['Yes', 'No'])
const fateFace = z.enum(['Yes', 'No', 'Nil'])
const fortuneFace = z.enum(['Fortune', 'Misfortune', 'Nil'])
const likelihood = z.enum(['even', 'likely-yes', 'likely-no'])

const castSchema = z.object({
  judgment: answer,
  fate: z.tuple([fateFace, fateFace]),
  fortune: fortuneFace,
})

const hourSchema = z.object({ roll: z.number().int(), hour: z.number().int(), label: z.string() })

// Results store what the dice and cards showed; answers are always re-derived by the engine.
export const signsResultSchema = z.object({
  tool: z.literal('signs'),
  cardIds: z.array(z.number().int().min(1).max(50)).min(1).max(2),
  hour: hourSchema.nullable(),
})

export const bonesResultSchema = z.object({
  tool: z.literal('bones'),
  likelihood,
  cast: castSchema,
  reroll: z.object({ die: z.enum(['judgment', 'fate1', 'fate2']), from: fateFace, to: fateFace }).nullable(),
  final: castSchema,
})

export const fortuneResultSchema = z.object({
  tool: z.literal('fortune'),
  face: fortuneFace,
})

// A standalone Activity Die roll. No longer offered (Activity & Reaction replaced it), but
// kept so sessions saved with one still load and display.
export const activityResultSchema = z.object({
  tool: z.literal('activity'),
  roll: z.literal([1, 2, 3, 4, 5, 6]),
  creature: z.enum(['intelligent', 'other']),
})

const d6 = z.literal([1, 2, 3, 4, 5, 6])

// Activity & Reaction (p.66): 2d6 for Reaction, with the first die read as the Activity
// Die, as in the book's gate-guard example. The Activity roll is dice[0], not stored twice.
export const reactionResultSchema = z.object({
  tool: z.literal('reaction'),
  dice: z.tuple([d6, d6]),
  creature: z.enum(['intelligent', 'other']),
})

// New tools are added as new union members, so older session files keep loading.
export const oracleResultSchema = z.discriminatedUnion('tool', [
  signsResultSchema,
  bonesResultSchema,
  fortuneResultSchema,
  activityResultSchema,
  reactionResultSchema,
])

export const entrySchema = z.object({
  id: z.string().min(1),
  at: z.iso.datetime(),
  question: z.string(),
  result: oracleResultSchema,
  reading: storedReadingSchema.nullable(),
  // Added after v1 shipped; the defaults let older files load without a schema bump.
  /** What happened in play after this answer, in the player's words. */
  note: z.string().default(''),
  /** The player adopted the reading's alternate instead of its ruling. */
  useAlternate: z.boolean().default(false),
})

export const factSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  source: z.enum(['player', 'ai']),
  at: z.iso.datetime(),
})

export const sessionSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  journal: z.array(entrySchema),
  facts: z.array(factSchema),
})

export type OracleResult = z.infer<typeof oracleResultSchema>
export type SignsResult = z.infer<typeof signsResultSchema>
export type BonesEntryResult = z.infer<typeof bonesResultSchema>
export type ActivityResult = z.infer<typeof activityResultSchema>
export type ReactionResult = z.infer<typeof reactionResultSchema>
export type JournalEntry = z.infer<typeof entrySchema>
export type Fact = z.infer<typeof factSchema>
export type Session = z.infer<typeof sessionSchema>

export function newSession(at: string, id: string = crypto.randomUUID()): Session {
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    name: 'Untitled session',
    createdAt: at,
    updatedAt: at,
    journal: [],
    facts: [],
  }
}

/** The Bones answer for a stored result, derived from the final dice. */
export function bonesOutcome(result: BonesEntryResult): BonesResult {
  return resolve(result.final)
}
