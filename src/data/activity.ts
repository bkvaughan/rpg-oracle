// The Activity Die (Tales of Argosa p.66): what an encountered creature is doing.
// Example lists are paraphrased in our own words; see the book for the full table.

export type ActivityRoll = 1 | 2 | 3 | 4 | 5 | 6
export type Creature = 'intelligent' | 'other'

export interface Activity {
  roll: ActivityRoll
  status: string
  intelligent: string
  other: string
}

export const ACTIVITIES: readonly Activity[] = [
  {
    roll: 1,
    status: 'Threat',
    intelligent: 'Ambushing, fighting someone or something, facing a trap or hazard, a standoff, a heated argument.',
    other: 'Ambushing, fighting, caught by a trap or hazard, a standoff, a mating contest.',
  },
  {
    roll: 2,
    status: 'Socialising',
    intelligent: 'Talking, sport or games, trading, gambling, teaching, raising children, intimacy.',
    other: 'Calling or howling, play-fighting, courtship, teaching young.',
  },
  {
    roll: 3,
    status: 'Eating',
    intelligent: 'Eating, cooking or preparing food, drinking, fetching water.',
    other: 'Feeding, drinking at water, dragging a fresh kill, gnawing bones.',
  },
  {
    roll: 4,
    status: 'Working',
    intelligent: 'Practising a trade, making repairs, gathering resources, a trading trip, providing a service.',
    other: 'Building or mending a den, guarding eggs or young, teaching young, foraging, keeping watch.',
  },
  {
    roll: 5,
    status: 'Traveling',
    intelligent: 'Hunting, passing through, exploring, patrolling, carrying a message, a trading trip, fleeing something.',
    other: 'Hunting, exploring, marking territory, patrolling feeding grounds, fleeing danger, heading elsewhere.',
  },
  {
    roll: 6,
    status: 'Resting',
    intelligent: 'Sleeping, relaxing, reading or drawing, recovering from a hangover, injury or illness, waiting for something.',
    other: 'Sleeping, relaxing, recovering from injury, sickness or shock, waiting for something (such as a mate).',
  },
]

export const CREATURE_TEXT: Record<Creature, string> = {
  intelligent: 'Intelligent creature',
  other: 'Other creature',
}

export const activityFor = (roll: ActivityRoll): Activity => ACTIVITIES[roll - 1]
