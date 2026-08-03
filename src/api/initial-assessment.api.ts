import http from "./http"
import {
  addQuestionToSet,
  createQuestion,
  createQuestionSet,
  getQuestionById,
  getQuestionSetById,
  getQuestionSetQuestions,
  getQuestionSets,
  removeQuestionFromSet,
  updateQuestionSet,
} from "./courses.api"
import { unwrapApiPayload } from "./questionTypeDefinitions.api"
import { normalizeMultipleChoiceValue } from "../lib/multipleChoiceSlotValue"
import type {
  CreateQuestionRequest,
  CreateQuestionSetRequest,
  QuestionOption,
  QuestionSetDetail,
} from "../types/course.types"
import type { DynamicQuestionPayload } from "../types/questionTypeDefinition.types"

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"

export interface InitialAssessmentLevelThreshold {
  level: CefrLevel | string
  min_percent: number
  display_order: number
}

export interface PlacementQuestionRow {
  setItemId: number
  questionId: number
  displayOrder: number
  questionText: string
  questionType: string
  difficultyLevel: string
  points: number
  status: string
}

/** Normalized question fields for placement create/edit UI (legacy + dynamic_payload). */
export interface PlacementQuestionDetail {
  id: number
  question_text: string
  question_type: string
  difficulty_level: string
  points: number
  status: string
  tips: string
  explanation: string
  options: QuestionOption[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function elementStringValue(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (isRecord(value)) {
    for (const key of ["text", "content", "value", "label"]) {
      const nested = value[key]
      if (typeof nested === "string" && nested.trim()) return nested.trim()
    }
  }
  return ""
}

function asDynamicPayload(raw: unknown): DynamicQuestionPayload | null {
  if (!isRecord(raw)) return null
  const stimulus = Array.isArray(raw.stimulus) ? raw.stimulus : []
  const response = Array.isArray(raw.response) ? raw.response : []
  if (stimulus.length === 0 && response.length === 0) return null
  return {
    stimulus: stimulus.filter(isRecord).map((el) => ({
      id: String(el.id ?? ""),
      kind: String(el.kind ?? ""),
      value: el.value,
      meta: isRecord(el.meta) ? el.meta : undefined,
    })),
    response: response.filter(isRecord).map((el) => ({
      id: String(el.id ?? ""),
      kind: String(el.kind ?? ""),
      value: el.value,
      meta: isRecord(el.meta) ? el.meta : undefined,
    })),
  }
}

function stimulusTextFromPayload(payload: DynamicQuestionPayload | null): string {
  if (!payload) return ""
  const preferred = ["QUESTION_TEXT", "INSTRUCTION", "TEXT_PASSAGE", "TEXT"]
  for (const want of preferred) {
    for (const el of payload.stimulus) {
      if (String(el.kind).toUpperCase() !== want) continue
      const text = elementStringValue(el.value)
      if (text) return text
    }
  }
  return ""
}

function optionsFromPayload(payload: DynamicQuestionPayload | null): QuestionOption[] {
  if (!payload) return []
  for (const el of payload.response) {
    const kind = String(el.kind ?? "").toUpperCase()
    if (kind !== "MULTIPLE_CHOICE" && kind !== "OPTION") continue
    const normalized = normalizeMultipleChoiceValue(el.value)
    return normalized.options
      .filter((o) => o.text.trim())
      .map((o, index) => ({
        option_order: index + 1,
        option_text: o.text,
        is_correct: o.is_correct,
      }))
  }
  return []
}

function optionsFromRaw(raw: unknown): QuestionOption[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(isRecord)
    .map((o, index) => ({
      option_order: Number(o.option_order ?? index + 1),
      option_text: String(o.option_text ?? o.text ?? ""),
      is_correct: Boolean(o.is_correct ?? o.isCorrect),
    }))
    .filter((o) => o.option_text.trim())
    .sort((a, b) => a.option_order - b.option_order)
}

export function normalizePlacementQuestionDetail(raw: unknown): PlacementQuestionDetail | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id ?? raw.question_id)
  if (!Number.isFinite(id) || id <= 0) return null

