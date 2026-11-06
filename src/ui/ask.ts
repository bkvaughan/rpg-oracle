import type { Creature } from '../data/activity.ts'
import { rollActivity } from '../engine/activity.ts'
import { consult, rollFortune, type Likelihood } from '../engine/bones.ts'
import type { Rng } from '../engine/rng.ts'
import { readTheSigns } from '../engine/signs.ts'
import type { JournalEntry, OracleResult } from '../state/session.ts'

export type Tool = 'signs' | 'bones' | 'fortune' | 'activity'

export interface AskRequest {
  tool: Tool
  likelihood: Likelihood
  /** Only used by the Activity Die. */
  creature: Creature
  question: string
}

/** Runs the chosen oracle with the given RNG and wraps the result as a journal entry. */
export function ask(request: AskRequest, rng: Rng, at: string, id: string): JournalEntry {
  return { id, at, question: request.question.trim(), result: runOracle(request, rng), reading: null }
}

function runOracle({ tool, likelihood, creature }: AskRequest, rng: Rng): OracleResult {
  switch (tool) {
    case 'signs':
      return { tool, cardIds: readTheSigns(rng).cards.map((c) => c.id), hour: null }
    case 'bones': {
      const { cast, reroll, final } = consult(likelihood, rng)
      return { tool, likelihood, cast, reroll, final }
    }
    case 'fortune':
      return { tool, face: rollFortune(rng) }
    case 'activity':
      return { tool, roll: rollActivity(rng), creature }
  }
}
