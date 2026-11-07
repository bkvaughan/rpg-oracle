import { expect, test } from 'vitest'
import { isTypingTarget } from './keys.ts'

test('text fields own their key presses; choices, buttons and the page do not', () => {
  const make = (html: string) => {
    const wrap = document.createElement('div')
    wrap.innerHTML = html
    return wrap.firstElementChild
  }
  expect(isTypingTarget(make('<input type="text">'))).toBe(true)
  expect(isTypingTarget(make('<input>'))).toBe(true)
  expect(isTypingTarget(make('<input type="password">'))).toBe(true)
  expect(isTypingTarget(make('<textarea></textarea>'))).toBe(true)
  expect(isTypingTarget(make('<select></select>'))).toBe(true)
  const editable = make('<div contenteditable="true"></div>') as HTMLElement
  // jsdom doesn't compute isContentEditable from the attribute.
  Object.defineProperty(editable, 'isContentEditable', { value: true })
  expect(isTypingTarget(editable)).toBe(true)

  expect(isTypingTarget(make('<input type="radio">'))).toBe(false)
  expect(isTypingTarget(make('<input type="checkbox">'))).toBe(false)
  expect(isTypingTarget(make('<button>Go</button>'))).toBe(false)
  expect(isTypingTarget(document.body)).toBe(false)
  expect(isTypingTarget(null)).toBe(false)
})
