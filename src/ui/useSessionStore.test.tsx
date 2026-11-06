import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { sampleSession, T1 } from '../state/fixtures.ts'
import { clearRecovery, loadRecovery, saveRecovery } from '../state/recovery.ts'
import RecoveryBanner from './RecoveryBanner.tsx'
import { useSessionStore } from './useSessionStore.ts'

const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

const pinFact = (store: ReturnType<typeof useSessionStore>, text: string) =>
  act(() => store.dispatch({ type: 'addFact', fact: { id: text, text, source: 'player', at: T1 }, at: T1 }))

describe('recovery offer', () => {
  beforeEach(async () => {
    await clearRecovery()
    await saveRecovery({ session: sampleSession(), savedToFile: false })
  })

  test('while the offer waits, new play does not overwrite the crash copy', async () => {
    const { result } = renderHook(() => useSessionStore())
    await waitFor(() => expect(result.current.recovered).not.toBeNull())
    pinFact(result.current, 'A new fact')
    await settle()
    expect((await loadRecovery())?.session.id).toBe(sampleSession().id)
    expect(result.current.wouldDiscard).toBe(true)
  })

  test('Discard backs up the current session in its place', async () => {
    const { result } = renderHook(() => useSessionStore())
    await waitFor(() => expect(result.current.recovered).not.toBeNull())
    pinFact(result.current, 'A new fact')
    act(() => result.current.discardRecovered())
    await settle()
    const record = await loadRecovery()
    expect(record?.session.id).toBe(result.current.session.id)
    expect(record?.session.facts.map((f) => f.text)).toEqual(['A new fact'])
    expect(record?.savedToFile).toBe(false)
  })

  test('Restore loads the recovered session and backs it up again', async () => {
    const { result } = renderHook(() => useSessionStore())
    await waitFor(() => expect(result.current.recovered).not.toBeNull())
    act(() => result.current.restoreRecovered())
    expect(result.current.session.id).toBe(sampleSession().id)
    pinFact(result.current, 'After restore')
    await settle()
    expect((await loadRecovery())?.session.facts.at(-1)?.text).toBe('After restore')
  })
})

describe('RecoveryBanner', () => {
  test('asks before replacing a session that holds anything', async () => {
    const user = userEvent.setup()
    const onRestore = vi.fn()
    render(<RecoveryBanner session={sampleSession()} confirmReplace onRestore={onRestore} onDiscard={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    expect(onRestore).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Keep' }))
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    await user.click(screen.getByRole('button', { name: 'Replace' }))
    expect(onRestore).toHaveBeenCalledOnce()
  })

  test('restores at once when the current session is empty', async () => {
    const user = userEvent.setup()
    const onRestore = vi.fn()
    render(<RecoveryBanner session={sampleSession()} confirmReplace={false} onRestore={onRestore} onDiscard={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    expect(onRestore).toHaveBeenCalledOnce()
  })
})
