export function moveItem<T>(items: T[], from: number, to: number): T[] | null {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return null
  }

  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)

  return next
}
