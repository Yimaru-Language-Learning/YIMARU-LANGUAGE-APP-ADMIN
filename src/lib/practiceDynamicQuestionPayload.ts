import type { DynamicQuestionPayload } from "../types/questionTypeDefinition.types"
import {
  multipleChoiceSlotHasContent,
  normalizeMultipleChoiceValue,
  parseMultipleChoiceSlotValue,
} from "./multipleChoiceSlotValue"

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

const PLAIN_TEXT_STIMULUS_KINDS = new Set([
  "INSTRUCTION",
  "QUESTION_TEXT",
  "TEXT_PASSAGE",
  "TEXT",
  "TEXT_INPUT",
])

function isMultipleChoiceKind(kind: string): boolean {
  const upper = kind.trim().toUpperCase()
  return upper === "MULTIPLE_CHOICE" || upper === "OPTION"
}

function slotValueForRow(
  row: { id: string; kind: string },
  side: "stimulus" | "response",
  fieldValues: Record<string, string>,
  mcqOptions: { option_text: string; is_correct: boolean }[] | undefined,
  mcqOptionsConsumed: { current: boolean },
): unknown {
  const fieldKey = `${side}:${row.id}`
  const rawField = fieldValues[fieldKey]

  if (isMultipleChoiceKind(row.kind)) {
    const fromField = parseMultipleChoiceSlotValue(rawField)
    if (multipleChoiceSlotHasContent(fromField)) {
      return normalizeMultipleChoiceValue(fromField)
    }
    if (mcqOptions && !mcqOptionsConsumed.current) {
      mcqOptionsConsumed.current = true
      return normalizeMultipleChoiceValue(undefined, mcqOptions)
    }
    return normalizeMultipleChoiceValue(fromField)
  }

  if (side === "stimulus" && PLAIN_TEXT_STIMULUS_KINDS.has(row.kind.trim().toUpperCase())) {
    return (rawField ?? "").trim()
  }

  return parseDynamicSlotValue(rawField)
}

export function buildDynamicQuestionPayload(input: {
  stimulusRows: { id: string; kind: string }[]
  responseRows: { id: string; kind: string }[]
  fieldValues: Record<string, string>
  mcqOptions?: { option_text: string; is_correct: boolean }[]
}): DynamicQuestionPayload {
  const mcqOptionsConsumed = { current: false }

  return {
    stimulus: input.stimulusRows.map((row) => ({
      id: row.id,
      kind: row.kind,
      value: slotValueForRow(
        row,
        "stimulus",
        input.fieldValues,
        input.mcqOptions,
        mcqOptionsConsumed,
      ),
    })),
    response: input.responseRows.map((row) => ({
      id: row.id,
      kind: row.kind,
      value: slotValueForRow(
        row,
        "response",
        input.fieldValues,
        input.mcqOptions,
        mcqOptionsConsumed,
      ),
    })),
  }
}
