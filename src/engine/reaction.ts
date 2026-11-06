import type { ActivityRoll } from '../data/activity.ts'
import type { Rng } from './rng.ts'

// Reaction & Activity (p.66): 2d6 for Reaction. The book's example reads the leftmost die
// as the Activity Die, so the first die is also the Activity roll.
export type ReactionDice = [ActivityRoll, ActivityRoll]

export function rollReaction(rng: Rng): ReactionDice {
  return [(rng(6) + 1) as ActivityRoll, (rng(6) + 1) as ActivityRoll]
}

export const reactionTotal = ([a, b]: ReactionDice): number => a + b
