import type {
  GetPracticesByParentContextResponse,
  ParentContextPractice,
  PracticePublishStatus,
} from "../types/course.types"

export function unwrapPracticesList(
  res: {
    data?: GetPracticesByParentContextResponse & {
      Data?: GetPracticesByParentContextResponse["data"]
    }
  },
): ParentContextPractice[] {
  const body = res.data
  if (!body) return []
  const data = body.data ?? body.Data
  const raw = data?.practices
  return Array.isArray(raw) ? raw : []
}

export function practicePublishStatus(
  practice: ParentContextPractice,
): PracticePublishStatus | null {
  const raw = practice.publish_status
  if (raw === "DRAFT" || raw === "PUBLISHED") return raw
  if (typeof raw === "string") {
    const upper = raw.toUpperCase()
    if (upper === "DRAFT" || upper === "PUBLISHED") {
      return upper as PracticePublishStatus
    }
  }
  return null
}

export function isPracticePublished(practice: ParentContextPractice): boolean {
  return practicePublishStatus(practice) === "PUBLISHED"
}

export function isPracticeDraft(practice: ParentContextPractice): boolean {
  const status = practicePublishStatus(practice)
  return status === "DRAFT" || status === null
}

export function draftPracticesForParent(
  practices: ParentContextPractice[],
): ParentContextPractice[] {
  return practices.filter(isPracticeDraft)
}
