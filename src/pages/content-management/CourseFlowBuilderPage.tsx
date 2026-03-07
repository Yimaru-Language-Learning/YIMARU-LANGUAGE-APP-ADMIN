import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  ChevronDown,
  GripVertical,
  Loader2,
  RefreshCw,
  Video,
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
  getSubCoursesByCourse,
  getVideosBySubCourse,
  getQuestionSetsByOwner,
  reorderCourses,
  reorderSubCourses,
  reorderVideos,
  reorderPractices,
} from "../../api/courses.api"
import type {
  Course,
  CourseCategory,
  Practice,
  QuestionSet,
  ReorderItem,
  SubCourse,
  SubCourseVideo,
} from "../../types/course.types"
import { cn } from "../../lib/utils"
import { toast } from "sonner"

type VideoNode = SubCourseVideo & { display_order?: number }
type PracticeNode = Practice & { display_order?: number }

function normalizeParentId(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return parsed <= 0 ? null : parsed
}

function sortByDisplayOrder<T extends { id: number }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aOrder = typeof (a as any).display_order === "number" ? (a as any).display_order : 0
    const bOrder = typeof (b as any).display_order === "number" ? (b as any).display_order : 0
    if (aOrder === bOrder) return a.id - b.id
    return aOrder - bOrder
  })
}

function toReorderItems<T extends { id: number }>(items: T[]): ReorderItem[] {
  return items.map((item, index) => ({ id: item.id, position: index }))
}

function withDisplayOrder<T extends { id: number }>(items: T[]) {
  return items.map((item, index) => ({ ...(item as any), display_order: index })) as T[]
}

function SortableNode({
  id,
  label,
  active,
  onClick,
  className,
  badge,
}: {
  id: number
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
  badge?: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-white px-2.5 py-2 shadow-sm",
        active ? "border-brand-300 bg-brand-50" : "border-grayScale-200",
        isDragging && "opacity-60 ring-2 ring-brand-300",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-grayScale-300 hover:bg-grayScale-100 hover:text-grayScale-500"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 text-left text-sm font-semibold text-grayScale-700"
        >
          <span className="truncate">{label}</span>
        </button>
        {badge}
      </div>
    </div>
  )
}

