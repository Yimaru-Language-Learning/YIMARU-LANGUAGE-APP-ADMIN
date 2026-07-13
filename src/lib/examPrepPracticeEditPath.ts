import {
  getExamPrepCatalogCoursePractices,
  getExamPrepCatalogCourses,
  getExamPrepCatalogUnits,
  getExamPrepLessonPractices,
  getExamPrepModuleLessons,
  getExamPrepPracticeFull,
  getExamPrepUnitModules,
  getExamPrepUnitPractices,
} from "../api/courses.api"
import { examPrepParentsFromPractice } from "./questionTypeDefinitionPractices"
import { unwrapPracticeFullData } from "./practiceFullMapper"
import { dedupeParents, parentsFromPractice } from "./practiceParents"
import type {
  ExamPrepCatalogCourseItem,
  ExamPrepCatalogUnitItem,
  ExamPrepModuleLessonItem,
  ExamPrepUnitModuleItem,
  PracticeParent,
} from "../types/course.types"
import type { QuestionTypeDefinitionPractice } from "../types/questionTypeDefinition.types"

const PAGE_SIZE = 100
const DEFAULT_PROGRAM_TYPE = "proficiency"

type ExamPrepParentTab = "catalog_course" | "unit" | "lesson"

function listFromEnvelope<T>(
  res: { data?: { data?: Record<string, unknown>; Data?: Record<string, unknown> } },
  key: string,
): T[] {
  const body = res.data?.data ?? res.data?.Data
  if (!body || typeof body !== "object") return []
  const record = body as Record<string, unknown>
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1)
  const raw = record[key] ?? record[pascalKey]
  return Array.isArray(raw) ? (raw as T[]) : []
}

function totalFromEnvelope(
  res: { data?: { data?: Record<string, unknown>; Data?: Record<string, unknown> } },
): number | undefined {
  const body = res.data?.data ?? res.data?.Data
  if (!body || typeof body !== "object") return undefined
  const record = body as Record<string, unknown>
  const total = Number(record.total_count ?? record.TotalCount ?? record.totalCount)
  return Number.isFinite(total) && total >= 0 ? total : undefined
}

function parentTabFromKind(kind?: string): ExamPrepParentTab | null {
  const k = (kind || "").toUpperCase()
  if (k === "CATALOG_COURSE") return "catalog_course"
  if (k === "UNIT") return "unit"
  if (k === "LESSON") return "lesson"
  return null
}

function buildCatalogCourseEditPath(catalogCourseId: number, practiceId: number): string {
  return `/new-content/courses/${DEFAULT_PROGRAM_TYPE}/${catalogCourseId}/edit-practice/${practiceId}?backTo=courses`
}

function buildUnitEditPath(
  catalogCourseId: number,
  unitId: number,
  practiceId: number,
): string {
  return `/new-content/courses/${DEFAULT_PROGRAM_TYPE}/${catalogCourseId}/${unitId}/edit-practice/${practiceId}?backTo=unit`
}

function buildLessonEditPath(
  catalogCourseId: number,
  unitId: number,
  moduleId: number,
  lessonId: number,
  practiceId: number,
  lessonTitle?: string,
): string {
  const titleQuery = lessonTitle ? `lessonTitle=${encodeURIComponent(lessonTitle)}&` : ""
  return `/new-content/courses/${DEFAULT_PROGRAM_TYPE}/${catalogCourseId}/${unitId}/${moduleId}/lessons/${lessonId}/edit-practice/${practiceId}?${titleQuery}backTo=lesson`
}

