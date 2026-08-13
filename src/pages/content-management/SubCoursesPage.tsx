import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutList,
  Layers,
} from "lucide-react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import alertSrc from "../../assets/Alert.svg"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import {
  getCourseLevelsForCourse,
  getCoursesByCategory,
  getCourseCategories,
  getModulesByLevel,
  getSubModulesByModuleId,
} from "../../api/courses.api"
import type {
  CourseLevelRow,
  CourseSubModuleListItem,
  Course,
  CourseCategory,
  Module,
} from "../../types/course.types"

type ModuleRow = Module & { description?: string | null; icon_url?: string | null; created_at?: string }

export function SubModulesPage() {
  const { categoryId, courseId } = useParams<{
    categoryId: string
    courseId: string
  }>()
  const navigate = useNavigate()

  const [course, setCourse] = useState<Course | null>(null)
  const [category, setCategory] = useState<CourseCategory | null>(null)
  const [levels, setLevels] = useState<CourseLevelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedLevelIds, setExpandedLevelIds] = useState<Set<number>>(new Set())
  const [modulesByLevelId, setModulesByLevelId] = useState<Record<number, ModuleRow[]>>({})
  const [loadingModulesLevelId, setLoadingModulesLevelId] = useState<number | null>(null)

  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(new Set())
  const [subModulesByModuleId, setSubModulesByModuleId] = useState<
    Record<number, CourseSubModuleListItem[]>
  >({})
  const [loadingSubModulesModuleId, setLoadingSubModulesModuleId] = useState<number | null>(null)

  const modulesFetchedForLevelRef = useRef<Set<number>>(new Set())
  const subModulesFetchedForModuleRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    modulesFetchedForLevelRef.current.clear()
    subModulesFetchedForModuleRef.current.clear()
    setExpandedLevelIds(new Set())
    setExpandedModuleIds(new Set())
    setModulesByLevelId({})
    setSubModulesByModuleId({})
  }, [courseId])

  useEffect(() => {
    const run = async () => {
      if (!courseId || !categoryId) return
      setLoading(true)
      setError(null)
      try {
        const [levelsRes, coursesRes, categoriesRes] = await Promise.all([
          getCourseLevelsForCourse(Number(courseId)),
          getCoursesByCategory(Number(categoryId)),
          getCourseCategories(),
        ])

        const rawLevels = levelsRes.data?.data?.levels
        const list = Array.isArray(rawLevels) ? rawLevels : []
        setLevels(
          [...list].sort((a, b) => {
            const o = (a.display_order ?? 0) - (b.display_order ?? 0)
            if (o !== 0) return o
            return String(a.cefr_level ?? "").localeCompare(String(b.cefr_level ?? ""))
          }),
        )

        const foundCourse = coursesRes.data?.data?.courses?.find((c) => c.id === Number(courseId))
        setCourse(foundCourse ?? null)

        const foundCategory = categoriesRes.data?.data?.categories?.find(
          (c) => c.id === Number(categoryId),
        )
        setCategory(foundCategory ?? null)
      } catch (e) {
        console.error(e)
        setError("Failed to load course structure")
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [courseId, categoryId])

  const loadModulesForLevel = useCallback(async (levelId: number) => {
    if (modulesFetchedForLevelRef.current.has(levelId)) return
    modulesFetchedForLevelRef.current.add(levelId)
    setLoadingModulesLevelId(levelId)
    try {
      const res = await getModulesByLevel(levelId)
      const raw = res.data?.data?.modules
      const modules = Array.isArray(raw) ? raw : []
      const sorted = [...modules].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) as ModuleRow[]
      setModulesByLevelId((prev) => ({ ...prev, [levelId]: sorted }))
    } catch (e) {
      console.error(e)
      setModulesByLevelId((prev) => ({ ...prev, [levelId]: [] }))
    } finally {
      setLoadingModulesLevelId(null)
    }
  }, [])

  const loadSubModulesForModule = useCallback(async (moduleId: number) => {
    if (subModulesFetchedForModuleRef.current.has(moduleId)) return
    subModulesFetchedForModuleRef.current.add(moduleId)
    setLoadingSubModulesModuleId(moduleId)
    try {
      const res = await getSubModulesByModuleId(moduleId)
      const raw = res.data?.data?.sub_modules
      const subs = Array.isArray(raw) ? raw : []
      const sorted = [...subs].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      setSubModulesByModuleId((prev) => ({ ...prev, [moduleId]: sorted }))
    } catch (e) {
      console.error(e)
      setSubModulesByModuleId((prev) => ({ ...prev, [moduleId]: [] }))
    } finally {
      setLoadingSubModulesModuleId(null)
    }
  }, [])

  const toggleLevel = (levelId: number) => {
    setExpandedLevelIds((prev) => {
      const next = new Set(prev)
      if (next.has(levelId)) next.delete(levelId)
      else {
        next.add(levelId)
        void loadModulesForLevel(levelId)
      }
      return next
    })
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else {
        next.add(moduleId)
        void loadSubModulesForModule(moduleId)
      }
      return next
    })
  }

  const openSubModule = (subModuleId: number) => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-modules/${subModuleId}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
        <p className="mt-3 text-sm text-grayScale-500">Loading course structure…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 shadow-md">
          <img src={alertSrc} alt="" className="h-10 w-10 shrink-0" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            to={`/content/category/${categoryId}/courses`}
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-grayScale-200 bg-white text-grayScale-500 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-grayScale-400">
              <span className="truncate rounded bg-grayScale-50 px-1.5 py-0.5">{category?.name ?? "Category"}</span>
              <span className="text-grayScale-300">→</span>
              <span className="truncate rounded bg-grayScale-50 px-1.5 py-0.5">
                {course?.title ?? `Course #${courseId}`}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-800">Course structure</h1>
            <p className="mt-1 text-sm text-grayScale-500">
              Open a level, then a module, then choose a sub-module to manage practices, lessons, and capstones.
            </p>
          </div>
        </div>
      </div>

      {levels.length === 0 ? (
        <Card className="border-dashed border-grayScale-200 bg-grayScale-50/40">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <GraduationCap className="h-12 w-12 text-grayScale-300" />
            <p className="mt-4 text-sm font-semibold text-grayScale-600">No levels yet</p>
            <p className="mt-1 max-w-sm text-sm text-grayScale-400">
              This course has no CEFR levels. Add levels in the backend or learning-path tools, then refresh.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {levels.map((level) => {
            const isLevelOpen = expandedLevelIds.has(level.id)
            const modules = modulesByLevelId[level.id]
            const loadingMods = loadingModulesLevelId === level.id

            return (
              <Card
                key={level.id}
                className="overflow-hidden border border-grayScale-200/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggleLevel(level.id)}
                  className="flex w-full items-center gap-3 border-b border-transparent bg-white px-4 py-3.5 text-left transition-colors hover:bg-grayScale-50/80"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <LayoutList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-grayScale-800">{level.title || level.cefr_level}</span>
                      <Badge variant="secondary" className="text-[11px] font-semibold">
                        {level.cefr_level}
                      </Badge>
                      {!level.is_active ? (
                        <Badge variant="outline" className="text-[11px] text-amber-700">
                          Inactive
                        </Badge>
                      ) : null}
                    </div>
                    {level.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-grayScale-500">{level.description}</p>
                    ) : null}
                  </div>
                  {isLevelOpen ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-grayScale-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-grayScale-400" />
                  )}
                </button>

                {isLevelOpen ? (
                  <CardContent className="space-y-2 border-t border-grayScale-100 bg-grayScale-50/30 px-3 py-3 sm:px-4">
                    {loadingMods ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-grayScale-500">
                        <img src={spinnerSrc} alt="" className="h-5 w-5 animate-spin" />
                        Loading modules…
                      </div>
                    ) : !modules || modules.length === 0 ? (
                      <p className="py-4 text-center text-sm text-grayScale-500">No modules in this level.</p>
                    ) : (
                      modules.map((mod) => {
                        const isModOpen = expandedModuleIds.has(mod.id)
                        const subs = subModulesByModuleId[mod.id]
                        const loadingSubs = loadingSubModulesModuleId === mod.id

                        return (
                          <div
                            key={mod.id}
                            className="overflow-hidden rounded-xl border border-grayScale-200 bg-white shadow-sm"
                          >
                            <button
                              type="button"
                              onClick={() => toggleModule(mod.id)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-grayScale-50"
                            >
                              <Layers className="h-4 w-4 shrink-0 text-violet-500" />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-grayScale-800">{mod.title}</span>
                                <span className="ml-2 tabular-nums text-xs text-grayScale-400">#{mod.id}</span>
                                {mod.description ? (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-grayScale-500">{mod.description}</p>
                                ) : null}
                              </div>
                              {isModOpen ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-grayScale-400" />
                              )}
                            </button>

                            {isModOpen ? (
                              <div className="border-t border-grayScale-100 bg-grayScale-50/50 px-2 py-2">
                                {loadingSubs ? (
                                  <div className="flex items-center gap-2 py-4 text-xs text-grayScale-500">
                                    <img src={spinnerSrc} alt="" className="h-4 w-4 animate-spin" />
                                    Loading sub-modules…
                                  </div>
                                ) : !subs || subs.length === 0 ? (
                                  <p className="py-3 text-center text-xs text-grayScale-500">No sub-modules.</p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {subs.map((sub) => (
                                      <li key={sub.id}>
                                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-grayScale-100 bg-white px-3 py-2 transition-colors hover:border-brand-200 hover:bg-brand-50/30">
                                          <BookOpen className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                                          <div className="min-w-0 flex-1">
                                            <span className="text-sm font-medium text-grayScale-800">{sub.title}</span>
                                            <span className="ml-2 text-xs tabular-nums text-grayScale-400">
                                              #{sub.id}
                                            </span>
                                            {sub.description ? (
                                              <p className="mt-0.5 line-clamp-1 text-xs text-grayScale-500">
                                                {sub.description}
                                              </p>
                                            ) : null}
                                          </div>
                                          {!sub.is_active ? (
                                            <Badge variant="outline" className="text-[10px]">
                                              Off
                                            </Badge>
                                          ) : null}
                                          <Button
                                            size="sm"
                                            className="shrink-0 bg-brand-500 hover:bg-brand-600"
                                            type="button"
                                            onClick={() => openSubModule(sub.id)}
                                          >
                                            Open
                                          </Button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
