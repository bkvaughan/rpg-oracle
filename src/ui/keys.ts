// Keyboard shortcuts stay out of the way while the player is typing.

/** True when a key press belongs to a text field rather than to a page shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  if (!(target instanceof HTMLInputElement)) return false
  // Radios, checkboxes and buttons take no text, so shortcuts still work from them.
  return !['radio', 'checkbox', 'button', 'submit', 'reset', 'file'].includes(target.type)
}
