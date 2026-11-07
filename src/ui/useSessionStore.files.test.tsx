import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { serializeSession } from '../state/fileStore.ts'
import { sampleSession, T1 } from '../state/fixtures.ts'
import { clearRecovery } from '../state/recovery.ts'
import type { Session } from '../state/session.ts'
import { useSessionStore } from './useSessionStore.ts'

// The store's file flows against a stand-in File System Access API: Save picks a file and
// then autosaves to it, Open reads one, cancelling a picker changes nothing, a failed write
// is reported. The fallback (no API) downloads and reads through a file input.

type Store = ReturnType<typeof useSessionStore>

/** A fake file handle that records every write. */
function fakeHandle(name: string, contents = '', failWrites = false) {
  const writes: string[] = []
  const handle = {
    name,
    getFile: async () => new File([contents], name, { type: 'application/json' }),
    createWritable: async () => {
      if (failWrites) throw new Error('The disk is full.')
      let text = ''
      return { write: async (t: string) => void (text += t), close: async () => void writes.push(text) }
    },
  }
  return { handle: handle as unknown as FileSystemFileHandle, writes }
}

/** The installed picker stand-ins, for checking how they were called. */
const picker = (name: 'showOpenFilePicker' | 'showSaveFilePicker') =>
  (window as unknown as Record<typeof name, ReturnType<typeof vi.fn>>)[name]

const abort = () => Promise.reject(new DOMException('The user aborted a request.', 'AbortError'))

function installPickers(pickers: { open?: () => Promise<unknown>; save?: () => Promise<unknown> }) {
  Object.assign(window, {
    showOpenFilePicker: vi.fn(pickers.open ?? abort),
    showSaveFilePicker: vi.fn(pickers.save ?? abort),
  })
}

function removePickers() {
  const win = window as unknown as Partial<Record<'showOpenFilePicker' | 'showSaveFilePicker', unknown>>
  delete win.showOpenFilePicker
  delete win.showSaveFilePicker
}

const pinFact = (store: Store, text: string) =>
  act(() => store.dispatch({ type: 'addFact', fact: { id: text, text, source: 'player', at: T1 }, at: T1 }))

const lastWritten = (writes: string[]): Session => JSON.parse(writes.at(-1)!)

async function renderStore() {
  const hook = renderHook(() => useSessionStore())
  // Let the startup recovery check finish (there's nothing to recover).
  await waitFor(() => expect(hook.result.current.recovered).toBeNull())
  return hook
}

beforeEach(async () => {
  await clearRecovery()
})
afterEach(removePickers)

describe('with the File System Access API', () => {
  test('Save picks a file and writes the session; later changes autosave to the same file', async () => {
    const { handle, writes } = fakeHandle('barrow.json')
    installPickers({ save: async () => handle })
    const { result } = await renderStore()
    expect(result.current.canAutosave).toBe(true)

    pinFact(result.current, 'The gate is barred')
    expect(result.current.file.status).toBe('unsaved')
    await act(() => result.current.save())
    expect(result.current.file).toMatchObject({ status: 'saved', fileName: 'barrow.json' })
    expect(lastWritten(writes).facts.map((f) => f.text)).toEqual(['The gate is barred'])
    // Save filters to session files, so a new file gets the .json extension.
    expect(picker('showSaveFilePicker')).toHaveBeenCalledWith(expect.objectContaining({ types: [expect.objectContaining({ accept: { 'application/json': ['.json'] } })] }))

    pinFact(result.current, 'A dead lord hoards here')
    await waitFor(() => expect(writes).toHaveLength(2), { timeout: 2000 })
    expect(lastWritten(writes).facts).toHaveLength(2)
    await waitFor(() => expect(result.current.file.status).toBe('saved'))
  })

  test('cancelling the save picker changes nothing and shows no error', async () => {
    installPickers({})
    const { result } = await renderStore()
    pinFact(result.current, 'Unsaved')
    await act(() => result.current.save())
    expect(result.current.file).toMatchObject({ status: 'unsaved', error: null, fileName: null })
  })

  test('a failed write is reported, and the work stays unsaved in memory', async () => {
    const { handle } = fakeHandle('barrow.json', '', true)
    installPickers({ save: async () => handle })
    const { result } = await renderStore()
    pinFact(result.current, 'Keep me')
    await act(() => result.current.save())
    expect(result.current.file).toMatchObject({ status: 'error', error: 'The disk is full.' })
    expect(result.current.session.facts).toHaveLength(1)
    expect(result.current.wouldDiscard).toBe(true)
  })

  test('Open loads a session file; a damaged one is reported and nothing changes', async () => {
    const good = fakeHandle('barrow.json', serializeSession(sampleSession()))
    installPickers({ open: async () => [good.handle] })
    const { result } = await renderStore()
    await act(() => result.current.open())
    expect(result.current.session.name).toBe('The Barrow Lord')
    expect(result.current.file).toMatchObject({ status: 'saved', fileName: 'barrow.json' })
    // Open has no type filter (it greys out files on Chrome for macOS); the contents are checked instead.
    expect(picker('showOpenFilePicker')).toHaveBeenCalledWith()

    const bad = fakeHandle('notes.json', '{"hello": 1}')
    installPickers({ open: async () => [bad.handle] })
    await act(() => result.current.open())
    expect(result.current.file.status).toBe('error')
    expect(result.current.file.error).toMatch(/doesn't look like an RPG Oracle session/)
    expect(result.current.session.name).toBe('The Barrow Lord')
  })

  test('a session holding only a context counts as work, so New and Open ask first', async () => {
    const { result } = await renderStore()
    expect(result.current.hasContent).toBe(false)
    act(() => result.current.dispatch({ type: 'setContext', context: 'Thuel at the barrow', at: T1 }))
    expect(result.current.hasContent).toBe(true)
    expect(result.current.wouldDiscard).toBe(true)
  })

  test('New starts an empty session with no file', async () => {
    const good = fakeHandle('barrow.json', serializeSession(sampleSession()))
    installPickers({ open: async () => [good.handle] })
    const { result } = await renderStore()
    await act(() => result.current.open())
    await act(() => result.current.startNew())
    expect(result.current.session).toMatchObject({ name: 'Untitled session', journal: [], facts: [] })
    expect(result.current.file).toMatchObject({ status: 'new', fileName: null, handle: null })
  })
})

describe('without it (Safari, Firefox)', () => {
  test('Save downloads the session, and the status says so', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:session')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { result } = await renderStore()
    expect(result.current.canAutosave).toBe(false)
    act(() => result.current.dispatch({ type: 'rename', name: 'The Barrow Lord', at: T1 }))
    await act(() => result.current.save())
    expect(click).toHaveBeenCalledOnce()
    expect(result.current.file).toMatchObject({ status: 'saved', fileName: 'the-barrow-lord.json', handle: null })
    createObjectURL.mockRestore()
    click.mockRestore()
  })

  test('Open reads a file chosen with the file input', async () => {
    const { result } = await renderStore()
    const picked = new File([serializeSession(sampleSession())], 'barrow.json', { type: 'application/json' })
    await act(() => result.current.openFallback(picked))
    expect(result.current.session.name).toBe('The Barrow Lord')
    expect(result.current.file).toMatchObject({ status: 'saved', fileName: 'barrow.json', handle: null })
  })
})
