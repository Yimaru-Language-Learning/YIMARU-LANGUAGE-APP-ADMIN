export interface ClozeTextSegment {
  type: "text"
  value: string
}

export interface ClozeBlankSegment {
  type: "blank"
  id: string
}

export type ClozeSegment = ClozeTextSegment | ClozeBlankSegment

export interface WordBankItem {
  id: string
  text: string
}

export interface SelectMissingWordsStimulusValue {
  segments: ClozeSegment[]
  word_bank: WordBankItem[]
  allow_reuse: boolean
}

export interface ClozeBlankAnswer {
  blank_id: string
  text: string
  word_id: string
}

export interface SelectMissingWordsResponseValue {
  blanks: ClozeBlankAnswer[]
}

export const SELECT_MISSING_WORDS_MIN_BANK = 2
export const SELECT_MISSING_WORDS_MIN_BLANKS = 1

const DEFAULT_BLANK_COUNT = 2
const DEFAULT_WORD_BANK_COUNT = 4

function reindexBlankSegments(segments: ClozeSegment[]): ClozeSegment[] {
  let blankIndex = 0
  return segments.map((segment) => {
    if (segment.type !== "blank") return segment
    blankIndex += 1
    return { type: "blank", id: `b${blankIndex}` }
  })
}

function reindexWordBank(items: WordBankItem[]): WordBankItem[] {
  return items.map((item, index) => ({
    id: `w${index + 1}`,
    text: item.text,
  }))
}

function normalizeTextSegment(raw: unknown, index: number): ClozeTextSegment {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    if (record.type === "text") {
      return {
        type: "text",
        value: String(record.value ?? ""),
      }
    }
  }
  return { type: "text", value: index === 0 ? "" : "" }
}

function normalizeBlankSegment(raw: unknown, index: number): ClozeBlankSegment {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    if (record.type === "blank") {
      return {
        type: "blank",
        id: String(record.id ?? `b${index + 1}`),
      }
    }
  }
  return { type: "blank", id: `b${index + 1}` }
}

function normalizeSegment(raw: unknown, index: number): ClozeSegment {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    if (record.type === "blank") return normalizeBlankSegment(raw, index)
    if (record.type === "text") return normalizeTextSegment(raw, index)
  }
  return { type: "text", value: "" }
}

function normalizeWordBankItem(raw: unknown, index: number): WordBankItem {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return {
      id: String(record.id ?? `w${index + 1}`),
      text: String(record.text ?? ""),
    }
  }
  return { id: `w${index + 1}`, text: "" }
}

export function defaultSelectMissingWordsStimulusSlotValue(
  blankCount = DEFAULT_BLANK_COUNT,
  wordBankCount = DEFAULT_WORD_BANK_COUNT,
): SelectMissingWordsStimulusValue {
  const segments: ClozeSegment[] = [{ type: "text", value: "" }]
  for (let index = 0; index < blankCount; index += 1) {
    segments.push({ type: "blank", id: `b${index + 1}` })
    segments.push({ type: "text", value: "" })
  }
  return {
    segments,
    word_bank: Array.from({ length: wordBankCount }, (_, index) => ({
      id: `w${index + 1}`,
      text: "",
    })),
    allow_reuse: false,
  }
}

export function blankIdsFromStimulus(
  stimulus: SelectMissingWordsStimulusValue,
): string[] {
  return stimulus.segments
    .filter((segment): segment is ClozeBlankSegment => segment.type === "blank")
    .map((segment) => segment.id)
}

export function defaultSelectMissingWordsResponseFromStimulus(
  stimulus: SelectMissingWordsStimulusValue,
): SelectMissingWordsResponseValue {
  return {
    blanks: blankIdsFromStimulus(stimulus).map((blankId) => ({
      blank_id: blankId,
      text: "",
      word_id: "",
    })),
  }
}