  const payload =
    asDynamicPayload(raw.effective_dynamic_payload) ??
    asDynamicPayload(raw.dynamic_payload)

  const flatText = String(raw.question_text ?? "").trim()
  const questionText = flatText || stimulusTextFromPayload(payload)

  const flatOptions = optionsFromRaw(raw.options)
  const options = flatOptions.length > 0 ? flatOptions : optionsFromPayload(payload)

  return {
    id,
    question_text: questionText,
    question_type: String(raw.question_type ?? "").trim() || "unassigned",
    difficulty_level: String(raw.difficulty_level ?? "").trim() || "unassigned",
    points: Number(raw.points ?? 1) || 1,
    status: String(raw.question_status ?? raw.status ?? "").trim() || "unassigned",
    tips: String(raw.tips ?? ""),
    explanation: String(raw.explanation ?? ""),
    options,
  }
}

function unwrapListPayload(body: unknown): unknown[] {
  const payload = isRecord(body) && "data" in body ? body.data : body
  if (Array.isArray(payload)) return payload
  if (isRecord(payload) && Array.isArray(payload.questions)) return payload.questions
  return []
}

function normalizeThreshold(raw: unknown): InitialAssessmentLevelThreshold | null {
  if (!isRecord(raw)) return null
  const level = String(raw.level ?? "").toUpperCase()
  const min = Number(raw.min_percent ?? raw.minPercent)
  const order = Number(raw.display_order ?? raw.displayOrder ?? 0)
  if (!level || !Number.isFinite(min)) return null
  return {
    level,
    min_percent: min,
    display_order: Number.isFinite(order) ? order : 0,
  }
}

export function parseLevelThresholds(body: unknown): InitialAssessmentLevelThreshold[] {
  const payload = isRecord(body) && "data" in body ? body.data : body
  if (!Array.isArray(payload)) return []
  return payload
    .map(normalizeThreshold)
    .filter((row): row is InitialAssessmentLevelThreshold => row !== null)
    .sort((a, b) => a.display_order - b.display_order || a.level.localeCompare(b.level))
}

export async function getInitialAssessmentLevelThresholds(): Promise<InitialAssessmentLevelThreshold[]> {
  const res = await http.get("/admin/assessment/level-thresholds")
  return parseLevelThresholds(res.data)
}

export async function updateInitialAssessmentLevelThresholds(
  thresholds: InitialAssessmentLevelThreshold[],
): Promise<InitialAssessmentLevelThreshold[]> {
  const res = await http.put("/admin/assessment/level-thresholds", { thresholds })
  return parseLevelThresholds(res.data)
}

function unwrapQuestionSets(body: unknown): Array<Record<string, unknown>> {
  if (!isRecord(body)) return []
  const data = body.data
  if (Array.isArray(data)) return data.filter(isRecord)
  if (isRecord(data) && Array.isArray(data.question_sets)) {
    return data.question_sets.filter(isRecord)
  }
  return []
}

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

function isCefrLevel(value: string): value is CefrLevel {
  return (CEFR_LEVELS as string[]).includes(value)
}

function setLevel(set: Record<string, unknown>): CefrLevel | null {
  const level = String(set.description ?? "").trim().toUpperCase()
  return isCefrLevel(level) ? level : null
}

function pickSetForLevel(
  sets: Array<Record<string, unknown>>,
  level: CefrLevel,
): Record<string, unknown> | null {
  const matching = sets.filter((set) => setLevel(set) === level)
  if (matching.length === 0) return null

  const publishedStandalone = matching.find((set) => {
    const status = String(set.status ?? "").toUpperCase()
    const owner = String(set.owner_type ?? "STANDALONE").toUpperCase()
    return status === "PUBLISHED" && (owner === "STANDALONE" || owner === "")
  })
  if (publishedStandalone) return publishedStandalone

  const anyStandalone = matching.find((set) => {
    const owner = String(set.owner_type ?? "STANDALONE").toUpperCase()
    return owner === "STANDALONE" || owner === ""
  })
  if (anyStandalone) return anyStandalone

  const published = matching.find((set) => String(set.status ?? "").toUpperCase() === "PUBLISHED")
  return published ?? matching[0] ?? null
}

