import http from "./http"
import type {
  DynamicElementDefinition,
  QuestionComponentCatalog,
  QuestionTypeDefinition,
  QuestionTypeDefinitionCreatePayload,
  QuestionTypeDefinitionPractice,
  QuestionTypeDefinitionPracticesParams,
  QuestionTypeDefinitionPracticesResult,
  QuestionTypeDefinitionUpdatePayload,
  QuestionTypeDefinitionValidatePayload,
  ValidateQuestionTypeDefinitionResult,
} from "../types/questionTypeDefinition.types"
import { normalizeGroupIds } from "../lib/questionTypeGroupIds"
import {
  dedupeParents,
  normalizePracticeParent,
  normalizePracticeParents,
  parentsFromPractice,
} from "../lib/practiceParents"
import type { PracticeParent } from "../types/course.types"

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
    group_ids: normalizeGroupIds(
      o.group_ids ?? o.GroupIds ?? o.group_id ?? o.GroupId ?? o.groupId,
    ),
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

export interface QuestionTypeDefinitionsListParams {
  include_system?: boolean
  status?: string
  group_id?: number
  limit?: number
  offset?: number
}

export interface QuestionTypeDefinitionsListResult {
  definitions: QuestionTypeDefinition[]
  total_count?: number
}

/** Page size when auto-fetching every definition (dropdowns, editors). */
const DEFINITIONS_FETCH_ALL_PAGE_SIZE = 100

function parseListTotalCount(body: unknown): number | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined
  const o = body as Record<string, unknown>

  const direct = Number(o.total_count ?? o.TotalCount ?? o.totalCount)
  if (Number.isFinite(direct) && direct >= 0) return direct

  const meta = o.metadata ?? o.Metadata
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const m = meta as Record<string, unknown>
    const fromMeta = Number(m.total_count ?? m.TotalCount ?? m.totalCount)
    if (Number.isFinite(fromMeta) && fromMeta >= 0) return fromMeta
  }

  const data = o.data ?? o.Data
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return parseListTotalCount(data)
  }

  return undefined
}

export function parseDefinitionsList(payload: unknown): QuestionTypeDefinition[] {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeTypeDefinitionFromApi(item))
      .filter((x): x is QuestionTypeDefinition => x != null)
  }
  if (typeof payload === "object" && payload !== null) {
    const o = payload as Record<string, unknown>
    const inner =
      o.question_type_definitions ??
      o.QuestionTypeDefinitions ??
      o.definitions ??
      o.items ??
      o.rows ??
      o.Definitions
    if (Array.isArray(inner)) return parseDefinitionsList(inner)
    if (inner && typeof inner === "object" && !Array.isArray(inner)) return parseDefinitionsList(inner)
    const data = o.data ?? o.Data
    if (Array.isArray(data)) return parseDefinitionsList(data)
    if (data && typeof data === "object") return parseDefinitionsList(data)
    const single = normalizeTypeDefinitionFromApi(payload)
    return single ? [single] : []
  }
  return []
}

async function fetchQuestionTypeDefinitionsPage(
  params?: QuestionTypeDefinitionsListParams,
): Promise<QuestionTypeDefinitionsListResult> {
  const res = await http.get<ApiEnvelope<unknown>>("/questions/type-definitions", { params })
  const raw = unwrapApiPayload(res) ?? res.data
  const definitions = parseDefinitionsList(raw)
  const total_count = parseListTotalCount(raw) ?? parseListTotalCount(res.data)
  return total_count != null ? { definitions, total_count } : { definitions }
}

/**
 * Lists question type definitions. When `limit` / `offset` are omitted, fetches every page
 * so dropdowns receive the full catalog (the API defaults to a capped page size).
 */
