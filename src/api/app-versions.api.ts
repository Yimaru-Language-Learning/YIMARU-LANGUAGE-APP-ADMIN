import http from "./http"
import { DEFAULT_TABLE_PAGE_SIZE } from "../lib/tablePagination"
import type {
  AppVersion,
  AppVersionMutationResponse,
  AppVersionsListData,
  AppVersionsListResponse,
  CreateAppVersionPayload,
  UpdateAppVersionPayload,
} from "../types/app-version.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizeAppVersion(raw: unknown): AppVersion | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null

  return {
    id,
    platform: String(raw.platform ?? ""),
    version_name: String(raw.version_name ?? ""),
    version_code: Number(raw.version_code ?? 0),
    update_type: String(raw.update_type ?? ""),
    release_notes: String(raw.release_notes ?? ""),
    store_url: String(raw.store_url ?? ""),
    min_supported_version_code: Number(raw.min_supported_version_code ?? 0),
    status: String(raw.status ?? ""),
    created_at: String(raw.created_at ?? ""),
  }
}

export function parseAppVersionsList(body: unknown): AppVersionsListData {
  const empty: AppVersionsListData = { versions: [], total_count: 0 }

  if (isRecord(body)) {
    const data = body.data
    if (isRecord(data) && Array.isArray(data.versions)) {
      const versions = data.versions
        .map(normalizeAppVersion)
        .filter((v): v is AppVersion => v !== null)
      const total_count = Number(data.total_count ?? versions.length)
      return { versions, total_count: Number.isFinite(total_count) ? total_count : versions.length }
    }
    if (Array.isArray(data)) {
      const versions = data.map(normalizeAppVersion).filter((v): v is AppVersion => v !== null)
      return { versions, total_count: versions.length }
    }
    if (Array.isArray(body.versions)) {
      const versions = body.versions
        .map(normalizeAppVersion)
        .filter((v): v is AppVersion => v !== null)
      const total_count = Number(body.total_count ?? versions.length)
      return { versions, total_count: Number.isFinite(total_count) ? total_count : versions.length }
    }
  }

  if (Array.isArray(body)) {
    const versions = body.map(normalizeAppVersion).filter((v): v is AppVersion => v !== null)
    return { versions, total_count: versions.length }
  }

  return empty
}

export function parseAppVersionMutation(body: unknown): AppVersion | null {
  if (isRecord(body) && body.data != null) {
    return normalizeAppVersion(body.data)
  }
  return normalizeAppVersion(body)
}

export type GetAppVersionsParams = {
  limit?: number
  offset?: number
}

export const getAppVersions = (params: GetAppVersionsParams = {}) => {
  const limit = params.limit ?? DEFAULT_TABLE_PAGE_SIZE
  const offset = params.offset ?? 0
  return http
    .get<AppVersionsListResponse>("/admin/app-versions", { params: { limit, offset } })
    .then((res) => {
      const parsed = parseAppVersionsList(res.data)
      return {
        ...res,
        data: parsed,
        message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
      }
    })
}

function mutationResult(res: { data: unknown }) {
  const version = parseAppVersionMutation(res.data)
  return {
    ...res,
    data: version,
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }
}

export const createAppVersion = (payload: CreateAppVersionPayload) =>
  http
    .post<AppVersionMutationResponse>("/admin/app-versions", payload)
    .then(mutationResult)

export const updateAppVersion = (id: number, payload: UpdateAppVersionPayload) =>
  http
    .put<AppVersionMutationResponse>(`/admin/app-versions/${id}`, payload)
    .then(mutationResult)

export const deleteAppVersion = (id: number) =>
  http.delete<{ message?: string }>(`/admin/app-versions/${id}`).then((res) => ({
    ...res,
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))
