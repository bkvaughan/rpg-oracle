import { useEffect, useRef, useState } from 'react'
import { AiError } from '../../ai/errors.ts'
import type { FollowUp, Reading } from '../../ai/schema.ts'
import ReadingView from './ReadingView.tsx'

// The Interpret button and its loading, error and result states for one journal entry.

interface Props {
  reading: Reading | null
  useAlternate: boolean
  onChooseReading: (useAlternate: boolean) => void
  hasKey: boolean
  onInterpret: (signal: AbortSignal) => Promise<void>
  onPinFact: (text: string) => void
  onFollowUp: (followUp: FollowUp) => void
}

export default function Interpretation({ reading, useAlternate, onChooseReading, hasKey, onInterpret, onPinFact, onFollowUp }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)

  // Leaving this result (e.g. selecting another journal entry) cancels the request, so it
  // can't still be running, unseen and billed, when the player comes back and asks again.
  useEffect(() => () => controller.current?.abort(), [])

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
    <div className="interpretation">
      {reading && (
        <ReadingView
          reading={reading}
          useAlternate={useAlternate}
          onChooseReading={onChooseReading}
          onPinFact={onPinFact}
          onFollowUp={onFollowUp}
        />
      )}
      <div className="session-actions">
        {busy ? (
          <>
            <span className="secondary interpreting" role="status">
              The oracle considers…
            </span>
            <button type="button" className="btn btn-small" onClick={() => controller.current?.abort()}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-small" onClick={() => void run()} disabled={!hasKey}>
            {reading ? 'Interpret again' : 'Interpret'}
          </button>
        )}
        {!hasKey && <span className="secondary">Add an API key in AI settings to interpret results.</span>}
      </div>
      {error && (
        <p className="status-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
