import { describe, expect, test } from 'vitest'
import {
  FATE_FACES,
  FORTUNE_FACES,
  JUDGMENT_FACES,
  consult,
  resolve,
  rollFortune,
  type Answer,
  type Cast,
  type FateFace,
  type Likelihood,
} from './bones.ts'
import { scriptedRng } from './rng.ts'

const dice = (judgment: Answer, f1: FateFace, f2: FateFace): Cast => ({ judgment, fate: [f1, f2], fortune: 'Nil' })

// Face indexes for scripting: Judgment Yes=0 No=3; Fate Yes=0 No=2 Nil=4; Fortune Fortune=0 Misfortune=2 Nil=4.
const J = { Yes: 0, No: 3 } as const
const F = { Yes: 0, No: 2, Nil: 4 } as const

describe('resolve', () => {
  test('cancels Yes against No and reports magnitude', () => {
    expect(resolve(dice('Yes', 'Nil', 'Nil'))).toMatchObject({ answer: 'Yes', strength: 1, label: 'Yes' })
    expect(resolve(dice('No', 'No', 'Nil'))).toMatchObject({ answer: 'No', strength: 2, label: 'Double No (greater)' })
    expect(resolve(dice('Yes', 'Yes', 'Yes'))).toMatchObject({ answer: 'Yes', strength: 3, label: 'Triple Yes (extremely great)' })
    expect(resolve(dice('No', 'Yes', 'Yes'))).toMatchObject({ answer: 'Yes', strength: 1 })
  })

  test('Judgment breaks a tie against one opposite Twin', () => {
    const r = resolve(dice('Yes', 'No', 'Nil'))
    expect(r).toMatchObject({ answer: 'Yes', strength: 1 })
    expect(r.note).toMatch(/Judgment breaks the tie/)
    expect(resolve(dice('No', 'Nil', 'Yes'))).toMatchObject({ answer: 'No', strength: 1 })
  })

  // p.212: "a double Yes, a single No ... resulting in a final answer of Yes" (not Double Yes).
  test('book example: two Yes and one No cancel to a single Yes', () => {
    expect(resolve(dice('Yes', 'Yes', 'No'))).toMatchObject({ answer: 'Yes', strength: 1 })
  })

  test('never returns a blank answer', () => {
    for (const j of JUDGMENT_FACES) for (const f1 of FATE_FACES) for (const f2 of FATE_FACES) {
      expect(['Yes', 'No']).toContain(resolve(dice(j, f1, f2)).answer)
    }
  })

  test('passes the Fortune face through', () => {
    expect(resolve({ judgment: 'Yes', fate: ['Nil', 'Nil'], fortune: 'Misfortune' }).fortune).toBe('Misfortune')
  })
})

describe('consult rerolls (p.212)', () => {
  test('even odds never reroll', () => {
    const c = consult('even', scriptedRng([J.No, F.No, F.No, 0]))
    expect(c.reroll).toBeNull()
    expect(c.result.label).toBe('Triple No (extremely great)')
  })

  // ORACLE_SPEC.md Part 4: likely Yes; Judgment No, Twins Nil Nil -> Judgment rerolled to Yes.
  test('spec example: Judgment must be rerolled when it shows the unlikely answer', () => {
    const c = consult('likely-yes', scriptedRng([J.No, F.Nil, F.Nil, 4, J.Yes]))
    expect(c.reroll).toEqual({ die: 'judgment', from: 'No', to: 'Yes' })
    expect(c.cast.judgment).toBe('No')
    expect(c.final.judgment).toBe('Yes')
    expect(c.result).toMatchObject({ answer: 'Yes', strength: 1, fortune: 'Nil' })
  })

  test('Judgment takes priority over an unlikely Twin', () => {
    const c = consult('likely-yes', scriptedRng([J.No, F.No, F.Nil, 4, J.No]))
    expect(c.reroll?.die).toBe('judgment')
    expect(c.final.fate).toEqual(['No', 'Nil'])
  })

  test('rerolls a Twin when Judgment is fine', () => {
    const c = consult('likely-no', scriptedRng([J.No, F.Nil, F.Yes, 4, F.No]))
    expect(c.reroll).toEqual({ die: 'fate2', from: 'Yes', to: 'No' })
    expect(c.result).toMatchObject({ answer: 'No', strength: 2 })
  })

  test('rerolls the first Twin when both show the unlikely answer', () => {
    const c = consult('likely-yes', scriptedRng([J.Yes, F.No, F.No, 4, F.Yes]))
    expect(c.reroll).toEqual({ die: 'fate1', from: 'No', to: 'Yes' })
    expect(c.final.fate).toEqual(['Yes', 'No'])
  })

  test('rerolls at most once, even if the reroll is unlikely again', () => {
    // A further value would make scriptedRng throw if a second reroll were attempted.
    const c = consult('likely-yes', scriptedRng([J.No, F.No, F.No, 4, J.No]))
    expect(c.final).toMatchObject({ judgment: 'No', fate: ['No', 'No'] })
    expect(c.result.label).toBe('Triple No (extremely great)')
  })

  test('never rerolls the Fortune die', () => {
    const c = consult('likely-yes', scriptedRng([J.No, F.Nil, F.Nil, 2, J.Yes]))
    expect(c.cast.fortune).toBe('Misfortune')
    expect(c.final.fortune).toBe('Misfortune')
  })

  test('no reroll when no die shows the unlikely answer', () => {
    expect(consult('likely-yes', scriptedRng([J.Yes, F.Yes, F.Nil, 0])).reroll).toBeNull()
  })

  test('does not mutate the original cast', () => {
    const c = consult('likely-no', scriptedRng([J.Yes, F.Nil, F.Nil, 0, J.No]))
    expect(c.cast.judgment).toBe('Yes')
    expect(c.final.judgment).toBe('No')
  })
})

describe('exact probabilities match ORACLE_SPEC.md Part 2', () => {
  // Enumerate every Judgment x Twin x Twin x reroll face (Fortune fixed: it is independent).
  // Each sequence is equally likely; when no reroll happens the last value is simply unused.
  function distribution(likelihood: Likelihood): Record<string, number> {
    const counts: Record<string, number> = {}
    let total = 0
    for (let j = 0; j < 6; j++) for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) for (let r = 0; r < 6; r++) {
      const { result } = consult(likelihood, scriptedRng([j, a, b, 0, r]))
      const key = `${result.answer}${result.strength}`
      counts[key] = (counts[key] ?? 0) + 1
      total++
    }
    return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round((v / total) * 1000) / 10]))
  }

  test.each([
    ['even', { Yes1: 33.3, Yes2: 11.1, Yes3: 5.6, No1: 33.3, No2: 11.1, No3: 5.6 }],
    ['likely-yes', { Yes1: 37.0, Yes2: 24.1, Yes3: 12.0, No1: 18.5, No2: 5.6, No3: 2.8 }],
    ['likely-no', { Yes1: 18.5, Yes2: 5.6, Yes3: 2.8, No1: 37.0, No2: 24.1, No3: 12.0 }],
  ] as const)('%s', (likelihood, expected) => {
    expect(distribution(likelihood)).toEqual(expected)
  })
})

describe('rollFortune', () => {
  test('each outcome is a third of the die (Lone Wolf, p.216)', () => {
    const outcomes = Array.from({ length: 6 }, (_, i) => rollFortune(scriptedRng([i])))
    expect(outcomes).toEqual([...FORTUNE_FACES])
    for (const face of ['Fortune', 'Misfortune', 'Nil']) expect(outcomes.filter((o) => o === face)).toHaveLength(2)
  })
})
