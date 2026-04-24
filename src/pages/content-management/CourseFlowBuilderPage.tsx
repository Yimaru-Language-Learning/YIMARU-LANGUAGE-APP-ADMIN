import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Select } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"
import {
  getCourseCategories,
  getCoursesByCategory,
  getSubModulesByCourse,
  getVideosBySubModule,
  getQuestionSetsByOwner,
  reorderCategories,
  reorderCourses,
  reorderSubModules,
  reorderVideos,
  reorderPractices,
} from "../../api/courses.api"
import type {
  Course,
  CourseCategory,
  LearningPath,
  LearningPathPractice,
  LearningPathVideo,
  QuestionSet,
  ReorderItem,
} from "../../types/course.types"
import { cn } from "../../lib/utils"
import { toast } from "sonner"
import { SpinnerIcon } from "../../components/ui/spinner-icon"

type PracticeListItem = LearningPathPractice & { display_order: number }

function mapPracticeSetsToPracticeItems(sets: QuestionSet[]): PracticeListItem[] {
  return sortByDisplayOrder(
    sets
      .filter((set) => set.set_type === "PRACTICE")
      .map((set, idx) => ({
        id: set.id,
        title: set.title,
        status: set.status,
        question_count: 0,
        display_order:
          typeof (set as any).display_order === "number" ? (set as any).display_order : idx,
      })),
  )
}

function normalizeParentId(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return parsed <= 0 ? null : parsed
}

function sortByDisplayOrder<T extends { id: number }>(items: T[]) {
  return [...items].sort((a, b) => {
    const ao = typeof (a as any).display_order === "number" ? (a as any).display_order : 0
    const bo = typeof (b as any).display_order === "number" ? (b as any).display_order : 0
    if (ao === bo) return a.id - b.id
    return ao - bo
  })
}

function toReorderItems<T extends { id: number }>(items: T[]): ReorderItem[] {
  return items.map((item, index) => ({ id: Number(item.id), position: index }))
}

function SortableChip({
  id,
  label,
  active,
  onClick,
  className,
}: {
  id: number
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex min-w-[180px] items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm",
        active
          ? "border-transparent bg-brand-500 shadow-[0_8px_20px_rgba(168,85,247,0.35)]"
          : "border-grayScale-200",
        isDragging && "opacity-60 ring-2 ring-brand-300",
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors",
          active
            ? "text-white/80 hover:bg-white/15 hover:text-white"
            : "text-grayScale-300 hover:bg-grayScale-100 hover:text-grayScale-500",
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-sm font-semibold",
          active ? "text-white" : "text-grayScale-700",
        )}
      >
        {label}
      </button>
    </div>
  )
}

function SortableRow({
  id,
  children,
}: {
  id: number
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border border-grayScale-200 bg-white",
        isDragging && "opacity-60 ring-2 ring-brand-300",
      )}
    >
      <div className="flex items-center gap-2 border-b border-grayScale-100 px-2.5 py-2">
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded-md text-grayScale-300 hover:bg-grayScale-100 hover:text-grayScale-500"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] font-medium uppercase tracking-wide text-grayScale-400">Drag</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

