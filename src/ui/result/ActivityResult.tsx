import { activityFor, CREATURE_TEXT, type ActivityRoll, type Creature } from '../../data/activity.ts'
import type { ActivityResult as Result } from '../../state/session.ts'

// The Activity Die (p.66): what the creature is doing when the PCs come across it.
// Faces are cut from the official Activity Die template by `npm run assets`.

export function ActivityDie({ roll }: { roll: ActivityRoll }) {
  return (
    <span className="die die-activity" role="img" aria-label={`Activity Die: ${roll}, ${activityFor(roll).status}`}>
      <img src={`dice/activity-${roll}.webp`} alt="" width="64" height="64" />
    </span>
  )
}

/** The status and examples for a roll; shared with the Reaction roll. */
export function ActivityDetails({ roll, creature }: { roll: ActivityRoll; creature: Creature }) {
  const activity = activityFor(roll)
  const other = creature === 'intelligent' ? 'other' : 'intelligent'
  return (
    <>
      <p className="activity-status">
        <span className="activity-roll">{roll}</span> {activity.status}
      </p>
      <p>{activity[creature]}</p>
      <p className="secondary activity-alt">
        {CREATURE_TEXT[other]}: {activity[other]}
      </p>
    </>
  )
}

export default function ActivityResult({ result }: { result: Result }) {
  return (
    <div className="activity-result">
      <p className="label">{CREATURE_TEXT[result.creature]}</p>
      <div className="dice-row">
        <ActivityDie roll={result.roll} />
      </div>
      <ActivityDetails roll={result.roll} creature={result.creature} />
    </div>
  )
}
