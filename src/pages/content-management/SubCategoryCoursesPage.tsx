import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import alertSrc from "../../assets/Alert.svg"
import { Badge } from "../../components/ui/badge"
import { getCoursesBySubCategoryId, getSubCategoriesByCategoryId } from "../../api/courses.api"
import type { CategorySubCategoryListItem, SubCategoryCourseListItem } from "../../types/course.types"
import { cn } from "../../lib/utils"

export function SubCategoryCoursesPage() {
  const { categoryId, subCategoryId } = useParams<{
    categoryId: string
    subCategoryId: string
  }>()
  const navigate = useNavigate()

  const [subCategory, setSubCategory] = useState<CategorySubCategoryListItem | null>(null)
  const [courses, setCourses] = useState<SubCategoryCourseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!categoryId || !subCategoryId) return
      const cid = Number(categoryId)
      const sid = Number(subCategoryId)
      if (!Number.isFinite(cid) || !Number.isFinite(sid)) {
        setError("Invalid route parameters")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const [subRes, coursesRes] = await Promise.all([
          getSubCategoriesByCategoryId(cid),
          getCoursesBySubCategoryId(sid),
        ])
        const list = subRes.data?.data?.sub_categories ?? []
        const found = Array.isArray(list) ? list.find((s) => s.id === sid) : undefined
        setSubCategory(found ?? null)

        const raw = coursesRes.data?.data?.courses
        setCourses(Array.isArray(raw) ? raw : [])
      } catch (e) {
        console.error(e)
        setError("Failed to load courses for this sub-category")
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [categoryId, subCategoryId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-5 shadow-sm">
          <img src={alertSrc} alt="" className="h-10 w-10 shrink-0" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const label = subCategory?.name ?? "Sub-category"

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-grayScale-100 bg-white px-5 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <Link
              to={`/content/category/${categoryId}/courses`}
              className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-grayScale-50 text-grayScale-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs font-medium text-grayScale-400">Sub-category</p>
              <h1 className="text-xl font-bold text-grayScale-700 sm:text-2xl">{label}</h1>
              <p className="mt-0.5 text-sm text-grayScale-400">
                {courses.length} course{courses.length !== 1 ? "s" : ""} — open a course to manage sub-modules
              </p>
            </div>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-grayScale-600">No courses in this sub-category yet</p>
          <p className="mt-1 text-sm text-grayScale-400">Add a course from your authoring flow or API.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                navigate(`/content/category/${categoryId}/courses/${c.id}/sub-modules`)
              }
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-[6px] border border-grayScale-200 bg-white px-4 py-4 text-left shadow-sm transition-all",
                "hover:border-brand-200 hover:bg-brand-50/40 hover:shadow-md",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-grayScale-50 text-grayScale-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-grayScale-800">{c.title}</p>
                  {c.description?.trim() ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-grayScale-500">{c.description}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={c.is_active ? "success" : "secondary"} className="text-[11px]">
                  {c.is_active ? "Active" : "Inactive"}
                </Badge>
                <ChevronRight className="h-5 w-5 text-grayScale-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
