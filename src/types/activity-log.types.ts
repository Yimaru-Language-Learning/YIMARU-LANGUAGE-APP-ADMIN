export type ActivityLogActorKind = "user" | "team_member"

export interface ActivityLog {
  id: number
  actor_id?: number | null
  actor_role?: string | null
  actor_name?: string | null
  actor_email?: string | null
  actor_kind?: ActivityLogActorKind | null
  action: string
  resource_type: string
  resource_id?: number | null
  message?: string | null
  metadata: Record<string, unknown>
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface ActivityLogListData {
  logs: ActivityLog[]
  total_count: number
  limit: number
  offset: number
}

export interface GetActivityLogsResponse {
  message: string
  data: ActivityLogListData
  success: boolean
  status_code: number
  metadata: null
}

export interface GetActivityLogResponse {
  message: string
  data: ActivityLog
  success: boolean
  status_code: number
  metadata: null
}

export interface ActivityLogFilters {
  action?: string
  actor_id?: number
  resource_type?: string
  resource_id?: number
  after?: string
  before?: string
  limit?: number
  offset?: number
}
