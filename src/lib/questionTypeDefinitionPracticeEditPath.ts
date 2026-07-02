import { resolveExamPrepPracticeEditPath } from "./examPrepPracticeEditPath"
import { resolveLearnEnglishPracticeEditPath } from "./learnEnglishPracticeEditPath"
import type { QuestionTypeDefinitionPractice } from "../types/questionTypeDefinition.types"

/** Routes to the LMS or exam-prep practice editor based on `practice_kind`. */
export async function resolveQuestionTypeDefinitionPracticeEditPath(
  practice: QuestionTypeDefinitionPractice,
): Promise<string | null> {
  if ((practice.practice_kind || "LMS").toUpperCase() === "EXAM_PREP") {
    return resolveExamPrepPracticeEditPath(practice)
  }
  return resolveLearnEnglishPracticeEditPath(practice)
}
