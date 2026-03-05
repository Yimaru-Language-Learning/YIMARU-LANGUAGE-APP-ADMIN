import { useEffect, useMemo, useState } from "react"
import {
  GripVertical, RefreshCw, Video, BookOpen, ChevronDown, ChevronRight,
  X, AlertCircle, Loader2,
} from "lucide-react"
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Select } from "../../components/ui/select"
import {
  getCourseCategories, getCoursesByCategory,
  getLearningPath, reorderSubCourses,
  addSubCoursePrerequisite, removeSubCoursePrerequisite,
} from "../../api/courses.api"
import type {
  CourseCategory, Course,
  LearningPathSubCourse, LearningPath,
} from "../../types/course.types"
import { cn } from "../../lib/utils"
import { toast } from "sonner"

// ── Level badge colours ──
const LEVEL_STYLE: Record<string, string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  INTERMEDIATE: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  ADVANCED: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
}

// ── Sortable sub-course card ──
function SortableSubCourseCard({
  subCourse,
  allSubCourses,
  onAddPrereq,
  onRemovePrereq,
  prereqLoading,
}: {
  subCourse: LearningPathSubCourse
  allSubCourses: LearningPathSubCourse[]
  onAddPrereq: (subCourseId: number, prereqId: number) => void
  onRemovePrereq: (subCourseId: number, prereqId: number) => void
  prereqLoading: number | null
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: subCourse.id })

  const [expanded, setExpanded] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const availablePrereqs = allSubCourses.filter(
    (sc) =>
      sc.id !== subCourse.id &&
      !subCourse.prerequisites.some((p) => p.sub_course_id === sc.id),
  )

  return (
    <div ref={setNodeRef} style={style} className="group">
      {/* Connector line */}
      <div className="flex justify-center -mb-1">
        <div className="h-4 w-px bg-grayScale-200" />
      </div>

      <div
        className={cn(
          "rounded-2xl border bg-white shadow-sm transition-all",
          isDragging ? "ring-2 ring-brand-400 border-brand-200" : "border-grayScale-100",
        )}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 p-4">
          {/* Drag handle */}
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-grayScale-300 hover:bg-grayScale-100 hover:text-grayScale-500 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Order badge */}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
            {subCourse.display_order}
          </span>

          {/* Title & level */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-grayScale-700">
              {subCourse.title}
            </p>
            {subCourse.description && (
              <p className="truncate text-xs text-grayScale-400 mt-0.5">
                {subCourse.description}
              </p>
            )}
          </div>

          {/* Level badge */}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              LEVEL_STYLE[subCourse.level] ?? "bg-grayScale-100 text-grayScale-600",
            )}
          >
            {subCourse.level}
          </span>

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 border-t border-grayScale-50 px-4 py-2.5 text-[11px] text-grayScale-400">
          <span className="flex items-center gap-1">
            <Video className="h-3.5 w-3.5" />
            {subCourse.video_count} videos
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {subCourse.practice_count} practices
          </span>
          <span className="flex items-center gap-1">
            {subCourse.prerequisite_count} prerequisite{subCourse.prerequisite_count !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Expandable prerequisites section */}
        {expanded && (
          <div className="border-t border-grayScale-100 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-grayScale-500 uppercase tracking-wider">
              Prerequisites
            </h4>

            {subCourse.prerequisites.length === 0 && (
              <p className="text-xs text-grayScale-400 italic">No prerequisites set.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {subCourse.prerequisites.map((prereq) => (
                <div
                  key={prereq.sub_course_id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-grayScale-200 bg-grayScale-50 px-3 py-1 text-xs font-medium text-grayScale-600"
                >
                  {prereq.title}
                  <span className="text-[10px] text-grayScale-400">({prereq.level})</span>
                  <button
                    type="button"
                    onClick={() => onRemovePrereq(subCourse.id, prereq.sub_course_id)}
                    disabled={prereqLoading === subCourse.id}
                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-grayScale-400 hover:bg-red-100 hover:text-red-500 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add prerequisite dropdown */}
            {availablePrereqs.length > 0 && (
              <Select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAddPrereq(subCourse.id, Number(e.target.value))
                    e.target.value = ""
                  }
                }}
                className="h-9 text-xs"
                disabled={prereqLoading === subCourse.id}
              >
                <option value="">+ Add prerequisite…</option>
                {availablePrereqs.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title} ({sc.level})
                  </option>
                ))}
              </Select>
            )}

            {prereqLoading === subCourse.id && (
              <div className="flex items-center gap-2 text-xs text-grayScale-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──
export function CourseFlowBuilderPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [subCourses, setSubCourses] = useState<LearningPathSubCourse[]>([])

  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")

  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [pathLoading, setPathLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prereqLoading, setPrereqLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Load categories on mount
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await getCourseCategories()
        setCategories(res.data.data.categories ?? [])
      } catch {
        setError("Failed to load categories.")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  // Load courses when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setCourses([])
      setSelectedCourseId("")
      return
    }
    const fetch = async () => {
      setCoursesLoading(true)
      try {
        const res = await getCoursesByCategory(Number(selectedCategoryId))
        setCourses(res.data.data.courses ?? [])
      } catch {
        toast.error("Failed to load courses.")
      } finally {
        setCoursesLoading(false)
      }
    }
    fetch()
  }, [selectedCategoryId])

  // Load learning path when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setLearningPath(null)
      setSubCourses([])
      return
    }
    const fetch = async () => {
      setPathLoading(true)
      try {
        const res = await getLearningPath(Number(selectedCourseId))
        setLearningPath(res.data.data)
        setSubCourses(res.data.data.sub_courses ?? [])
      } catch {
        toast.error("Failed to load learning path.")
        setLearningPath(null)
        setSubCourses([])
      } finally {
        setPathLoading(false)
      }
    }
    fetch()
  }, [selectedCourseId])

  // Drag end → reorder
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = subCourses.findIndex((sc) => sc.id === active.id)
    const newIndex = subCourses.findIndex((sc) => sc.id === over.id)
    const reordered = arrayMove(subCourses, oldIndex, newIndex)
    const updated = reordered.map((sc, i) => ({ ...sc, display_order: i + 1 }))

    setSubCourses(updated)

    setSaving(true)
    try {
      await reorderSubCourses(
        Number(selectedCourseId),
        updated.map((sc) => ({ sub_course_id: sc.id, display_order: sc.display_order })),
      )
      toast.success("Order saved.")
    } catch {
      toast.error("Failed to save order. Reverting…")
      setSubCourses(subCourses)
    } finally {
      setSaving(false)
    }
  }

  // Add prerequisite
  const handleAddPrereq = async (subCourseId: number, prereqId: number) => {
    setPrereqLoading(subCourseId)
    try {
      await addSubCoursePrerequisite(subCourseId, { prerequisite_sub_course_id: prereqId })
      // Refresh learning path
      const res = await getLearningPath(Number(selectedCourseId))
      setSubCourses(res.data.data.sub_courses ?? [])
      toast.success("Prerequisite added.")
    } catch {
      toast.error("Failed to add prerequisite.")
    } finally {
      setPrereqLoading(null)
    }
  }

  // Remove prerequisite
  const handleRemovePrereq = async (subCourseId: number, prereqId: number) => {
    setPrereqLoading(subCourseId)
    try {
      await removeSubCoursePrerequisite(subCourseId, prereqId)
      const res = await getLearningPath(Number(selectedCourseId))
      setSubCourses(res.data.data.sub_courses ?? [])
      toast.success("Prerequisite removed.")
    } catch {
      toast.error("Failed to remove prerequisite.")
    } finally {
      setPrereqLoading(null)
    }
  }

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-grayScale-400">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-5 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">Learning Path Builder</h1>
        <p className="mt-1 text-sm text-grayScale-400">
          Select a course to drag-and-drop reorder its sub-courses and manage prerequisites.
        </p>
      </div>

      {/* Selectors */}
      <Card className="shadow-none border border-grayScale-200">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
              Category
            </p>
            <Select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value)
                setSelectedCourseId("")
              }}
            >
              <option value="">Choose category…</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1 min-w-0">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
              Course
            </p>
            <Select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={!selectedCategoryId || coursesLoading}
            >
              <option value="">
                {coursesLoading ? "Loading courses…" : "Choose course…"}
              </option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!selectedCourseId && (
        <Card className="shadow-none border border-dashed border-grayScale-200 bg-grayScale-50/60">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-semibold text-grayScale-600">
              Select a category and course to begin.
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-grayScale-400">
              Once selected, you can drag to reorder sub-courses and manage prerequisite
              dependencies.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading path */}
      {selectedCourseId && pathLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      )}

      {/* Learning path editor */}
      {selectedCourseId && !pathLoading && learningPath && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left – sortable list */}
          <div className="space-y-0">
            <Card className="shadow-soft">
              <CardHeader className="border-b border-grayScale-200 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold text-grayScale-600">
                      {learningPath.course_title}
                    </CardTitle>
                    <p className="mt-1 text-xs text-grayScale-400">
                      Drag sub-courses to reorder them. Click the arrow to manage prerequisites.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving && (
                      <span className="flex items-center gap-1.5 text-xs text-brand-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving…
                      </span>
                    )}
                    <Badge variant="secondary" className="text-[11px]">
                      {subCourses.length} sub-course{subCourses.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                {subCourses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/60 px-4 py-10 text-center text-xs text-grayScale-400">
                    No sub-courses in this course yet. Add sub-courses from the Content Management page.
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={subCourses.map((sc) => sc.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {subCourses.map((sc) => (
                        <SortableSubCourseCard
                          key={sc.id}
                          subCourse={sc}
                          allSubCourses={subCourses}
                          onAddPrereq={handleAddPrereq}
                          onRemovePrereq={handleRemovePrereq}
                          prereqLoading={prereqLoading}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right – info panel */}
          <div className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-grayScale-600">
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                {learningPath.thumbnail && (
                  <img
                    src={learningPath.thumbnail}
                    alt={learningPath.course_title}
                    className="w-full rounded-lg object-cover aspect-video bg-grayScale-100"
                  />
                )}
                <div className="space-y-1.5 text-xs text-grayScale-500">
                  <div className="flex justify-between">
                    <span className="text-grayScale-400">Category</span>
                    <span className="font-medium text-grayScale-600">{learningPath.category_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-grayScale-400">Sub-courses</span>
                    <span className="font-medium text-grayScale-600">{subCourses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-grayScale-400">Total videos</span>
                    <span className="font-medium text-grayScale-600">
                      {subCourses.reduce((sum, sc) => sum + sc.video_count, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-grayScale-400">Total practices</span>
                    <span className="font-medium text-grayScale-600">
                      {subCourses.reduce((sum, sc) => sum + sc.practice_count, 0)}
                    </span>
                  </div>
                </div>
                {learningPath.description && (
                  <p className="text-xs leading-relaxed text-grayScale-400 border-t border-grayScale-100 pt-3">
                    {learningPath.description}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-none border border-dashed border-grayScale-200 bg-grayScale-50/50">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-semibold text-grayScale-600">How it works</p>
                <ul className="space-y-1.5 text-[11px] leading-relaxed text-grayScale-500 list-disc list-inside">
                  <li>Drag sub-courses by the grip handle to reorder. Changes save automatically.</li>
                  <li>Click the arrow on a sub-course to expand and manage its prerequisites.</li>
                  <li>Prerequisites define which sub-courses a learner must complete first.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
