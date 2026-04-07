import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, ChevronDown, ChevronRight, Languages, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { createCourse, createCourseCategory, createHumanLanguageLesson, deleteSubCourse, getHumanLanguageHierarchy } from "../../api/courses.api"
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
  const [collapsedLevels, setCollapsedLevels] = useState<string[]>([])
  const [creatingKey, setCreatingKey] = useState<string | null>(null)
  const [quickSubCategoryName, setQuickSubCategoryName] = useState("")
  const [quickCourseName, setQuickCourseName] = useState("")
  const [quickSearch, setQuickSearch] = useState("")
  const [quickCreating, setQuickCreating] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  /** Course IDs whose path body is collapsed (headers stay visible). */
  const [collapsedPathIds, setCollapsedPathIds] = useState<number[]>([])

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

  /** A1 always; A2–C3 only after that level has at least one module (incremental UI). */
  const visibleCefrLevels = useMemo(() => {
    if (availableCourses.length === 0) return [] as CefrLevel[]
    const out: CefrLevel[] = []
    for (const level of CEFR_LEVELS) {
      if (level === "A1") {
        out.push(level)
        continue
      }
      const hasContent = selectedCourses.some((c) => {
        const node = c.levels.find((item) => item.level.toUpperCase() === level)
        return node !== undefined && (node.modules?.length ?? 0) > 0
      })
      if (hasContent) out.push(level)
    }
    return out
  }, [availableCourses.length, selectedCourses])

  useEffect(() => {
    if (selectedLevel === "ALL") return
    if (!visibleCefrLevels.includes(selectedLevel)) {
      setSelectedLevel("ALL")
    }
  }, [selectedLevel, visibleCefrLevels])

  const toggleLevel = (levelKey: string) => {
    setCollapsedLevels((prev) => (prev.includes(levelKey) ? prev.filter((l) => l !== levelKey) : [...prev, levelKey]))
  }

  const togglePathCollapsed = (courseId: number) => {
    setCollapsedPathIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    )
  }

  const levelsWithContentForCourse = (course: HumanLanguageCourseTree) =>
    course.levels.filter((l) => (l.modules?.length ?? 0) > 0).map((l) => l.level.toUpperCase())

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

  const handleDeleteSubModules = async (ids: number[], key: string, successMessage: string) => {
    if (ids.length === 0) return
    const proceed = window.confirm("This action will permanently delete selected item(s). Continue?")
    if (!proceed) return
    setDeletingKey(key)
    try {
      for (const id of ids) {
        await deleteSubCourse(id)
      }
      toast.success(successMessage)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to delete item(s):", error)
      toast.error("Failed to delete item(s)")
    } finally {
      setDeletingKey(null)
    }
  }

  const handleCreateNextLevelForCourse = async (courseId: number) => {
    const course = availableCourses.find((c) => c.course_id === courseId)
    if (!course) {
      toast.error("Course not found")
      return
    }
    const existing = new Set(levelsWithContentForCourse(course))
    const next = CEFR_LEVELS.find((level) => !existing.has(level))
    if (!next) {
      toast.error("All CEFR levels (A1–C3) already have content for this path")
      return
    }
    const key = `next-level-${courseId}-${next}`
    setCreatingKey(key)
    try {
      await createHumanLanguageLesson({
        course_id: courseId,
        cefr_level: next,
        title: "Module-1",
        description: `${next} Module-1`,
      })
      toast.success(`${next} created with Module-1`)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to create next level:", error)
      toast.error("Failed to create next level")
    } finally {
      setCreatingKey(null)
    }
  }

  const handleQuickCreatePath = async () => {
    if (!quickSubCategoryName.trim() || !quickCourseName.trim()) {
      toast.error("Subcategory and course names are required")
      return
    }
    setQuickCreating(true)
    try {
      let effectiveCategoryId = categoryId
      if (!effectiveCategoryId) {
        const createdCategory = await createCourseCategory({ name: "Human Language" })
        effectiveCategoryId = createdCategory.data?.data?.id ?? null
        setCategoryId(effectiveCategoryId)
      }
      if (!effectiveCategoryId) {
        throw new Error("Missing human language category id")
      }
      const title = `${quickSubCategoryName.trim()} - ${quickCourseName.trim()}`
      await createCourse({
        category_id: effectiveCategoryId,
        title,
        description: `${quickSubCategoryName.trim()} / ${quickCourseName.trim()}`,
      })
      toast.success("Subcategory/course path created")
      setQuickSubCategoryName("")
      setQuickCourseName("")
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to quick-create language path:", error)
      toast.error("Failed to create subcategory/course path")
    } finally {
      setQuickCreating(false)
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
              {visibleCefrLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-grayScale-500">
          <SpinnerIcon className="h-4 w-4" />
          Loading human language lessons...
        </div>
      ) : (
        <div className="space-y-3">
          {availableCourses.length === 0 ? (
            <Card className="overflow-hidden border-grayScale-200/80">
              <div className="flex items-center justify-between border-b border-grayScale-100 bg-white px-5 py-4">
                <h3 className="text-lg font-semibold text-grayScale-800">Sub-category Management</h3>
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                  <input
                    className="h-11 w-full rounded-xl border border-grayScale-200 bg-white pl-9 pr-3 text-sm"
                    placeholder="Search sub-categories..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                  />
                </div>
              </div>
              <CardContent className="p-5">
                <div className="rounded-2xl border border-dashed border-grayScale-300 bg-grayScale-50/20 px-6 py-10 text-center">
                  <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700">
                    <Languages className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-semibold text-grayScale-800">No sub-categories yet</h4>
                  <p className="mt-2 text-sm text-grayScale-500">
                    Create your first human-language path. Level listing will appear automatically after creation.
                  </p>
                  <div className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-2 md:grid-cols-3">
                    <input
                      className="h-10 rounded-md border border-grayScale-200 bg-white px-3 text-sm"
                      placeholder="Subcategory (e.g., English)"
                      value={quickSubCategoryName}
                      onChange={(e) => setQuickSubCategoryName(e.target.value)}
                    />
                    <input
                      className="h-10 rounded-md border border-grayScale-200 bg-white px-3 text-sm"
                      placeholder="Course (e.g., Speaking)"
                      value={quickCourseName}
                      onChange={(e) => setQuickCourseName(e.target.value)}
                    />
                    <Button onClick={handleQuickCreatePath} disabled={quickCreating}>
                      {quickCreating ? "Creating..." : "Add your first sub-category"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {availableCourses.length > 0
            ? selectedCourses.map((course: HumanLanguageCourseTree) => {
                const courseLevels = CEFR_LEVELS.filter((level) => {
                  if (level === "A1") return true
                  const node = course.levels.find((item) => item.level.toUpperCase() === level)
                  return (node?.modules?.length ?? 0) > 0
                }).filter((level) => selectedLevel === "ALL" || selectedLevel === level)

                const pathCollapsed = collapsedPathIds.includes(course.course_id)
                const levelsDone = levelsWithContentForCourse(course)
                const nextCefrForPath = CEFR_LEVELS.find((l) => !levelsDone.includes(l))
                const pathNextLevelLoading = creatingKey?.startsWith(`next-level-${course.course_id}-`) ?? false
                const pathLevelsFull = levelsDone.length >= CEFR_LEVELS.length

                return (
                  <Card key={course.course_id} className="overflow-hidden border-grayScale-200/80 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grayScale-100 bg-white px-4 py-3">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        onClick={() => togglePathCollapsed(course.course_id)}
                      >
                        {pathCollapsed ? (
                          <ChevronRight className="h-5 w-5 shrink-0 text-grayScale-500" aria-hidden />
                        ) : (
                          <ChevronDown className="h-5 w-5 shrink-0 text-grayScale-500" aria-hidden />
                        )}
                        <span className="text-base font-semibold text-brand-700">{course.course_name}</span>
                      </button>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {categoryId ? (
                          <Link to={`/content/category/${categoryId}/courses/${course.course_id}/sub-courses`}>
                            <Button type="button" variant="outline" size="sm" className="shrink-0">
                              Open detailed management
                            </Button>
                          </Link>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0"
                          title={
                            pathLevelsFull
                              ? "All CEFR levels already have content for this path"
                              : nextCefrForPath
                                ? `Create ${nextCefrForPath} with Module-1`
                                : undefined
                          }
                          disabled={pathLevelsFull || pathNextLevelLoading}
                          onClick={() => handleCreateNextLevelForCourse(course.course_id)}
                        >
                          {pathNextLevelLoading ? "Creating…" : "Add next CEFR level"}
                        </Button>
                      </div>
                    </div>
                    {!pathCollapsed ? (
                    <CardContent className="space-y-3 p-4">
                      {courseLevels.length === 0 ? (
                        <p className="text-sm text-grayScale-500">No levels match the current level filter.</p>
                      ) : (
                        courseLevels.map((level) => {
                          const levelNode = course.levels.find((item) => item.level.toUpperCase() === level)
                          const modules = levelNode?.modules ?? []
                          const levelKey = `${course.course_id}-${level}`
                          const levelRemoveIds = modules.flatMap((m) => m.sub_modules.map((s) => s.id))
                          const canRemoveLevel = levelRemoveIds.length > 0
                          return (
                            <div key={levelKey} className="overflow-hidden rounded-lg border border-grayScale-200/90">
                              <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-grayScale-100 bg-grayScale-50/60 px-4 py-3">
                                <button
                                  type="button"
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                  onClick={() => toggleLevel(levelKey)}
                                >
                                  {collapsedLevels.includes(levelKey) ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                                  <span className="text-sm font-semibold text-grayScale-900">{level}</span>
                                  <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                                    {modules.length} module(s)
                                  </span>
                                </button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  title={!canRemoveLevel ? "Nothing to remove at this level" : `Remove all content at ${level} for ${course.course_name}`}
                                  className="h-8 shrink-0 gap-1 border-red-200/90 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                  disabled={!canRemoveLevel || deletingKey === `level-${course.course_id}-${level}`}
                                  onClick={() =>
                                    handleDeleteSubModules(levelRemoveIds, `level-${course.course_id}-${level}`, `Level ${level} removed`)
                                  }
                                >
                                  <Trash2 className="h-3 w-3.5" aria-hidden />
                                  Remove
                                </Button>
                              </div>
                              {!collapsedLevels.includes(levelKey) ? (
                                <div className="space-y-2 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCreateModule(course.course_id, level, modules)}
                                      disabled={creatingKey === `module-${course.course_id}-${level}`}
                                    >
                                      {creatingKey === `module-${course.course_id}-${level}` ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                      )}
                                      Add Module
                                    </Button>
                                  </div>
                                  {modules.length === 0 ? (
                                    <p className="text-xs text-grayScale-500">No modules yet. Use “Add Module” to start.</p>
                                  ) : (
                                    modules.map((module) => (
                                      <div key={module.id} className="rounded-lg border border-grayScale-100 bg-grayScale-50/60 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-sm font-semibold text-grayScale-900">Module: {module.title}</p>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                handleCreateSubModule(course.course_id, level, module.title, module.sub_modules)
                                              }
                                              disabled={creatingKey === `submodule-${course.course_id}-${level}-${parseModuleNumber(module.title) ?? 0}`}
                                            >
                                              {creatingKey === `submodule-${course.course_id}-${level}-${parseModuleNumber(module.title) ?? 0}` ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              ) : (
                                                <Plus className="h-3.5 w-3.5" />
                                              )}
                                              Add Sub-module
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="h-8 gap-1 border-red-200/90 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                              disabled={deletingKey === `module-${module.id}`}
                                              onClick={() =>
                                                handleDeleteSubModules(
                                                  module.sub_modules.map((s) => s.id),
                                                  `module-${module.id}`,
                                                  `Module ${module.title} removed`,
                                                )
                                              }
                                            >
                                              <Trash2 className="h-3 w-3.5" aria-hidden />
                                              Remove
                                            </Button>
                                          </div>
                                        </div>
                                        {module.sub_modules.map((subModule) => (
                                          <div key={subModule.id} className="mt-2 rounded-md border border-grayScale-100 bg-white p-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <p className="text-xs font-semibold text-grayScale-700">Sub-module: {subModule.title}</p>
                                              {categoryId ? (
                                                <div className="flex gap-2">
                                                  <Link to={`/content/category/${categoryId}/courses/${course.course_id}/sub-courses/${subModule.id}`}>
                                                    <Button size="sm" variant="outline">Manage lesson videos/audio</Button>
                                                  </Link>
                                                  <Link to={`/content/category/${categoryId}/courses/${course.course_id}/sub-courses/${subModule.id}/add-practice?source=human-language`}>
                                                    <Button size="sm">Add practice/audio questions</Button>
                                                  </Link>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 gap-1 border-red-200/90 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                                    disabled={deletingKey === `submodule-${subModule.id}`}
                                                    onClick={() =>
                                                      handleDeleteSubModules(
                                                        [subModule.id],
                                                        `submodule-${subModule.id}`,
                                                        `Sub-module ${subModule.title} removed`,
                                                      )
                                                    }
                                                  >
                                                    <Trash2 className="h-3 w-3.5" aria-hidden />
                                                    Remove
                                                  </Button>
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
                                    ))
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
              })
            : null}
        </div>
      )}
    </div>
  )
}

