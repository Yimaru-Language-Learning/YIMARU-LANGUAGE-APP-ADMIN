import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, ChevronDown, ChevronRight, Languages, Loader2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { createHumanLanguageLesson, getHumanLanguageHierarchy } from "../../api/courses.api"
import type { HumanLanguageCourseTree, HumanLanguageSubCategoryTree } from "../../types/course.types"
import { toast } from "sonner"

const CEFR_LEVELS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"] as const
type CefrLevel = (typeof CEFR_LEVELS)[number]

export function HumanLanguagePage() {
  const [loading, setLoading] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [subCategories, setSubCategories] = useState<HumanLanguageSubCategoryTree[]>([])
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | "ALL">("ALL")
  const [selectedCourseId, setSelectedCourseId] = useState<number | "ALL">("ALL")
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL")
  const [collapsedLevels, setCollapsedLevels] = useState<CefrLevel[]>([])
  const [creatingKey, setCreatingKey] = useState<string | null>(null)

  const loadHierarchy = async () => {
    setLoading(true)
    try {
      const res = await getHumanLanguageHierarchy()
      const data = res.data?.data
      setCategoryId(data?.category_id ?? null)
      setSubCategories(data?.sub_categories ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        await loadHierarchy()
      } finally {
        setLoading(false)
      }
    }
    run().catch(() => undefined)
  }, [])

  const filteredSubCategories = useMemo(
    () =>
      selectedSubCategoryId === "ALL"
        ? subCategories
        : subCategories.filter((s) => s.sub_category_id === selectedSubCategoryId),
    [subCategories, selectedSubCategoryId],
  )

  const availableCourses = useMemo(() => {
    return filteredSubCategories.flatMap((s) => s.courses)
  }, [filteredSubCategories])

  const selectedCourses = useMemo(
    () =>
      selectedCourseId === "ALL"
        ? availableCourses
        : availableCourses.filter((c) => c.course_id === selectedCourseId),
    [availableCourses, selectedCourseId],
  )

  const toggleLevel = (level: CefrLevel) => {
    setCollapsedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  const parseModuleNumber = (title: string): number | null => {
    const match = title.match(/module-(\d+)/i)
    if (!match) return null
    const value = Number(match[1])
    return Number.isFinite(value) ? value : null
  }

  const parseSubModuleNumber = (title: string): { module: number; sub: number } | null => {
    const match = title.match(/(?:sub-)?module-(\d+)\.(\d+)/i)
    if (!match) return null
    const module = Number(match[1])
    const sub = Number(match[2])
    if (!Number.isFinite(module) || !Number.isFinite(sub)) return null
    return { module, sub }
  }

  const handleCreateModule = async (courseId: number, level: string, modules: { title: string }[]) => {
    const key = `module-${courseId}-${level}`
    setCreatingKey(key)
    try {
      const maxExisting = modules
        .map((m) => parseModuleNumber(m.title))
        .filter((v): v is number => v !== null)
        .reduce((acc, n) => Math.max(acc, n), 0)
      const next = maxExisting + 1
      const title = `Module-${next}`
      await createHumanLanguageLesson({
        course_id: courseId,
        cefr_level: level,
        title,
        description: `${level} ${title}`,
      })
      toast.success(`${title} created`)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to create module:", error)
      toast.error("Failed to create module")
    } finally {
      setCreatingKey(null)
    }
  }

  const handleCreateSubModule = async (
    courseId: number,
    level: string,
    moduleTitle: string,
    existingSubModules: { title: string }[],
  ) => {
    const moduleNo = parseModuleNumber(moduleTitle)
    if (!moduleNo) {
      toast.error("Cannot derive module number from title")
      return
    }
    const key = `submodule-${courseId}-${level}-${moduleNo}`
    setCreatingKey(key)
    try {
      const maxExisting = existingSubModules
        .map((s) => parseSubModuleNumber(s.title))
        .filter((v): v is { module: number; sub: number } => v !== null && v.module === moduleNo)
        .reduce((acc, item) => Math.max(acc, item.sub), 0)
      const next = maxExisting + 1
      const title = `Module-${moduleNo}.${next}`
      await createHumanLanguageLesson({
        course_id: courseId,
        cefr_level: level,
        title,
        description: `${level} ${title}`,
      })
      toast.success(`Sub-module ${moduleNo}.${next} created`)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to create sub-module:", error)
      toast.error("Failed to create sub-module")
    } finally {
      setCreatingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-grayScale-200 bg-gradient-to-r from-white to-brand-50/30 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-brand-100 p-2 text-brand-700">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-grayScale-900">Human Language Content</h2>
            <p className="mt-1 text-sm text-grayScale-500">
              Dedicated management view for CEFR levels A1 to C3 with no sub-levels.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-grayScale-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Subcategory</label>
            <select
              className="h-10 w-full rounded-md border border-grayScale-200 bg-white px-3 text-sm"
              value={selectedSubCategoryId}
              onChange={(e) =>
                setSelectedSubCategoryId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
            >
              <option value="ALL">All subcategories</option>
              {subCategories.map((subCategory) => (
                <option key={subCategory.sub_category_id} value={subCategory.sub_category_id}>
                  {subCategory.sub_category_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Course</label>
            <select
              className="h-10 w-full rounded-md border border-grayScale-200 bg-white px-3 text-sm"
              value={selectedCourseId}
              onChange={(e) =>
                setSelectedCourseId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
            >
              <option value="ALL">All courses</option>
              {availableCourses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Fetch lessons by level</label>
            <select
              className="h-10 w-full rounded-md border border-grayScale-200 bg-white px-3 text-sm"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as CefrLevel | "ALL")}
            >
              <option value="ALL">ALL LEVELS</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {categoryId && selectedCourseId !== "ALL" ? (
        <div className="flex justify-end">
          <Link to={`/content/category/${categoryId}/courses/${selectedCourseId}/sub-courses`}>
            <Button variant="outline">Open detailed management</Button>
          </Link>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-grayScale-500">
          <SpinnerIcon className="h-4 w-4" />
          Loading human language lessons...
        </div>
      ) : (
        <div className="space-y-3">
          {CEFR_LEVELS.filter((l) => selectedLevel === "ALL" || l === selectedLevel).map((level) => {
            const modulesByCourse = selectedCourses
              .map((course: HumanLanguageCourseTree) => {
                const levelNode = course.levels.find((item) => item.level.toUpperCase() === level)
                return {
                  course,
                  modules: levelNode?.modules ?? [],
                }
              })
              .filter((entry) => entry.modules.length > 0)
            return (
            <Card key={level} className="overflow-hidden border-grayScale-200/80 shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between border-b border-grayScale-100 bg-grayScale-50/60 px-4 py-3 text-left"
                onClick={() => toggleLevel(level)}
              >
                <div className="inline-flex items-center gap-2">
                  {collapsedLevels.includes(level) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="text-sm font-semibold text-grayScale-900">{level}</span>
                  <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {modulesByCourse.reduce((sum, entry) => sum + entry.modules.length, 0)} module(s)
                  </span>
                </div>
              </button>
              {!collapsedLevels.includes(level) ? (
                <CardContent className="space-y-3 p-4">
                  {modulesByCourse.length === 0 ? (
                    <p className="text-sm text-grayScale-500">No lessons found for this level.</p>
                  ) : (
                    modulesByCourse.map((entry) => (
                      <div key={entry.course.course_id} className="space-y-2 rounded-xl border border-grayScale-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-brand-700">{entry.course.course_name}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateModule(entry.course.course_id, level, entry.modules)}
                            disabled={creatingKey === `module-${entry.course.course_id}-${level}`}
                          >
                            {creatingKey === `module-${entry.course.course_id}-${level}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            Add Module
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {entry.modules.map((module) => (
                            <div key={module.id} className="rounded-lg border border-grayScale-100 bg-grayScale-50/60 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-grayScale-900">Module: {module.title}</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleCreateSubModule(entry.course.course_id, level, module.title, module.sub_modules)
                                  }
                                  disabled={creatingKey === `submodule-${entry.course.course_id}-${level}-${parseModuleNumber(module.title) ?? 0}`}
                                >
                                  {creatingKey === `submodule-${entry.course.course_id}-${level}-${parseModuleNumber(module.title) ?? 0}` ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                  )}
                                  Add Sub-module
                                </Button>
                              </div>
                              {module.sub_modules.map((subModule) => (
                                <div key={subModule.id} className="mt-2 rounded-md border border-grayScale-100 bg-white p-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-semibold text-grayScale-700">Sub-module: {subModule.title}</p>
                                    {categoryId ? (
                                      <div className="flex gap-2">
                                        <Link to={`/content/category/${categoryId}/courses/${entry.course.course_id}/sub-courses/${subModule.id}`}>
                                          <Button size="sm" variant="outline">Manage lesson videos/audio</Button>
                                        </Link>
                                        <Link to={`/content/category/${categoryId}/courses/${entry.course.course_id}/sub-courses/${subModule.id}/add-practice`}>
                                          <Button size="sm">Add practice/audio questions</Button>
                                        </Link>
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {subModule.videos.map((video) => (
                                      <div key={video.id} className="inline-flex items-center gap-2 rounded-md bg-grayScale-50 px-2 py-1 text-xs text-grayScale-700">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        {video.title}
                                      </div>
                                    ))}
                                    {subModule.practices.map((practice) => (
                                      <div key={practice.id} className="rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-700">
                                        Practice: {practice.title} ({practice.question_count} audio question(s))
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
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

