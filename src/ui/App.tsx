import { useEffect, useRef, useState } from 'react'
import type { FollowUp } from '../ai/schema.ts'
import { forgetSettings, loadSettings, saveSettings, type AiSettings } from '../ai/settings.ts'
import { secureRng } from '../engine/rng.ts'
import { rollHour } from '../engine/signs.ts'
import { CARDS } from '../data/deck.ts'
import { ask, type AskRequest } from './ask.ts'
import { isTypingTarget } from './keys.ts'
import AiSettingsPanel from './AiSettingsPanel.tsx'
import AskPanel from './AskPanel.tsx'
import ContextPanel from './ContextPanel.tsx'
import FactsPanel from './FactsPanel.tsx'
import FirstSteps from './FirstSteps.tsx'
import Journal from './Journal.tsx'
import RecoveryBanner from './RecoveryBanner.tsx'
import ResultView from './result/ResultView.tsx'
import SessionBar from './SessionBar.tsx'
import { now, useSessionStore } from './useSessionStore.ts'

// Smooth scrolling is motion, so it stops under prefers-reduced-motion like the rest.
function scrollToTop(el: HTMLElement | null) {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

/** Opens AI settings, brings them into view and puts the cursor in the key field. */
function openAiSettings() {
  const details = document.getElementById('ai-settings') as HTMLDetailsElement | null
  if (!details) return
  details.open = true
  scrollToTop(details)
  document.getElementById('ai-key')?.focus({ preventScroll: true })
}

/** Brings the ask form into view and puts the cursor in the question. */
function focusQuestion(ask: HTMLElement | null) {
  scrollToTop(ask)
  ask?.querySelector<HTMLInputElement>('input[type="text"]')?.focus({ preventScroll: true })
}

export default function App() {
  const store = useSessionStore()
  const { session, dispatch } = store
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [aiSettings, setAiSettings] = useState<AiSettings>(loadSettings)
  // A follow-up remounts the ask form with its question, tool and likelihood filled in.
  const [prefill, setPrefill] = useState<{ request: Partial<AskRequest>; n: number }>({ request: {}, n: 0 })
  const askRef = useRef<HTMLDivElement>(null)

  // The SDK is most of the JavaScript and loads on first use. With a key saved, fetch it while
  // the browser is idle, so the first Interpret doesn't wait for the download.
  const hasKey = aiSettings.apiKey !== ''
  useEffect(() => {
    if (!hasKey) return
    const load = () => void import('../ai/client.ts').catch(() => {})
    if (!('requestIdleCallback' in window)) return void setTimeout(load, 2000)
    const id = requestIdleCallback(load, { timeout: 5000 })
    return () => cancelIdleCallback(id)
  }, [hasKey])

  // "/" jumps to the question from anywhere on the page, as on many search-first sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      e.preventDefault()
      focusQuestion(askRef.current)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  const resultRef = useRef<HTMLDivElement>(null)

  const selected = session.journal.find((e) => e.id === selectedId) ?? session.journal.at(-1) ?? null

  // Show the chosen result: wait a frame so the new entry has rendered before scrolling.
  const selectEntry = (id: string) => {
    setSelectedId(id)
    requestAnimationFrame(() => scrollToTop(resultRef.current))
  }

  const onAsk = (request: AskRequest) => {
    const at = now()
    const entry = ask(request, secureRng, at, crypto.randomUUID())
    dispatch({ type: 'addEntry', entry, at })
    selectEntry(entry.id)
  }

  const onRollHour = () => {
    if (selected?.result.tool !== 'signs') return
    const primary = CARDS[selected.result.cardIds[0] - 1]
    dispatch({ type: 'setEntryHour', entryId: selected.id, hour: rollHour(primary.time_icon, secureRng), at: now() })
  }

  const onInterpret = async (signal: AbortSignal) => {
    if (!selected) return
    const { interpret } = await import('../ai/client.ts')
    const reading = await interpret(selected, session, { apiKey: aiSettings.apiKey, model: aiSettings.model, signal })
    dispatch({ type: 'attachReading', entryId: selected.id, reading, at: now() })
  }

  const pinFact = (text: string, source: 'player' | 'ai') => {
    const at = now()
    dispatch({ type: 'addFact', fact: { id: crypto.randomUUID(), text, source, at }, at })
  }

  const onFollowUp = (f: FollowUp) => {
    setPrefill((p) => ({ request: { question: f.question, tool: f.tool, likelihood: f.likelihood ?? 'even' }, n: p.n + 1 }))
    focusQuestion(askRef.current)
  }

  return (
    <>
      <header className="site-header">
        <a className="site-title" href="./">
          <svg className="flame" viewBox="0 0 24 32" aria-hidden="true">
            <path d="M12 1c1 6 8 9 8 18a8 8 0 0 1-16 0c0-5 3-7 4-11 1 3 2 4 3 4-1-4 0-8 1-11z" />
          </svg>
          RPG Oracle
        </a>
      </header>

      <main>
        <section className="hero hero-compact">
          <h1 className="display">RPG Oracle</h1>
          <p className="lede">Read the Signs. Consult the Bones. Let the dark answer.</p>
        </section>

        {store.recovered && (
          <RecoveryBanner
            session={store.recovered}
            confirmReplace={store.hasContent}
            onRestore={store.restoreRecovered} onDiscard={store.discardRecovered} />
        )}

        <div className="stack">
          {/* Session file and AI settings share one compact bar, so the ask form is near the top. */}
          <div className="panel toolbar">
            <SessionBar store={store} />
            <ContextPanel
              context={session.context}
              onChange={(context) => dispatch({ type: 'setContext', context, at: now() })}
            />
            <AiSettingsPanel
            settings={aiSettings}
            onSave={(s) => {
              setAiSettings(s)
              return saveSettings(s)
            }}
            onForget={() => (forgetSettings(), setAiSettings(loadSettings()))}
            />
          </div>
          <div ref={askRef}>
            <AskPanel key={prefill.n} initial={prefill.request} onAsk={onAsk} />
          </div>

          <div aria-live="polite" ref={resultRef} className="result-anchor">
            {!selected && <FirstSteps />}
            {selected && (
              <ResultView
                key={selected.id}
                entry={selected}
                onRollHour={onRollHour}
                onSaveNote={(note) => dispatch({ type: 'setEntryNote', entryId: selected.id, note, at: now() })}
                hasKey={hasKey}
                onInterpret={onInterpret}
                onPinFact={(text) => pinFact(text, 'ai')}
                onFollowUp={onFollowUp}
                onOpenSettings={openAiSettings}
              />
            )}
          </div>

          <div className="columns">
            <Journal
              entries={session.journal}
              selectedId={selected?.id ?? null}
              onSelect={selectEntry}
              onDelete={(id) => dispatch({ type: 'deleteEntry', entryId: id, at: now() })}
            />
            <FactsPanel
              facts={session.facts}
              onAdd={(text) => pinFact(text, 'player')}
              onEdit={(id, text) => dispatch({ type: 'editFact', factId: id, text, at: now() })}
              onRemove={(id) => dispatch({ type: 'removeFact', factId: id, at: now() })}
            />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <p>
          Unofficial fan tool; not affiliated with Pickpocket Press. Rules from <em>Tales of Argosa</em>. Card art by Earl Geier,
          Jeffrey Koch, Dean Spencer, Felipe da Silva, Bradley K McDevitt and others, via the{' '}
          <a href="https://perchance.org/tales-of-argosa-read-the-signs">official Deck of Signs</a>; dice faces from the{' '}
          <a href="https://dddice.com/dice/consult-the-bones-lnutsc0l">official Consult the Bones set</a>.
        </p>
      </footer>
    </>
  )
}
