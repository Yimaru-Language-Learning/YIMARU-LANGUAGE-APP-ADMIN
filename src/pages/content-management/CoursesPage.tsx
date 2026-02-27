import { useEffect, useState, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Plus, ArrowLeft, BookOpen, ToggleLeft, ToggleRight, X, Trash2, MoreVertical, Edit, RefreshCw, AlertCircle } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { FileUpload } from "../../components/ui/file-upload"
import { getCoursesByCategory, getCourseCategories, createCourse, deleteCourse, updateCourseStatus, updateCourse } from "../../api/courses.api"
import type { Course, CourseCategory } from "../../types/course.types"

function CourseThumbnail({ src, alt, gradient }: { src?: string; alt: string; gradient: string }) {
  const [imgError, setImgError] = useState(false)
  
  if (!src || imgError) {
    return <div className={`h-full w-full rounded-t-lg ${gradient}`} />
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className="h-full w-full object-cover rounded-t-lg"
      onError={() => setImgError(true)}
    />
  )
}

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
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null)
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editThumbnail, setEditThumbnail] = useState("")
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

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

        setCourses(coursesRes.data.data.courses)
        const foundCategory = categoriesRes.data.data.categories.find(
          (c) => c.id === Number(categoryId)
        )
        setCategory(foundCategory ?? null)
      } catch (err) {
        console.error("Failed to fetch courses:", err)
        setError("Failed to load courses")
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
    setNewThumbnailFile(null)
    setNewVideoFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setTitle("")
    setDescription("")
    setSaveError(null)
    setNewThumbnailFile(null)
    setNewVideoFile(null)
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
      setSaveError(err.response?.data?.message || "Failed to create course")
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
      setUpdateError(err.response?.data?.message || "Failed to update course")
    } finally {
      setUpdating(false)
    }
  }

  const handleCourseClick = (courseId: number) => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-courses`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-grayScale-400">Loading courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-5 shadow-sm">
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
                {category?.name} Courses
              </h1>
              <p className="mt-0.5 text-sm text-grayScale-400">
                <span className="font-medium text-grayScale-500">{courses.length}</span> courses available
              </p>
            </div>
          </div>
          <Button className="w-full bg-brand-500 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto" onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Course
          </Button>
        </div>
      </div>

      {/* Course grid or empty state */}
      {courses.length === 0 ? (
        <Card className="border-dashed border-grayScale-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="rounded-2xl bg-grayScale-50 p-5">
              <BookOpen className="h-14 w-14 text-grayScale-300" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-grayScale-600">No courses yet</h3>
            <p className="mt-1.5 text-sm text-grayScale-400">No courses found in this category</p>
            <Button variant="outline" className="mt-6 border-brand-200 text-brand-600 transition-colors hover:bg-brand-50" onClick={handleOpenModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course, index) => {
            const gradients = [
              "bg-gradient-to-br from-blue-100 to-blue-200",
              "bg-gradient-to-br from-purple-100 to-purple-200",
              "bg-gradient-to-br from-green-100 to-green-200",
              "bg-gradient-to-br from-yellow-100 to-yellow-200",
            ]
            return (
              <Card
                key={course.id}
                className="group cursor-pointer overflow-hidden border border-grayScale-100 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-grayScale-200"
                onClick={() => handleCourseClick(course.id)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <CourseThumbnail 
                    src={course.thumbnail} 
                    alt={course.title} 
                    gradient={gradients[index % gradients.length]} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>
                
                {/* Content */}
                <div className="space-y-3 border-t border-grayScale-50 p-4">
                  {/* Status and menu */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                        course.is_active 
                          ? "border-0 bg-emerald-50 text-emerald-700" 
                          : "border-0 bg-grayScale-100 text-grayScale-500"
                      }`}
                    >
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${course.is_active ? "bg-emerald-500" : "bg-grayScale-400"}`} />
                      {course.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                    <div className="relative" ref={openMenuId === course.id ? menuRef : undefined} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === course.id && (
                        <div className="absolute right-0 top-full z-10 mt-1.5 w-44 animate-in fade-in slide-in-from-top-1 rounded-xl border border-grayScale-100 bg-white py-1.5 shadow-lg">
                          <button
                            onClick={() => {
                              handleToggleStatus(course)
                              setOpenMenuId(null)
                            }}
                            disabled={togglingId === course.id}
                            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-grayScale-600 transition-colors hover:bg-grayScale-50 disabled:opacity-50"
                          >
                            {course.is_active ? (
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
                          <div className="mx-3 my-1 border-t border-grayScale-100" />
                          <button
                            onClick={() => {
                              handleDeleteClick(course)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold text-grayScale-700 line-clamp-1">{course.title}</h3>
                  <p className="text-sm leading-relaxed text-grayScale-400 line-clamp-2">
                    {course.description || "No description available"}
                  </p>
                  
                  {/* Edit button */}
                  <Button 
                    variant="outline" 
                    className="w-full border-grayScale-200 text-grayScale-600 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(course)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
              <h2 className="text-lg font-bold text-grayScale-700">Add New Course</h2>
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
                  placeholder="Enter course title"
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
                  placeholder="Enter course description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-xl border border-grayScale-200 bg-white px-3.5 py-2.5 text-sm transition-colors ring-offset-background placeholder:text-grayScale-400 focus-visible:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-grayScale-600">Thumbnail image</p>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={setNewThumbnailFile}
                    label="Upload thumbnail"
                    description="Optional course cover image"
                    className="min-h-[90px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-grayScale-600">Intro video</p>
                  <FileUpload
                    accept="video/*"
                    onFileSelect={setNewVideoFile}
                    label="Upload intro video"
                    description="Optional overview for this course"
                    className="min-h-[90px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                  />
                </div>
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
                {saving ? "Saving..." : "Save Course"}
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
              <h2 className="text-lg font-bold text-grayScale-700">Edit Course</h2>
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
                  placeholder="Enter course title"
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
                  placeholder="Enter course description"
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
                {updating ? "Updating..." : "Update Course"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Modal */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
              <h2 className="text-lg font-bold text-grayScale-700">Delete Course</h2>
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
