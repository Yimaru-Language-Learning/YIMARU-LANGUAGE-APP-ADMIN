import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, FileText, Layers, Edit, Trash2, X, Video, MoreVertical } from "lucide-react"
import { Card } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { 
  getSubCoursesByCourse,
  getQuestionSetsByOwner,
  getVideosBySubCourse,
  updatePractice,
  deleteQuestionSet,
  createVimeoVideo,
  updateSubCourseVideo,
  deleteSubCourseVideo
} from "../../api/courses.api"
import type { SubCourse, QuestionSet, SubCourseVideo } from "../../types/course.types"

type TabType = "video" | "practice"
type StatusFilter = "all" | "published" | "draft" | "archived"

export function SubCourseContentPage() {
  const { categoryId, courseId, subCourseId } = useParams<{ 
    categoryId: string
    courseId: string
    subCourseId: string
  }>()
  const navigate = useNavigate()
  
  const [subCourse, setSubCourse] = useState<SubCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<TabType>("practice")
  const [statusFilter] = useState<StatusFilter>("all")
  
  const [practices, setPractices] = useState<QuestionSet[]>([])
  const [videos, setVideos] = useState<SubCourseVideo[]>([])
  const [practicesLoading, setPracticesLoading] = useState(false)
  const [videosLoading, setVideosLoading] = useState(false)

  const [showEditPracticeModal, setShowEditPracticeModal] = useState(false)
  const [practiceToEdit, setPracticeToEdit] = useState<QuestionSet | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [practiceToDelete, setPracticeToDelete] = useState<QuestionSet | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [persona, setPersona] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [showAddVideoModal, setShowAddVideoModal] = useState(false)
  const [showEditVideoModal, setShowEditVideoModal] = useState(false)
  const [videoToEdit, setVideoToEdit] = useState<SubCourseVideo | null>(null)
  const [showDeleteVideoModal, setShowDeleteVideoModal] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<SubCourseVideo | null>(null)
  const [deletingVideo, setDeletingVideo] = useState(false)
  const [openVideoMenuId, setOpenVideoMenuId] = useState<number | null>(null)

  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoFileSize, setVideoFileSize] = useState<number>(0)
  const [videoDuration, setVideoDuration] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!subCourseId || !courseId) return

      try {
        const subCoursesRes = await getSubCoursesByCourse(Number(courseId))
        const foundSubCourse = subCoursesRes.data.data.sub_courses?.find(
          (sc) => sc.id === Number(subCourseId)
        )
        setSubCourse(foundSubCourse ?? null)
      } catch (err) {
        console.error("Failed to fetch sub-course data:", err)
        setError("Failed to load sub-course")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [subCourseId, courseId])

  const fetchPractices = async () => {
    if (!subCourseId) return
    setPracticesLoading(true)
    try {
      const res = await getQuestionSetsByOwner("SUB_COURSE", Number(subCourseId))
      setPractices(res.data.data ?? [])
    } catch (err) {
      console.error("Failed to fetch practices:", err)
    } finally {
      setPracticesLoading(false)
    }
  }

  const fetchVideos = async () => {
    if (!subCourseId) return
    setVideosLoading(true)
    try {
      const res = await getVideosBySubCourse(Number(subCourseId))
      setVideos(res.data.data.videos ?? [])
    } catch (err) {
      console.error("Failed to fetch videos:", err)
    } finally {
      setVideosLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "practice") {
      fetchPractices()
    } else {
      fetchVideos()
    }
  }, [activeTab, subCourseId])

  const handleAddPractice = () => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}/add-practice`)
  }



  const handleEditClick = (practice: QuestionSet) => {
    setPracticeToEdit(practice)
    setTitle(practice.title)
    setDescription(practice.description)
    setPersona(practice.persona || "")
    setSaveError(null)
    setShowEditPracticeModal(true)
  }

  const handleSaveEditPractice = async () => {
    if (!practiceToEdit) return
    setSaving(true)
    setSaveError(null)
    try {
      await updatePractice(practiceToEdit.id, {
        title,
        description,
        persona,
      })
      setShowEditPracticeModal(false)
      setPracticeToEdit(null)
      setTitle("")
      setDescription("")
      setPersona("")
      await fetchPractices()
    } catch (err) {
      console.error("Failed to update practice:", err)
      setSaveError("Failed to update practice")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (practice: QuestionSet) => {
    setPracticeToDelete(practice)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!practiceToDelete) return
    setDeleting(true)
    try {
      await deleteQuestionSet(practiceToDelete.id)
      setShowDeleteModal(false)
      setPracticeToDelete(null)
      await fetchPractices()
    } catch (err) {
      console.error("Failed to delete practice:", err)
    } finally {
      setDeleting(false)
    }
  }

  const handlePracticeClick = (practiceId: number) => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-courses/${subCourseId}/practices/${practiceId}/questions`)
  }

  const handleAddVideo = () => {
    setVideoTitle("")
    setVideoDescription("")
    setVideoUrl("")
    setVideoFileSize(0)
    setVideoDuration(0)
    setSaveError(null)
    setShowAddVideoModal(true)
  }

  const handleSaveNewVideo = async () => {
    if (!subCourseId) return
    setSaving(true)
    setSaveError(null)
    try {
      await createVimeoVideo({
        sub_course_id: Number(subCourseId),
        title: videoTitle,
        description: videoDescription,
        source_url: videoUrl,
        file_size: videoFileSize,
        duration: videoDuration,
      })
      setShowAddVideoModal(false)
      setVideoTitle("")
      setVideoDescription("")
      setVideoUrl("")
      setVideoFileSize(0)
      setVideoDuration(0)
      await fetchVideos()
    } catch (err) {
      console.error("Failed to create video:", err)
      setSaveError("Failed to create video")
    } finally {
      setSaving(false)
    }
  }

  const handleEditVideoClick = (video: SubCourseVideo) => {
    setVideoToEdit(video)
    setVideoTitle(video.title)
    setVideoDescription(video.description || "")
    setVideoUrl(video.video_url || "")
    setSaveError(null)
    setShowEditVideoModal(true)
  }

  const handleSaveEditVideo = async () => {
    if (!videoToEdit) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateSubCourseVideo(videoToEdit.id, {
        title: videoTitle,
        description: videoDescription,
        video_url: videoUrl,
      })
      setShowEditVideoModal(false)
      setVideoToEdit(null)
      setVideoTitle("")
      setVideoDescription("")
      setVideoUrl("")
      await fetchVideos()
    } catch (err) {
      console.error("Failed to update video:", err)
      setSaveError("Failed to update video")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVideoClick = (video: SubCourseVideo) => {
    setVideoToDelete(video)
    setShowDeleteVideoModal(true)
  }

  const handleConfirmDeleteVideo = async () => {
    if (!videoToDelete) return
    setDeletingVideo(true)
    try {
      await deleteSubCourseVideo(videoToDelete.id)
      setShowDeleteVideoModal(false)
      setVideoToDelete(null)
      await fetchVideos()
    } catch (err) {
      console.error("Failed to delete video:", err)
    } finally {
      setDeletingVideo(false)
    }
  }

  const filteredPractices = practices.filter((practice) => {
    if (statusFilter === "all") return true
    if (statusFilter === "published") return practice.status === "PUBLISHED"
    if (statusFilter === "draft") return practice.status === "DRAFT"
    if (statusFilter === "archived") return practice.status === "ARCHIVED"
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-grayScale-500">Loading sub-course...</div>
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
      {/* Back Button */}
      <Link
        to={`/content/category/${categoryId}/courses/${courseId}/sub-courses`}
        className="inline-flex items-center gap-2 text-sm text-grayScale-600 hover:text-grayScale-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sub-courses
      </Link>

      {/* SubCourse Header */}
      <div className="flex items-start justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-grayScale-900">
              {subCourse?.title}
            </h1>
            {subCourse?.level && (
              <Badge className="bg-purple-100 text-purple-700">{subCourse.level}</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-grayScale-500">
            {subCourse?.description || "No description available"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-brand-500 text-brand-500 hover:bg-brand-50"
            onClick={handleAddPractice}
          >
            <FileText className="mr-2 h-4 w-4" />
            Add Practice
          </Button>
          <Button className="bg-brand-500 hover:bg-brand-600" onClick={handleAddVideo}>
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-grayScale-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("video")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "video"
                ? "border-b-2 border-brand-500 text-brand-500"
                : "text-grayScale-500 hover:text-grayScale-700"
            }`}
          >
            Video
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "practice"
                ? "border-b-2 border-brand-500 text-brand-500"
                : "text-grayScale-500 hover:text-grayScale-700"
            }`}
          >
            Practice
          </button>
        </div>
      </div>



      {/* Content */}
      {activeTab === "practice" && (
        <>
          {practicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-grayScale-500">Loading practices...</div>
            </div>
          ) : filteredPractices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-grayScale-300" />
              <p className="text-sm text-grayScale-500">No practices found</p>
              <Button variant="outline" className="mt-4" onClick={handleAddPractice}>
                Add your first practice
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPractices.map((practice) => {
                const statusConfig: Record<string, { bg: string; dot: string; text: string }> = {
                  PUBLISHED: { bg: "bg-transparent border border-green-200 text-green-600", dot: "bg-green-500", text: "Published" },
                  DRAFT: { bg: "bg-grayScale-100 border border-grayScale-200 text-grayScale-600", dot: "bg-grayScale-400", text: "Draft" },
                  ARCHIVED: { bg: "bg-transparent border border-amber-200 text-amber-600", dot: "bg-amber-500", text: "Archived" },
                }
                const status = statusConfig[practice.status] ?? statusConfig.DRAFT

                return (
                  <Card 
                    key={practice.id} 
                    className="cursor-pointer overflow-hidden border border-grayScale-200 shadow-sm transition hover:shadow-md hover:border-brand-200"
                    onClick={() => handlePracticeClick(practice.id)}
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-grayScale-900 line-clamp-2">{practice.title}</h3>
                        <Badge className={`shrink-0 text-xs font-medium ${status.bg}`}>
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.text}
                        </Badge>
                      </div>

                      <p className="text-sm text-grayScale-500 line-clamp-2">{practice.description}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-brand-50 text-brand-600 text-xs px-2 py-0.5 border border-brand-200">
                          {practice.set_type}
                        </Badge>
                        {practice.persona && (
                          <Badge className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 border border-purple-200">
                            {practice.persona}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-grayScale-400">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          <span>{practice.owner_type.replace("_", " ")}</span>
                        </div>
                        {practice.shuffle_questions && (
                          <span className="text-amber-500">Shuffle ON</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-grayScale-100 pt-3">
                        <span className="text-xs text-grayScale-400">
                          {new Date(practice.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditClick(practice)}
                            className="rounded p-1.5 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(practice)}
                            className="rounded p-1.5 text-grayScale-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "video" && (
        <>
          {videosLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-grayScale-500">Loading videos...</div>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Video className="mb-4 h-12 w-12 text-grayScale-300" />
              <p className="text-sm text-grayScale-500">No videos found</p>
              <Button variant="outline" className="mt-4" onClick={handleAddVideo}>
                Add your first video
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video, index) => {
                const gradients = [
                  "bg-gradient-to-br from-blue-100 to-blue-200",
                  "bg-gradient-to-br from-yellow-100 to-yellow-200",
                  "bg-gradient-to-br from-purple-100 to-purple-200",
                  "bg-gradient-to-br from-green-100 to-green-200",
                ]
                const formatDuration = (seconds: number) => {
                  const mins = Math.floor(seconds / 60)
                  const secs = seconds % 60
                  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                }
                return (
                  <Card key={video.id} className="overflow-hidden border-0 bg-white shadow-sm">
                    {/* Thumbnail with duration */}
                    <div className="relative aspect-video w-full">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover rounded-t-lg" />
                      ) : (
                        <div className={`h-full w-full rounded-t-lg ${gradients[index % gradients.length]}`} />
                      )}
                      <div className="absolute bottom-2 right-2 rounded bg-grayScale-900/80 px-2 py-0.5 text-xs font-medium text-white">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Status and menu */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          className={`text-xs font-medium ${
                            video.is_published 
                              ? "bg-transparent text-green-600 border border-green-200" 
                              : "bg-grayScale-100 text-grayScale-600 border border-grayScale-200"
                          }`}
                        >
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${video.is_published ? "bg-green-500" : "bg-grayScale-400"}`} />
                          {video.is_published ? "PUBLISHED" : "DRAFT"}
                        </Badge>
                        <div className="relative">
                          <button 
                            onClick={() => setOpenVideoMenuId(openVideoMenuId === video.id ? null : video.id)}
                            className="text-grayScale-400 hover:text-grayScale-600"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openVideoMenuId === video.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                              <button
                                onClick={() => {
                                  handleDeleteVideoClick(video)
                                  setOpenVideoMenuId(null)
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
                      <h3 className="font-medium text-grayScale-900">{video.title}</h3>
                      
                      {/* Edit button */}
                      <Button 
                        variant="outline" 
                        className="w-full border-grayScale-200 text-grayScale-700"
                        onClick={() => handleEditVideoClick(video)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      
                      {/* Publish button */}
                      <Button 
                        className={`w-full ${
                          video.is_published 
                            ? "bg-green-500 hover:bg-green-600" 
                            : "bg-brand-500 hover:bg-brand-600"
                        }`}
                      >
                        {video.is_published ? "Published" : "Publish"}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && practiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Delete Practice</h2>
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
                <span className="font-semibold">{practiceToDelete.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button className="bg-red-500 hover:bg-red-600" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Practice Modal */}
      {showEditPracticeModal && practiceToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Practice</h2>
              <button
                onClick={() => setShowEditPracticeModal(false)}
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
                  placeholder="Enter practice title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter practice description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Persona (Optional)</label>
                <Input
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="Enter persona"
                />
              </div>
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setShowEditPracticeModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleSaveEditPractice}
                disabled={saving || !title.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Add Video</h2>
              <button
                onClick={() => setShowAddVideoModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Title</label>
                <Input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Enter video description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Source URL</label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example-storage.com/video.mp4"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-700">File Size (bytes)</label>
                  <Input
                    type="number"
                    value={videoFileSize || ""}
                    onChange={(e) => setVideoFileSize(Number(e.target.value))}
                    placeholder="52428800"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-700">Duration (seconds)</label>
                  <Input
                    type="number"
                    value={videoDuration || ""}
                    onChange={(e) => setVideoDuration(Number(e.target.value))}
                    placeholder="300"
                    min={0}
                  />
                </div>
              </div>
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setShowAddVideoModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleSaveNewVideo}
                disabled={saving || !videoTitle.trim() || !videoUrl.trim()}
              >
                {saving ? "Uploading..." : "Upload to Vimeo"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditVideoModal && videoToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Video</h2>
              <button
                onClick={() => setShowEditVideoModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Title</label>
                <Input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Enter video description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">Video URL</label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter video URL"
                />
              </div>
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setShowEditVideoModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 hover:bg-brand-600"
                onClick={handleSaveEditVideo}
                disabled={saving || !videoTitle.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Video Modal */}
      {showDeleteVideoModal && videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-grayScale-900">Delete Video</h2>
              <button
                onClick={() => setShowDeleteVideoModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{videoToDelete.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setShowDeleteVideoModal(false)} disabled={deletingVideo}>
                Cancel
              </Button>
              <Button className="bg-red-500 hover:bg-red-600" onClick={handleConfirmDeleteVideo} disabled={deletingVideo}>
                {deletingVideo ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
