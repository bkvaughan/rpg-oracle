import { useState } from 'react'
import { secureRng } from '../engine/rng.ts'
import { rollHour } from '../engine/signs.ts'
import { CARDS } from '../data/deck.ts'
import { ask, type AskRequest } from './ask.ts'
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
          <AskPanel onAsk={onAsk} />

          <div aria-live="polite">{selected && <ResultView key={selected.id} entry={selected} onRollHour={onRollHour} />}</div>

          <div className="columns">
            <Journal
              entries={session.journal}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              onDelete={(id) => dispatch({ type: 'deleteEntry', entryId: id, at: now() })}
            />
            <FactsPanel
              facts={session.facts}
              onAdd={(text) => {
                const at = now()
                dispatch({ type: 'addFact', fact: { id: crypto.randomUUID(), text, source: 'player', at }, at })
              }}
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
