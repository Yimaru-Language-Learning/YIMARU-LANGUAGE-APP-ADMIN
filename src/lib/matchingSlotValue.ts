export interface MatchingSideItem {
  id: string
  text: string
}

export interface MatchingInputsSlotValue {
  left: MatchingSideItem[]
  right: MatchingSideItem[]
}

export interface MatchingPair {
  left_id: string
  right_id: string
}

export interface MatchingAnswerSlotValue {
  pairs: MatchingPair[]
}

export const MATCHING_MIN_ITEMS = 2

const DEFAULT_INPUT_COUNT = 4

function reindexSide(
  items: MatchingSideItem[],
  prefix: "l" | "r",
): MatchingSideItem[] {
  return items.map((item, index) => ({
    id: `${prefix}${index + 1}`,
    text: item.text,
  }))
}

export function defaultMatchingInputsSlotValue(
  count = DEFAULT_INPUT_COUNT,
): MatchingInputsSlotValue {
  return {
    left: Array.from({ length: count }, (_, index) => ({
      id: `l${index + 1}`,
      text: "",
    })),
    right: Array.from({ length: count }, (_, index) => ({
      id: `r${index + 1}`,
      text: "",
    })),
  }
}

export function defaultMatchingAnswerFromInputs(
  inputs: MatchingInputsSlotValue,
): MatchingAnswerSlotValue {
  const count = Math.min(inputs.left.length, inputs.right.length)
  return {
    pairs: Array.from({ length: count }, (_, index) => ({
      left_id: inputs.left[index]?.id ?? `l${index + 1}`,
      right_id: inputs.right[index]?.id ?? `r${index + 1}`,
    })),
  }
}

export function serializeMatchingInputsSlotValue(
  value: MatchingInputsSlotValue,
): string {
  return JSON.stringify(value)
}

export function serializeMatchingAnswerSlotValue(
  value: MatchingAnswerSlotValue,
): string {
  return JSON.stringify(value)
}

export function matchingItemHasValue(text: string): boolean {
  return text.length > 0
}

function normalizeSideItem(raw: unknown, index: number, prefix: "l" | "r"): MatchingSideItem {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return {
      id: String(record.id ?? `${prefix}${index + 1}`),
      text: String(record.text ?? ""),
    }
  }
  return {
    id: `${prefix}${index + 1}`,
    text: String(raw ?? ""),
  }
}

export function normalizeMatchingInputsValue(raw: unknown): MatchingInputsSlotValue {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    const left = Array.isArray(record.left)
      ? record.left.map((item, index) => normalizeSideItem(item, index, "l"))
      : []
    const right = Array.isArray(record.right)
      ? record.right.map((item, index) => normalizeSideItem(item, index, "r"))
      : []
    if (left.length > 0 || right.length > 0) {
      return ensureMinMatchingInputs({ left, right })
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      return normalizeMatchingInputsValue(JSON.parse(raw) as unknown)
    } catch {
      return defaultMatchingInputsSlotValue()
    }
  }

  return defaultMatchingInputsSlotValue()
}

function normalizePair(raw: unknown, index: number): MatchingPair {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return {
      left_id: String(record.left_id ?? record.leftId ?? `l${index + 1}`),
      right_id: String(record.right_id ?? record.rightId ?? `r${index + 1}`),
    }
  }
  return {
    left_id: `l${index + 1}`,
    right_id: `r${index + 1}`,
  }
}

export function normalizeMatchingAnswerValue(raw: unknown): MatchingAnswerSlotValue {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    if (Array.isArray(record.pairs)) {
      return {
        pairs: record.pairs.map((pair, index) => normalizePair(pair, index)),
      }
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      return normalizeMatchingAnswerValue(JSON.parse(raw) as unknown)
    } catch {
      return { pairs: [] }
    }
  }

  return { pairs: [] }
}

export function ensureMinMatchingInputs(
  value: MatchingInputsSlotValue,
): MatchingInputsSlotValue {
  const left = [...value.left]
  const right = [...value.right]
  while (left.length < MATCHING_MIN_ITEMS) {
    left.push({ id: `l${left.length + 1}`, text: "" })
  }
  while (right.length < MATCHING_MIN_ITEMS) {
    right.push({ id: `r${right.length + 1}`, text: "" })
  }
  return {
    left: reindexSide(left, "l"),
    right: reindexSide(right, "r"),
  }
}

