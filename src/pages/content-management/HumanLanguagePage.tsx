import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, ChevronDown, ChevronRight, Languages } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { getCourseCategories, getCoursesByCategory, getLearningPath } from "../../api/courses.api"
import type { Course, CourseCategory, LearningPathSubCourse } from "../../types/course.types"

const CEFR_LEVELS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"] as const
type CefrLevel = (typeof CEFR_LEVELS)[number]

export function HumanLanguagePage() {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL")
  const [collapsedLevels, setCollapsedLevels] = useState<CefrLevel[]>([])
  const [subCourses, setSubCourses] = useState<LearningPathSubCourse[]>([])

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true)
      try {
        const res = await getCourseCategories()
        const items = res.data?.data?.categories ?? []
        setCategories(items)
        const humanLanguageCategory =
          items.find((c) => c.name.toLowerCase().includes("human language")) ??
          items.find((c) => c.name.toLowerCase().includes("language")) ??
          null
        setSelectedCategoryId(humanLanguageCategory?.id ?? (items[0]?.id ?? null))
      } finally {
        setLoading(false)
      }
    }
    loadCategories().catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!selectedCategoryId) return
    const loadCourses = async () => {
      setLoading(true)
      try {
        const res = await getCoursesByCategory(selectedCategoryId)
        const items = res.data?.data?.courses ?? []
        setCourses(items)
        setSelectedCourseId(items[0]?.id ?? null)
      } finally {
        setLoading(false)
      }
    }
    loadCourses().catch(() => undefined)
  }, [selectedCategoryId])

  useEffect(() => {
    if (!selectedCourseId) return
    const loadPath = async () => {
      setLoading(true)
      try {
        const res = await getLearningPath(selectedCourseId)
        setSubCourses(res.data?.data?.sub_courses ?? [])
      } finally {
        setLoading(false)
      }
    }
    loadPath().catch(() => undefined)
  }, [selectedCourseId])

  const grouped = useMemo(() => {
    const base = Object.fromEntries(CEFR_LEVELS.map((level) => [level, [] as LearningPathSubCourse[]])) as Record<
      CefrLevel,
      LearningPathSubCourse[]
    >
    for (const subCourse of subCourses) {
      const level = (subCourse.sub_level ?? "").toUpperCase() as CefrLevel
      if (CEFR_LEVELS.includes(level)) {
        base[level].push(subCourse)
      }
    }
    return base
  }, [subCourses])

  const levelRows = useMemo(
    () => (selectedLevel === "ALL" ? CEFR_LEVELS : [selectedLevel]).map((level) => ({ level, rows: grouped[level] })),
    [grouped, selectedLevel],
  )

  const toggleLevel = (level: CefrLevel) => {
    setCollapsedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
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
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Category</label>
            <select
              className="h-10 w-full rounded-md border border-grayScale-200 bg-white px-3 text-sm"
              value={selectedCategoryId ?? ""}
              onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Course</label>
            <select
              className="h-10 w-full rounded-md border border-grayScale-200 bg-white px-3 text-sm"
              value={selectedCourseId ?? ""}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
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

      {selectedCategoryId && selectedCourseId ? (
        <div className="flex justify-end">
          <Link to={`/content/category/${selectedCategoryId}/courses/${selectedCourseId}/sub-courses`}>
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
          {levelRows.map(({ level, rows }) => (
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
                    {rows.length} unit(s)
                  </span>
                </div>
              </button>
              {!collapsedLevels.includes(level) ? (
                <CardContent className="space-y-3 p-4">
                  {rows.length === 0 ? (
                    <p className="text-sm text-grayScale-500">No lessons found for this level.</p>
                  ) : (
                    rows.map((subCourse) => (
                      <div key={subCourse.id} className="rounded-xl border border-grayScale-200 bg-white p-3">
                        <p className="text-sm font-semibold text-grayScale-900">{subCourse.title}</p>
                        <p className="mt-1 text-xs text-grayScale-500">
                          {subCourse.videos.length} lesson video(s) • {subCourse.practices.length} practice(s)
                        </p>
                        <div className="mt-2 space-y-1">
                          {subCourse.videos.map((video) => (
                            <div key={video.id} className="inline-flex items-center gap-2 rounded-md bg-grayScale-50 px-2 py-1 text-xs text-grayScale-700">
                              <BookOpen className="h-3.5 w-3.5" />
                              {video.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

