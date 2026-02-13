import { useEffect, useState, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Layers, ToggleLeft, ToggleRight, MoreVertical, X, Trash2, RefreshCw, AlertCircle, Edit } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { getSubCoursesByCourse, getCoursesByCategory, getCourseCategories, createSubCourse, updateSubCourse, updateSubCourseStatus, deleteSubCourse } from "../../api/courses.api"
import { Input } from "../../components/ui/input"
import type { SubCourse, Course, CourseCategory } from "../../types/course.types"

export function SubCoursesPage() {
  const { categoryId, courseId } = useParams<{ categoryId: string; courseId: string }>()
  const navigate = useNavigate()
  const [subCourses, setSubCourses] = useState<SubCourse[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [category, setCategory] = useState<CourseCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [subCourseToDelete, setSubCourseToDelete] = useState<SubCourse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [subCourseToEdit, setSubCourseToEdit] = useState<SubCourse | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [level, setLevel] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openMenuId])

  const fetchSubCourses = async () => {
    if (!courseId) return

    try {
      const subCoursesRes = await getSubCoursesByCourse(Number(courseId))
      setSubCourses(subCoursesRes.data.data.sub_courses ?? [])
    } catch (err) {
      console.error("Failed to fetch sub-courses:", err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !categoryId) return

      try {
        const [subCoursesRes, coursesRes, categoriesRes] = await Promise.all([
          getSubCoursesByCourse(Number(courseId)),
          getCoursesByCategory(Number(categoryId)),
          getCourseCategories(),
        ])

        setSubCourses(subCoursesRes.data.data.sub_courses ?? [])

        const foundCourse = coursesRes.data.data.courses?.find(
          (c) => c.id === Number(courseId)
        )
        setCourse(foundCourse ?? null)

        const foundCategory = categoriesRes.data.data.categories?.find(
          (c) => c.id === Number(categoryId)
        )
        setCategory(foundCategory ?? null)
      } catch (err) {
        console.error("Failed to fetch sub-courses:", err)
        setError("Failed to load sub-courses")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, categoryId])

  const handleToggleStatus = async (subCourse: SubCourse) => {
    setTogglingId(subCourse.id)
    try {
      await updateSubCourseStatus(subCourse.id, {
        is_active: !subCourse.is_active,
        level: subCourse.level,
        title: subCourse.title,
      })
      await fetchSubCourses()
    } catch (err) {
      console.error("Failed to update sub-course status:", err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteClick = (subCourse: SubCourse) => {
    setSubCourseToDelete(subCourse)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!subCourseToDelete) return

    setDeleting(true)
    try {
      await deleteSubCourse(subCourseToDelete.id)
      setShowDeleteModal(false)
      setSubCourseToDelete(null)
      await fetchSubCourses()
    } catch (err) {
      console.error("Failed to delete sub-course:", err)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddSubCourse = () => {
    setTitle("")
    setDescription("")
    setLevel("")
    setSaveError(null)
    setShowAddModal(true)
  }

  const handleSaveNewSubCourse = async () => {
    if (!courseId) return
    setSaving(true)
    setSaveError(null)
    try {
      await createSubCourse({
        course_id: Number(courseId),
        title,
        description,
        level,
      })
      setShowAddModal(false)
      setTitle("")
      setDescription("")
      setLevel("")
      await fetchSubCourses()
    } catch (err) {
      console.error("Failed to create sub-course:", err)
      setSaveError("Failed to create sub-course")
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (subCourse: SubCourse) => {
    setSubCourseToEdit(subCourse)
    setTitle(subCourse.title)
    setDescription(subCourse.description)
    setLevel(subCourse.level)
    setSaveError(null)
    setShowEditModal(true)
  }

  const handleSaveEditSubCourse = async () => {
    if (!subCourseToEdit) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateSubCourse(subCourseToEdit.id, {
        title,
        description,
        level,
      })
      setShowEditModal(false)
      setSubCourseToEdit(null)
      setTitle("")
      setDescription("")
      setLevel("")
      await fetchSubCourses()
    } catch (err) {
      console.error("Failed to update sub-course:", err)
      setSaveError("Failed to update sub-course")
    } finally {
      setSaving(false)
    }
  }

  const handleSubCourseClick = (subCourseId: number) => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-full bg-brand-50 p-4">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
        </div>
        <p className="mt-4 text-sm font-medium text-grayScale-400">Loading sub-courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 shadow-md">
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            to={`/content/category/${categoryId}/courses`}
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-grayScale-200 bg-white text-grayScale-500 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-grayScale-400">
              <span className="truncate max-w-[100px] rounded bg-grayScale-50 px-1.5 py-0.5 sm:max-w-none">{category?.name}</span>
              <span className="shrink-0 text-grayScale-300">→</span>
              <span className="truncate max-w-[100px] rounded bg-grayScale-50 px-1.5 py-0.5 sm:max-w-none">{course?.title}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">Sub-courses</h1>
            <p className="mt-0.5 text-sm text-grayScale-400">{subCourses.length} sub-course{subCourses.length !== 1 ? "s" : ""} available</p>
          </div>
        </div>
        <Button className="w-full rounded-xl bg-brand-500 px-5 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto" onClick={handleAddSubCourse}>
          Add New Sub-course
        </Button>
      </div>

      {/* Sub-course grid or empty state */}
      {subCourses.length === 0 ? (
        <Card className="border border-dashed border-grayScale-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-2xl bg-brand-50 p-5">
              <Layers className="h-10 w-10 text-brand-400" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-grayScale-600">No sub-courses yet</h3>
            <p className="mt-1.5 max-w-xs text-center text-sm text-grayScale-400">Get started by adding your first sub-course to this course</p>
            <Button className="mt-5 rounded-xl bg-brand-500 px-5 shadow-sm hover:bg-brand-600 hover:shadow-md" onClick={handleAddSubCourse}>
              Add your first sub-course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subCourses.map((subCourse, index) => {
            const gradients = [
              "bg-gradient-to-br from-blue-100 to-blue-200",
              "bg-gradient-to-br from-purple-100 to-purple-200",
              "bg-gradient-to-br from-green-100 to-green-200",
              "bg-gradient-to-br from-yellow-100 to-yellow-200",
            ]
            return (
              <Card 
                key={subCourse.id} 
                className="group cursor-pointer overflow-hidden border border-grayScale-100 bg-white shadow-sm transition-all duration-200 hover:shadow-soft hover:-translate-y-1 hover:border-brand-100"
                onClick={() => handleSubCourseClick(subCourse.id)}
              >
                {/* Thumbnail with level badge */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {subCourse.thumbnail ? (
                    <img
                      src={subCourse.thumbnail}
                      alt={subCourse.title}
                      className="h-full w-full object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`h-full w-full rounded-t-lg transition-transform duration-300 group-hover:scale-105 ${gradients[index % gradients.length]}`} />
                  )}
                  {subCourse.level && (
                    <div className="absolute bottom-2.5 right-2.5 rounded-md bg-brand-600/90 px-2.5 py-1 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur-sm">
                      {subCourse.level}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex flex-col gap-3 p-4">
                  {/* Status and menu */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                        subCourse.is_active 
                          ? "border border-green-200 bg-green-50 text-green-700" 
                          : "border border-grayScale-200 bg-grayScale-50 text-grayScale-500"
                      }`}
                    >
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${subCourse.is_active ? "bg-green-500" : "bg-grayScale-400"}`} />
                      {subCourse.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <div
                      className="relative"
                      ref={openMenuId === subCourse.id ? menuRef : undefined}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenMenuId(openMenuId === subCourse.id ? null : subCourse.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === subCourse.id && (
                        <div className="absolute right-0 top-full z-10 mt-1.5 w-44 overflow-hidden rounded-xl border border-grayScale-100 bg-white py-1 shadow-lg">
                          <button
                            onClick={() => {
                              handleToggleStatus(subCourse)
                              setOpenMenuId(null)
                            }}
                            disabled={togglingId === subCourse.id}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-grayScale-600 transition-colors hover:bg-grayScale-50 disabled:opacity-50"
                          >
                            {subCourse.is_active ? (
                              <>
                                <ToggleLeft className="h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4" />
                                Activate
                              </>
                            )}
                          </button>
                          <div className="mx-3 border-t border-grayScale-100" />
                          <button
                            onClick={() => {
                              handleDeleteClick(subCourse)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div>
                    <h3 className="font-semibold text-grayScale-700 group-hover:text-brand-600 transition-colors">{subCourse.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-grayScale-400 line-clamp-2">
                      {subCourse.description || "No description available"}
                    </p>
                  </div>
                  
                  {/* Edit button */}
                  <Button 
                    variant="outline" 
                    className="mt-auto w-full rounded-lg border-grayScale-200 text-grayScale-500 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(subCourse)
                    }}
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && subCourseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-700">Delete Sub-course</h2>
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
                <span className="font-semibold text-grayScale-700">{subCourseToDelete.title}</span>? This action cannot
                be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="w-full rounded-lg sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="w-full rounded-lg bg-red-500 shadow-sm hover:bg-red-600 sm:w-auto"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-700">Add New Sub-course</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-grayScale-600">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter sub-course title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-grayScale-600">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter sub-course description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-grayScale-600">Level</label>
                <Input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </div>
              {saveError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="w-full rounded-lg sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="w-full rounded-lg bg-brand-500 shadow-sm hover:bg-brand-600 sm:w-auto"
                onClick={handleSaveNewSubCourse}
                disabled={saving || !title.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-course Modal */}
      {showEditModal && subCourseToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-700">Edit Sub-course</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-grayScale-600">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter sub-course title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-grayScale-600">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter sub-course description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-grayScale-600">Level</label>
                <Input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </div>
              {saveError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="w-full rounded-lg sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="w-full rounded-lg bg-brand-500 shadow-sm hover:bg-brand-600 sm:w-auto"
                onClick={handleSaveEditSubCourse}
                disabled={saving || !title.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
