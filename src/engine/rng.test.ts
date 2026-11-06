import { describe, expect, test } from 'vitest'
import { makeSecureRng, scriptedRng, secureRng, seededRng } from './rng.ts'

/** Chi-square statistic for counts against a uniform expectation. */
function chiSquare(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0)
  const expected = total / counts.length
  return counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0)
}

describe('secureRng', () => {
  test('stays in range', () => {
    for (let i = 0; i < 10_000; i++) {
      const v = secureRng(6)
      expect(Number.isInteger(v) && v >= 0 && v < 6).toBe(true)
    }
  })

  // 5 degrees of freedom: 25 is far beyond the 0.1% critical value (20.5),
  // so this only fails if the generator is clearly broken.
  test('d6 is uniform (chi-square sanity check)', () => {
    const counts = [0, 0, 0, 0, 0, 0]
    for (let i = 0; i < 60_000; i++) counts[secureRng(6)]++
    expect(chiSquare(counts)).toBeLessThan(25)
  })

  test('rejects values in the biased tail instead of folding them', () => {
    // For n = 6 the accepted range is [0, 4294967292); 0xFFFFFFFF must be redrawn.
    const values = [0xffffffff, 7]
    const rng = makeSecureRng((a) => {
      a[0] = values.shift()!
    })
    expect(rng(6)).toBe(1)
    expect(values).toEqual([])
  })

  test('rejects invalid ranges', () => {
    expect(() => secureRng(0)).toThrow(RangeError)
    expect(() => secureRng(1.5)).toThrow(RangeError)
  })
})

describe('seededRng', () => {
  test('is deterministic per seed', () => {
    const a = seededRng(42)
    const b = seededRng(42)
    const seqA = Array.from({ length: 20 }, () => a(50))
    const seqB = Array.from({ length: 20 }, () => b(50))
    expect(seqA).toEqual(seqB)
  })
})

describe('scriptedRng', () => {
  test('returns values in order and throws when exhausted', () => {
    const rng = scriptedRng([2, 0])
    expect(rng(6)).toBe(2)
    expect(rng(6)).toBe(0)
    expect(() => rng(6)).toThrow()
  })
})
