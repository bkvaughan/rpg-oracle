import { useState, type FormEvent } from 'react'
import { AI_MODELS, type AiModel, type AiSettings } from '../ai/settings.ts'

// Bring-your-own-key: the key is kept in this browser only and sent only to Anthropic.

interface Props {
  settings: AiSettings
  onSave: (settings: AiSettings) => void
  onForget: () => void
}

export default function AiSettingsPanel({ settings, onSave, onForget }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [model, setModel] = useState<AiModel>(settings.model)
  const [saved, setSaved] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ apiKey: apiKey.trim(), model })
    setSaved(true)
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
              onChange={(e) => (setApiKey(e.target.value), setSaved(false))}
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-…"
            />
          </label>
          <label className="field">
            <span className="label">Model</span>
            <select value={model} onChange={(e) => (setModel(e.target.value as AiModel), setSaved(false))}>
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
              onClick={() => (setApiKey(''), setSaved(false), onForget())}
            >
              Forget key
            </button>
          )}
          {saved && (
            <span className="secondary" role="status">
              Saved.
            </span>
          )}
        </div>
      </form>
    </details>
  )
}
