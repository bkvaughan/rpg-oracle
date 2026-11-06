import type { Answer, FateFace, FortuneFace } from '../../engine/bones.ts'

// One die face drawn from the official glyphs on a coloured body (ORACLE_SPEC.md Part 2).

export type DieKind = 'judgment' | 'fate' | 'fortune'

const NAMES: Record<DieKind, string> = {
  judgment: 'Hammer of Judgment',
  fate: 'Twin of Fate',
  fortune: 'Fortune die',
}

function faceFile(kind: DieKind, face: Answer | FateFace | FortuneFace): string | null {
  if (face === 'Nil') return null
  if (kind === 'judgment') return face === 'Yes' ? 'judgment-yes' : 'judgment-no'
  if (kind === 'fate') return face === 'Yes' ? 'fate-yes' : 'fate-no'
  return face === 'Fortune' ? 'fortune-sun' : 'misfortune-skull'
}

const FACE_TEXT: Record<string, string> = { Nil: 'blank', Fortune: 'Fortune (sun)', Misfortune: 'Misfortune (skull)' }

interface Props {
  kind: DieKind
  face: Answer | FateFace | FortuneFace
  /** Shown faded, e.g. the original face of a rerolled die. */
  dim?: boolean
  small?: boolean
}

export default function Die({ kind, face, dim, small }: Props) {
  const file = faceFile(kind, face)
  const label = `${NAMES[kind]}: ${FACE_TEXT[face] ?? face}`
  return (
    <span className={`die die-${kind}${dim ? ' dim' : ''}${small ? ' small' : ''}`} role="img" aria-label={label} title={label}>
      {file && <img src={`dice/${file}.webp`} alt="" width="64" height="64" />}
    </span>
  )
}
