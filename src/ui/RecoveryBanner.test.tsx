import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { sampleSession } from '../state/fixtures.ts'
import RecoveryBanner from './RecoveryBanner.tsx'

// Restore, Replace and Keep are tested with the store in useSessionStore.test.tsx.
test('says what the recovered session holds, so the player can judge it', () => {
  const one = { ...sampleSession(), journal: sampleSession().journal.slice(0, 1) }
  const { rerender } = render(<RecoveryBanner session={sampleSession()} confirmReplace={false} onRestore={() => {}} onDiscard={() => {}} />)
  expect(screen.getByRole('alert')).toHaveTextContent(/The Barrow Lord from .*: 2 questions, 1 fact\./)
  rerender(<RecoveryBanner session={{ ...one, facts: [] }} confirmReplace={false} onRestore={() => {}} onDiscard={() => {}} />)
  expect(screen.getByRole('alert')).toHaveTextContent('1 question, 0 facts.')
})