async function fetchAllCatalogCourses(): Promise<ExamPrepCatalogCourseItem[]> {
  const all: ExamPrepCatalogCourseItem[] = []
  let offset = 0
  while (true) {
    const res = await getExamPrepCatalogCourses({ limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<ExamPrepCatalogCourseItem>(res, "catalog_courses")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return all
}

async function fetchAllCatalogUnits(catalogCourseId: number): Promise<ExamPrepCatalogUnitItem[]> {
  const all: ExamPrepCatalogUnitItem[] = []
  let offset = 0
  while (true) {
    const res = await getExamPrepCatalogUnits(catalogCourseId, { limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<ExamPrepCatalogUnitItem>(res, "units")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return all
}

async function fetchAllUnitModules(unitId: number): Promise<ExamPrepUnitModuleItem[]> {
  const all: ExamPrepUnitModuleItem[] = []
  let offset = 0
  while (true) {
    const res = await getExamPrepUnitModules(unitId, { limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<ExamPrepUnitModuleItem>(res, "modules")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return all
}

async function fetchAllModuleLessons(moduleId: number): Promise<ExamPrepModuleLessonItem[]> {
  const all: ExamPrepModuleLessonItem[] = []
  let offset = 0
  while (true) {
    const res = await getExamPrepModuleLessons(moduleId, { limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<ExamPrepModuleLessonItem>(res, "lessons")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return all
}

async function parentListContainsPractice(
  tab: ExamPrepParentTab,
  parentId: number,
  practiceId: number,
): Promise<boolean> {
  let offset = 0
  while (true) {
    const params = { limit: PAGE_SIZE, offset }
    const res =
      tab === "catalog_course"
        ? await getExamPrepCatalogCoursePractices(parentId, params)
        : tab === "unit"
          ? await getExamPrepUnitPractices(parentId, params)
          : await getExamPrepLessonPractices(parentId, params)
    const page = listFromEnvelope<{ id?: number; ID?: number }>(res, "practices")
    if (page.some((p) => Number(p.id ?? p.ID) === practiceId)) return true
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && offset + page.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return false
}

async function detectParentTab(
  practiceId: number,
  parentId: number,
  hintedTab: ExamPrepParentTab | null,
): Promise<ExamPrepParentTab | null> {
  if (hintedTab && (await parentListContainsPractice(hintedTab, parentId, practiceId))) {
    return hintedTab
  }
  const order: ExamPrepParentTab[] =
    hintedTab == null
      ? ["lesson", "unit", "catalog_course"]
      : (["lesson", "unit", "catalog_course"] as ExamPrepParentTab[]).filter(
          (tab) => tab !== hintedTab,
        )
  for (const tab of order) {
    if (await parentListContainsPractice(tab, parentId, practiceId)) return tab
  }
  return hintedTab
}

async function findUnitPath(unitId: number, practiceId: number): Promise<string | null> {
  const courses = await fetchAllCatalogCourses()
  for (const course of courses) {
    const units = await fetchAllCatalogUnits(course.id)
    const unit = units.find((u) => u.id === unitId)
    if (unit) {
      const catalogCourseId = unit.catalog_course_id || course.id
      return buildUnitEditPath(catalogCourseId, unit.id, practiceId)
    }
  }
  return null
}

async function findLessonPath(lessonId: number, practiceId: number): Promise<string | null> {
  const courses = await fetchAllCatalogCourses()
  for (const course of courses) {
    const units = await fetchAllCatalogUnits(course.id)
    for (const unit of units) {
      const modules = await fetchAllUnitModules(unit.id)
      for (const module of modules) {
        const lessons = await fetchAllModuleLessons(module.id)
        const lesson = lessons.find((l) => l.id === lessonId)
        if (lesson) {
          const catalogCourseId = unit.catalog_course_id || course.id
          return buildLessonEditPath(
            catalogCourseId,
            unit.id,
            module.id,
            lesson.id,
            practiceId,
            lesson.title,
          )
        }
      }
    }
  }
  return null
}

async function resolveForParent(
  practiceId: number,
  parent: PracticeParent,
): Promise<string | null> {
  const parentId = parent.parent_id
  if (parentId < 1) return null
  const hintedTab = parentTabFromKind(parent.parent_kind)
  const tab = await detectParentTab(practiceId, parentId, hintedTab)
  const resolvedTab = tab ?? hintedTab
  if (!resolvedTab) return null
  if (resolvedTab === "catalog_course") {
    return buildCatalogCourseEditPath(parentId, practiceId)
  }
  if (resolvedTab === "unit") return findUnitPath(parentId, practiceId)
  return findLessonPath(parentId, practiceId)
}

async function enrichExamPrepPracticeFromFull(
  practice: QuestionTypeDefinitionPractice,
): Promise<QuestionTypeDefinitionPractice> {
  try {
    const res = await getExamPrepPracticeFull(practice.practice_id)
    const full = unwrapPracticeFullData(res)
    const p = full?.practice
    if (!p) return practice
    const parents = dedupeParents(parentsFromPractice(p))
    return {
      ...practice,
      exam_prep_parents: parents.length > 0 ? parents : practice.exam_prep_parents,
    }
  } catch {
    return practice
  }
}

/**
 * Resolves an exam-prep edit-practice route for a practice linked to a question type definition.
 */
export async function resolveExamPrepPracticeEditPath(
  practice: QuestionTypeDefinitionPractice,
): Promise<string | null> {
  let working = practice
  if (examPrepParentsFromPractice(working).length === 0) {
    working = await enrichExamPrepPracticeFromFull(working)
  }

  const parentList = examPrepParentsFromPractice(working)
  for (const parent of parentList) {
    const path = await resolveForParent(working.practice_id, parent)
    if (path) return path
  }

  // Unlinked exam-prep shell — no hierarchy route; open the standalone editor.
  return `/new-content/practices/${working.practice_id}/edit?kind=EXAM_PREP&backTo=question-types`
}
