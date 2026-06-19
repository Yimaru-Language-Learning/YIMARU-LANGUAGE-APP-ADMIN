import type {
  DynamicElementDefinition,
  QuestionComponentCatalog,
  QuestionTypeDefinitionCreatePayload,
} from "../../../types/questionTypeDefinition.types"
import { defaultLabelForKind } from "../../../lib/schemaSlotLabel"
import {
  effectiveComponentKinds,
  isNoInputComponentKind,
  sideIsNoInputOnly,
  noInputSchemaRow,
} from "../../../lib/questionComponentKinds"
import { normalizeGroupIds } from "../../../lib/questionTypeGroupIds"

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

  if (sk.length === 0 && rk.length === 0) {
    errors.stimulus_kinds =
      "Select at least one stimulus or response component kind (including No input)."
    errors.response_kinds = errors.stimulus_kinds
    return errors
  }

  if (sk.length && !uniqueStrings(sk)) errors.stimulus_kinds = "Stimulus kinds must be unique (no duplicates)."
  if (rk.length && !uniqueStrings(rk)) errors.response_kinds = "Response kinds must be unique (no duplicates)."

  const responseEffective = effectiveComponentKinds(rk)
  const responseTimers = rk.filter((k) => k === "ANSWER_TIMER")
  if (
    rk.length > 0 &&
    responseEffective.length === 0 &&
    responseTimers.length === 1 &&
    rk.length === 1
  ) {
    errors.response_kinds = "ANSWER_TIMER cannot be the only response kind."
  }

  const prepCount = sk.filter((k) => k === "PREP_TIME").length
  if (prepCount > 1) {
    errors.stimulus_kinds = "At most one PREP_TIME is allowed."
  }

  const timerCount = rk.filter((k) => k === "ANSWER_TIMER").length
  if (timerCount > 1) {
    errors.response_kinds = errors.response_kinds
      ? `${errors.response_kinds} At most one ANSWER_TIMER is allowed.`
      : "At most one ANSWER_TIMER is allowed."
  }

  if (catalog) {
    const sCat = new Set(catalog.stimulus_component_kinds)
    const rCat = new Set(catalog.response_component_kinds)
    if (sCat.size > 0 && sk.length) {
      const invalid = sk.filter((k) => !sCat.has(k) && !isNoInputComponentKind(k))
      if (invalid.length) {
        const msg = `Not in stimulus catalog: ${invalid.join(", ")}.`
        errors.stimulus_kinds = errors.stimulus_kinds ? `${errors.stimulus_kinds} ${msg}` : msg
      }
    }
    if (rCat.size > 0 && rk.length) {
      const invalid = rk.filter((k) => !rCat.has(k) && !isNoInputComponentKind(k))
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
    if (allowed.length === 0) return

    if (sideIsNoInputOnly(allowed)) {
      if (rows.length > 1) {
        errors[`${prefix}_schema`] = "At most one no-input slot is allowed for this section."
        return
      }
      if (rows.length === 1) {
        const row = rows[0]
        if (!isNoInputComponentKind(row.kind)) {
          errors[`${prefix}_schema`] = "This section only allows the No input component."
          return
        }
        if (!row.id?.trim()) {
          errors[`${prefix}_0`] = "Element id is required."
        }
      }
      return
    }

    if (!rows.length) {
      errors[`${prefix}_schema`] = `Add at least one ${side} schema row, or choose No input for this section.`
      return
    }
    idsUniqueAndNonEmpty(rows, prefix, errors)

    const allowedSet = new Set(allowed)
    const catalogSet = side === "stimulus" ? catalog.stimulus : catalog.response
    rows.forEach((row, i) => {
      const rowMessages: string[] = []
      if (isNoInputComponentKind(row.kind)) {
        rowMessages.push("Remove No input rows or switch this section to No input only.")
      }
      if (!row.kind) rowMessages.push("Kind is required.")
      else if (allowedSet.size && !allowedSet.has(row.kind)) {
        rowMessages.push(`Kind "${row.kind}" is not in selected ${side} kinds.`)
      }
      if (catalogSet.size && row.kind && !catalogSet.has(row.kind) && !isNoInputComponentKind(row.kind)) {
        rowMessages.push(`Kind "${row.kind}" is not in the ${side} component catalog.`)
      }
      if (!isNoInputComponentKind(row.kind) && !row.label?.trim()) {
        rowMessages.push("Label is required — this is the field title authors see when creating questions.")
      }
      if (rowMessages.length) errors[`${prefix}_${i}`] = rowMessages.join(" ")
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

const AUXILIARY_RESPONSE_KINDS = new Set(["ANSWER_TIMER", "NO_INPUT"])
const SHORT_ANSWER_RESPONSE_KINDS = new Set([
  "SHORT_ANSWER",
  "TEXT_INPUT",
  "SELECT_MISSING_WORDS",
  "MATCHING_ANSWER",
  "LABEL_SELECTION",
  "PDF_UPLOAD",
])

/** Mirrors server runtime mapping (§13). Returns null when create would fail as unmappable. */
export function inferRuntimeQuestionType(
  key: string,
  responseKinds: string[],
): "TRUE_FALSE" | "AUDIO" | "MCQ" | "SHORT_ANSWER" | "DYNAMIC" | null {
  const normalizedKey = key.trim().toLowerCase()
  if (normalizedKey === "true_false") return "TRUE_FALSE"
  if (responseKinds.includes("AUDIO_RESPONSE")) return "AUDIO"
  if (responseKinds.includes("MULTIPLE_CHOICE")) return "MCQ"
  const nonAuxiliary = responseKinds.filter((k) => !AUXILIARY_RESPONSE_KINDS.has(k))
  if (nonAuxiliary.some((k) => SHORT_ANSWER_RESPONSE_KINDS.has(k))) return "SHORT_ANSWER"
  if (nonAuxiliary.length > 0) return "DYNAMIC"
  return null
}

/** POST /questions/validate-question-type-definition — kinds only. */
export function buildValidateKindsPayload(
  draft: QuestionTypeDefinitionCreatePayload,
): Pick<QuestionTypeDefinitionCreatePayload, "stimulus_component_kinds" | "response_component_kinds"> {
  const payload = buildCreatePayload(draft)
  return {
    stimulus_component_kinds: payload.stimulus_component_kinds,
    response_component_kinds: payload.response_component_kinds,
  }
}

export function buildCreatePayload(
  draft: QuestionTypeDefinitionCreatePayload,
): QuestionTypeDefinitionCreatePayload {
  const stimulus_schema = draft.stimulus_schema
    .filter((r) => !isNoInputComponentKind(r.kind) || sideIsNoInputOnly(draft.stimulus_component_kinds))
    .map((r) => ({
    ...r,
    id: r.id.trim(),
    kind: r.kind.trim(),
    label: isNoInputComponentKind(r.kind)
      ? r.label?.trim() || defaultLabelForKind(r.kind)
      : r.label?.trim() || defaultLabelForKind(r.kind),
    required: isNoInputComponentKind(r.kind) ? false : r.required,
    config: r.config && Object.keys(r.config).length ? r.config : undefined,
  }))
  const response_schema = draft.response_schema
    .filter((r) => !isNoInputComponentKind(r.kind) || sideIsNoInputOnly(draft.response_component_kinds))
    .map((r) => ({
    ...r,
    id: r.id.trim(),
    kind: r.kind.trim(),
    label: isNoInputComponentKind(r.kind)
      ? r.label?.trim() || defaultLabelForKind(r.kind)
      : r.label?.trim() || defaultLabelForKind(r.kind),
    required: isNoInputComponentKind(r.kind) ? false : r.required,
    config: r.config && Object.keys(r.config).length ? r.config : undefined,
  }))

  const stimulusKindsFromSchema = uniqueKindsFromSchemaRows(stimulus_schema)
  const responseKindsFromSchema = uniqueKindsFromSchemaRows(response_schema)

  const finalStimulusSchema =
    sideIsNoInputOnly(draft.stimulus_component_kinds) && stimulus_schema.length === 0
      ? [noInputSchemaRow()]
      : stimulus_schema
  const finalResponseSchema =
    sideIsNoInputOnly(draft.response_component_kinds) && response_schema.length === 0
      ? [noInputSchemaRow()]
      : response_schema

  return {
    ...draft,
    key: draft.key.trim(),
    display_name: draft.display_name.trim(),
    description: draft.description?.trim() || null,
    group_ids: normalizeGroupIds(draft.group_ids),
    stimulus_component_kinds:
      stimulusKindsFromSchema.length > 0 ? stimulusKindsFromSchema : [...draft.stimulus_component_kinds],
    response_component_kinds:
      responseKindsFromSchema.length > 0 ? responseKindsFromSchema : [...draft.response_component_kinds],
    stimulus_schema: finalStimulusSchema,
    response_schema: finalResponseSchema,
  }
}

function seedSchemaFromKinds(kinds: string[]): DynamicElementDefinition[] {
  return kinds.map((k, i) => ({
    id: `${(k || "field").toLowerCase().replace(/[^a-z0-9]+/g, "_") || "field"}_${i + 1}`,
    kind: k,
    label: defaultLabelForKind(k),
    required: true,
  }))
}

/** Fills empty schema arrays from selected kinds before validation or save. */
export function seedSchemasFromKindsIfEmpty(
  draft: QuestionTypeDefinitionCreatePayload,
): QuestionTypeDefinitionCreatePayload {
  const next = { ...draft }
  if (!next.stimulus_schema.length && sideIsNoInputOnly(next.stimulus_component_kinds)) {
    next.stimulus_schema = [noInputSchemaRow()]
  } else if (!next.stimulus_schema.length && next.stimulus_component_kinds.length) {
    next.stimulus_schema = seedSchemaFromKinds(next.stimulus_component_kinds)
  }
  if (!next.response_schema.length && sideIsNoInputOnly(next.response_component_kinds)) {
    next.response_schema = [noInputSchemaRow()]
  } else if (!next.response_schema.length && next.response_component_kinds.length) {
    next.response_schema = seedSchemaFromKinds(next.response_component_kinds)
  }
  return next
}

/** Validates fields required through the given wizard step (1 = basics only). */
export function validateDefinitionThroughStep(
  step: number,
  draft: QuestionTypeDefinitionCreatePayload,
  catalog: QuestionComponentCatalog,
  catalogForSchema: { stimulus: Set<string>; response: Set<string> },
): FieldErrorMap {
  const errors = validateDefinitionBasic(draft)
  if (step < 2) return errors

  Object.assign(errors, validateDefinitionKinds(draft, catalog))
  const prepared = seedSchemasFromKindsIfEmpty(draft)
  Object.assign(errors, validateDefinitionSchemas(prepared, catalogForSchema))
  return errors
}

/** Compares drafts by normalized API payload (ignores inconsequential ordering). */
export function areDefinitionDraftsEqual(
  a: QuestionTypeDefinitionCreatePayload,
  b: QuestionTypeDefinitionCreatePayload,
): boolean {
  const fingerprint = (draft: QuestionTypeDefinitionCreatePayload) =>
    JSON.stringify(buildCreatePayload(seedSchemasFromKindsIfEmpty(draft)))
  return fingerprint(a) === fingerprint(b)
}
