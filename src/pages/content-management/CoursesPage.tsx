 import { useEffect, useState, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Plus, ArrowLeft, BookOpen, ToggleLeft, ToggleRight, X, Trash2, MoreVertical, Edit } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
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
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-grayScale-500">Loading courses...</div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/content"
            className="grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 hover:bg-brand-100 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-grayScale-900">
              {category?.name} Courses
            </h1>
            <p className="text-sm text-grayScale-500">{courses.length} courses available</p>
          </div>
        </div>
        <Button className="bg-brand-500 hover:bg-brand-600" onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-grayScale-300" />
            <p className="text-sm text-grayScale-500">No courses found in this category</p>
            <Button variant="outline" className="mt-4" onClick={handleOpenModal}>
              Add your first course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                className="cursor-pointer overflow-hidden border-0 bg-white shadow-sm transition hover:shadow-md"
                onClick={() => handleCourseClick(course.id)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full">
                  <CourseThumbnail 
                    src={course.thumbnail} 
                    alt={course.title} 
                    gradient={gradients[index % gradients.length]} 
                  />
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Status and menu */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`text-xs font-medium ${
                        course.is_active 
                          ? "bg-transparent text-green-600 border border-green-200" 
                          : "bg-grayScale-100 text-grayScale-600 border border-grayScale-200"
                      }`}
                    >
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${course.is_active ? "bg-green-500" : "bg-grayScale-400"}`} />
                      {course.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                    <div className="relative" ref={openMenuId === course.id ? menuRef : undefined} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                        className="text-grayScale-400 hover:text-grayScale-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === course.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          <button
                            onClick={() => {
                              handleToggleStatus(course)
                              setOpenMenuId(null)
                            }}
                            disabled={togglingId === course.id}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-grayScale-700 hover:bg-grayScale-100 disabled:opacity-50"
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
                          <button
                            onClick={() => {
                              handleDeleteClick(course)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-medium text-grayScale-900">{course.title}</h3>
                  <p className="text-sm text-grayScale-500 line-clamp-2">
                    {course.description || "No description available"}
                  </p>
                  
                  {/* Edit button */}
                  <Button 
                    variant="outline" 
                    className="w-full border-grayScale-200 text-grayScale-700"
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Add New Course</h2>
              <button
                onClick={handleCloseModal}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {saveError && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              <div>
                <label
                  htmlFor="course-title"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Title
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
                  Description
                </label>
                <textarea
                  id="course-description"
                  placeholder="Enter course description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-grayScale-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="text-xs text-grayScale-500">
                Category: <span className="font-medium">{category?.name}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={handleCloseModal} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Course"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && courseToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Course</h2>
              <button
                onClick={handleCloseEditModal}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {updateError && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {updateError}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-course-title"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Title
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
                  Description
                </label>
                <textarea
                  id="edit-course-description"
                  placeholder="Enter course description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-grayScale-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={handleCloseEditModal} disabled={updating}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Course"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Delete Course</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{courseToDelete.title}</span>? This action cannot
                be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
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
