type KeyEvent = Pick<
  KeyboardEvent,
  'key' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey' | 'isComposing' | 'getModifierState'
>

export function shortcutEvent(event: KeyEvent): string | null {
  if (event.isComposing || event.getModifierState('AltGraph')) return null

  const raw = event.key
  if (['Control', 'Shift', 'Alt', 'Meta', 'Dead', 'Process'].includes(raw)) return null

  const key = raw === ' ' ? 'Space' : /^[a-z]$/i.test(raw) ? raw.toUpperCase() : raw

  const valid =
    key === 'Tab' ||
    key === 'Space' ||
    key === 'Enter' ||
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) ||
    /^[A-Z0-9]$/.test(key) ||
    /^F(?:[1-9]|1[0-2])$/.test(key)

  if (!valid) return null

  return [
    event.ctrlKey ? 'Ctrl' : null,
    event.altKey ? 'Alt' : null,
    event.shiftKey ? 'Shift' : null,
    event.metaKey ? 'Meta' : null,
    key,
  ]
    .filter(Boolean)
    .join('+')
}

export function editableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]'
    )
  )
}
