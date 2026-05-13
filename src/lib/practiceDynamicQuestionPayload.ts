import type { DynamicQuestionPayload } from "../types/questionTypeDefinition.types"

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

export function buildDynamicQuestionPayload(input: {
  stimulusRows: { id: string; kind: string }[]
  responseRows: { id: string; kind: string }[]
  fieldValues: Record<string, string>
}): DynamicQuestionPayload {
  return {
    stimulus: input.stimulusRows.map((row) => ({
      id: row.id,
      kind: row.kind,
      value: parseDynamicSlotValue(input.fieldValues[`stimulus:${row.id}`]),
    })),
    response: input.responseRows.map((row) => ({
      id: row.id,
      kind: row.kind,
      value: parseDynamicSlotValue(input.fieldValues[`response:${row.id}`]),
    })),
  }
}
