import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Plus, ArrowLeft, ToggleLeft, ToggleRight, X, Trash2, Edit, AlertCircle, Star, MessageSquare } from "lucide-react"
import practiceSrc from "../../assets/Practice.svg"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import alertSrc from "../../assets/Alert.svg"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { getCoursesByCategory, getCourseCategories, createCourse, deleteCourse, updateCourseStatus, updateCourse, getRatings } from "../../api/courses.api"
import type { Course, CourseCategory, Rating } from "../../types/course.types"

export function CoursesPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [category, setCategory] = useState<CourseCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editThumbnail, setEditThumbnail] = useState("")
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [showRatingsModal, setShowRatingsModal] = useState(false)
  const [ratingsCourseId, setRatingsCourseId] = useState<number | null>(null)
  const [courseRatings, setCourseRatings] = useState<Rating[]>([])
  const [courseRatingsLoading, setCourseRatingsLoading] = useState(false)

  const fetchCourses = async () => {
    if (!categoryId) return

    try {
      const coursesRes = await getCoursesByCategory(Number(categoryId))
      console.log("Courses response:", coursesRes.data.data.courses)
      setCourses(coursesRes.data.data.courses ?? [])
    } catch (err) {
      console.error("Failed to fetch courses:", err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return

      try {
        const [coursesRes, categoriesRes] = await Promise.all([
          getCoursesByCategory(Number(categoryId)),
          getCourseCategories(),
        ])

        setCourses(coursesRes.data.data.courses ?? [])
        const foundCategory = categoriesRes.data.data.categories.find(
          (c) => c.id === Number(categoryId)
        )
        setCategory(foundCategory ?? null)
      } catch (err) {
        console.error("Failed to fetch courses:", err)
        setError("Failed to load sub-categories")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId])

  const handleOpenModal = () => {
    setTitle("")
    setDescription("")
    setSaveError(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setTitle("")
    setDescription("")
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError("Title is required")
      return
    }
    if (!description.trim()) {
      setSaveError("Description is required")
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      await createCourse({
        category_id: Number(categoryId),
        title: title.trim(),
        description: description.trim(),
      })
      handleCloseModal()
      await fetchCourses()
    } catch (err: any) {
      console.error("Failed to create course:", err)
      setSaveError(err.response?.data?.message || "Failed to create sub-category")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return

    setDeleting(true)
    try {
      await deleteCourse(courseToDelete.id)
      setShowDeleteModal(false)
      setCourseToDelete(null)
      await fetchCourses()
    } catch (err) {
      console.error("Failed to delete course:", err)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleStatus = async (course: Course) => {
    setTogglingId(course.id)
    try {
      await updateCourseStatus(course.id, !course.is_active)
      await fetchCourses()
    } catch (err) {
      console.error("Failed to update course status:", err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleEditClick = (course: Course) => {
    setCourseToEdit(course)
    setEditTitle(course.title || "")
    setEditDescription(course.description || "")
    setEditThumbnail(course.thumbnail || "")
    setUpdateError(null)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setCourseToEdit(null)
    setEditTitle("")
    setEditDescription("")
    setEditThumbnail("")
    setUpdateError(null)
  }

  const handleUpdate = async () => {
    if (!courseToEdit) return

    if (!editTitle.trim()) {
      setUpdateError("Title is required")
      return
    }
    if (!editDescription.trim()) {
      setUpdateError("Description is required")
      return
    }

    setUpdating(true)
    setUpdateError(null)

    try {
      await updateCourse(courseToEdit.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        thumbnail: editThumbnail.trim() || undefined,
        is_active: courseToEdit.is_active,
      })
      handleCloseEditModal()
      await fetchCourses()
    } catch (err: any) {
      console.error("Failed to update course:", err)
      setUpdateError(err.response?.data?.message || "Failed to update sub-category")
    } finally {
      setUpdating(false)
    }
  }

  const handleCourseClick = (courseId: number) => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-courses`)
  }

  const handleViewRatings = async (courseId: number) => {
    setRatingsCourseId(courseId)
    setShowRatingsModal(true)
    setCourseRatingsLoading(true)
    try {
      const res = await getRatings({ target_type: "course", target_id: courseId, limit: 10 })
      setCourseRatings(res.data.data ?? [])
    } catch (err) {
      console.error("Failed to fetch ratings:", err)
    } finally {
      setCourseRatingsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
        {/* <div className="rounded-2xl bg-white shadow-sm p-6">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-grayScale-400">Loading courses...</p> */}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-grayScale-100 bg-white px-5 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              to="/content"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-grayScale-50 text-grayScale-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-grayScale-700 sm:text-2xl">
                {category?.name} Sub-categories
              </h1>
              <p className="mt-0.5 text-sm text-grayScale-400">
                <span className="font-medium text-grayScale-500">{courses.length}</span> sub-categories available
              </p>
            </div>
          </div>
          <Button className="w-full bg-brand-500 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto" onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Sub-category
          </Button>
        </div>
      </div>

      {/* Course table or empty state */}
      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-3">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            Sub-category Management
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-grayScale-200 py-16 text-center">
              <img src={practiceSrc} alt="" className="h-16 w-16" />
              <h3 className="mt-4 text-base font-semibold text-grayScale-600">No sub-categories yet</h3>
              <p className="mt-1.5 text-sm text-grayScale-400">
                No sub-categories found in this category.
              </p>
              <Button
                variant="outline"
                className="mt-5 border-brand-200 text-brand-600 transition-colors hover:bg-brand-50"
                onClick={handleOpenModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add your first sub-category
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-grayScale-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-grayScale-100 hover:bg-grayScale-100">
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Sub-category
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
                  {courses.map((course, index) => (
                    <TableRow
                      key={course.id}
                      className={`cursor-pointer transition-colors hover:bg-brand-100/30 ${
                        index % 2 === 0 ? "bg-white" : "bg-grayScale-100/40"
                      }`}
                      onClick={() => handleCourseClick(course.id)}
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
                            className="h-8 w-8 text-amber-400 hover:bg-amber-50 hover:text-amber-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewRatings(course.id)
                            }}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(course)
                            }}
                          >
                            <Edit className="h-4 w-4" />
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
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(course)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
              <h2 className="text-lg font-bold text-grayScale-700">Add New Sub-category</h2>
              <button
                onClick={handleCloseModal}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {saveError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}

              <div>
                <label
                  htmlFor="course-title"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Title <span className="text-red-400">*</span>
                </label>
                <Input
                  id="course-title"
                  placeholder="Enter sub-category title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="course-description"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="course-description"
                  placeholder="Enter sub-category description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-xl border border-grayScale-200 bg-white px-3.5 py-2.5 text-sm transition-colors ring-offset-background placeholder:text-grayScale-400 focus-visible:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                />
              </div>

              <div className="rounded-lg bg-grayScale-50 px-3 py-2 text-xs text-grayScale-400">
                Category: <span className="font-semibold text-grayScale-600">{category?.name}</span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleCloseModal} disabled={saving} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                className="w-full bg-brand-500 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Sub-category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && courseToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
              <h2 className="text-lg font-bold text-grayScale-700">Edit Sub-category</h2>
              <button
                onClick={handleCloseEditModal}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {updateError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {updateError}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-course-title"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Title <span className="text-red-400">*</span>
                </label>
                <Input
                  id="edit-course-title"
                  placeholder="Enter sub-category title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-course-description"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="edit-course-description"
                  placeholder="Enter sub-category description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-xl border border-grayScale-200 bg-white px-3.5 py-2.5 text-sm transition-colors ring-offset-background placeholder:text-grayScale-400 focus-visible:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-course-thumbnail"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Thumbnail URL
                </label>
                <Input
                  id="edit-course-thumbnail"
                  placeholder="Enter thumbnail URL (e.g., https://example.com/image.jpg)"
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleCloseEditModal} disabled={updating} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                className="w-full bg-brand-500 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Sub-category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ratings Modal */}
      {showRatingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
              <h2 className="text-lg font-bold text-grayScale-700">Sub-category Ratings</h2>
              <button
                onClick={() => {
                  setShowRatingsModal(false)
                  setRatingsCourseId(null)
                  setCourseRatings([])
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              {courseRatingsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <p className="mt-4 text-sm font-medium text-grayScale-500">Loading ratings…</p>
                </div>
              ) : courseRatings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grayScale-200 bg-grayScale-50/50 py-16">
                  <div className="rounded-full bg-amber-50 p-4">
                    <Star className="h-8 w-8 text-amber-400" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-grayScale-700">No ratings yet</p>
                  <p className="mt-1 text-sm text-grayScale-400">
                    Ratings will appear here once learners start reviewing this sub-category.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-grayScale-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
                      <span className="text-lg font-bold text-grayScale-800">
                        {(courseRatings.reduce((sum, r) => sum + r.stars, 0) / courseRatings.length).toFixed(1)}
                      </span>
                      <span className="text-sm text-grayScale-400">/ 5</span>
                    </div>
                    <div className="h-5 w-px bg-grayScale-200" />
                    <span className="text-sm text-grayScale-500">
                      {courseRatings.length} review{courseRatings.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Rating cards */}
                  <div className="space-y-3">
                    {courseRatings.map((rating) => (
                      <div
                        key={rating.id}
                        className="rounded-xl border border-grayScale-200 bg-white p-5 space-y-3"
                      >
                        {/* Header row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                              U{rating.user_id}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-grayScale-700">User #{rating.user_id}</p>
                              <p className="text-[11px] text-grayScale-400">
                                {new Date(rating.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                                {rating.updated_at !== rating.created_at && (
                                  <span className="ml-1.5 text-grayScale-300">· edited</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Stars */}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= rating.stars
                                    ? "text-amber-400"
                                    : "text-grayScale-200"
                                }`}
                                fill={s <= rating.stars ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Review text */}
                        {rating.review && (
                          <div className="flex gap-2">
                            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-grayScale-300" />
                            <p className="text-sm leading-relaxed text-grayScale-600">
                              {rating.review}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Modal */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
              <h2 className="text-lg font-bold text-grayScale-700">Delete Sub-category</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-center text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-grayScale-700">{courseToDelete.title}</span>? This action cannot
                be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="w-full bg-red-500 shadow-sm transition-all hover:bg-red-600 hover:shadow-md sm:w-auto"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
