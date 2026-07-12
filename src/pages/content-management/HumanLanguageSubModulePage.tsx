import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BookOpen, Eye, FileText, Plus, Search, Trophy, Video } from "lucide-react"
import { toast } from "sonner"
import { Card } from "../../components/ui/card"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { Textarea } from "../../components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { cn } from "../../lib/utils"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import {
  getLessonsBySubModule,
  getQuestionSetsByOwner,
  getSubModuleLessonById,
  resolveSubModuleForCourse,
  getVideosBySubModule,
  softDeleteSubModuleLesson,
  updateSubModuleLesson,
} from "../../api/courses.api"
import type {
  QuestionSet,
  QuestionSetStatus,
  SubCourse,
  SubCourseVideo,
  SubModuleLesson,
  SubModuleLessonDetail,
} from "../../types/course.types"

type ContentTab = "lessons" | "practices" | "capstones" | "videos"

function formatTableDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatVideoDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`
}

function getRelativeTime(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatTableDate(dateStr)
}

function normalizeSetType(set: QuestionSet) {
  return String(set.set_type ?? "").toUpperCase()
}

function partitionSets(sets: QuestionSet[]) {
  const practices: QuestionSet[] = []
  const capstones: QuestionSet[] = []
  for (const s of sets) {
    const t = normalizeSetType(s)
    if (t === "PRACTICE") practices.push(s)
    else capstones.push(s)
  }
  return { practices, capstones }
}

type LessonActiveFilter = "all" | "active" | "inactive"

function textMatchesQuery(text: string | null | undefined, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return (text ?? "").toLowerCase().includes(needle)
}

function filterQuestionSets(items: QuestionSet[], search: string, statusFilter: "all" | QuestionSetStatus) {
  return items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false
    const needle = search.trim()
    if (!needle) return true
    return textMatchesQuery(item.title, needle) || textMatchesQuery(item.description, needle)
  })
}

function filterLessons(items: SubModuleLesson[], search: string, activeFilter: LessonActiveFilter) {
  return items.filter((lesson) => {
    if (activeFilter === "active" && !lesson.is_active) return false
    if (activeFilter === "inactive" && lesson.is_active) return false
    const needle = search.trim()
    if (!needle) return true
    return textMatchesQuery(lesson.title, needle) || textMatchesQuery(lesson.description, needle)
  })
}

function lessonStatusBadge(isActive: boolean) {
  return isActive ? (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-grayScale-200 bg-grayScale-100 px-2.5 py-0.5 text-xs font-medium text-grayScale-600">
      Inactive
    </span>
  )
}

export function HumanLanguageSubModulePage() {
  const { categoryId, courseId, subModuleId } = useParams<{
    categoryId: string
    courseId: string
    subModuleId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isHumanLanguageRoute = location.pathname.includes("/content/human-language/")

  const [subCourse, setSubCourse] = useState<SubCourse | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<ContentTab>("practices")
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [setsLoading, setSetsLoading] = useState(false)
  const [lessons, setLessons] = useState<SubModuleLesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonDetailOpen, setLessonDetailOpen] = useState(false)
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false)
  const [lessonDetail, setLessonDetail] = useState<SubModuleLessonDetail | null>(null)
  const [lessonEditMode, setLessonEditMode] = useState(false)
  const [lessonUpdateSaving, setLessonUpdateSaving] = useState(false)
  const [lessonSoftDeleteSaving, setLessonSoftDeleteSaving] = useState(false)
  const [lessonSoftDeleteConfirmOpen, setLessonSoftDeleteConfirmOpen] = useState(false)
  const [editLessonTitle, setEditLessonTitle] = useState("")
  const [editLessonDescription, setEditLessonDescription] = useState("")
  const [editLessonThumbnail, setEditLessonThumbnail] = useState("")
  const [editLessonTeachingText, setEditLessonTeachingText] = useState("")
  const [editLessonTeachingImageUrl, setEditLessonTeachingImageUrl] = useState("")
  const [editLessonTeachingAudioUrl, setEditLessonTeachingAudioUrl] = useState("")
  const [editLessonTeachingVideoUrl, setEditLessonTeachingVideoUrl] = useState("")
  const [editLessonDisplayOrder, setEditLessonDisplayOrder] = useState(0)
  const [editLessonIsActive, setEditLessonIsActive] = useState(true)
  const [videos, setVideos] = useState<SubCourseVideo[]>([])
  const [videosLoading, setVideosLoading] = useState(false)

  const [practiceSearch, setPracticeSearch] = useState("")
  const [practiceStatusFilter, setPracticeStatusFilter] = useState<"all" | QuestionSetStatus>("all")
  const [capstoneSearch, setCapstoneSearch] = useState("")
  const [capstoneStatusFilter, setCapstoneStatusFilter] = useState<"all" | QuestionSetStatus>("all")
  const [lessonSearch, setLessonSearch] = useState("")
  const [lessonActiveFilter, setLessonActiveFilter] = useState<LessonActiveFilter>("all")

  const numericCourseId = Number(courseId)
  const numericSubModuleId = Number(subModuleId)

  useEffect(() => {
    const run = async () => {
      if (!subModuleId || !courseId || Number.isNaN(numericCourseId) || Number.isNaN(numericSubModuleId)) {
        setMetaError("Invalid route parameters")
        setLoadingMeta(false)
        return
      }
      setLoadingMeta(true)
      setMetaError(null)
      try {
        const found =
          (await resolveSubModuleForCourse(numericCourseId, numericSubModuleId)) ?? null
        setSubCourse(found)
        if (!found) setMetaError("Sub-module not found for this course")
      } catch (e) {
        console.error(e)
        setMetaError("Failed to load sub-module")
        setSubCourse(null)
        notifyApiError(e, "Failed to load sub-module")
      } finally {
        setLoadingMeta(false)
      }
    }
    void run()
  }, [subModuleId, courseId, numericCourseId, numericSubModuleId])

  const fetchSets = useCallback(async () => {
    if (!subModuleId || Number.isNaN(numericSubModuleId)) return
    setSetsLoading(true)
    try {
      const res = await getQuestionSetsByOwner("SUB_MODULE", numericSubModuleId)
      const raw = res.data?.data
      const list = Array.isArray(raw) ? raw : (raw as { question_sets?: QuestionSet[] })?.question_sets ?? []
      setSets(list)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load question sets")
      setSets([])
    } finally {
      setSetsLoading(false)
    }
  }, [subModuleId, numericSubModuleId])

  const fetchVideos = useCallback(async () => {
    if (!subModuleId || Number.isNaN(numericSubModuleId)) return
    setVideosLoading(true)
    try {
      const res = await getVideosBySubModule(numericSubModuleId)
      setVideos(res.data?.data?.videos ?? [])
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load videos")
      setVideos([])
    } finally {
      setVideosLoading(false)
    }
  }, [subModuleId, numericSubModuleId])

  const fetchLessons = useCallback(async () => {
    if (!subModuleId || Number.isNaN(numericSubModuleId)) return
    setLessonsLoading(true)
    try {
      const res = await getLessonsBySubModule(numericSubModuleId, { includeInactive: true })
      const list = Array.isArray(res.data?.data) ? res.data.data : []
      setLessons(list)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load lessons")
      setLessons([])
    } finally {
      setLessonsLoading(false)
    }
  }, [subModuleId, numericSubModuleId])

  const openLessonDetail = useCallback(async (lessonId: number) => {
    setLessonDetailOpen(true)
    setLessonDetailLoading(true)
    setLessonEditMode(false)
    setLessonDetail(null)
    try {
      const res = await getSubModuleLessonById(lessonId)
      setLessonDetail(res.data?.data ?? null)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load lesson detail")
    } finally {
      setLessonDetailLoading(false)
    }
  }, [])

  const startEditLesson = () => {
    if (!lessonDetail) return
    setEditLessonTitle(lessonDetail.title ?? "")
    setEditLessonDescription(lessonDetail.description ?? "")
    setEditLessonThumbnail(lessonDetail.thumbnail ?? "")
    setEditLessonTeachingText(lessonDetail.teaching_text ?? "")
    setEditLessonTeachingImageUrl(lessonDetail.teaching_image_url ?? "")
    setEditLessonTeachingAudioUrl(lessonDetail.teaching_audio_url ?? "")
    setEditLessonTeachingVideoUrl(lessonDetail.teaching_video_url ?? "")
    setEditLessonDisplayOrder(lessonDetail.display_order ?? 0)
    setEditLessonIsActive(lessonDetail.is_active)
    setLessonEditMode(true)
  }

  const handleUpdateLesson = async () => {
    if (!lessonDetail) return
    const title = editLessonTitle.trim()
    if (!title) {
      toast.error("Lesson title is required")
      return
    }

    setLessonUpdateSaving(true)
    try {
      const response = await updateSubModuleLesson(lessonDetail.id, {
        title,
        description: editLessonDescription.trim() || null,
        thumbnail: editLessonThumbnail.trim() || null,
        teaching_text: editLessonTeachingText.trim() || null,
        teaching_image_url: editLessonTeachingImageUrl.trim() || null,
        teaching_audio_url: editLessonTeachingAudioUrl.trim() || null,
        teaching_video_url: editLessonTeachingVideoUrl.trim() || null,
        display_order: Math.max(0, Number(editLessonDisplayOrder) || 0),
        is_active: editLessonIsActive,
      })

      setLessonDetail(response.data?.data ?? null)
      setLessonEditMode(false)
      toast.success("Lesson updated")
      await fetchLessons()
    } catch (error) {
      console.error(error)
      notifyApiError(error, "Failed to update lesson")
    } finally {
      setLessonUpdateSaving(false)
    }
  }

  const handleSoftDeleteLesson = async () => {
    if (!lessonDetail || lessonSoftDeleteSaving) return

    setLessonSoftDeleteSaving(true)
    try {
      const response = await softDeleteSubModuleLesson(lessonDetail.id)
      setLessonDetail(response.data?.data ?? { ...lessonDetail, is_active: false })
      setLessonEditMode(false)
      setLessonSoftDeleteConfirmOpen(false)
      toast.success("Lesson soft deleted")
      await fetchLessons()
    } catch (error) {
      console.error(error)
      notifyApiError(error, "Failed to soft delete lesson")
    } finally {
      setLessonSoftDeleteSaving(false)
    }
  }

  useEffect(() => {
    void fetchSets()
  }, [fetchSets])

  useEffect(() => {
    if (activeTab === "lessons") void fetchLessons()
  }, [activeTab, fetchLessons])

  useEffect(() => {
    if (activeTab === "videos") void fetchVideos()
  }, [activeTab, fetchVideos])

  const { practices, capstones } = useMemo(() => partitionSets(sets), [sets])

  const filteredPractices = useMemo(
    () => filterQuestionSets(practices, practiceSearch, practiceStatusFilter),
    [practices, practiceSearch, practiceStatusFilter],
  )
  const filteredCapstones = useMemo(
    () => filterQuestionSets(capstones, capstoneSearch, capstoneStatusFilter),
    [capstones, capstoneSearch, capstoneStatusFilter],
  )
  const filteredLessons = useMemo(
    () => filterLessons(lessons, lessonSearch, lessonActiveFilter),
    [lessons, lessonSearch, lessonActiveFilter],
  )

  const practiceActiveFilterCount = countActiveFilters([
    { value: practiceStatusFilter, defaultValue: "all" },
  ])
  const lessonActiveFilterCount = countActiveFilters([
    { value: lessonActiveFilter, defaultValue: "all" },
  ])
  const capstoneActiveFilterCount = countActiveFilters([
    { value: capstoneStatusFilter, defaultValue: "all" },
  ])

  const subModuleLabel = useMemo(() => {
    const rawTitle = subCourse?.title?.trim()
    if (!rawTitle) return "Sub-module"

    const cleaned = rawTitle.replace(/^module\s*[-:]?\s*/i, "")
    const numericMatch = cleaned.match(/\d+(?:\.\d+)+|\d+/)
    if (!numericMatch) return "Sub-module"

    return `Sub-module ${numericMatch[0]}`
  }, [subCourse?.title])

  const basePath = isHumanLanguageRoute
    ? `/content/human-language/${categoryId}/${courseId}/sub-module/${subModuleId}`
    : `/content/category/${categoryId}/courses/${courseId}/sub-modules/${subModuleId}`

  const courseStructurePath = `/content/category/${categoryId}/courses/${courseId}/sub-modules`
  const backHref = isHumanLanguageRoute ? "/content/human-language" : courseStructurePath
  const backLabel = isHumanLanguageRoute ? "Back to Human Language" : "Back to course structure"

  const goQuestions = (questionSetId: number) => {
    navigate(`${basePath}/practices/${questionSetId}/questions`)
  }

  const questionSetStatusBadge = (status: string) => {
    const cfg: Record<string, { cls: string; label: string }> = {
      PUBLISHED: { cls: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Published" },
      DRAFT: { cls: "border-grayScale-200 bg-grayScale-100 text-grayScale-600", label: "Draft" },
      ARCHIVED: { cls: "border-amber-200 bg-amber-50 text-amber-800", label: "Archived" },
    }
    const c = cfg[status] ?? cfg.DRAFT
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
          c.cls,
        )}
      >
        {c.label}
      </span>
    )
  }

  const setTypeBadge = (set: QuestionSet) => (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        normalizeSetType(set) === "PRACTICE"
          ? "border-violet-200 bg-violet-50 text-violet-800"
          : "border-blue-200 bg-blue-50 text-blue-800",
      )}
    >
      {normalizeSetType(set)}
    </span>
  )

  const renderQuestionSetTable = (
    filtered: QuestionSet[],
    source: QuestionSet[],
    emptyLabel: string,
    addHref: string,
    addLabel: string,
    noMatchLabel: string,
  ) => {
    const colCount = 8

    if (setsLoading) {
      return (
        <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TITLE</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="min-w-[200px]">DESCRIPTION</TableHead>
                <TableHead className="hidden lg:table-cell">PERSONA</TableHead>
                <TableHead className="hidden md:table-cell">SHUFFLE</TableHead>
                <TableHead className="hidden sm:table-cell">CREATED</TableHead>
                <TableHead className="text-right">DETAILS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <SpinnerIcon className="h-8 w-8" />
                    <span className="text-sm text-grayScale-400">Loading question sets…</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }

    if (source.length === 0) {
      return (
        <div className="rounded-xl border bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-grayScale-700">{emptyLabel}</p>
          <Button type="button" variant="outline" className="mt-4" asChild>
            <Link to={addHref}>{addLabel}</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TITLE</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="min-w-[200px]">DESCRIPTION</TableHead>
              <TableHead className="hidden lg:table-cell">PERSONA</TableHead>
              <TableHead className="hidden md:table-cell">SHUFFLE</TableHead>
              <TableHead className="hidden sm:table-cell">CREATED</TableHead>
              <TableHead className="text-right">DETAILS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-8 w-8 text-grayScale-200" />
                    <div>
                      <p className="text-sm font-medium text-grayScale-500">{noMatchLabel}</p>
                      <p className="mt-1 text-xs text-grayScale-400">Try adjusting search or status.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => goQuestions(item.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault()
                      goQuestions(item.id)
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-grayScale-50 text-grayScale-400 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-grayScale-600 truncate">{item.title}</p>
                        <p className="text-xs text-grayScale-400">#{item.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{setTypeBadge(item)}</TableCell>
                  <TableCell>{questionSetStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <p className="max-w-[280px] truncate text-sm text-grayScale-600">
                      {item.description?.trim() ? item.description : "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="max-w-[140px] truncate text-sm text-grayScale-600">
                      {item.persona?.trim() ? item.persona : "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-grayScale-600">{item.shuffle_questions ? "Yes" : "No"}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div>
                      <p className="text-sm text-grayScale-600">{formatTableDate(item.created_at)}</p>
                      <p className="text-xs text-grayScale-400">{getRelativeTime(item.created_at)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        goQuestions(item.id)
                      }}
                      aria-label="Open questions"
                    >
                      <Eye className="h-4 w-4 text-grayScale-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderLessonsTable = (filtered: SubModuleLesson[], source: SubModuleLesson[]) => {
    const colCount = 7
    const sorted = filtered.slice().sort((a, b) => a.display_order - b.display_order || a.id - b.id)

    if (lessonsLoading) {
      return (
        <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LESSON</TableHead>
                <TableHead className="hidden sm:table-cell">ORDER</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="min-w-[200px]">DESCRIPTION</TableHead>
                <TableHead className="hidden lg:table-cell">THUMBNAIL</TableHead>
                <TableHead className="hidden md:table-cell">CREATED</TableHead>
                <TableHead className="text-right">DETAILS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <SpinnerIcon className="h-8 w-8" />
                    <span className="text-sm text-grayScale-400">Loading lessons…</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }

    if (source.length === 0) {
      return (
        <div className="rounded-xl border bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-grayScale-700">No lessons yet</p>
          <Button type="button" variant="outline" className="mt-4" asChild>
            <Link to={`${basePath}/add-lesson`}>Create a lesson</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>LESSON</TableHead>
              <TableHead className="hidden sm:table-cell">ORDER</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="min-w-[200px]">DESCRIPTION</TableHead>
              <TableHead className="hidden lg:table-cell">THUMBNAIL</TableHead>
              <TableHead className="hidden md:table-cell">CREATED</TableHead>
              <TableHead className="text-right">DETAILS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="h-8 w-8 text-grayScale-200" />
                    <div>
                      <p className="text-sm font-medium text-grayScale-500">
                        No lessons match your search or status filter.
                      </p>
                      <p className="mt-1 text-xs text-grayScale-400">Try adjusting search or status.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((lesson) => (
                <TableRow
                  key={lesson.id}
                  className="group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => void openLessonDetail(lesson.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault()
                      void openLessonDetail(lesson.id)
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-grayScale-50 text-grayScale-400 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-grayScale-600 truncate">{lesson.title}</p>
                        <p className="text-xs text-grayScale-400">#{lesson.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm tabular-nums text-grayScale-600">{lesson.display_order}</span>
                  </TableCell>
                  <TableCell>{lessonStatusBadge(lesson.is_active)}</TableCell>
                  <TableCell>
                    <p className="max-w-[280px] truncate text-sm text-grayScale-600">
                      {lesson.description?.trim() ? lesson.description : "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {lesson.thumbnail?.trim() ? (
                      <span className="text-sm text-grayScale-600">Yes</span>
                    ) : (
                      <span className="text-sm text-grayScale-400">None</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <p className="text-sm text-grayScale-600">{formatTableDate(lesson.created_at)}</p>
                      <p className="text-xs text-grayScale-400">{getRelativeTime(lesson.created_at)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        void openLessonDetail(lesson.id)
                      }}
                      aria-label="Lesson detail"
                    >
                      <Eye className="h-4 w-4 text-grayScale-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (loadingMeta) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <SpinnerIcon className="h-10 w-10" />
        <p className="mt-4 text-sm text-grayScale-500">Loading sub-module…</p>
      </div>
    )
  }

  if (metaError && !subCourse) {
    return (
      <div className="space-y-6">
        <Link
          to={backHref}
          className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-grayScale-500 transition-all hover:bg-grayScale-50 hover:text-grayScale-900"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {backLabel}
        </Link>
        <Card className="border border-red-100 bg-red-50/50 p-6">
          <p className="text-sm font-medium text-red-800">{metaError}</p>
          <Button type="button" variant="outline" className="mt-4" asChild>
            <Link to={backHref}>Return</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <Link
        to={backHref}
        className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-grayScale-500 transition-all hover:bg-grayScale-50 hover:text-grayScale-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        {backLabel}
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-900">{subModuleLabel}</h1>
            {subCourse?.cefr_level || subCourse?.level ? (
              <Badge variant="secondary">{subCourse.cefr_level ?? subCourse.level}</Badge>
            ) : null}
          </div>
          <p className="max-w-2xl text-sm text-grayScale-500">
            Practices come from question sets (`PRACTICE`) and intro videos are listed separately as
            sub-module-level media.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to={`${basePath}/add-practice`}>
              <Plus className="mr-2 h-4 w-4" />
              Add practice
            </Link>
          </Button>
          <Button className="bg-brand-500 hover:bg-brand-600" asChild>
            <Link to={`${basePath}/add-lesson`}>
              <Plus className="mr-2 h-4 w-4" />
              Add lesson
            </Link>
          </Button>
        </div>
      </div>

      <div className="border-b border-grayScale-200">
        <div className="-mb-px flex flex-wrap gap-4">
          {(
            [
              ["practices", "Practices", FileText],
              ["lessons", "Lessons", BookOpen],
              ["capstones", "Capstones", Trophy],
              ["videos", "Intro videos", Video],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors ${
                activeTab === id ? "text-brand-600" : "text-grayScale-400 hover:text-grayScale-700"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              {activeTab === id ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "practices" ? (
        <div className="space-y-4">
          <AdminFiltersPanel
            activeFilterCount={practiceActiveFilterCount}
            onClearFilters={() => setPracticeStatusFilter("all")}
            search={
              <div className="relative min-w-[200px] w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  className="pl-9"
                  placeholder="Search by title or description…"
                  value={practiceSearch}
                  onChange={(e) => setPracticeSearch(e.target.value)}
                  aria-label="Search practices"
                />
              </div>
            }
          >
            <Select
              className="w-full sm:w-48"
              value={practiceStatusFilter}
              onChange={(e) => setPracticeStatusFilter(e.target.value as "all" | QuestionSetStatus)}
              aria-label="Filter practices by status"
            >
              <option value="all">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </AdminFiltersPanel>
          {renderQuestionSetTable(
            filteredPractices,
            practices,
            "No practices yet",
            `${basePath}/add-practice`,
            "Create a practice",
            "No practices match your search or status filter.",
          )}
        </div>
      ) : null}

      {activeTab === "lessons" ? (
        <div className="space-y-4">
          <AdminFiltersPanel
            activeFilterCount={lessonActiveFilterCount}
            onClearFilters={() => setLessonActiveFilter("all")}
            search={
              <div className="relative min-w-[200px] w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  className="pl-9"
                  placeholder="Search by title or description…"
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  aria-label="Search lessons"
                />
              </div>
            }
          >
            <Select
              className="w-full sm:w-48"
              value={lessonActiveFilter}
              onChange={(e) => setLessonActiveFilter(e.target.value as LessonActiveFilter)}
              aria-label="Filter lessons by status"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </AdminFiltersPanel>
          {renderLessonsTable(filteredLessons, lessons)}
        </div>
      ) : null}

      {activeTab === "capstones" ? (
        <div className="space-y-4">
          <AdminFiltersPanel
            activeFilterCount={capstoneActiveFilterCount}
            onClearFilters={() => setCapstoneStatusFilter("all")}
            search={
              <div className="relative min-w-[200px] w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  className="pl-9"
                  placeholder="Search by title or description…"
                  value={capstoneSearch}
                  onChange={(e) => setCapstoneSearch(e.target.value)}
                  aria-label="Search capstones"
                />
              </div>
            }
          >
            <Select
              className="w-full sm:w-48"
              value={capstoneStatusFilter}
              onChange={(e) => setCapstoneStatusFilter(e.target.value as "all" | QuestionSetStatus)}
              aria-label="Filter capstones by status"
            >
              <option value="all">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </AdminFiltersPanel>
          {renderQuestionSetTable(
            filteredCapstones,
            capstones,
            "No capstone-style sets yet (e.g. EXAM). Add content via your usual authoring flow or API.",
            `${basePath}/add-practice`,
            "Add question set (practice flow)",
            "No capstones match your search or status filter.",
          )}
        </div>
      ) : null}

      {activeTab === "videos" ? (
        videosLoading ? (
          <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TITLE</TableHead>
                  <TableHead className="min-w-[200px]">DESCRIPTION</TableHead>
                  <TableHead className="hidden sm:table-cell">DURATION</TableHead>
                  <TableHead className="hidden md:table-cell">PUBLISHED</TableHead>
                  <TableHead className="hidden md:table-cell">ACTIVE</TableHead>
                  <TableHead className="hidden lg:table-cell">THUMBNAIL</TableHead>
                  <TableHead className="text-right">LINK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <SpinnerIcon className="h-8 w-8" />
                      <span className="text-sm text-grayScale-400">Loading videos…</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-xl border bg-white px-6 py-14 text-center text-sm text-grayScale-600">
            No intro videos on this sub-module yet.
          </div>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TITLE</TableHead>
                  <TableHead className="min-w-[200px]">DESCRIPTION</TableHead>
                  <TableHead className="hidden sm:table-cell">DURATION</TableHead>
                  <TableHead className="hidden md:table-cell">PUBLISHED</TableHead>
                  <TableHead className="hidden md:table-cell">ACTIVE</TableHead>
                  <TableHead className="hidden lg:table-cell">THUMBNAIL</TableHead>
                  <TableHead className="text-right">LINK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((v) => (
                  <TableRow key={v.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-grayScale-50 text-grayScale-400 group-hover:bg-brand-500 group-hover:text-white">
                          <Video className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-grayScale-600 truncate">{v.title}</p>
                          <p className="text-xs text-grayScale-400">#{v.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[280px] truncate text-sm text-grayScale-600">
                        {v.description?.trim() ? v.description : "—"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-grayScale-600">{formatVideoDuration(v.duration)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          v.is_published
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-grayScale-200 bg-grayScale-100 text-grayScale-600",
                        )}
                      >
                        {v.is_published ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          v.is_active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-grayScale-200 bg-grayScale-100 text-grayScale-600",
                        )}
                      >
                        {v.is_active ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {v.thumbnail?.trim() ? (
                        <span className="text-sm text-grayScale-600">Yes</span>
                      ) : (
                        <span className="text-sm text-grayScale-400">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.video_url ? (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" asChild>
                          <a href={v.video_url} target="_blank" rel="noreferrer">
                            <Eye className="h-4 w-4 text-grayScale-400" />
                            <span className="text-xs text-brand-600">Open</span>
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-grayScale-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : null}

      <Dialog
        open={lessonDetailOpen}
        onOpenChange={(open) => {
          if (lessonUpdateSaving || lessonSoftDeleteSaving) return
          setLessonDetailOpen(open)
          if (!open) {
            setLessonDetail(null)
            setLessonEditMode(false)
            setLessonSoftDeleteConfirmOpen(false)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lesson detail</DialogTitle>
            <DialogDescription>
              View and edit lesson details.
            </DialogDescription>
          </DialogHeader>

          {lessonDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <SpinnerIcon className="h-8 w-8" />
              <p className="mt-3 text-sm text-grayScale-500">Loading lesson detail…</p>
            </div>
          ) : !lessonDetail ? (
            <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/50 p-6 text-sm text-grayScale-600">
              Lesson detail unavailable.
            </div>
          ) : lessonEditMode ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Title</label>
                <Input
                  value={editLessonTitle}
                  onChange={(event) => setEditLessonTitle(event.target.value)}
                  placeholder="Lesson title"
                  disabled={lessonUpdateSaving}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Description</label>
                <Textarea
                  rows={4}
                  value={editLessonDescription}
                  onChange={(event) => setEditLessonDescription(event.target.value)}
                  placeholder="Short intro lesson"
                  disabled={lessonUpdateSaving}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Thumbnail URL</label>
                <Input
                  value={editLessonThumbnail}
                  onChange={(event) => setEditLessonThumbnail(event.target.value)}
                  placeholder="https://cdn.example.com/thumb.jpg"
                  disabled={lessonUpdateSaving}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Teaching text</label>
                <Textarea
                  rows={4}
                  value={editLessonTeachingText}
                  onChange={(event) => setEditLessonTeachingText(event.target.value)}
                  placeholder="Hello and welcome."
                  disabled={lessonUpdateSaving}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Teaching image URL</label>
                  <Input
                    value={editLessonTeachingImageUrl}
                    onChange={(event) => setEditLessonTeachingImageUrl(event.target.value)}
                    placeholder="https://cdn.example.com/lesson-image.jpg"
                    disabled={lessonUpdateSaving}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Teaching audio URL</label>
                  <Input
                    value={editLessonTeachingAudioUrl}
                    onChange={(event) => setEditLessonTeachingAudioUrl(event.target.value)}
                    placeholder="https://cdn.example.com/lesson-audio.mp3"
                    disabled={lessonUpdateSaving}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Teaching video URL</label>
                <Input
                  value={editLessonTeachingVideoUrl}
                  onChange={(event) => setEditLessonTeachingVideoUrl(event.target.value)}
                  placeholder="https://cdn.example.com/lesson.mp4"
                  disabled={lessonUpdateSaving}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Display order</label>
                  <Input
                    type="number"
                    min={0}
                    value={editLessonDisplayOrder}
                    onChange={(event) => setEditLessonDisplayOrder(Math.max(0, Number(event.target.value) || 0))}
                    disabled={lessonUpdateSaving}
                  />
                </div>
                <label className="flex items-end gap-2 pb-1 text-sm font-medium text-grayScale-600">
                  <input
                    type="checkbox"
                    checked={editLessonIsActive}
                    onChange={(event) => setEditLessonIsActive(event.target.checked)}
                    disabled={lessonUpdateSaving}
                    className="h-4 w-4 rounded border-grayScale-300"
                  />
                  Active lesson
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={lessonUpdateSaving || lessonSoftDeleteSaving}
                  onClick={() => setLessonEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-brand-500 hover:bg-brand-600"
                  disabled={lessonUpdateSaving || lessonSoftDeleteSaving}
                  onClick={() => void handleUpdateLesson()}
                >
                  {lessonUpdateSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={lessonSoftDeleteSaving}
                  onClick={startEditLesson}
                >
                  Edit lesson
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2 text-red-600"
                  disabled={lessonSoftDeleteSaving || !lessonDetail.is_active}
                  onClick={() => setLessonSoftDeleteConfirmOpen(true)}
                >
                  {lessonSoftDeleteSaving ? "Deleting..." : "Soft delete"}
                </Button>
              </div>

              {lessonDetail.thumbnail ? (
                <img
                  src={lessonDetail.thumbnail}
                  alt={lessonDetail.title}
                  className="h-48 w-full rounded-lg object-cover ring-1 ring-grayScale-200"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-violet-50 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
                  Default thumbnail
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-semibold text-grayScale-900">{lessonDetail.title}</h3>
                  {lessonStatusBadge(lessonDetail.is_active)}
                </div>
                <p className="text-xs text-grayScale-400">{new Date(lessonDetail.created_at).toLocaleString()}</p>
              </div>

              {lessonDetail.description ? (
                <div className="rounded-lg border border-grayScale-200 bg-grayScale-50/40 p-3 text-sm leading-relaxed text-grayScale-700 whitespace-pre-wrap">
                  {lessonDetail.description}
                </div>
              ) : null}

              {lessonDetail.teaching_text ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grayScale-500">Teaching text</p>
                  <div className="rounded-lg border border-grayScale-200 p-3 text-sm leading-relaxed text-grayScale-700 whitespace-pre-wrap">
                    {lessonDetail.teaching_text}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-3">
                {lessonDetail.teaching_image_url ? (
                  <a
                    href={lessonDetail.teaching_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-grayScale-200 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50"
                  >
                    Open teaching image
                  </a>
                ) : null}
                {lessonDetail.teaching_audio_url ? (
                  <a
                    href={lessonDetail.teaching_audio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-grayScale-200 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50"
                  >
                    Open teaching audio
                  </a>
                ) : null}
              </div>

              {lessonDetail.teaching_video_url ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">Teaching video</p>
                  <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-black ring-1 ring-inset ring-grayScale-200">
                    <iframe
                      src={lessonDetail.teaching_video_url}
                      title={`${lessonDetail.title} teaching video`}
                      className="aspect-video w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={lessonSoftDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (lessonSoftDeleteSaving) return
          setLessonSoftDeleteConfirmOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Soft delete lesson?</DialogTitle>
            <DialogDescription>
              This will deactivate <span className="font-medium text-grayScale-700">{lessonDetail?.title ?? "this lesson"}</span>.
              You can reactivate it later by setting status back to active.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-grayScale-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={lessonSoftDeleteSaving}
              onClick={() => setLessonSoftDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              disabled={lessonSoftDeleteSaving}
              onClick={() => void handleSoftDeleteLesson()}
            >
              {lessonSoftDeleteSaving ? "Deactivating..." : "Confirm soft delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
