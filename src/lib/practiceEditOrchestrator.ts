import {
  updateExamPrepPracticeFull,
  updateLearnEnglishPracticeFull,
} from "../api/courses.api"
import type { PracticePublishStatus } from "../types/course.types"
import type { QuestionTypeDefinition } from "../types/questionTypeDefinition.types"
import {
  buildPracticeFullUpdateRequest,
  type PracticeFormState,
  type PreservedQuestionSetFields,
  type PracticeEditQuestionInput,
} from "./practiceFullMapper"

export interface PracticeEditInput {
  practiceId: number
  isExamPrep: boolean
  status: PracticePublishStatus
  formData: PracticeFormState
  personaId: number
  preservedQuestionSet: PreservedQuestionSetFields
  questions: PracticeEditQuestionInput[]
  definitions: QuestionTypeDefinition[]
  isLearnEnglishLessonPractice: boolean
  lessonDefaultTitle?: string
}

export async function executePracticeUpdate(
  opts: PracticeEditInput,
): Promise<void> {
  const payload = buildPracticeFullUpdateRequest({
    formData: opts.formData,
    personaId: opts.personaId,
    status: opts.status,
    preservedQuestionSet: opts.preservedQuestionSet,
    questions: opts.questions,
    definitions: opts.definitions,
    isLearnEnglishLessonPractice: opts.isLearnEnglishLessonPractice,
    lessonDefaultTitle: opts.lessonDefaultTitle,
  })

  if (opts.isExamPrep) {
    await updateExamPrepPracticeFull(opts.practiceId, payload)
    return
  }
  await updateLearnEnglishPracticeFull(opts.practiceId, payload)
}
