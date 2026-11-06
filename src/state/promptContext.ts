import { CARDS } from '../data/deck.ts'
import { bonesOutcome, type OracleResult, type Session } from './session.ts'

// The slice of a session sent with each AI request (ORACLE_SPEC.md Part 3): the PC, where
// they are, every pinned fact, and only the most recent journal entries, so prompts stay small.

export const RECENT_LIMIT = 20

const TIME_NAMES = { 'light-sun': 'Light Sun', 'dark-sun': 'Dark Sun', 'light-moon': 'Light Moon', 'dark-moon': 'Dark Moon' }
const REROLL_DIE = { judgment: 'Judgment', fate1: 'first Twin', fate2: 'second Twin' }

/** One line describing an oracle result, for the AI prompt and the journal. */
export function describeResult(result: OracleResult): string {
  switch (result.tool) {
    case 'signs': {
      const cards = result.cardIds.map((id) => {
        const c = CARDS[id - 1]
        return `${c.noun} · ${c.verb} · ${c.adjective} · ${c.mood} (${TIME_NAMES[c.time_icon]}, ${c.direction})`
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
