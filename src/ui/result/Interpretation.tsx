import { useEffect, useRef, useState } from 'react'
import { AiError } from '../../ai/errors.ts'
import type { FollowUp, Reading } from '../../ai/schema.ts'
import ReadingView from './ReadingView.tsx'

// The Interpret button and its loading, error and result states for one journal entry.

interface Props {
  reading: Reading | null
  hasKey: boolean
  onInterpret: (signal: AbortSignal) => Promise<void>
  onPinFact: (text: string) => void
  onFollowUp: (followUp: FollowUp) => void
}

export default function Interpretation({ reading, hasKey, onInterpret, onPinFact, onFollowUp }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)

  // Leaving this result (e.g. selecting another journal entry) cancels the request, so it
  // can't still be running, unseen and billed, when the player comes back and asks again.
  useEffect(() => () => controller.current?.abort(), [])

  // While a request runs, Escape cancels it, like the Cancel button.
  useEffect(() => {
    if (!busy) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && controller.current?.abort()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy])

  const run = async () => {
    controller.current = new AbortController()
    setBusy(true)
    setError(null)
    try {
      await onInterpret(controller.current.signal)
    } catch (e) {
      const err = e instanceof AiError ? e : null
      if (err?.kind !== 'cancelled') setError(err?.message ?? 'The interpretation failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    // The controls sit above the reading, so Interpret again isn't buried below the facts.
    <div className="interpretation" aria-busy={busy}>
      <div className="interpretation-bar">
        {busy ? (
          <>
            <span className="secondary interpreting" role="status">
              The oracle considers…
            </span>
            <button type="button" className="btn btn-small" aria-keyshortcuts="Escape" onClick={() => controller.current?.abort()}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-small" onClick={() => void run()} disabled={!hasKey}>
            {error ? 'Try again' : reading ? 'Interpret again' : 'Interpret'}
          </button>
        )}
        {!hasKey && <span className="secondary">Add an API key in AI settings to interpret results.</span>}
      </div>
      {error && (
        <p className="status-error" role="alert">
          {error}
        </p>
      )}
      {reading && (
        <div className={busy ? 'reading-stale' : undefined}>
          <ReadingView reading={reading} onPinFact={onPinFact} onFollowUp={onFollowUp} />
        </div>
      )}
    </div>
  )
}
