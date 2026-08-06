import type { AuthoringProfile, PracticeStimulusBlock } from "../types/course.types"
import type {
  DynamicElementInstance,
  DynamicQuestionPayload,
  QuestionTypeDefinition,
} from "../types/questionTypeDefinition.types"
import {
  buildDynamicQuestionPayload,
  dynamicPayloadToFieldValues,
} from "./practiceDynamicQuestionPayload"
import {
  validateDefinitionQuestion,
  questionRowHasContent,
  isExistingBankQuestion,
  type LearnEnglishDefinitionQuestionInput,
} from "./learnEnglishDefinitionQuestion"
import { isNoInputComponentKind } from "./questionComponentKinds"
import { defaultLabelForKind } from "./schemaSlotLabel"

export const BLOCK_KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/

/** Stimulus kinds valid in practice-level blocks (no response kinds). */
export const STIMULUS_BLOCK_KINDS = [
  "QUESTION_TEXT",
  "PREP_TIME",
  "INSTRUCTION",
  "AUDIO_PROMPT",
  "TEXT_PASSAGE",
  "IMAGE",
  "MATCHING_INPUTS",
  "SELECT_MISSING_WORDS",
  "TABLE",
  "PDF_ATTACHMENT",
] as const

export type StimulusBlockKind = (typeof STIMULUS_BLOCK_KINDS)[number]

export interface PracticeFormStimulusBlockElement {
  id: string
  kind: string
  fieldValue: string
}

export interface PracticeFormStimulusBlock {
  blockKey: string
  displayOrder: number
  elements: PracticeFormStimulusBlockElement[]
}

export function isIeltsSharedStimulusMode(profile: AuthoringProfile | string | undefined): boolean {
  return profile === "IELTS_SHARED_STIMULUS"
}

export function normalizeAuthoringProfile(raw: unknown): AuthoringProfile {
  const text = String(raw ?? "").trim().toUpperCase()
  return text === "IELTS_SHARED_STIMULUS" ? "IELTS_SHARED_STIMULUS" : "STANDALONE"
}

export function suggestBlockKey(existing: PracticeFormStimulusBlock[]): string {
  let n = existing.length + 1
  let key = `section-${n}`
  const keys = new Set(existing.map((b) => b.blockKey))
  while (keys.has(key)) {
    n += 1
    key = `section-${n}`
  }
  return key
}

export function suggestBlockElementId(kind: string, existing: PracticeFormStimulusBlockElement[]): string {
  const base = kind.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
  let n = 1
  let id = `${base}_${n}`
  const ids = new Set(existing.map((e) => e.id))
  while (ids.has(id)) {
    n += 1
    id = `${base}_${n}`
  }
  return id
}

export function blockElementsFromStimulus(
  stimulus: DynamicElementInstance[],
): PracticeFormStimulusBlockElement[] {
  const fieldValues = dynamicPayloadToFieldValues({ stimulus, response: [] })
  return stimulus.map((el) => ({
    id: el.id,
    kind: el.kind,
    fieldValue: fieldValues[`stimulus:${el.id}`] ?? "",
  }))
}

export function buildBlockStimulusPayload(
  elements: PracticeFormStimulusBlockElement[],
): DynamicElementInstance[] {
  const stimulusRows = elements
    .filter((e) => !isNoInputComponentKind(e.kind))
    .map((e) => ({ id: e.id, kind: e.kind }))
  const fieldValues: Record<string, string> = {}
  for (const el of elements) {
    fieldValues[`stimulus:${el.id}`] = el.fieldValue
  }
  return buildDynamicQuestionPayload({
    stimulusRows,
    responseRows: [],
    fieldValues,
  }).stimulus
}

