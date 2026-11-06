// Kept apart from client.ts so the UI can check error kinds without loading the SDK,
// which is only fetched when the player first asks for an interpretation.

export type AiErrorKind = 'no-key' | 'auth' | 'rate-limit' | 'refusal' | 'invalid' | 'network' | 'cancelled' | 'unknown'

export class AiError extends Error {
  readonly kind: AiErrorKind
  constructor(kind: AiErrorKind, message: string) {
    super(message)
    this.name = 'AiError'
    this.kind = kind
  }
}
