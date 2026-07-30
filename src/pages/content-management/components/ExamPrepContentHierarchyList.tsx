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

const FETCH_LIMIT = 500

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
      const coursesRes = await getExamPrepCatalogCourses({
        limit: FETCH_LIMIT,
        offset: 0,
      })
      const fetchedCourses: CatalogCourse[] = sortBySortOrder(
        coursesRes.data?.data?.catalog_courses ?? [],
      ).map((c) => ({
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
          getExamPrepCatalogUnits(Number(c.id), { limit: FETCH_LIMIT, offset: 0 }),
        ),
      )
      const fetchedUnits: Unit[] = unitsResults.flatMap((res, idx) =>
        sortBySortOrder(res.data?.data?.units ?? []).map((u) => ({
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
          getExamPrepUnitModules(Number(u.id), { limit: FETCH_LIMIT, offset: 0 }),
        ),
      )
      const fetchedModules: UnitModule[] = modulesResults.flatMap((res, idx) =>
        sortBySortOrder(res.data?.data?.modules ?? []).map((m) => ({
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
          getExamPrepModuleLessons(Number(m.id), { limit: FETCH_LIMIT, offset: 0 }),
        ),
      )
      const fetchedLessons: ModuleLesson[] = lessonsResults.flatMap((res, idx) =>
        sortBySortOrder(res.data?.data?.lessons ?? []).map((l) => ({
          id: String(l.id),
          name: l.title,
          thumbnail: l.thumbnail ?? undefined,
          moduleId: fetchedModules[idx].id,
        })),
      )
      setLessons(fetchedLessons)
    } catch (error) {
      console.error("Failed to fetch exam prep hierarchy:", error)
      notifyApiError(error, "Failed to load exam prep content")
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
    <div className="mb-8 rounded-2xl border border-grayScale-100 bg-[#ffffff] p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-bold text-grayScale-900">
            Exam prep hierarchy
          </h3>
          <p className="mt-1 text-[12px] text-grayScale-500">
            Catalog courses, units, modules, and lessons (IELTS, Duolingo, etc.)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchHierarchy()}
          className="group flex items-center gap-2 text-[13px] font-bold text-brand-300 transition-colors hover:text-brand-400"
        >
          <RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-[-45deg]" />
          Sync with API
        </button>
      </div>

      <div className="space-y-4">
        <HierarchySection
          title="Catalog courses"
          icon={<GraduationCap className="h-5 w-5" />}
          isOpen={openSections.catalogCourse}
          onToggle={() => toggleSection("catalogCourse")}
        >
          {loading.catalogCourse ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <DraggableList
              items={catalogCourses}
              onReorder={(active, over) => void handleCatalogCourseReorder(active, over)}
              icon={<GraduationCap className="h-4 w-4" />}
            />
          )}
        </HierarchySection>

        <HierarchySection
          title="Units"
          icon={<BookOpen className="h-5 w-5" />}
          isOpen={openSections.unit}
          onToggle={() => toggleSection("unit")}
        >
          {loading.unit ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : (
            catalogCourses.map((course) => {
              const courseUnits = units.filter((u) => u.catalogCourseId === course.id)
              if (courseUnits.length === 0) return null
              return (
                <div key={course.id} className="mb-4 last:mb-0">
                  <h4 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider text-grayScale-400">
                    {course.name}
                  </h4>
                  <DraggableList
                    items={courseUnits}
                    onReorder={(active, over) =>
                      void handleUnitReorder(course.id, active, over)
                    }
                    icon={<BookOpen className="h-4 w-4" />}
                  />
                </div>
              )
            })
          )}
        </HierarchySection>

        <HierarchySection
          title="Modules"
          icon={<Layers className="h-5 w-5" />}
          isOpen={openSections.module}
          onToggle={() => toggleSection("module")}
        >
          {loading.module ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : (
            units.map((unit) => {
              const unitModules = modules.filter((m) => m.unitId === unit.id)
              if (unitModules.length === 0) return null
              return (
                <div key={unit.id} className="mb-4 last:mb-0">
                  <h4 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider text-grayScale-400">
                    {unit.name}
                  </h4>
                  <DraggableList
                    items={unitModules}
                    onReorder={(active, over) =>
                      void handleModuleReorder(unit.id, active, over)
                    }
                    icon={<Layers className="h-4 w-4" />}
                  />
                </div>
              )
            })
          )}
        </HierarchySection>

        <HierarchySection
          title="Lessons"
          icon={<PlayCircle className="h-5 w-5" />}
          isOpen={openSections.lesson}
          onToggle={() => toggleSection("lesson")}
        >
          {loading.lesson ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : (
            modules.map((module) => {
              const moduleLessons = lessons.filter((l) => l.moduleId === module.id)
              if (moduleLessons.length === 0) return null
              return (
                <div key={module.id} className="mb-4 last:mb-0">
                  <h4 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider text-grayScale-400">
                    {module.name}
                  </h4>
                  <DraggableList
                    items={moduleLessons}
                    onReorder={(active, over) =>
                      void handleLessonReorder(module.id, active, over)
                    }
                    icon={<PlayCircle className="h-4 w-4" />}
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
