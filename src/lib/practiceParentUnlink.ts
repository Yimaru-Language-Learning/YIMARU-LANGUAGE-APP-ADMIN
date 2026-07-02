import type { AxiosError } from "axios"
import {
  unlinkExamPrepPracticeParent,
  unlinkPracticeParent,
} from "../api/courses.api"
import type { ParentContextPractice, PracticeParent } from "../types/course.types"
import { normalizeParentContextPractice } from "./parentContextPractice"
import { formatPracticeParentLabel, parentsFromPractice } from "./practiceParents"

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
