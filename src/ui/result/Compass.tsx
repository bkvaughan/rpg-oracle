import { DIRECTIONS, type Direction } from '../../data/deck.ts'

// A small compass rose: the primary card's arrow in the accent colour, the secondary
// card's arrow fainter and dashed. North is up, as on the cards.

const ANGLE = Object.fromEntries(DIRECTIONS.map((d, i) => [d, i * 45])) as Record<Direction, number>

function Arrow({ direction, className }: { direction: Direction; className: string }) {
  return (
    <g transform={`rotate(${ANGLE[direction]} 60 60)`} className={className}>
      <line x1="60" y1="60" x2="60" y2="22" />
      <path d="M60 14 L54 26 L66 26 Z" />
    </g>
  )
}

export default function Compass({ primary, secondary }: { primary: Direction; secondary?: Direction }) {
  const label = secondary ? `Compass: primary direction ${primary}, secondary ${secondary}` : `Compass: direction ${primary}`
  return (
    <svg className="compass" viewBox="0 0 120 120" role="img" aria-label={label}>
      <circle cx="60" cy="60" r="50" className="compass-ring" />
      {(['N', 'E', 'S', 'W'] as const).map((d) => {
        const a = (ANGLE[d] * Math.PI) / 180
        return (
          <text key={d} x={60 + Math.sin(a) * 41} y={60 - Math.cos(a) * 41} className="compass-letter">
            {d}
          </text>
        )
      })}
      {secondary && secondary !== primary && <Arrow direction={secondary} className="compass-secondary" />}
      <Arrow direction={primary} className="compass-primary" />
      <circle cx="60" cy="60" r="3" className="compass-hub" />
    </svg>
  )
}
