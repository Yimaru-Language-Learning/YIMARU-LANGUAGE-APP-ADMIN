import http from "./http"
import type {
  DynamicElementDefinition,
  QuestionComponentCatalog,
  QuestionTypeDefinition,
  QuestionTypeDefinitionCreatePayload,
  QuestionTypeDefinitionUpdatePayload,
  QuestionTypeDefinitionValidatePayload,
  ValidateQuestionTypeDefinitionResult,
} from "../types/questionTypeDefinition.types"

interface ApiEnvelope<T> {
  message?: string
  data?: T
  /** Some routes use PascalCase in JSON */
  Data?: T
  success?: boolean
  status_code?: number
  error?: string
}

/**
 * Reads the inner payload from a typical API envelope, or the raw body.
 * Supports `data` / `Data` and list bodies where `res.data` is already an array
 * (e.g. GET /questions/type-definitions → `data: [ { ID, Key, … }, … ]`).
 */
export function unwrapApiPayload(res: { data?: unknown }): unknown {
  const body = res.data
  if (body === null || body === undefined) return undefined
  if (Array.isArray(body)) return body
  if (typeof body !== "object") return body
  const o = body as Record<string, unknown>
  if ("data" in o || "Data" in o) {
    const inner = o.data ?? o.Data
    return inner
  }
  return body
}

function fromStringArray(arr: unknown): string[] {
  return Array.isArray(arr)
    ? arr.filter((k): k is string => typeof k === "string" && k.length > 0)
    : []
}

function sortUniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

const emptyCatalog = (): QuestionComponentCatalog => ({
  stimulus_component_kinds: [],
  response_component_kinds: [],
})

/**
 * Parse GET /questions/component-catalog body.
 * Canonical shape: `data.stimulus_component_kinds` + `data.response_component_kinds`.
 */
export function parseComponentCatalog(payload: unknown): QuestionComponentCatalog {
  if (!payload || typeof payload !== "object") return emptyCatalog()
  const d = payload as Record<string, unknown>

  if (
    Array.isArray(d.stimulus_component_kinds) ||
    Array.isArray(d.response_component_kinds)
  ) {
    return {
      stimulus_component_kinds: sortUniqueStrings(fromStringArray(d.stimulus_component_kinds)),
      response_component_kinds: sortUniqueStrings(fromStringArray(d.response_component_kinds)),
    }
  }

  if (d.data !== undefined && d.data !== null && typeof d.data === "object") {
    const inner = parseComponentCatalog(d.data)
    if (
      inner.stimulus_component_kinds.length > 0 ||
      inner.response_component_kinds.length > 0
    ) {
      return inner
    }
  }

  const sk = fromStringArray(d.stimulus_kinds)
  const rk = fromStringArray(d.response_kinds)
  if (sk.length || rk.length) {
    return {
      stimulus_component_kinds: sortUniqueStrings(sk),
      response_component_kinds: sortUniqueStrings(rk),
    }
  }

  const mergedFlat = sortUniqueStrings([
    ...fromStringArray(d.kinds),
    ...fromStringArray(d.codes),
    ...fromStringArray(d.component_kinds),
  ])
  if (mergedFlat.length) {
    return {
      stimulus_component_kinds: mergedFlat,
      response_component_kinds: [...mergedFlat],
    }
  }

  if (Array.isArray(payload)) {
    const merged = sortUniqueStrings(fromStringArray(payload))
    return {
      stimulus_component_kinds: merged,
      response_component_kinds: [...merged],
    }
  }

  return emptyCatalog()
}

export async function getQuestionComponentCatalog(): Promise<QuestionComponentCatalog> {
  const res = await http.get<ApiEnvelope<unknown>>("/questions/component-catalog")
  const raw = unwrapApiPayload(res) ?? res.data
  return parseComponentCatalog(raw)
}

