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
  group_ids?: number[] | null
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
  group_ids: number[] | null
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

export type QuestionTypeDefinitionPracticeKind = "LMS" | "EXAM_PREP"

/** Row from GET /questions/type-definitions/:id/practices */
export interface QuestionTypeDefinitionPractice {
  practice_kind: QuestionTypeDefinitionPracticeKind
  practice_id: number
  question_set_id: number
  title: string
  story_description?: string
  story_image?: string
  persona_id?: number
  quick_tips?: string
  publish_status?: "DRAFT" | "PUBLISHED" | string
  /** LMS hierarchy links — read when `practice_kind === "LMS"`. */
  parents: PracticeParent[] | null
  /** Exam-prep hierarchy links — read when `practice_kind === "EXAM_PREP"`. */
  exam_prep_parents?: PracticeParent[] | null
  /** Legacy convenience when a LESSON parent exists; prefer `exam_prep_parents`. */
  exam_prep_lesson_id?: number | null
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

export type QuestionTypeDefinitionGroupStatus = "ACTIVE" | "INACTIVE"

export interface QuestionTypeDefinitionGroup {
  id: number
  name: string
  description: string | null
  display_order: number
  status: QuestionTypeDefinitionGroupStatus
  created_at: string
  updated_at?: string
}

export interface QuestionTypeDefinitionGroupDetail extends QuestionTypeDefinitionGroup {
  definitions: QuestionTypeDefinition[]
}

export interface QuestionTypeDefinitionGroupCreatePayload {
  name: string
  description?: string | null
  display_order?: number
  status?: QuestionTypeDefinitionGroupStatus
}

export type QuestionTypeDefinitionGroupUpdatePayload =
  Partial<QuestionTypeDefinitionGroupCreatePayload>

export interface QuestionTypeDefinitionGroupsListParams {
  status?: QuestionTypeDefinitionGroupStatus
  limit?: number
  offset?: number
}

export interface QuestionTypeDefinitionGroupsListResult {
  groups: QuestionTypeDefinitionGroup[]
  total_count: number
  limit: number
  offset: number
}