export function parseMatchingInputsSlotValue(
  raw: string | undefined,
): MatchingInputsSlotValue {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return defaultMatchingInputsSlotValue()
  try {
    return ensureMinMatchingInputs(
      normalizeMatchingInputsValue(JSON.parse(trimmed) as unknown),
    )
  } catch {
    return defaultMatchingInputsSlotValue()
  }
}

export function parseMatchingAnswerSlotValue(
  raw: string | undefined,
  inputs?: MatchingInputsSlotValue | null,
): MatchingAnswerSlotValue {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) {
    return inputs ? defaultMatchingAnswerFromInputs(inputs) : { pairs: [] }
  }
  try {
    const parsed = normalizeMatchingAnswerValue(JSON.parse(trimmed) as unknown)
    if (parsed.pairs.length > 0) return parsed
    return inputs ? defaultMatchingAnswerFromInputs(inputs) : parsed
  } catch {
    return inputs ? defaultMatchingAnswerFromInputs(inputs) : { pairs: [] }
  }
}

export function matchingInputsSlotHasContent(
  value: MatchingInputsSlotValue,
): boolean {
  return (
    value.left.some((item) => matchingItemHasValue(item.text)) ||
    value.right.some((item) => matchingItemHasValue(item.text))
  )
}

export function matchingAnswerSlotHasContent(
  value: MatchingAnswerSlotValue,
): boolean {
  return value.pairs.some(
    (pair) => pair.left_id.trim().length > 0 && pair.right_id.trim().length > 0,
  )
}

export function finalizeMatchingInputsPayload(
  value: MatchingInputsSlotValue,
): MatchingInputsSlotValue {
  return {
    left: value.left
      .filter((item) => matchingItemHasValue(item.text))
      .map((item) => ({ id: item.id, text: item.text })),
    right: value.right
      .filter((item) => matchingItemHasValue(item.text))
      .map((item) => ({ id: item.id, text: item.text })),
  }
}

export function finalizeMatchingAnswerPayload(
  value: MatchingAnswerSlotValue,
): MatchingAnswerSlotValue {
  return {
    pairs: value.pairs
      .filter(
        (pair) => pair.left_id.trim().length > 0 && pair.right_id.trim().length > 0,
      )
      .map((pair) => ({
        left_id: pair.left_id,
        right_id: pair.right_id,
      })),
  }
}

export function addMatchingInputRow(
  value: MatchingInputsSlotValue,
): MatchingInputsSlotValue {
  return ensureMinMatchingInputs({
    left: [...value.left, { id: `l${value.left.length + 1}`, text: "" }],
    right: [...value.right, { id: `r${value.right.length + 1}`, text: "" }],
  })
}

export function removeMatchingInputRow(
  value: MatchingInputsSlotValue,
  index: number,
): MatchingInputsSlotValue {
  if (value.left.length <= MATCHING_MIN_ITEMS) return value
  return ensureMinMatchingInputs({
    left: value.left.filter((_, i) => i !== index),
    right: value.right.filter((_, i) => i !== index),
  })
}

export function addMatchingPair(
  value: MatchingAnswerSlotValue,
  inputs?: MatchingInputsSlotValue | null,
): MatchingAnswerSlotValue {
  const left = inputs?.left ?? []
  const right = inputs?.right ?? []
  const nextIndex = value.pairs.length
  return {
    pairs: [
      ...value.pairs,
      {
        left_id: left[nextIndex]?.id ?? left[0]?.id ?? "l1",
        right_id: right[nextIndex]?.id ?? right[0]?.id ?? "r1",
      },
    ],
  }
}

export function removeMatchingPair(
  value: MatchingAnswerSlotValue,
  index: number,
): MatchingAnswerSlotValue {
  if (value.pairs.length <= 1) return value
  return {
    pairs: value.pairs.filter((_, i) => i !== index),
  }
}

export function validateMatchingInputsSlotValue(
  value: MatchingInputsSlotValue,
): string | null {
  if (
    value.left.length < MATCHING_MIN_ITEMS ||
    value.right.length < MATCHING_MIN_ITEMS
  ) {
    return `Add at least ${MATCHING_MIN_ITEMS} items on each side.`
  }
  const filledLeft = value.left.filter((item) => matchingItemHasValue(item.text))
  const filledRight = value.right.filter((item) => matchingItemHasValue(item.text))
  if (filledLeft.length < MATCHING_MIN_ITEMS) {
    return `Add at least ${MATCHING_MIN_ITEMS} left-side items with text.`
  }
  if (filledRight.length < MATCHING_MIN_ITEMS) {
    return `Add at least ${MATCHING_MIN_ITEMS} right-side items with text.`
  }
  return null
}

