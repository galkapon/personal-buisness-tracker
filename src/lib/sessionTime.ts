const pad = (n: number) => String(n).padStart(2, '0')

/** yyyy-mm-dd in the user's local time zone (toISOString would give the UTC date). */
export function toLocalDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** hh:mm in the user's local time zone. */
export function toLocalTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Turns a date plus local start/end times into ISO timestamps.
 * An end time at or before the start time means the session ran past midnight.
 */
export function sessionRange(date: string, startTime: string, endTime: string) {
  const start = new Date(`${date}T${startTime}`)
  const end = new Date(`${date}T${endTime}`)
  if (end <= start) end.setDate(end.getDate() + 1)
  return { started_at: start.toISOString(), ended_at: end.toISOString() }
}
