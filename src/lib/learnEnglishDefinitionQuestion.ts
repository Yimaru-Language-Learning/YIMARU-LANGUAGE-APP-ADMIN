import type { CreateQuestionRequest, QuestionOption } from "../types/course.types"
import type { QuestionTypeDefinition } from "../types/questionTypeDefinition.types"
import { createEmptyTable, serializeTableSlotValue } from "./dynamicTableValue"
import { buildDynamicQuestionPayload } from "./practiceDynamicQuestionPayload"
import {
  parseMultipleChoiceSlotValue,
  serializeMultipleChoiceSlotValue,
  defaultMultipleChoiceSlotValue,
  validateMultipleChoiceSlotValue,
  multipleChoiceSlotHasContent,
} from "./multipleChoiceSlotValue"
import {
  defaultMatchingInputsSlotValue,
  findMatchingInputsInFieldValues,
  matchingAnswerSlotHasContent,
  matchingInputsSlotHasContent,
  parseMatchingAnswerSlotValue,
  parseMatchingInputsSlotValue,
  serializeMatchingAnswerSlotValue,
  serializeMatchingInputsSlotValue,
  validateMatchingAnswerSlotValue,
  validateMatchingInputsSlotValue,
} from "./matchingSlotValue"
import {
  defaultSelectMissingWordsStimulusSlotValue,
  findSelectMissingWordsStimulusInFieldValues,
  parseSelectMissingWordsResponseSlotValue,
  parseSelectMissingWordsStimulusSlotValue,
  selectMissingWordsResponseHasContent,
  selectMissingWordsStimulusHasContent,
  serializeSelectMissingWordsResponseSlotValue,
  serializeSelectMissingWordsStimulusSlotValue,
  validateSelectMissingWordsResponseSlotValue,
  validateSelectMissingWordsStimulusSlotValue,
} from "./selectMissingWordsSlotValue"
import {
  defaultSequenceOrderSlotValue,
  parseSequenceOrderSlotValue,
  sequenceOrderSlotHasContent,
  serializeSequenceOrderSlotValue,
  validateSequenceOrderSlotValue,
} from "./sequenceOrderSlotValue"
import { isNoInputComponentKind } from "./questionComponentKinds"

