import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, test } from 'vitest'
import { sampleSession, T1, T2 } from './fixtures.ts'
import { clearRecovery, loadRecovery, recoveryOffer, saveRecovery } from './recovery.ts'

describe('IndexedDB recovery copy', () => {
  beforeEach(clearRecovery)

  test('saves and loads the latest copy', async () => {
    expect(await loadRecovery()).toBeNull()
    await saveRecovery({ session: sampleSession(), savedToFile: false })
    expect(await loadRecovery()).toEqual({ session: sampleSession(), savedToFile: false })
  })

  test('clear removes it', async () => {
    await saveRecovery({ session: sampleSession(), savedToFile: true })
    await clearRecovery()
    expect(await loadRecovery()).toBeNull()
  })

  test('ignores a copy that no longer validates', async () => {
    await saveRecovery({ session: { ...sampleSession(), journal: 'broken' } as never, savedToFile: false })
    expect(await loadRecovery()).toBeNull()
  })
})

describe('recoveryOffer', () => {
  const at = (updatedAt: string, id = 'session-1') => ({ ...sampleSession(), id, updatedAt })

  test('at startup, offers only unsaved changes', () => {
    expect(recoveryOffer(null, null)).toBeNull()
    expect(recoveryOffer({ session: at(T1), savedToFile: true }, null)).toBeNull()
    expect(recoveryOffer({ session: at(T1), savedToFile: false }, null)?.updatedAt).toBe(T1)
  })

  test('after opening a file, offers the copy only if it is the same session and newer', () => {
    expect(recoveryOffer({ session: at(T2), savedToFile: false }, at(T1))?.updatedAt).toBe(T2)
    expect(recoveryOffer({ session: at(T1), savedToFile: false }, at(T2))).toBeNull()
    expect(recoveryOffer({ session: at(T2, 'other'), savedToFile: false }, at(T1))).toBeNull()
  })
})
