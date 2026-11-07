// The session's background, written once and sent with every interpretation. Every keystroke
// goes to the session, like fact edits: the crash copy is then never behind what's on screen
// (a write started as the page unloads doesn't finish), and the file autosave is debounced.

interface Props {
  context: string
  onChange: (context: string) => void
}

export default function ContextPanel({ context, onChange }: Props) {
  const preview = context.trim().split('\n')[0]

  return (
    <details className="context-panel">
      <summary className="label">
        Session context <span className="context-preview secondary">· {preview || 'none yet'}</span>
      </summary>
      <textarea
        aria-label="Session context"
        rows={3}
        value={context}
        placeholder="Who the PC is, where they are, what they're after. Sent with every interpretation."
        onChange={(e) => onChange(e.target.value)}
      />
    </details>
  )
}
