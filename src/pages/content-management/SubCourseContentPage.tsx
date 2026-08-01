import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, FileText, Layers, Edit, Trash2, X, Video, MoreVertical, Star, ChevronLeft, ChevronRight, MessageSquare, Play } from "lucide-react"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import { Card } from "../../components/ui/card"
import alertSrc from "../../assets/Alert.svg"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { 
  getSubModulesByCourse,
  getQuestionSetsByOwner,
  getVideosBySubModule,
  updatePractice,
  deleteQuestionSet,
  createCourseVideo,
  updateSubCourseVideo,
  deleteSubCourseVideo,
  getVimeoSample,
} from "../../api/courses.api"
import { getRatings } from "../../api/ratings.api"
import { VideoUploadProgressBar } from "../../components/video-upload/VideoUploadProgressBar"
import { useVideoUpload } from "../../hooks/useVideoUpload"
import { vimeoResultToStoredUrl } from "../../lib/video-upload/upload-video"
import type {
  SubCourse,
  QuestionSet,
  SubCourseVideo,
  VimeoSampleVideo,
  VideoStatus,
  VideoVisibility,
} from "../../types/course.types"
import type { Rating } from "../../types/ratings.types"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { UnassignedLabel } from "../../lib/displayValue"

type TabType = "video" | "practice" | "ratings"
type StatusFilter = "all" | "published" | "draft" | "archived"

