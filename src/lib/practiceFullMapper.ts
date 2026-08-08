import type {
  GetPracticeFullResponse,
  PracticeFullData,
  PracticeFullPractice,
  PracticeFullQuestionItem,
  PracticeFullQuestionSet,
  PracticeParent,
  PracticePublishStatus,
  AuthoringProfile,
  QuestionDetail,
  QuestionOption,
  QuestionShortAnswer,
  UpdatePracticeFullRequest,
} from "../types/course.types"
import type {
  DynamicElementInstance,
  DynamicQuestionPayload,
  QuestionTypeDefinition,
} from "../types/questionTypeDefinition.types"
import {
  buildCreateQuestionFromDefinition,
  definitionUsesDynamicPayload,
  dynamicPromptFromFieldValues,
  emptyDynamicFieldValuesForDefinition,
  legacyQuestionTypeFromDefinition,
  questionRowHasContent,
  type LearnEnglishDefinitionQuestionInput,
} from "./learnEnglishDefinitionQuestion"
import { normalizePracticeParents, parentsFromPractice } from "./practiceParents"
import { validatePracticeQuestionsWithDefinitions } from "./practiceCreationOrchestrator"
import {
  dynamicPayloadToFieldValues,
  slotApiValueToFieldString,
} from "./practiceDynamicQuestionPayload"
import {
  isIeltsSharedStimulusMode,
  mapApiStimulusBlocksToForm,
  mapFormStimulusBlocksToApi,
  normalizeAuthoringProfile,
  validatePracticeStimulusBlocks,
  validateStimulusBlocks,
  type PracticeFormStimulusBlock,
} from "./practiceStimulusBlocks"
import {
  resolveAssociatedQuestionId,
  validateQuestionAssociations,
} from "./questionAssociations"

export interface PracticeFormQuestionRow {
  id: string
  serverQuestionId?: number | null
  displayOrder: number
  associatedQuestionId: number | null
  associatedAnchorRowId: string | null
  prerequisiteQuestionIds?: number[]
  stimulusBlockKey: string | null
  questionTypeDefinitionId: number | null
  text: string
  difficultyLevel?: "EASY" | "MEDIUM" | "HARD"
  points?: number
  dynamicFieldValues: Record<string, string>
  sourceDynamicPayload?: DynamicQuestionPayload | null
  mcqOptions: { text: string; isCorrect: boolean }[]
  trueFalseCorrect: boolean
  shortAnswers: string[]
}

export interface PracticeFormState {
  title: string
  description: string
  storyImageUrl: string
  shuffleQuestions: boolean
  tips: string
  authoringProfile: AuthoringProfile
  stimulusBlocks: PracticeFormStimulusBlock[]
  parents: PracticeParent[]
  questions: PracticeFormQuestionRow[]
}

export interface PreservedQuestionSetFields {
  timeLimitMinutes: number | null
  passingScore: number | null
  introVideoUrl: string
  status: PracticePublishStatus
}

function defaultMcqOptions() {
  return [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function pickStr(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ""
}

function pickNum(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(record[key])
    if (Number.isFinite(value)) return value
  }
  return null
}

function isTextPromptKind(kind: string): boolean {
  const upper = kind.trim().toUpperCase()
  return (
    upper === "QUESTION_TEXT" ||
    upper === "INSTRUCTION" ||
    upper === "TEXT_PASSAGE" ||
    upper === "TEXT"
  )
}

function isAudioKind(kind: string): boolean {
  const upper = kind.trim().toUpperCase()
  return upper.includes("AUDIO") || upper.includes("VOICE")
}

function normalizeDynamicElement(raw: unknown): DynamicElementInstance | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickStr(record, "id", "Id", "ID")
  const kind = pickStr(record, "kind", "Kind")
  if (!id && !kind) return null
  return {
    id: id || kind.toLowerCase(),
    kind,
    value: record.value ?? record.Value,
  }
}

function normalizeDynamicElementArray(raw: unknown): DynamicElementInstance[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => normalizeDynamicElement(entry))
    .filter((entry): entry is DynamicElementInstance => entry != null)
}