export async function findPlacementAssessmentSet(level: CefrLevel): Promise<QuestionSetDetail | null> {
  const res = await getQuestionSets({
    set_type: "INITIAL_ASSESSMENT",
    limit: 100,
    offset: 0,
  })
  const sets = unwrapQuestionSets(res.data)
  const picked = pickSetForLevel(sets, level)
  if (!picked) return null
  const id = Number(picked.id)
  if (!Number.isFinite(id)) return null
  const detailRes = await getQuestionSetById(id)
  return detailRes.data?.data ?? null
}

export async function createPlacementAssessmentSet(input?: {
  title?: string
  level: CefrLevel
}): Promise<QuestionSetDetail> {
  const level = input?.level
  if (!level) {
    throw new Error("Placement set level is required")
  }
  const payload: CreateQuestionSetRequest = {
    title: input?.title?.trim() || `Initial Placement Assessment — ${level}`,
    description: level,
    set_type: "INITIAL_ASSESSMENT",
    owner_type: "STANDALONE",
    owner_id: null,
    shuffle_questions: false,
    status: "DRAFT",
  }
  const res = await createQuestionSet(payload)
  const created = res.data?.data
  const id = Number(created?.id)
  if (!Number.isFinite(id)) {
    throw new Error("Placement set created but no id returned")
  }
  const detailRes = await getQuestionSetById(id)
  if (!detailRes.data?.data) {
    throw new Error("Failed to load created placement set")
  }
  return detailRes.data.data
}

export async function ensurePlacementAssessmentSet(level: CefrLevel): Promise<QuestionSetDetail> {
  const existing = await findPlacementAssessmentSet(level)
  if (existing) return existing
  return createPlacementAssessmentSet({ level })
}

export async function savePlacementAssessmentSet(
  setId: number,
  patch: Partial<CreateQuestionSetRequest>,
): Promise<QuestionSetDetail> {
  await updateQuestionSet(setId, patch)
  const detailRes = await getQuestionSetById(setId)
  if (!detailRes.data?.data) {
    throw new Error("Failed to reload placement set")
  }
  return detailRes.data.data
}

export async function listPlacementQuestions(setId: number): Promise<PlacementQuestionRow[]> {
  const res = await getQuestionSetQuestions(setId)
  const rows = unwrapListPayload(res.data)

  return rows.map((raw, index) => {
    const detail = normalizePlacementQuestionDetail(raw)
    const record = isRecord(raw) ? raw : {}
    const questionId = detail?.id ?? Number(record.question_id ?? record.id) ?? index
    return {
      setItemId: Number(record.id) || index,
      questionId,
      displayOrder: Number(record.display_order ?? index + 1),
      questionText: detail?.question_text.trim() || `(Question #${questionId})`,
      questionType: detail?.question_type || "unassigned",
      difficultyLevel: detail?.difficulty_level || "unassigned",
      points: detail?.points ?? 1,
      status: detail?.status || "unassigned",
    }
  })
}

export async function getPlacementQuestionDetail(questionId: number): Promise<PlacementQuestionDetail> {
  const res = await getQuestionById(questionId)
  const raw = unwrapApiPayload(res) ?? res.data?.data ?? res.data
  const detail = normalizePlacementQuestionDetail(raw)
  if (!detail) {
    throw new Error("Question not found")
  }
  return detail
}

export async function createAndAttachPlacementQuestion(
  setId: number,
  payload: CreateQuestionRequest,
): Promise<number> {
  const createRes = await createQuestion(payload)
  const questionId = Number(createRes.data?.data?.id)
  if (!Number.isFinite(questionId)) {
    throw new Error("Question created but no id returned")
  }
  await addQuestionToSet(setId, { question_id: questionId })
  return questionId
}

export async function detachPlacementQuestion(setId: number, questionId: number): Promise<void> {
  await removeQuestionFromSet(setId, questionId)
}
