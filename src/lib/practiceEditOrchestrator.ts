import {
  updateExamPrepPracticeFull,
  updateExamPrepPracticeParents,
  updateLearnEnglishPracticeFull,
  updatePracticeParents,
} from "../api/courses.api"
import type { PracticeParent, PracticePublishStatus } from "../types/course.types"
import type { QuestionTypeDefinition } from "../types/questionTypeDefinition.types"
import { dedupeParents } from "./practiceParents"
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
  parents?: PracticeParent[]
  parentsChanged?: boolean
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
    if (opts.parentsChanged && opts.parents) {
      await updateExamPrepPracticeParents(opts.practiceId, {
        parents: dedupeParents(opts.parents),
      })
    }
    return
  }

  await updateLearnEnglishPracticeFull(opts.practiceId, payload)

  if (opts.parentsChanged && opts.parents) {
    await updatePracticeParents(opts.practiceId, {
      parents: dedupeParents(opts.parents),
    })
  }
}