function normalizeDynamicPayload(raw: unknown): DynamicQuestionPayload | null {
  const record = asRecord(raw)
  if (!record) return null
  return {
    stimulus: normalizeDynamicElementArray(record.stimulus ?? record.Stimulus),
    response: normalizeDynamicElementArray(record.response ?? record.Response),
  }
}

function normalizeQuestionOptions(raw: unknown): QuestionOption[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const options = raw
    .map((entry) => {
      const record = asRecord(entry)
      if (!record) return null
      return {
        option_order:
          pickNum(record, "option_order", "OptionOrder", "order", "Order") ?? 0,
        option_text: pickStr(
          record,
          "option_text",
          "OptionText",
          "text",
          "Text",
        ),
        is_correct: Boolean(record.is_correct ?? record.IsCorrect),
      }
    })
    .filter((entry): entry is QuestionOption => entry != null)
  return options.length > 0 ? options : undefined
}

function normalizeShortAnswerItems(
  raw: unknown,
): QuestionShortAnswer[] | string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const items = raw
    .map((entry) => {
      if (typeof entry === "string") return entry
      const record = asRecord(entry)
      if (!record) return null
      const acceptable = pickStr(
        record,
        "acceptable_answer",
        "AcceptableAnswer",
        "answer",
        "Answer",
      )
      if (!acceptable) return null
      const matchType = pickStr(record, "match_type", "MatchType") || "CASE_INSENSITIVE"
      return { acceptable_answer: acceptable, match_type: matchType }
    })
    .filter(
      (entry): entry is QuestionShortAnswer | string =>
        entry != null && (typeof entry === "string" || Boolean(entry.acceptable_answer)),
    )
  return items.length > 0 ? items : undefined
}

export function normalizePracticeFullQuestion(
  raw: unknown,
): PracticeFullQuestionItem | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickNum(record, "id", "Id", "ID")
  const displayOrder =
    pickNum(record, "display_order", "DisplayOrder", "displayOrder") ?? 0
  const questionType =
    pickStr(record, "question_type", "QuestionType", "questionType") || "DYNAMIC"

  return {
    ...(id != null ? { id } : {}),
    display_order: displayOrder,
    associated_question_id:
      record.associated_question_id != null
        ? Number(record.associated_question_id)
        : record.AssociatedQuestionId != null
          ? Number(record.AssociatedQuestionId)
          : null,
    prerequisite_question_ids: Array.isArray(record.prerequisite_question_ids)
      ? record.prerequisite_question_ids.map((v) => Number(v)).filter((n) => Number.isFinite(n))
      : Array.isArray(record.PrerequisiteQuestionIds)
        ? record.PrerequisiteQuestionIds.map((v) => Number(v)).filter((n) =>
            Number.isFinite(n),
          )
        : undefined,
    question_text: pickStr(record, "question_text", "QuestionText", "questionText") || undefined,
    question_type: questionType,
    question_type_definition_id:
      pickNum(
        record,
        "question_type_definition_id",
        "QuestionTypeDefinitionId",
        "questionTypeDefinitionId",
      ) ?? null,
    dynamic_payload: normalizeDynamicPayload(
      record.dynamic_payload ?? record.DynamicPayload,
    ),
    effective_dynamic_payload: normalizeDynamicPayload(
      record.effective_dynamic_payload ?? record.EffectiveDynamicPayload,
    ),
    stimulus_block_key:
      record.stimulus_block_key != null
        ? String(record.stimulus_block_key).trim() || null
        : record.StimulusBlockKey != null
          ? String(record.StimulusBlockKey).trim() || null
          : null,
    difficulty_level:
      pickStr(record, "difficulty_level", "DifficultyLevel", "difficultyLevel") ||
      undefined,
    points: pickNum(record, "points", "Points") ?? undefined,
    status:
      pickStr(record, "status", "Status") ||
      undefined,
    options: normalizeQuestionOptions(record.options ?? record.Options),
    short_answers: normalizeShortAnswerItems(
      record.short_answers ?? record.ShortAnswers,
    ),
    voice_prompt:
      pickStr(record, "voice_prompt", "VoicePrompt", "voicePrompt") || undefined,
    sample_answer_voice_prompt:
      pickStr(
        record,
        "sample_answer_voice_prompt",
        "SampleAnswerVoicePrompt",
        "sampleAnswerVoicePrompt",
      ) || undefined,
    audio_correct_answer_text:
      pickStr(
        record,
        "audio_correct_answer_text",
        "AudioCorrectAnswerText",
        "audioCorrectAnswerText",
      ) || undefined,
    image_url: pickStr(record, "image_url", "ImageUrl", "imageUrl") || undefined,
    tips: pickStr(record, "tips", "Tips") || undefined,
    explanation: pickStr(record, "explanation", "Explanation") || undefined,
    created_at: pickStr(record, "created_at", "CreatedAt", "createdAt") || undefined,
  }
}

