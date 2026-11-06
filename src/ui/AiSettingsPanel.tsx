import { useState, type FormEvent } from 'react'
import { AI_MODELS, type AiModel, type AiSettings } from '../ai/settings.ts'

// Bring-your-own-key: the key is kept in this browser only and sent only to Anthropic.

interface Props {
  settings: AiSettings
  /** Returns false if the browser wouldn't store the settings. */
  onSave: (settings: AiSettings) => boolean
  onForget: () => void
}

export default function AiSettingsPanel({ settings, onSave, onForget }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [model, setModel] = useState<AiModel>(settings.model)
  const [saved, setSaved] = useState<'stored' | 'visit-only' | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaved(onSave({ apiKey: apiKey.trim(), model }) ? 'stored' : 'visit-only')
  }

  return (
    <details className="panel ai-settings" open={!settings.apiKey || undefined}>
      <summary className="label">AI settings {settings.apiKey ? '· key saved' : '· no key yet'}</summary>
      <form onSubmit={submit} className="ai-form">
        <p className="secondary">
          Interpretation is optional. It uses your own Anthropic API key, which stays in this browser and is sent only to
          Anthropic. Calls are billed to your account.
        </p>
        <div className="field-grid">
          <label className="field">
            <span className="label">Anthropic API key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => (setApiKey(e.target.value), setSaved(null))}
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-…"
            />
          </label>
          <label className="field">
            <span className="label">Model</span>
            <select value={model} onChange={(e) => (setModel(e.target.value as AiModel), setSaved(null))}>
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}: {m.note}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="session-actions">
          <button type="submit" className="btn btn-small btn-primary">
            Save
          </button>
          {settings.apiKey && (
            <button
              type="button"
              className="btn btn-small btn-danger"
              onClick={() => (setApiKey(''), setSaved(null), onForget())}
            >
              Forget key
            </button>
          )}
          {saved && (
            <span className="secondary" role="status">
              {saved === 'stored' ? 'Saved.' : "Kept for this visit only: this browser won't store it."}
            </span>
          )}
        </div>
      </form>
    </details>
  )
}
