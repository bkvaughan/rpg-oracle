import { SCHEMA_VERSION, sessionSchema, type Session } from './session.ts'

// Session files on disk. Chromium browsers get the File System Access API, so a session is
// opened once and then autosaved to the same file. Other browsers fall back to opening via a
// file input and saving via download.

export type ParseResult = { ok: true; session: Session } | { ok: false; error: string }

export interface OpenedFile {
  session: Session
  /** Null in the fallback path: the file can be read but not written back. */
  handle: FileSystemFileHandle | null
  fileName: string
}

// The pickers aren't in TypeScript's DOM types yet (they're Chromium-only).
interface PickerOptions {
  types?: { description: string; accept: Record<string, string[]> }[]
  suggestedName?: string
}
interface PickerWindow {
  showOpenFilePicker(options?: PickerOptions): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(options?: PickerOptions): Promise<FileSystemFileHandle>
}

const FILE_TYPES = [{ description: 'RPG Oracle session', accept: { 'application/json': ['.json'] } }]

export function serializeSession(session: Session): string {
  return `${JSON.stringify(session, null, 2)}\n`
}

export function parseSession(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "This file isn't valid JSON, so it can't be a session file." }
  }
  if (typeof data !== 'object' || data === null || !('schemaVersion' in data)) {
    return { ok: false, error: "This doesn't look like an RPG Oracle session file." }
  }
  const version = (data as { schemaVersion: unknown }).schemaVersion
  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    return { ok: false, error: `This session was saved by a newer version of RPG Oracle (format ${version}). Reload the site and try again.` }
  }
  const parsed = sessionSchema.safeParse(data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue.path.length ? `${issue.path.join('.')}: ` : ''
    return { ok: false, error: `This session file is damaged (${where}${issue.message}).` }
  }
  return { ok: true, session: parsed.data }
}

export function suggestedFileName(session: Session): string {
  const slug = session.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'session'}.json`
}

export function supportsFileSystemAccess(win: object = window): boolean {
  return 'showOpenFilePicker' in win && 'showSaveFilePicker' in win
}

const pickers = () => window as unknown as PickerWindow
const isCancel = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

async function readOpened(file: File, handle: FileSystemFileHandle | null): Promise<OpenedFile> {
  const parsed = parseSession(await file.text())
  if (!parsed.ok) throw new Error(parsed.error)
  return { session: parsed.session, handle, fileName: file.name }
}

/** File System Access: pick and read a session file. Null if the player cancels. */
export async function openWithPicker(): Promise<OpenedFile | null> {
  try {
    // No type filter: Chrome on macOS can grey out matching files the first time the picker
    // opens. Any file can be picked; readOpened rejects one that isn't a session.
    const [handle] = await pickers().showOpenFilePicker()
    return await readOpened(await handle.getFile(), handle)
  } catch (e) {
    if (isCancel(e)) return null
    throw e
  }
}

/** File System Access: choose where to save, then write. Null if the player cancels. */
export async function saveWithPicker(session: Session): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await pickers().showSaveFilePicker({ types: FILE_TYPES, suggestedName: suggestedFileName(session) })
    await writeToHandle(handle, session)
    return handle
  } catch (e) {
    if (isCancel(e)) return null
    throw e
  }
}

export async function writeToHandle(handle: FileSystemFileHandle, session: Session): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(serializeSession(session))
  await writable.close()
}

/** Fallback: read a file chosen with <input type="file">. */
export function readFallbackFile(file: File): Promise<OpenedFile> {
  return readOpened(file, null)
}

/** Fallback: save by downloading the session as a JSON file. */
export function downloadSession(session: Session): void {
  const url = URL.createObjectURL(new Blob([serializeSession(session)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedFileName(session)
  link.click()
  // Revoking straight after click() can cancel the download in Safari, so give it time to start.
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}

const REVOKE_DELAY_MS = 60_000

/**
 * Debounced autosave: bursts of changes become one write. `flush` writes any pending
 * change immediately (e.g. before closing the file) and resolves once every earlier write
 * has finished. Writes run one at a time, in order, so an older write can never land after
 * a newer one.
 */
export function createAutosaver(write: (session: Session) => Promise<void>, delayMs = 500) {
  let pending: Session | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let queue: Promise<void> = Promise.resolve()

  const flush = (): Promise<void> => {
    if (timer) clearTimeout(timer)
    timer = null
    if (pending) {
      const session = pending
      pending = null
      // A failed write must not block the ones after it; the caller reports its own errors.
      queue = queue.then(() => write(session)).catch(() => {})
    }
    return queue
  }

  return {
    schedule(session: Session) {
      pending = session
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void flush(), delayMs)
    },
    flush,
  }
}
