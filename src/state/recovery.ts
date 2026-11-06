import { sessionSchema, type Session } from './session.ts'

// A copy of the current session in IndexedDB, so a crash or closed tab never loses play.
// It is a safety net only; the JSON file on disk is the real save.

export interface RecoveryRecord {
  session: Session
  /** False when the copy holds changes that never reached a file. */
  savedToFile: boolean
}

const DB_NAME = 'rpg-oracle'
const STORE = 'recovery'
const KEY = 'current'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = op(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

export async function saveRecovery(record: RecoveryRecord): Promise<void> {
  await run('readwrite', (s) => s.put(record, KEY))
}

/** The stored copy, or null if there is none or it no longer validates. */
export async function loadRecovery(): Promise<RecoveryRecord | null> {
  const record = (await run('readonly', (s) => s.get(KEY))) as RecoveryRecord | undefined
  if (!record) return null
  const parsed = sessionSchema.safeParse(record.session)
  return parsed.success ? { session: parsed.data, savedToFile: record.savedToFile === true } : null
}

export async function clearRecovery(): Promise<void> {
  await run('readwrite', (s) => s.delete(KEY))
}

/**
 * Which recovered session (if any) to offer the player.
 * - At startup (nothing opened): offer it if it holds unsaved changes.
 * - After opening a file: offer it only if it is the same session and newer than the file.
 */
export function recoveryOffer(record: RecoveryRecord | null, opened: Session | null): Session | null {
  if (!record) return null
  if (!opened) return record.savedToFile ? null : record.session
  const sameSession = record.session.id === opened.id
  return sameSession && record.session.updatedAt > opened.updatedAt ? record.session : null
}
