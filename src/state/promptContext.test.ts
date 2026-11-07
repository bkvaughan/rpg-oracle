import { describe, expect, test } from 'vitest'
import { bonesEntry, sampleSession } from './fixtures.ts'
import { describeResult, promptContext, RECENT_LIMIT } from './promptContext.ts'

describe('describeResult', () => {
  test('Read the Signs lists both cards with time and direction', () => {
    expect(describeResult({ tool: 'signs', cardIds: [3, 41], hour: { roll: 3, hour: 3, label: '3am' } })).toBe(
      'Read the Signs: Undead · Leeching · Unhinged · Terrifying (Dark Moon, SW) / ' +
        'Dragon · Searching · Covetous · Gilded (Dark Sun, SE); exact hour 3am',
    )
  })

  test('Consult the Bones gives the derived answer, twist and reroll', () => {
    expect(describeResult(bonesEntry('e').result)).toBe('Consult the Bones (likely-yes): Yes; Judgment rerolled No to Yes')
    expect(
      describeResult({
        tool: 'bones',
        likelihood: 'even',
        cast: { judgment: 'No', fate: ['No', 'Nil'], fortune: 'Fortune' },
        reroll: null,
        final: { judgment: 'No', fate: ['No', 'Nil'], fortune: 'Fortune' },
      }),
    ).toBe('Consult the Bones (even): Double No (greater), Fortune')
  })

  test('a standalone Activity Die from an older session still describes', () => {
    expect(describeResult({ tool: 'activity', roll: 5, creature: 'intelligent' })).toBe('Activity Die (intelligent creature): 5 Traveling')
  })

  test('Activity & Reaction reads the total and the first die', () => {
    expect(describeResult({ tool: 'reaction', dice: [3, 2], creature: 'intelligent' })).toBe(
      'Activity & Reaction (intelligent creature): 3 Eating; 5 Unfriendly',
    )
  })

  test('Fortune die', () => {
    expect(describeResult({ tool: 'fortune', face: 'Misfortune' })).toBe('Fortune die: Misfortune')
  })
})

describe('promptContext', () => {
  test('carries all facts and recent rulings', () => {
    const ctx = promptContext(sampleSession())
    expect(ctx.facts).toEqual(['The barrow lord hunts at night'])
    expect(ctx.recent.map((r) => r.ruling)).toEqual([null, 'A sentry, but she is distracted.'])
    expect(ctx.omitted).toBe(0)
  })

  test('carries each entry\'s note', () => {
    const session = sampleSession()
    session.journal[0] = { ...session.journal[0], note: 'Thuel climbed the wall' }
    expect(promptContext(session).recent.map((r) => r.note)).toEqual(['Thuel climbed the wall', ''])
  })

  test('carries the session context, trimmed', () => {
    expect(promptContext({ ...sampleSession(), context: ' At the barrow \n' }).context).toBe('At the barrow')
    expect(promptContext(sampleSession()).context).toBe('')
  })

  test(`keeps only the last ${RECENT_LIMIT} entries but every fact`, () => {
    const session = sampleSession()
    session.journal = Array.from({ length: 25 }, (_, i) => bonesEntry(`e${i}`, `Question ${i}`))
    session.facts = Array.from({ length: 30 }, (_, i) => ({ id: `f${i}`, text: `Fact ${i}`, source: 'player' as const, at: session.createdAt }))
    const ctx = promptContext(session)
    expect(ctx.recent).toHaveLength(20)
    expect(ctx.recent[0].question).toBe('Question 5')
    expect(ctx.omitted).toBe(5)
    expect(ctx.facts).toHaveLength(30)
  })
})