function normalizePracticeFullQuestionSet(raw: unknown): PracticeFullQuestionSet | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickNum(record, "id", "Id", "ID")
  if (id == null) return null
  return {
    id,
    title: pickStr(record, "title", "Title"),
    description:
      pickStr(record, "description", "Description") ||
      null,
    set_type: pickStr(record, "set_type", "SetType", "setType") || undefined,
    owner_type: pickStr(record, "owner_type", "OwnerType", "ownerType") || undefined,
    owner_id: pickNum(record, "owner_id", "OwnerId", "ownerId") ?? undefined,
    persona: pickStr(record, "persona", "Persona") || null,
    persona_id: pickNum(record, "persona_id", "PersonaId", "personaId"),
    shuffle_questions: Boolean(
      record.shuffle_questions ?? record.ShuffleQuestions ?? false,
    ),
    status: pickStr(record, "status", "Status") || undefined,
    time_limit_minutes:
      pickNum(record, "time_limit_minutes", "TimeLimitMinutes", "timeLimitMinutes"),
    passing_score: pickNum(record, "passing_score", "PassingScore", "passingScore"),
    intro_video_url:
      pickStr(record, "intro_video_url", "IntroVideoUrl", "introVideoUrl") || null,
    question_count: pickNum(record, "question_count", "QuestionCount", "questionCount") ?? undefined,
    created_at: pickStr(record, "created_at", "CreatedAt", "createdAt") || undefined,
  }
}

function normalizePracticeFullPractice(raw: unknown): PracticeFullPractice | null {
  const record = asRecord(raw)
  if (!record) return null
  const id = pickNum(record, "id", "Id", "ID")
  const questionSetId = pickNum(
    record,
    "question_set_id",
    "QuestionSetId",
    "questionSetId",
  )
  if (id == null || questionSetId == null) return null
  const parents = parentsFromPractice({
    parents: normalizePracticeParents(record),
    parent_kind: pickStr(record, "parent_kind", "ParentKind", "parentKind") || undefined,
    parent_id: pickNum(record, "parent_id", "ParentId", "parentId") ?? undefined,
  })
  const lessonParent = parents.find((p) => p.parent_kind === "LESSON")
  return {
    id,
    title: pickStr(record, "title", "Title"),
    story_description:
      pickStr(record, "story_description", "StoryDescription", "storyDescription") ||
      undefined,
    story_image:
      pickStr(record, "story_image", "StoryImage", "storyImage") || undefined,
    persona_id: pickNum(record, "persona_id", "PersonaId", "personaId"),
    question_set_id: questionSetId,
    authoring_profile: normalizeAuthoringProfile(
      record.authoring_profile ?? record.AuthoringProfile,
    ),
    publish_status:
      pickStr(record, "publish_status", "PublishStatus", "publishStatus") || null,
    quick_tips: pickStr(record, "quick_tips", "QuickTips", "quickTips") || undefined,
    parents,
    lesson_id:
      lessonParent?.parent_id ??
      pickNum(record, "lesson_id", "LessonId", "lessonId") ??
      undefined,
    parent_kind: parents[0]?.parent_kind,
    parent_id: parents[0]?.parent_id,
    created_at: pickStr(record, "created_at", "CreatedAt", "createdAt") || undefined,
  }
}