function isMultipleChoiceKind(kind: string): boolean {
  const u = kind.trim().toUpperCase()
  return u === "MULTIPLE_CHOICE" || u === "OPTION"
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

function isStructuredDynamicSlotKind(kind: string): boolean {
  return (
    isMultipleChoiceKind(kind) ||
    isMatchingInputsKind(kind) ||
    isMatchingAnswerKind(kind) ||
    isSelectMissingWordsKind(kind) ||
    isSequenceOrderKind(kind)
  )
}

function defaultValueForSchemaSlot(
  kind: string,
  side: "stimulus" | "response",
): string {
  if (isNoInputComponentKind(kind)) return ""
  const u = kind.trim().toUpperCase()
  if (u === "TABLE") {
    return serializeTableSlotValue(createEmptyTable(2, 1))
  }
  if (isMultipleChoiceKind(kind)) {
    return serializeMultipleChoiceSlotValue(defaultMultipleChoiceSlotValue())
  }
  if (isMatchingInputsKind(kind)) {
    return serializeMatchingInputsSlotValue(defaultMatchingInputsSlotValue())
  }
  if (isMatchingAnswerKind(kind)) {
    return serializeMatchingAnswerSlotValue({ pairs: [] })
  }
  if (isSelectMissingWordsKind(kind)) {
    if (side === "stimulus") {
      return serializeSelectMissingWordsStimulusSlotValue(
        defaultSelectMissingWordsStimulusSlotValue(),
      )
    }
    return serializeSelectMissingWordsResponseSlotValue({ blanks: [] })
  }
  if (isSequenceOrderKind(kind)) {
    return serializeSequenceOrderSlotValue(defaultSequenceOrderSlotValue())
  }
  return ""
}

export function definitionUsesDynamicPayload(def: QuestionTypeDefinition): boolean {
  const stimulus = def.stimulus_schema.filter((r) => !isNoInputComponentKind(r.kind))
  const response = def.response_schema.filter((r) => !isNoInputComponentKind(r.kind))
  return stimulus.length > 0 || response.length > 0
}

export function emptyDynamicFieldValuesForDefinition(
  def: QuestionTypeDefinition,
): Record<string, string> {
  const o: Record<string, string> = {}
  for (const r of def.stimulus_schema) {
    if (isNoInputComponentKind(r.kind)) continue
    o[`stimulus:${r.id}`] = defaultValueForSchemaSlot(r.kind, "stimulus")
  }
  for (const r of def.response_schema) {
    if (isNoInputComponentKind(r.kind)) continue
    o[`response:${r.id}`] = defaultValueForSchemaSlot(r.kind, "response")
  }
  return o
}

const PROMPT_STIMULUS_KINDS = new Set(["QUESTION_TEXT", "INSTRUCTION", "TEXT_PASSAGE"])

/** First stimulus slot used for a plain-text prompt shortcut in the practice UI. */
export function primaryPromptStimulusRow(
  def: QuestionTypeDefinition,
): { id: string; kind: string } | null {
  for (const kind of ["QUESTION_TEXT", "INSTRUCTION", "TEXT_PASSAGE"] as const) {
    const row = def.stimulus_schema.find((r) => r.kind === kind)
    if (row) return { id: row.id, kind: row.kind }
  }
  return def.stimulus_schema[0] ? { id: def.stimulus_schema[0].id, kind: def.stimulus_schema[0].kind } : null
}

export function mergePromptIntoDynamicFieldValues(
  def: QuestionTypeDefinition,
  questionText: string,
  fieldValues: Record<string, string>,
): Record<string, string> {
  const merged = { ...fieldValues }
  const prompt = questionText.trim()
  if (!prompt) return merged
  const slot = primaryPromptStimulusRow(def)
  if (!slot) return merged
  const key = `stimulus:${slot.id}`
  if (!merged[key]?.trim()) merged[key] = prompt
  return merged
}

export function dynamicPromptFromFieldValues(
  def: QuestionTypeDefinition,
  fieldValues: Record<string, string>,
): string {
  for (const row of def.stimulus_schema) {
    if (!PROMPT_STIMULUS_KINDS.has(row.kind)) continue
    const v = fieldValues[`stimulus:${row.id}`]?.trim()
    if (v) return v
  }
  return ""
}

/**
 * System definitions with empty schema map to classic POST /questions types.
 * Returns null when the payload must be DYNAMIC (schema-driven or unknown).
 */
export function legacyQuestionTypeFromDefinition(
  def: QuestionTypeDefinition,
): "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | null {
  if (definitionUsesDynamicPayload(def)) return null
  const k = def.key.toLowerCase()
  if (k === "multiple_choice") return "MCQ"
  if (k === "true_false") return "TRUE_FALSE"
  if (k === "short_answer" || k === "fill_in_the_blank") return "SHORT_ANSWER"
  return null
}

export type QuestionDifficultyLevel = "EASY" | "MEDIUM" | "HARD"

export interface LearnEnglishDefinitionQuestionInput {
  clientRowId?: string
  questionText: string
  questionTypeDefinitionId: number
  dynamicFieldValues: Record<string, string>
  difficultyLevel?: QuestionDifficultyLevel
  points?: number
  associatedQuestionId?: number | null
  associatedAnchorRowId?: string | null
  prerequisiteQuestionIds?: number[]
  displayOrder?: number
  mcqOptions?: { option_text: string; is_correct: boolean }[]
  trueFalseAnswerIsTrue?: boolean
  shortAnswers?: string[]
  voicePromptUrl?: string
  sampleAnswerVoiceUrl?: string
}

