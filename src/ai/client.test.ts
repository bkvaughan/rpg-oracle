import Anthropic from '@anthropic-ai/sdk'
import { Messages } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { reading, sampleSession } from '../state/fixtures.ts'
import { interpret, toAiError } from './client.ts'
import { AiError } from './errors.ts'

const session = sampleSession()
const entry = session.journal[1]

function mockResponse(stop_reason: string, text: string) {
  return vi.spyOn(Messages.prototype, 'create').mockResolvedValue({
    stop_reason,
    content: [{ type: 'text', text }],
  } as never)
}

afterEach(() => vi.restoreAllMocks())

describe('interpret', () => {
  test('needs a key before calling the API', async () => {
    const create = vi.spyOn(Messages.prototype, 'create')
    await expect(interpret(entry, session, { apiKey: ' ', model: 'claude-opus-5-5' })).rejects.toMatchObject({ kind: 'no-key' })
    expect(create).not.toHaveBeenCalled()
  })

  test('sends a cached system prompt, structured output and fallbacks', async () => {
    const create = mockResponse('end_turn', JSON.stringify(reading))
    expect(await interpret(entry, session, { apiKey: 'k', model: 'claude-opus-5-5' })).toEqual(reading)
    const params = create.mock.calls[0][0] as unknown as Record<string, unknown>
    expect(params).toMatchObject({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: [{ type: 'text', cache_control: { type: 'ephemeral' } }],
    })
    expect((params.output_config as { format: unknown }).format).toBeDefined()
    expect(params).not.toHaveProperty('thinking')
  })

  test('Haiku has no server-side fallback, so none is requested', async () => {
    const create = mockResponse('end_turn', JSON.stringify(reading))
    await interpret(entry, session, { apiKey: 'k', model: 'claude-haiku-5-5' })
    const params = create.mock.calls[0][0] as unknown as Record<string, unknown>
    expect(params).not.toHaveProperty('fallbacks')
    expect(params).not.toHaveProperty('betas')
  })

  test.each([
    ['refusal', JSON.stringify(reading), 'refusal'],
    ['max_tokens', '{"ruling": "cut', 'invalid'],
    ['end_turn', 'not json', 'invalid'],
    ['end_turn', '{"ruling": 1}', 'invalid'],
  ])('stop_reason %s with %s is a %s error', async (stop, text, kind) => {
    mockResponse(stop, text)
    await expect(interpret(entry, session, { apiKey: 'k', model: 'claude-sonnet-5-5' })).rejects.toMatchObject({ kind })
  })
})

describe('toAiError', () => {
  const headers = new Headers()
  test.each([
    [new Anthropic.AuthenticationError(401, undefined, 'bad key', headers), 'auth'],
    [new Anthropic.PermissionDeniedError(403, undefined, 'no', headers), 'auth'],
    [new Anthropic.RateLimitError(429, undefined, 'slow', headers), 'rate-limit'],
    [new Anthropic.BadRequestError(400, undefined, 'bad', headers), 'invalid'],
    [new Anthropic.InternalServerError(500, undefined, 'oops', headers), 'unknown'],
    [new Anthropic.APIConnectionError({ message: 'offline' }), 'network'],
    [new Anthropic.APIUserAbortError(), 'cancelled'],
    [new Error('weird'), 'unknown'],
  ])('%s maps to %s', (error, kind) => {
    expect(toAiError(error).kind).toBe(kind)
  })

  test('passes AiErrors through', () => {
    const e = new AiError('refusal', 'no')
    expect(toAiError(e)).toBe(e)
  })
})
