export function sortOrder<T extends { id: string }>(
  items: T[],
  order: string[] | null | undefined
): T[] {
  if (!order) return items

  const positions = new Map(order.map((id, index) => [id, index]))

  return [...items].sort(
    (a, b) =>
      (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  )
}
