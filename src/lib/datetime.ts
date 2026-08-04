/** Default business timezone for Yimaru (East Africa Time, UTC+3, no DST). */
export const APP_TIMEZONE = "Africa/Addis_Ababa"
export const APP_TIMEZONE_LABEL = "EAT"
/** Fixed offset used when building RFC3339 bounds from calendar days. */
export const APP_TIMEZONE_OFFSET = "+03:00"

export function isValidDateInput(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}/.test(value.trim()))
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
