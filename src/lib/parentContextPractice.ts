import type {
  GetPracticesByParentContextResponse,
  ParentContextPractice,
  PracticePublishStatus,
} from "../types/course.types"
import { isPublishedPublishStatus, normalizePublishStatus } from "./publishStatus"

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
  return normalizePublishStatus(practice.publish_status)
}

export function isPracticePublished(practice: ParentContextPractice): boolean {
  return isPublishedPublishStatus(practice.publish_status)
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
