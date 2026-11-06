import { CARDS, TIME_ICON_NAMES, cardImage, type Card } from '../../data/deck.ts'
import type { SignsResult as Result } from '../../state/session.ts'
import Compass from './Compass.tsx'
import TimeIcon from './TimeIcon.tsx'

// Read the Signs (p.213): the cards, their words, and the time and direction of the
// primary card (first drawn), with the secondary card's as an alternative.

function CardView({ card, role }: { card: Card; role: string }) {
  const { src, srcSet } = cardImage(card.id)
  const words = `${card.noun} · ${card.verb} · ${card.adjective} · ${card.mood}`
  return (
    <figure className="sign-card">
      <p className="label">{role}</p>
      <img src={src} srcSet={srcSet} width="400" height="556" alt={`${words}. ${card.art}`} />
      <figcaption>
        <span className="sign-words">{words}</span>
      </figcaption>
    </figure>
  )
}

interface Props {
  result: Result
  onRollHour?: () => void
}

export default function SignsResult({ result, onRollHour }: Props) {
  const [primary, secondary] = result.cardIds.map((id) => CARDS[id - 1])
  return (
    <div className="signs-result">
      <div className="sign-cards">
        <CardView card={primary} role="Primary" />
        {secondary && <CardView card={secondary} role="Secondary" />}
      </div>

      <div className="sign-details">
        <div className="sign-time">
          <h3 className="label">Time</h3>
          <p>
            <TimeIcon icon={primary.time_icon} /> {TIME_ICON_NAMES[primary.time_icon]}: <strong>{primary.time}</strong>
          </p>
          {secondary && (
            <p className="secondary">
              <TimeIcon icon={secondary.time_icon} /> or {TIME_ICON_NAMES[secondary.time_icon]}: {secondary.time}
            </p>
          )}
          {result.hour ? (
            <p>
              Exact hour: <strong>{result.hour.label}</strong> <span className="secondary">(rolled {result.hour.roll} on 1d6)</span>
            </p>
          ) : (
            onRollHour && (
              <button type="button" className="btn btn-small" onClick={onRollHour}>
                Roll exact hour
              </button>
            )
          )}
        </div>

        <div className="sign-direction">
          <h3 className="label">Direction</h3>
          <Compass primary={primary.direction} secondary={secondary?.direction} />
          <p>
            <strong>{primary.direction}</strong>
            {secondary && <span className="secondary"> or {secondary.direction}</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
