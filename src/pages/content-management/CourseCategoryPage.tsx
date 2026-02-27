import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FolderOpen, RefreshCw, BookOpen } from "lucide-react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import alertSrc from "../../assets/Alert.svg"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { getCourseCategories } from "../../api/courses.api"
import type { CourseCategory } from "../../types/course.types"

export function CourseCategoryPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCourseCategories()
      setCategories(res.data.data.categories)
    } catch (err) {
      console.error("Failed to fetch categories:", err)
      setError("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
        <span className="text-sm font-medium text-grayScale-400">Loading categories…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50/60 px-10 py-8 text-center shadow-sm">
          <img src={alertSrc} alt="" className="h-12 w-12" />
          <div>
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <p className="mt-1 text-xs text-red-400">
              Please check your connection and try again
            </p>
          </div>
          <button
            onClick={fetchCategories}
            className="mt-1 inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-grayScale-600">Course Categories</h1>
        <p className="mt-1 text-sm text-grayScale-400">
          Browse and manage your course categories below
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-grayScale-200 bg-grayScale-50/50 py-24">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-sm">
              <FolderOpen className="h-9 w-9 text-brand-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-lg bg-white shadow ring-1 ring-grayScale-100">
              <BookOpen className="h-4 w-4 text-grayScale-300" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-grayScale-500">No categories yet</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-grayScale-400">
              Course categories will appear here once created. Start by adding your first category.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/content/category/${category.id}/courses`}
              className="group"
            >
              <Card className="relative h-full overflow-hidden border border-grayScale-100 shadow-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:border-brand-200 group-hover:shadow-lg">
                {/* Decorative gradient strip */}
                <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-brand-600 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

                <CardHeader className="pt-5">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600 shadow-sm transition-all duration-300 group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white group-hover:shadow-md">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-grayScale-600 transition-colors group-hover:text-grayScale-700">
                    {category.name}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors group-hover:text-brand-600">
                    View Courses
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
