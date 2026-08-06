import { getSearchTokens } from "../components/SearchHighlight"
import { questionTypeDefinitionListLabel } from "../api/questionTypeDefinitions.api"
import type { QuestionDetail } from "../types/course.types"
import type {
  DynamicElementInstance,
  DynamicQuestionPayload,
  QuestionTypeDefinition,
} from "../types/questionTypeDefinition.types"

const LEGACY_TYPE_LABELS: Record<string, string> = {
  MCQ: "Multiple choice",
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  SHORT: "Short answer",
  AUDIO: "Audio",
  DYNAMIC: "Interactive",
}

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  INACTIVE: "Inactive",
}

const PREFERRED_STIMULUS_KINDS = [
  "QUESTION_TEXT",
  "INSTRUCTION",
  "TEXT_PASSAGE",
  "TEXT",
] as const

function titleCaseWords(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

function pickStr(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return ""
}

function elementStringValue(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return ""
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return elementStringValue(JSON.parse(trimmed))
      } catch {
        return trimmed
      }
    }
    return trimmed
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = elementStringValue(item)
      if (nested) return nested
    }
    return ""
  }
  if (isRecord(value)) {
    for (const key of [
      "text",
      "content",
      "value",
      "label",
      "prompt",
      "instruction",
      "question_text",
      "questionText",
      "option_text",
      "optionText",
    ]) {
      const nested = elementStringValue(value[key])
      if (nested) return nested
    }
  }
  return ""
}

