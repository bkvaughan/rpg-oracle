import type { Rng } from './rng.ts'

// Consult the Bones (Tales of Argosa p.212), a direct port of reference/bones.py.
// See ORACLE_SPEC.md Part 2 for the rules readings (cancelling, tie-break, rerolls).

export type Answer = 'Yes' | 'No'
export type FateFace = Answer | 'Nil'
export type FortuneFace = 'Fortune' | 'Misfortune' | 'Nil'
export type Likelihood = 'even' | 'likely-yes' | 'likely-no'
export type Strength = 1 | 2 | 3

// Face layout from the official dddice set linked in the book.
export const JUDGMENT_FACES: readonly Answer[] = ['Yes', 'Yes', 'Yes', 'No', 'No', 'No']
export const FATE_FACES: readonly FateFace[] = ['Yes', 'Yes', 'No', 'No', 'Nil', 'Nil']
export const FORTUNE_FACES: readonly FortuneFace[] = ['Fortune', 'Fortune', 'Misfortune', 'Misfortune', 'Nil', 'Nil']

export interface Cast {
  judgment: Answer
  fate: [FateFace, FateFace]
  fortune: FortuneFace
}

export interface BonesResult {
  answer: Answer
  strength: Strength
  /** e.g. "Yes", "Double No (greater)" */
  label: string
  /** How the dice produced the answer, for display and for the AI prompt. */
  note: string
  fortune: FortuneFace
}

export interface Reroll {
  die: 'judgment' | 'fate1' | 'fate2'
  from: FateFace
  to: FateFace
}

export interface Consultation {
  likelihood: Likelihood
  cast: Cast
  reroll: Reroll | null
  final: Cast
  result: BonesResult
}

const roll = <T>(faces: readonly T[], rng: Rng): T => faces[rng(faces.length)]

export function cast(rng: Rng): Cast {
  return {
    judgment: roll(JUDGMENT_FACES, rng),
    fate: [roll(FATE_FACES, rng), roll(FATE_FACES, rng)],
    fortune: roll(FORTUNE_FACES, rng),
  }
}

const LABELS: Record<Strength, (a: Answer) => string> = {
  1: (a) => a,
  2: (a) => `Double ${a} (greater)`,
  3: (a) => `Triple ${a} (extremely great)`,
}

export function resolve(dice: Cast): BonesResult {
  const faces = [dice.judgment, ...dice.fate]
  const yes = faces.filter((f) => f === 'Yes').length
  const no = faces.filter((f) => f === 'No').length

  let answer: Answer
  let strength: Strength
  let note: string
  if (yes === no) {
    // Only possible as Judgment against one opposite Twin with the other Twin blank:
    // Judgment breaks the tie and that Fate die is ignored.
    answer = dice.judgment
    strength = 1
    note = 'Judgment breaks the tie and trumps the Fate die'
  } else {
    answer = yes > no ? 'Yes' : 'No'
    strength = Math.abs(yes - no) as Strength
    note = `${yes} Yes vs ${no} No, cancelling to ${strength} ${answer}`
  }
  return { answer, strength, label: LABELS[strength](answer), note, fortune: dice.fortune }
}

const UNLIKELY: Record<Likelihood, Answer | null> = {
  even: null,
  'likely-yes': 'No',
  'likely-no': 'Yes',
}

/**
 * Casts the Bones and applies the "more or less likely" reroll (p.212): if any die shows the
 * unlikely answer, reroll exactly one of them, Judgment first if it is one. The first Twin is
 * chosen when both Twins qualify. Fortune is never rerolled.
 */
export function consult(likelihood: Likelihood, rng: Rng): Consultation {
  const first = cast(rng)
  const final: Cast = { ...first, fate: [...first.fate] }
  const unlikely = UNLIKELY[likelihood]
  let reroll: Reroll | null = null

  if (unlikely) {
    if (final.judgment === unlikely) {
      final.judgment = roll(JUDGMENT_FACES, rng)
      reroll = { die: 'judgment', from: unlikely, to: final.judgment }
    } else {
      const k = final.fate.indexOf(unlikely)
      if (k !== -1) {
        final.fate[k] = roll(FATE_FACES, rng)
        reroll = { die: k === 0 ? 'fate1' : 'fate2', from: unlikely, to: final.fate[k] }
      }
    }
  }

  return { likelihood, cast: first, reroll, final, result: resolve(final) }
}

/** The Fortune die alone, e.g. for Lone Wolf hits (p.216). */
export function rollFortune(rng: Rng): FortuneFace {
  return roll(FORTUNE_FACES, rng)
}
