import type { Session } from '../state/session.ts'

export default function RecoveryBanner({ session, onRestore, onDiscard }: { session: Session; onRestore: () => void; onDiscard: () => void }) {
  const when = new Date(session.updatedAt).toLocaleString()
  return (
    <section className="panel recovery" role="alert">
      <p>
        Found unsaved changes to <strong>{session.name}</strong> from {when}.
      </p>
      <button type="button" className="btn btn-small btn-primary" onClick={onRestore}>
        Restore
      </button>{' '}
      <button type="button" className="btn btn-small" onClick={onDiscard}>
        Discard
      </button>
    </section>
  )
}
