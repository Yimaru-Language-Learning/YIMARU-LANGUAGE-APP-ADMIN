import { useEffect, useMemo, useState } from "react"
import { GripVertical, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { getCourseCategories } from "../../api/courses.api"
import type { CourseCategory } from "../../types/course.types"
import { cn } from "../../lib/utils"

type StepType =
  | "lesson"
  | "practice"
  | "exam"
  | "feedback"
  | "course"
  | "speaking"
  | "new_course"

type FlowStep = {
  id: string
  type: StepType
  title: string
  description?: string
}

const STEP_LABELS: Record<StepType, string> = {
  lesson: "Lesson",
  practice: "Practice",
  exam: "Exam",
  feedback: "Feedback loop",
  course: "Course",
  speaking: "Speaking section",
  new_course: "New course (category)",
}

const STEP_BADGE: Record<StepType, string> = {
  lesson: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  practice: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  exam: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  feedback: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  course: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  speaking: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
  new_course: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
}

const PARENT_ORDER_KEY = "parent_categories_order"
const SUB_ORDER_KEY_PREFIX = "sub_categories_order_"

export function CourseFlowBuilderPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<"sub" | "parent">("sub")
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("")
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string>("")
  const [steps, setSteps] = useState<FlowStep[]>([])
  const [dragStepId, setDragStepId] = useState<string | null>(null)
  // Order of parent category ids (scope = parent)
  const [parentCategoryOrder, setParentCategoryOrder] = useState<string[]>([])
  // Order of sub category ids for the selected parent (scope = sub)
  const [subCategoryOrder, setSubCategoryOrder] = useState<string[]>([])
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null)
  const [parentOrderDirty, setParentOrderDirty] = useState(false)
  const [subOrderDirty, setSubOrderDirty] = useState(false)
  const [stepsDirty, setStepsDirty] = useState(false)

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  )

  const selectedParentCategory = useMemo(
    () => (scope === "sub" ? categories.find((c) => String(c.id) === selectedParentCategoryId) : undefined),
    [categories, selectedParentCategoryId, scope],
  )

  const subCategoriesForParent = useMemo(() => {
    if (!selectedParentCategoryId) return []
    return categories.filter((c) => String(c.parent_id) === selectedParentCategoryId)
  }, [categories, selectedParentCategoryId])

  const selectedSubCategory = useMemo(
    () => (scope === "sub" ? categories.find((c) => String(c.id) === selectedSubCategoryId) : undefined),
    [categories, selectedSubCategoryId, scope],
  )

  // Ordered parent list: use saved order, merge in any new parents from API
  const orderedParentCategories = useMemo(() => {
    const byId = new Map(parentCategories.map((c) => [String(c.id), c]))
    const ordered: CourseCategory[] = []
    const seen = new Set<string>()
    for (const id of parentCategoryOrder) {
      const cat = byId.get(id)
      if (cat) {
        ordered.push(cat)
        seen.add(id)
      }
    }
    for (const c of parentCategories) {
      if (!seen.has(String(c.id))) ordered.push(c)
    }
    return ordered
  }, [parentCategories, parentCategoryOrder])

  // Ordered sub list for selected parent
  const orderedSubCategories = useMemo(() => {
    const byId = new Map(subCategoriesForParent.map((c) => [String(c.id), c]))
    const ordered: CourseCategory[] = []
    const seen = new Set<string>()
    for (const id of subCategoryOrder) {
      const cat = byId.get(id)
      if (cat) {
        ordered.push(cat)
        seen.add(id)
      }
    }
    for (const c of subCategoriesForParent) {
      if (!seen.has(String(c.id))) ordered.push(c)
    }
    return ordered
  }, [subCategoriesForParent, subCategoryOrder])

  // Load categories
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const catRes = await getCourseCategories()
        const cats = catRes.data.data.categories ?? []
        setCategories(cats)
      } catch (err) {
        console.error("Failed to load course flows data:", err)
        setError("Failed to load categories. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  // Load parent category order from localStorage (after we have categories)
  useEffect(() => {
    if (parentCategories.length === 0) return
    try {
      const raw = window.localStorage.getItem(PARENT_ORDER_KEY)
      if (raw) {
        const parsed: string[] = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setParentCategoryOrder(parsed)
          setParentOrderDirty(false)
          return
        }
      }
    } catch {
      // ignore
    }
    setParentCategoryOrder(parentCategories.map((c) => String(c.id)))
    setParentOrderDirty(false)
  }, [parentCategories.length])

  // Load sub category order for selected parent
  useEffect(() => {
    if (!selectedParentCategoryId || subCategoriesForParent.length === 0) {
      setSubCategoryOrder([])
      return
    }
    const key = `${SUB_ORDER_KEY_PREFIX}${selectedParentCategoryId}`
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed: string[] = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubCategoryOrder(parsed)
          setSubOrderDirty(false)
          return
        }
      }
    } catch {
      // ignore
    }
    setSubCategoryOrder(subCategoriesForParent.map((c) => String(c.id)))
    setSubOrderDirty(false)
  }, [selectedParentCategoryId, subCategoriesForParent.length])

  // Load flow steps for selected sub category only (sub category structure)
  useEffect(() => {
    if (scope !== "sub" || !selectedSubCategoryId) {
      setSteps([])
      setStepsDirty(false)
      return
    }
    const key = `subcategory_flow_${selectedSubCategoryId}`
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed: FlowStep[] = JSON.parse(raw)
        setSteps(parsed)
        setStepsDirty(false)
        return
      }
    } catch {
      // ignore and fall through to default
    }

    const defaults: FlowStep[] = [
      {
        id: `${selectedSubCategoryId}-lesson`,
        type: "lesson",
        title: "Core lessons",
        description: "Main learning content for this sub category.",
      },
      {
        id: `${selectedSubCategoryId}-practice`,
        type: "practice",
        title: "Practice sessions",
        description: "Speaking or practice activities to reinforce learning.",
      },
      {
        id: `${selectedSubCategoryId}-exam`,
        type: "exam",
        title: "Exam / Assessment",
        description: "Formal evaluation of student understanding.",
      },
      {
        id: `${selectedSubCategoryId}-feedback`,
        type: "feedback",
        title: "Feedback loop",
        description: "Collect feedback and share results with learners.",
      },
    ]
    setSteps(defaults)
    setStepsDirty(true)
  }, [scope, selectedSubCategoryId])

  const handleReorder = (targetId: string) => {
    if (!dragStepId || dragStepId === targetId) return
    setSteps((prev) => {
      const currentIndex = prev.findIndex((s) => s.id === dragStepId)
      const targetIndex = prev.findIndex((s) => s.id === targetId)
      if (currentIndex === -1 || targetIndex === -1) return prev
      const copy = [...prev]
      const [moved] = copy.splice(currentIndex, 1)
      copy.splice(targetIndex, 0, moved)
      return copy
    })
    setDragStepId(null)
    setStepsDirty(true)
  }

  const handleReorderParentCategory = (targetId: string) => {
    if (!dragCategoryId || dragCategoryId === targetId) return
    setParentCategoryOrder((prev) => {
      const currentIndex = prev.indexOf(dragCategoryId)
      const targetIndex = prev.indexOf(targetId)
      if (currentIndex === -1 || targetIndex === -1) return prev
      const copy = [...prev]
      const [moved] = copy.splice(currentIndex, 1)
      copy.splice(targetIndex, 0, moved)
      return copy
    })
    setDragCategoryId(null)
    setParentOrderDirty(true)
  }

  const handleReorderSubCategory = (targetId: string) => {
    if (!dragCategoryId || dragCategoryId === targetId) return
    setSubCategoryOrder((prev) => {
      const currentIndex = prev.indexOf(dragCategoryId)
      const targetIndex = prev.indexOf(targetId)
      if (currentIndex === -1 || targetIndex === -1) return prev
      const copy = [...prev]
      const [moved] = copy.splice(currentIndex, 1)
      copy.splice(targetIndex, 0, moved)
      return copy
    })
    setDragCategoryId(null)
    setSubOrderDirty(true)
  }

  const handleSaveParentOrder = () => {
    if (orderedParentCategories.length === 0 || parentCategoryOrder.length === 0) return
    window.localStorage.setItem(PARENT_ORDER_KEY, JSON.stringify(parentCategoryOrder))
    setParentOrderDirty(false)
  }

  const handleSaveSubOrder = () => {
    if (!selectedParentCategoryId || subCategoryOrder.length === 0) return
    window.localStorage.setItem(
      `${SUB_ORDER_KEY_PREFIX}${selectedParentCategoryId}`,
      JSON.stringify(subCategoryOrder),
    )
    setSubOrderDirty(false)
  }

  const handleSaveSteps = () => {
    if (scope !== "sub" || !selectedSubCategoryId) return
    window.localStorage.setItem(`subcategory_flow_${selectedSubCategoryId}`, JSON.stringify(steps))
    setStepsDirty(false)
  }

  const getDefaultDescription = (type: StepType): string => {
    switch (type) {
      case "lesson":
        return "Add the lessons or modules that introduce key concepts."
      case "practice":
        return "Connect speaking or practice activities after lessons."
      case "exam":
        return "Place exams or quizzes where you want to assess learners."
      case "feedback":
        return "Ask for feedback, NPS, or reflection after the exam or final lesson."
      case "course":
        return "Link or add an existing course to this flow."
      case "speaking":
        return "Speaking or oral practice section for this flow."
      case "new_course":
        return "Add a new course within this category."
      default:
        return ""
    }
  }

  const handleAddStep = (type: StepType) => {
    const activeId = scope === "sub" ? selectedSubCategoryId : selectedParentCategoryId
    if (!activeId) return
    const newStep: FlowStep = {
      id: `${activeId}-${type}-${Date.now()}`,
      type,
      title: STEP_LABELS[type],
      description: getDefaultDescription(type),
    }
    setSteps((prev) => [...prev, newStep])
    setStepsDirty(true)
  }

  const handleUpdateStep = (id: string, changes: Partial<FlowStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)))
    setStepsDirty(true)
  }

  const handleRemoveStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
    setStepsDirty(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="rounded-2xl bg-white shadow-sm p-6">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-grayScale-400">Loading course flows…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-5 shadow-sm">
          <div className="rounded-full bg-red-100 p-2">
            <RefreshCw className="h-5 w-5 shrink-0 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">Course Flows</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            Arrange parent categories and sub categories into flows, including lessons, practice,
            exams, and feedback steps.
          </p>
        </div>
      </div>

      {/* Scope & selector */}
      <Card className="shadow-none border border-grayScale-200">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="inline-flex rounded-full border border-grayScale-200 bg-grayScale-50 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setScope("parent")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                  scope === "parent"
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-grayScale-500 hover:text-grayScale-700",
                )}
              >
                Parent categories
              </button>
              <button
                type="button"
                onClick={() => setScope("sub")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors",
                  scope === "sub"
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-grayScale-500 hover:text-grayScale-700",
                )}
              >
                Sub categories
              </button>
            </div>

            {scope === "sub" && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
                    Parent category
                  </p>
                  <Select
                    value={selectedParentCategoryId}
                    onChange={(e) => {
                      setSelectedParentCategoryId(e.target.value)
                      setSelectedSubCategoryId("")
                    }}
                  >
                    <option value="">Choose parent…</option>
                    {parentCategories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
                    Sub category (structure)
                  </p>
                  <Select
                    value={selectedSubCategoryId}
                    onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                  >
                    <option value="">Choose sub category…</option>
                    {subCategoriesForParent.map((child) => (
                      <option key={child.id} value={String(child.id)}>
                        {child.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parent scope: sequence of parent categories only */}
      {scope === "parent" && (
        <Card className="shadow-soft">
          <CardHeader className="border-b border-grayScale-200 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-grayScale-600">
                  Parent category sequence
                </CardTitle>
                <p className="mt-1 text-xs text-grayScale-400">
                  Drag to reorder the sequence in which parent categories appear. No courses or
                  steps—order only.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-[11px]"
                disabled={!parentOrderDirty || orderedParentCategories.length === 0}
                onClick={handleSaveParentOrder}
              >
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {orderedParentCategories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/60 px-4 py-6 text-center text-xs text-grayScale-400">
                No parent categories. Add categories in Content Management first.
              </div>
            ) : (
              orderedParentCategories.map((cat, index) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDragCategoryId(String(cat.id))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleReorderParentCategory(String(cat.id))}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-grayScale-100 bg-white p-3 shadow-sm transition-colors",
                    dragCategoryId === String(cat.id) && "ring-2 ring-brand-300",
                  )}
                >
                  <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600">
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-medium text-grayScale-400">#{index + 1}</span>
                  <span className="flex-1 text-sm font-medium text-grayScale-700">{cat.name}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Sub scope: sub category sequence then structure */}
      {scope === "sub" && selectedParentCategoryId && (
        <>
          <Card className="shadow-soft">
            <CardHeader className="border-b border-grayScale-200 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-grayScale-600">
                  Sub category sequence
                </CardTitle>
                <p className="mt-1 text-xs text-grayScale-400">
                  Drag to reorder sub categories under this parent.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-[11px]"
                disabled={!subOrderDirty || orderedSubCategories.length === 0}
                onClick={handleSaveSubOrder}
              >
                Save
              </Button>
            </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {orderedSubCategories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/60 px-4 py-6 text-center text-xs text-grayScale-400">
                  No sub categories under this parent.
                </div>
              ) : (
                orderedSubCategories.map((sub, index) => (
                  <div
                    key={sub.id}
                    draggable
                    onDragStart={() => setDragCategoryId(String(sub.id))}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleReorderSubCategory(String(sub.id))}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-grayScale-100 bg-white p-3 shadow-sm transition-colors",
                      dragCategoryId === String(sub.id) && "ring-2 ring-brand-300",
                    )}
                  >
                    <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600">
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] font-medium text-grayScale-400">#{index + 1}</span>
                    <span className="flex-1 text-sm font-medium text-grayScale-700">{sub.name}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sub category structure: flow steps (only when a sub category is selected) */}
          {selectedSubCategory && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Card className="shadow-soft">
                <CardHeader className="border-b border-grayScale-200 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold text-grayScale-600">
                        Sub category structure
                      </CardTitle>
                      <p className="mt-1 text-xs text-grayScale-400">
                        Courses, questions, and feedback steps for “{selectedSubCategory.name}”.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 px-3 text-[11px]"
                      disabled={!stepsDirty || steps.length === 0}
                      onClick={handleSaveSteps}
                    >
                      Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {steps.length === 0 && (
                    <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/60 px-4 py-6 text-center text-xs text-grayScale-400">
                      No steps yet. Use the buttons on the right to add lessons, practice, exams, and
                      feedback loops.
                    </div>
                  )}

                  <div className="space-y-2">
                    {steps.map((step, index) => (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={() => setDragStepId(step.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleReorder(step.id)}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border border-grayScale-100 bg-white p-3.5 shadow-sm transition-colors md:flex-row md:items-start",
                      dragStepId === step.id && "ring-2 ring-brand-300",
                    )}
                  >
                    <div className="flex items-center gap-2 md:flex-col md:items-start">
                      <button
                        type="button"
                        className="hidden h-8 w-8 items-center justify-center rounded-lg text-grayScale-300 hover:bg-grayScale-100 hover:text-grayScale-500 md:flex"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          STEP_BADGE[step.type],
                        )}
                      >
                        {STEP_LABELS[step.type]}
                        <span className="text-[10px] text-grayScale-400">#{index + 1}</span>
                      </span>
                    </div>

                    <div className="flex-1 space-y-1">
                      <Input
                        value={step.title}
                        onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                        className="h-8 text-sm"
                      />
                      <Input
                        value={step.description ?? ""}
                        onChange={(e) =>
                          handleUpdateStep(step.id, { description: e.target.value })
                        }
                        placeholder="Optional description for this step"
                        className="h-8 text-xs text-grayScale-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 md:flex-col md:items-end">
                      {step.type !== "feedback" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-[11px]"
                          onClick={() => {
                            const feedbackStep: FlowStep = {
                              id: `${selectedSubCategoryId}-feedback-${Date.now()}`,
                              type: "feedback",
                              title: "Feedback loop",
                              description: "Collect feedback after this step.",
                            }
                            setSteps((prev) => {
                              const idx = prev.findIndex((s) => s.id === step.id)
                              if (idx === -1) return prev
                              const copy = [...prev]
                              copy.splice(idx + 1, 0, feedbackStep)
                              return copy
                            })
                          }}
                        >
                          + Feedback
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[11px] text-destructive hover:bg-red-50"
                        onClick={() => handleRemoveStep(step.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Palette / What this controls */}
          <div className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-grayScale-600">
                  Add steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-start gap-2 text-xs"
                    onClick={() => handleAddStep("lesson")}
                  >
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Lesson
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-start gap-2 text-xs"
                    onClick={() => handleAddStep("practice")}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Practice section
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-start gap-2 text-xs"
                    onClick={() => handleAddStep("speaking")}
                  >
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    Speaking section
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-start gap-2 text-xs"
                    onClick={() => handleAddStep("exam")}
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Exam
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-start gap-2 text-xs"
                    onClick={() => handleAddStep("feedback")}
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Feedback
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-start gap-2 text-xs"
                    onClick={() => handleAddStep("course")}
                  >
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    Course
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 col-span-2 justify-start gap-2 text-xs sm:col-span-2"
                    onClick={() => handleAddStep("new_course")}
                  >
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    New course to category
                  </Button>
                </div>
                <p className="text-[11px] leading-relaxed text-grayScale-400">
                  Drag steps in the sequence on the left to change their order. Add feedback loops
                  after exams or any important milestone to keep learners engaged.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-dashed border-grayScale-200 bg-grayScale-50/50">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-semibold text-grayScale-600">How this is used</p>
                <p className="text-[11px] leading-relaxed text-grayScale-500">
                  This builder helps you map out the ideal learner journey. You can later connect
                  each step to actual lessons, speaking practices, exams, or surveys in your
                  backend. For now, flows are saved locally in your browser.
                </p>
              </CardContent>
            </Card>
          </div>
            </div>
          )}
        </>
      )}

      {scope === "sub" && !selectedParentCategoryId && (
        <Card className="shadow-none border border-dashed border-grayScale-200 bg-grayScale-50/60">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-semibold text-grayScale-600">
              Select a parent category to reorder sub categories and edit a sub category’s structure.
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-grayScale-400">
              Use the dropdowns above to choose a parent, then reorder its sub categories and pick a sub category to define courses, questions, and feedback steps.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