export function SubModuleContentPage() {
  const { categoryId, courseId, subModuleId } = useParams<{ 
    categoryId: string
    courseId: string
    subModuleId: string
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

  // Ratings state
  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [ratingsPage, setRatingsPage] = useState(0)
  const [ratingsPageSize] = useState(10)

  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoFileSize, setVideoFileSize] = useState<number>(0)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videoResolution, setVideoResolution] = useState("1080p")
  const [videoVisibility, setVideoVisibility] = useState<VideoVisibility>("PUBLISHED")
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("PUBLISHED")
  const [videoDisplayOrder, setVideoDisplayOrder] = useState<number>(1)
  const {
    upload: uploadNewVideo,
    cancel: cancelNewVideo,
    progress: newVideoProgress,
    isBusy: uploadingNewVideo,
  } = useVideoUpload()

  // Vimeo preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewIframe, setPreviewIframe] = useState("")
  const [previewVideo, setPreviewVideo] = useState<VimeoSampleVideo | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!subModuleId || !courseId) return

      try {
        const subCoursesRes = await getSubModulesByCourse(Number(courseId))
        const list = subCoursesRes.data?.data?.sub_courses
        const foundSubCourse = Array.isArray(list)
          ? list.find((sc) => sc.id === Number(subModuleId))
          : undefined
        setSubCourse(foundSubCourse ?? null)
      } catch (err) {
        console.error("Failed to fetch course data:", err)
        setError("Failed to load course")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [subModuleId, courseId])

  const fetchPractices = async () => {
    if (!subModuleId) return
    setPracticesLoading(true)
    try {
      const res = await getQuestionSetsByOwner("SUB_MODULE", Number(subModuleId))
      const raw = res.data?.data
      const list = Array.isArray(raw) ? raw : (raw as { question_sets?: QuestionSet[] })?.question_sets ?? []
      setPractices(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error("Failed to fetch practices:", err)
    } finally {
      setPracticesLoading(false)
    }
  }

  const fetchVideos = async () => {
    if (!subModuleId) return
    setVideosLoading(true)
    try {
      const res = await getVideosBySubModule(Number(subModuleId))
      const vids = res.data?.data?.videos ?? []
      setVideos(Array.isArray(vids) ? vids : [])
    } catch (err) {
      console.error("Failed to fetch videos:", err)
    } finally {
      setVideosLoading(false)
    }
  }

  const fetchRatings = async (offset = 0) => {
    if (!subModuleId) return
    setRatingsLoading(true)
    try {
      const res = await getRatings({
        target_type: "sub_course",
        target_id: Number(subModuleId),
        limit: ratingsPageSize,
        offset,
      })
      setRatings(res.data?.data ?? [])
    } catch (err) {
      console.error("Failed to fetch ratings:", err)
    } finally {
      setRatingsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "practice") {
      fetchPractices()
    } else if (activeTab === "video") {
      fetchVideos()
    } else if (activeTab === "ratings") {
      fetchRatings(ratingsPage * ratingsPageSize)
    }
  }, [activeTab, subModuleId])

  useEffect(() => {
    if (activeTab === "ratings") {
      fetchRatings(ratingsPage * ratingsPageSize)
    }
  }, [ratingsPage])

  const handleAddPractice = () => {
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-modules/${subModuleId}/add-practice`)
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
    navigate(`/content/category/${categoryId}/courses/${courseId}/sub-modules/${subModuleId}/practices/${practiceId}/questions`)
  }

  const handleAddVideo = () => {
    setVideoTitle("")
    setVideoDescription("")
    setVideoUrl("")
    setVideoFile(null)
    setVideoFileSize(0)
    setVideoDuration(0)
    setVideoResolution("1080p")
    setVideoVisibility("PUBLISHED")
    setVideoStatus("PUBLISHED")
    setVideoDisplayOrder(1)
    setSaveError(null)
    setShowAddVideoModal(true)
  }

  const handleVideoFileSelect = (file: File | null) => {
    setVideoFile(file)
    if (!file) {
      setVideoFileSize(0)
      setVideoDuration(0)
      return
    }

    setVideoFileSize(file.size)
    const video = document.createElement("video")
    const objectUrl = URL.createObjectURL(file)
    video.preload = "metadata"
    video.src = objectUrl
    video.onloadedmetadata = () => {
      setVideoDuration(Math.max(0, Math.round(video.duration || 0)))
      URL.revokeObjectURL(objectUrl)
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleSaveNewVideo = async () => {
    if (!subModuleId || !videoFile) return
    setSaving(true)
    setSaveError(null)
    try {
      const uploadResult = await uploadNewVideo(videoFile, {
        title: videoTitle.trim() || videoFile.name,
        description: videoDescription.trim() || undefined,
      })
      if (!uploadResult) {
        setSaving(false)
        return
      }

      const finalVideoUrl = vimeoResultToStoredUrl(uploadResult)
      const finalTitle = videoTitle.trim() || videoFile.name

      await createCourseVideo({
        sub_module_id: Number(subModuleId),
        title: finalTitle,
        description: videoDescription.trim(),
        video_url: finalVideoUrl,
        duration: videoDuration,
        resolution: videoResolution.trim() || undefined,
        visibility: videoVisibility,
        display_order: Number.isFinite(videoDisplayOrder) ? videoDisplayOrder : undefined,
        status: videoStatus,
      })
      setShowAddVideoModal(false)
      setVideoTitle("")
      setVideoDescription("")
      setVideoUrl("")
      setVideoFile(null)
      setVideoFileSize(0)
      setVideoDuration(0)
      setVideoResolution("1080p")
      setVideoVisibility("PUBLISHED")
      setVideoStatus("PUBLISHED")
      setVideoDisplayOrder(1)
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

  // Preview a video card.
  // We prefer embedding directly from `video_url` because Vimeo embeds may require the `h=` hash.
  const handlePreviewVideo = async (video: SubCourseVideo) => {
    setShowPreviewModal(true)
    setPreviewLoading(true)
    setPreviewIframe("")
    setPreviewVideo(null)
    try {
      const directUrl = video.video_url?.trim()
      if (directUrl) {
        setPreviewIframe(
          `<iframe src="${directUrl}" style="width:100%;height:100%;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`,
        )
        setPreviewVideo(null)
        return
      }

      // Fallback to sample API when a direct URL is unavailable.
      const idMatch = video.video_url?.match(/(\d{5,})/)
      const vimeoId = idMatch?.[1] ?? "76979871" // fallback to Big Buck Bunny
      const res = await getVimeoSample(vimeoId)
      setPreviewIframe(res.data?.data?.iframe ?? "")
      setPreviewVideo(res.data?.data?.video ?? null)
    } catch {
      setPreviewIframe("")
    } finally {
      setPreviewLoading(false)
    }
  }

  const filteredPractices = (Array.isArray(practices) ? practices : []).filter((practice) => {
    if (statusFilter === "all") return true
    if (statusFilter === "published") return practice.status === "PUBLISHED"
    if (statusFilter === "draft") return practice.status === "DRAFT"
    if (statusFilter === "archived") return practice.status === "ARCHIVED"
    return true
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img src={spinnerSrc} alt="" className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-sm font-medium text-grayScale-500">Loading course…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img src={alertSrc} alt="" className="h-12 w-12" />
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      </div>
    )
  }

  if (!subCourse) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img src={alertSrc} alt="" className="h-12 w-12" />
        <p className="mt-3 text-sm font-medium text-grayScale-600">Sub-module not found</p>
        <p className="mt-1 text-sm text-grayScale-400">It may have been removed or the link is invalid.</p>
        <Button className="mt-6" variant="outline" asChild>
          <Link to={`/content/category/${categoryId}/courses/${courseId}/sub-modules`}>Back to sub-modules</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={`/content/category/${categoryId}/courses/${courseId}/sub-modules`}
        className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-grayScale-500 transition-all hover:bg-grayScale-50 hover:text-grayScale-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Courses
      </Link>

      {/* SubCourse Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-900">
              {subCourse?.title}
            </h1>
            {subCourse?.level && (
              <Badge className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-200">{subCourse.level}</Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-grayScale-500">
            {subCourse?.description || "No description available"}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          <Button 
            variant="outline" 
            className="border-brand-200 text-brand-600 transition-colors hover:border-brand-500 hover:bg-brand-50"
            onClick={handleAddPractice}
          >
            <FileText className="mr-2 h-4 w-4" />
            Add Practice
          </Button>
          <Button className="bg-brand-500 shadow-sm transition-colors hover:bg-brand-600" onClick={handleAddVideo}>
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-grayScale-200">
        <div className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("video")}
            className={`relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all ${
              activeTab === "video"
                ? "text-brand-600"
                : "text-grayScale-400 hover:text-grayScale-700"
            }`}
          >
            Video
            {activeTab === "video" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={`relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all ${
              activeTab === "practice"
                ? "text-brand-600"
                : "text-grayScale-400 hover:text-grayScale-700"
            }`}
          >
            Practice
            {activeTab === "practice" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("ratings")}
            className={`relative px-1 pb-3.5 pt-1 text-sm font-semibold transition-all ${
              activeTab === "ratings"
                ? "text-brand-600"
                : "text-grayScale-400 hover:text-grayScale-700"
            }`}
          >
            Ratings
            {activeTab === "ratings" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
            )}
          </button>
        </div>
      </div>



      {/* Content */}
      {activeTab === "practice" && (
        <>
          {practicesLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <SpinnerIcon className="h-8 w-8" />
              <p className="mt-4 text-sm font-medium text-grayScale-500">Loading practices…</p>
            </div>
          ) : filteredPractices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grayScale-200 bg-grayScale-50/50 py-16">
              <div className="rounded-full bg-brand-50 p-4">
                <FileText className="h-8 w-8 text-brand-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-grayScale-700">No practices yet</p>
              <p className="mt-1 text-sm text-grayScale-400">Create your first practice to get started</p>
              <Button variant="outline" className="mt-5 border-brand-200 text-brand-600 hover:bg-brand-50" onClick={handleAddPractice}>
                <Plus className="mr-2 h-4 w-4" />
                Add Practice
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPractices.map((practice) => {
                const statusConfig: Record<string, { bg: string; dot: string; text: string }> = {
                  PUBLISHED: { bg: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200", dot: "bg-green-500", text: "Published" },
                  DRAFT: { bg: "bg-grayScale-50 text-grayScale-600 ring-1 ring-inset ring-grayScale-200", dot: "bg-grayScale-400", text: "Draft" },
                  ARCHIVED: { bg: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200", dot: "bg-amber-500", text: "Archived" },
                }
                const status = statusConfig[practice.status] ?? statusConfig.DRAFT

                return (
                  <Card 
                    key={practice.id} 
                    className="group cursor-pointer overflow-hidden rounded-xl border border-grayScale-200 bg-white shadow-sm transition-all duration-200 hover:border-brand-300 hover:shadow-md hover:ring-1 hover:ring-brand-100"
                    onClick={() => handlePracticeClick(practice.id)}
                  >
                    <div className="flex h-full flex-col p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold leading-snug text-grayScale-900 line-clamp-2">{practice.title}</h3>
                        <Badge className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.bg}`}>
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.text}
                        </Badge>
                      </div>

                      <p className="text-sm leading-relaxed text-grayScale-500 line-clamp-2">{practice.description}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="rounded-full bg-[#f3e8ff] text-[#6b21a8] text-[11px] font-medium px-2.5 py-0.5 ring-1 ring-inset ring-[#d8b4fe]">
                          {practice.set_type}
                        </Badge>
                        {practice.persona && (
                          <Badge className="rounded-full bg-purple-50 text-purple-600 text-[11px] font-medium px-2.5 py-0.5 ring-1 ring-inset ring-purple-200">
                            {practice.persona}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-grayScale-400">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          <span>{String(practice.owner_type ?? "SUB_MODULE").replace(/_/g, " ")}</span>
                        </div>
                        {practice.shuffle_questions && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 ring-1 ring-inset ring-amber-200">Shuffle ON</span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-grayScale-100 pt-3">
                        <span className="text-xs font-medium text-grayScale-400">
                          {practice.created_at
                            ? new Date(practice.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : <UnassignedLabel />}
                        </span>
                        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditClick(practice)}
                            className="rounded-lg p-1.5 text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(practice)}
                            className="rounded-lg p-1.5 text-grayScale-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
            <div className="flex flex-col items-center justify-center py-20">
              <SpinnerIcon className="h-8 w-8" />
              <p className="mt-4 text-sm font-medium text-grayScale-500">Loading videos…</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grayScale-200 bg-grayScale-50/50 py-16">
              <div className="rounded-full bg-brand-50 p-4">
                <Video className="h-8 w-8 text-brand-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-grayScale-700">No videos yet</p>
              <p className="mt-1 text-sm text-grayScale-400">Upload your first video to get started</p>
              <Button variant="outline" className="mt-5 border-brand-200 text-brand-600 hover:bg-brand-50" onClick={handleAddVideo}>
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video, index) => {
                const gradients = [
                  "bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100",
                  "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100",
                  "bg-gradient-to-br from-purple-100 via-fuchsia-50 to-pink-100",
                  "bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100",
                ]
                const formatDuration = (seconds: number) => {
                  const mins = Math.floor(seconds / 60)
                  const secs = seconds % 60
                  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                }
                return (
                  <Card key={video.id} className="group overflow-hidden rounded-xl border border-grayScale-200 bg-white shadow-sm transition-all duration-200 hover:border-brand-300 hover:shadow-md hover:ring-1 hover:ring-brand-100">
                    {/* Thumbnail with duration */}
                    <div className="relative aspect-video w-full overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="h-full w-full rounded-t-xl object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center rounded-t-xl ${gradients[index % gradients.length]}`}>
                          <Video className="h-10 w-10 text-white/40" />
                        </div>
                      )}
                      <div className="absolute bottom-2.5 right-2.5 rounded-md bg-grayScale-900/75 px-2 py-0.5 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Status and menu */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            video.is_published 
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200" 
                              : "bg-grayScale-50 text-grayScale-600 ring-1 ring-inset ring-grayScale-200"
                          }`}
                        >
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${video.is_published ? "bg-green-500" : "bg-grayScale-400"}`} />
                          {video.is_published ? "PUBLISHED" : "DRAFT"}
                        </Badge>
                        <div className="relative">
                          <button 
                            onClick={() => setOpenVideoMenuId(openVideoMenuId === video.id ? null : video.id)}
                            className="rounded-lg p-1.5 text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openVideoMenuId === video.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-grayScale-200">
                              <button
                                onClick={() => {
                                  handleDeleteVideoClick(video)
                                  setOpenVideoMenuId(null)
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold leading-snug text-grayScale-900 line-clamp-2">{video.title}</h3>
                      
                      {/* Edit / Preview buttons */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 border-grayScale-200 text-grayScale-700 transition-colors hover:border-grayScale-300 hover:bg-grayScale-50"
                          onClick={() => handleEditVideoClick(video)}
                        >
                          <Edit className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-brand-200 text-brand-600 transition-colors hover:border-brand-300 hover:bg-brand-50"
                          onClick={() => handlePreviewVideo(video)}
                        >
                          <Play className="mr-1.5 h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                      
                      {/* Publish button */}
                      <Button 
                        className={`w-full shadow-sm transition-colors ${
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

      {/* Ratings Tab */}
      {activeTab === "ratings" && (
        <>
          {ratingsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <SpinnerIcon className="h-8 w-8" />
              <p className="mt-4 text-sm font-medium text-grayScale-500">Loading ratings…</p>
            </div>
          ) : ratings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-grayScale-200 bg-grayScale-50/50 py-16">
              <div className="rounded-full bg-amber-50 p-4">
                <Star className="h-8 w-8 text-amber-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-grayScale-700">No ratings yet</p>
              <p className="mt-1 text-sm text-grayScale-400">
                Ratings will appear here once learners start reviewing this course.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary bar */}
              <Card className="overflow-hidden border-grayScale-200">
                <div className="flex flex-wrap items-center gap-6 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
                    <span className="text-lg font-bold text-grayScale-800">
                      {(ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)}
                    </span>
                    <span className="text-sm text-grayScale-400">
                      / 5
                    </span>
                  </div>
                  <div className="h-5 w-px bg-grayScale-200" />
                  <span className="text-sm text-grayScale-500">
                    {ratings.length} review{ratings.length !== 1 ? "s" : ""} on this page
                  </span>
                </div>
              </Card>

              {/* Rating cards */}
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <Card
                    key={rating.id}
                    className="overflow-hidden border-grayScale-200 bg-white"
                  >
                    <div className="p-5 space-y-3">
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
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-grayScale-100 pt-4">
                <p className="text-xs text-grayScale-400">
                  Page {ratingsPage + 1}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={ratingsPage <= 0}
                    onClick={() => setRatingsPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={ratings.length < ratingsPageSize}
                    onClick={() => setRatingsPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && practiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Delete Practice</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-grayScale-900">{practiceToDelete.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2.5 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button className="bg-red-500 shadow-sm hover:bg-red-600" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Practice Modal */}
      {showEditPracticeModal && practiceToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Practice</h2>
              <button
                onClick={() => setShowEditPracticeModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter practice title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter practice description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Persona (Optional)</label>
                <Input
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="Enter persona"
                />
              </div>
              {saveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>}
            </div>
            <div className="flex flex-col-reverse gap-2.5 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
              <Button variant="outline" onClick={() => setShowEditPracticeModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 shadow-sm hover:bg-brand-600"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Add Video</h2>
              <button
                onClick={() => { setShowAddVideoModal(false); setVideoFile(null) }}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Title</label>
                <Input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Enter video description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Video File</label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoFileSelect(e.target.files?.[0] ?? null)}
                />
                {videoFile && (
                  <p className="text-xs text-grayScale-500">
                    Selected: {videoFile.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-700">File Size (bytes)</label>
                  <Input
                    type="number"
                    value={videoFileSize || ""}
                    onChange={(e) => setVideoFileSize(Number(e.target.value))}
                    placeholder="52428800"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-700">Resolution</label>
                  <Input
                    value={videoResolution}
                    onChange={(e) => setVideoResolution(e.target.value)}
                    placeholder="1080p"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-700">Display Order</label>
                  <Input
                    type="number"
                    value={videoDisplayOrder}
                    onChange={(e) => setVideoDisplayOrder(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-700">Visibility</label>
                  <select
                    value={videoVisibility}
                    onChange={(e) => setVideoVisibility(e.target.value)}
                    className="h-11 w-full rounded-lg border border-grayScale-200 bg-white px-3 text-sm text-grayScale-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="UNLISTED">UNLISTED</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-grayScale-700">Status</label>
                  <select
                    value={videoStatus}
                    onChange={(e) => setVideoStatus(e.target.value)}
                    className="h-11 w-full rounded-lg border border-grayScale-200 bg-white px-3 text-sm text-grayScale-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>
              {newVideoProgress.phase !== "idle" ? (
                <VideoUploadProgressBar
                  progress={newVideoProgress}
                  onCancel={cancelNewVideo}
                />
              ) : null}
              {saveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>}
            </div>
            <div className="flex flex-col-reverse gap-2.5 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddVideoModal(false)}
                disabled={saving || uploadingNewVideo}
              >
                Cancel
              </Button>
              <Button
                className="bg-brand-500 shadow-sm hover:bg-brand-600"
                onClick={handleSaveNewVideo}
                disabled={saving || uploadingNewVideo || !videoTitle.trim() || !videoFile}
              >
                {saving || uploadingNewVideo
                  ? newVideoProgress.message || "Uploading..."
                  : "Upload Video"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditVideoModal && videoToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Edit Video</h2>
              <button
                onClick={() => setShowEditVideoModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Title</label>
                <Input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter video title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Description</label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Enter video description"
                  className="w-full rounded-lg border border-grayScale-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-grayScale-700">Video URL</label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter video URL"
                />
              </div>
              {saveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>}
            </div>
            <div className="flex flex-col-reverse gap-2.5 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
              <Button variant="outline" onClick={() => setShowEditVideoModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-brand-500 shadow-sm hover:bg-brand-600"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Delete Video</h2>
              <button
                onClick={() => setShowDeleteVideoModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-grayScale-900">{videoToDelete.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2.5 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
              <Button variant="outline" onClick={() => setShowDeleteVideoModal(false)} disabled={deletingVideo}>
                Cancel
              </Button>
              <Button className="bg-red-500 shadow-sm hover:bg-red-600" onClick={handleConfirmDeleteVideo} disabled={deletingVideo}>
                {deletingVideo ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-grayScale-900">
                  {previewVideo?.name ?? "Video Preview"}
                </h2>
                {previewVideo && (
                  <p className="mt-0.5 text-xs text-grayScale-400">
                    {Math.floor(previewVideo.duration / 60)}:{(previewVideo.duration % 60).toString().padStart(2, "0")} • {previewVideo.width}×{previewVideo.height}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {previewLoading ? (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-grayScale-50">
                  <SpinnerIcon className="h-8 w-8" />
                </div>
              ) : previewIframe ? (
                <div
                  className="aspect-video w-full overflow-hidden rounded-xl"
                  dangerouslySetInnerHTML={{ __html: previewIframe }}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-grayScale-50">
                  <p className="text-sm text-grayScale-400">Failed to load preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
