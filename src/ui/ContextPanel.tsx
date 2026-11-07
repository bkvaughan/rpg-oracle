import { useState } from 'react'

// The session's background, written once and sent with every interpretation. Saves on blur,
// like play notes, so the file autosaves once per edit rather than on every keystroke.

interface Props {
  context: string
  onSave: (context: string) => void
}

export default function ContextPanel({ context, onSave }: Props) {
  const [draft, setDraft] = useState(context)
  // Opening, restoring or starting a session replaces the context; follow it without
  // remounting, which would close the panel.
  const [shown, setShown] = useState(context)
  if (context !== shown) {
    setShown(context)
    setDraft(context)
  }
  const preview = context.trim().split('\n')[0]

  return (
    <details className="context-panel">
      <summary className="label">
        Session context <span className="context-preview secondary">· {preview || 'none yet'}</span>
      </summary>
      <textarea
        aria-label="Session context"
        rows={3}
        value={draft}
        placeholder="Who the PC is, where they are, what they're after. Sent with every interpretation."
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== context && onSave(draft)}
      />
    </details>
  )
}
