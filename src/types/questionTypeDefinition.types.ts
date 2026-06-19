/** Dynamic question type definition builder (admin) — aligns with POST /questions/type-definitions */

import type { PracticeParent } from "./course.types"

/** GET /questions/component-catalog — `data` object shape */
export interface QuestionComponentCatalog {
  stimulus_component_kinds: string[]
  response_component_kinds: string[]
}

export type DefinitionStatus = "ACTIVE" | "INACTIVE"

export interface DynamicElementDefinition {
  id: string
  kind: string
  label?: string
  required: boolean
  config?: Record<string, unknown>
}

export interface QuestionTypeDefinitionCreatePayload {
  key: string
  display_name: string
  description?: string | null
  stimulus_component_kinds: string[]
  response_component_kinds: string[]
  stimulus_schema: DynamicElementDefinition[]
  response_schema: DynamicElementDefinition[]
  status: DefinitionStatus
}

/** PUT /questions/type-definitions/:id — any subset of create fields */
export type QuestionTypeDefinitionUpdatePayload = Partial<QuestionTypeDefinitionCreatePayload>

/** POST /questions/validate-question-type-definition — body is often kinds-only; full create shape is also accepted */
export type QuestionTypeDefinitionValidatePayload = Partial<QuestionTypeDefinitionCreatePayload>

/** Parsed outcome (do not rely on envelope `success`; it may be false when `data.valid` is true) */
export type ValidateQuestionTypeDefinitionResult =
  | { valid: true; message?: string }
  | { valid: false; message?: string; error?: string }

export interface QuestionTypeDefinition extends QuestionTypeDefinitionCreatePayload {
  id: number
  is_system?: boolean
  created_at?: string
  updated_at?: string
}

export interface DynamicElementInstance {
  id: string
  kind: string
  value?: unknown
  meta?: Record<string, unknown>
}

export interface DynamicQuestionPayload {
  stimulus: DynamicElementInstance[]
  response: DynamicElementInstance[]
}

/** Row from GET /questions/type-definitions/:id/practices */
export interface QuestionTypeDefinitionPractice {
  practice_kind: string
  practice_id: number
  question_set_id: number
  title: string
  story_description?: string
  story_image?: string
  quick_tips?: string
  publish_status?: string
  parents: PracticeParent[] | null
  /** @deprecated use parents[] */
  parent_kind?: string
  /** @deprecated use parents[] */
  parent_id?: number
  /** When returned by the API, used to build edit routes without hierarchy search. */
  program_id?: number
  course_id?: number
  module_id?: number
  lesson_id?: number
  matching_question_count: number
  created_at?: string
  updated_at?: string
}

export interface QuestionTypeDefinitionPracticesParams {
  limit?: number
  offset?: number
}

export interface QuestionTypeDefinitionPracticesResult {
  question_type_definition_id: number
  practices: QuestionTypeDefinitionPractice[]
  total_count: number
  limit: number
  offset: number
}