function collectStringsFromValue(value: unknown, into: string[]): void {
  if (typeof value === "string") {
    const text = elementStringValue(value)
    if (text && !/^https?:\/\//i.test(text) && text.length < 500) into.push(text)
    return
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    into.push(String(value))
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringsFromValue(item, into)
    return
  }
  if (isRecord(value)) {
    for (const nested of Object.values(value)) collectStringsFromValue(nested, into)
  }
}

function asDynamicPayload(raw: unknown): DynamicQuestionPayload | null {
  if (!isRecord(raw)) return null
  const stimulus = Array.isArray(raw.stimulus)
    ? raw.stimulus
    : Array.isArray(raw.Stimulus)
      ? raw.Stimulus
      : []
  const response = Array.isArray(raw.response)
    ? raw.response
    : Array.isArray(raw.Response)
      ? raw.Response
      : []
  if (stimulus.length === 0 && response.length === 0) return null
  return {
    stimulus: stimulus.filter(isRecord).map((el) => ({
      id: String(el.id ?? el.ID ?? ""),
      kind: String(el.kind ?? el.Kind ?? ""),
      value: el.value ?? el.Value,
      meta: isRecord(el.meta) ? el.meta : isRecord(el.Meta) ? el.Meta : undefined,
    })),
    response: response.filter(isRecord).map((el) => ({
      id: String(el.id ?? el.ID ?? ""),
      kind: String(el.kind ?? el.Kind ?? ""),
      value: el.value ?? el.Value,
      meta: isRecord(el.meta) ? el.meta : isRecord(el.Meta) ? el.Meta : undefined,
    })),
  }
}

function stimulusTextFromPayload(payload: DynamicQuestionPayload | null | undefined): string {
  if (!payload?.stimulus?.length) return ""
  for (const want of PREFERRED_STIMULUS_KINDS) {
    for (const el of payload.stimulus) {
      if (String(el.kind ?? "").toUpperCase() !== want) continue
      const text = elementStringValue(el.value)
      if (text) return text
    }
  }
  for (const el of payload.stimulus) {
    const text = elementStringValue(el.value)
    if (text) return text
  }
  return ""
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const text = String(raw ?? "").trim()
    if (!text) continue
    if (/^https?:\/\//i.test(text)) continue
    if (text.length > 400) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(text)
  }
  return out
}

/** Prefer human-readable phrases; drop option ids / bare numbers from list display. */
function isUsefulDisplaySnippet(text: string): boolean {
  const t = text.trim()
  if (t.length < 2) return false
  if (/^[a-z0-9]$/i.test(t)) return false
  if (/^\d{1,4}$/.test(t)) return false
  if (/^[a-z]$/i.test(t)) return false
  return true
}

function textsFromElements(elements: DynamicElementInstance[] | undefined): string[] {
  if (!elements?.length) return []
  const out: string[] = []
  for (const el of elements) {
    collectStringsFromValue(el.value, out)
  }
  return uniqueNonEmpty(out)
}

/** All readable strings from stimulus slots. */
export function questionBankStimulusTexts(
  question: QuestionDetail,
): string[] {
  return textsFromElements(question.dynamic_payload?.stimulus)
}

/** All readable strings from response slots (choices, matches, prompts, etc.). */
export function questionBankResponseTexts(
  question: QuestionDetail,
): string[] {
  const fromPayload = textsFromElements(question.dynamic_payload?.response)
  const fromOptions = (question.options ?? [])
    .map((o) => String(o.option_text ?? "").trim())
    .filter(Boolean)
  return uniqueNonEmpty([...fromPayload, ...fromOptions])
}

function payloadSearchStrings(payload: DynamicQuestionPayload | null | undefined): string[] {
  if (!payload) return []
  return uniqueNonEmpty([
    ...textsFromElements(payload.stimulus),
    ...textsFromElements(payload.response),
  ])
}

function joinPreviewParts(parts: string[], max = 3): string {
  return parts.slice(0, max).join(" · ")
}

/** Normalize a list/detail API row into a consistent QuestionDetail for bank UI. */
export function normalizeQuestionBankItem(raw: unknown): QuestionDetail | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id ?? raw.ID ?? raw.question_id ?? raw.QuestionID)
  if (!Number.isFinite(id) || id <= 0) return null

  const payload =
    asDynamicPayload(raw.effective_dynamic_payload) ??
    asDynamicPayload(raw.EffectiveDynamicPayload) ??
    asDynamicPayload(raw.dynamic_payload) ??
    asDynamicPayload(raw.DynamicPayload)

  const previewText = pickStr(raw, "preview_text", "PreviewText", "previewText")
  const stimulusTexts = textsFromElements(payload?.stimulus)
  const responseTexts = textsFromElements(payload?.response)
  const questionText =
    pickStr(raw, "question_text", "QuestionText", "questionText") ||
    previewText ||
    stimulusTextFromPayload(payload) ||
    stimulusTexts[0] ||
    responseTexts[0] ||
    ""

  const optionsRaw = raw.options ?? raw.Options
  const options = Array.isArray(optionsRaw)
    ? optionsRaw
        .filter(isRecord)
        .map((o, index) => ({
          option_order: Number(o.option_order ?? o.OptionOrder ?? index + 1),
          option_text: pickStr(o, "option_text", "OptionText", "text", "label"),
          is_correct: Boolean(o.is_correct ?? o.IsCorrect),
        }))
        .filter((o) => o.option_text)
    : undefined

  const defId = Number(
    raw.question_type_definition_id ??
      raw.QuestionTypeDefinitionID ??
      raw.questionTypeDefinitionId,
  )

  const resolvedPreview =
    previewText ||
    questionText ||
    joinPreviewParts(stimulusTexts) ||
    joinPreviewParts(responseTexts) ||
    undefined

  return {
    id,
    question_text: questionText,
    preview_text: resolvedPreview,
    question_type: pickStr(raw, "question_type", "QuestionType", "questionType") || "DYNAMIC",
    difficulty_level:
      pickStr(raw, "difficulty_level", "DifficultyLevel", "difficultyLevel") || null,
    points: Number(raw.points ?? raw.Points ?? 1) || 1,
    status:
      pickStr(raw, "status", "Status", "question_status", "QuestionStatus") || undefined,
    tips: pickStr(raw, "tips", "Tips") || null,
    explanation: pickStr(raw, "explanation", "Explanation") || null,
    options,
    question_type_definition_id:
      Number.isFinite(defId) && defId > 0 ? defId : null,
    dynamic_payload: payload,
  }
}

export function formatQuestionBankTypeLabel(
  question: QuestionDetail,
  definitions: QuestionTypeDefinition[] = [],
): string {
  const defId = question.question_type_definition_id
  if (defId != null && Number(defId) > 0) {
    const def = definitions.find((d) => d.id === Number(defId))
    if (def) return questionTypeDefinitionListLabel(def)
  }
  const raw = String(question.question_type ?? "").trim().toUpperCase()
  if (!raw) return "Question"
  return LEGACY_TYPE_LABELS[raw] ?? titleCaseWords(raw)
}

