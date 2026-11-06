import { useState } from 'react'
import type { FollowUp, Reading } from '../../ai/schema.ts'
import { CREATURE_TEXT } from '../../data/activity.ts'

// The AI's interpretation of a result. Suggested facts are only pinned when the player
// accepts them (optionally edited); follow-ups prefill the ask form.

const TOOL_TEXT = { signs: 'Signs', bones: 'Bones', reaction: 'Activity & Reaction' }
const LIKELIHOOD_TEXT = { even: 'even', 'likely-yes': 'likely Yes', 'likely-no': 'likely No' }

function followUpTool(f: FollowUp): string {
  if (f.tool === 'bones' && f.likelihood) return `${TOOL_TEXT.bones}, ${LIKELIHOOD_TEXT[f.likelihood]}`
  if (f.tool === 'reaction' && f.creature) return `${TOOL_TEXT.reaction}, ${CREATURE_TEXT[f.creature]}`
  return TOOL_TEXT[f.tool]
}

function SuggestedFact({ text, onPin }: { text: string; onPin: (text: string) => void }) {
  const [draft, setDraft] = useState(text)
  const [state, setState] = useState<'open' | 'pinned' | 'dismissed'>('open')
  if (state === 'dismissed') return null
  if (state === 'pinned') {
    return (
      <li className="suggested pinned">
        <span>{draft}</span> <span className="secondary">(pinned)</span>
      </li>
    )
  }
  return (
    <li className="suggested">
      <input aria-label="Suggested fact" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button
        type="button"
        className="btn btn-small"
        disabled={!draft.trim()}
        onClick={() => (onPin(draft.trim()), setState('pinned'))}
      >
        Pin
      </button>
      <button type="button" className="btn btn-small btn-quiet" aria-label="Dismiss suggested fact" onClick={() => setState('dismissed')}>
        ×
      </button>
    </li>
  )
}

interface Props {
  reading: Reading
  onPinFact: (text: string) => void
  onFollowUp: (followUp: FollowUp) => void
}

export default function ReadingView({ reading, onPinFact, onFollowUp }: Props) {
  return (
    <section className="reading" aria-label="Interpretation">
      <p className="reading-ruling">{reading.ruling}</p>
      <p>
        <span className="label">Why </span>
        {reading.why}
      </p>
      {reading.alternate && (
        <p>
          <span className="label">Or </span>
          {reading.alternate}
        </p>
      )}
      {reading.time && (
        <p>
          <span className="label">When </span>
          {reading.time}
        </p>
      )}
      {reading.direction && (
        <p>
          <span className="label">Where </span>
          {reading.direction}
        </p>
      )}

      {reading.follow_ups.length > 0 && (
        <>
          <h3 className="label">Ask next</h3>
          <ul className="follow-ups">
            {reading.follow_ups.map((f, i) => (
              <li key={i}>
                <button type="button" className="btn btn-small follow-up" onClick={() => onFollowUp(f)}>
                  {f.question}
                  <span className="secondary">
                    {' '}
                    ({followUpTool(f)})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {reading.new_facts.length > 0 && (
        <>
          <h3 className="label">Suggested facts</h3>
          <ul className="suggested-facts">
            {reading.new_facts.map((f, i) => (
              <SuggestedFact key={`${i}-${f}`} text={f} onPin={onPinFact} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
