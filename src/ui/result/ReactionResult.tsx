import { CREATURE_TEXT, type ActivityRoll } from '../../data/activity.ts'
import { reactionFor } from '../../data/reaction.ts'
import { reactionTotal } from '../../engine/reaction.ts'
import type { ReactionResult as Result } from '../../state/session.ts'
import { ActivityDetails, ActivityDie } from './ActivityResult.tsx'

// Reaction & Activity (p.66): 2d6 on the balanced Reaction chart, with the first die read
// as the Activity Die, as in the book's gate-guard example.

// Pip positions on a 3 x 3 grid (0-8, row by row).
const PIPS: Record<ActivityRoll, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function PipDie({ value }: { value: ActivityRoll }) {
  return (
    <span className="die die-pips" role="img" aria-label={`d6: ${value}`}>
      <svg viewBox="0 0 30 30" aria-hidden="true">
        {PIPS[value].map((p) => (
          <circle key={p} cx={7 + (p % 3) * 8} cy={7 + Math.floor(p / 3) * 8} r="2.6" />
        ))}
      </svg>
    </span>
  )
}

export default function ReactionResult({ result }: { result: Result }) {
  const total = reactionTotal(result.dice)
  const reaction = reactionFor(total)
  const [first, second] = result.dice
  return (
    <div className="reaction-result">
      <p className="label">{CREATURE_TEXT[result.creature]}</p>
      <div className="dice-row">
        <ActivityDie roll={first} />
        <PipDie value={second} />
      </div>

      <h3 className="label">
        Reaction ({first} + {second} = {total})
      </h3>
      <p className="activity-status reaction-status">
        <span className="activity-roll">{total}</span> {reaction.label}
      </p>
      <p>{reaction.description}</p>

      <div className="reaction-activity">
        <h3 className="label">Activity (the {first} on the Activity Die)</h3>
        <ActivityDetails roll={first} creature={result.creature} />
      </div>
    </div>
  )
}
