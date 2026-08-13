import { notifyApiError } from "../../lib/apiErrors"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FolderOpen, RefreshCw, BookOpen, Plus, Trash2 } from "lucide-react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import alertSrc from "../../assets/Alert.svg"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { getCourseCategories, createCourseCategory, deleteCourseCategory } from "../../api/courses.api"
import type { CourseCategory } from "../../types/course.types"
import { toast } from "sonner"
import { SearchHighlight } from "../../components/SearchHighlight"

export function CourseCategoryPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [creating, setCreating] = useState(false)
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null)
  const [newSubCategoryName, setNewSubCategoryName] = useState("")
  const [pendingSubCategories, setPendingSubCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<CourseCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredCategories = normalizedQuery
    ? categories.filter((c) => c.name?.toLowerCase().includes(normalizedQuery))
    : categories

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
            className="mt-1 inline-flex items-center gap-2 rounded-[6px] bg-red-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600"
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-grayScale-600">Course Categories</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            Browse and manage your course categories below
          </p>
        </div>
        <div className="w-full max-w-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
          />
        </div>
        <Button
          className="gap-2 bg-brand-500 text-white hover:bg-brand-600"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Category
        </Button>
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
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-grayScale-200 bg-grayScale-50/50 py-24">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-grayScale-50 shadow-sm">
            <FolderOpen className="h-9 w-9 text-grayScale-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-grayScale-500">No matching categories</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-grayScale-400">
              Try a different search term.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category) => (
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
                    <SearchHighlight text={category.name} query={searchQuery} />
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors group-hover:text-brand-600">
                      View Sub-categories
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-red-200 bg-white text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteTarget(category)
                      }}
                      aria-label={`Delete category ${category.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create category dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-500" />
              <span>Create course category</span>
            </DialogTitle>
            <DialogDescription>
              Add a new high-level bucket to organize your courses. You can also nest it under an existing parent category.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Category name
                </label>
                <Input
                  placeholder="e.g. Beginner English, Duolingo/IELTS"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Parent category (optional)
                </label>
                <Select
                  value={parentCategoryId ?? ""}
                  onChange={(e) =>
                    setParentCategoryId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">No parent (top level)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-[11px] text-grayScale-400">
                  When left empty, this becomes a parent category. Any sub categories you add on the
                  right will be created under it.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-grayScale-600">
                  Sub categories for this category (optional)
                </p>
                {pendingSubCategories.length > 0 && (
                  <span className="text-[11px] text-grayScale-400">
                    {pendingSubCategories.length} sub categor
                    {pendingSubCategories.length === 1 ? "y" : "ies"} to create
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Grammar basics, Speaking, Exam practice"
                  value={newSubCategoryName}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                  className="h-9 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-3 text-xs"
                  onClick={() => {
                    const name = newSubCategoryName.trim()
                    if (!name) return
                    if (pendingSubCategories.includes(name)) {
                      setNewSubCategoryName("")
                      return
                    }
                    setPendingSubCategories((prev) => [...prev, name])
                    setNewSubCategoryName("")
                  }}
                >
                  Add
                </Button>
              </div>

              <div className="min-h-[3.5rem] rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/60 p-2">
                {pendingSubCategories.length === 0 ? (
                  <p className="text-[11px] leading-relaxed text-grayScale-400">
                    Added sub categories will appear here so you can visually confirm the structure
                    before saving. This is optional.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {pendingSubCategories.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="group inline-flex items-center gap-1 rounded-[6px] bg-white px-2 py-0.5 text-[11px] text-grayScale-600 shadow-sm ring-1 ring-grayScale-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200"
                        onClick={() =>
                          setPendingSubCategories((prev) =>
                            prev.filter((subName) => subName !== name),
                          )
                        }
                      >
                        <span className="max-w-[160px] truncate">{name}</span>
                        <span className="text-[10px] text-grayScale-300 group-hover:text-red-400">
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setNewCategoryName("")
                setParentCategoryId(null)
                setNewSubCategoryName("")
                setPendingSubCategories([])
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-500 text-white hover:bg-brand-600"
              disabled={creating || !newCategoryName.trim()}
              onClick={async () => {
                if (!newCategoryName.trim()) return
                setCreating(true)
                try {
                  const name = newCategoryName.trim()
                  const parentRes = await createCourseCategory({ name })
                  let createdCategoryId: number | null = null
                  try {
                    const data: any = parentRes?.data
                    createdCategoryId =
                      data?.data?.id ??
                      data?.data?.category?.id ??
                      data?.data?.id ??
                      data?.category?.id ??
                      data?.id ??
                      null
                  } catch {
                    createdCategoryId = null
                  }

                  if (createdCategoryId && pendingSubCategories.length > 0) {
                    await Promise.all(
                      pendingSubCategories.map((subName) =>
                        createCourseCategory({ name: subName, parent_id: createdCategoryId }),
                      ),
                    )
                  }

                  toast.success("Category created", {
                    description:
                      pendingSubCategories.length > 0
                        ? `"${name}" and ${pendingSubCategories.length} sub categor${
                            pendingSubCategories.length === 1 ? "y" : "ies"
                          } have been added.`
                        : `"${name}" has been added.`,
                  })
                  setNewCategoryName("")
                  setParentCategoryId(null)
                  setNewSubCategoryName("")
                  setPendingSubCategories([])
                  setCreateOpen(false)
                  fetchCategories()
                } catch (err: unknown) {
                  notifyApiError(err, "Could not create category")
                } finally {
                  setCreating(false)
                }
              }}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This will permanently delete "${deleteTarget.name}" and all linked sub-categories/courses.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-grayScale-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleting}
              onClick={async () => {
                if (!deleteTarget) return
                setDeleting(true)
                try {
                  await deleteCourseCategory(deleteTarget.id)
                  toast.success("Category deleted")
                  setDeleteTarget(null)
                  await fetchCategories()
                } catch (err: unknown) {
                  notifyApiError(err, "Could not delete category")
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
