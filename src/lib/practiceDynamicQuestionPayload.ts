import type { DynamicQuestionPayload } from "../types/questionTypeDefinition.types"
import { parseTableSlotValue } from "./dynamicTableValue"
import {
  finalizeMatchingAnswerPayload,
  finalizeMatchingInputsPayload,
  findMatchingInputsInFieldValues,
  matchingAnswerSlotHasContent,
  matchingInputsSlotHasContent,
  parseMatchingAnswerSlotValue,
  parseMatchingInputsSlotValue,
} from "./matchingSlotValue"
import {
  finalizeSelectMissingWordsResponsePayload,
  finalizeSelectMissingWordsStimulusPayload,
  findSelectMissingWordsStimulusInFieldValues,
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
): unknown {
  const fieldKey = `${side}:${row.id}`
  const rawField = fieldValues[fieldKey]
  const upperKind = row.kind.trim().toUpperCase()

  if (isSecondsKind(row.kind)) {
    return finalizeSecondsPayload(rawField)
  }

  if (isTableKind(row.kind)) {
    const t = (rawField ?? "").trim()
    if (!t) return { columns: [], rows: [] }
    const table = parseTableSlotValue(rawField)
    return { columns: table.columns, rows: table.rows }
  }

  if (isMultipleChoiceKind(row.kind)) {
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

  if (isMatchingInputsKind(row.kind)) {
    const fromField = parseMatchingInputsSlotValue(rawField)
    if (matchingInputsSlotHasContent(fromField)) {
      return finalizeMatchingInputsPayload(fromField)
    }
    return { left: [], right: [] }
  }

  if (isMatchingAnswerKind(row.kind)) {
    const matchingInputs = findMatchingInputsInFieldValues(
      fieldValues,
      stimulusRows,
      responseRows,
    )
    const fromField = parseMatchingAnswerSlotValue(rawField, matchingInputs)
    if (matchingAnswerSlotHasContent(fromField)) {
      return finalizeMatchingAnswerPayload(fromField)
    }
    return { pairs: [] }
  }

  if (isSelectMissingWordsKind(row.kind)) {
    if (side === "stimulus") {
      const fromField = parseSelectMissingWordsStimulusSlotValue(rawField)
      if (selectMissingWordsStimulusHasContent(fromField)) {
        return finalizeSelectMissingWordsStimulusPayload(fromField)
      }
      return { segments: [], word_bank: [], allow_reuse: false }
    }
    const clozeStimulus = findSelectMissingWordsStimulusInFieldValues(
      fieldValues,
      stimulusRows,
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

  if (isSequenceOrderKind(row.kind)) {
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
  const upperKind = kind.trim().toUpperCase()
  if (value == null) return ""

  if (isSecondsKind(kind)) {
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
}): DynamicQuestionPayload {
  const mcqOptionsConsumed = { current: false }

  return {
    stimulus: input.stimulusRows
      .filter((row) => !isNoInputComponentKind(row.kind))
      .map((row) => ({
        id: row.id,
        kind: row.kind,
        value: slotValueForRow(
          row,
          "stimulus",
          input.fieldValues,
          input.mcqOptions,
          mcqOptionsConsumed,
          input.stimulusRows,
          input.responseRows,
        ),
      })),
    response: input.responseRows
      .filter((row) => !isNoInputComponentKind(row.kind))
      .map((row) => ({
        id: row.id,
        kind: row.kind,
        value: slotValueForRow(
          row,
          "response",
          input.fieldValues,
          input.mcqOptions,
          mcqOptionsConsumed,
          input.stimulusRows,
          input.responseRows,
        ),
      })),
  }
}
