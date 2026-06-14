import http from "./http"
import { DEFAULT_TABLE_PAGE_SIZE } from "../lib/tablePagination"
import type {
  CreateFAQRequest,
  CreateFAQResponse,
  DeleteFAQResponse,
  FAQ,
  FAQFilters,
  FAQListData,
  GetFAQResponse,
  GetFAQsResponse,
  UpdateFAQRequest,
  UpdateFAQResponse,
} from "../types/faq.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizeFAQ(raw: unknown): FAQ | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null

  const status = String(raw.status ?? "ACTIVE").toUpperCase()
  const category = raw.category
  const normalizedCategory =
    category == null || String(category).trim() === "" ? null : String(category)

  return {
    id,
    question: String(raw.question ?? ""),
    answer: String(raw.answer ?? ""),
    category: normalizedCategory,
    display_order: Number(raw.display_order ?? 0),
    status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    created_at: String(raw.created_at ?? ""),
    updated_at:
      raw.updated_at == null || String(raw.updated_at).trim() === ""
        ? null
        : String(raw.updated_at),
  }
}

export function parseFAQsList(body: unknown): FAQListData {
  const empty: FAQListData = { faqs: [], total_count: 0 }

  if (isRecord(body)) {
    const data = body.data
    if (isRecord(data) && Array.isArray(data.faqs)) {
      const faqs = data.faqs
        .map(normalizeFAQ)
        .filter((row): row is FAQ => row !== null)
      const total_count = Number(data.total_count ?? faqs.length)
      return {
        faqs,
        total_count: Number.isFinite(total_count) ? total_count : faqs.length,
      }
    }
    if (Array.isArray(data)) {
      const faqs = data.map(normalizeFAQ).filter((row): row is FAQ => row !== null)
      return { faqs, total_count: faqs.length }
    }
    if (Array.isArray(body.faqs)) {
      const faqs = body.faqs
        .map(normalizeFAQ)
        .filter((row): row is FAQ => row !== null)
      const total_count = Number(body.total_count ?? faqs.length)
      return {
        faqs,
        total_count: Number.isFinite(total_count) ? total_count : faqs.length,
      }
    }
  }

  if (Array.isArray(body)) {
    const faqs = body.map(normalizeFAQ).filter((row): row is FAQ => row !== null)
    return { faqs, total_count: faqs.length }
  }

  return empty
}

export function parseFAQMutation(body: unknown): FAQ | null {
  if (isRecord(body) && body.data != null) {
    return normalizeFAQ(body.data)
  }
  return normalizeFAQ(body)
}

function buildFAQQuery(filters: FAQFilters = {}): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (filters.status) params.status = filters.status
  if (filters.category?.trim()) params.category = filters.category.trim()
  params.limit = filters.limit ?? DEFAULT_TABLE_PAGE_SIZE
  params.offset = filters.offset ?? 0
  return params
}

/** GET /admin/faqs — list FAQs (all statuses). */
export const getFAQs = (filters: FAQFilters = {}) =>
  http
    .get<GetFAQsResponse>("/admin/faqs", { params: buildFAQQuery(filters) })
    .then((res) => {
      const parsed = parseFAQsList(res.data)
      return {
        ...res,
        data: parsed,
        message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
      }
    })

/** GET /admin/faqs/:id — get one FAQ for editing. */
export const getFAQById = (id: number) =>
  http.get<GetFAQResponse>(`/admin/faqs/${id}`).then((res) => ({
    ...res,
    data: parseFAQMutation(res.data),
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))

/** POST /admin/faqs — create FAQ. */
export const createFAQ = (payload: CreateFAQRequest) =>
  http.post<CreateFAQResponse>("/admin/faqs", payload).then((res) => ({
    ...res,
    data: parseFAQMutation(res.data),
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))

/** PUT /admin/faqs/:id — update FAQ. */
export const updateFAQ = (id: number, payload: UpdateFAQRequest) =>
  http.put<UpdateFAQResponse>(`/admin/faqs/${id}`, payload).then((res) => ({
    ...res,
    data: parseFAQMutation(res.data),
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))

/** DELETE /admin/faqs/:id — hard delete FAQ. */
export const deleteFAQ = (id: number) =>
  http.delete<DeleteFAQResponse>(`/admin/faqs/${id}`).then((res) => ({
    ...res,
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))

/** GET /faqs/:id — public detail (preview only, ACTIVE FAQs). */
export const getPublicFAQById = (id: number) =>
  http.get<GetFAQResponse>(`/faqs/${id}`).then((res) => ({
    ...res,
    data: parseFAQMutation(res.data),
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))

/** GET /faqs — public list (preview only, ACTIVE FAQs). */
export const getPublicFAQs = (filters: Pick<FAQFilters, "category" | "limit" | "offset"> = {}) =>
  http
    .get<GetFAQsResponse>("/faqs", { params: buildFAQQuery(filters) })
    .then((res) => {
      const parsed = parseFAQsList(res.data)
      return {
        ...res,
        data: parsed,
        message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
      }
    })
