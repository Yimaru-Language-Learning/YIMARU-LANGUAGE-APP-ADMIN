import { notifyApiError } from "../../../lib/apiErrors"
import { useCallback, useEffect, useState } from "react"
import {
  BookOpen,
  GraduationCap,
  Layers,
  Loader2,
  PlayCircle,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import {
  getExamPrepCatalogCourses,
  getExamPrepCatalogUnits,
  getExamPrepModuleLessons,
  getExamPrepUnitModules,
  reorderExamPrepCatalogCourses,
  reorderExamPrepLessonsInModule,
  reorderExamPrepModulesInUnit,
  reorderExamPrepUnitsInCatalogCourse,
} from "../../../api/courses.api"
import {
  DraggableList,
  HierarchySection,
  sortBySortOrder,
  type BaseItem,
} from "./ContentHierarchyList"
import {
  fetchAllOffsetPages,
  offsetPageFromListEnvelope,
} from "../../../lib/fetchAllOffsetPages"
import type {
  ExamPrepCatalogCourseItem,
  ExamPrepCatalogUnitItem,
  ExamPrepModuleLessonItem,
  ExamPrepUnitModuleItem,
} from "../../../types/course.types"

interface CatalogCourse extends BaseItem {}
interface Unit extends BaseItem {
  catalogCourseId: string
}
interface UnitModule extends BaseItem {
  unitId: string
}
interface ModuleLesson extends BaseItem {
  moduleId: string
}

export function ExamPrepContentHierarchyList() {
  const [catalogCourses, setCatalogCourses] = useState<CatalogCourse[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [modules, setModules] = useState<UnitModule[]>([])
  const [lessons, setLessons] = useState<ModuleLesson[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    catalogCourse: true,
  })

  const fetchHierarchy = useCallback(async () => {
    setLoading({ catalogCourse: true })
    try {
      const catalogRows = await fetchAllOffsetPages(async (offset, limit) =>
        offsetPageFromListEnvelope<ExamPrepCatalogCourseItem>(
          await getExamPrepCatalogCourses({ limit, offset }),
          "catalog_courses",
        ),
      )
      const fetchedCourses: CatalogCourse[] = sortBySortOrder(catalogRows).map((c) => ({
        id: String(c.id),
        name: c.name,
        thumbnail: c.thumbnail ?? undefined,
      }))
      setCatalogCourses(fetchedCourses)
      setLoading((prev) => ({ ...prev, catalogCourse: false }))

      if (fetchedCourses.length === 0) {
        setUnits([])
        setModules([])
        setLessons([])
        return
      }

      setLoading((prev) => ({ ...prev, unit: true }))
      const unitsResults = await Promise.all(
        fetchedCourses.map((c) =>
          fetchAllOffsetPages(async (offset, limit) =>
            offsetPageFromListEnvelope<ExamPrepCatalogUnitItem>(
              await getExamPrepCatalogUnits(Number(c.id), { limit, offset }),
              "units",
            ),
          ),
        ),
      )
      const fetchedUnits: Unit[] = unitsResults.flatMap((rows, idx) =>
        sortBySortOrder(rows).map((u) => ({
          id: String(u.id),
          name: u.name,
          thumbnail: u.thumbnail ?? undefined,
          catalogCourseId: fetchedCourses[idx].id,
        })),
      )
      setUnits(fetchedUnits)
      setLoading((prev) => ({ ...prev, unit: false }))

      if (fetchedUnits.length === 0) {
        setModules([])
        setLessons([])
        return
      }

      setLoading((prev) => ({ ...prev, module: true }))
      const modulesResults = await Promise.all(
        fetchedUnits.map((u) =>
          fetchAllOffsetPages(async (offset, limit) =>
            offsetPageFromListEnvelope<ExamPrepUnitModuleItem>(
              await getExamPrepUnitModules(Number(u.id), { limit, offset }),
              "modules",
            ),
          ),
        ),
      )
      const fetchedModules: UnitModule[] = modulesResults.flatMap((rows, idx) =>
        sortBySortOrder(rows).map((m) => ({
          id: String(m.id),
          name: m.name,
          thumbnail: m.thumbnail ?? m.icon ?? undefined,
          unitId: fetchedUnits[idx].id,
        })),
      )
      setModules(fetchedModules)
      setLoading((prev) => ({ ...prev, module: false }))

      if (fetchedModules.length === 0) {
        setLessons([])
        return
      }

      setLoading((prev) => ({ ...prev, lesson: true }))
      const lessonsResults = await Promise.all(
        fetchedModules.map((m) =>
          fetchAllOffsetPages(async (offset, limit) =>
            offsetPageFromListEnvelope<ExamPrepModuleLessonItem>(
              await getExamPrepModuleLessons(Number(m.id), { limit, offset }),
              "lessons",
            ),
          ),
        ),
      )
      const fetchedLessons: ModuleLesson[] = lessonsResults.flatMap((rows, idx) =>
        sortBySortOrder(rows).map((l) => ({
          id: String(l.id),
          name: l.title,
          thumbnail: l.thumbnail ?? undefined,
          moduleId: fetchedModules[idx].id,
        })),
      )
      setLessons(fetchedLessons)
    } catch (error) {
      console.error("Failed to fetch exam prep hierarchy:", error)
      notifyApiError(error, "Failed to load Duolingo/IELTS content")
    } finally {
      setLoading({})
    }
  }, [])

  useEffect(() => {
    void fetchHierarchy()
  }, [fetchHierarchy])

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toOrderedIds = (items: BaseItem[]) => items.map((item) => Number(item.id))

  const reorderSiblings = <T extends BaseItem>(
    siblings: T[],
    activeId: string,
    overId: string,
  ): T[] | null => {
    const oldIndex = siblings.findIndex((i) => i.id === activeId)
    const newIndex = siblings.findIndex((i) => i.id === overId)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return null
    }
    const next = [...siblings]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    return next
  }

  const handleCatalogCourseReorder = async (activeId: string, overId: string) => {
    const reordered = reorderSiblings(catalogCourses, activeId, overId)
    if (!reordered) return
    const previous = catalogCourses
    setCatalogCourses(reordered)
    try {
      await reorderExamPrepCatalogCourses({ ordered_ids: toOrderedIds(reordered) })
      toast.success("Catalog courses reordered")
    } catch (error) {
      setCatalogCourses(previous)
      notifyApiError(error, "Failed to reorder catalog courses")
    }
  }

  const handleUnitReorder = async (
    catalogCourseId: string,
    activeId: string,
    overId: string,
  ) => {
    const siblings = units.filter((u) => u.catalogCourseId === catalogCourseId)
    const reordered = reorderSiblings(siblings, activeId, overId)
    if (!reordered) return
    const previous = units
    setUnits((prev) => [
      ...prev.filter((u) => u.catalogCourseId !== catalogCourseId),
      ...reordered,
    ])
    try {
      await reorderExamPrepUnitsInCatalogCourse(Number(catalogCourseId), {
        ordered_ids: toOrderedIds(reordered),
      })
      toast.success("Units reordered")
    } catch (error) {
      setUnits(previous)
      notifyApiError(error, "Failed to reorder units")
    }
  }

  const handleModuleReorder = async (unitId: string, activeId: string, overId: string) => {
    const siblings = modules.filter((m) => m.unitId === unitId)
    const reordered = reorderSiblings(siblings, activeId, overId)
    if (!reordered) return
    const previous = modules
    setModules((prev) => [
      ...prev.filter((m) => m.unitId !== unitId),
      ...reordered,
    ])
    try {
      await reorderExamPrepModulesInUnit(Number(unitId), {
        ordered_ids: toOrderedIds(reordered),
      })
      toast.success("Modules reordered")
    } catch (error) {
      setModules(previous)
      notifyApiError(error, "Failed to reorder modules")
    }
  }

  const handleLessonReorder = async (
    moduleId: string,
    activeId: string,
    overId: string,
  ) => {
    const siblings = lessons.filter((l) => l.moduleId === moduleId)
    const reordered = reorderSiblings(siblings, activeId, overId)
    if (!reordered) return
    const previous = lessons
    setLessons((prev) => [
      ...prev.filter((l) => l.moduleId !== moduleId),
      ...reordered,
    ])
    try {
      await reorderExamPrepLessonsInModule(Number(moduleId), {
        ordered_ids: toOrderedIds(reordered),
      })
      toast.success("Lessons reordered")
    } catch (error) {
      setLessons(previous)
      notifyApiError(error, "Failed to reorder lessons")
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-grayScale-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-grayScale-900">
            Duolingo/IELTS hierarchy
          </h3>
          <p className="text-[11px] text-grayScale-500">
            Drag items to reorder catalog courses, units, modules, and lessons
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchHierarchy()}
          className="group flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-300 transition-colors hover:text-brand-400"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:rotate-[-45deg]" />
          Sync
        </button>
      </div>

      <div className="space-y-1.5">
        <HierarchySection
          title="Catalog courses"
          icon={<GraduationCap className="h-3.5 w-3.5" />}
          isOpen={openSections.catalogCourse}
          onToggle={() => toggleSection("catalogCourse")}
        >
          {loading.catalogCourse ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            <DraggableList
              items={catalogCourses}
              onReorder={(active, over) => void handleCatalogCourseReorder(active, over)}
              icon={<GraduationCap className="h-3.5 w-3.5" />}
            />
          )}
        </HierarchySection>

        <HierarchySection
          title="Units"
          icon={<BookOpen className="h-3.5 w-3.5" />}
          isOpen={openSections.unit}
          onToggle={() => toggleSection("unit")}
        >
          {loading.unit ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            catalogCourses.map((course) => {
              const courseUnits = units.filter((u) => u.catalogCourseId === course.id)
              if (courseUnits.length === 0) return null
              return (
                <div key={course.id} className="mb-2 last:mb-0">
                  <h4 className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                    {course.name}
                  </h4>
                  <DraggableList
                    items={courseUnits}
                    onReorder={(active, over) =>
                      void handleUnitReorder(course.id, active, over)
                    }
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                  />
                </div>
              )
            })
          )}
        </HierarchySection>

        <HierarchySection
          title="Modules"
          icon={<Layers className="h-3.5 w-3.5" />}
          isOpen={openSections.module}
          onToggle={() => toggleSection("module")}
        >
          {loading.module ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            units.map((unit) => {
              const unitModules = modules.filter((m) => m.unitId === unit.id)
              if (unitModules.length === 0) return null
              return (
                <div key={unit.id} className="mb-2 last:mb-0">
                  <h4 className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                    {unit.name}
                  </h4>
                  <DraggableList
                    items={unitModules}
                    onReorder={(active, over) =>
                      void handleModuleReorder(unit.id, active, over)
                    }
                    icon={<Layers className="h-3.5 w-3.5" />}
                  />
                </div>
              )
            })
          )}
        </HierarchySection>

        <HierarchySection
          title="Lessons"
          icon={<PlayCircle className="h-3.5 w-3.5" />}
          isOpen={openSections.lesson}
          onToggle={() => toggleSection("lesson")}
        >
          {loading.lesson ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            modules.map((module) => {
              const moduleLessons = lessons.filter((l) => l.moduleId === module.id)
              if (moduleLessons.length === 0) return null
              return (
                <div key={module.id} className="mb-2 last:mb-0">
                  <h4 className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                    {module.name}
                  </h4>
                  <DraggableList
                    items={moduleLessons}
                    onReorder={(active, over) =>
                      void handleLessonReorder(module.id, active, over)
                    }
                    icon={<PlayCircle className="h-3.5 w-3.5" />}
                  />
                </div>
              )
            })
          )}
        </HierarchySection>
      </div>
    </div>
  )
}
