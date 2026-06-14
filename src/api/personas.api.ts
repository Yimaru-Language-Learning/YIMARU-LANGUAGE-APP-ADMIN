import http from "./http"
import { DEFAULT_TABLE_PAGE_SIZE } from "../lib/tablePagination"
import type {
  CreatePersonaInput,
  DeletePersonaResponse,
  GetPersonaResponse,
  GetPersonasResponse,
  ListPersonasParams,
  LmsPersona,
  MutatePersonaResponse,
  PersonaListData,
  UpdatePersonaInput,
} from "../types/persona.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizePersona(raw: unknown): LmsPersona | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null

  const name = String(raw.name ?? "").trim()
  if (!name) return null

  const descriptionRaw = raw.description
  const description =
    descriptionRaw == null || String(descriptionRaw).trim() === ""
      ? null
      : String(descriptionRaw)

  const profilePictureRaw = raw.profile_picture
  const profile_picture =
    profilePictureRaw == null || String(profilePictureRaw).trim() === ""
      ? null
      : String(profilePictureRaw)

  const genderRaw = raw.gender
  const gender =
    genderRaw == null || String(genderRaw).trim() === "" ? null : String(genderRaw)

  const updatedAtRaw = raw.updated_at
  const updated_at =
    updatedAtRaw == null || String(updatedAtRaw).trim() === ""
      ? null
      : String(updatedAtRaw)

  return {
    id,
    name,
    description,
    profile_picture,
    gender,
    is_active: raw.is_active !== false,
    created_at: String(raw.created_at ?? ""),
    updated_at,
  }
}

export function parsePersonasList(body: unknown): PersonaListData {
  const empty: PersonaListData = {
    personas: [],
    total_count: 0,
    limit: DEFAULT_TABLE_PAGE_SIZE,
    offset: 0,
  }

  if (isRecord(body)) {
    const data = body.data ?? body.Data
    if (isRecord(data) && Array.isArray(data.personas)) {
      const personas = data.personas
        .map(normalizePersona)
        .filter((row): row is LmsPersona => row !== null)
      const total_count = Number(data.total_count ?? personas.length)
      const limit = Number(data.limit ?? DEFAULT_TABLE_PAGE_SIZE)
      const offset = Number(data.offset ?? 0)
      return {
        personas,
        total_count: Number.isFinite(total_count) ? total_count : personas.length,
        limit: Number.isFinite(limit) ? limit : DEFAULT_TABLE_PAGE_SIZE,
        offset: Number.isFinite(offset) ? offset : 0,
      }
    }
  }

  return empty
}

export function parsePersonaMutation(body: unknown): LmsPersona | null {
  if (isRecord(body) && body.data != null) {
    return normalizePersona(body.data)
  }
  return normalizePersona(body)
}

function buildPersonasQuery(params: ListPersonasParams = {}): Record<string, string | number | boolean> {
  return {
    active_only: params.active_only !== false,
    limit: params.limit ?? DEFAULT_TABLE_PAGE_SIZE,
    offset: params.offset ?? 0,
  }
}

/** GET /personas — list persona catalog (paginated). */
export function listPersonas(params: ListPersonasParams = {}) {
  return http
    .get<GetPersonasResponse>("/personas", { params: buildPersonasQuery(params) })
    .then((res) => {
      const parsed = parsePersonasList(res.data)
      return {
        ...res,
        data: parsed,
        message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
      }
    })
}

/** GET /personas — legacy axios response for practice picker callers. */
export const getPersonas = (params?: ListPersonasParams) =>
  http.get<GetPersonasResponse>("/personas", { params: buildPersonasQuery(params ?? {}) })

/** GET /personas/:id */
export function getPersonaById(id: number) {
  return http.get<GetPersonaResponse>(`/personas/${id}`).then((res) => ({
    ...res,
    data: parsePersonaMutation(res.data),
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))
}

/** POST /personas */
export function createPersona(payload: CreatePersonaInput) {
  return http.post<MutatePersonaResponse>("/personas", payload).then((res) => ({
    ...res,
    data: parsePersonaMutation(res.data),
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))
}

/** PUT /personas/:id */
export function updatePersona(id: number, payload: UpdatePersonaInput) {
  return http.put<MutatePersonaResponse>(`/personas/${id}`, payload).then((res) => ({
    ...res,
    data: parsePersonaMutation(res.data),
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))
}

/** DELETE /personas/:id */
export function deletePersona(id: number) {
  return http.delete<DeletePersonaResponse>(`/personas/${id}`).then((res) => ({
    ...res,
    message: isRecord(res.data) ? String(res.data.message ?? "") : undefined,
  }))
}

/** Active personas for practice editor dropdown. */
export async function listActivePersonasForPicker(limit = 200): Promise<LmsPersona[]> {
  const res = await listPersonas({ active_only: true, limit, offset: 0 })
  return res.data.personas
}
