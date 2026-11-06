import { useRef, useState } from 'react'
import type { FollowUp } from '../ai/schema.ts'
import { forgetSettings, loadSettings, saveSettings, type AiSettings } from '../ai/settings.ts'
import { secureRng } from '../engine/rng.ts'
import { rollHour } from '../engine/signs.ts'
import { CARDS } from '../data/deck.ts'
import { ask, type AskRequest } from './ask.ts'
import AiSettingsPanel from './AiSettingsPanel.tsx'
import AskPanel from './AskPanel.tsx'
import FactsPanel from './FactsPanel.tsx'
import Journal from './Journal.tsx'
import RecoveryBanner from './RecoveryBanner.tsx'
import ResultView from './result/ResultView.tsx'
import SessionBar from './SessionBar.tsx'
import { now, useSessionStore } from './useSessionStore.ts'

export default function App() {
  const store = useSessionStore()
  const { session, dispatch } = store
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [aiSettings, setAiSettings] = useState<AiSettings>(loadSettings)
  // A follow-up remounts the ask form with its question, tool and likelihood filled in.
  const [prefill, setPrefill] = useState<{ request: Partial<AskRequest>; n: number }>({ request: {}, n: 0 })
  const askRef = useRef<HTMLDivElement>(null)

  const selected = session.journal.find((e) => e.id === selectedId) ?? session.journal.at(-1) ?? null

  const onAsk = (request: AskRequest) => {
    const at = now()
    const entry = ask(request, secureRng, at, crypto.randomUUID())
    dispatch({ type: 'addEntry', entry, at })
    setSelectedId(entry.id)
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
    askRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    askRef.current?.querySelector('input')?.focus({ preventScroll: true })
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
          <p className="eyebrow">Tales of Argosa</p>
          <h1 className="display">RPG Oracle</h1>
          <p className="lede">Read the Signs. Consult the Bones. Let the dark answer.</p>
        </section>

        {store.recovered && (
          <RecoveryBanner session={store.recovered} onRestore={store.restoreRecovered} onDiscard={store.discardRecovered} />
        )}

        <div className="stack">
          <SessionBar store={store} />
          <AiSettingsPanel
            settings={aiSettings}
            onSave={(s) => (saveSettings(s), setAiSettings(s))}
            onForget={() => (forgetSettings(), setAiSettings(loadSettings()))}
          />
          <div ref={askRef}>
            <AskPanel key={prefill.n} initial={prefill.request} onAsk={onAsk} />
          </div>

          <div aria-live="polite">
            {selected && (
              <ResultView
                key={selected.id}
                entry={selected}
                onRollHour={onRollHour}
                hasKey={aiSettings.apiKey !== ''}
                onInterpret={onInterpret}
                onPinFact={(text) => pinFact(text, 'ai')}
                onFollowUp={onFollowUp}
              />
            )}
          </div>

          <div className="columns">
            <Journal
              entries={session.journal}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
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
