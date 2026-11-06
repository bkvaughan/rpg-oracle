import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  createAutosaver,
  downloadSession,
  parseSession,
  readFallbackFile,
  serializeSession,
  suggestedFileName,
  supportsFileSystemAccess,
  writeToHandle,
} from './fileStore.ts'
import { sampleSession } from './fixtures.ts'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('parseSession', () => {
  test('round-trips a saved session', () => {
    const session = sampleSession()
    expect(parseSession(serializeSession(session))).toEqual({ ok: true, session })
  })

  test('explains each kind of bad file', () => {
    expect(parseSession('not json')).toEqual({ ok: false, error: expect.stringMatching(/isn't valid JSON/) })
    expect(parseSession('{"hello": 1}')).toEqual({ ok: false, error: expect.stringMatching(/doesn't look like an RPG Oracle session/) })
    expect(parseSession('{"schemaVersion": 9}')).toEqual({ ok: false, error: expect.stringMatching(/newer version .*format 9/) })
    const damaged = { ...sampleSession(), name: 2 }
    expect(parseSession(JSON.stringify(damaged))).toEqual({ ok: false, error: expect.stringMatching(/damaged \(name: /) })
  })
})

describe('file names', () => {
  test('slugs the session name', () => {
    expect(suggestedFileName(sampleSession())).toBe('the-barrow-lord.json')
    expect(suggestedFileName({ ...sampleSession(), name: '!!!' })).toBe('session.json')
  })
})

describe('fallback selection', () => {
  test('uses the File System Access API only when both pickers exist', () => {
    expect(supportsFileSystemAccess({ showOpenFilePicker() {}, showSaveFilePicker() {} })).toBe(true)
    expect(supportsFileSystemAccess({ showOpenFilePicker() {} })).toBe(false)
    expect(supportsFileSystemAccess({})).toBe(false)
  })

  test('jsdom (like Safari and Firefox) gets the fallback', () => {
    expect(supportsFileSystemAccess()).toBe(false)
  })
})

describe('writing and reading', () => {
  test('writeToHandle writes the serialized session and closes the file', async () => {
    const writable = { write: vi.fn(), close: vi.fn() }
    const handle = { createWritable: vi.fn(async () => writable) } as unknown as FileSystemFileHandle
    await writeToHandle(handle, sampleSession())
    expect(writable.write).toHaveBeenCalledWith(serializeSession(sampleSession()))
    expect(writable.close).toHaveBeenCalled()
  })

  test('readFallbackFile parses a chosen file with no handle', async () => {
    const file = new File([serializeSession(sampleSession())], 'barrow.json', { type: 'application/json' })
    expect(await readFallbackFile(file)).toEqual({ session: sampleSession(), handle: null, fileName: 'barrow.json' })
  })

  test('readFallbackFile rejects a bad file with the readable error', async () => {
    await expect(readFallbackFile(new File(['nope'], 'x.json'))).rejects.toThrow(/isn't valid JSON/)
  })

  test('downloadSession saves via a temporary download link', () => {
    const createObjectURL = vi.fn(() => 'blob:session')
    const revokeObjectURL = vi.fn()
    // jsdom has no object URLs; stub a URL class that adds them, undone in afterEach.
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('the-barrow-lord.json')
      expect(this.href).toBe('blob:session')
    })
    vi.useFakeTimers()
    downloadSession(sampleSession())
    expect(click).toHaveBeenCalledOnce()
    // Revoked later, not straight after the click, so Safari can start the download.
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:session')
  })
})

describe('createAutosaver', () => {
  test('collapses a burst of changes into one write of the latest session', async () => {
    vi.useFakeTimers()
    const write = vi.fn(async () => {})
    const saver = createAutosaver(write, 500)
    const a = sampleSession()
    const b = { ...a, name: 'Second' }
    saver.schedule(a)
    saver.schedule(b)
    await vi.advanceTimersByTimeAsync(499)
    expect(write).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(write).toHaveBeenCalledOnce()
    expect(write).toHaveBeenCalledWith(b)
  })

  test('flush writes immediately, and only when something is pending', async () => {
    vi.useFakeTimers()
    const write = vi.fn(async () => {})
    const saver = createAutosaver(write)
    await saver.flush()
    expect(write).not.toHaveBeenCalled()
    saver.schedule(sampleSession())
    await saver.flush()
    expect(write).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1000)
    expect(write).toHaveBeenCalledOnce()
  })

  test('writes run one at a time, in order, and flush waits for a write already running', async () => {
    const order: string[] = []
    let finishFirst = () => {}
    const write = vi.fn(async (s: { name: string }) => {
      order.push(`start ${s.name}`)
      if (s.name === 'A') await new Promise<void>((resolve) => (finishFirst = resolve))
      order.push(`end ${s.name}`)
    })
    const saver = createAutosaver(write)
    const a = { ...sampleSession(), name: 'A' }
    const b = { ...sampleSession(), name: 'B' }
    saver.schedule(a)
    const first = saver.flush()
    saver.schedule(b)
    const second = saver.flush()
    await Promise.resolve()
    expect(order).toEqual(['start A'])
    finishFirst()
    await Promise.all([first, second])
    expect(order).toEqual(['start A', 'end A', 'start B', 'end B'])
  })

  test('a failed write does not block the next one', async () => {
    const write = vi.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined)
    const saver = createAutosaver(write)
    saver.schedule(sampleSession())
    await saver.flush()
    saver.schedule(sampleSession())
    await saver.flush()
    expect(write).toHaveBeenCalledTimes(2)
  })
})
