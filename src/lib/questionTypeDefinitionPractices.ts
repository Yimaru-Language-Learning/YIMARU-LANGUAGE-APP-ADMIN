import { dedupeParents, formatPracticeParentLabel } from "./practiceParents"
import type { PracticeParent } from "../types/course.types"
import type { QuestionTypeDefinitionPractice } from "../types/questionTypeDefinition.types"

export function examPrepParentsFromPractice(
  practice: Pick<
    QuestionTypeDefinitionPractice,
    "exam_prep_parents" | "exam_prep_lesson_id"
  >,
): PracticeParent[] {
  const parents = practice.exam_prep_parents ?? []
  if (parents.length > 0) return dedupeParents(parents)
  const lessonId = practice.exam_prep_lesson_id
  if (lessonId != null && lessonId > 0) {
    return [{ parent_kind: "LESSON", parent_id: lessonId }]
  }
  return []
}

/** Single-line location for the practice meta row (e.g. "Course #2 · Lesson #42"). */
export function formatPracticeLocation(row: QuestionTypeDefinitionPractice): string {
  if ((row.practice_kind || "LMS").toUpperCase() === "EXAM_PREP") {
    const parents = examPrepParentsFromPractice(row)
    if (parents.length > 0) {
      return parents.map(formatPracticeParentLabel).join(" · ")
    }
    return "Unlinked"
  }

  const parents = row.parents ?? []
  if (parents.length > 0) {
    return parents.map(formatPracticeParentLabel).join(" · ")
  }
  return "Unlinked"
}

export function isQuestionTypeDefinitionPracticeUnlinked(
  row: QuestionTypeDefinitionPractice,
): boolean {
  return formatPracticeLocation(row) === "Unlinked"
}
