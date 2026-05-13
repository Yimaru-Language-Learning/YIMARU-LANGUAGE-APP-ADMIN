import type {
  DynamicElementDefinition,
  QuestionComponentCatalog,
  QuestionTypeDefinitionCreatePayload,
} from "../../../types/questionTypeDefinition.types"

export type FieldErrorMap = Record<string, string>

function uniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length
}

function idsUniqueAndNonEmpty(rows: DynamicElementDefinition[], prefix: string, errors: FieldErrorMap) {
  const ids = rows.map((r) => r.id?.trim()).filter(Boolean) as string[]
  if (ids.length !== rows.length) {
    errors[`${prefix}_ids`] = "Each schema row needs a non-empty id."
    return
  }
  if (!uniqueStrings(ids)) {
    errors[`${prefix}_ids`] = "Schema ids must be unique within this section."
  }
}

export function validateDefinitionKinds(
  payload: {
    stimulus_component_kinds: string[]
    response_component_kinds: string[]
  },
  catalog?: QuestionComponentCatalog | null,
): FieldErrorMap {
  const errors: FieldErrorMap = {}
  const { stimulus_component_kinds: sk, response_component_kinds: rk } = payload

  if (!sk.length) errors.stimulus_kinds = "Select at least one stimulus component kind."
  if (!rk.length) errors.response_kinds = "Select at least one response component kind."

  if (sk.length && !uniqueStrings(sk)) errors.stimulus_kinds = "Stimulus kinds must be unique (no duplicates)."
  if (rk.length && !uniqueStrings(rk)) errors.response_kinds = "Response kinds must be unique (no duplicates)."

  if (rk.length === 1 && rk[0] === "ANSWER_TIMER") {
    errors.response_kinds = "ANSWER_TIMER cannot be the only response kind."
  }

  if (catalog) {
    const sCat = new Set(catalog.stimulus_component_kinds)
    const rCat = new Set(catalog.response_component_kinds)
    if (sCat.size > 0 && sk.length) {
      const invalid = sk.filter((k) => !sCat.has(k))
      if (invalid.length) {
        const msg = `Not in stimulus catalog: ${invalid.join(", ")}.`
        errors.stimulus_kinds = errors.stimulus_kinds ? `${errors.stimulus_kinds} ${msg}` : msg
      }
    }
    if (rCat.size > 0 && rk.length) {
      const invalid = rk.filter((k) => !rCat.has(k))
      if (invalid.length) {
        const msg = `Not in response catalog: ${invalid.join(", ")}.`
        errors.response_kinds = errors.response_kinds ? `${errors.response_kinds} ${msg}` : msg
      }
    }
  }

  return errors
}

export function validateDefinitionSchemas(
  payload: Pick<
    QuestionTypeDefinitionCreatePayload,
    "stimulus_schema" | "response_schema" | "stimulus_component_kinds" | "response_component_kinds"
  >,
  catalog: { stimulus: Set<string>; response: Set<string> },
): FieldErrorMap {
  const errors: FieldErrorMap = {}

  const validateSide = (
    rows: DynamicElementDefinition[],
    allowed: string[],
    side: "stimulus" | "response",
  ) => {
    const prefix = side
    if (!rows.length) {
      errors[`${prefix}_schema`] = `Add at least one ${side} schema row.`
      return
    }
    idsUniqueAndNonEmpty(rows, prefix, errors)

    const allowedSet = new Set(allowed)
    const catalogSet = side === "stimulus" ? catalog.stimulus : catalog.response
    rows.forEach((row, i) => {
      if (!row.kind) errors[`${prefix}_${i}`] = "Kind is required."
      else if (allowedSet.size && !allowedSet.has(row.kind)) {
        errors[`${prefix}_${i}`] = `Kind "${row.kind}" is not in selected ${side} kinds.`
      }
      if (catalogSet.size && row.kind && !catalogSet.has(row.kind)) {
        errors[`${prefix}_${i}`] = `Kind "${row.kind}" is not in the ${side} component catalog.`
      }
    })
  }

  validateSide(payload.stimulus_schema, payload.stimulus_component_kinds, "stimulus")
  validateSide(payload.response_schema, payload.response_component_kinds, "response")

  return errors
}

export function validateDefinitionBasic(payload: {
  key: string
  display_name: string
}): FieldErrorMap {
  const errors: FieldErrorMap = {}
  if (!payload.key?.trim()) errors.key = "Key is required (slug-like, unique)."
  if (!payload.display_name?.trim()) errors.display_name = "Display name is required."
  if (payload.key && !/^[a-z0-9][a-z0-9_-]*$/i.test(payload.key.trim())) {
    errors.key = "Use letters, numbers, underscores, or hyphens; start with a letter or number."
  }
  return errors
}

/** Unique kinds used in schema rows (API expects deduplicated lists; schema may repeat the same kind). */
function uniqueKindsFromSchemaRows(rows: DynamicElementDefinition[]): string[] {
  const set = new Set<string>()
  for (const r of rows) {
    const k = r.kind?.trim()
    if (k) set.add(k)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function buildCreatePayload(
  draft: QuestionTypeDefinitionCreatePayload,
): QuestionTypeDefinitionCreatePayload {
  const stimulus_schema = draft.stimulus_schema.map((r) => ({
    ...r,
    id: r.id.trim(),
    kind: r.kind.trim(),
    label: r.label?.trim() || undefined,
    config: r.config && Object.keys(r.config).length ? r.config : undefined,
  }))
  const response_schema = draft.response_schema.map((r) => ({
    ...r,
    id: r.id.trim(),
    kind: r.kind.trim(),
    label: r.label?.trim() || undefined,
    config: r.config && Object.keys(r.config).length ? r.config : undefined,
  }))

  const stimulusKindsFromSchema = uniqueKindsFromSchemaRows(stimulus_schema)
  const responseKindsFromSchema = uniqueKindsFromSchemaRows(response_schema)

  return {
    ...draft,
    key: draft.key.trim(),
    display_name: draft.display_name.trim(),
    description: draft.description?.trim() || null,
    stimulus_component_kinds:
      stimulusKindsFromSchema.length > 0 ? stimulusKindsFromSchema : [...draft.stimulus_component_kinds],
    response_component_kinds:
      responseKindsFromSchema.length > 0 ? responseKindsFromSchema : [...draft.response_component_kinds],
    stimulus_schema,
    response_schema,
  }
}
