import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FolderOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { getCourseCategories } from "../../api/courses.api"
import type { CourseCategory } from "../../types/course.types"

export function CourseCategoryPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
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

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-grayScale-500">Loading categories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-grayScale-900">Course Categories</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} to={`/content/category/${category.id}/courses`} className="group">
            <Card className="h-full shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-brand-200">
              <CardHeader>
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-100 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-brand-500 group-hover:text-brand-600">
                  View Courses →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center text-sm text-grayScale-500">No categories found</div>
      )}
    </div>
  )
}
