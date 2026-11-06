import { useState } from 'react'
import type { Session } from '../state/session.ts'

interface Props {
  session: Session
  /** Restoring replaces the current session, so ask first when it holds anything. */
  confirmReplace: boolean
  onRestore: () => void
  onDiscard: () => void
}

export default function RecoveryBanner({ session, confirmReplace, onRestore, onDiscard }: Props) {
  const [confirming, setConfirming] = useState(false)
  const when = new Date(session.updatedAt).toLocaleString()
  return (
    <section className="panel recovery" role="alert">
      <p>
        Found unsaved changes to <strong>{session.name}</strong> from {when}.
      </p>
      {confirming ? (
        <span className="confirm">
          Replace the current session?{' '}
          <button type="button" className="btn btn-small btn-danger" onClick={onRestore}>
            Replace
          </button>{' '}
          <button type="button" className="btn btn-small" onClick={() => setConfirming(false)}>
            Keep
          </button>
        </span>
      ) : (
        <>
          <button type="button" className="btn btn-small btn-primary" onClick={confirmReplace ? () => setConfirming(true) : onRestore}>
            Restore
          </button>{' '}
          <button type="button" className="btn btn-small" onClick={onDiscard}>
            Discard
          </button>
        </>
      )}
    </section>
  )
}
