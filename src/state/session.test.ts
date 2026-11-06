import { describe, expect, test } from 'vitest'
import { sampleSession, T0 } from './fixtures.ts'
import { bonesOutcome, newSession, sessionSchema } from './session.ts'

describe('session model', () => {
  test('a new session is valid and empty', () => {
    const s = newSession(T0, 'abc')
    expect(sessionSchema.parse(s)).toEqual(s)
    expect(s).toMatchObject({ schemaVersion: 1, id: 'abc', journal: [], facts: [], createdAt: T0, updatedAt: T0 })
  })

  test('a populated session is valid', () => {
    expect(sessionSchema.safeParse(sampleSession()).success).toBe(true)
  })

  test('rejects an unknown oracle tool', () => {
    const s = sampleSession() as unknown as { journal: { result: { tool: string } }[] }
    s.journal[0].result.tool = 'tarot'
    expect(sessionSchema.safeParse(s).success).toBe(false)
  })

  test('an older standalone Activity Die entry still loads; an impossible roll does not', () => {
    const s = sampleSession()
    const entry = { id: 'a', at: s.createdAt, question: '', reading: null, result: { tool: 'activity', roll: 3, creature: 'other' } }
    expect(sessionSchema.safeParse({ ...s, journal: [entry] }).success).toBe(true)
    expect(sessionSchema.safeParse({ ...s, journal: [{ ...entry, result: { ...entry.result, roll: 7 } }] }).success).toBe(false)
  })

  test('a Reaction & Activity entry is valid; impossible dice are not', () => {
    const s = sampleSession()
    const entry = { id: 'r', at: s.createdAt, question: '', reading: null, result: { tool: 'reaction', dice: [3, 2], creature: 'intelligent' } }
    expect(sessionSchema.safeParse({ ...s, journal: [entry] }).success).toBe(true)
    expect(sessionSchema.safeParse({ ...s, journal: [{ ...entry, result: { ...entry.result, dice: [0, 7] } }] }).success).toBe(false)
  })

  test('the Bones answer is derived from the final dice, not stored', () => {
    const entry = sampleSession().journal[1]
    if (entry.result.tool !== 'bones') throw new Error('expected a bones entry')
    expect(bonesOutcome(entry.result)).toMatchObject({ answer: 'Yes', strength: 1 })
  })
})
