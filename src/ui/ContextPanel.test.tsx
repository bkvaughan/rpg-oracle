import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import ContextPanel from './ContextPanel.tsx'

test('the summary previews the first line, or says there is none', () => {
  const { rerender } = render(<ContextPanel context="" onSave={() => {}} />)
  expect(screen.getByText('Session context', { exact: false, selector: 'summary' })).toHaveTextContent('none yet')
  rerender(<ContextPanel context={'Thuel, a barbarian\nHunting the barrow lord'} onSave={() => {}} />)
  expect(screen.getByText('· Thuel, a barbarian')).toBeInTheDocument()
})

test('saves on blur, only when changed', async () => {
  const user = userEvent.setup()
  const onSave = vi.fn()
  render(<ContextPanel context="At the barrow" onSave={onSave} />)
  await user.click(screen.getByText('Session context', { exact: false, selector: 'summary' }))
  const box = screen.getByRole('textbox', { name: 'Session context' })
  await user.click(box)
  await user.tab()
  expect(onSave).not.toHaveBeenCalled()
  await user.type(box, ', at night')
  expect(onSave).not.toHaveBeenCalled()
  await user.tab()
  expect(onSave).toHaveBeenCalledExactlyOnceWith('At the barrow, at night')
})

test('a new context from outside (opening a session) replaces the draft', () => {
  const { rerender } = render(<ContextPanel context="Old" onSave={() => {}} />)
  rerender(<ContextPanel context="New" onSave={() => {}} />)
  expect(screen.getByRole('textbox', { name: 'Session context', hidden: true })).toHaveValue('New')
})
