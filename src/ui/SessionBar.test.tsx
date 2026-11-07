import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { sampleSession } from '../state/fixtures.ts'
import SessionBar from './SessionBar.tsx'
import type { FileState, SessionStore } from './useSessionStore.ts'

// SessionBar against a stand-in store: the real store's file and recovery logic has its own
// tests (useSessionStore.test.tsx); here we check what the bar shows and which action it calls.

function fakeStore(overrides: Partial<SessionStore> = {}, file: Partial<FileState> = {}): SessionStore {
  return {
    session: sampleSession(),
    dispatch: vi.fn(),
    file: { handle: null, fileName: null, status: 'new', error: null, ...file },
    canAutosave: true,
    hasContent: true,
    wouldDiscard: false,
    recovered: null,
    open: vi.fn(async () => {}),
    openFallback: vi.fn(async () => {}),
    save: vi.fn(async () => {}),
    saveAs: vi.fn(async () => {}),
    startNew: vi.fn(async () => {}),
    restoreRecovered: vi.fn(),
    discardRecovered: vi.fn(),
    ...overrides,
  } as SessionStore
}

describe('SessionBar', () => {
  test.each([
    [{ status: 'new' }, true, 'Not saved to a file yet'],
    [{ status: 'saving', fileName: 'barrow.json' }, true, 'Saving to barrow.json…'],
    [{ status: 'saved', fileName: 'barrow.json' }, true, 'Saved to barrow.json'],
    [{ status: 'saved', fileName: 'barrow.json' }, false, 'Downloaded as barrow.json'],
    [{ status: 'unsaved', fileName: 'barrow.json' }, true, 'Unsaved changes to barrow.json'],
    [{ status: 'unsaved', fileName: 'barrow.json' }, false, 'Changes since barrow.json was downloaded'],
    [{ status: 'unsaved' }, true, 'Unsaved session'],
    [{ status: 'error', error: 'Disk full' }, true, 'Disk full'],
  ] as const)('save status %o (autosave %s): %s', (file, canAutosave, text) => {
    render(<SessionBar store={fakeStore({ canAutosave }, file)} />)
    expect(screen.getByRole('status')).toHaveTextContent(text)
  })

  test('renaming dispatches the new name', async () => {
    const store = fakeStore()
    render(<SessionBar store={store} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Session' }), '!')
    expect(store.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'rename', name: 'The Barrow Lord!' }))
  })

  test('New asks first when it would discard work, and Keep backs out', async () => {
    const user = userEvent.setup()
    const store = fakeStore({ wouldDiscard: true })
    render(<SessionBar store={store} />)
    await user.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByText(/Discard unsaved changes\?/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep' }))
    expect(store.startNew).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(store.startNew).toHaveBeenCalledOnce()
  })

  test('with nothing to lose, New and Open act straight away', async () => {
    const user = userEvent.setup()
    const store = fakeStore()
    render(<SessionBar store={store} />)
    await user.click(screen.getByRole('button', { name: 'New' }))
    await user.click(screen.getByRole('button', { name: 'Open…' }))
    expect(store.startNew).toHaveBeenCalledOnce()
    expect(store.open).toHaveBeenCalledOnce()
  })

  test('Save, and Save as once a file is open', async () => {
    const user = userEvent.setup()
    const store = fakeStore({}, { handle: {} as FileSystemFileHandle, fileName: 'barrow.json', status: 'saved' })
    render(<SessionBar store={store} />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('button', { name: 'Save as…' }))
    expect(store.save).toHaveBeenCalledOnce()
    expect(store.saveAs).toHaveBeenCalledOnce()
  })

  test('without the File System Access API, Save is Download and Open uses a file picker', async () => {
    const user = userEvent.setup()
    const store = fakeStore({ canAutosave: false })
    const { container } = render(<SessionBar store={store} />)
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(store.save).toHaveBeenCalledOnce()

    const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(['{}'], 'barrow.json', { type: 'application/json' })
    await user.upload(picker, file)
    expect(store.openFallback).toHaveBeenCalledWith(file)
    expect(store.open).not.toHaveBeenCalled()
  })
})
