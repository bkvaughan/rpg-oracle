import { useRef, useState } from 'react'
import type { SessionStore } from './useSessionStore.ts'
import { now } from './useSessionStore.ts'

// The session's name, file and save state.

function statusText(store: SessionStore): string {
  const { file, canAutosave } = store
  switch (file.status) {
    case 'new':
      return 'Not saved to a file yet'
    case 'saving':
      return `Saving to ${file.fileName}…`
    case 'saved':
      return canAutosave ? `Saved to ${file.fileName}` : `Downloaded as ${file.fileName}`
    case 'unsaved':
      return file.fileName
        ? canAutosave
          ? `Unsaved changes to ${file.fileName}`
          : `Changes since ${file.fileName} was downloaded`
        : 'Unsaved session'
    case 'error':
      return file.error ?? 'Save failed'
  }
}

export default function SessionBar({ store }: { store: SessionStore }) {
  const { session, dispatch, file, canAutosave, wouldDiscard } = store
  const fileInput = useRef<HTMLInputElement>(null)
  // New and Open both replace the session, so both ask first when that would lose work.
  const [confirming, setConfirming] = useState<'new' | 'open' | null>(null)

  const openFile = () => (canAutosave ? void store.open() : fileInput.current?.click())
  const run = (action: 'new' | 'open') => (action === 'new' ? void store.startNew() : openFile())
  const clicked = (action: 'new' | 'open') => (wouldDiscard ? setConfirming(action) : run(action))

  return (
    <section className="panel session-bar" aria-label="Session">
      <div className="session-head">
        <label className="field session-name">
          <span className="label">Session</span>
          <input
            type="text"
            value={session.name}
            onChange={(e) => dispatch({ type: 'rename', name: e.target.value, at: now() })}
          />
        </label>
        <p className={`save-status status-${file.status}`} role="status">
          {statusText(store)}
        </p>
      </div>

      <div className="session-actions">
        {confirming ? (
          <span className="confirm">
            Discard unsaved changes?{' '}
            <button
              type="button"
              className="btn btn-small btn-danger"
              onClick={() => {
                setConfirming(null)
                run(confirming)
              }}
            >
              Discard
            </button>{' '}
            <button type="button" className="btn btn-small" onClick={() => setConfirming(null)}>
              Keep
            </button>
          </span>
        ) : (
          <>
            <button type="button" className="btn btn-small" onClick={() => clicked('new')}>
              New
            </button>
            <button type="button" className="btn btn-small" onClick={() => clicked('open')}>
              Open…
            </button>
          </>
        )}
        <button type="button" className="btn btn-small" onClick={() => void store.save()}>
          {canAutosave ? 'Save' : 'Download'}
        </button>
        {canAutosave && file.handle && (
          <button type="button" className="btn btn-small" onClick={() => void store.saveAs()}>
            Save as…
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const picked = e.target.files?.[0]
            if (picked) void store.openFallback(picked)
            e.target.value = ''
          }}
        />
      </div>

    </section>
  )
}
