import http from "./http"
import { fetchAllOffsetPages } from "../lib/fetchAllOffsetPages"
import {
  parseDefinitionsList,
  unwrapApiPayload,
} from "./questionTypeDefinitions.api"
import type {
  QuestionTypeDefinitionGroup,
  QuestionTypeDefinitionGroupCreatePayload,
  QuestionTypeDefinitionGroupDetail,
  QuestionTypeDefinitionGroupsListParams,
  QuestionTypeDefinitionGroupsListResult,
  QuestionTypeDefinitionGroupUpdatePayload,
} from "../types/questionTypeDefinition.types"

interface ApiEnvelope<T> {
  message?: string
  data?: T
  Data?: T
  success?: boolean
  status_code?: number
  error?: string
}

function asStr(v: unknown): string {
  if (v == null) return ""
  return String(v)
}

function parseGroupStatus(raw: unknown): QuestionTypeDefinitionGroup["status"] {
  const s = asStr(raw).toUpperCase()
  return s === "INACTIVE" ? "INACTIVE" : "ACTIVE"
}

export function normalizeQuestionTypeDefinitionGroup(
  raw: unknown,
): QuestionTypeDefinitionGroup | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = Number(o.id ?? o.ID)
  if (!Number.isFinite(id) || id <= 0) return null
  const descriptionRaw = o.description ?? o.Description
  return {
    id,
    name: asStr(o.name ?? o.Name).trim(),
    description:
      descriptionRaw == null || asStr(descriptionRaw).trim() === ""
        ? null
        : asStr(descriptionRaw).trim(),
    display_order: Number(o.display_order ?? o.DisplayOrder ?? 0) || 0,
    status: parseGroupStatus(o.status ?? o.Status),
    created_at: asStr(o.created_at ?? o.CreatedAt),
    updated_at:
      o.updated_at != null || o.UpdatedAt != null
        ? asStr(o.updated_at ?? o.UpdatedAt)
        : undefined,
  }
}

function parseGroupsList(payload: unknown): QuestionTypeDefinitionGroup[] {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload
      .map((row) => normalizeQuestionTypeDefinitionGroup(row))
      .filter((g): g is QuestionTypeDefinitionGroup => g != null)
  }
  if (typeof payload === "object") {
    const o = payload as Record<string, unknown>
    const inner =
      o.groups ??
      o.Groups ??
      o.question_type_definition_groups ??
      o.QuestionTypeDefinitionGroups
    if (Array.isArray(inner)) {
      return inner
        .map((row) => normalizeQuestionTypeDefinitionGroup(row))
        .filter((g): g is QuestionTypeDefinitionGroup => g != null)
    }
    const single = normalizeQuestionTypeDefinitionGroup(payload)
    return single ? [single] : []
  }
  return []
}

function parseGroupsListResult(payload: unknown): QuestionTypeDefinitionGroupsListResult {
  const empty: QuestionTypeDefinitionGroupsListResult = {
    groups: [],
    total_count: 0,
    limit: 20,
    offset: 0,
  }
  if (!payload || typeof payload !== "object") return empty
  const o = payload as Record<string, unknown>
  const groups = parseGroupsList(o.groups ?? o.Groups ?? payload)
  const total_count = Number(o.total_count ?? o.TotalCount ?? groups.length)
  const limit = Number(o.limit ?? o.Limit ?? 20)
  const offset = Number(o.offset ?? o.Offset ?? 0)
  return {
    groups,
    total_count: Number.isFinite(total_count) ? total_count : groups.length,
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
  }
}

async function fetchGroupsPage(
  params?: QuestionTypeDefinitionGroupsListParams,
): Promise<QuestionTypeDefinitionGroupsListResult> {
  const res = await http.get<ApiEnvelope<unknown>>("/questions/type-definition-groups", {
    params,
  })
  const raw = unwrapApiPayload(res) ?? res.data
  return parseGroupsListResult(raw)
}

const GROUPS_FETCH_ALL_PAGE_SIZE = 100

/** Lists all groups (paginates through the API). */
export async function getQuestionTypeDefinitionGroups(
  params?: QuestionTypeDefinitionGroupsListParams,
): Promise<QuestionTypeDefinitionGroupsListResult> {
  const hasExplicitPagination = params?.limit !== undefined || params?.offset !== undefined
  if (hasExplicitPagination) {
    return fetchGroupsPage(params)
  }

  const groups = await fetchAllOffsetPages(async (offset, limit) => {
    const page = await fetchGroupsPage({ ...params, limit, offset })
    return { items: page.groups, total_count: page.total_count }
  })

  return {
    groups: groups.sort(
      (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name),
    ),
    total_count: groups.length,
    limit: GROUPS_FETCH_ALL_PAGE_SIZE,
    offset: 0,
  }
}

export async function getQuestionTypeDefinitionGroupById(
  id: number,
): Promise<QuestionTypeDefinitionGroupDetail | undefined> {
  const res = await http.get<ApiEnvelope<unknown>>(`/questions/type-definition-groups/${id}`)
  const raw = unwrapApiPayload(res) ?? res.data
  if (!raw || typeof raw !== "object") return undefined
  const group = normalizeQuestionTypeDefinitionGroup(raw)
  if (!group) return undefined
  const o = raw as Record<string, unknown>
  const definitions = parseDefinitionsList(o.definitions ?? o.Definitions)
  return { ...group, definitions }
}

export async function createQuestionTypeDefinitionGroup(
  body: QuestionTypeDefinitionGroupCreatePayload,
) {
  return http.post<ApiEnvelope<unknown>>("/questions/type-definition-groups", body)
}

export async function updateQuestionTypeDefinitionGroup(
  id: number,
  body: QuestionTypeDefinitionGroupUpdatePayload,
) {
  return http.put<ApiEnvelope<unknown>>(`/questions/type-definition-groups/${id}`, body)
}

export async function deleteQuestionTypeDefinitionGroup(id: number) {
  return http.delete<ApiEnvelope<unknown>>(`/questions/type-definition-groups/${id}`)
}

export function extractGroupMutationId(res: { data?: unknown }): number | undefined {
  const data = unwrapApiPayload(res)
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined
  const o = data as Record<string, unknown>
  const id = Number(o.id ?? o.ID)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

export function groupApiErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string; error?: string } } }
  return String(
    err.response?.data?.message || err.response?.data?.error || fallback,
  )
}
