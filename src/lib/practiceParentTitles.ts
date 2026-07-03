import {
  getExamPrepCatalogCourses,
  getExamPrepCatalogUnits,
  getExamPrepModuleLessons,
  getExamPrepUnitModules,
  getLearningPrograms,
  getModuleLessons,
  getProgramCourses,
  getTopLevelCourseModules,
} from "../api/courses.api"
import type { PracticeParent, PracticeParentKind } from "../types/course.types"
import {
  dedupeParents,
  formatPracticeParentLabel,
  formatPracticeParentsSummary,
} from "./practiceParents"

const LIST_LIMIT = 200

export type PracticeParentTitleMap = Map<string, string>

export type PracticeParentTitleHints = {
  courses?: Record<number, string>
  modules?: Record<number, string>
  lessons?: Record<number, string>
}

export function practiceParentKey(parent: PracticeParent): string {
  return `${parent.parent_kind}:${parent.parent_id}`
}

function kindLabel(kind: PracticeParentKind): string {
  if (kind === "CATALOG_COURSE") return "Catalog course"
  if (kind === "UNIT") return "Unit"
  if (kind === "COURSE") return "Course"
  if (kind === "MODULE") return "Module"
  return "Lesson"
}

export function formatPracticeParentDisplayLabel(
  parent: PracticeParent,
  titles?: PracticeParentTitleMap | null,
): string {
  const title = titles?.get(practiceParentKey(parent))?.trim()
  if (title) return `${kindLabel(parent.parent_kind)}: ${title}`
  return formatPracticeParentLabel(parent)
}

export function formatPracticeParentsDisplaySummary(
  parents: PracticeParent[],
  titles?: PracticeParentTitleMap | null,
): string {
  const list = dedupeParents(parents)
  if (list.length === 0) return formatPracticeParentsSummary([])
  return list.map((parent) => formatPracticeParentDisplayLabel(parent, titles)).join(" · ")
}

function applyHints(
  map: PracticeParentTitleMap,
  hints?: PracticeParentTitleHints,
): void {
  for (const [id, title] of Object.entries(hints?.courses ?? {})) {
    const n = Number(id)
    if (Number.isFinite(n) && n > 0 && title?.trim()) map.set(`COURSE:${n}`, title.trim())
  }
  for (const [id, title] of Object.entries(hints?.modules ?? {})) {
    const n = Number(id)
    if (Number.isFinite(n) && n > 0 && title?.trim()) map.set(`MODULE:${n}`, title.trim())
  }
  for (const [id, title] of Object.entries(hints?.lessons ?? {})) {
    const n = Number(id)
    if (Number.isFinite(n) && n > 0 && title?.trim()) map.set(`LESSON:${n}`, title.trim())
  }
}

async function resolveLearnEnglishCourseTitles(
  ids: Set<number>,
  map: PracticeParentTitleMap,
): Promise<void> {
  if (ids.size === 0) return
  const progRes = await getLearningPrograms({ limit: LIST_LIMIT, offset: 0 })
  const programs = progRes.data?.data?.programs ?? []
  for (const program of programs) {
    if (ids.size === 0) break
    const cRes = await getProgramCourses(program.id, { limit: LIST_LIMIT, offset: 0 })
    for (const course of cRes.data?.data?.courses ?? []) {
      if (ids.has(course.id)) {
        map.set(`COURSE:${course.id}`, course.name?.trim() || `Course #${course.id}`)
        ids.delete(course.id)
      }
    }
  }
}

async function resolveExamPrepCourseTitles(
  ids: Set<number>,
  map: PracticeParentTitleMap,
): Promise<void> {
  if (ids.size === 0) return
  const res = await getExamPrepCatalogCourses({ limit: LIST_LIMIT, offset: 0 })
  for (const course of res.data?.data?.catalog_courses ?? []) {
    if (ids.has(course.id)) {
      const title = course.name?.trim() || `Course #${course.id}`
      map.set(`CATALOG_COURSE:${course.id}`, title)
      map.set(`COURSE:${course.id}`, title)
      ids.delete(course.id)
    }
  }
}

async function resolveExamPrepUnitTitles(
  ids: Set<number>,
  map: PracticeParentTitleMap,
): Promise<void> {
  if (ids.size === 0) return
  const coursesRes = await getExamPrepCatalogCourses({ limit: LIST_LIMIT, offset: 0 })
  for (const course of coursesRes.data?.data?.catalog_courses ?? []) {
    if (ids.size === 0) break
    const unitsRes = await getExamPrepCatalogUnits(course.id, { limit: LIST_LIMIT, offset: 0 })
    for (const unit of unitsRes.data?.data?.units ?? []) {
      if (ids.has(unit.id)) {
        map.set(`UNIT:${unit.id}`, unit.name?.trim() || `Unit #${unit.id}`)
        ids.delete(unit.id)
      }
    }
  }
}

async function resolveLearnEnglishModuleTitles(
  ids: Set<number>,
  map: PracticeParentTitleMap,
): Promise<void> {
  if (ids.size === 0) return
  const progRes = await getLearningPrograms({ limit: LIST_LIMIT, offset: 0 })
  const programs = progRes.data?.data?.programs ?? []
  for (const program of programs) {
    if (ids.size === 0) break
    const cRes = await getProgramCourses(program.id, { limit: LIST_LIMIT, offset: 0 })
    const courses = cRes.data?.data?.courses ?? []
    const moduleBatches = await Promise.all(
      courses.map((course) =>
        getTopLevelCourseModules(course.id, { limit: LIST_LIMIT, offset: 0 }),
      ),
    )
    for (let i = 0; i < courses.length; i++) {
      for (const module of moduleBatches[i].data?.data?.modules ?? []) {
        if (ids.has(module.id)) {
          map.set(`MODULE:${module.id}`, module.name?.trim() || `Module #${module.id}`)
          ids.delete(module.id)
        }
      }
      if (ids.size === 0) break
    }
  }
}

