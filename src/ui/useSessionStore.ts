import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  createAutosaver,
  downloadSession,
  openWithPicker,
  readFallbackFile,
  saveWithPicker,
  supportsFileSystemAccess,
  suggestedFileName,
  writeToHandle,
  type OpenedFile,
} from '../state/fileStore.ts'
import { sessionReducer, type Action } from '../state/reducer.ts'
import { clearRecovery, loadRecovery, recoveryOffer, saveRecovery } from '../state/recovery.ts'
import { newSession, type Session } from '../state/session.ts'

// Ties the pure session state to the disk and the IndexedDB safety copy.
// Chromium: Save once picks a file, then every change autosaves to it.
// Other browsers: Save downloads a copy; the status shows when changes are not yet downloaded.

export type SaveStatus = 'new' | 'unsaved' | 'saving' | 'saved' | 'error'

export interface FileState {
  handle: FileSystemFileHandle | null
  fileName: string | null
  status: SaveStatus
  error: string | null
}

export const now = () => new Date().toISOString()

const INITIAL_FILE: FileState = { handle: null, fileName: null, status: 'new', error: null }

/** The recovery copy is a safety net; a browser without IndexedDB (or a private window) just goes without. */
const quietly = (p: Promise<unknown>) => void p.catch(() => {})

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong with the file.')

