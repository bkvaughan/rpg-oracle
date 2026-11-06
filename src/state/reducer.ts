import type { Reading } from '../ai/schema.ts'
import type { HourRoll } from '../engine/signs.ts'
import type { Fact, JournalEntry, Session } from './session.ts'

// Every action carries its own timestamp (and new ids are made by the caller), so the
// reducer stays pure and testable.

export type Action =
  | { type: 'load'; session: Session }
  | { type: 'rename'; name: string; at: string }
  | { type: 'setPc'; pc: Partial<Session['pc']>; at: string }
  | { type: 'setLocation'; location: Partial<Session['location']>; at: string }
  | { type: 'addEntry'; entry: JournalEntry; at: string }
  | { type: 'attachReading'; entryId: string; reading: Reading; at: string }
  | { type: 'setEntryHour'; entryId: string; hour: HourRoll; at: string }
  | { type: 'setEntryNote'; entryId: string; note: string; at: string }
  | { type: 'chooseReading'; entryId: string; useAlternate: boolean; at: string }
  | { type: 'deleteEntry'; entryId: string; at: string }
  | { type: 'addFact'; fact: Fact; at: string }
  | { type: 'editFact'; factId: string; text: string; at: string }
  | { type: 'removeFact'; factId: string; at: string }

export function sessionReducer(state: Session, action: Action): Session {
  if (action.type === 'load') return action.session
  const touched = { ...state, updatedAt: action.at }

  switch (action.type) {
    case 'rename':
      return { ...touched, name: action.name }
    case 'setPc':
      return { ...touched, pc: { ...state.pc, ...action.pc } }
    case 'setLocation':
      return { ...touched, location: { ...state.location, ...action.location } }
    case 'addEntry':
      return { ...touched, journal: [...state.journal, action.entry] }
    case 'attachReading':
      return {
        ...touched,
        journal: state.journal.map((e) => (e.id === action.entryId ? { ...e, reading: action.reading, useAlternate: false } : e)),
      }
    case 'setEntryNote':
      return { ...touched, journal: state.journal.map((e) => (e.id === action.entryId ? { ...e, note: action.note } : e)) }
    case 'chooseReading':
      return {
        ...touched,
        journal: state.journal.map((e) => (e.id === action.entryId ? { ...e, useAlternate: action.useAlternate } : e)),
      }
    case 'setEntryHour':
      return {
        ...touched,
        journal: state.journal.map((e) =>
          e.id === action.entryId && e.result.tool === 'signs' ? { ...e, result: { ...e.result, hour: action.hour } } : e,
        ),
      }
    case 'deleteEntry':
      return { ...touched, journal: state.journal.filter((e) => e.id !== action.entryId) }
    case 'addFact':
      return { ...touched, facts: [...state.facts, action.fact] }
    case 'editFact':
      return { ...touched, facts: state.facts.map((f) => (f.id === action.factId ? { ...f, text: action.text } : f)) }
    case 'removeFact':
      return { ...touched, facts: state.facts.filter((f) => f.id !== action.factId) }
  }
}
