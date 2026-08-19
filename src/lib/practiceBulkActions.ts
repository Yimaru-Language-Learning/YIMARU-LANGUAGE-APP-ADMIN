import {
  deleteExamPrepPractice,
  deleteParentLinkedPractice,
} from "../api/courses.api"
import type { ParentContextPractice } from "../types/course.types"
import {
  isPracticeParentUnlinkNotLinkedError,
  listPracticeUnlinkParentsForScope,
  type PracticeUnlinkScope,
  unlinkPracticeFromParent,
} from "./practiceParentUnlink"

export type PracticeUnlinkContext = PracticeUnlinkScope

export type BulkPracticeActionResult = {
  succeeded: number
  skipped: number
  failed: number
}

export function listPracticeUnlinkParents(
  practice: ParentContextPractice,
  context: PracticeUnlinkContext,
) {
  return listPracticeUnlinkParentsForScope(practice, context)
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
    const parents = listPracticeUnlinkParents(practice, opts.context)
    if (parents.length === 0) {
      result.skipped += 1
      continue
    }

    let practiceSucceeded = false
    let practiceFailed = false
    let practiceSkipped = false

    for (const parent of parents) {
      try {
        await unlinkPracticeFromParent({
          practiceId: practice.id,
          parent,
          isExamPrep: opts.isExamPrep,
        })
        practiceSucceeded = true
      } catch (error) {
        if (isPracticeParentUnlinkNotLinkedError(error)) {
          practiceSkipped = true
        } else {
          practiceFailed = true
        }
      }
    }

    if (practiceFailed) {
      result.failed += 1
    } else if (practiceSucceeded) {
      result.succeeded += 1
    } else if (practiceSkipped) {
      result.skipped += 1
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
          ? "Selected practices are not directly linked to this location (they may appear via a child module or lesson)."
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
      message += ` ${skipped} ${skipped === 1 ? "was" : "were"} not directly linked here.`
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
