import {
  deleteExamPrepPractice,
  deleteParentLinkedPractice,
} from "../api/courses.api"
import type { ParentContextPractice, PracticeParent } from "../types/course.types"
import { parentsFromPractice } from "./practiceParents"
import {
  isPracticeParentUnlinkNotLinkedError,
  resolveCourseContextUnlinkParent,
  resolveModuleContextUnlinkParent,
  unlinkPracticeFromParent,
} from "./practiceParentUnlink"

export type PracticeUnlinkContext =
  | { scope: "course"; courseId: number; moduleIds: number[] }
  | { scope: "module"; moduleId: number; lessonIds: number[] }
  | { scope: "lesson"; lessonId: number }
  | { scope: "unit"; unitId: number }
  | { scope: "catalog_course"; catalogCourseId: number }

export type BulkPracticeActionResult = {
  succeeded: number
  skipped: number
  failed: number
}

export function resolvePracticeUnlinkParent(
  practice: ParentContextPractice,
  context: PracticeUnlinkContext,
): PracticeParent | null {
  switch (context.scope) {
    case "course":
      return resolveCourseContextUnlinkParent(
        practice,
        context.courseId,
        context.moduleIds,
      )
    case "module":
      return resolveModuleContextUnlinkParent(
        practice,
        context.moduleId,
        context.lessonIds,
      )
    case "lesson":
      return (
        parentsFromPractice(practice).find(
          (p) =>
            p.parent_kind === "LESSON" && p.parent_id === context.lessonId,
        ) ?? null
      )
    case "unit":
      return (
        parentsFromPractice(practice).find(
          (p) => p.parent_kind === "UNIT" && p.parent_id === context.unitId,
        ) ?? null
      )
    case "catalog_course":
      return (
        parentsFromPractice(practice).find(
          (p) =>
            p.parent_kind === "CATALOG_COURSE" &&
            p.parent_id === context.catalogCourseId,
        ) ?? null
      )
  }
}

export async function bulkUnlinkPractices(opts: {
  practices: ParentContextPractice[]
  context: PracticeUnlinkContext
  isExamPrep: boolean
}): Promise<BulkPracticeActionResult> {
  const result: BulkPracticeActionResult = {
    succeeded: 0,
    skipped: 0,
    failed: 0,
  }

  for (const practice of opts.practices) {
    const parent = resolvePracticeUnlinkParent(practice, opts.context)
    if (!parent) {
      result.skipped += 1
      continue
    }
    try {
      await unlinkPracticeFromParent({
        practiceId: practice.id,
        parent,
        isExamPrep: opts.isExamPrep,
      })
      result.succeeded += 1
    } catch (error) {
      if (isPracticeParentUnlinkNotLinkedError(error)) {
        result.skipped += 1
      } else {
        result.failed += 1
      }
    }
  }

  return result
}

export async function bulkDeletePractices(opts: {
  practices: ParentContextPractice[]
  isExamPrep: boolean
}): Promise<BulkPracticeActionResult> {
  const result: BulkPracticeActionResult = {
    succeeded: 0,
    skipped: 0,
    failed: 0,
  }

  for (const practice of opts.practices) {
    try {
      if (opts.isExamPrep) {
        await deleteExamPrepPractice(practice.id)
      } else {
        await deleteParentLinkedPractice(practice.id)
      }
      result.succeeded += 1
    } catch {
      result.failed += 1
    }
  }

  return result
}

export function formatBulkPracticeActionToast(
  action: "unlink" | "delete",
  locationLabel: string,
  result: BulkPracticeActionResult,
): { kind: "success" | "info" | "error"; message: string } {
  const { succeeded, skipped, failed } = result
  const count = succeeded + skipped + failed

  if (succeeded === 0 && failed === 0 && skipped > 0) {
    return {
      kind: "info",
      message:
        action === "unlink"
          ? "Selected practices were already removed from this location."
          : "No practices were deleted.",
    }
  }

  if (failed > 0 && succeeded === 0) {
    return {
      kind: "error",
      message:
        action === "unlink"
          ? `Could not unlink ${failed} of ${count} selected practice${count === 1 ? "" : "s"}.`
          : `Could not delete ${failed} of ${count} selected practice${count === 1 ? "" : "s"}.`,
    }
  }

  if (action === "unlink") {
    let message = `Removed ${succeeded} practice${succeeded === 1 ? "" : "s"} from ${locationLabel}.`
    if (skipped > 0) {
      message += ` ${skipped} ${skipped === 1 ? "was" : "were"} already removed or could not be matched.`
    }
    if (failed > 0) {
      message += ` ${failed} failed.`
    }
    return { kind: failed > 0 ? "info" : "success", message }
  }

  let message = `Deleted ${succeeded} practice${succeeded === 1 ? "" : "s"}.`
  if (failed > 0) {
    message += ` ${failed} could not be deleted.`
  }
  return { kind: failed > 0 ? "info" : "success", message }
}
