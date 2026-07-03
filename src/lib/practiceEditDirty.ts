import type {
  PracticeFormState,
  PreservedQuestionSetFields,
} from "./practiceFullMapper"
import { dedupeParents } from "./practiceParents"

export type PracticeEditDirtyInput = {
  formData: PracticeFormState
  selectedPersona: string | null
  preservedQuestionSet: PreservedQuestionSetFields
}

function normalizeQuestionRow(question: PracticeFormState["questions"][number]) {
  return {
    serverQuestionId: question.serverQuestionId ?? null,
    displayOrder: question.displayOrder,
    associatedQuestionId: question.associatedQuestionId ?? null,
    associatedAnchorRowId: question.associatedAnchorRowId ?? null,
    prerequisiteQuestionIds: question.prerequisiteQuestionIds ?? [],
    stimulusBlockKey: question.stimulusBlockKey ?? null,
    questionTypeDefinitionId: question.questionTypeDefinitionId ?? null,
    text: String(question.text ?? "").trim(),
    difficultyLevel: question.difficultyLevel,
    points: Number(question.points),
    dynamicFieldValues: question.dynamicFieldValues ?? {},
    mcqOptions: (question.mcqOptions ?? []).map((option) => ({
      text: String(option.text ?? "").trim(),
      isCorrect: Boolean(option.isCorrect),
    })),
    trueFalseCorrect: question.trueFalseCorrect !== false,
    shortAnswers: (question.shortAnswers ?? []).map((answer) => String(answer).trim()),
  }
}

export function buildPracticeEditSnapshot(input: PracticeEditDirtyInput): string {
  const { formData, selectedPersona, preservedQuestionSet } = input

  return JSON.stringify({
    title: formData.title.trim(),
    description: formData.description.trim(),
    storyImageUrl: formData.storyImageUrl.trim(),
    shuffleQuestions: Boolean(formData.shuffleQuestions),
    tips: formData.tips.trim(),
    authoringProfile: formData.authoringProfile,
    stimulusBlocks: formData.stimulusBlocks,
    parents: dedupeParents(formData.parents),
    questions: [...formData.questions]
      .map(normalizeQuestionRow)
      .sort((a, b) => a.displayOrder - b.displayOrder),
    selectedPersona: selectedPersona?.trim() || null,
    preservedQuestionSet: {
      timeLimitMinutes: preservedQuestionSet.timeLimitMinutes,
      passingScore: preservedQuestionSet.passingScore,
      introVideoUrl: preservedQuestionSet.introVideoUrl.trim(),
      status: preservedQuestionSet.status,
    },
  })
}

export function hasPracticeEditChanges(
  initialSnapshot: string | null,
  current: PracticeEditDirtyInput,
): boolean {
  if (!initialSnapshot) return false
  return buildPracticeEditSnapshot(current) !== initialSnapshot
}
