import { useState } from 'react'
import { describeResult } from '../state/promptContext.ts'
import type { JournalEntry } from '../state/session.ts'

// Every question asked this session, newest first. Selecting one shows it in full above.

interface Props {
  entries: JournalEntry[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export default function Journal({ entries, selectedId, onSelect, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <section className="panel journal" aria-labelledby="journal-title">
      <h2 id="journal-title" className="panel-title">
        Journal
      </h2>
      {entries.length === 0 ? (
        <p className="empty">Nothing asked yet.</p>
      ) : (
        <ol className="journal-list" reversed>
          {[...entries].reverse().map((e) => (
            <li key={e.id} className={e.id === selectedId ? 'selected' : undefined}>
              <button type="button" className="journal-entry" onClick={() => onSelect(e.id)} aria-current={e.id === selectedId}>
                <span className="journal-question">{e.question || 'No question'}</span>
                <span className="journal-result">{describeResult(e.result)}</span>
                <time className="journal-time" dateTime={e.at}>
                  {new Date(e.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </time>
              </button>
              {confirmId === e.id ? (
                <span className="confirm">
                  <button type="button" className="btn btn-small btn-danger" onClick={() => (setConfirmId(null), onDelete(e.id))}>
                    Delete
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => setConfirmId(null)}>
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-small btn-quiet"
                  onClick={() => setConfirmId(e.id)}
                  aria-label={`Delete "${e.question || 'No question'}"`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
