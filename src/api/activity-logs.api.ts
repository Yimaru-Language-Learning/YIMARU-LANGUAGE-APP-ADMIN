import http from "./http"
import type {
  ActivityLog,
  ActivityLogFilters,
  ActivityLogListData,
  GetActivityLogResponse,
  GetActivityLogsResponse,
} from "../types/activity-log.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function normalizeActivityLog(raw: unknown): ActivityLog | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id ?? raw.ID)
  if (!Number.isFinite(id) || id <= 0) return null

  const actorIdRaw = raw.actor_id ?? raw.ActorId ?? raw.actorId
  const actorNameRaw = raw.actor_name ?? raw.ActorName ?? raw.actorName
  const actorEmailRaw = raw.actor_email ?? raw.ActorEmail ?? raw.actorEmail
  const actorKindRaw = raw.actor_kind ?? raw.ActorKind ?? raw.actorKind
  const resourceIdRaw = raw.resource_id ?? raw.ResourceId ?? raw.resourceId
  const metadataRaw = raw.metadata ?? raw.Metadata

  const actorKind =
    actorKindRaw === "user" || actorKindRaw === "team_member"
      ? actorKindRaw
      : actorKindRaw === "team"
        ? "team_member"
        : null

  return {
    id,
    actor_id:
      actorIdRaw == null || actorIdRaw === ""
        ? null
        : Number.isFinite(Number(actorIdRaw))
          ? Number(actorIdRaw)
          : null,
    actor_role:
      raw.actor_role != null || raw.ActorRole != null
        ? String(raw.actor_role ?? raw.ActorRole)
        : null,
    actor_name:
      actorNameRaw != null && String(actorNameRaw).trim()
        ? String(actorNameRaw).trim()
        : null,
    actor_email:
      actorEmailRaw != null && String(actorEmailRaw).trim()
        ? String(actorEmailRaw).trim()
        : null,
    actor_kind: actorKind,
    action: String(raw.action ?? raw.Action ?? ""),
    resource_type: String(raw.resource_type ?? raw.ResourceType ?? ""),
    resource_id:
      resourceIdRaw == null || resourceIdRaw === ""
        ? null
        : Number.isFinite(Number(resourceIdRaw))
          ? Number(resourceIdRaw)
          : null,
    message:
      raw.message != null || raw.Message != null
        ? String(raw.message ?? raw.Message)
        : null,
    metadata: isRecord(metadataRaw) ? metadataRaw : {},
    ip_address:
      raw.ip_address != null || raw.IpAddress != null
        ? String(raw.ip_address ?? raw.IpAddress)
        : null,
    user_agent:
      raw.user_agent != null || raw.UserAgent != null
        ? String(raw.user_agent ?? raw.UserAgent)
        : null,
    created_at: String(raw.created_at ?? raw.CreatedAt ?? ""),
  }
}

function unwrapPayload(body: unknown): unknown {
  if (!isRecord(body)) return body
  return body.data ?? body.Data ?? body
}

export function parseActivityLogList(body: unknown): ActivityLogListData {
  const empty: ActivityLogListData = { logs: [], total_count: 0, limit: 10, offset: 0 }
  const payload = unwrapPayload(body)
  if (!isRecord(payload)) return empty

  const inner = payload.logs ?? payload.Logs
  const logs = Array.isArray(inner)
    ? inner.map(normalizeActivityLog).filter((row): row is ActivityLog => row != null)
    : []

  const total_count = Number(payload.total_count ?? payload.TotalCount ?? logs.length)
  const limit = Number(payload.limit ?? payload.Limit ?? 10)
  const offset = Number(payload.offset ?? payload.Offset ?? 0)

  return {
    logs,
    total_count: Number.isFinite(total_count) ? total_count : logs.length,
    limit: Number.isFinite(limit) ? limit : 10,
    offset: Number.isFinite(offset) ? offset : 0,
  }
}

function buildQueryParams(filters?: ActivityLogFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {
    limit: Math.min(100, Math.max(1, filters?.limit ?? 10)),
    offset: Math.max(0, filters?.offset ?? 0),
  }
  if (filters?.actor_id != null) params.actor_id = filters.actor_id
  if (filters?.action?.trim()) params.action = filters.action.trim()
  if (filters?.resource_type?.trim()) params.resource_type = filters.resource_type.trim()
  if (filters?.resource_id != null) params.resource_id = filters.resource_id
  if (filters?.after?.trim()) params.after = filters.after.trim()
  if (filters?.before?.trim()) params.before = filters.before.trim()
  return params
}

export async function getActivityLogs(filters?: ActivityLogFilters): Promise<ActivityLogListData> {
  const res = await http.get<GetActivityLogsResponse>("/activity-logs", {
    params: buildQueryParams(filters),
  })
  return parseActivityLogList(res.data)
}

export async function getActivityLogById(id: number): Promise<ActivityLog> {
  const res = await http.get<GetActivityLogResponse>(`/activity-logs/${id}`)
  const payload = unwrapPayload(res.data)
  const log = normalizeActivityLog(payload)
  if (!log) throw new Error("Activity log not found")
  return log
}

export function activityLogApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string; error?: string } } }
  return String(err.response?.data?.message || err.response?.data?.error || fallback)
}