export async function getQuestionTypeDefinitions(
  params?: QuestionTypeDefinitionsListParams,
): Promise<QuestionTypeDefinitionsListResult> {
  const hasExplicitPagination = params?.limit !== undefined || params?.offset !== undefined
  if (hasExplicitPagination) {
    return fetchQuestionTypeDefinitionsPage(params)
  }

  const allDefinitions: QuestionTypeDefinition[] = []
  const seenIds = new Set<number>()
  let offset = 0
  let total_count: number | undefined

  while (true) {
    const page = await fetchQuestionTypeDefinitionsPage({
      ...params,
      limit: DEFINITIONS_FETCH_ALL_PAGE_SIZE,
      offset,
    })

    if (total_count === undefined && page.total_count != null) {
      total_count = page.total_count
    }

    for (const def of page.definitions) {
      if (seenIds.has(def.id)) continue
      seenIds.add(def.id)
      allDefinitions.push(def)
    }

    if (page.definitions.length === 0) break
    if (total_count != null && allDefinitions.length >= total_count) break
    if (page.definitions.length < DEFINITIONS_FETCH_ALL_PAGE_SIZE) break

    offset += page.definitions.length
  }

  return {
    definitions: allDefinitions,
    total_count: total_count ?? allDefinitions.length,
  }
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

/** Assign or replace group memberships (`null` or `[]` clears all). */
export async function assignQuestionTypeDefinitionGroups(
  definitionId: number,
  groupIds: number[] | null,
) {
  return updateQuestionTypeDefinition(definitionId, {
    group_ids: normalizeGroupIds(groupIds),
  })
}

/** @deprecated Use assignQuestionTypeDefinitionGroups */
export async function assignQuestionTypeDefinitionGroup(
  definitionId: number,
  groupId: number | null,
) {
  return assignQuestionTypeDefinitionGroups(definitionId, groupId == null ? null : [groupId])
}

export async function deleteQuestionTypeDefinition(id: number) {
  return http.delete<ApiEnvelope<unknown>>(`/questions/type-definitions/${id}`)
}

function normalizeParentsArray(raw: unknown): PracticeParent[] {
  if (!Array.isArray(raw)) return []
  return dedupeParents(
    raw
      .map((entry) => normalizePracticeParent(entry))
      .filter((entry): entry is PracticeParent => entry != null),
  )
}

function normalizePracticeFromApi(row: unknown): QuestionTypeDefinitionPractice | null {
  if (!row || typeof row !== "object") return null
  const o = row as Record<string, unknown>
  const practice_id = Number(o.practice_id ?? o.PracticeId ?? o.practiceId ?? o.id ?? o.ID)
  const question_set_id = Number(o.question_set_id ?? o.QuestionSetId ?? o.questionSetId)
  if (!Number.isFinite(practice_id) || practice_id <= 0) return null
  if (!Number.isFinite(question_set_id) || question_set_id <= 0) return null

  const matching_question_count = Number(
    o.matching_question_count ?? o.MatchingQuestionCount ?? o.matchingQuestionCount ?? 0,
  )
  const parentObj =
    o.parent != null && typeof o.parent === "object" && !Array.isArray(o.parent)
      ? (o.parent as Record<string, unknown>)
      : o.Parent != null && typeof o.Parent === "object" && !Array.isArray(o.Parent)
        ? (o.Parent as Record<string, unknown>)
        : null

  const parent_idRaw =
    o.parent_id ??
    o.ParentId ??
    o.parentId ??
    parentObj?.id ??
    parentObj?.Id ??
    parentObj?.ID
  const parent_id =
    parent_idRaw != null && Number.isFinite(Number(parent_idRaw)) ? Number(parent_idRaw) : undefined

  const parent_kind =
    asStr(o.parent_kind ?? o.ParentKind ?? o.parentKind) ||
    (parentObj ? asStr(parentObj.kind ?? parentObj.Kind) : "") ||
    undefined

  const program_id = Number(o.program_id ?? o.ProgramId ?? o.programId)
  const course_id = Number(o.course_id ?? o.CourseId ?? o.courseId)
  const module_id = Number(o.module_id ?? o.ModuleId ?? o.moduleId)
  const lesson_id = Number(o.lesson_id ?? o.LessonId ?? o.lessonId)
  const practiceKindRaw = asStr(o.practice_kind ?? o.PracticeKind ?? o.practiceKind ?? "LMS")
  const isExamPrep = practiceKindRaw.toUpperCase() === "EXAM_PREP"

  const examPrepParentsRaw = o.exam_prep_parents ?? o.ExamPrepParents ?? o.examPrepParents
  const examPrepParentsList = normalizeParentsArray(examPrepParentsRaw)
  const exam_prep_parents = examPrepParentsList.length > 0 ? examPrepParentsList : null

  const exam_prep_lesson_id_raw = Number(
    o.exam_prep_lesson_id ?? o.ExamPrepLessonId ?? o.examPrepLessonId,
  )
  const exam_prep_lesson_id =
    Number.isFinite(exam_prep_lesson_id_raw) && exam_prep_lesson_id_raw > 0
      ? exam_prep_lesson_id_raw
      : undefined

  const lmsParentsList = isExamPrep
    ? []
    : parentsFromPractice({
        parents: normalizePracticeParents(row),
        parent_kind,
        parent_id,
      })
  const parents = isExamPrep ? null : lmsParentsList.length > 0 ? lmsParentsList : null

  const persona_id_raw = Number(o.persona_id ?? o.PersonaId ?? o.personaId)
  const persona_id =
    Number.isFinite(persona_id_raw) && persona_id_raw > 0 ? persona_id_raw : undefined

  return {
    practice_kind: isExamPrep ? "EXAM_PREP" : "LMS",
    practice_id,
    question_set_id,
    title: asStr(o.title ?? o.Title) || `Practice #${practice_id}`,
    story_description:
      o.story_description != null
        ? asStr(o.story_description)
        : o.StoryDescription != null
          ? asStr(o.StoryDescription)
          : undefined,
    story_image:
      o.story_image != null
        ? asStr(o.story_image)
        : o.StoryImage != null
          ? asStr(o.StoryImage)
          : undefined,
    quick_tips:
      o.quick_tips != null
        ? asStr(o.quick_tips)
        : o.QuickTips != null
          ? asStr(o.QuickTips)
          : undefined,
    publish_status: asStr(o.publish_status ?? o.PublishStatus ?? o.publishStatus) || undefined,
    parents,
    exam_prep_parents,
    exam_prep_lesson_id,
    parent_kind: (isExamPrep ? exam_prep_parents?.[0] : parents?.[0])?.parent_kind,
    parent_id: (isExamPrep ? exam_prep_parents?.[0] : parents?.[0])?.parent_id,
    persona_id,
    program_id: Number.isFinite(program_id) && program_id > 0 ? program_id : undefined,
    course_id: Number.isFinite(course_id) && course_id > 0 ? course_id : undefined,
    module_id: Number.isFinite(module_id) && module_id > 0 ? module_id : undefined,
    lesson_id: Number.isFinite(lesson_id) && lesson_id > 0 ? lesson_id : undefined,
    matching_question_count: Number.isFinite(matching_question_count) ? matching_question_count : 0,
    created_at:
      o.created_at != null
        ? asStr(o.created_at)
        : o.CreatedAt != null
          ? asStr(o.CreatedAt)
          : undefined,
    updated_at:
      o.updated_at != null
        ? asStr(o.updated_at)
        : o.UpdatedAt != null
          ? asStr(o.UpdatedAt)
          : undefined,
  }
}

function parsePracticesList(payload: unknown): QuestionTypeDefinitionPractice[] {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizePracticeFromApi(item))
      .filter((x): x is QuestionTypeDefinitionPractice => x != null)
  }
  if (typeof payload === "object" && payload !== null) {
    const o = payload as Record<string, unknown>
    const inner = o.practices ?? o.Practices
    if (Array.isArray(inner)) return parsePracticesList(inner)
    const data = o.data ?? o.Data
    if (data && typeof data === "object") return parsePracticesList(data)
  }
  return []
}

