export interface MultipleChoiceOptionValue {
  id: string
  text: string
  is_correct: boolean
}

export interface MultipleChoiceSlotValue {
  options: MultipleChoiceOptionValue[]
}

const DEFAULT_OPTION_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const

export const MULTIPLE_CHOICE_MIN_OPTIONS = 2

export function defaultMultipleChoiceSlotValue(
  count = MULTIPLE_CHOICE_MIN_OPTIONS,
): MultipleChoiceSlotValue {
  return {
    options: Array.from({ length: count }, (_, index) => ({
      id: DEFAULT_OPTION_IDS[index] ?? String(index + 1),
      text: "",
      is_correct: index === 0,
    })),
  }
}

export function serializeMultipleChoiceSlotValue(
  value: MultipleChoiceSlotValue,
): string {
  return JSON.stringify(value)
}

export function nextMultipleChoiceOptionId(
  existing: MultipleChoiceOptionValue[],
): string {
  const used = new Set(existing.map((option) => option.id))
  for (const id of DEFAULT_OPTION_IDS) {
    if (!used.has(id)) return id
  }
  return String(existing.length + 1)
}

export function addMultipleChoiceOption(
  value: MultipleChoiceSlotValue,
): MultipleChoiceSlotValue {
  return {
    options: [
      ...value.options,
      {
        id: nextMultipleChoiceOptionId(value.options),
        text: "",
        is_correct: false,
      },
    ],
  }
}

export function removeMultipleChoiceOption(
  value: MultipleChoiceSlotValue,
  index: number,
): MultipleChoiceSlotValue {
  if (value.options.length <= MULTIPLE_CHOICE_MIN_OPTIONS) return value
  const removed = value.options[index]
  let options = value.options.filter((_, i) => i !== index)
  if (
    removed?.is_correct &&
    options.length > 0 &&
    !options.some((option) => option.is_correct)
  ) {
    options = options.map((option, i) => ({
      ...option,
      is_correct: i === 0,
    }))
  }
  return { options }
}

export function ensureMinMultipleChoiceOptions(
  value: MultipleChoiceSlotValue,
): MultipleChoiceSlotValue {
  if (value.options.length >= MULTIPLE_CHOICE_MIN_OPTIONS) return value
  const options = [...value.options]
  while (options.length < MULTIPLE_CHOICE_MIN_OPTIONS) {
    options.push({
      id: nextMultipleChoiceOptionId(options),
      text: "",
      is_correct: options.length === 0,
    })
  }
  return { options }
}

export function multipleChoiceOptionHasValue(text: string): boolean {
  return text.length > 0
}

export function parseMultipleChoiceSlotValue(
  raw: string | undefined,
): MultipleChoiceSlotValue {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return defaultMultipleChoiceSlotValue()
  try {
    const parsed = JSON.parse(trimmed) as unknown
    return ensureMinMultipleChoiceOptions(normalizeMultipleChoiceValue(parsed))
  } catch {
    return defaultMultipleChoiceSlotValue()
  }
}

export function normalizeMultipleChoiceValue(
  raw: unknown,
  mcqOptions?: { option_text?: string; text?: string; is_correct?: boolean; isCorrect?: boolean }[],
): MultipleChoiceSlotValue {
  if (mcqOptions?.some((o) => multipleChoiceOptionHasValue(o.option_text ?? o.text ?? ""))) {
    return {
      options: mcqOptions
        .map((option, index) => ({
          id: DEFAULT_OPTION_IDS[index] ?? String(index + 1),
          text: option.option_text ?? option.text ?? "",
          is_correct: Boolean(option.is_correct ?? option.isCorrect),
        }))
        .filter((option) => multipleChoiceOptionHasValue(option.text)),
    }
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    if (Array.isArray(record.options)) {
      return {
        options: record.options.map((option, index) =>
          normalizeMultipleChoiceOption(option, index),
        ),
      }
    }
  }

  if (Array.isArray(raw)) {
    return {
      options: raw.map((option, index) =>
        normalizeMultipleChoiceOption(option, index),
      ),
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      return normalizeMultipleChoiceValue(JSON.parse(raw) as unknown)
    } catch {
      return defaultMultipleChoiceSlotValue()
    }
  }

  return defaultMultipleChoiceSlotValue()
}

function normalizeMultipleChoiceOption(
  raw: unknown,
  index: number,
): MultipleChoiceOptionValue {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return {
      id: String(record.id ?? DEFAULT_OPTION_IDS[index] ?? index + 1),
      text: String(record.text ?? record.option_text ?? ""),
      is_correct: Boolean(record.is_correct ?? record.isCorrect),
    }
  }
  return {
    id: DEFAULT_OPTION_IDS[index] ?? String(index + 1),
    text: String(raw ?? ""),
    is_correct: false,
  }
}

export function multipleChoiceSlotHasContent(
  value: MultipleChoiceSlotValue,
): boolean {
  return value.options.some((option) => multipleChoiceOptionHasValue(option.text))
}

export function validateMultipleChoiceSlotValue(
  value: MultipleChoiceSlotValue,
): string | null {
  if (value.options.length < MULTIPLE_CHOICE_MIN_OPTIONS) {
    return `Add at least ${MULTIPLE_CHOICE_MIN_OPTIONS} choices.`
  }
  const filled = value.options.filter((option) =>
    multipleChoiceOptionHasValue(option.text),
  )
  if (filled.length < MULTIPLE_CHOICE_MIN_OPTIONS) {
    return `Add at least ${MULTIPLE_CHOICE_MIN_OPTIONS} choices with text.`
  }
  if (!filled.some((option) => option.is_correct)) {
    return "Mark one choice as correct."
  }
  return null
}
