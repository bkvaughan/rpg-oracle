import { CREATURE_TEXT, type ActivityRoll } from '../../data/activity.ts'
import { reactionFor } from '../../data/reaction.ts'
import { reactionTotal } from '../../engine/reaction.ts'
import type { ReactionResult as Result } from '../../state/session.ts'
import { ActivityDetails, ActivityDie } from './ActivityResult.tsx'

// Activity & Reaction (p.66): 2d6 on the balanced Reaction chart, with the first die read
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

/** A numbered d6. The Activity Die doubles as the first Reaction die, so it is shown in its teal. */
function PipDie({ value, activityDie }: { value: ActivityRoll; activityDie?: boolean }) {
  return (
    <span
      className={`die die-pips${activityDie ? ' pips-activity' : ''}`}
      role="img"
      aria-label={activityDie ? `Activity Die as a d6: ${value}` : `d6: ${value}`}
    >
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
      <section className="reaction-part" aria-label="Activity">
        <h3 className="label">Activity · {CREATURE_TEXT[result.creature]}</h3>
        <div className="dice-row">
          <ActivityDie roll={first} />
        </div>
        <ActivityDetails roll={first} creature={result.creature} />
      </section>

      <section className="reaction-part" aria-label="Reaction">
        <h3 className="label">
          Reaction ({first} + {second} = {total})
        </h3>
        <div className="dice-row">
          <PipDie value={first} activityDie />
          <PipDie value={second} />
        </div>
        <p className="activity-status reaction-status">
          <span className="activity-roll">{total}</span> {reaction.label}
        </p>
        <p>{reaction.description}</p>
      </section>
    </div>
  )
}
