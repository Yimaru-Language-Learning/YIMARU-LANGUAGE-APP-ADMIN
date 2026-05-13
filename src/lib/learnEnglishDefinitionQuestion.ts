import type { CreateQuestionRequest, QuestionOption } from "../types/course.types"
import type { QuestionTypeDefinition } from "../types/questionTypeDefinition.types"
import { buildDynamicQuestionPayload } from "./practiceDynamicQuestionPayload"

export function definitionUsesDynamicPayload(def: QuestionTypeDefinition): boolean {
  return def.stimulus_schema.length > 0 || def.response_schema.length > 0
}

export function emptyDynamicFieldValuesForDefinition(
  def: QuestionTypeDefinition,
): Record<string, string> {
  const o: Record<string, string> = {}
  for (const r of def.stimulus_schema) o[`stimulus:${r.id}`] = ""
  for (const r of def.response_schema) o[`response:${r.id}`] = ""
  return o
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

export interface LearnEnglishDefinitionQuestionInput {
  questionText: string
  questionTypeDefinitionId: number
  dynamicFieldValues: Record<string, string>
  mcqOptions?: { option_text: string; is_correct: boolean }[]
  trueFalseAnswerIsTrue?: boolean
  shortAnswers?: string[]
  voicePromptUrl?: string
  sampleAnswerVoiceUrl?: string
}

export function buildCreateQuestionFromDefinition(
  def: QuestionTypeDefinition,
  q: LearnEnglishDefinitionQuestionInput,
  status: "DRAFT" | "PUBLISHED",
): CreateQuestionRequest {
  const difficulty = "EASY"
  const points = 1
  const question_text = q.questionText.trim()

  if (definitionUsesDynamicPayload(def)) {
    const payload = buildDynamicQuestionPayload({
      stimulusRows: def.stimulus_schema.map((r) => ({ id: r.id, kind: r.kind })),
      responseRows: def.response_schema.map((r) => ({ id: r.id, kind: r.kind })),
      fieldValues: q.dynamicFieldValues ?? {},
    })
    return {
      question_text,
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

  // No schema and no legacy key mapping: still create as DYNAMIC with empty payload + definition id
  return {
    question_text,
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
  if (!q.questionText.trim()) return `Question ${n}: enter question text.`

  if (definitionUsesDynamicPayload(def)) {
    for (const row of def.stimulus_schema) {
      if (!row.required) continue
      const v = (q.dynamicFieldValues ?? {})[`stimulus:${row.id}`]?.trim()
      if (!v)
        return `Question ${n}: fill required stimulus "${row.label || row.id}" (${row.kind}).`
    }
    for (const row of def.response_schema) {
      if (!row.required) continue
      const v = (q.dynamicFieldValues ?? {})[`response:${row.id}`]?.trim()
      if (!v)
        return `Question ${n}: fill required response "${row.label || row.id}" (${row.kind}).`
    }
    return null
  }

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
