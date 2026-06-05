/** Author-facing default labels for dynamic schema slots. */
const KIND_DEFAULT_LABELS: Record<string, string> = {
  QUESTION_TEXT: "Question prompt",
  PREP_TIME: "Preparation time (seconds)",
  INSTRUCTION: "Instructions",
  AUDIO_PROMPT: "Audio",
  TEXT_PASSAGE: "Reading passage",
  IMAGE: "Image",
  MATCHING_INPUTS: "Matching inputs",
  SELECT_MISSING_WORDS: "Select missing words",
  TABLE: "Reference table",
  PDF_ATTACHMENT: "PDF document",
  AUDIO_RESPONSE: "Audio response",
  TEXT_INPUT: "Text input",
  SHORT_ANSWER: "Short answer",
  MULTIPLE_CHOICE: "Multiple choice",
  OPTION: "Answer choices",
  ANSWER_TIMER: "Time limit (seconds)",
  PDF_UPLOAD: "PDF upload",
  MATCHING_ANSWER: "Matching answer",
  LABEL_SELECTION: "Label selection",
  SEQUENCE_ORDER: "Sequence order",
}

export function humanizeKind(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function defaultLabelForKind(kind: string): string {
  const k = kind.trim()
  return KIND_DEFAULT_LABELS[k] ?? humanizeKind(k)
}

export function slotLabel(schema: { label?: string | null; kind: string }): string {
  const trimmed = schema.label?.trim()
  if (trimmed) return trimmed
  return defaultLabelForKind(schema.kind)
}
