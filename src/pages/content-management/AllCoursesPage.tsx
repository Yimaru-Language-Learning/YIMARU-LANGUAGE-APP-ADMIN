import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, RefreshCw, Edit2, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { FileUpload } from "../../components/ui/file-upload"
import { getCourseCategories, getCoursesByCategory, createCourse, updateCourseStatus, updateCourse } from "../../api/courses.api"
import type { Course, CourseCategory } from "../../types/course.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Textarea } from "../../components/ui/textarea"
import { toast } from "sonner"

type CourseWithCategory = Course & { category_name: string }

export function AllCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CourseWithCategory[]>([])
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all")

  const [createOpen, setCreateOpen] = useState(false)
  const [createCategoryId, setCreateCategoryId] = useState<string>("")
  const [createSubCategoryId, setCreateSubCategoryId] = useState<string>("")
  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createThumbnail, setCreateThumbnail] = useState<File | null>(null)
  const [createVideo, setCreateVideo] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<CourseWithCategory | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [updating, setUpdating] = useState(false)

  const fetchAllCourses = async () => {
    setLoading(true)
    setError(null)
    try {
      const categoriesRes = await getCourseCategories()
      const cats = categoriesRes.data.data.categories ?? []
      setCategories(cats)

      const allCourses: CourseWithCategory[] = []
      for (const cat of cats) {
        const res = await getCoursesByCategory(cat.id)
        const catCourses = res.data.data.courses ?? []
        allCourses.push(
          ...catCourses.map((c) => ({
            ...c,
            category_name: cat.name,
          })),
        )
      }
      setCourses(allCourses)
    } catch (err) {
      console.error("Failed to load courses:", err)
      setError("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllCourses()
  }, [])

  const filteredCourses = courses.filter((course) => {
    if (categoryFilter !== "all" && String(course.category_id) !== categoryFilter) {
      return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      const haystack = `${course.title} ${course.description} ${course.category_name}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const handleCreateCourse = async () => {
    const effectiveCategoryId = createSubCategoryId || createCategoryId

    if (!effectiveCategoryId || !createTitle.trim() || !createDescription.trim()) {
      toast.error("Missing fields", {
        description: "Category (or subcategory), title, and description are required.",
      })
      return
    }

    setCreating(true)
    try {
      await createCourse({
        category_id: Number(effectiveCategoryId),
        title: createTitle.trim(),
        description: createDescription.trim(),
      })

      toast.success("Course created", {
        description: `"${createTitle.trim()}" has been created.`,
      })

      setCreateOpen(false)
      setCreateCategoryId("")
      setCreateSubCategoryId("")
      setCreateTitle("")
      setCreateDescription("")
      setCreateThumbnail(null)
      setCreateVideo(null)
      await fetchAllCourses()
    } catch (err: any) {
      console.error("Failed to create course:", err)
      toast.error("Failed to create course", {
        description: err?.response?.data?.message || "Please try again.",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (course: CourseWithCategory) => {
    setTogglingId(course.id)
    try {
      await updateCourseStatus(course.id, !course.is_active)
      await fetchAllCourses()
    } catch (err) {
      console.error("Failed to update course status:", err)
      toast.error("Failed to update course status")
    } finally {
      setTogglingId(null)
    }
  }

  const openEditDialog = (course: CourseWithCategory) => {
    setCourseToEdit(course)
    setEditTitle(course.title)
    setEditDescription(course.description || "")
    setEditOpen(true)
  }

  const handleUpdateCourse = async () => {
    if (!courseToEdit) return
    if (!editTitle.trim() || !editDescription.trim()) {
      toast.error("Missing fields", {
        description: "Title and description are required.",
      })
      return
    }

    setUpdating(true)
    try {
      await updateCourse(courseToEdit.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })
      toast.success("Course updated")
      setEditOpen(false)
      setCourseToEdit(null)
      await fetchAllCourses()
    } catch (err: any) {
      console.error("Failed to update course:", err)
      toast.error("Failed to update course", {
        description: err?.response?.data?.message || "Please try again.",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-grayScale-400">Loading all courses…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-5 shadow-sm">
          <div className="rounded-full bg-red-100 p-2">
            <RefreshCw className="h-5 w-5 shrink-0 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">All Courses</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            View and manage courses across all categories.
          </p>
        </div>
        <Button
          className="gap-2 bg-brand-500 text-white hover:bg-brand-600"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            Course Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* Search / Filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-300" />
              <Input
                placeholder="Search by title, description, or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 transition-colors focus:border-brand-300 focus:ring-brand-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="text-xs font-medium text-grayScale-400">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>

          {/* Courses Table */}
          {filteredCourses.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-grayScale-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-grayScale-100 hover:bg-grayScale-100">
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Course
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Category
                    </TableHead>
                    <TableHead className="hidden py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500 md:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course, index) => (
                    <TableRow
                      key={course.id}
                      className={`cursor-pointer transition-colors hover:bg-brand-100/30 ${
                        index % 2 === 0 ? "bg-white" : "bg-grayScale-100/40"
                      }`}
                      onClick={() =>
                        navigate(
                          `/content/category/${course.category_id}/courses/${course.id}/sub-courses`,
                        )
                      }
                    >
                      <TableCell className="max-w-md py-3.5">
                        <div className="truncate text-sm font-semibold text-grayScale-700">
                          {course.title}
                        </div>
                        {course.description && (
                          <div className="mt-1 truncate text-xs text-grayScale-400">
                            {course.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-grayScale-500">
                        {course.category_name}
                      </TableCell>
                      <TableCell className="hidden py-3.5 md:table-cell">
                        <Badge
                          variant={course.is_active ? "success" : "secondary"}
                          className="text-[11px] font-semibold"
                        >
                          {course.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(course)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-700"
                            disabled={togglingId === course.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStatus(course)
                            }}
                          >
                            {course.is_active ? (
                              <ToggleLeft className="h-4 w-4" />
                            ) : (
                              <ToggleRight className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-brand-500 hover:bg-brand-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(
                                `/content/category/${course.category_id}/courses/${course.id}/sub-courses`,
                              )
                            }}
                          >
                            Open
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-grayScale-200 py-20 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-grayScale-100 to-grayScale-200">
                <BookOpen className="h-8 w-8 text-grayScale-400" />
              </div>
              <p className="text-base font-semibold text-grayScale-600">No courses found</p>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-grayScale-400">
                Try adjusting your search or category filter, or create a new course.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create course dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create course</DialogTitle>
            <DialogDescription>
              Choose a category, add basic details, and optionally attach a thumbnail and intro
              video.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Category
                </label>
                <Select
                  value={createCategoryId}
                  onChange={(e) => {
                    setCreateCategoryId(e.target.value)
                    setCreateSubCategoryId("")
                  }}
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((cat) => !cat.parent_id)
                    .map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Subcategory (optional)
                </label>
                <Select
                  value={createSubCategoryId}
                  onChange={(e) => setCreateSubCategoryId(e.target.value)}
                  disabled={!createCategoryId}
                >
                  <option value="">No subcategory</option>
                  {categories
                    .filter((cat) => cat.parent_id && String(cat.parent_id) === createCategoryId)
                    .map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Course title
                </label>
                <Input
                  placeholder="e.g. Beginner English A1"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                Description
              </label>
              <Textarea
                rows={3}
                placeholder="Short summary of what this course covers."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Thumbnail image
                </label>
                <FileUpload
                  accept="image/*"
                  onFileSelect={setCreateThumbnail}
                  label="Upload thumbnail"
                  description="JPEG or PNG"
                  className="min-h-[90px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Intro video
                </label>
                <FileUpload
                  accept="video/*"
                  onFileSelect={setCreateVideo}
                  label="Upload video"
                  description="Optional intro or overview"
                  className="min-h-[90px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                />
              </div>
            </div>

            <p className="text-[11px] text-grayScale-400">
              File uploads are currently stored client-side only. Connect your storage/API layer to
              persist thumbnails and videos.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setCreateCategoryId("")
                setCreateTitle("")
                setCreateDescription("")
                setCreateThumbnail(null)
                setCreateVideo(null)
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-500 text-white hover:bg-brand-600"
              disabled={creating}
              onClick={handleCreateCourse}
            >
              {creating ? "Creating…" : "Create course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit course dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>
              Update the title and description for this course. Status can be toggled from the
              table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                Course title
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                Description
              </label>
              <Textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Short summary of this course."
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false)
                setCourseToEdit(null)
                setEditTitle("")
                setEditDescription("")
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-500 text-white hover:bg-brand-600"
              disabled={updating}
              onClick={handleUpdateCourse}
            >
              {updating ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