export function useSessionStore() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => newSession(now()))
  const [file, setFile] = useState<FileState>(INITIAL_FILE)
  const [recovered, setRecovered] = useState<Session | null>(null)
  const canAutosave = useMemo(() => supportsFileSystemAccess(), [])

  // The session as last loaded or written; anything else is an unsaved change.
  const persisted = useRef<Session>(session)
  // The session as of the last render, so an autosave can tell whether a newer change exists.
  const latest = useRef<Session>(session)
  const handleRef = useRef<FileSystemFileHandle | null>(null)
  // True until the startup check for a crash copy is done, and while a recovery offer waits
  // for an answer: the crash copy is left alone then, so the session it holds can't be lost.
  const holdRecovery = useRef(true)

  const backup = useCallback((s: Session, savedToFile: boolean) => {
    if (!holdRecovery.current) quietly(saveRecovery({ session: s, savedToFile }))
  }, [])

  /** Ends the hold on the crash copy, backing up the current session if it has unsaved changes. */
  const releaseRecovery = useCallback(() => {
    holdRecovery.current = false
    if (latest.current !== persisted.current) backup(latest.current, false)
  }, [backup])

  // Created once. Its write callback reads handleRef when an autosave fires, never during
  // render, so the React Compiler's refs warning here is a false positive.
  // oxlint-disable-next-line react/refs
  const [autosaver] = useState(() =>
    createAutosaver(async (s) => {
      const handle = handleRef.current
      if (!handle) return
      setFile((f) => ({ ...f, status: 'saving', error: null }))
      try {
        await writeToHandle(handle, s)
        persisted.current = s
        // A change made while this write ran is still waiting for its own write.
        const newest = latest.current === s
        setFile((f) => ({ ...f, status: newest ? 'saved' : 'unsaved' }))
        if (newest) backup(s, true)
      } catch (e) {
        setFile((f) => ({ ...f, status: 'error', error: message(e) }))
      }
    }),
  )

  // Offer an unsaved session left behind by a crash or a closed tab.
  useEffect(() => {
    loadRecovery()
      .then((record) => recoveryOffer(record, null))
      .catch(() => null)
      .then((offer) => {
        setRecovered(offer)
        if (!offer) releaseRecovery()
      })
  }, [releaseRecovery])

  // Every change goes to the recovery copy at once and to the open file shortly after.
  useEffect(() => {
    latest.current = session
    if (session === persisted.current) return
    backup(session, false)
    setFile((f) => ({ ...f, status: 'unsaved' }))
    if (handleRef.current) autosaver.schedule(session)
  }, [session, autosaver, backup])

  useEffect(() => {
    const flush = () => void autosaver.flush()
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [autosaver])

  const loadOpened = useCallback(async (opened: OpenedFile) => {
    persisted.current = opened.session
    handleRef.current = opened.handle
    dispatch({ type: 'load', session: opened.session })
    setFile({ handle: opened.handle, fileName: opened.fileName, status: 'saved', error: null })
    let offer: Session | null = null
    try {
      offer = recoveryOffer(await loadRecovery(), opened.session)
    } catch {
      // No IndexedDB: nothing to offer.
    }
    setRecovered(offer)
    holdRecovery.current = offer !== null
  }, [])

  const run = useCallback(async (task: () => Promise<void>) => {
    try {
      await task()
    } catch (e) {
      setFile((f) => ({ ...f, status: 'error', error: message(e) }))
    }
  }, [])

  /** Chromium only: pick a file to open. Other browsers use openFallback with a file input. */
  const open = useCallback(
    () =>
      run(async () => {
        await autosaver.flush()
        const opened = await openWithPicker()
        if (opened) await loadOpened(opened)
      }),
    [run, autosaver, loadOpened],
  )

  const openFallback = useCallback(
    (picked: File) => run(async () => loadOpened(await readFallbackFile(picked))),
    [run, loadOpened],
  )

  const markSaved = useCallback((saved: Session, handle: FileSystemFileHandle | null, fileName: string) => {
    persisted.current = saved
    handleRef.current = handle
    setFile({ handle, fileName, status: 'saved', error: null })
    backup(saved, true)
  }, [backup])

  const saveAs = useCallback(
    () =>
      run(async () => {
        const handle = await saveWithPicker(session)
        if (handle) markSaved(session, handle, handle.name)
      }),
    [run, session, markSaved],
  )

  const save = useCallback(
    () =>
      run(async () => {
        if (!canAutosave) {
          downloadSession(session)
          markSaved(session, null, suggestedFileName(session))
        } else if (handleRef.current) {
          autosaver.schedule(session)
          await autosaver.flush()
        } else {
          await saveAs()
        }
      }),
    [run, canAutosave, session, markSaved, autosaver, saveAs],
  )

  const startNew = useCallback(
    () =>
      run(async () => {
        await autosaver.flush()
        const fresh = newSession(now())
        persisted.current = fresh
        handleRef.current = null
        dispatch({ type: 'load', session: fresh })
        setFile(INITIAL_FILE)
        setRecovered(null)
        holdRecovery.current = false
        // A crash copy that can't be cleared (no IndexedDB) has nothing in it to offer later.
        await clearRecovery().catch(() => {})
      }),
    [run, autosaver],
  )

  /** Restores the recovery copy as unsaved changes (autosaved if a file is open). */
  const restoreRecovered = useCallback(() => {
    holdRecovery.current = false
    if (recovered) dispatch({ type: 'load', session: recovered })
    setRecovered(null)
  }, [recovered])

  const discardRecovered = useCallback(() => {
    setRecovered(null)
    if (latest.current !== persisted.current) releaseRecovery()
    else {
      holdRecovery.current = false
      // The open file (if any) is now the truth; with no file there is nothing to keep.
      if (handleRef.current) backup(persisted.current, true)
      else quietly(clearRecovery())
    }
  }, [releaseRecovery, backup])

  const hasContent = session.journal.length + session.facts.length > 0 || session.context.trim() !== ''
  const hasUnsavedChanges = hasContent && (file.status === 'unsaved' || file.status === 'error' || file.status === 'saving')
  // New and Open replace the session and the crash copy, so they confirm first.
  const wouldDiscard = hasUnsavedChanges || recovered !== null

  return {
    session,
    dispatch: dispatch as (action: Action) => void,
    file,
    canAutosave,
    hasContent,
    wouldDiscard,
    recovered,
    open,
    openFallback,
    save,
    saveAs,
    startNew,
    restoreRecovered,
    discardRecovered,
  }
}

export type SessionStore = ReturnType<typeof useSessionStore>
