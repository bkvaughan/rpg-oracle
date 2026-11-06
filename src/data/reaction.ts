// The balanced Reaction chart (Tales of Argosa p.66): 2d6 when the PCs first meet a creature,
// for when the GM doesn't use the monster's own Reac stats. Band labels are the book's terms;
// descriptions are in our own words.

export interface ReactionBand {
  min: number
  max: number
  label: string
  description: string
}

export const REACTIONS: readonly ReactionBand[] = [
  { min: 2, max: 3, label: 'Hostile', description: 'Aggressive and opposed; ready for a confrontation.' },
  { min: 4, max: 5, label: 'Unfriendly', description: 'Wary and suspicious, with no interest in helping.' },
  { min: 6, max: 8, label: 'Neutral', description: 'Uncertain and careful; waiting to see what the PCs do.' },
  { min: 9, max: 10, label: 'Fairly friendly', description: 'Curious and open, willing to help a little.' },
  { min: 11, max: 12, label: 'Affable', description: 'Warm, drawn to the PCs, and very helpful.' },
]

export function reactionFor(total: number): ReactionBand {
  const band = REACTIONS.find((r) => total >= r.min && total <= r.max)
  if (!band) throw new RangeError(`No reaction for a 2d6 total of ${total}`)
  return band
}
