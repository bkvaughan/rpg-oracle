import type { ActivityRoll } from '../data/activity.ts'
import type { Rng } from './rng.ts'

/** The Activity Die (p.66): a plain d6. */
export function rollActivity(rng: Rng): ActivityRoll {
  return (rng(6) + 1) as ActivityRoll
}
