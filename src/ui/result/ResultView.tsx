import type { FollowUp } from '../../ai/schema.ts'
import type { JournalEntry } from '../../state/session.ts'
import ActivityResult from './ActivityResult.tsx'
import BonesResult from './BonesResult.tsx'
import FortuneResult from './FortuneResult.tsx'
import ReactionResult from './ReactionResult.tsx'
import Interpretation from './Interpretation.tsx'
import SignsResult from './SignsResult.tsx'

const TOOL_NAME = { signs: 'Read the Signs', bones: 'Consult the Bones', fortune: 'Fortune die', activity: 'Activity Die', reaction: 'Activity & Reaction' }

interface Props {
  entry: JournalEntry
  onRollHour: () => void
  hasKey: boolean
  onInterpret: (signal: AbortSignal) => Promise<void>
  onPinFact: (text: string) => void
  onFollowUp: (followUp: FollowUp) => void
}

export default function ResultView({ entry, onRollHour, hasKey, onInterpret, onPinFact, onFollowUp }: Props) {
  const { result } = entry
  return (
    <article className="panel result" aria-labelledby={`result-${entry.id}`}>
      <p className="eyebrow">{TOOL_NAME[result.tool]}</p>
      <h2 id={`result-${entry.id}`} className="result-question">
        {entry.question || <span className="secondary">No question asked</span>}
      </h2>
      {result.tool === 'signs' && <SignsResult result={result} onRollHour={onRollHour} />}
      {result.tool === 'bones' && <BonesResult result={result} />}
      {result.tool === 'fortune' && <FortuneResult face={result.face} />}
      {result.tool === 'activity' && <ActivityResult result={result} />}
      {result.tool === 'reaction' && <ReactionResult result={result} />}
      <Interpretation reading={entry.reading} hasKey={hasKey} onInterpret={onInterpret} onPinFact={onPinFact} onFollowUp={onFollowUp} />
    </article>
  )
}
