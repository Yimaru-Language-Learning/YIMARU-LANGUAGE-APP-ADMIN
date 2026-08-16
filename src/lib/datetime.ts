/** Default business timezone for Yimaru (East Africa Time, UTC+3, no DST). */
export const APP_TIMEZONE = "Africa/Addis_Ababa"
export const APP_TIMEZONE_LABEL = "EAT"
/** Fixed offset used when building RFC3339 bounds from calendar days. */
export const APP_TIMEZONE_OFFSET = "+03:00"

export function isValidDateInput(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}/.test(value.trim()))
}

/** Today's calendar date (YYYY-MM-DD) in the app timezone. */
export function getAppNowCalendarDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** Split an instant into EAT wall-clock parts for schedule pickers. */
export function getAppDateTimeParts(iso: string | null | undefined): {
  year: string
  month: string
  day: string
  hour: string
  minute: string
} | null {
  if (!iso?.trim()) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
  }
}

/**
 * Parse YYYY-MM-DD HH:MM as EAT wall clock and return RFC3339 UTC.
 * Returns null when invalid or not in the future.
 */
export function toRfc3339FromAppLocal(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
): string | null {
  const y = year.trim()
  const mo = month.trim().padStart(2, "0")
  const d = day.trim().padStart(2, "0")
  const h = hour.trim().padStart(2, "0")
  const min = minute.trim().padStart(2, "0")

  if (y.length !== 4 || mo.length !== 2 || d.length !== 2 || h.length !== 2 || min.length !== 2) {
    return null
  }

  const mNum = Number(mo)
  const dNum = Number(d)
  const hNum = Number(h)
  const minNum = Number(min)
  if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31 || hNum < 0 || hNum > 23 || minNum < 0 || minNum > 59) {
    return null
  }

  const iso = `${y}-${mo}-${d}T${h}:${min}:00${APP_TIMEZONE_OFFSET}`
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  if (toAppCalendarDate(parsed) !== `${y}-${mo}-${d}`) return null
  if (parsed.getTime() <= Date.now()) return null
  return parsed.toISOString()
}

/** Value for `<input type="datetime-local" />` showing wall clock in EAT. */
export function toDatetimeLocalAppValue(iso: string | null | undefined): string {
  const parts = getAppDateTimeParts(iso)
  if (!parts) return ""
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

/** Parse datetime-local input as EAT wall clock → RFC3339 UTC. */
export function fromDatetimeLocalAppValue(value: string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed)
  if (!match) return undefined
  const [, year, month, day, hour, minute] = match
  return toRfc3339FromAppLocal(year, month, day, hour, minute) ?? undefined
}

/** Calendar YYYY-MM-DD of an instant in the app timezone. */
export function toAppCalendarDate(iso: string | Date): string | null {
  const d = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

export function formatAppDate(
  iso: string | null | undefined,
  emptyLabel = "—",
): string {
  if (!iso) return emptyLabel
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return emptyLabel
  return d.toLocaleDateString("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatAppLongDate(
  iso: string | null | undefined,
  emptyLabel = "—",
): string {
  if (!iso) return emptyLabel
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return emptyLabel
  return d.toLocaleDateString("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Relative activity stamp in EAT (Today/Yesterday/date + time). */
export function formatAppRelativeDateTime(
  iso: string | null | undefined,
  emptyLabel = "unassigned",
): string {
  if (!iso?.trim()) return emptyLabel
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return emptyLabel

  const today = getAppNowCalendarDate()
  const thatDay = toAppCalendarDate(d)
  if (!thatDay) return formatAppDateTime(iso, emptyLabel)

  const dayDiff = Math.round(
    (Date.parse(`${today}T00:00:00${APP_TIMEZONE_OFFSET}`) -
      Date.parse(`${thatDay}T00:00:00${APP_TIMEZONE_OFFSET}`)) /
      86_400_000,
  )

  const timePart = d.toLocaleTimeString("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  if (dayDiff === 0) return `Today, ${timePart}`
  if (dayDiff === 1) return `Yesterday, ${timePart}`
  return `${formatAppDate(iso, emptyLabel)}, ${timePart}`
}

export function formatAppDateTime(
  iso: string | null | undefined,
  emptyLabel = "—",
): string {
  if (!iso) return emptyLabel
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return emptyLabel
  return d.toLocaleString("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function formatAppDateTimeSeconds(
  iso: string | null | undefined,
  emptyLabel = "—",
): string {
  if (!iso) return emptyLabel
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return emptyLabel
  return d.toLocaleString("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function formatAppTime(
  iso: string | null | undefined,
  emptyLabel = "—",
): string {
  if (!iso) return emptyLabel
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return emptyLabel
  return d.toLocaleTimeString("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

/** Midnight EAT for a YYYY-MM-DD calendar day, as RFC3339. */
export function toAppDayStartISO(ymd: string): string {
  const day = ymd.trim().slice(0, 10)
  return `${day}T00:00:00${APP_TIMEZONE_OFFSET}`
}

/** End of EAT calendar day (inclusive-style), as RFC3339. */
export function toAppDayEndISO(ymd: string): string {
  const day = ymd.trim().slice(0, 10)
  return `${day}T23:59:59.999${APP_TIMEZONE_OFFSET}`
}

/** Next calendar day (UTC date arithmetic on Y-M-D components). */
export function nextAppCalendarDay(ymd: string): string {
  const [year, month, day] = ymd.trim().slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return ymd
  const dt = new Date(Date.UTC(year, month - 1, day))
  dt.setUTCDate(dt.getUTCDate() + 1)
  return dt.toISOString().slice(0, 10)
}

/** Exclusive upper bound: next EAT midnight after ymd. */
export function toAppNextDayStartISO(ymd: string): string {
  return toAppDayStartISO(nextAppCalendarDay(ymd))
}
