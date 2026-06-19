import {
  getLearnEnglishPracticeFull,
  getLearningPrograms,
  getModuleLessons,
  getPracticesByParentCourse,
  getPracticesByParentLesson,
  getPracticesByParentModule,
  getProgramCourses,
  getTopLevelCourseModules,
} from "../api/courses.api"
import { unwrapPracticeFullData } from "./practiceFullMapper"
import { parentsFromPractice } from "./practiceParents"
import type {
  LearningProgramListItem,
  ProgramCourseListItem,
  TopLevelCourseModuleItem,
  TopLevelModuleLessonItem,
} from "../types/course.types"
import type { QuestionTypeDefinitionPractice } from "../types/questionTypeDefinition.types"

const PAGE_SIZE = 100

type ParentTab = "course" | "module" | "lesson"

const sortBySortOrder = <T extends { sort_order?: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

function parentTabFromKind(kind?: string): ParentTab | null {
  const k = (kind || "").toUpperCase()
  if (k === "COURSE") return "course"
  if (k === "MODULE") return "module"
  if (k === "LESSON") return "lesson"
  return null
}

function pickNum(...values: unknown[]): number | undefined {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }
  return undefined
}

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

async function fetchAllLearningPrograms(): Promise<LearningProgramListItem[]> {
  const all: LearningProgramListItem[] = []
  let offset = 0
  while (true) {
    const res = await getLearningPrograms({ limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<LearningProgramListItem>(res, "programs")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return sortBySortOrder(all)
}

async function fetchAllProgramCourses(programId: number): Promise<ProgramCourseListItem[]> {
  const all: ProgramCourseListItem[] = []
  let offset = 0
  while (true) {
    const res = await getProgramCourses(programId, { limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<ProgramCourseListItem>(res, "courses")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return sortBySortOrder(all)
}

async function fetchAllCourseModules(courseId: number): Promise<TopLevelCourseModuleItem[]> {
  const all: TopLevelCourseModuleItem[] = []
  let offset = 0
  while (true) {
    const res = await getTopLevelCourseModules(courseId, { limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<TopLevelCourseModuleItem>(res, "modules")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return sortBySortOrder(all)
}

async function fetchAllModuleLessons(moduleId: number): Promise<TopLevelModuleLessonItem[]> {
  const all: TopLevelModuleLessonItem[] = []
  let offset = 0
  while (true) {
    const res = await getModuleLessons(moduleId, { limit: PAGE_SIZE, offset })
    const page = listFromEnvelope<TopLevelModuleLessonItem>(res, "lessons")
    all.push(...page)
    const total = totalFromEnvelope(res)
    if (page.length === 0) break
    if (total != null && all.length >= total) break
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return sortBySortOrder(all)
}

async function parentListContainsPractice(
  tab: ParentTab,
  parentId: number,
  practiceId: number,
): Promise<boolean> {
  let offset = 0
  while (true) {
    const params = { limit: PAGE_SIZE, offset }
    const res =
      tab === "course"
        ? await getPracticesByParentCourse(parentId, params)
        : tab === "module"
          ? await getPracticesByParentModule(parentId, params)
          : await getPracticesByParentLesson(parentId, params)
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

/** Confirms which parent entity owns this practice when parent_kind is missing or unreliable. */
async function detectParentTab(
  practiceId: number,
  parentId: number,
  hintedTab: ParentTab | null,
): Promise<ParentTab | null> {
  if (hintedTab && (await parentListContainsPractice(hintedTab, parentId, practiceId))) {
    return hintedTab
  }
  const order: ParentTab[] =
    hintedTab == null
      ? ["lesson", "module", "course"]
      : (["lesson", "module", "course"] as ParentTab[]).filter((tab) => tab !== hintedTab)
  for (const tab of order) {
    if (await parentListContainsPractice(tab, parentId, practiceId)) return tab
  }
  return hintedTab
}

function buildCourseEditPath(programId: number, courseId: number, practiceId: number): string {
  return `/new-content/learn-english/${programId}/courses/${courseId}/edit-practice/${practiceId}?backTo=courses`
}

function buildModuleEditPath(
  programId: number,
  courseId: number,
  moduleId: number,
  practiceId: number,
): string {
  return `/new-content/learn-english/${programId}/courses/${courseId}/modules/${moduleId}/edit-practice/${practiceId}?backTo=module`
}

function buildLessonEditPath(
  programId: number,
  courseId: number,
  moduleId: number,
  lessonId: number,
  practiceId: number,
  lessonTitle?: string,
): string {
  const titleQuery = lessonTitle ? `lessonTitle=${encodeURIComponent(lessonTitle)}&` : ""
  return `/new-content/learn-english/${programId}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/edit-practice/${practiceId}?${titleQuery}backTo=lesson`
}

async function resolveFromDirectNavFields(
  practice: QuestionTypeDefinitionPractice,
): Promise<string | null> {
  const programId = pickNum(practice.program_id)
  const courseId = pickNum(practice.course_id)
  const moduleId = pickNum(practice.module_id)
  const lessonId = pickNum(practice.lesson_id)
  if (!programId || !courseId) return null
  if (lessonId && moduleId) {
    return buildLessonEditPath(programId, courseId, moduleId, lessonId, practice.practice_id, practice.title)
  }
  if (moduleId) {
    return buildModuleEditPath(programId, courseId, moduleId, practice.practice_id)
  }
  return buildCourseEditPath(programId, courseId, practice.practice_id)
}

async function findCoursePath(
  courseId: number,
  practiceId: number,
): Promise<string | null> {
  const programs = await fetchAllLearningPrograms()
  for (const program of programs) {
    const courses = await fetchAllProgramCourses(program.id)
    const course = courses.find((c) => c.id === courseId)
    if (course) {
      const programId = course.program_id || program.id
      return buildCourseEditPath(programId, course.id, practiceId)
    }
  }
  return null
}

async function findModulePath(
  moduleId: number,
  practiceId: number,
): Promise<string | null> {
  const programs = await fetchAllLearningPrograms()
  for (const program of programs) {
    const courses = await fetchAllProgramCourses(program.id)
    for (const course of courses) {
      const modules = await fetchAllCourseModules(course.id)
      const module = modules.find((m) => m.id === moduleId)
      if (module) {
        const programId = module.program_id || course.program_id || program.id
        const resolvedCourseId = module.course_id || course.id
        return buildModuleEditPath(programId, resolvedCourseId, module.id, practiceId)
      }
    }
  }
  return null
}

async function findLessonPath(
  lessonId: number,
  practiceId: number,
): Promise<string | null> {
  const programs = await fetchAllLearningPrograms()
  for (const program of programs) {
    const courses = await fetchAllProgramCourses(program.id)
    for (const course of courses) {
      const modules = await fetchAllCourseModules(course.id)
      for (const module of modules) {
        const lessons = await fetchAllModuleLessons(module.id)
        const lesson = lessons.find((l) => l.id === lessonId)
        if (lesson) {
          const programId = module.program_id || course.program_id || program.id
          const courseId = module.course_id || course.id
          return buildLessonEditPath(
            programId,
            courseId,
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
  parent: { parent_kind: string; parent_id: number },
): Promise<string | null> {
  const parentId = parent.parent_id
  if (parentId < 1) return null
  const hintedTab = parentTabFromKind(parent.parent_kind)
  const tab = await detectParentTab(practiceId, parentId, hintedTab)
  const resolvedTab = tab ?? hintedTab
  if (!resolvedTab) return null
  if (resolvedTab === "course") return findCoursePath(parentId, practiceId)
  if (resolvedTab === "module") return findModulePath(parentId, practiceId)
  return findLessonPath(parentId, practiceId)
}

async function enrichPracticeFromFull(
  practice: QuestionTypeDefinitionPractice,
): Promise<QuestionTypeDefinitionPractice> {
  try {
    const res = await getLearnEnglishPracticeFull(practice.practice_id)
    const full = unwrapPracticeFullData(res)
    const p = full?.practice
    if (!p) return practice
    const parents = parentsFromPractice(p)
    return {
      ...practice,
      parents,
      parent_kind: parents[0]?.parent_kind,
      parent_id: parents[0]?.parent_id,
      lesson_id: p.lesson_id ?? practice.lesson_id,
    }
  } catch {
    return practice
  }
}

async function resolveLearnEnglishPath(
  practice: QuestionTypeDefinitionPractice,
): Promise<string | null> {
  const direct = await resolveFromDirectNavFields(practice)
  if (direct) return direct

  let working = practice
  if (!working.parents?.length) {
    working = await enrichPracticeFromFull(working)
  }

  const parentList =
    working.parents?.length > 0
      ? working.parents
      : parentsFromPractice(working)

  for (const parent of parentList) {
    const path = await resolveForParent(working.practice_id, parent)
    if (path) return path
  }

  return null
}

/**
 * Resolves a Learn English edit-practice route for a practice linked to a question type definition.
 */
export async function resolveLearnEnglishPracticeEditPath(
  practice: QuestionTypeDefinitionPractice,
): Promise<string | null> {
  if ((practice.practice_kind || "LMS").toUpperCase() !== "LMS") return null
  return resolveLearnEnglishPath(practice)
}
