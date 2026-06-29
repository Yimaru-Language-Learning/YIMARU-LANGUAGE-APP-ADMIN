import { getAccessToken } from "./teamAuthStorage"

const API_BASE = import.meta.env.VITE_API_BASE_URL as string

export const EXPORT_MAX_ROWS = 50_000

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export const EXPORT_ROUTES = {
  payments: "/admin/payments/export",
  users: "/users/export",
  subscriptions: "/admin/subscriptions/export",
  activityLogs: "/activity-logs/export",
  teamMembers: "/team/members/export",
} as const

export const EXPORT_PERMISSIONS = {
  payments: "payments.export",
  users: "users.export",
  subscriptions: "subscriptions.export",
  activityLogs: "activity_logs.export",
  teamMembers: "team.members.export",
} as const

/** Base name used in downloaded CSV filenames (resource + local date/time). */
export const EXPORT_RESOURCE_NAMES = {
  payments: "payments",
  users: "users",
  subscriptions: "subscriptions",
  activityLogs: "activity-logs",
  teamMembers: "team-members",
} as const

const EXPORT_PATH_RESOURCE_NAMES: Record<string, string> = {
  [EXPORT_ROUTES.payments]: EXPORT_RESOURCE_NAMES.payments,
  [EXPORT_ROUTES.users]: EXPORT_RESOURCE_NAMES.users,
  [EXPORT_ROUTES.subscriptions]: EXPORT_RESOURCE_NAMES.subscriptions,
  [EXPORT_ROUTES.activityLogs]: EXPORT_RESOURCE_NAMES.activityLogs,
  [EXPORT_ROUTES.teamMembers]: EXPORT_RESOURCE_NAMES.teamMembers,
}

export function buildExportFilename(resourceName: string, at: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const date = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
  const time = `${pad(at.getHours())}-${pad(at.getMinutes())}-${pad(at.getSeconds())}`
  return `${resourceName}_${date}_${time}.csv`
}

function resolveExportResourceName(path: string, override?: string): string {
  const custom = override?.trim()
  if (custom) return custom
  return EXPORT_PATH_RESOURCE_NAMES[path] ?? "export"
}

function buildQuery(params: QueryParams): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue
    sp.set(key, String(value))
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Downloads a CSV export. Pass the same filter params as the list API (excluding pagination).
 */
export async function downloadCsvExport(
  path: string,
  params: QueryParams,
  options?: { token?: string | null; resourceName?: string },
): Promise<string> {
  const accessToken = options?.token ?? getAccessToken()
  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const url = `${API_BASE}${path}${buildQuery(params)}`
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    let message = `Export failed (${res.status})`
    const contentType = res.headers.get("Content-Type") ?? ""
    try {
      if (contentType.includes("application/json")) {
        const body = (await res.json()) as { message?: string; error?: string }
        message = body.message || body.error || message
      } else {
        const text = await res.text()
        if (text.trim()) message = text.trim()
      }
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  const filename = buildExportFilename(resolveExportResourceName(path, options?.resourceName))

  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = filename
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }

  return filename
}
