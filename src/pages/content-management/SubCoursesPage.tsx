import { useEffect, useState, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Layers, ToggleLeft, ToggleRight, MoreVertical, X, Trash2 } from "lucide-react"
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
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-grayScale-500">Loading sub-courses...</div>
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
            to={`/content/category/${categoryId}/courses`}
            className="grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 hover:bg-brand-100 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-grayScale-500">
              <span>{category?.name}</span>
              <span>→</span>
              <span>{course?.title}</span>
            </div>
            <h1 className="text-xl font-semibold text-grayScale-900">Sub-courses</h1>
            <p className="text-sm text-grayScale-500">{subCourses.length} sub-courses available</p>
          </div>
        </div>
        <Button className="bg-brand-500 hover:bg-brand-600" onClick={handleAddSubCourse}>
          Add New Sub-course
        </Button>
      </div>

      {subCourses.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="mb-4 h-12 w-12 text-grayScale-300" />
            <p className="text-sm text-grayScale-500">No sub-courses found for this course</p>
            <Button variant="outline" className="mt-4" onClick={handleAddSubCourse}>
              Add your first sub-course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                className="cursor-pointer overflow-hidden border-0 bg-white shadow-sm transition hover:shadow-md"
                onClick={() => handleSubCourseClick(subCourse.id)}
              >
                {/* Thumbnail with level badge */}
                <div className="relative aspect-video w-full">
                  {subCourse.thumbnail ? (
                    <img
                      src={subCourse.thumbnail}
                      alt={subCourse.title}
                      className="h-full w-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className={`h-full w-full rounded-t-lg ${gradients[index % gradients.length]}`} />
                  )}
                  {subCourse.level && (
                    <div className="absolute bottom-2 right-2 rounded bg-purple-600 px-3 py-1 text-sm font-semibold text-white">
                      {subCourse.level}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Status and menu */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`text-xs font-medium ${
                        subCourse.is_active 
                          ? "bg-transparent text-green-600 border border-green-200" 
                          : "bg-grayScale-100 text-grayScale-600 border border-grayScale-200"
                      }`}
                    >
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${subCourse.is_active ? "bg-green-500" : "bg-grayScale-400"}`} />
                      {subCourse.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                    <div
                      className="relative"
                      ref={openMenuId === subCourse.id ? menuRef : undefined}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenMenuId(openMenuId === subCourse.id ? null : subCourse.id)}
                        className="text-grayScale-400 hover:text-grayScale-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === subCourse.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          <button
                            onClick={() => {
                              handleToggleStatus(subCourse)
                              setOpenMenuId(null)
                            }}
                            disabled={togglingId === subCourse.id}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-grayScale-700 hover:bg-grayScale-100 disabled:opacity-50"
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
                          <button
                            onClick={() => {
                              handleDeleteClick(subCourse)
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
                  <h3 className="font-medium text-grayScale-900">{subCourse.title}</h3>
                  <p className="text-sm text-grayScale-500 line-clamp-2">
                    {subCourse.description || "No description available"}
                  </p>
                  
                  {/* Edit button */}
                  <Button 
                    variant="outline" 
                    className="w-full border-grayScale-200 text-grayScale-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(subCourse)
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {showDeleteModal && subCourseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Delete Sub-course</h2>
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
                <span className="font-semibold">{subCourseToDelete.title}</span>? This action cannot
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Add New Sub-course</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter sub-course title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter sub-course description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Level</label>
                <Input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </div>
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleSaveNewSubCourse}
                disabled={saving || !title.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && subCourseToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Sub-course</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter sub-course title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter sub-course description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Level</label>
                <Input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </div>
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
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
