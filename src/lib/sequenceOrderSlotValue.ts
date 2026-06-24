export interface SequenceOrderItem {
  id: string
  text: string
}

export interface SequenceOrderSlotValue {
  items: SequenceOrderItem[]
  correct_order: string[]
}

export const SEQUENCE_ORDER_MIN_ITEMS = 2
export const SEQUENCE_ORDER_MAX_ITEMS = 12

const DEFAULT_ITEM_COUNT = 4

function nextStableId(prefix: string, existingIds: string[]): string {
  let max = 0
  for (const id of existingIds) {
    const match = id.match(new RegExp(`^${prefix}(\\d+)$`))
    if (match) max = Math.max(max, Number.parseInt(match[1], 10))
  }
  return `${prefix}${max + 1}`
}

function normalizeItem(raw: unknown, index: number): SequenceOrderItem {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return {
      id: String(record.id ?? `s${index + 1}`),
      text: String(record.text ?? ""),
    }
  }
  return { id: `s${index + 1}`, text: "" }
}

function orderItemsByCorrectOrder(
  items: SequenceOrderItem[],
  correctOrder: string[],
): SequenceOrderItem[] {
  if (!correctOrder.length) return items
  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered = correctOrder
    .map((id) => byId.get(id))
    .filter((item): item is SequenceOrderItem => Boolean(item))
  const orderedIds = new Set(ordered.map((item) => item.id))
  const remainder = items.filter((item) => !orderedIds.has(item.id))
  return [...ordered, ...remainder]
}

export function defaultSequenceOrderSlotValue(
  count = DEFAULT_ITEM_COUNT,
): SequenceOrderSlotValue {
  const items = Array.from({ length: count }, (_, index) => ({
    id: `s${index + 1}`,
    text: "",
  }))
  return {
    items,
    correct_order: items.map((item) => item.id),
  }
}

export function serializeSequenceOrderSlotValue(value: SequenceOrderSlotValue): string {
  return JSON.stringify(value)
}

function ensureMinItems(value: SequenceOrderSlotValue): SequenceOrderSlotValue {
  const items = [...value.items]
  const existingIds = items.map((item) => item.id)
  while (items.length < SEQUENCE_ORDER_MIN_ITEMS) {
    const id = nextStableId("s", existingIds)
    existingIds.push(id)
    items.push({ id, text: "" })
  }
  const correctOrder =
    value.correct_order.length > 0
      ? value.correct_order.filter((id) => items.some((item) => item.id === id))
      : items.map((item) => item.id)
  const missingIds = items
    .map((item) => item.id)
    .filter((id) => !correctOrder.includes(id))
  return {
    items: orderItemsByCorrectOrder(items, correctOrder),
    correct_order: [...correctOrder, ...missingIds],
  }
}

export function normalizeSequenceOrderValue(raw: unknown): SequenceOrderSlotValue {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    const items = Array.isArray(record.items)
      ? record.items.map((item, index) => normalizeItem(item, index))
      : []
    const correctOrder = Array.isArray(record.correct_order)
      ? record.correct_order.map((id) => String(id))
      : []
    if (items.length > 0) {
      return ensureMinItems({
        items,
        correct_order:
          correctOrder.length > 0 ? correctOrder : items.map((item) => item.id),
      })
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      return normalizeSequenceOrderValue(JSON.parse(raw) as unknown)
    } catch {
      return defaultSequenceOrderSlotValue()
    }
  }

  return defaultSequenceOrderSlotValue()
}

export function parseSequenceOrderSlotValue(
  raw: string | undefined,
): SequenceOrderSlotValue {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return defaultSequenceOrderSlotValue()
  try {
    return ensureMinItems(
      normalizeSequenceOrderValue(JSON.parse(trimmed) as unknown),
    )
  } catch {
    return defaultSequenceOrderSlotValue()
  }
}

export function sequenceOrderItemHasValue(text: string): boolean {
  return text.length > 0
}

export function sequenceOrderSlotHasContent(value: SequenceOrderSlotValue): boolean {
  return value.items.some((item) => sequenceOrderItemHasValue(item.text))
}

export function finalizeSequenceOrderPayload(
  value: SequenceOrderSlotValue,
): SequenceOrderSlotValue {
  const items = value.items
    .filter((item) => sequenceOrderItemHasValue(item.text))
    .map((item) => ({ id: item.id, text: item.text }))
  return {
    items,
    correct_order: items.map((item) => item.id),
  }
}

export function addSequenceOrderItem(
  value: SequenceOrderSlotValue,
  maxItems = SEQUENCE_ORDER_MAX_ITEMS,
): SequenceOrderSlotValue {
  if (value.items.length >= maxItems) return value
  const id = nextStableId(
    "s",
    value.items.map((item) => item.id),
  )
  const items = [...value.items, { id, text: "" }]
  return {
    items,
    correct_order: [...value.correct_order, id],
  }
}

export function removeSequenceOrderItem(
  value: SequenceOrderSlotValue,
  index: number,
): SequenceOrderSlotValue {
  if (value.items.length <= SEQUENCE_ORDER_MIN_ITEMS) return value
  const removed = value.items[index]
  if (!removed) return value
  const items = value.items.filter((_, itemIndex) => itemIndex !== index)
  return {
    items,
    correct_order: value.correct_order.filter((id) => id !== removed.id),
  }
}

export function updateSequenceOrderItemText(
  value: SequenceOrderSlotValue,
  index: number,
  text: string,
): SequenceOrderSlotValue {
  const items = [...value.items]
  if (!items[index]) return value
  items[index] = { ...items[index], text }
  return { ...value, items }
}

export function reorderSequenceOrderItems(
  value: SequenceOrderSlotValue,
  fromIndex: number,
  toIndex: number,
): SequenceOrderSlotValue {
  if (fromIndex === toIndex) return value
  const items = [...value.items]
  const [moved] = items.splice(fromIndex, 1)
  if (!moved) return value
  items.splice(toIndex, 0, moved)
  return {
    items,
    correct_order: items.map((item) => item.id),
  }
}

export function limitsFromSchemaConfig(
  config?: Record<string, unknown>,
): { minItems: number; maxItems: number } {
  const minRaw = config?.min_items
  const maxRaw = config?.max_items
  const minItems =
    typeof minRaw === "number" && Number.isFinite(minRaw) && minRaw >= 1
      ? Math.floor(minRaw)
      : SEQUENCE_ORDER_MIN_ITEMS
  const maxItems =
    typeof maxRaw === "number" && Number.isFinite(maxRaw) && maxRaw >= minItems
      ? Math.floor(maxRaw)
      : SEQUENCE_ORDER_MAX_ITEMS
  return { minItems, maxItems }
}

export function validateSequenceOrderSlotValue(
  value: SequenceOrderSlotValue,
  config?: Record<string, unknown>,
): string | null {
  const { minItems, maxItems } = limitsFromSchemaConfig(config)
  const filled = value.items.filter((item) => sequenceOrderItemHasValue(item.text))

  if (filled.length < minItems) {
    return `Add at least ${minItems} sequence items.`
  }
  if (value.items.length > maxItems) {
    return `Too many items (max ${maxItems}).`
  }

  const itemIds = new Set(value.items.map((item) => item.id))
  if (itemIds.size !== value.items.length) {
    return "Duplicate item id."
  }

  if (value.correct_order.length !== value.items.length) {
    return "Correct order must include every item."
  }

  for (const id of value.correct_order) {
    if (!itemIds.has(id)) {
      return `Invalid id "${id}" in correct order.`
    }
  }

  return null
}
