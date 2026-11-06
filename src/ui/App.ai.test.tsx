import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { reading } from '../state/fixtures.ts'
import App from './App.tsx'

const interpret = vi.hoisted(() => vi.fn())
vi.mock('../ai/client.ts', async (original) => ({ ...(await original<typeof import('../ai/client.ts')>()), interpret }))

beforeEach(() => localStorage.clear())
afterEach(() => interpret.mockReset())

async function castBones(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/Consult the Bones/))
  await user.type(screen.getByLabelText('Your question'), 'Is there a sentry?')
  await user.click(screen.getByRole('button', { name: 'Cast the Bones' }))
}

test('without a key nothing is sent, and Interpret is disabled until a key is saved', async () => {
  const user = userEvent.setup()
  render(<App />)
  await castBones(user)
  expect(screen.getByRole('button', { name: 'Interpret' })).toBeDisabled()

  await user.type(screen.getByLabelText('Anthropic API key'), 'sk-ant-test')
  await user.click(within(screen.getByText(/^AI settings/).closest('details')!).getByRole('button', { name: 'Save' }))
  expect(screen.getByRole('button', { name: 'Interpret' })).toBeEnabled()
  // Saving a key doesn't interpret results asked before it.
  expect(interpret).not.toHaveBeenCalled()
  expect(JSON.parse(localStorage.getItem('rpg-oracle-ai-settings')!)).toEqual({ apiKey: 'sk-ant-test', model: 'claude-opus-5-5' })
})

test('with a key, a new result is interpreted by itself; facts pin on request; follow-ups prefill', async () => {
  localStorage.setItem('rpg-oracle-ai-settings', JSON.stringify({ apiKey: 'sk-ant-test', model: 'claude-sonnet-5-5' }))
  interpret.mockResolvedValue(reading)
  const user = userEvent.setup()
  render(<App />)
  await castBones(user)

  expect(await screen.findByText(reading.ruling)).toBeInTheDocument()
  expect(interpret).toHaveBeenCalledOnce()
  expect(interpret.mock.calls[0][2]).toMatchObject({ apiKey: 'sk-ant-test', model: 'claude-sonnet-5-5' })

  // Suggested facts are not pinned until accepted.
  expect(screen.queryByLabelText('Fact 1')).not.toBeInTheDocument()
  await user.clear(screen.getByLabelText('Suggested fact'))
  await user.type(screen.getByLabelText('Suggested fact'), 'Two sentries watch the gate')
  await user.click(within(screen.getByRole('region', { name: 'Interpretation' })).getByRole('button', { name: 'Pin' }))
  expect(screen.getByLabelText('Fact 1')).toHaveValue('Two sentries watch the gate')

  await user.click(screen.getByRole('button', { name: /Is she armed\?/ }))
  expect(screen.getByLabelText('Your question')).toHaveValue('Is she armed?')
  expect(screen.getByLabelText('Likely Yes')).toBeChecked()

  // The reading is stored on the journal entry.
  expect(screen.getByRole('button', { name: 'Interpret again' })).toBeInTheDocument()
})

test('an API error is shown and the button comes back', async () => {
  localStorage.setItem('rpg-oracle-ai-settings', JSON.stringify({ apiKey: 'k', model: 'claude-opus-5-5' }))
  const { AiError } = await import('../ai/errors.ts')
  interpret.mockRejectedValue(new AiError('auth', 'The API key was rejected. Check it in AI settings.'))
  const user = userEvent.setup()
  render(<App />)
  await castBones(user)
  expect(await screen.findByText('The API key was rejected. Check it in AI settings.')).toHaveAttribute('role', 'alert')
  expect(screen.getByRole('button', { name: 'Interpret' })).toBeEnabled()
})

test('selecting an older entry from the journal never calls the AI', async () => {
  localStorage.setItem('rpg-oracle-ai-settings', JSON.stringify({ apiKey: 'k', model: 'claude-opus-5-5' }))
  const { AiError } = await import('../ai/errors.ts')
  interpret.mockRejectedValue(new AiError('network', 'Could not reach Anthropic.'))
  const user = userEvent.setup()
  render(<App />)
  await castBones(user)
  await screen.findByText('Could not reach Anthropic.')
  await user.click(screen.getByRole('radio', { name: /Fortune die/ }))
  await user.click(screen.getByRole('button', { name: 'Roll the Fortune die' }))
  await screen.findAllByText('Could not reach Anthropic.')
  expect(interpret).toHaveBeenCalledTimes(2)

  const journal = screen.getByRole('region', { name: 'Journal' })
  await user.click(within(journal).getByRole('button', { name: /^Is there a sentry\?/ }))
  expect(screen.getByRole('button', { name: 'Interpret' })).toBeEnabled()
  expect(interpret).toHaveBeenCalledTimes(2)
})
