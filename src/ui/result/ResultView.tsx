import { useState } from 'react'
import type { FollowUp } from '../../ai/schema.ts'
import type { JournalEntry } from '../../state/session.ts'
import ActivityResult from './ActivityResult.tsx'
import BonesResult from './BonesResult.tsx'
import FortuneResult from './FortuneResult.tsx'
import ReactionResult from './ReactionResult.tsx'
import Interpretation from './Interpretation.tsx'
import SignsResult from './SignsResult.tsx'

const TOOL_NAME = { signs: 'Read the Signs', bones: 'Consult the Bones', fortune: 'Fortune die', activity: 'Activity Die', reaction: 'Activity & Reaction' }

// The player's own account of what happened after this answer. Saved on blur, not per
// keystroke, so an open session file is rewritten once per edit.
function NoteField({ note, onSave }: { note: string; onSave: (note: string) => void }) {
  const [draft, setDraft] = useState(note)
  return (
    <label className="field note-field">
      <span className="label">What happened</span>
      <textarea
        rows={2}
        value={draft}
        placeholder="What the PC did, and what came of it"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== note && onSave(draft)}
      />
    </label>
  )
}

interface Props {
  entry: JournalEntry
  onRollHour: () => void
  onSaveNote: (note: string) => void
  hasKey: boolean
  onInterpret: (signal: AbortSignal) => Promise<void>
  onPinFact: (text: string) => void
  onFollowUp: (followUp: FollowUp) => void
  onOpenSettings?: () => void
}

export default function ResultView({ entry, onRollHour, onSaveNote, hasKey, onInterpret, onPinFact, onFollowUp, onOpenSettings }: Props) {
  const { result } = entry
  return (
    <article className="panel result" aria-labelledby={`result-${entry.id}`}>
      <p className="eyebrow">{TOOL_NAME[result.tool]}</p>
      {/* Fortune and Activity & Reaction need no question; the heading still names the result. */}
      <h2 id={`result-${entry.id}`} className={`result-question${entry.question ? '' : ' no-question'}`}>
        {entry.question || 'No question asked'}
      </h2>
      {result.tool === 'signs' && <SignsResult result={result} onRollHour={onRollHour} />}
      {result.tool === 'bones' && <BonesResult result={result} />}
      {result.tool === 'fortune' && <FortuneResult face={result.face} />}
      {result.tool === 'activity' && <ActivityResult result={result} />}
      {result.tool === 'reaction' && <ReactionResult result={result} />}
      <Interpretation
        reading={entry.reading}
        hasKey={hasKey}
        onInterpret={onInterpret}
        onPinFact={onPinFact}
        onFollowUp={onFollowUp}
        onOpenSettings={onOpenSettings}
      />
      <NoteField note={entry.note} onSave={onSaveNote} />
    </article>
  )
}
