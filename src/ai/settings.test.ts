import { afterEach, expect, test, vi } from 'vitest'
import { DEFAULT_MODEL, forgetSettings, loadSettings, saveSettings } from './settings.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test('saves and loads the key and model', () => {
  expect(saveSettings({ apiKey: 'sk-ant-test', model: 'claude-haiku-5-5' })).toBe(true)
  expect(loadSettings()).toEqual({ apiKey: 'sk-ant-test', model: 'claude-haiku-5-5' })
  forgetSettings()
  expect(loadSettings()).toEqual({ apiKey: '', model: DEFAULT_MODEL })
})

test('reports a browser that will not store the settings instead of throwing', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  })
  expect(saveSettings({ apiKey: 'sk-ant-test', model: DEFAULT_MODEL })).toBe(false)
})

test('stored settings that are corrupt or out of date fall back to safe defaults', () => {
  localStorage.setItem('rpg-oracle-ai-settings', '{not json')
  expect(loadSettings()).toEqual({ apiKey: '', model: DEFAULT_MODEL })
  // A model that has since been retired, and a key of the wrong type.
  localStorage.setItem('rpg-oracle-ai-settings', JSON.stringify({ apiKey: 42, model: 'claude-old-1' }))
  expect(loadSettings()).toEqual({ apiKey: '', model: DEFAULT_MODEL })
})
