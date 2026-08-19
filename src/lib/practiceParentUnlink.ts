import type { AxiosError } from "axios"
import {
  unlinkExamPrepPracticeParent,
  unlinkPracticeParent,
} from "../api/courses.api"
import type { ParentContextPractice, PracticeParent } from "../types/course.types"
import { normalizeParentContextPractice } from "./parentContextPractice"
import { formatPracticeParentLabel, parentsFromPractice, dedupeParents } from "./practiceParents"

export function unlinkParentConfirmMessage(
  locationLabel: string,
  options?: { isLastParent?: boolean },
): string {
  if (options?.isLastParent) {
    return `Remove this practice from ${locationLabel}? It will not appear in any course, module, or lesson until re-attached. Questions are kept.`
  }
  return `Remove this practice from ${locationLabel}? The practice will remain available at other locations.`
}

export function mapPracticeParentUnlinkError(err: unknown): string {
  const ax = err as AxiosError<{ message?: string; error?: string }>
  const status = ax.response?.status
  const body = ax.response?.data
  if (status === 403) {
    return "You don't have permission to change practice locations."
  }
  if (status === 404) {
    const msg = String(body?.message ?? body?.error ?? "").toLowerCase()
    if (msg.includes("not linked")) {
      return "This location was already removed."
    }
    return "Practice not found."
  }
  if (status === 400) {
    return body?.message || body?.error || "Invalid location."
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return "Could not remove location."
}

export function isPracticeParentUnlinkNotLinkedError(err: unknown): boolean {
  const ax = err as AxiosError<{ message?: string; error?: string }>
  if (ax.response?.status !== 404) return false
  const msg = String(ax.response?.data?.message ?? ax.response?.data?.error ?? "").toLowerCase()
  return msg.includes("not linked")
}

function directParentsMatching(
  practice: ParentContextPractice,
  kind: PracticeParent["parent_kind"],
  parentId: number,
): PracticeParent[] {
  return dedupeParents(
    parentsFromPractice(practice).filter(
      (parent) => parent.parent_kind === kind && parent.parent_id === parentId,
    ),
  )
}

/** Learn English — course practice tab (direct COURSE link only). */
export function listCourseContextUnlinkParents(
  practice: ParentContextPractice,
  courseId: number,
): PracticeParent[] {
  return directParentsMatching(practice, "COURSE", courseId)
}

export function resolveCourseContextUnlinkParent(
  practice: ParentContextPractice,
  courseId: number,
): PracticeParent | null {
  return listCourseContextUnlinkParents(practice, courseId)[0] ?? null
}

export function hasCourseDirectPracticeLink(
  practice: ParentContextPractice,
  courseId: number,
): boolean {
  return listCourseContextUnlinkParents(practice, courseId).length > 0
}

/** Learn English — module practice tab (direct MODULE link only). */
export function listModuleContextUnlinkParents(
  practice: ParentContextPractice,
  moduleId: number,
): PracticeParent[] {
  return directParentsMatching(practice, "MODULE", moduleId)
}

export function resolveModuleContextUnlinkParent(
  practice: ParentContextPractice,
  moduleId: number,
): PracticeParent | null {
  return listModuleContextUnlinkParents(practice, moduleId)[0] ?? null
}

export function hasModuleDirectPracticeLink(
  practice: ParentContextPractice,
  moduleId: number,
): boolean {
  return listModuleContextUnlinkParents(practice, moduleId).length > 0
}

/** Learn English / Exam Prep — lesson practice tab (direct LESSON link only). */
export function listLessonContextUnlinkParents(
  practice: ParentContextPractice,
  lessonId: number,
): PracticeParent[] {
  return directParentsMatching(practice, "LESSON", lessonId)
}

export function hasLessonDirectPracticeLink(
  practice: ParentContextPractice,
  lessonId: number,
): boolean {
  return listLessonContextUnlinkParents(practice, lessonId).length > 0
}

/** Exam Prep — unit practice tab (direct UNIT link only). */
export function listUnitContextUnlinkParents(
  practice: ParentContextPractice,
  unitId: number,
): PracticeParent[] {
  return directParentsMatching(practice, "UNIT", unitId)
}

export function hasUnitDirectPracticeLink(
  practice: ParentContextPractice,
  unitId: number,
): boolean {
  return listUnitContextUnlinkParents(practice, unitId).length > 0
}

/** Exam Prep — catalog course practice tab (direct CATALOG_COURSE link only). */
export function listCatalogCourseContextUnlinkParents(
  practice: ParentContextPractice,
  catalogCourseId: number,
): PracticeParent[] {
  return directParentsMatching(practice, "CATALOG_COURSE", catalogCourseId)
}

export function hasCatalogCourseDirectPracticeLink(
  practice: ParentContextPractice,
  catalogCourseId: number,
): boolean {
  return listCatalogCourseContextUnlinkParents(practice, catalogCourseId).length > 0
}

export function isPracticeLinkedViaDescendantInCourse(
  practice: ParentContextPractice,
  courseId: number,
  moduleIdsInCourse: number[],
  lessonIdsInCourse: number[],
): boolean {
  if (hasCourseDirectPracticeLink(practice, courseId)) return false
  const moduleIds = new Set(moduleIdsInCourse.filter((id) => id > 0))
  const lessonIds = new Set(lessonIdsInCourse.filter((id) => id > 0))
  return parentsFromPractice(practice).some(
    (parent) =>
      (parent.parent_kind === "MODULE" && moduleIds.has(parent.parent_id)) ||
      (parent.parent_kind === "LESSON" && lessonIds.has(parent.parent_id)),
  )
}

export function isPracticeLinkedViaLessonInModule(
  practice: ParentContextPractice,
  moduleId: number,
  lessonIdsInModule: number[],
): boolean {
  if (hasModuleDirectPracticeLink(practice, moduleId)) return false
  const lessonIds = new Set(lessonIdsInModule.filter((id) => id > 0))
  return parentsFromPractice(practice).some(
    (parent) =>
      parent.parent_kind === "LESSON" && lessonIds.has(parent.parent_id),
  )
}

export type PracticeUnlinkScope =
  | { scope: "course"; courseId: number; moduleIds?: number[]; lessonIds?: number[] }
  | { scope: "module"; moduleId: number; lessonIds?: number[] }
  | { scope: "lesson"; lessonId: number }
  | { scope: "unit"; unitId: number }
  | { scope: "catalog_course"; catalogCourseId: number }

export function listPracticeUnlinkParentsForScope(
  practice: ParentContextPractice,
  context: PracticeUnlinkScope,
): PracticeParent[] {
  switch (context.scope) {
    case "course":
      return listCourseContextUnlinkParents(practice, context.courseId)
    case "module":
      return listModuleContextUnlinkParents(practice, context.moduleId)
    case "lesson":
      return listLessonContextUnlinkParents(practice, context.lessonId)
    case "unit":
      return listUnitContextUnlinkParents(practice, context.unitId)
    case "catalog_course":
      return listCatalogCourseContextUnlinkParents(
        practice,
        context.catalogCourseId,
      )
  }
}

export function hasDirectPracticeLinkForScope(
  practice: ParentContextPractice,
  context: PracticeUnlinkScope,
): boolean {
  return listPracticeUnlinkParentsForScope(practice, context).length > 0
}

export function practiceUnlinkBlockedMessage(
  practice: ParentContextPractice,
  context: PracticeUnlinkScope,
): string | null {
  if (hasDirectPracticeLinkForScope(practice, context)) return null

  switch (context.scope) {
    case "course": {
      if (
        isPracticeLinkedViaDescendantInCourse(
          practice,
          context.courseId,
          context.moduleIds ?? [],
          context.lessonIds ?? [],
        )
      ) {
        return "This practice is linked to a module or lesson, not this course. Open that location to unlink it."
      }
      return "This practice is not linked to this course."
    }
    case "module": {
      if (
        isPracticeLinkedViaLessonInModule(
          practice,
          context.moduleId,
          context.lessonIds ?? [],
        )
      ) {
        return "This practice is linked to a lesson, not this module. Open the lesson to unlink it."
      }
      return "This practice is not linked to this module."
    }
    case "lesson":
      return "This practice is not linked to this lesson."
    case "unit":
      return "This practice is not linked to this unit."
    case "catalog_course":
      return "This practice is not linked to this catalog course."
  }
}

export async function unlinkPracticeFromParent(opts: {
  practiceId: number
  parent: PracticeParent
  isExamPrep?: boolean
}): Promise<ParentContextPractice> {
  const res = opts.isExamPrep
    ? await unlinkExamPrepPracticeParent(opts.practiceId, opts.parent)
    : await unlinkPracticeParent(opts.practiceId, opts.parent)
  const normalized = normalizeParentContextPractice(res.data?.data)
  if (!normalized) {
    throw new Error("Practice details were missing after unlink.")
  }
  return normalized
}

export function parentsAfterUnlink(practice: ParentContextPractice): PracticeParent[] {
  return parentsFromPractice(practice)
}

export function contextualUnlinkLabel(
  parent: PracticeParent,
  contextLabel?: string,
): string {
  if (contextLabel?.trim()) return contextLabel.trim()
  return formatPracticeParentLabel(parent)
}
