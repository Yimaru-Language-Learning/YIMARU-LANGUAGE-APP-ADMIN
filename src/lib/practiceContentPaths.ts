import type { PracticeParent } from "../types/course.types"
import { formatPracticeParentLabel } from "./practiceParents"

export interface PracticeContentPathOptions {
  isExamPrep: boolean
  level?: string | null
  programType?: string | null
  courseId?: string | null
  unitId?: string | null
  moduleId?: string | null
  lessonId?: string | null
  lessonTitle?: string | null
  backTo?: string | null
}

export function resolvePracticeParentFromPathOptions(
  options: PracticeContentPathOptions,
): PracticeParent | null {
  const lessonId = options.lessonId?.trim()
  if (lessonId) {
    const id = Number(lessonId)
    if (Number.isFinite(id) && id > 0) {
      return { parent_kind: "LESSON", parent_id: id }
    }
  }

  const backTo = options.backTo?.trim()
  const moduleId = options.moduleId?.trim()
  if (backTo === "module" && moduleId) {
    const id = Number(moduleId)
    if (Number.isFinite(id) && id > 0) {
      return { parent_kind: "MODULE", parent_id: id }
    }
  }

  if (options.isExamPrep && moduleId && !lessonId) {
    const id = Number(moduleId)
    if (Number.isFinite(id) && id > 0) {
      return { parent_kind: "MODULE", parent_id: id }
    }
  }

  const courseId = options.courseId?.trim()
  if ((backTo === "modules" || backTo === "courses") && courseId) {
    const id = Number(courseId)
    if (Number.isFinite(id) && id > 0) {
      return { parent_kind: "COURSE", parent_id: id }
    }
  }

  return null
}

export function resolvePracticeParentSummaryFromPathOptions(
  options: PracticeContentPathOptions,
  parentLabel?: string | null,
): string {
  const parent = resolvePracticeParentFromPathOptions(options)
  if (parent) return formatPracticeParentLabel(parent)
  if (parentLabel?.trim()) return parentLabel.trim()
  const lessonTitle = options.lessonTitle?.trim()
  if (options.lessonId?.trim()) {
    return `Lesson #${options.lessonId.trim()}${lessonTitle ? ` — ${lessonTitle}` : ""}`
  }
  if (options.moduleId?.trim()) return `Module #${options.moduleId.trim()}`
  if (options.courseId?.trim()) return `Course #${options.courseId.trim()}`
  return "selected content"
}

function buildPracticeQuery(options: PracticeContentPathOptions): string {
  const params = new URLSearchParams()
  if (options.backTo?.trim()) params.set("backTo", options.backTo.trim())
  if (options.courseId?.trim()) params.set("courseId", options.courseId.trim())
  if (options.moduleId?.trim()) params.set("moduleId", options.moduleId.trim())
  if (options.lessonId?.trim()) params.set("lessonId", options.lessonId.trim())
  if (options.lessonTitle?.trim()) {
    params.set("lessonTitle", encodeURIComponent(options.lessonTitle.trim()))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function practiceBasePath(options: PracticeContentPathOptions): string {
  if (options.isExamPrep) {
    const programType = options.programType?.trim()
    const courseId = options.courseId?.trim()
    const unitId = options.unitId?.trim()
    const moduleId = options.moduleId?.trim()
    if (programType && courseId && unitId && moduleId) {
      return `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}`
    }
    if (programType && courseId) {
      return `/new-content/courses/${programType}/${courseId}`
    }
    if (programType) {
      return `/new-content/courses/${programType}`
    }
    return "/new-content/courses"
  }

  const level = options.level?.trim() || "a1"
  return `/new-content/learn-english/${level}/courses`
}

export function buildPracticeContentPaths(
  options: PracticeContentPathOptions,
): { create: string; attach: string } {
  const base = practiceBasePath(options)
  const query = buildPracticeQuery(options)
  return {
    create: `${base}/add-practice${query}`,
    attach: `${base}/attach-practice${query}`,
  }
}
