import { useEffect, useMemo, useState } from "react"
import { ChevronRight, GripVertical, Plus, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"
import { getCourseCategories, getCoursesByCategory } from "../../api/courses.api"
import type { Course, CourseCategory } from "../../types/course.types"
import { cn } from "../../lib/utils"

type StepType = "lesson" | "practice" | "exam" | "feedback"

type FlowStep = {
  id: string
  type: StepType
  title: string
  description?: string
}

type CourseWithCategory = Course & { category_name: string }

const STEP_LABELS: Record<StepType, string> = {
  lesson: "Lesson",
  practice: "Practice",
  exam: "Exam",
  feedback: "Feedback loop",
}

const STEP_BADGE: Record<StepType, string> = {
  lesson: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  practice: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  exam: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  feedback: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
}

export function CourseFlowBuilderPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [courses, setCourses] = useState<CourseWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [steps, setSteps] = useState<FlowStep[]>([])
  const [dragStepId, setDragStepId] = useState<string | null>(null)

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === selectedCourseId),
    [courses, selectedCourseId],
  )

  // Load courses and categories
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const catRes = await getCourseCategories()
        const cats = catRes.data.data.categories ?? []
        setCategories(cats)

        const all: CourseWithCategory[] = []
        for (const cat of cats) {
          const res = await getCoursesByCategory(cat.id)
          const catCourses = res.data.data.courses ?? []
          all.push(
            ...catCourses.map((c) => ({
              ...c,
              category_name: cat.name,
            })),
          )
        }
        setCourses(all)
      } catch (err) {
        console.error("Failed to load course flows data:", err)
        setError("Failed to load courses. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  // Load flow for selected course from localStorage or build default
  useEffect(() => {
    if (!selectedCourseId) {
      setSteps([])
      return
    }
    const key = `course_flow_${selectedCourseId}`
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed: FlowStep[] = JSON.parse(raw)
        setSteps(parsed)
        return
      }
    } catch {
      // ignore and fall through to default
    }

    // Default flow: Lesson -> Practice -> Exam -> Feedback
    const defaults: FlowStep[] = [
      {
        id: `${selectedCourseId}-lesson`,
        type: "lesson",
        title: "Core lessons",
        description: "Main learning content for this course.",
      },
      {
        id: `${selectedCourseId}-practice`,
        type: "practice",
        title: "Practice sessions",
        description: "Speaking or practice activities to reinforce learning.",
      },
      {
        id: `${selectedCourseId}-exam`,
        type: "exam",
        title: "Exam / Assessment",
        description: "Formal evaluation of student understanding.",
      },
      {
        id: `${selectedCourseId}-feedback`,
        type: "feedback",
        title: "Feedback loop",
        description: "Collect feedback and share results with learners.",
      },
    ]
    setSteps(defaults)
  }, [selectedCourseId])

  // Persist flow when steps change
  useEffect(() => {
    if (!selectedCourseId) return
    const key = `course_flow_${selectedCourseId}`
    window.localStorage.setItem(key, JSON.stringify(steps))
  }, [steps, selectedCourseId])

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
  }

  const handleAddStep = (type: StepType) => {
    if (!selectedCourseId) return
    const newStep: FlowStep = {
      id: `${selectedCourseId}-${type}-${Date.now()}`,
      type,
      title: STEP_LABELS[type],
      description:
        type === "lesson"
          ? "Add the lessons or modules that introduce key concepts."
          : type === "practice"
            ? "Connect speaking or practice activities after lessons."
            : type === "exam"
              ? "Place exams or quizzes where you want to assess learners."
              : "Ask for feedback, NPS, or reflection after the exam or final lesson.",
    }
    setSteps((prev) => [...prev, newStep])
  }

  const handleUpdateStep = (id: string, changes: Partial<FlowStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)))
  }

  const handleRemoveStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="rounded-2xl bg-brand-50/50 p-6">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
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
            Define the sequence of lessons, practice, exams, and feedback for each course.
          </p>
        </div>
      </div>

      {/* Course selector */}
      <Card className="shadow-none border border-grayScale-200">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-grayScale-400">
              Select course
            </p>
            <div className="flex-1">
              <Select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">Choose a course…</option>
                {categories.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {courses
                      .filter((c) => c.category_id === cat.id)
                      .map((course) => (
                        <option key={course.id} value={String(course.id)}>
                          {course.title}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </Select>
            </div>
          </div>
          {selectedCourse && (
            <div className="mt-2 flex items-center gap-2 text-xs text-grayScale-400 sm:mt-0">
              <Badge variant="secondary" className="text-[11px]">
                {selectedCourse.category_name}
              </Badge>
              <ChevronRight className="h-3.5 w-3.5 text-grayScale-300" />
              <span className="truncate max-w-[180px] text-grayScale-500">
                {selectedCourse.title}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Builder */}
      {selectedCourse ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Flow steps */}
          <Card className="shadow-soft">
            <CardHeader className="border-b border-grayScale-200 pb-3">
              <CardTitle className="text-base font-semibold text-grayScale-600">
                Flow sequence
              </CardTitle>
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
                              id: `${selectedCourseId}-feedback-${Date.now()}`,
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
                    Practice
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
      ) : (
        <Card className="shadow-none border border-dashed border-grayScale-200 bg-grayScale-50/60">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-semibold text-grayScale-600">
              Select a course to start structuring its flow.
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-grayScale-400">
              Once a course is selected, you can define the order of lessons, practice, exams, and
              feedback steps, and reorder them as needed. This works great on both desktop and
              mobile layouts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