function parsePracticesPage(
  payload: unknown,
  definitionId: number,
  params?: QuestionTypeDefinitionPracticesParams,
): QuestionTypeDefinitionPracticesResult {
  const practices = parsePracticesList(payload)
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      question_type_definition_id: definitionId,
      practices,
      total_count: practices.length,
      limit,
      offset,
    }
  }

  const o = payload as Record<string, unknown>
  const data =
    o.data != null && typeof o.data === "object" && !Array.isArray(o.data)
      ? (o.data as Record<string, unknown>)
      : o

  const question_type_definition_id = Number(
    data.question_type_definition_id ??
      data.QuestionTypeDefinitionId ??
      data.questionTypeDefinitionId ??
      definitionId,
  )
  const total_count = parseListTotalCount(data) ?? parseListTotalCount(payload) ?? practices.length
  const parsedLimit = Number(data.limit ?? data.Limit ?? limit)
  const parsedOffset = Number(data.offset ?? data.Offset ?? offset)

  return {
    question_type_definition_id:
      Number.isFinite(question_type_definition_id) && question_type_definition_id > 0
        ? question_type_definition_id
        : definitionId,
    practices,
    total_count,
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : limit,
    offset: Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : offset,
  }
}

/**
 * GET /questions/type-definitions/:id/practices
 * Lists LMS and exam-prep practices whose question set contains matching questions.
 */
export async function getQuestionTypeDefinitionPractices(
  definitionId: number,
  params?: QuestionTypeDefinitionPracticesParams,
): Promise<QuestionTypeDefinitionPracticesResult> {
  const res = await http.get<ApiEnvelope<unknown>>(`/questions/type-definitions/${definitionId}/practices`, {
    params,
  })
  const raw = unwrapApiPayload(res) ?? res.data
  return parsePracticesPage(raw, definitionId, params)
}