export function serializeSelectMissingWordsStimulusSlotValue(
  value: SelectMissingWordsStimulusValue,
): string {
  return JSON.stringify(value)
}

export function serializeSelectMissingWordsResponseSlotValue(
  value: SelectMissingWordsResponseValue,
): string {
  return JSON.stringify(value)
}

export function wordBankItemHasValue(text: string): boolean {
  return text.length > 0
}

function ensureMinWordBank(
  value: SelectMissingWordsStimulusValue,
): SelectMissingWordsStimulusValue {
  const wordBank = [...value.word_bank]
  while (wordBank.length < SELECT_MISSING_WORDS_MIN_BANK) {
    wordBank.push({ id: `w${wordBank.length + 1}`, text: "" })
  }
  return {
    ...value,
    segments:
      value.segments.length > 0
        ? reindexBlankSegments(value.segments)
        : defaultSelectMissingWordsStimulusSlotValue().segments,
    word_bank: reindexWordBank(wordBank),
  }
}

export function normalizeSelectMissingWordsStimulusValue(
  raw: unknown,
): SelectMissingWordsStimulusValue {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    const segments = Array.isArray(record.segments)
      ? record.segments.map((segment, index) => normalizeSegment(segment, index))
      : []
    const wordBank = Array.isArray(record.word_bank)
      ? record.word_bank.map((item, index) => normalizeWordBankItem(item, index))
      : []
    if (segments.length > 0 || wordBank.length > 0) {
      return ensureMinWordBank({
        segments,
        word_bank: wordBank,
        allow_reuse: Boolean(record.allow_reuse),
      })
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      return normalizeSelectMissingWordsStimulusValue(JSON.parse(raw) as unknown)
    } catch {
      return defaultSelectMissingWordsStimulusSlotValue()
    }
  }

  return defaultSelectMissingWordsStimulusSlotValue()
}

function normalizeBlankAnswer(raw: unknown, index: number): ClozeBlankAnswer {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return {
      blank_id: String(record.blank_id ?? record.blankId ?? `b${index + 1}`),
      text: String(record.text ?? ""),
      word_id: String(record.word_id ?? record.wordId ?? ""),
    }
  }
  return { blank_id: `b${index + 1}`, text: "", word_id: "" }
}

export function normalizeSelectMissingWordsResponseValue(
  raw: unknown,
): SelectMissingWordsResponseValue {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    if (Array.isArray(record.blanks)) {
      return {
        blanks: record.blanks.map((blank, index) =>
          normalizeBlankAnswer(blank, index),
        ),
      }
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      return normalizeSelectMissingWordsResponseValue(JSON.parse(raw) as unknown)
    } catch {
      return { blanks: [] }
    }
  }

  return { blanks: [] }
}

export function parseSelectMissingWordsStimulusSlotValue(
  raw: string | undefined,
): SelectMissingWordsStimulusValue {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return defaultSelectMissingWordsStimulusSlotValue()
  try {
    return ensureMinWordBank(
      normalizeSelectMissingWordsStimulusValue(JSON.parse(trimmed) as unknown),
    )
  } catch {
    return defaultSelectMissingWordsStimulusSlotValue()
  }
}

export function parseSelectMissingWordsResponseSlotValue(
  raw: string | undefined,
  stimulus?: SelectMissingWordsStimulusValue | null,
): SelectMissingWordsResponseValue {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) {
    return stimulus
      ? defaultSelectMissingWordsResponseFromStimulus(stimulus)
      : { blanks: [] }
  }
  try {
    const parsed = normalizeSelectMissingWordsResponseValue(
      JSON.parse(trimmed) as unknown,
    )
    if (parsed.blanks.length > 0) return parsed
    return stimulus
      ? defaultSelectMissingWordsResponseFromStimulus(stimulus)
      : parsed
  } catch {
    return stimulus
      ? defaultSelectMissingWordsResponseFromStimulus(stimulus)
      : { blanks: [] }
  }
}