export function validateMatchingAnswerSlotValue(
  value: MatchingAnswerSlotValue,
  inputs?: MatchingInputsSlotValue | null,
): string | null {
  const pairs = value.pairs.filter(
    (pair) => pair.left_id.trim() && pair.right_id.trim(),
  )
  if (pairs.length < 1) return "Add at least one matching pair."
  const leftIds = new Set(inputs?.left.map((item) => item.id) ?? [])
  const rightIds = new Set(inputs?.right.map((item) => item.id) ?? [])
  const usedLeft = new Set<string>()
  for (const pair of pairs) {
    if (inputs && leftIds.size > 0 && !leftIds.has(pair.left_id)) {
      return `Unknown left id "${pair.left_id}" in matching answer.`
    }
    if (inputs && rightIds.size > 0 && !rightIds.has(pair.right_id)) {
      return `Unknown right id "${pair.right_id}" in matching answer.`
    }
    if (usedLeft.has(pair.left_id)) {
      return `Duplicate left id "${pair.left_id}" in matching answer.`
    }
    usedLeft.add(pair.left_id)
  }
  return null
}

export function findMatchingInputsInFieldValues(
  fieldValues: Record<string, string>,
  stimulusSchema: { id: string; kind: string }[],
  responseSchema: { id: string; kind: string }[],
): MatchingInputsSlotValue | null {
  for (const row of stimulusSchema) {
    if (row.kind.trim().toUpperCase() !== "MATCHING_INPUTS") continue
    const parsed = parseMatchingInputsSlotValue(fieldValues[`stimulus:${row.id}`])
    if (matchingInputsSlotHasContent(parsed)) return parsed
  }
  for (const row of responseSchema) {
    if (row.kind.trim().toUpperCase() !== "MATCHING_INPUTS") continue
    const parsed = parseMatchingInputsSlotValue(fieldValues[`response:${row.id}`])
    if (matchingInputsSlotHasContent(parsed)) return parsed
  }
  return null
}

type SchemaSideRow = {
  side: "stimulus" | "response"
  row: { id: string; kind: string }
}

function matchingFamilyRows(
  stimulusSchema: { id: string; kind: string }[],
  responseSchema: { id: string; kind: string }[],
  kind: "MATCHING_INPUTS" | "MATCHING_ANSWER",
): SchemaSideRow[] {
  const want = kind
  const out: SchemaSideRow[] = []
  for (const row of stimulusSchema) {
    if (row.kind.trim().toUpperCase() === want) out.push({ side: "stimulus", row })
  }
  for (const row of responseSchema) {
    if (row.kind.trim().toUpperCase() === want) out.push({ side: "response", row })
  }
  return out
}

/**
 * Pair the Nth MATCHING_ANSWER slot with the Nth MATCHING_INPUTS slot (schema order:
 * stimulus then response). Falls back to first-of-kind when the positional target is empty.
 */
export function findMatchingInputsForAnswerRow(
  fieldValues: Record<string, string>,
  stimulusSchema: { id: string; kind: string }[],
  responseSchema: { id: string; kind: string }[],
  answerSide: "stimulus" | "response",
  answerRowId: string,
): MatchingInputsSlotValue | null {
  const inputRows = matchingFamilyRows(stimulusSchema, responseSchema, "MATCHING_INPUTS")
  const answerRows = matchingFamilyRows(stimulusSchema, responseSchema, "MATCHING_ANSWER")
  const idx = answerRows.findIndex(
    (x) => x.side === answerSide && x.row.id === answerRowId,
  )
  const target = idx >= 0 ? inputRows[idx] : undefined
  if (target) {
    const parsed = parseMatchingInputsSlotValue(
      fieldValues[`${target.side}:${target.row.id}`],
    )
    if (matchingInputsSlotHasContent(parsed)) return parsed
  }
  return findMatchingInputsInFieldValues(fieldValues, stimulusSchema, responseSchema)
}
