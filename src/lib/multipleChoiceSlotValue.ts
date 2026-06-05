export interface MultipleChoiceOptionValue {
  id: string
  text: string
  is_correct: boolean
}

export interface MultipleChoiceSlotValue {
  options: MultipleChoiceOptionValue[]
}

const DEFAULT_OPTION_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const

export function defaultMultipleChoiceSlotValue(
  count = 4,
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

export function parseMultipleChoiceSlotValue(
  raw: string | undefined,
): MultipleChoiceSlotValue {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return defaultMultipleChoiceSlotValue()
  try {
    const parsed = JSON.parse(trimmed) as unknown
    return normalizeMultipleChoiceValue(parsed)
  } catch {
    return defaultMultipleChoiceSlotValue()
  }
}

export function normalizeMultipleChoiceValue(
  raw: unknown,
  mcqOptions?: { option_text?: string; text?: string; is_correct?: boolean; isCorrect?: boolean }[],
): MultipleChoiceSlotValue {
  if (mcqOptions?.some((o) => (o.option_text ?? o.text ?? "").trim())) {
    return {
      options: mcqOptions
        .map((option, index) => ({
          id: DEFAULT_OPTION_IDS[index] ?? String(index + 1),
          text: (option.option_text ?? option.text ?? "").trim(),
          is_correct: Boolean(option.is_correct ?? option.isCorrect),
        }))
        .filter((option) => option.text),
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
      text: String(record.text ?? record.option_text ?? "").trim(),
      is_correct: Boolean(record.is_correct ?? record.isCorrect),
    }
  }
  return {
    id: DEFAULT_OPTION_IDS[index] ?? String(index + 1),
    text: String(raw ?? "").trim(),
    is_correct: false,
  }
}

export function multipleChoiceSlotHasContent(
  value: MultipleChoiceSlotValue,
): boolean {
  return value.options.some((option) => option.text.trim())
}

export function validateMultipleChoiceSlotValue(
  value: MultipleChoiceSlotValue,
): string | null {
  const filled = value.options.filter((option) => option.text.trim())
  if (filled.length < 2) return "Add at least two choices with text."
  if (!filled.some((option) => option.is_correct)) {
    return "Mark one choice as correct."
  }
  return null
}