export function CourseFlowBuilderPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [coursesByCategory, setCoursesByCategory] = useState<Record<number, Course[]>>({})
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)

  const [expandedSubCourseIds, setExpandedSubCourseIds] = useState<Set<number>>(new Set())
  const [practicesBySubCourse, setPracticesBySubCourse] = useState<Record<number, PracticeListItem[]>>(
    {},
  )
  const [videosBySubCourse, setVideosBySubCourse] = useState<Record<number, LearningPathVideo[]>>({})

  const [loading, setLoading] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingPath, setLoadingPath] = useState(false)
  const [loadingPracticesBySubCourse, setLoadingPracticesBySubCourse] = useState<Record<number, boolean>>(
    {},
  )
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const topLevelCategories = useMemo(
    () => sortByDisplayOrder(categories.filter((c) => normalizeParentId(c.parent_id as any) === null)),
    [categories],
  )

  const activeCourses = useMemo(() => {
    if (!selectedCategoryId) return []
    return coursesByCategory[selectedCategoryId] ?? []
  }, [selectedCategoryId, coursesByCategory])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getCourseCategories()
        const all = sortByDisplayOrder(res.data.data.categories ?? [])
        setCategories(all)
      } catch {
        toast.error("Failed to load course categories.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedCategoryId) return
    if (topLevelCategories.length > 0) setSelectedCategoryId(topLevelCategories[0].id)
  }, [topLevelCategories, selectedCategoryId])

  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedCourseId(null)
      return
    }
    if (coursesByCategory[selectedCategoryId]) {
      const existing = coursesByCategory[selectedCategoryId]
      if (existing.length > 0 && !existing.some((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(existing[0].id)
      } else if (existing.length === 0) {
        setSelectedCourseId(null)
      }
      return
    }
    const load = async () => {
      setLoadingCourses(true)
      try {
        const res = await getCoursesByCategory(selectedCategoryId)
        const items = sortByDisplayOrder(
          (res.data.data.courses ?? []).filter((course) => Number(course.category_id) === Number(selectedCategoryId)),
        )
        setCoursesByCategory((prev) => ({ ...prev, [selectedCategoryId]: items }))
        setSelectedCourseId(items[0]?.id ?? null)
      } catch {
        toast.error("Failed to load course sub-categories.")
      } finally {
        setLoadingCourses(false)
      }
    }
    load()
  }, [selectedCategoryId, coursesByCategory, selectedCourseId])

  useEffect(() => {
    if (!selectedCourseId) {
      setLearningPath(null)
      return
    }
    const load = async () => {
      setLoadingPath(true)
      try {
        const selectedCourse = activeCourses.find((course) => course.id === selectedCourseId)
        const subRes = await getSubModulesByCourse(selectedCourseId)
        const subCourses = sortByDisplayOrder((subRes.data.data.sub_courses ?? []) as any[]).map((sc) => ({
          id: sc.id,
          title: sc.title,
          description: sc.description ?? "",
          thumbnail: sc.thumbnail ?? "",
          display_order: sc.display_order ?? 0,
          level: sc.level ?? sc.cefr_level ?? "",
          sub_level: sc.sub_level ?? "",
          prerequisite_count: 0,
          video_count: 0,
          practice_count: 0,
          prerequisites: [],
          videos: [],
          practices: [],
        }))

        setLearningPath({
          course_id: selectedCourseId,
          course_title: selectedCourse?.title ?? "",
          description: selectedCourse?.description ?? "",
          thumbnail: selectedCourse?.thumbnail ?? "",
          intro_video_url: "",
          category_id: selectedCategoryId ?? 0,
          category_name: topLevelCategories.find((cat) => cat.id === selectedCategoryId)?.name ?? "",
          sub_courses: subCourses,
        })

        if (subCourses.length === 0) {
          setPracticesBySubCourse({})
          setVideosBySubCourse({})
          return
        }

        const [ownerResults, videoResults] = await Promise.all([
          Promise.all(
            subCourses.map(async (sc) => {
              const setsRes = await getQuestionSetsByOwner("SUB_MODULE", sc.id)
              return [sc.id, mapPracticeSetsToPracticeItems((setsRes.data.data ?? []) as QuestionSet[])] as const
            }),
          ),
          Promise.all(
            subCourses.map(async (sc) => {
              const videosRes = await getVideosBySubModule(sc.id)
              const rows = videosRes.data?.data?.videos ?? []
              const mapped = sortByDisplayOrder(
                rows.map((video: any, idx: number) => ({
                  id: Number(video.id),
                  title: String(video.title ?? "Video"),
                  display_order: Number(video.display_order ?? idx),
                  duration: Number(video.duration ?? 0),
                  video_url: String(video.video_url ?? ""),
                })),
              )
              return [sc.id, mapped] as const
            }),
          ),
        ])

        const practiceMap: Record<number, PracticeListItem[]> = {}
        ownerResults.forEach(([subCourseId, practiceItems]) => {
          practiceMap[subCourseId] = practiceItems
        })
        setPracticesBySubCourse(practiceMap)

        const videoMap: Record<number, LearningPathVideo[]> = {}
        videoResults.forEach(([subCourseId, videos]) => {
          videoMap[subCourseId] = videos
        })
        setVideosBySubCourse(videoMap)
      } catch {
        toast.error("Failed to load course flow detail.")
        setLearningPath(null)
      } finally {
        setLoadingPath(false)
      }
    }
    load()
  }, [selectedCourseId, activeCourses, selectedCategoryId, topLevelCategories])

  const loadSubCoursePracticeAndEntry = async (subCourseId: number) => {
    if (practicesBySubCourse[subCourseId] && videosBySubCourse[subCourseId]) return
    setLoadingPracticesBySubCourse((prev) => ({ ...prev, [subCourseId]: true }))
    try {
      const [setsRes, videosRes] = await Promise.allSettled([
        getQuestionSetsByOwner("SUB_MODULE", subCourseId),
        getVideosBySubModule(subCourseId),
      ])

      // No practice sets is a valid empty-state scenario; do not toast for 404/empty.
      let ownerSets: QuestionSet[] = []
      if (setsRes.status === "fulfilled") {
        ownerSets = (setsRes.value.data.data ?? []) as QuestionSet[]
      } else {
        const status = setsRes.reason?.response?.status
        if (status !== 404) {
          throw setsRes.reason
        }
      }

      setPracticesBySubCourse((prev) => ({
        ...prev,
        [subCourseId]: mapPracticeSetsToPracticeItems(ownerSets),
      }))

      const videos =
        videosRes.status === "fulfilled"
          ? sortByDisplayOrder(
              (videosRes.value.data?.data?.videos ?? []).map((video: any, idx: number) => ({
                id: Number(video.id),
                title: String(video.title ?? "Video"),
                display_order: Number(video.display_order ?? idx),
                duration: Number(video.duration ?? 0),
                video_url: String(video.video_url ?? ""),
              })),
            )
          : []
      setVideosBySubCourse((prev) => ({
        ...prev,
        [subCourseId]: videos,
      }))
    } catch {
      toast.error("Failed to load practice sets for course.")
    } finally {
      setLoadingPracticesBySubCourse((prev) => ({ ...prev, [subCourseId]: false }))
    }
  }

  const onCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const items = topLevelCategories
    if (items.length <= 1) return
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx,
    }))
    const previous = categories
    const ids = new Set(reordered.map((r) => r.id))
    setCategories((prev) => [...prev.filter((c) => !ids.has(c.id)), ...reordered])
    setSavingKey("categories")
    try {
      await reorderCategories(toReorderItems(reordered))
    } catch (err: any) {
      setCategories(previous)
      toast.error(err?.response?.data?.message || "Failed to reorder categories.")
    } finally {
      setSavingKey(null)
    }
  }

  const onCoursesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedCategoryId) return
    const items = coursesByCategory[selectedCategoryId] ?? []
    if (items.length <= 1) return
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx,
    }))
    const previous = items
    setCoursesByCategory((prev) => ({ ...prev, [selectedCategoryId]: reordered }))
    setSavingKey("courses")
    try {
      await reorderCourses(toReorderItems(reordered))
    } catch (err: any) {
      setCoursesByCategory((prev) => ({ ...prev, [selectedCategoryId]: previous }))
      toast.error(err?.response?.data?.message || "Failed to reorder courses.")
    } finally {
      setSavingKey(null)
    }
  }

  const onSubCoursesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !learningPath) return
    const items = learningPath.sub_courses ?? []
    if (items.length <= 1) return
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx,
    }))
    const previous = items
    setLearningPath((prev) => (prev ? { ...prev, sub_courses: reordered } : prev))
    setSavingKey("sub-modules")
    try {
      await reorderSubModules(toReorderItems(reordered))
    } catch (err: any) {
      setLearningPath((prev) => (prev ? { ...prev, sub_courses: previous } : prev))
      toast.error(err?.response?.data?.message || "Failed to reorder sub-modules.")
    } finally {
      setSavingKey(null)
    }
  }

  const onVideosDragEnd = async (subCourseId: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !learningPath) return
    const subCourses = learningPath.sub_courses ?? []
    const target = subCourses.find((s) => s.id === subCourseId)
    if (!target || target.videos.length <= 1) return
    const oldIndex = target.videos.findIndex((i) => i.id === Number(active.id))
    const newIndex = target.videos.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(target.videos, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx,
    })) as LearningPathVideo[]
    const previous = target.videos
    setLearningPath((prev) =>
      prev
        ? {
            ...prev,
            sub_courses: prev.sub_courses.map((sc) =>
              sc.id === subCourseId ? { ...sc, videos: reordered } : sc,
            ),
          }
        : prev,
    )
    setSavingKey(`videos-${subCourseId}`)
    try {
      await reorderVideos(toReorderItems(reordered))
    } catch (err: any) {
      setLearningPath((prev) =>
        prev
          ? {
              ...prev,
              sub_courses: prev.sub_courses.map((sc) =>
                sc.id === subCourseId ? { ...sc, videos: previous } : sc,
              ),
            }
          : prev,
      )
      toast.error(err?.response?.data?.message || "Failed to reorder videos.")
    } finally {
      setSavingKey(null)
    }
  }

  const onPracticesDragEnd = async (subCourseId: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const items = practicesBySubCourse[subCourseId] ?? []
    if (items.length <= 1) return
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx,
    }))
    const previous = items
    setPracticesBySubCourse((prev) => ({ ...prev, [subCourseId]: reordered }))
    setSavingKey(`practices-${subCourseId}`)
    try {
      await reorderPractices(toReorderItems(reordered))
    } catch (err: any) {
      setPracticesBySubCourse((prev) => ({ ...prev, [subCourseId]: previous }))
      toast.error(err?.response?.data?.message || "Failed to reorder practices.")
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <SpinnerIcon className="h-8 w-8" />
        <p className="mt-3 text-sm text-grayScale-400">Loading learning tree...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">
            Learning Tree + Sequential Access
          </h1>
          <p className="mt-1 text-sm text-grayScale-400">
            Course Category → Course Sub-category → Course (level/sub-level) → Videos/Practices
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Reload
        </Button>
      </div>

      <Card className="border border-grayScale-200 shadow-none">
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
              Active category
            </p>
            <Select
              value={selectedCategoryId ? String(selectedCategoryId) : ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null
                setSelectedCategoryId(id)
                setSelectedCourseId(null)
                setLearningPath(null)
              }}
            >
              <option value="">Choose category...</option>
              {topLevelCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
              Active course sub-category
            </p>
            <Select
              value={selectedCourseId ? String(selectedCourseId) : ""}
              onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedCategoryId || loadingCourses || activeCourses.length === 0}
            >
              <option value="">
                {loadingCourses ? "Loading course sub-categories..." : "Choose course sub-category..."}
              </option>
              {activeCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="min-w-0 shadow-soft">
          <CardHeader className="border-b border-grayScale-200 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-grayScale-600">
                Reorder categories/courses
                
              </CardTitle>
              {savingKey && (
                <span className="inline-flex items-center gap-1 text-xs text-brand-500">
                  <SpinnerIcon className="h-3.5 w-3.5" />
                  Saving...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grayScale-400">
                Categories
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoryDragEnd}>
                <SortableContext
                  items={topLevelCategories.map((item) => item.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {topLevelCategories.map((cat) => (
                      <SortableChip
                        key={cat.id}
                        id={cat.id}
                        label={cat.name}
                        active={cat.id === selectedCategoryId}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="min-w-[180px] sm:min-w-[220px]"
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grayScale-400">Course sub-categories</p>
              {loadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <SpinnerIcon className="h-5 w-5" />
                </div>
              ) : activeCourses.length === 0 ? (
                <p className="rounded-lg border border-dashed border-grayScale-200 px-3 py-6 text-center text-xs text-grayScale-400">
                  No course sub-categories under selected category.
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCoursesDragEnd}>
                  <SortableContext
                    items={activeCourses.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {activeCourses.map((course) => (
                        <SortableChip
                          key={course.id}
                          id={course.id}
                          label={course.title}
                          active={course.id === selectedCourseId}
                          onClick={() => setSelectedCourseId(course.id)}
                          className="min-w-0 w-full"
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-soft">
          <CardHeader className="border-b border-grayScale-200 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-grayScale-600">Learning path detail</CardTitle>
              {savingKey && (
                <span className="inline-flex items-center gap-1 text-xs text-brand-500">
                  <SpinnerIcon className="h-3.5 w-3.5" />
                  Saving...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {!selectedCourseId ? (
              <p className="rounded-lg border border-dashed border-grayScale-200 px-3 py-10 text-center text-xs text-grayScale-400">
                Select a course sub-category to load courses, videos and practices.
              </p>
            ) : loadingPath ? (
              <div className="flex items-center justify-center py-10">
                <SpinnerIcon className="h-6 w-6" />
              </div>
            ) : !learningPath || learningPath.sub_courses.length === 0 ? (
              <p className="rounded-lg border border-dashed border-grayScale-200 px-3 py-10 text-center text-xs text-grayScale-400">
                No courses found for this course sub-category.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSubCoursesDragEnd}>
                <SortableContext
                  items={learningPath.sub_courses.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {learningPath.sub_courses.map((subCourse) => {
                      const expanded = expandedSubCourseIds.has(subCourse.id)
                      const practices = practicesBySubCourse[subCourse.id] ?? []
                      const videos = videosBySubCourse[subCourse.id] ?? subCourse.videos ?? []
                      return (
                        <SortableRow key={subCourse.id} id={subCourse.id}>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!expanded) {
                                await loadSubCoursePracticeAndEntry(subCourse.id)
                              }
                              setExpandedSubCourseIds((prev) => {
                                const next = new Set(prev)
                                if (next.has(subCourse.id)) next.delete(subCourse.id)
                                else next.add(subCourse.id)
                                return next
                              })
                            }}
                            className="flex w-full flex-col items-start gap-2 rounded-lg border border-grayScale-100 bg-grayScale-50 px-3 py-2 text-left sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-grayScale-700">{subCourse.title}</p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-grayScale-400">
                                <span>Course</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {subCourse.level}
                                </Badge>
                                {subCourse.sub_level && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {subCourse.sub_level}
                                  </Badge>
                                )}
                                {/* entry-assessment route is no longer guaranteed across deployments */}
                              </p>
                            </div>
                            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                              <Badge variant="secondary" className="text-[10px]">
                                {videos.length} videos / {practices.length} practices
                              </Badge>
                              {expanded ? (
                                <ChevronDown className="h-4 w-4 text-grayScale-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-grayScale-400" />
                              )}
                            </div>
                          </button>

                          {expanded && (
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
                                  Videos (sequential)
                                </p>
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={(event) => onVideosDragEnd(subCourse.id, event)}
                                >
                                  <SortableContext
                                    items={videos.map((item) => item.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-1.5">
                                      {videos.length === 0 ? (
                                        <p className="rounded-lg border border-dashed border-grayScale-200 px-2 py-2 text-[11px] text-grayScale-400">
                                          No videos
                                        </p>
                                      ) : (
                                        videos.map((video) => (
                                          <SortableChip
                                            key={video.id}
                                            id={video.id}
                                            label={video.title}
                                            className="min-w-0 w-full"
                                          />
                                        ))
                                      )}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              </div>

                              <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
                                  Practices (set_type=PRACTICE)
                                </p>
                                {loadingPracticesBySubCourse[subCourse.id] ? (
                                  <div className="flex items-center gap-2 py-6 text-xs text-grayScale-400">
                                    <SpinnerIcon className="h-3.5 w-3.5" />
                                    Loading sets...
                                  </div>
                                ) : (
                                  <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(event) => onPracticesDragEnd(subCourse.id, event)}
                                  >
                                    <SortableContext
                                      items={practices.map((item) => item.id)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      <div className="space-y-1.5">
                                        {practices.length === 0 ? (
                                          <p className="rounded-lg border border-dashed border-grayScale-200 px-2 py-2 text-[11px] text-grayScale-400">
                                            No practices
                                          </p>
                                        ) : (
                                          practices.map((practice) => (
                                            <SortableChip
                                              key={practice.id}
                                              id={practice.id}
                                              label={practice.title}
                                              className="min-w-0 w-full"
                                            />
                                          ))
                                        )}
                                      </div>
                                    </SortableContext>
                                  </DndContext>
                                )}
                              </div>
                            </div>
                          )}
                        </SortableRow>
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-dashed border-grayScale-200 bg-grayScale-50/60 shadow-none">
        <CardContent className="space-y-1.5 p-4 text-xs text-grayScale-500">
          <p className="inline-flex items-center gap-1 font-semibold text-grayScale-600">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Integration notes
          </p>
          <p>
            Reorder payload is strict: <code>{"{ items: [{ id, position }] }"}</code> with
            0-based full sibling lists.
          </p>
          <p>
            Practices load from <code>/question-sets/by-owner</code> filtered by
            <code> set_type=PRACTICE</code> and <code>owner_type=SUB_MODULE</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