function parseInnerValidFlag(inner: unknown): boolean | undefined {
  if (inner == null || typeof inner !== "object") return undefined
  const o = inner as Record<string, unknown>
  const v = o.valid ?? o.Valid
  if (typeof v === "boolean") return v
  if (v === "true" || v === 1) return true
  if (v === "false" || v === 0) return false
  return undefined
}

/**
 * POST /questions/validate-question-type-definition
 * Success: 200 with `data.valid` (envelope `success` may still be false).
 * Invalid: 400 with `message` / `error` on the JSON body (axios throws).
 */
export async function validateQuestionTypeDefinition(
  body: QuestionTypeDefinitionValidatePayload,
): Promise<ValidateQuestionTypeDefinitionResult> {
  try {
    const res = await http.post<ApiEnvelope<unknown>>("/questions/validate-question-type-definition", body)
    const envelope = res.data as ApiEnvelope<unknown>
    const inner = unwrapApiPayload(res)
    const validFlag = parseInnerValidFlag(inner)
    if (validFlag === true) {
      return { valid: true, message: envelope?.message }
    }
    const envErr =
      typeof envelope?.error === "string"
        ? envelope.error
        : envelope && typeof envelope === "object" && "Error" in envelope
          ? String((envelope as { Error?: unknown }).Error)
          : undefined
    return {
      valid: false,
      message: envelope?.message,
      error:
        envErr ||
        (validFlag === false ? "Definition is not valid." : "Validation response did not include a valid flag."),
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string; error?: string } } }
    const d = err.response?.data
    return {
      valid: false,
      message: d?.message,
      error: d?.error || d?.message || "Validation request failed",
    }
  }
}

export async function createQuestionTypeDefinition(body: QuestionTypeDefinitionCreatePayload) {
  return http.post<ApiEnvelope<unknown>>("/questions/type-definitions", body)
}

function asStr(v: unknown): string {
  if (v == null || v === undefined) return ""
  return String(v)
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string" && x.length > 0)
}

function normalizeSchemaRows(v: unknown): DynamicElementDefinition[] {
  if (!Array.isArray(v)) return []
  return v.map((row) => {
    if (!row || typeof row !== "object") {
      return { id: "", kind: "", required: false, label: undefined, config: undefined }
    }
    const r = row as Record<string, unknown>
    const id = asStr(r.id ?? r.Id)
    const kind = asStr(r.kind ?? r.Kind)
    const labelRaw = r.label ?? r.Label
    const config = (r.config ?? r.Config) as Record<string, unknown> | undefined
    return {
      id,
      kind,
      label: labelRaw != null && labelRaw !== "" ? asStr(labelRaw) : undefined,
      required: Boolean(r.required ?? r.Required),
      config: config && typeof config === "object" && !Array.isArray(config) ? config : undefined,
    }
  })
}

/**
 * Maps GET/POST definition objects from PascalCase (ID, Key, StimulusSchema, …)
 * or snake_case into {@link QuestionTypeDefinition}.
 */
export function normalizeTypeDefinitionFromApi(raw: unknown): QuestionTypeDefinition | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = Number(o.ID ?? o.id)
  if (!Number.isFinite(id)) return null
  const statusRaw = asStr(o.Status ?? o.status).toUpperCase()
  const status = statusRaw === "INACTIVE" ? "INACTIVE" : "ACTIVE"
  return {
    id,
    key: asStr(o.Key ?? o.key),
    display_name: asStr(
      o.DisplayName ?? o.display_name ?? o.displayName ?? o.Display_Name,
    ),
    description: (() => {
      const d = o.Description ?? o.description
      if (d == null) return null
      const s = asStr(d)
      return s === "" ? null : s
    })(),
    stimulus_component_kinds: asStringArray(o.StimulusComponentKinds ?? o.stimulus_component_kinds),
    response_component_kinds: asStringArray(o.ResponseComponentKinds ?? o.response_component_kinds),
    stimulus_schema: normalizeSchemaRows(o.StimulusSchema ?? o.stimulus_schema),
    response_schema: normalizeSchemaRows(o.ResponseSchema ?? o.response_schema),
    status,
    is_system: Boolean(o.IsSystem ?? o.is_system),
    created_at: o.CreatedAt != null ? asStr(o.CreatedAt) : o.created_at != null ? asStr(o.created_at) : undefined,
    updated_at: o.UpdatedAt != null ? asStr(o.UpdatedAt) : o.updated_at != null ? asStr(o.updated_at) : undefined,
  }
}

