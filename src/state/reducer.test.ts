import { describe, expect, test } from 'vitest'
import { bonesEntry, reading, sampleSession, signsEntry, T0, T1 } from './fixtures.ts'
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

  test('setContext records the session background', () => {
    const s = sessionReducer(newSession(T0, 'x'), { type: 'setContext', context: 'Thuel, a barbarian, at the barrow', at: T1 })
    expect(s).toMatchObject({ context: 'Thuel, a barbarian, at the barrow', updatedAt: T1 })
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

  test('setEntryNote records what happened on one entry', () => {
    let s = newSession(T0, 'x')
    s = sessionReducer(s, { type: 'addEntry', entry: bonesEntry('e1'), at: T1 })
    s = sessionReducer(s, { type: 'addEntry', entry: bonesEntry('e2'), at: T1 })
    s = sessionReducer(s, { type: 'setEntryNote', entryId: 'e2', note: 'She raised the alarm', at: T1 })
    expect(s.journal.map((e) => e.note)).toEqual(['', 'She raised the alarm'])
  })

  test('setEntryHour records the exact hour on a Signs entry only', () => {
    let s = newSession(T0, 'x')
    s = sessionReducer(s, { type: 'addEntry', entry: signsEntry('s1'), at: T1 })
    s = sessionReducer(s, { type: 'addEntry', entry: bonesEntry('b1'), at: T1 })
    const hour = { roll: 3, hour: 3, label: '3am' }
    s = sessionReducer(s, { type: 'setEntryHour', entryId: 's1', hour, at: T1 })
    s = sessionReducer(s, { type: 'setEntryHour', entryId: 'b1', hour, at: T1 })
    expect(s.journal[0].result).toMatchObject({ tool: 'signs', hour })
    expect(s.journal[1].result).toEqual(bonesEntry('b1').result)
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
