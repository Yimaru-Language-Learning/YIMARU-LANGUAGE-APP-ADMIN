import type { DynamicQuestionPayload, DynamicElementInstance } from "../types/questionTypeDefinition.types"
import { parseTableSlotValue } from "./dynamicTableValue"
import {
  finalizeMatchingAnswerPayload,
  finalizeMatchingInputsPayload,
  findMatchingInputsForAnswerRow,
  matchingAnswerSlotHasContent,
  matchingInputsSlotHasContent,
  parseMatchingAnswerSlotValue,
  parseMatchingInputsSlotValue,
} from "./matchingSlotValue"
import {
  finalizeSelectMissingWordsResponsePayload,
  finalizeSelectMissingWordsStimulusPayload,
  findSelectMissingWordsStimulusForResponseRow,
  parseSelectMissingWordsResponseSlotValue,
  parseSelectMissingWordsStimulusSlotValue,
  selectMissingWordsResponseHasContent,
  selectMissingWordsStimulusHasContent,
} from "./selectMissingWordsSlotValue"
import {
  finalizeSequenceOrderPayload,
  parseSequenceOrderSlotValue,
  sequenceOrderSlotHasContent,
} from "./sequenceOrderSlotValue"
import {
  multipleChoiceOptionHasValue,
  multipleChoiceSlotHasContent,
  normalizeMultipleChoiceValue,
  parseMultipleChoiceSlotValue,
  serializeMultipleChoiceSlotValue,
} from "./multipleChoiceSlotValue"
import { isNoInputComponentKind } from "./questionComponentKinds"

/** Parse a single slot value: plain string/URL, or JSON object/array when input looks like JSON. */
export function parseDynamicSlotValue(raw: string | undefined): unknown {
  const t = (raw ?? "").trim()
  if (!t) return ""
  if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
    try {
      return JSON.parse(t) as unknown
    } catch {
      return t
    }
  }
  return t
}

/** Plain string content (never JSON-parsed on save). */
const PLAIN_TEXT_KINDS = new Set([
  "INSTRUCTION",
  "QUESTION_TEXT",
  "TEXT_PASSAGE",
  "TEXT",
  "TEXT_INPUT",
  "SHORT_ANSWER",
])

/** URL / path string slots (image, audio, PDF). */
const MEDIA_URL_KINDS = new Set([
  "IMAGE",
  "AUDIO_PROMPT",
  "AUDIO_CLIP",
  "AUDIO_RESPONSE",
  "PDF_ATTACHMENT",
  "PDF_UPLOAD",
])

function isSecondsKind(kind: string): boolean {
  const upper = kind.trim().toUpperCase()
  return upper === "PREP_TIME" || upper === "ANSWER_TIMER"
}

function isTimerValueShape(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return true
  if (typeof value === "string") {
    const t = value.trim()
    if (/^\d+$/.test(t)) return true
    if (t.startsWith("{") && t.includes("seconds")) return true
  }
  if (typeof value === "object" && !Array.isArray(value) && "seconds" in value) return true
  return false
}

function resolveRowKind(
  row: { id: string; kind: string },
  side: "stimulus" | "response",
  existingPayload?: DynamicQuestionPayload | null,
): string {
  const fromRow = row.kind?.trim()
  if (fromRow) return fromRow
  const slots = side === "stimulus" ? existingPayload?.stimulus : existingPayload?.response
  const fromPayload = slots?.find((slot) => slot.id === row.id)?.kind?.trim()
  return fromPayload ?? fromRow ?? ""
}

function mergeSchemaRowsWithPayload(
  schemaRows: { id: string; kind: string }[],
  payloadSlots: DynamicElementInstance[] | undefined,
): { id: string; kind: string }[] {
  const merged = schemaRows.map((row) => ({ ...row }))
  const byId = new Map(merged.map((row) => [row.id, row]))
  for (const slot of payloadSlots ?? []) {
    const id = slot.id?.trim()
    if (!id) continue
    const existing = byId.get(id)
    if (existing) {
      if (!existing.kind?.trim() && slot.kind?.trim()) {
        existing.kind = slot.kind.trim()
      }
      continue
    }
    merged.push({ id, kind: slot.kind?.trim() ?? "" })
  }
  return merged
}

function isTableKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "TABLE"
}

function isMultipleChoiceKind(kind: string): boolean {
  const upper = kind.trim().toUpperCase()
  return upper === "MULTIPLE_CHOICE" || upper === "OPTION"
}

function isMatchingInputsKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "MATCHING_INPUTS"
}

function isMatchingAnswerKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "MATCHING_ANSWER"
}

function isSelectMissingWordsKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "SELECT_MISSING_WORDS"
}

function isSequenceOrderKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "SEQUENCE_ORDER"
}

function parseNonNegativeInt(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.trunc(raw)
  }
  if (typeof raw === "string") {
    const t = raw.trim()
    if (/^\d+$/.test(t)) return Number.parseInt(t, 10)
  }
  return null
}

/**
 * Normalize PREP_TIME / ANSWER_TIMER field or API values to `{ seconds: N }`.
 * Accepts plain `"30"`, number `30`, or `{ seconds: 30 }` / `{ seconds: "30" }`.
 */
export function finalizeSecondsPayload(raw: unknown): { seconds: number } | "" {
  if (raw == null) return ""

  if (typeof raw === "string") {
    const t = raw.trim()
    if (!t) return ""
    const asInt = parseNonNegativeInt(t)
    if (asInt != null) return { seconds: asInt }
    const parsed = parseDynamicSlotValue(t)
    return finalizeSecondsPayload(parsed)
  }

  const asInt = parseNonNegativeInt(raw)
  if (asInt != null) return { seconds: asInt }

  if (typeof raw === "object" && !Array.isArray(raw) && "seconds" in raw) {
    const seconds = parseNonNegativeInt((raw as { seconds?: unknown }).seconds)
    if (seconds != null) return { seconds }
  }

  return ""
}

function extractSecondsForField(value: unknown): number | null {
  const normalized = finalizeSecondsPayload(value)
  return normalized === "" ? null : normalized.seconds
}

function slotValueForRow(
  row: { id: string; kind: string },
  side: "stimulus" | "response",
  fieldValues: Record<string, string>,
  mcqOptions: { option_text: string; is_correct: boolean }[] | undefined,
  mcqOptionsConsumed: { current: boolean },
  stimulusRows: { id: string; kind: string }[],
  responseRows: { id: string; kind: string }[],
  existingPayload?: DynamicQuestionPayload | null,
): unknown {
  const fieldKey = `${side}:${row.id}`
  const rawField = fieldValues[fieldKey]
  const effectiveKind = resolveRowKind(row, side, existingPayload)
  const upperKind = effectiveKind.trim().toUpperCase()

  if (isSecondsKind(effectiveKind)) {
    return finalizeSecondsPayload(rawField)
  }

  if (isTableKind(effectiveKind)) {
    const t = (rawField ?? "").trim()
    if (!t) return { columns: [], rows: [] }
    const table = parseTableSlotValue(rawField)
    return { columns: table.columns, rows: table.rows }
  }

  if (isMultipleChoiceKind(effectiveKind)) {
    const fromField = parseMultipleChoiceSlotValue(rawField)
    if (multipleChoiceSlotHasContent(fromField)) {
      return {
        options: fromField.options
          .filter((option) => multipleChoiceOptionHasValue(option.text))
          .map((option) => ({
            id: option.id,
            text: option.text,
            is_correct: option.is_correct,
          })),
      }
    }
    if (mcqOptions && !mcqOptionsConsumed.current) {
      mcqOptionsConsumed.current = true
      return normalizeMultipleChoiceValue(undefined, mcqOptions)
    }
    return { options: [] }
  }

  if (isMatchingInputsKind(effectiveKind)) {
    const fromField = parseMatchingInputsSlotValue(rawField)
    if (matchingInputsSlotHasContent(fromField)) {
      return finalizeMatchingInputsPayload(fromField)
    }
    return { left: [], right: [] }
  }

  if (isMatchingAnswerKind(effectiveKind)) {
    const matchingInputs = findMatchingInputsForAnswerRow(
      fieldValues,
      stimulusRows,
      responseRows,
      side,
      row.id,
    )
    const fromField = parseMatchingAnswerSlotValue(rawField, matchingInputs)
    if (matchingAnswerSlotHasContent(fromField)) {
      return finalizeMatchingAnswerPayload(fromField)
    }
    return { pairs: [] }
  }

  if (isSelectMissingWordsKind(effectiveKind)) {
    if (side === "stimulus") {
      const fromField = parseSelectMissingWordsStimulusSlotValue(rawField)
      if (selectMissingWordsStimulusHasContent(fromField)) {
        return finalizeSelectMissingWordsStimulusPayload(fromField)
      }
      return { segments: [], word_bank: [], allow_reuse: false }
    }
    const clozeStimulus = findSelectMissingWordsStimulusForResponseRow(
      fieldValues,
      stimulusRows,
      responseRows,
      side,
      row.id,
    )
    const fromField = parseSelectMissingWordsResponseSlotValue(
      rawField,
      clozeStimulus,
    )
    if (selectMissingWordsResponseHasContent(fromField)) {
      return finalizeSelectMissingWordsResponsePayload(fromField)
    }
    return { blanks: [] }
  }

  if (isSequenceOrderKind(effectiveKind)) {
    const fromField = parseSequenceOrderSlotValue(rawField)
    if (sequenceOrderSlotHasContent(fromField)) {
      return finalizeSequenceOrderPayload(fromField)
    }
    return { items: [], correct_order: [] }
  }

  if (PLAIN_TEXT_KINDS.has(upperKind) || MEDIA_URL_KINDS.has(upperKind)) {
    return (rawField ?? "").trim()
  }

  // Remaining structured kinds (e.g. LABEL_SELECTION): keep object/array JSON as objects.
  return parseDynamicSlotValue(rawField)
}