export function questionRowHasContent(
  q: LearnEnglishDefinitionQuestionInput,
  def: QuestionTypeDefinition,
): boolean {
  if (!definitionUsesDynamicPayload(def)) {
    return Boolean(q.questionText.trim())
  }
  if (q.questionText.trim()) return true
  const fv = q.dynamicFieldValues ?? {}
  for (const row of def.stimulus_schema) {
    if (isNoInputComponentKind(row.kind)) continue
    if (isMultipleChoiceKind(row.kind)) {
      if (
        multipleChoiceSlotHasContent(
          parseMultipleChoiceSlotValue(fv[`stimulus:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (isMatchingInputsKind(row.kind)) {
      if (
        matchingInputsSlotHasContent(
          parseMatchingInputsSlotValue(fv[`stimulus:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (isMatchingAnswerKind(row.kind)) {
      if (
        matchingAnswerSlotHasContent(
          parseMatchingAnswerSlotValue(fv[`stimulus:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (isSelectMissingWordsKind(row.kind)) {
      if (
        selectMissingWordsStimulusHasContent(
          parseSelectMissingWordsStimulusSlotValue(fv[`stimulus:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (fv[`stimulus:${row.id}`]?.trim()) return true
  }
  for (const row of def.response_schema) {
    if (isNoInputComponentKind(row.kind)) continue
    if (isMultipleChoiceKind(row.kind)) {
      if (
        multipleChoiceSlotHasContent(
          parseMultipleChoiceSlotValue(fv[`response:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (isMatchingInputsKind(row.kind)) {
      if (
        matchingInputsSlotHasContent(
          parseMatchingInputsSlotValue(fv[`response:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (isMatchingAnswerKind(row.kind)) {
      if (
        matchingAnswerSlotHasContent(
          parseMatchingAnswerSlotValue(fv[`response:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (isSelectMissingWordsKind(row.kind)) {
      if (
        selectMissingWordsResponseHasContent(
          parseSelectMissingWordsResponseSlotValue(fv[`response:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (isSequenceOrderKind(row.kind)) {
      if (
        sequenceOrderSlotHasContent(
          parseSequenceOrderSlotValue(fv[`response:${row.id}`]),
        )
      ) {
        return true
      }
      continue
    }
    if (fv[`response:${row.id}`]?.trim()) return true
  }
  return false
}

function normalizeQuestionDifficulty(
  value: string | undefined,
): QuestionDifficultyLevel {
  const upper = (value ?? "EASY").trim().toUpperCase()
  if (upper === "MEDIUM" || upper === "HARD") return upper
  return "EASY"
}

function normalizeQuestionPoints(value: number | undefined): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.round(n)
}

export function buildCreateQuestionFromDefinition(
  def: QuestionTypeDefinition,
  q: LearnEnglishDefinitionQuestionInput,
  status: "DRAFT" | "PUBLISHED",
): CreateQuestionRequest {
  const difficulty = normalizeQuestionDifficulty(q.difficultyLevel)
  const points = normalizeQuestionPoints(q.points)
  const question_text = q.questionText.trim()

  if (definitionUsesDynamicPayload(def)) {
    const fieldValues = mergePromptIntoDynamicFieldValues(
      def,
      q.questionText,
      q.dynamicFieldValues ?? {},
    )
    const payload = buildDynamicQuestionPayload({
      stimulusRows: def.stimulus_schema.map((r) => ({ id: r.id, kind: r.kind })),
      responseRows: def.response_schema.map((r) => ({ id: r.id, kind: r.kind })),
      fieldValues,
      mcqOptions: q.mcqOptions,
    })
    return {
      question_type: "DYNAMIC",
      question_type_definition_id: def.id,
      difficulty_level: difficulty,
      points,
      status,
      dynamic_payload: payload,
    }
  }

  const legacy = legacyQuestionTypeFromDefinition(def)
  if (legacy === "MCQ") {
    const options: QuestionOption[] = (q.mcqOptions ?? [])
      .filter((o) => o.option_text.trim())
      .map((o, idx) => ({
        option_order: idx + 1,
        option_text: o.option_text.trim(),
        is_correct: o.is_correct,
      }))
    return {
      question_text,
      question_type: "MCQ",
      difficulty_level: difficulty,
      points,
      status,
      options,
    }
  }
  if (legacy === "TRUE_FALSE") {
    const trueCorrect = q.trueFalseAnswerIsTrue !== false
    const options: QuestionOption[] = [
      { option_order: 1, option_text: "True", is_correct: trueCorrect },
      { option_order: 2, option_text: "False", is_correct: !trueCorrect },
    ]
    return {
      question_text,
      question_type: "TRUE_FALSE",
      difficulty_level: difficulty,
      points,
      status,
      options,
    }
  }
  if (legacy === "SHORT_ANSWER") {
    const short_answers = (q.shortAnswers ?? [])
      .map((s) => s.trim())
      .filter(Boolean)
      .map((acceptable_answer) => ({
        acceptable_answer,
        match_type: "CASE_INSENSITIVE" as const,
      }))
    return {
      question_text,
      question_type: "SHORT_ANSWER",
      difficulty_level: difficulty,
      points,
      status,
      short_answers,
    }
  }

  return {
    question_type: "DYNAMIC",
    question_type_definition_id: def.id,
    difficulty_level: difficulty,
    points,
    status,
    dynamic_payload: { stimulus: [], response: [] },
  }
}

export function validateDefinitionQuestion(
  def: QuestionTypeDefinition,
  q: LearnEnglishDefinitionQuestionInput,
  index1Based: number,
): string | null {
  const n = index1Based

  if (definitionUsesDynamicPayload(def)) {
    const fieldValues = mergePromptIntoDynamicFieldValues(
      def,
      q.questionText,
      q.dynamicFieldValues ?? {},
    )
    const hasPrompt =
      Boolean(q.questionText.trim()) || Boolean(dynamicPromptFromFieldValues(def, fieldValues))
    const promptRow = def.stimulus_schema.find((r) => PROMPT_STIMULUS_KINDS.has(r.kind) && r.required)
    if (promptRow && !hasPrompt) {
      return `Question ${n}: enter prompt text (${promptRow.label || promptRow.id}).`
    }
    for (const row of def.stimulus_schema) {
      if (isNoInputComponentKind(row.kind)) continue
      if (isStructuredDynamicSlotKind(row.kind)) continue
      if (!row.required) continue
      const v = fieldValues[`stimulus:${row.id}`]?.trim()
      if (!v)
        return `Question ${n}: fill required stimulus "${row.label || row.id}" (${row.kind}).`
    }
    for (const row of def.response_schema) {
      if (isNoInputComponentKind(row.kind)) continue
      if (isStructuredDynamicSlotKind(row.kind)) continue
      if (!row.required) continue
      const v = fieldValues[`response:${row.id}`]?.trim()
      if (!v)
        return `Question ${n}: fill required response "${row.label || row.id}" (${row.kind}).`
    }
    const matchingInputs = findMatchingInputsInFieldValues(
      fieldValues,
      def.stimulus_schema,
      def.response_schema,
    )
    const clozeStimulus = findSelectMissingWordsStimulusInFieldValues(
      fieldValues,
      def.stimulus_schema,
    )
    for (const row of def.stimulus_schema) {
      if (isNoInputComponentKind(row.kind)) continue
      if (isMultipleChoiceKind(row.kind)) {
        const val = parseMultipleChoiceSlotValue(fieldValues[`stimulus:${row.id}`])
        if (!multipleChoiceSlotHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add choices for stimulus "${row.label || row.id}".`
          }
          continue
        }
        const mcqErr = validateMultipleChoiceSlotValue(val)
        if (mcqErr) {
          return `Question ${n} (stimulus "${row.label || row.id}"): ${mcqErr}`
        }
      }
      if (isMatchingInputsKind(row.kind)) {
        const val = parseMatchingInputsSlotValue(fieldValues[`stimulus:${row.id}`])
        if (!matchingInputsSlotHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add matching inputs for stimulus "${row.label || row.id}".`
          }
          continue
        }
        const err = validateMatchingInputsSlotValue(val)
        if (err) {
          return `Question ${n} (stimulus "${row.label || row.id}"): ${err}`
        }
      }
      if (isMatchingAnswerKind(row.kind)) {
        const val = parseMatchingAnswerSlotValue(
          fieldValues[`stimulus:${row.id}`],
          matchingInputs,
        )
        if (!matchingAnswerSlotHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add matching pairs for stimulus "${row.label || row.id}".`
          }
          continue
        }
        const err = validateMatchingAnswerSlotValue(val, matchingInputs)
        if (err) {
          return `Question ${n} (stimulus "${row.label || row.id}"): ${err}`
        }
      }
      if (isSelectMissingWordsKind(row.kind)) {
        const val = parseSelectMissingWordsStimulusSlotValue(
          fieldValues[`stimulus:${row.id}`],
        )
        if (!selectMissingWordsStimulusHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add cloze passage for stimulus "${row.label || row.id}".`
          }
          continue
        }
        const err = validateSelectMissingWordsStimulusSlotValue(val)
        if (err) {
          return `Question ${n} (stimulus "${row.label || row.id}"): ${err}`
        }
      }
    }
    for (const row of def.response_schema) {
      if (isNoInputComponentKind(row.kind)) continue
      if (isMultipleChoiceKind(row.kind)) {
        const val = parseMultipleChoiceSlotValue(fieldValues[`response:${row.id}`])
        if (!multipleChoiceSlotHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add choices for response "${row.label || row.id}".`
          }
          continue
        }
        const mcqErr = validateMultipleChoiceSlotValue(val)
        if (mcqErr) {
          return `Question ${n} (response "${row.label || row.id}"): ${mcqErr}`
        }
      }
      if (isMatchingInputsKind(row.kind)) {
        const val = parseMatchingInputsSlotValue(fieldValues[`response:${row.id}`])
        if (!matchingInputsSlotHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add matching inputs for response "${row.label || row.id}".`
          }
          continue
        }
        const err = validateMatchingInputsSlotValue(val)
        if (err) {
          return `Question ${n} (response "${row.label || row.id}"): ${err}`
        }
      }
      if (isMatchingAnswerKind(row.kind)) {
        const val = parseMatchingAnswerSlotValue(
          fieldValues[`response:${row.id}`],
          matchingInputs,
        )
        if (!matchingAnswerSlotHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add matching pairs for response "${row.label || row.id}".`
          }
          continue
        }
        const err = validateMatchingAnswerSlotValue(val, matchingInputs)
        if (err) {
          return `Question ${n} (response "${row.label || row.id}"): ${err}`
        }
      }
      if (isSelectMissingWordsKind(row.kind)) {
        const val = parseSelectMissingWordsResponseSlotValue(
          fieldValues[`response:${row.id}`],
          clozeStimulus,
        )
        if (!selectMissingWordsResponseHasContent(val)) {
          if (row.required) {
            return `Question ${n}: select words for each blank in response "${row.label || row.id}".`
          }
          continue
        }
        const err = validateSelectMissingWordsResponseSlotValue(val, clozeStimulus)
        if (err) {
          return `Question ${n} (response "${row.label || row.id}"): ${err}`
        }
      }
      if (isSequenceOrderKind(row.kind)) {
        const val = parseSequenceOrderSlotValue(fieldValues[`response:${row.id}`])
        if (!sequenceOrderSlotHasContent(val)) {
          if (row.required) {
            return `Question ${n}: add sequence items for response "${row.label || row.id}".`
          }
          continue
        }
        const err = validateSequenceOrderSlotValue(val, row.config)
        if (err) {
          return `Question ${n} (response "${row.label || row.id}"): ${err}`
        }
      }
    }
    return null
  }

  if (!q.questionText.trim()) return `Question ${n}: enter question text.`

  const legacy = legacyQuestionTypeFromDefinition(def)
  if (legacy === "MCQ") {
    const opts = (q.mcqOptions ?? []).filter((o) => o.option_text.trim())
    if (opts.length < 2)
      return `Question ${n} (${def.display_name}): add at least two choices with text.`
    if (!opts.some((o) => o.is_correct))
      return `Question ${n} (${def.display_name}): mark one correct choice.`
    return null
  }
  if (legacy === "TRUE_FALSE") return null
  if (legacy === "SHORT_ANSWER") {
    const answers = (q.shortAnswers ?? []).map((s) => s.trim()).filter(Boolean)
    if (answers.length < 1)
      return `Question ${n} (${def.display_name}): add at least one acceptable answer.`
    return null
  }

  return null
}
