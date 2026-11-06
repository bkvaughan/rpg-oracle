import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('shows the app title', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('RPG Oracle')
})

test('asking the Bones adds a journal entry and shows the result', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByLabelText(/Consult the Bones/))
  await user.click(screen.getByLabelText('Likely Yes'))
  await user.type(screen.getByLabelText('Your question'), 'Is there a sentry?')
  await user.click(screen.getByRole('button', { name: 'Cast the Bones' }))

  expect(screen.getByRole('heading', { level: 2, name: 'Is there a sentry?' })).toBeInTheDocument()
  expect(screen.getByText('Likely Yes', { selector: '.bones-result .label' })).toBeInTheDocument()
  const journal = screen.getByRole('region', { name: 'Journal' })
  expect(within(journal).getByText(/Consult the Bones \(likely-yes\)/)).toBeInTheDocument()
  expect(screen.getByLabelText('Your question')).toHaveValue('')
})

test('the ask button waits for a question, except for the Fortune die', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(screen.getByRole('button', { name: 'Draw two cards' })).toBeDisabled()
  await user.click(screen.getByLabelText(/Fortune die/))
  expect(screen.getByRole('button', { name: 'Roll the Fortune die' })).toBeEnabled()
})

test('Activity & Reaction needs no question and records the reaction, activity and creature', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByLabelText(/Activity & Reaction/))
  await user.click(screen.getByLabelText('Other creature'))
  await user.click(screen.getByRole('button', { name: 'Roll Activity & Reaction' }))
  expect(screen.getByRole('img', { name: /^Activity Die: \d, / })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /^d6 \(Activity Die\): \d$/ })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /^d6: \d$/ })).toBeInTheDocument()
  const journal = screen.getByRole('region', { name: 'Journal' })
  expect(within(journal).getByText(/^Activity & Reaction \(other creature\): \d \w+; \d+ [A-Za-z ]+$/)).toBeInTheDocument()
})

test('facts can be pinned and removed', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.type(screen.getByLabelText('New fact'), 'The barrow lord hunts at night')
  await user.click(screen.getByRole('button', { name: 'Pin' }))
  expect(screen.getByLabelText('Fact 1')).toHaveValue('The barrow lord hunts at night')
  await user.click(screen.getByRole('button', { name: 'Remove fact 1' }))
  expect(screen.queryByLabelText('Fact 1')).not.toBeInTheDocument()
})

test('deleting a journal entry asks for confirmation first', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByLabelText(/Fortune die/))
  await user.click(screen.getByRole('button', { name: 'Roll the Fortune die' }))
  const journal = screen.getByRole('region', { name: 'Journal' })
  await user.click(within(journal).getByRole('button', { name: /Delete/ }))
  await user.click(within(journal).getByRole('button', { name: 'Delete' }))
  expect(within(journal).getByText('Nothing asked yet.')).toBeInTheDocument()
})

test('Open asks before discarding unsaved changes', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.type(screen.getByLabelText('New fact'), 'The barrow lord hunts at night')
  await user.click(screen.getByRole('button', { name: 'Pin' }))
  await user.click(screen.getByRole('button', { name: 'Open…' }))
  expect(screen.getByText(/Discard unsaved changes\?/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Keep' }))
  expect(screen.getByLabelText('Fact 1')).toHaveValue('The barrow lord hunts at night')
})