async function resolveExamPrepModuleTitles(
  ids: Set<number>,
  map: PracticeParentTitleMap,
): Promise<void> {
  if (ids.size === 0) return
  const coursesRes = await getExamPrepCatalogCourses({ limit: LIST_LIMIT, offset: 0 })
  const catalogCourses = coursesRes.data?.data?.catalog_courses ?? []
  for (const course of catalogCourses) {
    if (ids.size === 0) break
    const unitsRes = await getExamPrepCatalogUnits(course.id, { limit: LIST_LIMIT, offset: 0 })
    const units = unitsRes.data?.data?.units ?? []
    for (const unit of units) {
      const modulesRes = await getExamPrepUnitModules(unit.id, { limit: LIST_LIMIT, offset: 0 })
      for (const module of modulesRes.data?.data?.modules ?? []) {
        if (ids.has(module.id)) {
          map.set(`MODULE:${module.id}`, module.name?.trim() || `Module #${module.id}`)
          ids.delete(module.id)
        }
      }
      if (ids.size === 0) break
    }
  }
}

async function resolveLearnEnglishLessonTitles(
  ids: Set<number>,
  map: PracticeParentTitleMap,
): Promise<void> {
  if (ids.size === 0) return
  const progRes = await getLearningPrograms({ limit: LIST_LIMIT, offset: 0 })
  const programs = progRes.data?.data?.programs ?? []
  for (const program of programs) {
    if (ids.size === 0) break
    const cRes = await getProgramCourses(program.id, { limit: LIST_LIMIT, offset: 0 })
    const courses = cRes.data?.data?.courses ?? []
    for (const course of courses) {
      if (ids.size === 0) break
      const mRes = await getTopLevelCourseModules(course.id, { limit: LIST_LIMIT, offset: 0 })
      const modules = mRes.data?.data?.modules ?? []
      const lessonBatches = await Promise.all(
        modules.map((module) =>
          getModuleLessons(module.id, { limit: LIST_LIMIT, offset: 0 }),
        ),
      )
      for (let i = 0; i < modules.length; i++) {
        for (const lesson of lessonBatches[i].data?.data?.lessons ?? []) {
          if (ids.has(lesson.id)) {
            map.set(`LESSON:${lesson.id}`, lesson.title?.trim() || `Lesson #${lesson.id}`)
            ids.delete(lesson.id)
          }
        }
        if (ids.size === 0) break
      }
    }
  }
}

async function resolveExamPrepLessonTitles(
  ids: Set<number>,
  map: PracticeParentTitleMap,
): Promise<void> {
  if (ids.size === 0) return
  const coursesRes = await getExamPrepCatalogCourses({ limit: LIST_LIMIT, offset: 0 })
  const catalogCourses = coursesRes.data?.data?.catalog_courses ?? []
  for (const course of catalogCourses) {
    if (ids.size === 0) break
    const unitsRes = await getExamPrepCatalogUnits(course.id, { limit: LIST_LIMIT, offset: 0 })
    const units = unitsRes.data?.data?.units ?? []
    for (const unit of units) {
      if (ids.size === 0) break
      const modulesRes = await getExamPrepUnitModules(unit.id, { limit: LIST_LIMIT, offset: 0 })
      const modules = modulesRes.data?.data?.modules ?? []
      for (const module of modules) {
        if (ids.size === 0) break
        const lessonsRes = await getExamPrepModuleLessons(module.id, {
          limit: LIST_LIMIT,
          offset: 0,
        })
        for (const lesson of lessonsRes.data?.data?.lessons ?? []) {
          if (ids.has(lesson.id)) {
            map.set(`LESSON:${lesson.id}`, lesson.title?.trim() || `Lesson #${lesson.id}`)
            ids.delete(lesson.id)
          }
        }
      }
    }
  }
}

export async function resolvePracticeParentTitles(
  parents: PracticeParent[],
  hints?: PracticeParentTitleHints,
): Promise<PracticeParentTitleMap> {
  const map: PracticeParentTitleMap = new Map()
  applyHints(map, hints)

  const normalized = dedupeParents(parents)
  const unresolvedCourses = new Set<number>()
  const unresolvedCatalogCourses = new Set<number>()
  const unresolvedUnits = new Set<number>()
  const unresolvedModules = new Set<number>()
  const unresolvedLessons = new Set<number>()

  for (const parent of normalized) {
    if (map.has(practiceParentKey(parent))) continue
    if (parent.parent_kind === "COURSE") unresolvedCourses.add(parent.parent_id)
    if (parent.parent_kind === "CATALOG_COURSE") unresolvedCatalogCourses.add(parent.parent_id)
    if (parent.parent_kind === "UNIT") unresolvedUnits.add(parent.parent_id)
    if (parent.parent_kind === "MODULE") unresolvedModules.add(parent.parent_id)
    if (parent.parent_kind === "LESSON") unresolvedLessons.add(parent.parent_id)
  }

  await resolveLearnEnglishCourseTitles(unresolvedCourses, map)
  await resolveExamPrepCourseTitles(unresolvedCatalogCourses, map)
  await resolveExamPrepUnitTitles(unresolvedUnits, map)
  await resolveLearnEnglishModuleTitles(unresolvedModules, map)
  await resolveExamPrepModuleTitles(unresolvedModules, map)
  await resolveLearnEnglishLessonTitles(unresolvedLessons, map)
  await resolveExamPrepLessonTitles(unresolvedLessons, map)

  return map
}
