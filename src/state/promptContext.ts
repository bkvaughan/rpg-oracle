import { activityFor, CREATURE_TEXT } from '../data/activity.ts'
import { CARDS, TIME_ICON_NAMES } from '../data/deck.ts'
import { reactionFor } from '../data/reaction.ts'
import { reactionTotal } from '../engine/reaction.ts'
import { bonesOutcome, type OracleResult, type Session } from './session.ts'

// The slice of a session sent with each AI request (ORACLE_SPEC.md Part 3): the PC, where
// they are, every pinned fact, and only the most recent journal entries, so prompts stay small.

export const RECENT_LIMIT = 20

const REROLL_DIE = { judgment: 'Judgment', fate1: 'first Twin', fate2: 'second Twin' }

/** One line describing an oracle result, for the AI prompt and the journal. */
export function describeResult(result: OracleResult): string {
  switch (result.tool) {
    case 'signs': {
      const cards = result.cardIds.map((id) => {
        const c = CARDS[id - 1]
        return `${c.noun} · ${c.verb} · ${c.adjective} · ${c.mood} (${TIME_ICON_NAMES[c.time_icon]}, ${c.direction})`
      })
      const hour = result.hour ? `; exact hour ${result.hour.label}` : ''
      return `Read the Signs: ${cards.join(' / ')}${hour}`
    }
    case 'bones': {
      const outcome = bonesOutcome(result)
      const twist = outcome.fortune === 'Nil' ? '' : `, ${outcome.fortune}`
      const reroll = result.reroll ? `; ${REROLL_DIE[result.reroll.die]} rerolled ${result.reroll.from} to ${result.reroll.to}` : ''
      return `Consult the Bones (${result.likelihood}): ${outcome.label}${twist}${reroll}`
    }
    case 'fortune':
      return `Fortune die: ${result.face}`
    case 'activity':
      return `Activity Die (${CREATURE_TEXT[result.creature].toLowerCase()}): ${result.roll} ${activityFor(result.roll).status}`
    case 'reaction': {
      const total = reactionTotal(result.dice)
      const roll = result.dice[0]
      return `Reaction & Activity (${CREATURE_TEXT[result.creature].toLowerCase()}): ${total} ${reactionFor(total).label}; ${roll} ${activityFor(roll).status}`
    }
  }
}

export interface PromptContext {
  pc: Session['pc']
  location: Session['location']
  facts: string[]
  recent: { question: string; result: string; ruling: string | null }[]
  /** How many older entries were left out. */
  omitted: number
}

export function promptContext(session: Session, limit = RECENT_LIMIT): PromptContext {
  const recent = session.journal.slice(-limit)
  return {
    pc: session.pc,
    location: session.location,
    facts: session.facts.map((f) => f.text),
    recent: recent.map((e) => ({ question: e.question, result: describeResult(e.result), ruling: e.reading?.ruling ?? null })),
    omitted: session.journal.length - recent.length,
  }
}
