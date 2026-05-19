import type { AxiosError } from "axios"
import {
  addQuestionToSet,
  createParentLinkedPractice,
  createQuestion,
  createQuestionSet,
} from "../api/courses.api"
import type { PracticeParentKind } from "../types/course.types"
import type { QuestionTypeDefinition } from "../types/questionTypeDefinition.types"
import {
  buildCreateQuestionFromDefinition,
  validateDefinitionQuestion,
  type LearnEnglishDefinitionQuestionInput,
} from "./learnEnglishDefinitionQuestion"

export type { LearnEnglishDefinitionQuestionInput } from "./learnEnglishDefinitionQuestion"

export function learnEnglishPracticeApiErrorMessage(err: unknown): string {
  const ax = err as AxiosError<{ message?: string; error?: string }>
  const data = ax.response?.data
  if (data && typeof data === "object") {
    const m = data.message ?? data.error
    if (typeof m === "string" && m.trim()) return m.trim()
  }
  if (err instanceof Error && err.message) return err.message
  return "Request failed"
}

export function validateLearnEnglishQuestionsWithDefinitions(
  questions: LearnEnglishDefinitionQuestionInput[],
  definitions: QuestionTypeDefinition[],
): string | null {
  const filled = questions.filter((q) => q.questionText.trim())
  if (filled.length === 0) return "Add at least one question with prompt text."
  const byId = new Map(definitions.map((d) => [d.id, d]))
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
 * Learn English parent-linked practice: create PRACTICE question set,
 * create questions from GET /questions/type-definitions entries, attach them, POST /practices.
 */
export async function executeLearnEnglishPracticeCreation(opts: {
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
  questions: LearnEnglishDefinitionQuestionInput[]
  definitions: QuestionTypeDefinition[]
}): Promise<{ questionSetId: number; practiceId: number }> {
  const err = validateLearnEnglishQuestionsWithDefinitions(
    opts.questions,
    opts.definitions,
  )
  if (err) throw new Error(err)

  const byId = new Map(opts.definitions.map((d) => [d.id, d]))

  const setRes = await createQuestionSet({
    title: opts.questionSetTitle.trim() || "Practice question set",
    description: opts.questionSetDescription?.trim() || null,
    set_type: "PRACTICE",
    owner_type: opts.parentKind,
    owner_id: opts.parentId,
    shuffle_questions: opts.shuffleQuestions,
    status: opts.status,
  })

  const setId = setRes.data?.data?.id
  if (!setId) {
    throw new Error(
      (setRes.data as { message?: string } | undefined)?.message ??
        "Could not create question set",
    )
  }

  const toCreate = opts.questions.filter((q) => q.questionText.trim())
  let displayOrder = 0
  for (const q of toCreate) {
    const def = byId.get(q.questionTypeDefinitionId)
    if (!def) throw new Error(`Missing definition #${q.questionTypeDefinitionId}`)
    displayOrder += 1
    const payload = buildCreateQuestionFromDefinition(def, q, opts.status)
    const qRes = await createQuestion(payload)
    const questionId = qRes.data?.data?.id
    if (!questionId) {
      throw new Error(
        (qRes.data as { message?: string } | undefined)?.message ??
          "Could not create question",
      )
    }
    await addQuestionToSet(setId, {
      question_id: questionId,
      display_order: displayOrder,
    })
  }

  const practiceRes = await createParentLinkedPractice({
    parent_kind: opts.parentKind,
    parent_id: opts.parentId,
    title: opts.practiceTitle.trim(),
    story_description: opts.storyDescription.trim(),
    story_image: opts.storyImage.trim(),
    question_set_id: setId,
    quick_tips: opts.quickTips.trim(),
    publish_status: opts.status,
  })

  const practiceId = practiceRes.data?.data?.id
  if (!practiceId) {
    throw new Error(
      (practiceRes.data as { message?: string } | undefined)?.message ??
        "Could not create practice",
    )
  }

  return { questionSetId: setId, practiceId }
}