export function normalizePracticeFullData(raw: unknown): PracticeFullData | null {
  const record = asRecord(raw)
  if (!record) return null
  const practice = normalizePracticeFullPractice(record.practice ?? record.Practice)
  const questionSet = normalizePracticeFullQuestionSet(
    record.question_set ?? record.QuestionSet ?? record.questionSet,
  )
  const questionsRaw = record.questions ?? record.Questions
  if (!practice || !questionSet || !Array.isArray(questionsRaw)) return null
  const questions = questionsRaw
    .map((entry) => normalizePracticeFullQuestion(entry))
    .filter((entry): entry is PracticeFullQuestionItem => entry != null)
  const stimulusBlocksRaw = record.stimulus_blocks ?? record.StimulusBlocks
  const stimulus_blocks = Array.isArray(stimulusBlocksRaw)
    ? stimulusBlocksRaw
        .map((entry) => {
          const blockRecord = asRecord(entry)
          if (!blockRecord) return null
          const blockKey = pickStr(blockRecord, "block_key", "BlockKey", "blockKey")
          if (!blockKey) return null
          return {
            ...(pickNum(blockRecord, "id", "Id", "ID") != null
              ? { id: pickNum(blockRecord, "id", "Id", "ID")! }
              : {}),
            block_key: blockKey,
            display_order:
              pickNum(blockRecord, "display_order", "DisplayOrder", "displayOrder") ?? 0,
            stimulus: normalizeDynamicElementArray(
              blockRecord.stimulus ?? blockRecord.Stimulus,
            ),
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    : undefined
  return { practice, question_set: questionSet, questions, stimulus_blocks }
}

function payloadValuesByKind(
  payload: DynamicQuestionPayload | null | undefined,
  side: "stimulus" | "response",
): Map<string, unknown> {
  const map = new Map<string, unknown>()
  const slots = side === "stimulus" ? payload?.stimulus : payload?.response
  for (const slot of slots ?? []) {
    const kind = (slot.kind ?? "").trim().toUpperCase()
    if (!kind || map.has(kind)) continue
    map.set(kind, slot.value)
  }
  return map
}

function hydrateDynamicFieldValues(
  def: QuestionTypeDefinition,
  question: PracticeFullQuestionItem,
  fieldValues: Record<string, string>,
): Record<string, string> {
  const merged = { ...fieldValues }
  const stimulusByKind = payloadValuesByKind(question.dynamic_payload, "stimulus")
  const responseByKind = payloadValuesByKind(question.dynamic_payload, "response")
  const questionText = String(question.question_text ?? "").trim()
  const voicePrompt = String(question.voice_prompt ?? "").trim()
  const sampleAnswerVoice = String(question.sample_answer_voice_prompt ?? "").trim()

  for (const row of def.stimulus_schema) {
    const key = `stimulus:${row.id}`
    if (merged[key]?.trim()) continue
    const kind = row.kind.trim().toUpperCase()
    if (questionText && isTextPromptKind(kind)) {
      merged[key] = questionText
      continue
    }
    if (voicePrompt && isAudioKind(kind)) {
      merged[key] = voicePrompt
      continue
    }
    if (stimulusByKind.has(kind)) {
      merged[key] = slotApiValueToFieldString(stimulusByKind.get(kind), row.kind)
    }
  }

  for (const row of def.response_schema) {
    const key = `response:${row.id}`
    if (merged[key]?.trim()) continue
    const kind = row.kind.trim().toUpperCase()
    if (sampleAnswerVoice && isAudioKind(kind)) {
      merged[key] = sampleAnswerVoice
      continue
    }
    if (responseByKind.has(kind)) {
      merged[key] = slotApiValueToFieldString(responseByKind.get(kind), row.kind)
    }
  }

  return merged
}

function normalizeShortAnswers(
  shortAnswers: PracticeFullQuestionItem["short_answers"],
): string[] {
  if (!shortAnswers?.length) return [""]
  const lines = shortAnswers
    .map((entry) =>
      typeof entry === "string" ? entry : entry.acceptable_answer,
    )
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
  return lines.length > 0 ? lines : [""]
}

function mapFullQuestionToFormRow(
  rawQuestion: PracticeFullQuestionItem,
  typeDefinitions: QuestionTypeDefinition[],
): PracticeFormQuestionRow {
  const q = normalizePracticeFullQuestion(rawQuestion) ?? rawQuestion
  const defId = q.question_type_definition_id ?? null
  const def = defId
    ? typeDefinitions.find((d) => d.id === defId)
    : undefined

  let dynamicFieldValues: Record<string, string> = {}
  if (def) {
    dynamicFieldValues = hydrateDynamicFieldValues(def, q, {
      ...emptyDynamicFieldValuesForDefinition(def),
      ...dynamicPayloadToFieldValues(q.dynamic_payload),
    })
  } else if (q.dynamic_payload) {
    dynamicFieldValues = dynamicPayloadToFieldValues(q.dynamic_payload)
  }

  let text = String(q.question_text ?? "").trim()
  let mcqOptions = defaultMcqOptions()
  let trueFalseCorrect = true
  let shortAnswers = [""]

  if (def && definitionUsesDynamicPayload(def)) {
    if (!text) text = dynamicPromptFromFieldValues(def, dynamicFieldValues)
  } else if (q.question_type === "MCQ" || q.question_type === "MULTIPLE_CHOICE") {
    const opts = q.options ?? []
    mcqOptions =
      opts.length > 0
        ? opts.map((o) => ({
            text: o.option_text ?? "",
            isCorrect: Boolean(o.is_correct),
          }))
        : defaultMcqOptions()
  } else if (q.question_type === "TRUE_FALSE") {
    const correct = q.options?.find((o) => o.is_correct)
    trueFalseCorrect =
      correct?.option_text?.trim().toLowerCase() !== "false"
  } else if (
    q.question_type === "SHORT_ANSWER" ||
    q.question_type === "SHORT"
  ) {
    shortAnswers = normalizeShortAnswers(q.short_answers)
  } else if (def) {
    const legacy = legacyQuestionTypeFromDefinition(def)
    if (legacy === "MCQ") {
      const opts = q.options ?? []
      mcqOptions =
        opts.length > 0
          ? opts.map((o) => ({
              text: o.option_text ?? "",
              isCorrect: Boolean(o.is_correct),
            }))
          : defaultMcqOptions()
    } else if (legacy === "TRUE_FALSE") {
      const correct = q.options?.find((o) => o.is_correct)
      trueFalseCorrect =
        correct?.option_text?.trim().toLowerCase() !== "false"
    } else if (legacy === "SHORT_ANSWER") {
      shortAnswers = normalizeShortAnswers(q.short_answers)
    }
  }

  const difficulty = String(q.difficulty_level ?? "EASY").toUpperCase()
  const difficultyLevel =
    difficulty === "MEDIUM" || difficulty === "HARD" ? difficulty : "EASY"

  return {
    id: q.id != null ? `existing-${q.id}` : `q-${q.display_order}`,
    serverQuestionId: q.id ?? null,
    displayOrder: q.display_order,
    associatedQuestionId: q.associated_question_id ?? null,
    associatedAnchorRowId: null,
    prerequisiteQuestionIds: q.prerequisite_question_ids,
    stimulusBlockKey: q.stimulus_block_key ?? null,
    questionTypeDefinitionId: defId,
    text,
    difficultyLevel,
    points: Number.isFinite(Number(q.points)) && Number(q.points) > 0
      ? Number(q.points)
      : 1,
    dynamicFieldValues,
    sourceDynamicPayload: q.dynamic_payload ?? null,
    mcqOptions,
    trueFalseCorrect,
    shortAnswers,
  }
}

/** Map a question-bank detail into a practice form row for attach-from-bank. */
export function mapQuestionDetailToPracticeFormRow(
  detail: QuestionDetail,
  typeDefinitions: QuestionTypeDefinition[],
  displayOrder: number,
): PracticeFormQuestionRow {
  const item: PracticeFullQuestionItem = {
    id: detail.id,
    display_order: displayOrder,
    question_text: detail.question_text,
    question_type: detail.question_type,
    question_type_definition_id: detail.question_type_definition_id ?? null,
    dynamic_payload: detail.dynamic_payload ?? null,
    difficulty_level: detail.difficulty_level ?? undefined,
    points: detail.points ?? undefined,
    status: detail.status,
    options: detail.options,
    short_answers: detail.short_answers,
    voice_prompt: detail.voice_prompt ?? undefined,
    sample_answer_voice_prompt: detail.sample_answer_voice_prompt ?? undefined,
    audio_correct_answer_text: detail.audio_correct_answer_text ?? undefined,
    image_url: detail.image_url ?? undefined,
    tips: detail.tips ?? undefined,
    explanation: detail.explanation ?? undefined,
  }
  return mapFullQuestionToFormRow(item, typeDefinitions)
}

function parsePersonaIdValue(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function resolvePracticePersonaId(
  practice: PracticeFullPractice,
  questionSet: PracticeFullQuestionSet,
): number | null {
  const fromPractice = parsePersonaIdValue(practice.persona_id)
  if (fromPractice != null) return fromPractice

  const fromQuestionSet = parsePersonaIdValue(questionSet.persona_id)
  if (fromQuestionSet != null) return fromQuestionSet

  return parsePersonaIdValue(questionSet.persona)
}

export function mapPracticeFullToFormState(
  data: PracticeFullData,
  typeDefinitions: QuestionTypeDefinition[],
): {
  formData: PracticeFormState
  personaId: number | null
  preservedQuestionSet: PreservedQuestionSetFields
  parents: PracticeParent[]
} {
  const { practice, question_set, questions, stimulus_blocks } = data
  const sorted = [...questions].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  )

  const formQuestions =
    sorted.length > 0
      ? sorted.map((q) => mapFullQuestionToFormRow(q, typeDefinitions))
      : [
          {
            id: "q1",
            displayOrder: 1,
            serverQuestionId: null,
            associatedQuestionId: null,
            associatedAnchorRowId: null,
            stimulusBlockKey: null,
            questionTypeDefinitionId: typeDefinitions[0]?.id ?? null,
            text: "",
            dynamicFieldValues: typeDefinitions[0]
              ? emptyDynamicFieldValuesForDefinition(typeDefinitions[0])
              : {},
            mcqOptions: defaultMcqOptions(),
            trueFalseCorrect: true,
            shortAnswers: [""],
          },
        ]

  return {
    formData: {
      title: practice.title?.trim() || question_set.title?.trim() || "",
      description:
        practice.story_description?.trim() ||
        question_set.description?.trim() ||
        "",
      storyImageUrl: practice.story_image?.trim() || "",
      shuffleQuestions: Boolean(question_set.shuffle_questions),
      tips: practice.quick_tips?.trim() || "",
      authoringProfile: normalizeAuthoringProfile(practice.authoring_profile),
      stimulusBlocks: mapApiStimulusBlocksToForm(stimulus_blocks),
      parents: parentsFromPractice(practice),
      questions: formQuestions,
    },
    personaId: resolvePracticePersonaId(practice, question_set),
    preservedQuestionSet: {
      timeLimitMinutes: question_set.time_limit_minutes ?? null,
      passingScore: question_set.passing_score ?? null,
      introVideoUrl: question_set.intro_video_url?.trim() || "",
      status:
        (question_set.status as PracticePublishStatus) === "DRAFT"
          ? "DRAFT"
          : "PUBLISHED",
    },
    parents: parentsFromPractice(practice),
  }
}

export interface PracticeEditQuestionInput extends LearnEnglishDefinitionQuestionInput {
  serverQuestionId?: number | null
}

function buildFullUpdateQuestion(
  def: QuestionTypeDefinition,
  q: PracticeEditQuestionInput,
  status: PracticePublishStatus,
  displayOrder: number,
  associatedQuestionId: number | null,
): PracticeFullQuestionItem {
  const created = buildCreateQuestionFromDefinition(def, q, status)
  const item: PracticeFullQuestionItem = {
    display_order: displayOrder,
    associated_question_id: associatedQuestionId,
    question_type: created.question_type,
    difficulty_level: created.difficulty_level,
    points: created.points,
    status,
  }
  if (q.serverQuestionId != null && q.serverQuestionId > 0) {
    item.id = q.serverQuestionId
  }
  if (created.question_text) item.question_text = created.question_text
  if (created.question_type_definition_id != null) {
    item.question_type_definition_id = created.question_type_definition_id
  }
  if (created.dynamic_payload) {
    item.dynamic_payload = created.dynamic_payload
  }
  if (q.stimulusBlockKey?.trim()) {
    item.stimulus_block_key = q.stimulusBlockKey.trim()
  }
  if (created.options?.length) item.options = created.options
  if (created.short_answers?.length) {
    item.short_answers = created.short_answers.map((entry) =>
      typeof entry === "string"
        ? { acceptable_answer: entry, match_type: "CASE_INSENSITIVE" }
        : entry,
    )
  }
  if (created.voice_prompt) item.voice_prompt = created.voice_prompt
  if (created.sample_answer_voice_prompt) {
    item.sample_answer_voice_prompt = created.sample_answer_voice_prompt
  }
  if (created.audio_correct_answer_text) {
    item.audio_correct_answer_text = created.audio_correct_answer_text
  }
  if (created.image_url) item.image_url = created.image_url
  if (created.tips) item.tips = created.tips
  if (created.explanation) item.explanation = created.explanation
  return item
}

export interface BuildPracticeFullUpdateInput {
  formData: PracticeFormState
  personaId: number
  status: PracticePublishStatus
  preservedQuestionSet: PreservedQuestionSetFields
  questions: PracticeEditQuestionInput[]
  definitions: QuestionTypeDefinition[]
  isLearnEnglishLessonPractice: boolean
  lessonDefaultTitle?: string
}

export function buildPracticeFullUpdateRequest(
  opts: BuildPracticeFullUpdateInput,
): UpdatePracticeFullRequest {
  const useBlocks = isIeltsSharedStimulusMode(opts.formData.authoringProfile)
  if (useBlocks) {
    const blockValidationErr = validatePracticeStimulusBlocks(
      opts.formData.authoringProfile,
      opts.formData.stimulusBlocks,
      opts.questions,
      opts.definitions,
    )
    if (blockValidationErr) throw new Error(blockValidationErr)
  } else {
    const err = validatePracticeQuestionsWithDefinitions(
      opts.questions,
      opts.definitions,
    )
    if (err) throw new Error(err)
  }

  const lessonTitle = opts.lessonDefaultTitle?.trim() || "Lesson practice"
  const practiceTitle = opts.isLearnEnglishLessonPractice
    ? lessonTitle
    : opts.formData.title.trim() || "Untitled practice"
  const storyDescription = opts.isLearnEnglishLessonPractice
    ? ""
    : opts.formData.description.trim()
  const storyImage = opts.isLearnEnglishLessonPractice
    ? ""
    : opts.formData.storyImageUrl.trim()

  const byId = new Map(opts.definitions.map((d) => [d.id, d]))
  const toUpdate = opts.questions
    .map((q, index) => ({
      q,
      sortOrder:
        Number.isFinite(q.displayOrder) && (q.displayOrder ?? 0) > 0
          ? Number(q.displayOrder)
          : index + 1,
    }))
    .filter(({ q }) => {
      if (q.serverQuestionId != null && Number(q.serverQuestionId) > 0) return true
      const def = byId.get(q.questionTypeDefinitionId)
      return def ? questionRowHasContent(q, def) : false
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const associationRows = toUpdate.map(({ q, sortOrder }) => ({
    id: q.clientRowId ?? `update-${sortOrder}`,
    serverQuestionId: q.serverQuestionId ?? null,
    displayOrder: sortOrder,
    associatedQuestionId: q.associatedQuestionId ?? null,
    associatedAnchorRowId: q.associatedAnchorRowId ?? null,
  }))
  const associationErr = validateQuestionAssociations(associationRows)
  if (associationErr) throw new Error(associationErr)

  let displayOrder = 0
  const questions: PracticeFullQuestionItem[] = []
  for (const { q, sortOrder } of toUpdate) {
    const def = byId.get(q.questionTypeDefinitionId)
    if (!def) {
      if (q.serverQuestionId != null && Number(q.serverQuestionId) > 0) {
        displayOrder += 1
        const associationRow = {
          id: q.clientRowId ?? `update-${sortOrder}`,
          serverQuestionId: q.serverQuestionId ?? null,
          displayOrder: sortOrder,
          associatedQuestionId: q.associatedQuestionId ?? null,
          associatedAnchorRowId: q.associatedAnchorRowId ?? null,
        }
        questions.push({
          id: Number(q.serverQuestionId),
          display_order: displayOrder,
          associated_question_id: resolveAssociatedQuestionId(
            associationRow,
            associationRows,
            new Map(
              associationRows
                .filter((r) => r.serverQuestionId != null && r.serverQuestionId > 0)
                .map((r) => [r.id, r.serverQuestionId as number]),
            ),
          ),
          question_type: "DYNAMIC",
          difficulty_level: q.difficultyLevel ?? "EASY",
          points: q.points ?? 1,
          status: opts.status,
          ...(q.stimulusBlockKey?.trim()
            ? { stimulus_block_key: q.stimulusBlockKey.trim() }
            : {}),
        })
      }
      continue
    }
    displayOrder += 1
    const associationRow = {
      id: q.clientRowId ?? `update-${sortOrder}`,
      serverQuestionId: q.serverQuestionId ?? null,
      displayOrder: sortOrder,
      associatedQuestionId: q.associatedQuestionId ?? null,
      associatedAnchorRowId: q.associatedAnchorRowId ?? null,
    }
    questions.push(
      buildFullUpdateQuestion(
        def,
        q,
        opts.status,
        displayOrder,
        resolveAssociatedQuestionId(associationRow, associationRows),
      ),
    )
  }

  return {
    practice: {
      title: practiceTitle,
      story_description: storyDescription,
      story_image: storyImage,
      persona_id: opts.personaId,
      quick_tips: opts.formData.tips.trim(),
      publish_status: opts.status,
      authoring_profile: opts.formData.authoringProfile,
    },
    question_set: {
      title: opts.isLearnEnglishLessonPractice
        ? lessonTitle
        : opts.formData.title.trim() || "Practice set",
      description: opts.isLearnEnglishLessonPractice
        ? null
        : opts.formData.description.trim() || null,
      time_limit_minutes: opts.preservedQuestionSet.timeLimitMinutes,
      passing_score: opts.preservedQuestionSet.passingScore,
      shuffle_questions: opts.formData.shuffleQuestions,
      status: opts.status,
      intro_video_url: opts.preservedQuestionSet.introVideoUrl.trim() || null,
    },
    stimulus_blocks: useBlocks
      ? mapFormStimulusBlocksToApi(opts.formData.stimulusBlocks)
      : [],
    questions,
  }
}

export function unwrapPracticeFullData(
  res: { data?: GetPracticeFullResponse & { Data?: GetPracticeFullResponse["data"] } },
): PracticeFullData | null {
  const body = res.data
  if (!body) return null
  const raw = body.data ?? body.Data ?? null
  if (!raw) return null
  const normalized = normalizePracticeFullData(raw)
  if (normalized) return normalized
  // Fall back only when the payload already looks usable.
  const record = asRecord(raw)
  if (!record) return null
  const practice = record.practice ?? record.Practice
  const questionSet = record.question_set ?? record.QuestionSet ?? record.questionSet
  const questions = record.questions ?? record.Questions
  if (!asRecord(practice) || !asRecord(questionSet) || !Array.isArray(questions)) {
    return null
  }
  return raw as PracticeFullData
}
