import { describe, expect, test } from 'vitest'
import { bonesEntry, reading, sampleSession, T0, T1 } from './fixtures.ts'
import { sessionReducer } from './reducer.ts'
import { newSession } from './session.ts'

describe('sessionReducer', () => {
  test('load replaces the session wholesale', () => {
    const loaded = sampleSession()
    expect(sessionReducer(newSession(T0, 'x'), { type: 'load', session: loaded })).toBe(loaded)
  })

  test('every edit stamps updatedAt', () => {
    const s = sessionReducer(newSession(T0, 'x'), { type: 'rename', name: 'Barrow', at: T1 })
    expect(s).toMatchObject({ name: 'Barrow', updatedAt: T1, createdAt: T0 })
  })

  test('setPc and setLocation merge partial updates', () => {
    let s = sampleSession()
    s = sessionReducer(s, { type: 'setPc', pc: { level: 3 }, at: T1 })
    s = sessionReducer(s, { type: 'setLocation', location: { room: 'Crypt' }, at: T1 })
    expect(s.pc).toEqual({ name: 'Thuel', class: 'Barbarian', level: 3 })
    expect(s.location).toEqual({ hex: '0412', site: 'Small Ruin', room: 'Crypt' })
  })

  test('journal entries are added, read, and deleted', () => {
    let s = newSession(T0, 'x')
    s = sessionReducer(s, { type: 'addEntry', entry: bonesEntry('e1'), at: T1 })
    s = sessionReducer(s, { type: 'addEntry', entry: bonesEntry('e2'), at: T1 })
    s = sessionReducer(s, { type: 'attachReading', entryId: 'e2', reading, at: T1 })
    expect(s.journal.map((e) => [e.id, e.reading?.ruling ?? null])).toEqual([
      ['e1', null],
      ['e2', reading.ruling],
    ])
    s = sessionReducer(s, { type: 'deleteEntry', entryId: 'e1', at: T1 })
    expect(s.journal.map((e) => e.id)).toEqual(['e2'])
  })

  test('facts are added, edited, and removed', () => {
    let s = newSession(T0, 'x')
    s = sessionReducer(s, { type: 'addFact', fact: { id: 'f1', text: 'Sentry at the gate', source: 'ai', at: T1 }, at: T1 })
    s = sessionReducer(s, { type: 'editFact', factId: 'f1', text: 'Two sentries at the gate', at: T1 })
    expect(s.facts).toEqual([{ id: 'f1', text: 'Two sentries at the gate', source: 'ai', at: T1 }])
    s = sessionReducer(s, { type: 'removeFact', factId: 'f1', at: T1 })
    expect(s.facts).toEqual([])
  })

  test('does not mutate the previous state', () => {
    const before = sampleSession()
    const snapshot = structuredClone(before)
    sessionReducer(before, { type: 'deleteEntry', entryId: 'e1', at: T1 })
    expect(before).toEqual(snapshot)
  })
})