export function mapApiStimulusBlocksToForm(
  blocks: PracticeStimulusBlock[] | undefined,
): PracticeFormStimulusBlock[] {
  return (blocks ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((b, index) => ({
      blockKey: b.block_key,
      displayOrder: b.display_order ?? index + 1,
      elements: blockElementsFromStimulus(b.stimulus ?? []),
    }))
}

export function mapFormStimulusBlocksToApi(
  blocks: PracticeFormStimulusBlock[],
): PracticeStimulusBlock[] {
  return blocks.map((b, index) => ({
    block_key: b.blockKey.trim(),
    display_order: b.displayOrder ?? index + 1,
    stimulus: buildBlockStimulusPayload(b.elements),
  }))
}

export function validateStimulusBlocks(blocks: PracticeFormStimulusBlock[]): string | null {
  const seen = new Set<string>()
  for (const block of blocks) {
    const key = block.blockKey.trim()
    if (!key) return "Block key is required."
    if (!BLOCK_KEY_RE.test(key)) {
      return `Invalid block key: ${block.blockKey}. Use letters, digits, underscores, and hyphens only.`
    }
    if (seen.has(key)) return `Duplicate block key: ${key}`
    seen.add(key)
    for (const el of block.elements) {
      if (isNoInputComponentKind(el.kind)) continue
      const kind = el.kind.trim().toUpperCase()
      if (!STIMULUS_BLOCK_KINDS.includes(kind as StimulusBlockKind)) {
        return `Invalid stimulus component kind in block "${key}": ${el.kind}`
      }
    }
  }
  return null
}

export function validateStimulusBlockKeys(
  blocks: PracticeFormStimulusBlock[],
  questions: { stimulusBlockKey?: string | null }[],
): string | null {
  const keys = new Set(blocks.map((b) => b.blockKey.trim()))
  for (let i = 0; i < questions.length; i++) {
    const key = questions[i].stimulusBlockKey?.trim()
    if (!key) continue
    if (!keys.has(key)) {
      return `Question ${i + 1} references unknown stimulus block: ${key}`
    }
  }
  return null
}

export function getBlockStimulusByKey(
  blocks: PracticeFormStimulusBlock[],
  blockKey: string | null | undefined,
): DynamicElementInstance[] {
  const key = blockKey?.trim()
  if (!key) return []
  const block = blocks.find((b) => b.blockKey.trim() === key)
  if (!block) return []
  return buildBlockStimulusPayload(block.elements)
}

export function mergeEffectivePayload(
  blockStimulus: DynamicElementInstance[],
  questionPayload?: DynamicQuestionPayload | null,
): DynamicQuestionPayload {
  return {
    stimulus: [...blockStimulus, ...(questionPayload?.stimulus ?? [])],
    response: questionPayload?.response ?? [],
  }
}

export function validatePracticeStimulusBlocks(
  authoringProfile: AuthoringProfile,
  blocks: PracticeFormStimulusBlock[],
  questions: LearnEnglishDefinitionQuestionInput[],
  definitions: QuestionTypeDefinition[],
): string | null {
  if (!isIeltsSharedStimulusMode(authoringProfile)) return null
  const blockErr = validateStimulusBlocks(blocks)
  if (blockErr) return blockErr
  const keyErr = validateStimulusBlockKeys(blocks, questions)
  if (keyErr) return keyErr
  const byId = new Map(definitions.map((d) => [d.id, d]))
  const filled = questions.filter((q) => {
    if (isExistingBankQuestion(q)) return true
    const def = byId.get(q.questionTypeDefinitionId)
    return def ? questionRowHasContent(q, def) : false
  })
  if (filled.length === 0) {
    return "Add at least one question with content, or attach questions from the bank."
  }
  for (let i = 0; i < filled.length; i++) {
    const q = filled[i]
    if (isExistingBankQuestion(q)) continue
    const def = byId.get(q.questionTypeDefinitionId)
    if (!def) {
      return `Question ${i + 1}: type definition #${q.questionTypeDefinitionId} was not found. Refresh and try again.`
    }
    const err = validateDefinitionQuestion(def, q, i + 1)
    if (err) return err
  }
  return null
}

export function countQuestionsReferencingBlock(
  blockKey: string,
  questions: { stimulusBlockKey?: string | null }[],
): number {
  const key = blockKey.trim()
  return questions.filter((q) => q.stimulusBlockKey?.trim() === key).length
}

export function stimulusBlockKindLabel(kind: string): string {
  return defaultLabelForKind(kind)
}

export function createEmptyStimulusBlock(
  existing: PracticeFormStimulusBlock[],
): PracticeFormStimulusBlock {
  return {
    blockKey: suggestBlockKey(existing),
    displayOrder: existing.length + 1,
    elements: [],
  }
}

export function createEmptyBlockElement(
  kind: string,
  existing: PracticeFormStimulusBlockElement[],
): PracticeFormStimulusBlockElement {
  return {
    id: suggestBlockElementId(kind, existing),
    kind,
    fieldValue: "",
  }
}
