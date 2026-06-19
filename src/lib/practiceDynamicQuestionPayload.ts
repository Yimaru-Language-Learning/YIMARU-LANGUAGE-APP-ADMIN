import type { DynamicQuestionPayload } from "../types/questionTypeDefinition.types"
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
  multipleChoiceOptionHasValue,
  multipleChoiceSlotHasContent,
  normalizeMultipleChoiceValue,
  parseMultipleChoiceSlotValue,
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

function isMatchingInputsKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "MATCHING_INPUTS"
}

function isMatchingAnswerKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "MATCHING_ANSWER"
}

function isSelectMissingWordsKind(kind: string): boolean {
  return kind.trim().toUpperCase() === "SELECT_MISSING_WORDS"
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
