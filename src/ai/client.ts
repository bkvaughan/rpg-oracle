import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { JournalEntry, Session } from '../state/session.ts'
import { AiError } from './errors.ts'
import { buildUserPrompt, SYSTEM_PROMPT } from './prompt.ts'
import { readingSchema, type Reading } from './schema.ts'
import type { AiModel } from './settings.ts'

// The only module that talks to the network. BYOK: the SDK runs in the browser with the
// player's own key. To move to a server proxy later, reimplement interpret() here.
// Loaded lazily by the UI (the SDK is most of the bundle), so import it with import().


const readingFormat = betaZodOutputFormat(readingSchema)

// Opus and Sonnet 5.5 can hand a declined request to Anthropic's recommended fallback model
// server-side. Haiku 5.5 has no server-side fallback.
const HAS_FALLBACK: Record<AiModel, boolean> = {
  'claude-opus-5-5': true,
  'claude-sonnet-5-5': true,
  'claude-haiku-5-5': false,
}

export interface InterpretOptions {
  apiKey: string
  model: AiModel
  signal?: AbortSignal
}

export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error
  if (error instanceof Anthropic.APIUserAbortError) return new AiError('cancelled', 'Interpretation cancelled.')
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new AiError('auth', 'The API key was rejected. Check it in AI settings.')
  }
  if (error instanceof Anthropic.RateLimitError) return new AiError('rate-limit', 'Rate limited by the API. Wait a moment and try again.')
  if (error instanceof Anthropic.BadRequestError) return new AiError('invalid', `The request was rejected: ${error.message}`)
  if (error instanceof Anthropic.APIConnectionError) return new AiError('network', 'Could not reach the Anthropic API. Check your connection.')
  if (error instanceof Anthropic.APIError) return new AiError('unknown', `The API call failed (${error.status}): ${error.message}`)
  return new AiError('unknown', error instanceof Error ? error.message : 'Unknown error.')
}

/** Asks the model to interpret one settled oracle result in the context of the session. */
export async function interpret(entry: JournalEntry, session: Session, opts: InterpretOptions): Promise<Reading> {
  if (!opts.apiKey.trim()) throw new AiError('no-key', 'Add your Anthropic API key in AI settings first.')

  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true })
  const fallback = HAS_FALLBACK[opts.model]

  let response: Anthropic.Beta.BetaMessage
  try {
    response = await client.beta.messages.create(
      {
        model: opts.model,
        max_tokens: 16000,
        // Thinking is adaptive by default on these models. Medium effort keeps an
        // interpretation quick; it is a short creative judgement, not a hard problem.
        output_config: { effort: 'medium', format: readingFormat },
        ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: buildUserPrompt(entry, session) }],
      },
      { signal: opts.signal },
    )
  } catch (error) {
    throw toAiError(error)
  }

  if (response.stop_reason === 'refusal') {
    throw new AiError('refusal', 'The model declined to interpret this. Try rewording the question.')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new AiError('invalid', 'The reading was cut off. Try again.')
  }

  const text = response.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim()

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new AiError('invalid', 'The model did not return a usable reading. Try again.')
  }
  const parsed = readingSchema.safeParse(json)
  if (!parsed.success) throw new AiError('invalid', 'The model returned an unexpected shape. Try again.')
  return parsed.data
}
