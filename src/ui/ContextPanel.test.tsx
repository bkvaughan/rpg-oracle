import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import ContextPanel from './ContextPanel.tsx'

test('the summary previews the first line, or says there is none', () => {
  const { rerender } = render(<ContextPanel context="" onChange={() => {}} />)
  expect(screen.getByText('Session context', { exact: false, selector: 'summary' })).toHaveTextContent('none yet')
  rerender(<ContextPanel context={'Thuel, a barbarian\nHunting the barrow lord'} onChange={() => {}} />)
  expect(screen.getByText('· Thuel, a barbarian')).toBeInTheDocument()
})

test('every change is saved straight away, without leaving the field', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  function Host() {
    const [context, setContext] = useState('At the barrow')
    return <ContextPanel context={context} onChange={(c) => (onChange(c), setContext(c))} />
  }
  render(<Host />)
  await user.click(screen.getByText('Session context', { exact: false, selector: 'summary' }))
  await user.type(screen.getByRole('textbox', { name: 'Session context' }), ', at night')
  expect(onChange).toHaveBeenLastCalledWith('At the barrow, at night')
  expect(screen.getByRole('textbox', { name: 'Session context' })).toHaveFocus()
})

test('a new context from outside (opening a session) is shown', () => {
  const { rerender } = render(<ContextPanel context="Old" onChange={() => {}} />)
  rerender(<ContextPanel context="New" onChange={() => {}} />)
  expect(screen.getByRole('textbox', { name: 'Session context', hidden: true })).toHaveValue('New')
})