export function slotApiValueToFieldString(value: unknown, kind: string): string {
  if (value == null) return ""

  if (isSecondsKind(kind) || (!kind.trim() && isTimerValueShape(value))) {
    const seconds = extractSecondsForField(value)
    // Plain digits in the form; buildDynamicQuestionPayload rewraps to { seconds }.
    return seconds == null ? "" : String(seconds)
  }

  if (typeof value === "string") return value

  if (isMultipleChoiceKind(kind)) {
    return serializeMultipleChoiceSlotValue(value as { options: unknown[] })
  }

  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

export function dynamicPayloadToFieldValues(
  payload: DynamicQuestionPayload | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const slot of payload?.stimulus ?? []) {
    out[`stimulus:${slot.id}`] = slotApiValueToFieldString(slot.value, slot.kind)
  }
  for (const slot of payload?.response ?? []) {
    out[`response:${slot.id}`] = slotApiValueToFieldString(slot.value, slot.kind)
  }
  return out
}

export function buildDynamicQuestionPayload(input: {
  stimulusRows: { id: string; kind: string }[]
  responseRows: { id: string; kind: string }[]
  fieldValues: Record<string, string>
  mcqOptions?: { option_text: string; is_correct: boolean }[]
  existingPayload?: DynamicQuestionPayload | null
}): DynamicQuestionPayload {
  const mcqOptionsConsumed = { current: false }
  const stimulusRows = mergeSchemaRowsWithPayload(
    input.stimulusRows,
    input.existingPayload?.stimulus,
  )
  const responseRows = mergeSchemaRowsWithPayload(
    input.responseRows,
    input.existingPayload?.response,
  )

  return {
    stimulus: stimulusRows
      .filter((row) => !isNoInputComponentKind(resolveRowKind(row, "stimulus", input.existingPayload)))
      .map((row) => ({
        id: row.id,
        kind: resolveRowKind(row, "stimulus", input.existingPayload),
        value: slotValueForRow(
          row,
          "stimulus",
          input.fieldValues,
          input.mcqOptions,
          mcqOptionsConsumed,
          stimulusRows,
          responseRows,
          input.existingPayload,
        ),
      })),
    response: responseRows
      .filter((row) => !isNoInputComponentKind(resolveRowKind(row, "response", input.existingPayload)))
      .map((row) => ({
        id: row.id,
        kind: resolveRowKind(row, "response", input.existingPayload),
        value: slotValueForRow(
          row,
          "response",
          input.fieldValues,
          input.mcqOptions,
          mcqOptionsConsumed,
          stimulusRows,
          responseRows,
          input.existingPayload,
        ),
      })),
  }
}
