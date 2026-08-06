import type { QuestionTypeDefinitionPractice } from "../types/questionTypeDefinition.types"

function practiceKindQuery(
  practice: QuestionTypeDefinitionPractice,
): "EXAM_PREP" | "LMS" {
  return (practice.practice_kind || "LMS").toUpperCase() === "EXAM_PREP"
    ? "EXAM_PREP"
    : "LMS"
}

/**
 * Edit path for a practice opened from the question-type definition list.
 *
 * Always uses the standalone editor with an explicit `kind` so LMS vs exam-prep
 * full-fetch APIs are selected correctly. Hierarchy route resolution is
 * intentionally skipped here — it can land on a lesson URL while still calling
 * the wrong `/practices/:id/full` vs `/exam-prep/practices/:id/full` endpoint.
 */
export async function resolveQuestionTypeDefinitionPracticeEditPath(
  practice: QuestionTypeDefinitionPractice,
): Promise<string | null> {
  const id = Number(practice.practice_id)
  if (!Number.isFinite(id) || id < 1) return null
  const kind = practiceKindQuery(practice)
  return `/new-content/practices/${id}/edit?kind=${kind}&backTo=question-types`
}
