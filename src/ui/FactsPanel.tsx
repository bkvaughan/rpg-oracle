import { useState, type FormEvent } from 'react'
import type { Fact } from '../state/session.ts'

// Established facts: what the player has decided is true. All of them go to the AI.

interface Props {
  facts: Fact[]
  onAdd: (text: string) => void
  onEdit: (id: string, text: string) => void
  onRemove: (id: string) => void
}

export default function FactsPanel({ facts, onAdd, onEdit, onRemove }: Props) {
  const [draft, setDraft] = useState('')

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    onAdd(draft.trim())
    setDraft('')
  }

  return (
    <section className="panel facts" aria-labelledby="facts-title">
      <h2 id="facts-title" className="panel-title">
        Established facts
      </h2>
      <p className="panel-hint secondary">Pinned facts go with every interpretation, so the oracle stays consistent.</p>
      {facts.length === 0 && <p className="empty">No facts pinned yet.</p>}
      <ul className="facts-list">
        {facts.map((f, i) => (
          <li key={f.id}>
            <input
              aria-label={`Fact ${i + 1}`}
              value={f.text}
              onChange={(e) => onEdit(f.id, e.target.value)}
              onBlur={(e) => !e.target.value.trim() && onRemove(f.id)}
            />
            <button type="button" className="btn btn-small btn-quiet" onClick={() => onRemove(f.id)} aria-label={`Remove fact ${i + 1}`}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="fact-add" onSubmit={add}>
        <input aria-label="New fact" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. The barrow lord hunts at night" />
        <button type="submit" className="btn btn-small" disabled={!draft.trim()}>
          Pin
        </button>
      </form>
    </section>
  )
}
