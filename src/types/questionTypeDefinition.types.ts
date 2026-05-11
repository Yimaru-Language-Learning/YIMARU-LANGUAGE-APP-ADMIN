/** Dynamic question type definition builder (admin) — aligns with POST /questions/type-definitions */

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