export function CourseFlowBuilderPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<number | null>(null)
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<number | null>(null)

  const [subCategoriesByParent, setSubCategoriesByParent] = useState<Record<number, Course[]>>({})
  const [coursesBySubCategory, setCoursesBySubCategory] = useState<Record<number, SubCourse[]>>({})
  const [videosByCourse, setVideosByCourse] = useState<Record<number, VideoNode[]>>({})
  const [practicesByCourse, setPracticesByCourse] = useState<Record<number, PracticeNode[]>>({})

  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingSubCategories, setLoadingSubCategories] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingCourseContent, setLoadingCourseContent] = useState<Record<number, boolean>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const parentCategories = useMemo(
    () => sortByDisplayOrder(categories.filter((c) => normalizeParentId(c.parent_id as any) === null)),
    [categories],
  )

  const subCategories = useMemo(() => {
    if (!selectedParentCategoryId) return []
    return subCategoriesByParent[selectedParentCategoryId] ?? []
  }, [selectedParentCategoryId, subCategoriesByParent])

  const activeCourses = useMemo(() => {
    if (!activeSubCategoryId) return []
    return coursesBySubCategory[activeSubCategoryId] ?? []
  }, [activeSubCategoryId, coursesBySubCategory])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getCourseCategories()
        setCategories(sortByDisplayOrder(res.data.data.categories ?? []))
      } catch {
        toast.error("Failed to load categories.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedParentCategoryId) return
    if (parentCategories.length > 0) setSelectedParentCategoryId(parentCategories[0].id)
  }, [parentCategories, selectedParentCategoryId])

  useEffect(() => {
    if (!selectedParentCategoryId) {
      setActiveSubCategoryId(null)
      return
    }
    if (subCategories.length === 0) {
      setActiveSubCategoryId(null)
      return
    }
    if (!subCategories.some((c) => c.id === activeSubCategoryId)) {
      setActiveSubCategoryId(subCategories[0].id)
    }
  }, [selectedParentCategoryId, subCategories, activeSubCategoryId])

  useEffect(() => {
    if (!selectedParentCategoryId) return
    if (subCategoriesByParent[selectedParentCategoryId]) return
    const load = async () => {
      setLoadingSubCategories(true)
      try {
        const res = await getCoursesByCategory(selectedParentCategoryId)
        setSubCategoriesByParent((prev) => ({
          ...prev,
          [selectedParentCategoryId]: sortByDisplayOrder(res.data.data.courses ?? []),
        }))
      } catch {
        toast.error("Failed to load sub-categories.")
      } finally {
        setLoadingSubCategories(false)
      }
    }
    load()
  }, [selectedParentCategoryId, subCategoriesByParent])

  useEffect(() => {
    if (!activeSubCategoryId) return
    if (coursesBySubCategory[activeSubCategoryId]) return
    const load = async () => {
      setLoadingCourses(true)
      try {
        const res = await getSubCoursesByCourse(activeSubCategoryId)
        setCoursesBySubCategory((prev) => ({
          ...prev,
          [activeSubCategoryId]: sortByDisplayOrder(res.data.data.sub_courses ?? []),
        }))
      } catch {
        toast.error("Failed to load courses.")
      } finally {
        setLoadingCourses(false)
      }
    }
    load()
  }, [activeSubCategoryId, coursesBySubCategory])

  const ensureCourseContentLoaded = async (courseId: number) => {
    if (videosByCourse[courseId] && practicesByCourse[courseId]) return
    setLoadingCourseContent((prev) => ({ ...prev, [courseId]: true }))
    try {
      const [videosRes, practicesRes] = await Promise.all([
        getVideosBySubCourse(courseId),
        getQuestionSetsByOwner("SUB_COURSE", courseId),
      ])
      setVideosByCourse((prev) => ({
        ...prev,
        [courseId]: sortByDisplayOrder((videosRes.data.data.videos ?? []) as VideoNode[]),
      }))
      const practiceSets = ((practicesRes.data.data ?? []) as QuestionSet[]).filter(
        (set) => set.set_type === "PRACTICE",
      )
      setPracticesByCourse((prev) => ({
        ...prev,
        [courseId]: sortByDisplayOrder(
          practiceSets.map((set, index) => ({
            id: set.id,
            sub_course_id: courseId,
            title: set.title,
            description: set.description,
            banner_image: "",
            persona: set.persona,
            is_active: set.status === "PUBLISHED",
            display_order:
              typeof (set as any).display_order === "number" ? (set as any).display_order : index,
          })) as PracticeNode[],
        ),
      }))
    } catch {
      toast.error("Failed to load course content.")
    } finally {
      setLoadingCourseContent((prev) => ({ ...prev, [courseId]: false }))
    }
  }

  const handleSubCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedParentCategoryId) return
    const items = subCategories
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = withDisplayOrder(arrayMove(items, oldIndex, newIndex))
    const previous = items
    setSubCategoriesByParent((prev) => ({ ...prev, [selectedParentCategoryId]: reordered }))
    setSavingKey("sub-categories")
    try {
      await reorderCourses(toReorderItems(reordered))
    } catch (err: any) {
      setSubCategoriesByParent((prev) => ({ ...prev, [selectedParentCategoryId]: previous }))
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to reorder sub-categories."
      toast.error(message)
    } finally {
      setSavingKey(null)
    }
  }

  const handleCoursesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !activeSubCategoryId) return
    const items = coursesBySubCategory[activeSubCategoryId] ?? []
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = withDisplayOrder(arrayMove(items, oldIndex, newIndex))
    const previous = items
    setCoursesBySubCategory((prev) => ({ ...prev, [activeSubCategoryId]: reordered }))
    setSavingKey("courses")
    try {
      await reorderSubCourses(toReorderItems(reordered))
    } catch {
      setCoursesBySubCategory((prev) => ({ ...prev, [activeSubCategoryId]: previous }))
      toast.error("Failed to reorder courses.")
    } finally {
      setSavingKey(null)
    }
  }

  const handleVideosDragEnd = async (courseId: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const items = videosByCourse[courseId] ?? []
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = withDisplayOrder(arrayMove(items, oldIndex, newIndex))
    const previous = items
    setVideosByCourse((prev) => ({ ...prev, [courseId]: reordered }))
    setSavingKey(`videos-${courseId}`)
    try {
      await reorderVideos(toReorderItems(reordered))
    } catch {
      setVideosByCourse((prev) => ({ ...prev, [courseId]: previous }))
      toast.error("Failed to reorder videos.")
    } finally {
      setSavingKey(null)
    }
  }

  const handlePracticesDragEnd = async (courseId: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const items = practicesByCourse[courseId] ?? []
    const oldIndex = items.findIndex((i) => i.id === Number(active.id))
    const newIndex = items.findIndex((i) => i.id === Number(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = withDisplayOrder(arrayMove(items, oldIndex, newIndex))
    const previous = items
    setPracticesByCourse((prev) => ({ ...prev, [courseId]: reordered }))
    setSavingKey(`practices-${courseId}`)
    try {
      await reorderPractices(toReorderItems(reordered))
    } catch {
      setPracticesByCourse((prev) => ({ ...prev, [courseId]: previous }))
      toast.error("Failed to reorder practices.")
    } finally {
      setSavingKey(null)
    }
  }

  const toggleCourse = async (courseId: number) => {
    const expanded = expandedCourseIds.has(courseId)
    if (!expanded) await ensureCourseContentLoaded(courseId)
    setExpandedCourseIds((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
        <p className="mt-3 text-sm text-grayScale-400">Loading learning tree...</p>
      </div>
    )
  }

  const selectedParentName =
    parentCategories.find((c) => c.id === selectedParentCategoryId)?.name ?? "Course Category"
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">Learning Tree Builder</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            Arrange as: Course category → Course sub-category → Course (level) → Course videos/practices
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
              Parent category
            </p>
            <Select
              value={selectedParentCategoryId ? String(selectedParentCategoryId) : ""}
              onChange={(e) => {
                setSelectedParentCategoryId(e.target.value ? Number(e.target.value) : null)
                setActiveSubCategoryId(null)
              }}
            >
              <option value="">Choose category...</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
              Active sub-category
            </p>
            <Select
              value={activeSubCategoryId ? String(activeSubCategoryId) : ""}
              onChange={(e) => setActiveSubCategoryId(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedParentCategoryId || loadingSubCategories || subCategories.length === 0}
            >
              <option value="">
                {loadingSubCategories ? "Loading sub-categories..." : "Choose sub-category..."}
              </option>
              {subCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-grayScale-600">Tree canvas</CardTitle>
            {savingKey && (
              <span className="inline-flex items-center gap-1 text-xs text-brand-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving order...
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl border-2 border-brand-400 bg-white px-5 py-2 text-lg font-semibold text-grayScale-700 shadow-sm">
              {selectedParentName}
            </div>
            <div className="h-5 w-px bg-grayScale-300" />

            <div className="w-full">
              {loadingSubCategories ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                </div>
              ) : subCategories.length === 0 ? (
                <div className="mx-auto max-w-[280px] rounded-xl border border-dashed border-grayScale-200 px-4 py-3 text-center text-xs text-grayScale-400">
                  No sub-categories available.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSubCategoryDragEnd}
                >
                  <SortableContext
                    items={subCategories.map((item) => item.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
                      {subCategories.map((item) => (
                        <SortableNode
                          key={item.id}
                          id={item.id}
                          label={item.title}
                          active={item.id === activeSubCategoryId}
                          onClick={() => setActiveSubCategoryId(item.id)}
                          className="min-w-[250px]"
                          badge={
                            item.id === activeSubCategoryId ? (
                              <Badge className="bg-brand-500 text-white">Active</Badge>
                            ) : undefined
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          <div className="border-t border-dashed border-grayScale-200 pt-5">
            {!activeSubCategoryId ? (
              <p className="rounded-lg border border-dashed border-grayScale-200 px-3 py-8 text-center text-xs text-grayScale-400">
                Select a course sub-category to arrange its course tree.
              </p>
            ) : loadingCourses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : activeCourses.length === 0 ? (
              <p className="rounded-lg border border-dashed border-grayScale-200 px-3 py-8 text-center text-xs text-grayScale-400">
                No courses found in this course sub-category.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCoursesDragEnd}
              >
                <SortableContext
                  items={activeCourses.map((item) => item.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {activeCourses.map((course) => {
                      const expanded = expandedCourseIds.has(course.id)
                      const videos = videosByCourse[course.id] ?? []
                      const practices = practicesByCourse[course.id] ?? []
                      const pairCount = Math.max(videos.length, practices.length)
                      return (
                        <div key={course.id} className="min-w-[320px] max-w-[360px]">
                          <SortableNode
                            id={course.id}
                            label={course.title}
                            className="border-brand-200 bg-brand-50/30"
                            badge={
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="text-[10px]">
                                  {course.level}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => toggleCourse(course.id)}
                                  className="grid h-7 w-7 place-items-center rounded-md text-grayScale-500 hover:bg-grayScale-100"
                                >
                                  <ChevronDown
                                    className={cn("h-4 w-4 transition-transform", !expanded && "-rotate-90")}
                                  />
                                </button>
                              </div>
                            }
                          />

                          <div className="ml-5 mt-1 h-5 w-px bg-grayScale-300" />

                          {expanded && (
                            <div className="ml-1 space-y-3 rounded-xl border border-grayScale-100 bg-grayScale-50/40 p-3">
                              {loadingCourseContent[course.id] ? (
                                <div className="flex items-center gap-2 py-6 text-xs text-grayScale-400">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Loading videos and practices...
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-2">
                                    {pairCount === 0 ? (
                                      <p className="rounded-lg border border-dashed border-grayScale-200 px-2 py-3 text-[11px] text-grayScale-400">
                                        No videos/practices
                                      </p>
                                    ) : (
                                      Array.from({ length: pairCount }).map((_, idx) => {
                                        const v = videos[idx]
                                        const p = practices[idx]
                                        return (
                                          <div key={`pair-${course.id}-${idx}`} className="flex items-center gap-2">
                                            <div className="w-[58%] rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm">
                                              <span className="inline-flex items-center gap-1 text-violet-600">
                                                <Video className="h-3.5 w-3.5" />
                                                {v ? v.title : "—"}
                                              </span>
                                            </div>
                                            <div className="h-px flex-1 bg-grayScale-300" />
                                            <div className="w-[36%] rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm">
                                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                {p ? p.title : "—"}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      })
                                    )}
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
                                        Reorder videos
                                      </p>
                                      <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={(event) => handleVideosDragEnd(course.id, event)}
                                      >
                                        <SortableContext
                                          items={videos.map((item) => item.id)}
                                          strategy={verticalListSortingStrategy}
                                        >
                                          <div className="space-y-1.5">
                                            {videos.map((video) => (
                                              <SortableNode
                                                key={video.id}
                                                id={video.id}
                                                label={video.title}
                                                className="py-1.5"
                                              />
                                            ))}
                                          </div>
                                        </SortableContext>
                                      </DndContext>
                                    </div>
                                    <div>
                                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-grayScale-400">
                                        Reorder practices
                                      </p>
                                      <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={(event) => handlePracticesDragEnd(course.id, event)}
                                      >
                                        <SortableContext
                                          items={practices.map((item) => item.id)}
                                          strategy={verticalListSortingStrategy}
                                        >
                                          <div className="space-y-1.5">
                                            {practices.map((practice) => (
                                              <SortableNode
                                                key={practice.id}
                                                id={practice.id}
                                                label={practice.title}
                                                className="py-1.5"
                                              />
                                            ))}
                                          </div>
                                        </SortableContext>
                                      </DndContext>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
