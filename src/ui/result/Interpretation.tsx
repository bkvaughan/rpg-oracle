import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { AiError } from '../../ai/errors.ts'
import type { FollowUp, Reading } from '../../ai/schema.ts'
import ReadingView from './ReadingView.tsx'

// The interpretation of one journal entry: it starts by itself for a result just asked (when
// a key is saved), and the button covers retries, re-reads and older entries.

interface Props {
  reading: Reading | null
  /** Interpret as soon as this is shown: set only for a result the player just asked. */
  autoStart?: boolean
  useAlternate: boolean
  onChooseReading: (useAlternate: boolean) => void
  hasKey: boolean
  onInterpret: (signal: AbortSignal) => Promise<void>
  onPinFact: (text: string) => void
  onFollowUp: (followUp: FollowUp) => void
}

export default function Interpretation({ reading, autoStart = false, useAlternate, onChooseReading, hasKey, onInterpret, onPinFact, onFollowUp }: Props) {
  const startsNow = autoStart && hasKey
  // Busy from the first render when interpreting by itself, so the button never flashes.
  const [busy, setBusy] = useState(startsNow)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)

  // Leaving this result (e.g. selecting another journal entry) cancels the request, so it
  // can't still be running, unseen and billed, when the player comes back and asks again.
  useEffect(() => () => controller.current?.abort(), [])

  const request = async () => {
    const mine = new AbortController()
    controller.current = mine
    try {
      await onInterpret(mine.signal)
    } catch (e) {
      const err = e instanceof AiError ? e : null
      if (err?.kind !== 'cancelled') setError(err?.message ?? 'The interpretation failed.')
    } finally {
      // A cancelled run can settle after a newer one has started; leave that one's state alone.
      if (controller.current === mine) setBusy(false)
    }
  }

  const run = () => {
    setBusy(true)
    setError(null)
    void request()
  }

  // Starts the request once, on mount. (React's dev-mode double mount cancels the first
  // request and starts another.)
  const startOnMount = useEffectEvent(() => {
    if (startsNow) void request()
  })
  // The request only sets state once it settles, after an await, never synchronously.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => startOnMount(), [])

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
          <button type="button" className="btn btn-small" onClick={run} disabled={!hasKey}>
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
