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

  test('the Bones answer is derived from the final dice, not stored', () => {
    const entry = sampleSession().journal[1]
    if (entry.result.tool !== 'bones') throw new Error('expected a bones entry')
    expect(bonesOutcome(entry.result)).toMatchObject({ answer: 'Yes', strength: 1 })
  })
})
