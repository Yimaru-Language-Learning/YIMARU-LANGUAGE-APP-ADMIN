import type { AxiosResponse } from "axios"
import {
  addQuestionToSet,
  createExamPrepLessonPractice,
  createParentLinkedPractice,
  createQuestion,
  createQuestionSet,
} from "../api/courses.api"
import type { PracticeParentKind } from "../types/course.types"
import type { QuestionTypeDefinition } from "../types/questionTypeDefinition.types"
import {
  buildCreateQuestionFromDefinition,
  questionRowHasContent,
  validateDefinitionQuestion,
  type LearnEnglishDefinitionQuestionInput,
} from "./learnEnglishDefinitionQuestion"

export type { LearnEnglishDefinitionQuestionInput } from "./learnEnglishDefinitionQuestion"

export interface PracticeCreationInput {
  parentKind: PracticeParentKind
  parentId: number
  status: "DRAFT" | "PUBLISHED"
  questionSetTitle: string
  questionSetDescription?: string | null
  shuffleQuestions: boolean
  practiceTitle: string
  storyDescription: string
  storyImage: string
  quickTips: string
  personaName?: string | null
  personaId: number
  questions: LearnEnglishDefinitionQuestionInput[]
  definitions: QuestionTypeDefinition[]
  /** English proficiency lesson practices use POST /exam-prep/lessons/:id/practices. */
  examPrepLessonId?: number
}

function extractCreatedResourceId(
  res: AxiosResponse<{ data?: { id?: number }; message?: string }>,
  fallbackMessage: string,
): number {
  const id = res.data?.data?.id
  if (typeof id === "number" && Number.isFinite(id) && id > 0) return id
  const message = res.data?.message?.trim()
  throw new Error(message || fallbackMessage)
}

export function validatePracticeQuestionsWithDefinitions(
  questions: LearnEnglishDefinitionQuestionInput[],
  definitions: QuestionTypeDefinition[],
): string | null {
  const byId = new Map(definitions.map((d) => [d.id, d]))
  const filled = questions.filter((q) => {
    const def = byId.get(q.questionTypeDefinitionId)
    return def ? questionRowHasContent(q, def) : false
  })
  if (filled.length === 0) return "Add at least one question with content."
  for (let i = 0; i < filled.length; i++) {
    const q = filled[i]
    if (!Number.isFinite(q.questionTypeDefinitionId) || q.questionTypeDefinitionId <= 0) {
      return `Question ${i + 1}: select a question type from the list.`
    }
    const def = byId.get(q.questionTypeDefinitionId)
    if (!def) {
      return `Question ${i + 1}: type definition #${q.questionTypeDefinitionId} was not found. Refresh and try again.`
    }
    const err = validateDefinitionQuestion(def, q, i + 1)
    if (err) return err
  }
  return null
}

/**
 * Coordinated practice creation (5 APIs):
 * 1. POST /question-sets — create PRACTICE question set
 * 2. POST /questions — create each question (DYNAMIC or legacy type)
 * 3. POST /question-sets/:id/questions — attach questions to the set
 * 4. Personas are loaded in the UI (GET /personas) before submit; persona_id is sent on step 5
 * 5. POST /practices or POST /exam-prep/lessons/:id/practices — create practice
 */
export async function executePracticeCreation(
  opts: PracticeCreationInput,
): Promise<{ questionSetId: number; practiceId: number }> {
  const err = validatePracticeQuestionsWithDefinitions(opts.questions, opts.definitions)
  if (err) throw new Error(err)

  if (!Number.isFinite(opts.personaId) || opts.personaId < 1) {
    throw new Error("persona_id is required. Select a persona before saving.")
  }

  const byId = new Map(opts.definitions.map((d) => [d.id, d]))

  // Step 1 — create question set
  const setRes = await createQuestionSet({
    title: opts.questionSetTitle.trim() || "Practice question set",
    description: opts.questionSetDescription?.trim() || null,
    set_type: "PRACTICE",
    owner_type: opts.parentKind,
    owner_id: opts.parentId,
    shuffle_questions: opts.shuffleQuestions,
    status: opts.status,
    ...(opts.personaName?.trim() ? { persona: opts.personaName.trim() } : {}),
  })
  const setId = extractCreatedResourceId(setRes, "Could not create question set")

  const toCreate = opts.questions
    .map((q, index) => ({
      q,
      sortOrder:
        Number.isFinite(q.displayOrder) && (q.displayOrder ?? 0) > 0
          ? Number(q.displayOrder)
          : index + 1,
    }))
    .filter(({ q }) => {
      const def = byId.get(q.questionTypeDefinitionId)
      return def ? questionRowHasContent(q, def) : false
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // Steps 2 & 3 — create questions and attach to set (order from step 3 drag-and-drop)
  let displayOrder = 0
  for (const { q } of toCreate) {
    const def = byId.get(q.questionTypeDefinitionId)
    if (!def) throw new Error(`Missing definition #${q.questionTypeDefinitionId}`)
    displayOrder += 1
    const payload = buildCreateQuestionFromDefinition(def, q, opts.status)
    const qRes = await createQuestion(payload)
    const questionId = extractCreatedResourceId(qRes, "Could not create question")
    await addQuestionToSet(setId, {
      question_id: questionId,
      display_order: displayOrder,
    })
  }

  // Step 5 — create practice (persona_id + question_set_id from step 1)
  const practiceRes = opts.examPrepLessonId
    ? await createExamPrepLessonPractice(opts.examPrepLessonId, {
        title: opts.practiceTitle.trim(),
        story_description: opts.storyDescription.trim(),
        story_image: opts.storyImage.trim(),
        persona_id: opts.personaId,
        question_set_id: setId,
        quick_tips: opts.quickTips.trim(),
        publish_status: opts.status,
      })
    : await createParentLinkedPractice({
        parent_kind: opts.parentKind,
        parent_id: opts.parentId,
        title: opts.practiceTitle.trim(),
        story_description: opts.storyDescription.trim(),
        story_image: opts.storyImage.trim(),
        question_set_id: setId,
        quick_tips: opts.quickTips.trim(),
        publish_status: opts.status,
        persona_id: opts.personaId,
      })

  const practiceId = extractCreatedResourceId(practiceRes, "Could not create practice")
  return { questionSetId: setId, practiceId }
}
