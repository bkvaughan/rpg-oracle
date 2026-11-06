import { describe, expect, test } from 'vitest'
import { scriptedRng, seededRng } from '../engine/rng.ts'
import { ask } from './ask.ts'

const AT = '2026-11-05T20:00:00.000Z'

describe('ask', () => {
  test('Read the Signs stores two distinct card ids and no hour yet', () => {
    const entry = ask({ tool: 'signs', likelihood: 'even', creature: 'intelligent', question: ' What is at the ruin? ' }, seededRng(1), AT, 'e1')
    expect(entry).toMatchObject({ id: 'e1', at: AT, question: 'What is at the ruin?', reading: null })
    if (entry.result.tool !== 'signs') throw new Error('expected signs')
    expect(new Set(entry.result.cardIds).size).toBe(2)
    expect(entry.result.hour).toBeNull()
  })

  test('Consult the Bones stores the cast, reroll and final dice', () => {
    const entry = ask({ tool: 'bones', likelihood: 'likely-yes', creature: 'intelligent', question: 'Gold?' }, scriptedRng([3, 4, 4, 4, 0]), AT, 'e2')
    expect(entry.result).toEqual({
      tool: 'bones',
      likelihood: 'likely-yes',
      cast: { judgment: 'No', fate: ['Nil', 'Nil'], fortune: 'Nil' },
      reroll: { die: 'judgment', from: 'No', to: 'Yes' },
      final: { judgment: 'Yes', fate: ['Nil', 'Nil'], fortune: 'Nil' },
    })
  })

  test('the Fortune die stores one face', () => {
    expect(ask({ tool: 'fortune', likelihood: 'even', creature: 'intelligent', question: '' }, scriptedRng([2]), AT, 'e3').result).toEqual({
      tool: 'fortune',
      face: 'Misfortune',
    })
  })

  test('Activity & Reaction stores both dice and the creature type', () => {
    expect(ask({ tool: 'reaction', likelihood: 'even', creature: 'other', question: 'The guards' }, scriptedRng([2, 1]), AT, 'r1')).toMatchObject({
      question: 'The guards',
      result: { tool: 'reaction', dice: [3, 2], creature: 'other' },
    })
  })
})
