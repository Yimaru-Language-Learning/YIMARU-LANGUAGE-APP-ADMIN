import type { AxiosError } from "axios"
import type { PracticeParentKind } from "../types/course.types"
import type { QuestionTypeDefinition } from "../types/questionTypeDefinition.types"
import {
  executePracticeCreation,
  validatePracticeQuestionsWithDefinitions,
  type LearnEnglishDefinitionQuestionInput,
  type PracticeCreationInput,
} from "./practiceCreationOrchestrator"

export type { LearnEnglishDefinitionQuestionInput } from "./practiceCreationOrchestrator"

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

export const validateLearnEnglishQuestionsWithDefinitions =
  validatePracticeQuestionsWithDefinitions

/**
 * @deprecated Use executePracticeCreation — kept for existing imports.
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
  personaName?: string | null
  personaId: number
  questions: LearnEnglishDefinitionQuestionInput[]
  definitions: QuestionTypeDefinition[]
  examPrepLessonId?: number
}): Promise<{ questionSetId: number; practiceId: number }> {
  return executePracticeCreation(opts satisfies PracticeCreationInput)
}
