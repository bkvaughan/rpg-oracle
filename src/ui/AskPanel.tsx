import { useState, type FormEvent } from 'react'
import type { Likelihood } from '../engine/bones.ts'
import type { AskRequest, Tool } from './ask.ts'

const TOOLS: { id: Tool; name: string; hint: string; action: string }[] = [
  { id: 'signs', name: 'Read the Signs', hint: 'Open questions: who, what, why', action: 'Draw two cards' },
  { id: 'bones', name: 'Consult the Bones', hint: 'Yes or no questions', action: 'Cast the Bones' },
  { id: 'fortune', name: 'Fortune die', hint: 'A twist alone, or Lone Wolf hits', action: 'Roll the Fortune die' },
]

const LIKELIHOODS: { id: Likelihood; name: string }[] = [
  { id: 'even', name: 'Even' },
  { id: 'likely-yes', name: 'Likely Yes' },
  { id: 'likely-no', name: 'Likely No' },
]

interface Props {
  onAsk: (request: AskRequest) => void
  /** Set by a follow-up suggestion to prefill the form. */
  initial?: Partial<AskRequest>
}

export default function AskPanel({ onAsk, initial }: Props) {
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [tool, setTool] = useState<Tool>(initial?.tool ?? 'signs')
  const [likelihood, setLikelihood] = useState<Likelihood>(initial?.likelihood ?? 'even')

  const needsQuestion = tool !== 'fortune'
  const canAsk = !needsQuestion || question.trim() !== ''
  const current = TOOLS.find((t) => t.id === tool)!

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canAsk) return
    onAsk({ tool, likelihood, question })
    setQuestion('')
  }

  return (
    <form className="panel ask" onSubmit={submit} aria-label="Ask the oracle">
      <label className="field">
        <span className="label">Your question</span>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={tool === 'bones' ? 'Is there a sentry keeping watch?' : "What's going on at this ruin?"}
          autoComplete="off"
        />
      </label>

      <fieldset className="choices">
        <legend className="label">Oracle</legend>
        {TOOLS.map((t) => (
          <label key={t.id} className={`choice${tool === t.id ? ' selected' : ''}`}>
            <input type="radio" name="tool" value={t.id} checked={tool === t.id} onChange={() => setTool(t.id)} />
            <span className="choice-name">{t.name}</span>
            <span className="choice-hint">{t.hint}</span>
          </label>
        ))}
      </fieldset>

      {tool === 'bones' && (
        <fieldset className="choices choices-inline">
          <legend className="label">Likelihood</legend>
          {LIKELIHOODS.map((l) => (
            <label key={l.id} className={`choice${likelihood === l.id ? ' selected' : ''}`}>
              <input
                type="radio"
                name="likelihood"
                value={l.id}
                checked={likelihood === l.id}
                onChange={() => setLikelihood(l.id)}
              />
              <span className="choice-name">{l.name}</span>
            </label>
          ))}
        </fieldset>
      )}

      <button type="submit" className="btn btn-primary" disabled={!canAsk}>
        {current.action}
      </button>
    </form>
  )
}
