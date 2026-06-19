import { updatePracticeParents } from "../api/courses.api"
import type { ParentContextPractice, PracticeParent } from "../types/course.types"
import { dedupeParents, parentsFromPractice } from "./practiceParents"

export function practiceAlreadyLinkedToParent(
  practice: Pick<ParentContextPractice, "parents" | "parent_kind" | "parent_id">,
  target: PracticeParent,
): boolean {
  const key = `${target.parent_kind}:${target.parent_id}`
  return parentsFromPractice(practice).some(
    (p) => `${p.parent_kind}:${p.parent_id}` === key,
  )
}

export function mergedParentsForAttach(
  practice: Pick<ParentContextPractice, "parents" | "parent_kind" | "parent_id">,
  newParent: PracticeParent,
): PracticeParent[] {
  return dedupeParents([...parentsFromPractice(practice), newParent])
}

export async function attachPracticeToParent(
  practice: ParentContextPractice,
  newParent: PracticeParent,
): Promise<void> {
  if (practiceAlreadyLinkedToParent(practice, newParent)) {
    throw new Error("This practice is already linked to the selected location.")
  }
  await updatePracticeParents(practice.id, {
    parents: mergedParentsForAttach(practice, newParent),
  })
}