export function formatQuestionBankDifficultyLabel(
  difficulty: string | null | undefined,
): string {
  const raw = String(difficulty ?? "").trim().toUpperCase()
  if (!raw) return ""
  return DIFFICULTY_LABELS[raw] ?? titleCaseWords(raw)
}

export function formatQuestionBankStatusLabel(
  status: string | null | undefined,
): string {
  const raw = String(status ?? "").trim().toUpperCase()
  if (!raw) return ""
  return STATUS_LABELS[raw] ?? titleCaseWords(raw)
}

/** Learner-facing prompt text for list rows (stimulus first, then response). */
export function questionBankPreviewText(question: QuestionDetail): string {
  const preview = String(question.preview_text ?? "").trim()
  if (preview) return preview
  const flat = String(question.question_text ?? "").trim()
  if (flat) return flat
  const stimulus = questionBankStimulusTexts(question)
  if (stimulus.length > 0) return joinPreviewParts(stimulus)
  const response = questionBankResponseTexts(question)
  if (response.length > 0) return joinPreviewParts(response)
  const tip = String(question.tips ?? "").trim()
  if (tip) return tip
  return "Untitled question"
}

/** Response-side wording shown under the main preview (choices, match items, etc.). */
export function questionBankResponsePreviewText(question: QuestionDetail): string {
  const stimulus = new Set(
    questionBankStimulusTexts(question).map((t) => t.toLowerCase()),
  )
  const primary = questionBankPreviewText(question).toLowerCase()
  const response = questionBankResponseTexts(question).filter((text) => {
    const key = text.toLowerCase()
    if (key === primary || stimulus.has(key)) return false
    return isUsefulDisplaySnippet(text)
  })
  if (response.length === 0) return ""
  return joinPreviewParts(response, 4)
}

export interface QuestionBankListLabels {
  /** Primary list line — mainly stimulus / prompt text. */
  preview: string
  /** Secondary list line — response content (options, matches, etc.). */
  responsePreview: string
  typeLabel: string
  difficultyLabel: string
  statusLabel: string
}

export function getQuestionBankListLabels(
  question: QuestionDetail,
  definitions: QuestionTypeDefinition[] = [],
): QuestionBankListLabels {
  return {
    preview: questionBankPreviewText(question),
    responsePreview: questionBankResponsePreviewText(question),
    typeLabel: formatQuestionBankTypeLabel(question, definitions),
    difficultyLabel: formatQuestionBankDifficultyLabel(question.difficulty_level),
    statusLabel: formatQuestionBankStatusLabel(question.status),
  }
}

/** Keywords used for search (stimulus + response + friendly labels). */
export function questionBankSearchKeywords(
  question: QuestionDetail,
  labels: QuestionBankListLabels,
): string[] {
  const rawType = String(question.question_type ?? "").trim()
  const rawDifficulty = String(question.difficulty_level ?? "").trim()
  const rawStatus = String(question.status ?? "").trim()
  return uniqueNonEmpty([
    labels.preview,
    labels.responsePreview,
    labels.typeLabel,
    labels.difficultyLabel,
    labels.statusLabel,
    rawType,
    rawDifficulty,
    rawStatus,
    String(question.tips ?? "").trim(),
    String(question.explanation ?? "").trim(),
    ...questionBankStimulusTexts(question),
    ...questionBankResponseTexts(question),
    ...payloadSearchStrings(question.dynamic_payload),
  ])
}

export function matchesQuestionBankSearch(
  question: QuestionDetail,
  query: string,
  definitions: QuestionTypeDefinition[] = [],
): boolean {
  const tokens = getSearchTokens(query)
  if (tokens.length === 0) return true
  const haystack = buildQuestionBankSearchHaystack(question, definitions)
  return tokens.every((token) => haystack.includes(token.toLowerCase()))
}

/** Lowercased keyword blob for fast client-side filtering (no API calls). */
export function buildQuestionBankSearchHaystack(
  question: QuestionDetail,
  definitions: QuestionTypeDefinition[] = [],
): string {
  const labels = getQuestionBankListLabels(question, definitions)
  return questionBankSearchKeywords(question, labels).join(" ").toLowerCase()
}

export function matchesQuestionBankHaystack(haystack: string, query: string): boolean {
  const tokens = getSearchTokens(query)
  if (tokens.length === 0) return true
  return tokens.every((token) => haystack.includes(token.toLowerCase()))
}
