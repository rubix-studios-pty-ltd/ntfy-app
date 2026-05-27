export function formatDate(value?: string | Date) {
  if (!value) {
    return 'Never'
  }

  const date =
    value instanceof Date ? value : /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Never'
  }

  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
