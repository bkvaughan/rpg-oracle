import { activityFor, CREATURE_TEXT } from '../../data/activity.ts'
import type { ActivityResult as Result } from '../../state/session.ts'

// The Activity Die (p.66): what the creature is doing when the PCs come across it.
// Faces are cut from the official Activity Die template by `npm run assets`.

export default function ActivityResult({ result }: { result: Result }) {
  const activity = activityFor(result.roll)
  const other = result.creature === 'intelligent' ? 'other' : 'intelligent'
  return (
    <div className="activity-result">
      <p className="label">{CREATURE_TEXT[result.creature]}</p>
      <div className="dice-row">
        <span className="die die-activity" role="img" aria-label={`Activity Die: ${result.roll}, ${activity.status}`}>
          <img src={`dice/activity-${result.roll}.webp`} alt="" width="64" height="64" />
        </span>
      </div>
      <p className="activity-status">
        <span className="activity-roll">{result.roll}</span> {activity.status}
      </p>
      <p>{activity[result.creature]}</p>
      <p className="secondary activity-alt">
        {CREATURE_TEXT[other]}: {activity[other]}
      </p>
    </div>
  )
}
