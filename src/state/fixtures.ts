import type { Reading } from '../ai/schema.ts'
import { newSession, type JournalEntry, type Session } from './session.ts'

// Shared test data for the state tests.

export const T0 = '2026-11-05T20:00:00.000Z'
export const T1 = '2026-11-05T20:05:00.000Z'
export const T2 = '2026-11-05T20:10:00.000Z'

export const bonesEntry = (id: string, question = 'Is there a sentry?'): JournalEntry => ({
  id,
  at: T0,
  question,
  result: {
    tool: 'bones',
    likelihood: 'likely-yes',
    cast: { judgment: 'No', fate: ['Nil', 'Nil'], fortune: 'Nil' },
    reroll: { die: 'judgment', from: 'No', to: 'Yes' },
    final: { judgment: 'Yes', fate: ['Nil', 'Nil'], fortune: 'Nil' },
  },
  reading: null,
  note: '',
})

export const signsEntry = (id: string): JournalEntry => ({
  id,
  at: T0,
  question: "What's going on at this ruin?",
  result: { tool: 'signs', cardIds: [3, 41], hour: null },
  reading: null,
  note: '',
})

export const reading: Reading = {
  ruling: 'A sentry, but she is distracted.',
  why: 'Single Yes with Fortune.',
  follow_ups: [{ question: 'Is she armed?', tool: 'bones', likelihood: 'likely-yes' }],
  new_facts: ['A sentry watches the ruin gate'],
}

export function sampleSession(): Session {
  return {
    ...newSession(T0, 'session-1'),
    name: 'The Barrow Lord',
    journal: [signsEntry('e1'), { ...bonesEntry('e2'), reading }],
    facts: [{ id: 'f1', text: 'The barrow lord hunts at night', source: 'ai', at: T0 }],
  }
}