/** Label for selects: API `DisplayName` (stored as `display_name`), then key, then id. */
export function questionTypeDefinitionListLabel(def: QuestionTypeDefinition): string {
  const name = def.display_name?.trim()
  if (name) return name
  const k = def.key?.trim()
  if (k) return k
  return `Type #${def.id}`
}

/**
 * Definition id from POST create or PUT update (`data.ID`, `data.id`, or PascalCase `Id`).
 * Example update: `{ "data": { "id": 6 } }`.
 */
export function extractDefinitionMutationId(res: { data?: unknown }): number | undefined {
  const data = unwrapApiPayload(res)
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined
  const o = data as Record<string, unknown>
  const id = Number(o.ID ?? o.id ?? o.Id)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

/** @deprecated use extractDefinitionMutationId */
export const extractCreatedDefinitionId = extractDefinitionMutationId

export function parseDefinitionsList(payload: unknown): QuestionTypeDefinition[] {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeTypeDefinitionFromApi(item))
      .filter((x): x is QuestionTypeDefinition => x != null)
  }
  if (typeof payload === "object" && payload !== null) {
    const o = payload as Record<string, unknown>
    const inner = o.definitions ?? o.items ?? o.rows ?? o.Definitions
    if (Array.isArray(inner)) return parseDefinitionsList(inner)
    if (inner && typeof inner === "object") return parseDefinitionsList(inner)
    const data = o.data ?? o.Data
    if (Array.isArray(data)) return parseDefinitionsList(data)
    if (data && typeof data === "object") {
      const single = normalizeTypeDefinitionFromApi(data)
      return single ? [single] : []
    }
    const single = normalizeTypeDefinitionFromApi(payload)
    return single ? [single] : []
  }
  return []
}

export async function getQuestionTypeDefinitions(params?: {
  include_system?: boolean
  status?: string
  limit?: number
  offset?: number
}) {
  const res = await http.get<ApiEnvelope<unknown>>("/questions/type-definitions", { params })
  const raw = unwrapApiPayload(res) ?? res.data
  return parseDefinitionsList(raw)
}

/**
 * GET /questions/type-definitions/:id
 *
 * Typical success body (axios `res.data`): envelope with nested `data` or `Data` holding the definition.
 * Definition fields are often PascalCase (`ID`, `Key`, `DisplayName`, `StimulusComponentKinds`, `StimulusSchema`,
 * `ResponseSchema`, `IsSystem`, `Status`, `CreatedAt`, `UpdatedAt`). Envelope `success` may be false; parsing
 * does not rely on it.
 */
export async function getQuestionTypeDefinitionById(id: number): Promise<QuestionTypeDefinition | undefined> {
  const res = await http.get<ApiEnvelope<unknown>>(`/questions/type-definitions/${id}`)
  const fromEnvelope = unwrapApiPayload(res)
  return (
    normalizeTypeDefinitionFromApi(fromEnvelope) ?? normalizeTypeDefinitionFromApi(res.data) ?? undefined
  )
}

export async function updateQuestionTypeDefinition(
  id: number,
  body: QuestionTypeDefinitionUpdatePayload,
) {
  return http.put<ApiEnvelope<unknown>>(`/questions/type-definitions/${id}`, body)
}

export async function deleteQuestionTypeDefinition(id: number) {
  return http.delete<ApiEnvelope<unknown>>(`/questions/type-definitions/${id}`)
}
