import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { bonesEntry, reading, signsEntry } from '../state/fixtures.ts'
import Journal from './Journal.tsx'

test('the journal lists entries newest first, with the ruling and the note', () => {
  const entries = [
    signsEntry('s1'),
    { ...bonesEntry('b1'), reading: { ...reading, ruling: 'No sentry; a scarecrow.' }, note: 'Thuel walked past it' },
    { ...bonesEntry('b2', ''), reading },
  ]
  render(<Journal entries={entries} selectedId="b1" onSelect={() => {}} onDelete={() => {}} />)
  const items = screen.getAllByRole('listitem')
  expect(items.map((li) => li.querySelector('.journal-question')!.textContent)).toEqual([
    'No question',
    'Is there a sentry?',
    "What's going on at this ruin?",
  ])
  expect(within(items[0]).getByText(reading.ruling)).toHaveClass('journal-ruling')
  expect(within(items[1]).getByText('No sentry; a scarecrow.')).toHaveClass('journal-ruling')
  expect(within(items[1]).getByText('Thuel walked past it')).toHaveClass('journal-note')
  expect(items[2].querySelector('.journal-ruling')).toBeNull()
  expect(items[1]).toHaveClass('selected')
  expect(within(items[1]).getByRole('button', { name: /^Is there a sentry/ })).toHaveAttribute('aria-current', 'true')
})

test('deleting asks first; Keep backs out and Delete removes', async () => {
  const user = userEvent.setup()
  const onDelete = vi.fn()
  render(<Journal entries={[bonesEntry('b1')]} selectedId={null} onSelect={() => {}} onDelete={onDelete} />)
  await user.click(screen.getByRole('button', { name: 'Delete "Is there a sentry?"' }))
  await user.click(screen.getByRole('button', { name: 'Keep' }))
  expect(onDelete).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Delete "Is there a sentry?"' }))
  await user.click(screen.getByRole('button', { name: 'Delete' }))
  expect(onDelete).toHaveBeenCalledWith('b1')
})
