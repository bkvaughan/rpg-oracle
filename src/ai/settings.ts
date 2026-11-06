// Bring-your-own-key settings, stored only in this browser. The key goes nowhere except
// the player's own calls to the Anthropic API (src/ai/client.ts).

export type AiModel = 'claude-opus-5-5' | 'claude-sonnet-5-5' | 'claude-haiku-5-5'

export const AI_MODELS: { id: AiModel; label: string; note: string }[] = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Richest readings; the default' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'Faster and cheaper' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', note: 'Fastest and cheapest' },
]

export const DEFAULT_MODEL: AiModel = 'claude-opus-5-5'

export interface AiSettings {
  apiKey: string
  model: AiModel
}

const STORAGE_KEY = 'rpg-oracle-ai-settings'

export function loadSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiSettings>
      return {
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
        model: AI_MODELS.some((m) => m.id === parsed.model) ? (parsed.model as AiModel) : DEFAULT_MODEL,
      }
    }
  } catch {
    // A corrupt or unavailable store falls back to defaults.
  }
  return { apiKey: '', model: DEFAULT_MODEL }
}

/** False when this browser won't store it (e.g. some private windows); the key then lasts for this visit only. */
export function saveSettings(settings: AiSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export function forgetSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing was stored.
  }
}