export function selectMissingWordsStimulusHasContent(
  value: SelectMissingWordsStimulusValue,
): boolean {
  return (
    value.segments.some(
      (segment) =>
        segment.type === "blank" ||
        (segment.type === "text" && segment.value.length > 0),
    ) || value.word_bank.some((item) => wordBankItemHasValue(item.text))
  )
}

export function selectMissingWordsResponseHasContent(
  value: SelectMissingWordsResponseValue,
): boolean {
  return value.blanks.some(
    (blank) =>
      blank.blank_id.trim().length > 0 &&
      blank.word_id.trim().length > 0 &&
      blank.text.length > 0,
  )
}

export function finalizeSelectMissingWordsStimulusPayload(
  value: SelectMissingWordsStimulusValue,
): SelectMissingWordsStimulusValue {
  return {
    segments: value.segments.map((segment) =>
      segment.type === "text"
        ? { type: "text", value: segment.value }
        : { type: "blank", id: segment.id },
    ),
    word_bank: value.word_bank
      .filter((item) => wordBankItemHasValue(item.text))
      .map((item) => ({ id: item.id, text: item.text })),
    allow_reuse: value.allow_reuse,
  }
}

export function finalizeSelectMissingWordsResponsePayload(
  value: SelectMissingWordsResponseValue,
): SelectMissingWordsResponseValue {
  return {
    blanks: value.blanks
      .filter(
        (blank) =>
          blank.blank_id.trim().length > 0 &&
          blank.word_id.trim().length > 0 &&
          blank.text.length > 0,
      )
      .map((blank) => ({
        blank_id: blank.blank_id,
        text: blank.text,
        word_id: blank.word_id,
      })),
  }
}

export function addWordBankItem(
  value: SelectMissingWordsStimulusValue,
): SelectMissingWordsStimulusValue {
  const next = ensureMinWordBank(value)
  return {
    ...next,
    word_bank: reindexWordBank([
      ...next.word_bank,
      { id: `w${next.word_bank.length + 1}`, text: "" },
    ]),
  }
}

export function removeWordBankItem(
  value: SelectMissingWordsStimulusValue,
  index: number,
): SelectMissingWordsStimulusValue {
  if (value.word_bank.length <= SELECT_MISSING_WORDS_MIN_BANK) return value
  return ensureMinWordBank({
    ...value,
    word_bank: value.word_bank.filter((_, itemIndex) => itemIndex !== index),
  })
}

export function addTextSegment(
  value: SelectMissingWordsStimulusValue,
): SelectMissingWordsStimulusValue {
  return {
    ...value,
    segments: [...value.segments, { type: "text", value: "" }],
  }
}

export function addBlankSegment(
  value: SelectMissingWordsStimulusValue,
): SelectMissingWordsStimulusValue {
  const blankCount = blankIdsFromStimulus(value).length
  return ensureMinWordBank({
    ...value,
    segments: [
      ...value.segments,
      { type: "blank", id: `b${blankCount + 1}` },
    ],
  })
}

export function removeSegment(
  value: SelectMissingWordsStimulusValue,
  index: number,
): SelectMissingWordsStimulusValue {
  if (value.segments.length <= 1) return value
  return ensureMinWordBank({
    ...value,
    segments: value.segments.filter((_, segmentIndex) => segmentIndex !== index),
  })
}

export function updateTextSegment(
  value: SelectMissingWordsStimulusValue,
  index: number,
  text: string,
): SelectMissingWordsStimulusValue {
  const segments = [...value.segments]
  const segment = segments[index]
  if (!segment || segment.type !== "text") return value
  segments[index] = { type: "text", value: text }
  return { ...value, segments }
}

export function updateWordBankText(
  value: SelectMissingWordsStimulusValue,
  index: number,
  text: string,
): SelectMissingWordsStimulusValue {
  const wordBank = [...value.word_bank]
  if (!wordBank[index]) return value
  wordBank[index] = { ...wordBank[index], text }
  return { ...value, word_bank: wordBank }
}

