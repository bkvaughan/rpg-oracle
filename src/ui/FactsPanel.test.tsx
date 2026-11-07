import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import FactsPanel from './FactsPanel.tsx'

test('a fact left blank is removed on blur; the remove button removes one too', async () => {
  const user = userEvent.setup()
  const onRemove = vi.fn()
  const at = '2026-11-06T20:00:00.000Z'
  // The panel is controlled: a field the player has cleared arrives back as blank text.
  const facts = [
    { id: 'f1', text: 'The gate is barred', source: 'player' as const, at },
    { id: 'f2', text: ' ', source: 'player' as const, at },
    { id: 'f3', text: 'A dead lord hoards here', source: 'ai' as const, at },
  ]
  render(<FactsPanel facts={facts} onAdd={() => {}} onEdit={() => {}} onRemove={onRemove} />)
  await user.click(screen.getByLabelText('Fact 1'))
  await user.click(screen.getByLabelText('Fact 2'))
  expect(onRemove).not.toHaveBeenCalled()
  await user.tab()
  expect(onRemove).toHaveBeenCalledWith('f2')
  await user.click(screen.getByRole('button', { name: 'Remove fact 3' }))
  expect(onRemove).toHaveBeenLastCalledWith('f3')
})

test('says what pinning a fact is for', () => {
  render(<FactsPanel facts={[]} onAdd={() => {}} onEdit={() => {}} onRemove={() => {}} />)
  expect(screen.getByText(/go with every interpretation/)).toBeInTheDocument()
  expect(screen.getByText('No facts pinned yet.')).toBeInTheDocument()
})
