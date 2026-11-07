import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { DEFAULT_MODEL } from '../ai/settings.ts'
import AiSettingsPanel from './AiSettingsPanel.tsx'

const empty = { apiKey: '', model: DEFAULT_MODEL }

test('open while there is no key; saving trims the key and keeps the chosen model', async () => {
  const user = userEvent.setup()
  const onSave = vi.fn(() => true)
  const { container } = render(<AiSettingsPanel settings={empty} onSave={onSave} onForget={() => {}} />)
  expect(container.querySelector('details')).toHaveAttribute('open')
  await user.type(screen.getByLabelText('Anthropic API key'), '  sk-ant-test  ')
  await user.selectOptions(screen.getByLabelText('Model'), 'claude-haiku-5-5')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSave).toHaveBeenCalledWith({ apiKey: 'sk-ant-test', model: 'claude-haiku-5-5' })
  expect(screen.getByRole('status')).toHaveTextContent('Saved.')
})

test("says so when the browser won't store the key, which then lasts for this visit only", async () => {
  const user = userEvent.setup()
  render(<AiSettingsPanel settings={empty} onSave={() => false} onForget={() => {}} />)
  await user.type(screen.getByLabelText('Anthropic API key'), 'sk-ant-test')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByRole('status')).toHaveTextContent("Kept for this visit only: this browser won't store it.")
  // Editing again clears the message.
  await user.type(screen.getByLabelText('Anthropic API key'), 'x')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('closed once a key is saved, with Forget key to remove it', async () => {
  const user = userEvent.setup()
  const onForget = vi.fn()
  const { container } = render(<AiSettingsPanel settings={{ apiKey: 'sk-ant-test', model: DEFAULT_MODEL }} onSave={() => true} onForget={onForget} />)
  expect(container.querySelector('details')).not.toHaveAttribute('open')
  expect(screen.getByText(/^AI settings/)).toHaveTextContent('key saved')
  await user.click(screen.getByText(/^AI settings/))
  await user.click(screen.getByRole('button', { name: 'Forget key' }))
  expect(onForget).toHaveBeenCalledOnce()
  expect(screen.getByLabelText('Anthropic API key')).toHaveValue('')
})