export function setAllowReuse(
  value: SelectMissingWordsStimulusValue,
  allowReuse: boolean,
): SelectMissingWordsStimulusValue {
  return { ...value, allow_reuse: allowReuse }
}

export function syncResponseBlanksWithStimulus(
  response: SelectMissingWordsResponseValue,
  stimulus: SelectMissingWordsStimulusValue,
): SelectMissingWordsResponseValue {
  const blankIds = blankIdsFromStimulus(stimulus)
  const existing = new Map(
    response.blanks.map((blank) => [blank.blank_id, blank]),
  )
  return {
    blanks: blankIds.map((blankId) => {
      const current = existing.get(blankId)
      return (
        current ?? {
          blank_id: blankId,
          text: "",
          word_id: "",
        }
      )
    }),
  }
}

export function validateSelectMissingWordsStimulusSlotValue(
  value: SelectMissingWordsStimulusValue,
): string | null {
  const blankCount = blankIdsFromStimulus(value).length
  if (blankCount < SELECT_MISSING_WORDS_MIN_BLANKS) {
    return `Add at least ${SELECT_MISSING_WORDS_MIN_BLANKS} blank in the passage.`
  }
  const filledWords = value.word_bank.filter((item) =>
    wordBankItemHasValue(item.text),
  )
  if (filledWords.length < SELECT_MISSING_WORDS_MIN_BANK) {
    return `Add at least ${SELECT_MISSING_WORDS_MIN_BANK} words in the word bank.`
  }
  return null
}

export function validateSelectMissingWordsResponseSlotValue(
  value: SelectMissingWordsResponseValue,
  stimulus?: SelectMissingWordsStimulusValue | null,
): string | null {
  const filled = value.blanks.filter(
    (blank) =>
      blank.blank_id.trim() &&
      blank.word_id.trim() &&
      blank.text.length > 0,
  )
  if (filled.length < SELECT_MISSING_WORDS_MIN_BLANKS) {
    return "Select a word for each blank."
  }

  const blankIds = new Set(stimulus ? blankIdsFromStimulus(stimulus) : [])
  const wordIds = new Set(
    stimulus?.word_bank
      .filter((item) => wordBankItemHasValue(item.text))
      .map((item) => item.id) ?? [],
  )
  const wordTextById = new Map(
    stimulus?.word_bank.map((item) => [item.id, item.text]) ?? [],
  )

  for (const blank of filled) {
    if (blankIds.size > 0 && !blankIds.has(blank.blank_id)) {
      return `Unknown blank id "${blank.blank_id}".`
    }
    if (wordIds.size > 0 && !wordIds.has(blank.word_id)) {
      return `Unknown word id "${blank.word_id}" for blank "${blank.blank_id}".`
    }
    const expectedText = wordTextById.get(blank.word_id)
    if (expectedText !== undefined && blank.text !== expectedText) {
      return `Answer text for blank "${blank.blank_id}" must match the selected word.`
    }
  }

  if (stimulus && !stimulus.allow_reuse) {
    const usedWordIds = filled.map((blank) => blank.word_id)
    const unique = new Set(usedWordIds)
    if (unique.size !== usedWordIds.length) {
      return "Each word can only be used once when reuse is disabled."
    }
  }

  return null
}

export function findSelectMissingWordsStimulusInFieldValues(
  fieldValues: Record<string, string>,
  stimulusSchema: { id: string; kind: string }[],
): SelectMissingWordsStimulusValue | null {
  for (const row of stimulusSchema) {
    if (row.kind.trim().toUpperCase() !== "SELECT_MISSING_WORDS") continue
    const parsed = parseSelectMissingWordsStimulusSlotValue(
      fieldValues[`stimulus:${row.id}`],
    )
    if (selectMissingWordsStimulusHasContent(parsed)) return parsed
  }
  return null
}
