import type {
  GetPracticesByParentContextResponse,
  ParentContextPractice,
  PracticePublishStatus,
} from "../types/course.types"
import { normalizePracticeParents } from "./practiceParents"
import { isPublishedPublishStatus, normalizePublishStatus } from "./publishStatus"

export function normalizeParentContextPractice(raw: unknown): ParentContextPractice | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = Number(o.id ?? o.ID ?? o.Id)
  if (!Number.isFinite(id) || id <= 0) return null
  const parents = normalizePracticeParents(raw)
  const question_set_id = Number(o.question_set_id ?? o.QuestionSetId ?? o.questionSetId)
  return {
    id,
    parents,
    parent_kind: parents[0]?.parent_kind,
    parent_id: parents[0]?.parent_id,
    title: String(o.title ?? o.Title ?? ""),
    story_description: String(o.story_description ?? o.StoryDescription ?? ""),
    story_image: String(o.story_image ?? o.StoryImage ?? ""),
    question_set_id: Number.isFinite(question_set_id) ? question_set_id : 0,
    quick_tips: String(o.quick_tips ?? o.QuickTips ?? ""),
    publish_status:
      o.publish_status != null
        ? String(o.publish_status)
        : o.PublishStatus != null
          ? String(o.PublishStatus)
          : null,
    persona_id:
      o.persona_id != null && Number.isFinite(Number(o.persona_id))
        ? Number(o.persona_id)
        : o.PersonaId != null && Number.isFinite(Number(o.PersonaId))
          ? Number(o.PersonaId)
          : null,
    created_at: String(o.created_at ?? o.CreatedAt ?? ""),
  }
}

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
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => normalizeParentContextPractice(entry))
    .filter((entry): entry is ParentContextPractice => entry != null)
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
