// Every draw and roll goes through an Rng so tests can make results deterministic.
// Production uses the browser's CSPRNG; Math.random is never used for oracle results.

/** Returns a uniformly distributed integer in [0, n). */
export type Rng = (n: number) => number

/** Fills the array with random 32-bit values, like crypto.getRandomValues. */
type Fill = (array: Uint32Array<ArrayBuffer>) => void

const RANGE = 2 ** 32

/**
 * Secure RNG over crypto.getRandomValues. Rejection sampling removes modulo bias:
 * values in the final partial block of 2^32 are redrawn so every outcome is equally likely.
 */
export function makeSecureRng(fill: Fill = (a) => void crypto.getRandomValues(a)): Rng {
  const buffer = new Uint32Array(1)
  return (n) => {
    if (!Number.isInteger(n) || n < 1 || n > RANGE) throw new RangeError(`Invalid range: ${n}`)
    const limit = RANGE - (RANGE % n)
    for (;;) {
      fill(buffer)
      const value = buffer[0]
      if (value < limit) return value % n
    }
  }
}

export const secureRng: Rng = makeSecureRng()

/** Deterministic RNG for tests (mulberry32). Not for real draws. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0
  return (n) => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    const float = ((t ^ (t >>> 14)) >>> 0) / RANGE
    return Math.floor(float * n)
  }
}

/** Test helper: returns the given values in order, then throws if asked for more. */
export function scriptedRng(values: number[]): Rng {
  let i = 0
  return (n) => {
    if (i >= values.length) throw new Error('scriptedRng ran out of values')
    const value = values[i++]
    if (value < 0 || value >= n) throw new RangeError(`Scripted value ${value} out of range for ${n}`)
    return value
  }
}
