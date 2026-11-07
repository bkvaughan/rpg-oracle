import { bonesOutcome, type BonesEntryResult } from '../../state/session.ts'
import Die from './Die.tsx'
import { FORTUNE_TEXT } from './text.ts'

// Consult the Bones (p.212): the cast, any reroll, the answer and the Fortune twist.

const LIKELIHOOD_TEXT = { even: 'Even odds', 'likely-yes': 'Likely Yes', 'likely-no': 'Likely No' }
const REROLL_DIE = { judgment: 'Judgment', fate1: 'First Twin', fate2: 'Second Twin' }
const STRENGTH_TEXT = { 1: '', 2: 'Double', 3: 'Triple' }
const STRENGTH_NOTE = { 1: '', 2: 'A greater, more definitive answer.', 3: 'An extremely great, exaggerated answer.' }

export default function BonesResult({ result }: { result: BonesEntryResult }) {
  const outcome = bonesOutcome(result)
  const { cast, reroll, final } = result
  const strength = STRENGTH_TEXT[outcome.strength]

  return (
    <div className="bones-result">
      <div className="bones-cast">
        <p className="label">{LIKELIHOOD_TEXT[result.likelihood]}</p>
        <div className="dice-row bones-dice" aria-label="The cast">
          <Die kind="judgment" face={cast.judgment} dim={reroll?.die === 'judgment'} />
          <Die kind="fate" face={cast.fate[0]} dim={reroll?.die === 'fate1'} />
          <Die kind="fate" face={cast.fate[1]} dim={reroll?.die === 'fate2'} />
          <Die kind="fortune" face={cast.fortune} />
          {/* Visible names for the dice; each die already has its name as its accessible label. */}
          <span className="die-caption" aria-hidden="true">
            Hammer of Judgment
          </span>
          <span className="die-caption die-caption-twins" aria-hidden="true">
            Twins of Fate
          </span>
          <span className="die-caption" aria-hidden="true">
            Fortune die
          </span>
        </div>
        {reroll && (
          <p className="reroll">
            <span>
              {REROLL_DIE[reroll.die]} showed the unlikely {reroll.from} → rerolled to <strong>{reroll.to}</strong>
            </span>
            <Die kind={reroll.die === 'judgment' ? 'judgment' : 'fate'} face={reroll.to} small />
          </p>
        )}
      </div>

      {/* Beside the dice on wide screens: the answer and what it means. */}
      <div className="bones-verdict">
        <p className={`bones-answer answer-${outcome.answer.toLowerCase()}`}>
          {strength && <span className="strength">{strength} </span>}
          {outcome.answer}
        </p>
        {STRENGTH_NOTE[outcome.strength] && <p className="bones-note">{STRENGTH_NOTE[outcome.strength]}</p>}
        <p className="bones-note secondary">{outcome.note}.</p>
      </div>

      <p className={`fortune-twist twist-${final.fortune.toLowerCase()}`}>{FORTUNE_TEXT[final.fortune]}</p>
    </div>
  )
}
