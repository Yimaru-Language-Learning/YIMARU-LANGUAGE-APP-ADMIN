import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { BookOpen, Mic, Briefcase, HelpCircle, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { getCourseCategories } from "../../api/courses.api"
import type { CourseCategory } from "../../types/course.types"

const contentSections = [
  {
    key: "courses",
    pathFn: (categoryId: string | undefined) => `/content/category/${categoryId}/courses`,
    icon: BookOpen,
    title: "Courses",
    description: "Manage course videos and educational content",
    action: "Manage Courses",
    count: 12,
    countLabel: "courses",
    gradient: "from-brand-500/10 via-brand-400/5 to-transparent",
    accentBorder: "group-hover:border-brand-400",
  },
  {
    key: "speaking",
    pathFn: () => "/content/speaking",
    icon: Mic,
    title: "Speaking",
    description: "Manage speaking practice sessions and exercises",
    action: "Manage Speaking",
    count: 8,
    countLabel: "sessions",
    gradient: "from-purple-500/10 via-purple-400/5 to-transparent",
    accentBorder: "group-hover:border-purple-400",
  },
  {
    key: "practices",
    pathFn: () => "/content/practices",
    icon: Briefcase,
    title: "Practice",
    description: "Manage practice details, members, and leadership",
    action: "Manage Practice",
    count: 5,
    countLabel: "practices",
    gradient: "from-indigo-500/10 via-indigo-400/5 to-transparent",
    accentBorder: "group-hover:border-indigo-400",
  },
  {
    key: "questions",
    pathFn: () => "/content/questions",
    icon: HelpCircle,
    title: "Questions",
    description: "Manage questions, quizzes, and assessments",
    action: "Manage Questions",
    count: 34,
    countLabel: "questions",
    gradient: "from-rose-500/10 via-rose-400/5 to-transparent",
    accentBorder: "group-hover:border-rose-400",
  },
] as const

type ContentSection = (typeof contentSections)[number]

export function ContentOverviewPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [category, setCategory] = useState<CourseCategory | null>(null)
  const [sections, setSections] = useState<ContentSection[]>(() => [...contentSections])
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [flowSteps, setFlowSteps] = useState<
    {
      id: string
      type: "lesson" | "practice" | "exam" | "feedback" | "course" | "speaking" | "new_course"
      title: string
      description?: string
    }[]
  >([])

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await getCourseCategories()
        const found = res.data.data.categories.find((c) => c.id === Number(categoryId))
        setCategory(found ?? null)
      } catch (err) {
        console.error("Failed to fetch category:", err)
      }
    }

    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

  // Load category-level flow sequence (if any) from localStorage
  useEffect(() => {
    if (!categoryId) {
      setFlowSteps([])
      return
    }
    const key = `category_flow_${categoryId}`
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setFlowSteps(parsed)
          return
        }
      }
    } catch {
      // ignore and fall back to default
    }

    // No explicit flow saved; fall back to an empty sequence
    setFlowSteps([])
  }, [categoryId])

  // Load persisted section order from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("content_sections_order")
      if (!raw) return
      const savedKeys: string[] = JSON.parse(raw)
      const byKey = new Map(contentSections.map((s) => [s.key, s]))
      const reordered: ContentSection[] = []
      savedKeys.forEach((k) => {
        const item = byKey.get(k as ContentSection["key"])
        if (item) {
          reordered.push(item)
          byKey.delete(k as ContentSection["key"])
        }
      })
      // Append any new sections that weren't in saved order
      byKey.forEach((item) => reordered.push(item))
      if (reordered.length) {
        setSections(reordered)
      }
    } catch {
      // ignore corrupted localStorage
    }
  }, [])

  // Persist order whenever it changes
  useEffect(() => {
    const keys = sections.map((s) => s.key)
    window.localStorage.setItem("content_sections_order", JSON.stringify(keys))
  }, [sections])

  const handleDropOn = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return
    setSections((prev) => {
      const currentIndex = prev.findIndex((s) => s.key === dragKey)
      const targetIndex = prev.findIndex((s) => s.key === targetKey)
      if (currentIndex === -1 || targetIndex === -1) return prev
      const copy = [...prev]
      const [moved] = copy.splice(currentIndex, 1)
      copy.splice(targetIndex, 0, moved)
      return copy
    })
    setDragKey(null)
  }

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/content"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-grayScale-100 bg-white text-grayScale-400 shadow-sm transition-all duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-1.5 text-sm text-grayScale-400">
            <Link to="/content" className="transition-colors hover:text-brand-500">
              Content
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-grayScale-600">
              {category?.name ?? "Overview"}
            </span>
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-grayScale-700">
          {category?.name ?? "Content Management"}
        </h1>
      </div>

      {/* Gradient Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-grayScale-100" />
        </div>
        <div className="relative flex justify-center">
          <div
            className="h-1 w-24 rounded-full"
            style={{
              background: "linear-gradient(90deg, #9E2891 0%, #6A1B9A 100%)",
            }}
          />
        </div>
      </div>

      {/* Cards Grid (course builder style – draggable sections) */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div
              key={section.key}
              className="group"
              draggable
              onDragStart={() => setDragKey(section.key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOn(section.key)}
            >
              <Link to={section.pathFn(categoryId)} className="block">
                <Card
                  className={`relative h-full overflow-hidden border border-grayScale-100 bg-white transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.02] ${section.accentBorder} group-hover:shadow-lg ${
                    dragKey === section.key ? "ring-2 ring-brand-300" : ""
                  }`}
                  style={{
                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Subtle gradient background on icon area */}
                  <div
                    className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${section.gradient} pointer-events-none`}
                  />

                  <CardHeader className="relative pb-2">
                    <div className="mb-4 flex items-start justify-between">
                      {/* Icon with gradient ring */}
                      <div className="relative">
                        <div
                          className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-grayScale-100 transition-all duration-300 group-hover:ring-brand-300 group-hover:shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(158,40,145,0.08) 0%, rgba(106,27,154,0.04) 100%)",
                          }}
                        >
                          <Icon className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        {/* Decorative dot */}
                        <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>

                      {/* Count Badge */}
                      <span className="inline-flex items-center gap-1 rounded-full bg-grayScale-50 px-2.5 py-1 text-xs font-medium text-grayScale-500 ring-1 ring-inset ring-grayScale-100 transition-all duration-300 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:ring-brand-200">
                        {section.count} {section.countLabel}
                      </span>
                    </div>

                    <CardTitle className="text-[15px] font-semibold text-grayScale-700 transition-colors duration-200 group-hover:text-brand-600">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-[13px] leading-relaxed text-grayScale-400">
                      {section.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    {/* Thin separator */}
                    <div className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-grayScale-100 to-transparent" />

                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors duration-200 group-hover:text-brand-600">
                      {section.action}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )
        })}
      </div>
      {/* Category flow sequence (if defined) */}
      {flowSteps.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="border-b border-grayScale-200 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold text-grayScale-600">
                  Learning flow
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-grayScale-400">
                  Sequence of lessons, practice, exams, and feedback for this category.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:auto-cols-fr md:grid-flow-col md:overflow-visible">
              {flowSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex min-w-[200px] flex-col justify-between rounded-xl border border-grayScale-100 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        step.type === "lesson" && "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
                        step.type === "practice" &&
                          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
                        step.type === "exam" &&
                          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
                        step.type === "feedback" &&
                          "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
                        step.type === "course" &&
                          "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
                        step.type === "speaking" &&
                          "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
                        step.type === "new_course" &&
                          "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
                      )}
                    >
                      {step.type === "lesson"
                        ? "Lesson"
                        : step.type === "practice"
                          ? "Practice"
                          : step.type === "exam"
                            ? "Exam / Questions"
                            : step.type === "feedback"
                              ? "Feedback"
                              : step.type === "course"
                                ? "Course"
                                : step.type === "speaking"
                                  ? "Speaking section"
                                  : "New course (category)"}
                      <span className="text-[10px] text-grayScale-400">#{index + 1}</span>
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-grayScale-700 line-clamp-2">
                      {step.title}
                    </p>
                    <p className="text-xs text-grayScale-500 line-clamp-3">
                      {step.description ||
                        (step.type === "exam"
                          ? "Place exams and question sets here."
                          : step.type === "feedback"
                            ? "Collect feedback or run follow‑up surveys."
                            : step.type === "course"
                              ? "Link or add an existing course to this flow."
                              : step.type === "speaking"
                                ? "Speaking or oral practice section."
                                : step.type === "new_course"
                                  ? "Add a new course within this category."
                                  : "Configure this step in the flow builder.")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
