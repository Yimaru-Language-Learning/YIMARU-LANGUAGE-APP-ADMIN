import {
  getExamPrepPracticeFull,
  getLearnEnglishPracticeFull,
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
  unwrapPracticeFullData,
  type PracticeFormState,
  type PreservedQuestionSetFields,
  type PracticeEditQuestionInput,
} from "./practiceFullMapper"
import { isIeltsSharedStimulusMode } from "./practiceStimulusBlocks"

export interface PracticeEditInput {
  practiceId: number
  isExamPrep: boolean
  status: PracticePublishStatus
  formData: PracticeFormState
  personaId: number
  preservedQuestionSet: PreservedQuestionSetFields
  questions: PracticeEditQuestionInput[]
  definitions: QuestionTypeDefinition[]
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

export interface SyncStimulusBlocksAfterCreateInput {
  practiceId: number
  isExamPrep: boolean
  status: PracticePublishStatus
  formData: PracticeFormState
  personaId: number
  preservedQuestionSet: PreservedQuestionSetFields
  questions: PracticeEditQuestionInput[]
  definitions: QuestionTypeDefinition[]
}

/** After multi-step create, apply authoring profile + stimulus blocks via full PUT. */
export async function syncStimulusBlocksAfterCreate(
  opts: SyncStimulusBlocksAfterCreateInput,
): Promise<void> {
  if (!isIeltsSharedStimulusMode(opts.formData.authoringProfile)) return

  const res = opts.isExamPrep
    ? await getExamPrepPracticeFull(opts.practiceId)
    : await getLearnEnglishPracticeFull(opts.practiceId)
  const full = unwrapPracticeFullData(res)
  if (!full) throw new Error("Could not load created practice for stimulus block sync.")

  const sortedFull = [...full.questions].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  )
  const sortedInput = [...opts.questions].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  const questionsWithIds: PracticeEditQuestionInput[] = sortedInput.map((q, index) => ({
    ...q,
    serverQuestionId: sortedFull[index]?.id ?? null,
  }))

  const payload = buildPracticeFullUpdateRequest({
    formData: opts.formData,
    personaId: opts.personaId,
    status: opts.status,
    preservedQuestionSet: opts.preservedQuestionSet,
    questions: questionsWithIds,
    definitions: opts.definitions,
  })

  if (opts.isExamPrep) {
    await updateExamPrepPracticeFull(opts.practiceId, payload)
    return
  }
  await updateLearnEnglishPracticeFull(opts.practiceId, payload)
}
