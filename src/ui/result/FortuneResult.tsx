import type { FortuneFace } from '../../engine/bones.ts'
import Die from './Die.tsx'
import { FORTUNE_TEXT } from './text.ts'

// The Fortune die alone. Its main use is Lone Wolf (p.216): roll it whenever a solo PC is hit.
const LONE_WOLF = {
  Fortune: 'Lone Wolf: the attack is parried or negated.',
  Misfortune: 'Lone Wolf: the PC counterstrikes for standard damage.',
  Nil: 'Lone Wolf: no effect.',
}

export default function FortuneResult({ face }: { face: FortuneFace }) {
  return (
    <div className="fortune-result">
      <div className="dice-row">
        <Die kind="fortune" face={face} />
      </div>
      <p className={`fortune-twist twist-${face.toLowerCase()}`}>{FORTUNE_TEXT[face]}</p>
      <p className="secondary">{LONE_WOLF[face]} (see Tales of Argosa p.216)</p>
    </div>
  )
}
