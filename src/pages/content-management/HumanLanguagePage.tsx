import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Languages,
  Lightbulb,
  Link2,
  Loader2,
  Mic,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import {
  addQuestionToSet,
  createPractice,
  createQuestion,
  createCourse,
  createCourseCategory,
  createHumanLanguageLesson,
  createModuleInLevel,
  createSubModuleInModule,
  deleteModule,
  deleteCourse,
  deleteCourseSubCategory,
  deleteQuestionSet,
  deleteQuestion,
  deleteSubModule,
  getHumanLanguageHierarchy,
  getQuestionById,
  getPracticeQuestions,
  getPracticeQuestionsByPractice,
  getQuestionSetById,
  updateQuestionSet,
  updateQuestion,
} from "../../api/courses.api"
import { Badge } from "../../components/ui/badge"
import type {
  CreateQuestionRequest,
  HumanLanguageCourseTree,
  HumanLanguageSubCategoryTree,
  LearningPathPractice,
  LearningPathVideo,
  QuestionDetail,
  QuestionSetQuestion,
} from "../../types/course.types"
import { cn } from "../../lib/utils"
import { toast } from "sonner"
import { Input } from "../../components/ui/input"
import { uploadVideoFile } from "../../api/files.api"
import { resolveMediaPreviewUrl } from "../../lib/practiceMedia"
import {
  createEmptyPracticeQuestionDraft,
  PracticeQuestionEditorFields,
  type PracticeQuestionEditorValue,
} from "../../components/content-management/PracticeQuestionEditorFields"

const CEFR_LEVELS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"] as const
type SubModulePanelTab = "lessons" | "practices"

type SubModuleCardSelection = { lessonId: number | null; practiceId: number | null }

type PracticeQuestionsFetchState =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "ok"; questions: QuestionSetQuestion[]; totalCount: number }
  | { status: "error"; message: string }

type PracticeDialogState =
  | { open: false }
  | {
      open: true
      mode: "create" | "edit"
      subModuleId: number
      practiceId?: number
    }

type QuestionDialogState =
  | { open: false }
  | {
      open: true
      mode: "create" | "edit"
      practiceId: number
      questionId?: number
    }

function formatDurationSeconds(total: number): string {
  const s = Math.max(0, Math.floor(total))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, "0")}`
}

function practiceStatusStyle(status: string): string {
  const u = status.toUpperCase()
  if (u === "PUBLISHED") return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
  if (u === "DRAFT") return "bg-grayScale-50 text-grayScale-600 ring-1 ring-inset ring-grayScale-200"
  if (u === "ARCHIVED") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
  return "bg-grayScale-50 text-grayScale-600 ring-1 ring-inset ring-grayScale-200"
}

function questionTypeBadgeClass(questionType: string): string {
  const t = questionType.toUpperCase().replace(/\s+/g, "_")
  if (t === "MCQ" || t.includes("MULTIPLE")) {
    return "border-transparent bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-200"
  }
  if (t === "TRUE_FALSE" || t.includes("TRUE")) {
    return "border-transparent bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200"
  }
  if (t === "SHORT" || t === "SHORT_ANSWER") {
    return "border-transparent bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
  }
  if (t === "AUDIO") {
    return "border-transparent bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-200"
  }
  return "border-transparent bg-grayScale-100 text-grayScale-700 ring-1 ring-inset ring-grayScale-200"
}

function formatQuestionTypeLabel(raw: string): string {
  return String(raw ?? "—")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const URL_REGEX = /(https?:\/\/[^\s<>"')\]]+)/gi

function extractUrls(text: string): string[] {
  const out = text.match(URL_REGEX) ?? []
  return [...new Set(out)]
}

function normalizeUrl(raw: string): string {
  return raw.trim().replace(/[),.;!?]+$/, "")
}

function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  return m?.[1] ? `https://player.vimeo.com/video/${m[1]}` : null
}

function detectMediaType(url: string, hint?: "audio" | "video" | "image"): "audio" | "video" | "image" | "unknown" {
  if (hint) return hint
  const vimeo = getVimeoEmbedUrl(url)
  if (vimeo) return "video"
  const clean = url.split("?")[0].toLowerCase()
  if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/.test(clean)) return "image"
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(clean)) return "video"
  if (/\.(mp3|wav|m4a|aac|ogg|webm)$/.test(clean)) return "audio"
  return "unknown"
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Request timed out")), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}
type CefrLevel = (typeof CEFR_LEVELS)[number]

type PendingRemove = {
  ids: number[]
  target: "sub_module" | "module"
  key: string
  successMessage: string
  title: string
  description: string
}

function MediaPreviewCard({
  urlRaw,
  hint,
  className = "mt-2",
  label,
}: {
  urlRaw: string
  hint?: "audio" | "video" | "image"
  className?: string
  label?: string
}) {
  const normalized = normalizeUrl(urlRaw)
  const [resolvedUrl, setResolvedUrl] = useState(normalized)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!normalized) {
        setResolvedUrl("")
        return
      }
      if (/^https?:\/\//i.test(normalized)) {
        setResolvedUrl(normalized)
        return
      }
      setResolving(true)
      try {
        const url = await resolveMediaPreviewUrl(normalized)
        if (!cancelled) setResolvedUrl(url || normalized)
      } catch {
        if (!cancelled) setResolvedUrl(normalized)
      } finally {
        if (!cancelled) setResolving(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [normalized])

  if (!normalized) return null
  const previewUrl = resolvedUrl || normalized
  const mediaType = detectMediaType(previewUrl, hint)
  const vimeoEmbed = getVimeoEmbedUrl(previewUrl)
  const showPlayer = mediaType === "image" || mediaType === "video" || mediaType === "audio"

  return (
    <div
      className={cn(
        "rounded-lg border border-grayScale-100 bg-white p-3 shadow-sm",
        !showPlayer && "border-dashed bg-grayScale-50/50",
        className,
      )}
    >
      {label ? (
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-grayScale-500">
          {hint === "image" ? (
            <ImageIcon className="h-3 w-3" aria-hidden />
          ) : hint === "audio" ? (
            <Mic className="h-3 w-3" aria-hidden />
          ) : hint === "video" ? (
            <Video className="h-3 w-3" aria-hidden />
          ) : (
            <Link2 className="h-3 w-3" aria-hidden />
          )}
          {label}
        </p>
      ) : null}
      {resolving ? (
        <div className="flex items-center gap-2 rounded-md border border-grayScale-100 bg-grayScale-50 px-3 py-2 text-xs text-grayScale-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Resolving media URL...
        </div>
      ) : mediaType === "image" ? (
        <img
          src={previewUrl}
          alt=""
          className="max-h-52 w-full rounded-md border border-grayScale-200/90 bg-grayScale-50 object-contain"
        />
      ) : mediaType === "video" ? (
        vimeoEmbed ? (
          <iframe
            src={vimeoEmbed}
            title="Vimeo preview"
            className="aspect-video h-auto min-h-[200px] w-full rounded-md border border-grayScale-200/90 bg-black/5"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            controls
            className="max-h-60 w-full rounded-md border border-grayScale-200/90 bg-black/5"
            src={previewUrl}
          />
        )
      ) : mediaType === "audio" ? (
        <audio controls className="h-9 w-full" src={previewUrl} />
      ) : (
        <p className="text-xs text-grayScale-500">Preview not available for this URL type.</p>
      )}
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
      >
        <Link2 className="h-3 w-3 shrink-0" aria-hidden />
        Open link
      </a>
    </div>
  )
}

function nextMissingPositive(values: number[]): number {
  const existing = new Set(values.filter((n) => Number.isFinite(n) && n > 0))
  let candidate = 1
  while (existing.has(candidate)) candidate += 1
  return candidate
}

export function HumanLanguagePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [subCategories, setSubCategories] = useState<HumanLanguageSubCategoryTree[]>([])
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | "ALL">("ALL")
  const [selectedCourseId, setSelectedCourseId] = useState<number | "ALL">("ALL")
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel | "ALL">("ALL")
  const [collapsedLevels, setCollapsedLevels] = useState<string[]>([])
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<number[]>([])
  const [collapsedSubModuleIds, setCollapsedSubModuleIds] = useState<number[]>([])
  const [creatingKey, setCreatingKey] = useState<string | null>(null)
  const [quickSubCategoryName, setQuickSubCategoryName] = useState("")
  const [quickCourseName, setQuickCourseName] = useState("")
  const [quickSearch, setQuickSearch] = useState("")
  const [quickCreating, setQuickCreating] = useState(false)
  const [subCategoryTargetDelete, setSubCategoryTargetDelete] = useState<{ id: number; name: string } | null>(null)
  const [courseTargetDelete, setCourseTargetDelete] = useState<{ id: number; name: string } | null>(null)
  const [deletingSubCategory, setDeletingSubCategory] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  /** Course IDs whose path body is collapsed (headers stay visible). */
  const [collapsedPathIds, setCollapsedPathIds] = useState<number[]>([])
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null)
  /** Per sub-module panel tab (lessons vs practices). */
  const [subModulePanelTab, setSubModulePanelTab] = useState<Record<string, SubModulePanelTab>>({})
  /** Selected lesson / practice card per sub-module (for inline detail panel). */
  const [subModuleCardSelection, setSubModuleCardSelection] = useState<Record<string, SubModuleCardSelection>>({})
  const [practiceQuestionsState, setPracticeQuestionsState] = useState<Record<number, PracticeQuestionsFetchState>>({})
  const [practiceDialog, setPracticeDialog] = useState<PracticeDialogState>({ open: false })
  const [questionDialog, setQuestionDialog] = useState<QuestionDialogState>({ open: false })
  const [practiceForm, setPracticeForm] = useState({
    title: "",
    description: "",
    persona: "",
    introVideoUrl: "",
    passingScore: 50,
    timeLimitMinutes: 60,
    shuffleQuestions: false,
  })
  const [questionDraft, setQuestionDraft] = useState<PracticeQuestionEditorValue>(() => createEmptyPracticeQuestionDraft())
  const [questionDetailById, setQuestionDetailById] = useState<Record<number, QuestionDetail>>({})
  const [practiceTargetDelete, setPracticeTargetDelete] = useState<{ id: number; title: string } | null>(null)
  const [questionTargetDelete, setQuestionTargetDelete] = useState<{ id: number; practiceId: number; text: string } | null>(null)
  const [savingPractice, setSavingPractice] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [deletingPractice, setDeletingPractice] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState(false)
  /** While fetching full question detail before opening the edit dialog (avoids empty form flash). */
  const [loadingQuestionEditId, setLoadingQuestionEditId] = useState<number | null>(null)
  /** Show inline field errors only after an explicit save attempt (avoids noisy empty-state on open). */
  const [practiceSubmitAttempted, setPracticeSubmitAttempted] = useState(false)
  const [questionSubmitAttempted, setQuestionSubmitAttempted] = useState(false)
  const [practiceFormTouched, setPracticeFormTouched] = useState(false)
  const [questionFormTouched, setQuestionFormTouched] = useState(false)
  const [loadingPracticeForm, setLoadingPracticeForm] = useState(false)
  const [uploadingPracticeIntroVideo, setUploadingPracticeIntroVideo] = useState(false)

  const renderMediaPreview = (
    urlRaw: string,
    hint?: "audio" | "video" | "image",
    className = "mt-2",
    label?: string,
  ) => <MediaPreviewCard urlRaw={urlRaw} hint={hint} className={className} label={label} />

  const loadHierarchy = async () => {
    setLoading(true)
    try {
      const res = await getHumanLanguageHierarchy()
      const data = res.data?.data
      setCategoryId(data?.category_id ?? null)
      const nextSubCategories = data?.sub_categories ?? []
      setSubCategories(nextSubCategories)
      // Default UI behavior: modules and sub-modules start collapsed.
      const moduleIds = nextSubCategories.flatMap((subCategory) =>
        subCategory.courses.flatMap((course) =>
          course.levels.flatMap((levelNode) => levelNode.modules.map((module) => module.id)),
        ),
      )
      const subModuleIds = nextSubCategories.flatMap((subCategory) =>
        subCategory.courses.flatMap((course) =>
          course.levels.flatMap((levelNode) =>
            levelNode.modules.flatMap((module) => module.sub_modules.map((subModule) => subModule.id)),
          ),
        ),
      )
      setCollapsedModuleIds(moduleIds)
      setCollapsedSubModuleIds(subModuleIds)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        await loadHierarchy()
      } finally {
        setLoading(false)
      }
    }
    run().catch(() => undefined)
  }, [])

  const filteredSubCategories = useMemo(
    () =>
      selectedSubCategoryId === "ALL"
        ? subCategories
        : subCategories.filter((s) => s.sub_category_id === selectedSubCategoryId),
    [subCategories, selectedSubCategoryId],
  )

  const availableCourses = useMemo(() => {
    return filteredSubCategories.flatMap((s) => s.courses)
  }, [filteredSubCategories])

  const selectedCourses = useMemo(
    () =>
      selectedCourseId === "ALL"
        ? availableCourses
        : availableCourses.filter((c) => c.course_id === selectedCourseId),
    [availableCourses, selectedCourseId],
  )

  /** A1 always; A2–C3 only after that level has at least one module (incremental UI). */
  const visibleCefrLevels = useMemo(() => {
    if (availableCourses.length === 0) return [] as CefrLevel[]
    const out: CefrLevel[] = []
    for (const level of CEFR_LEVELS) {
      if (level === "A1") {
        out.push(level)
        continue
      }
      const hasContent = selectedCourses.some((c) => {
        const node = c.levels.find((item) => item.level.toUpperCase() === level)
        return node !== undefined && (node.modules?.length ?? 0) > 0
      })
      if (hasContent) out.push(level)
    }
    return out
  }, [availableCourses.length, selectedCourses])

  useEffect(() => {
    if (selectedLevel === "ALL") return
    if (!visibleCefrLevels.includes(selectedLevel)) {
      setSelectedLevel("ALL")
    }
  }, [selectedLevel, visibleCefrLevels])

  const toggleLevel = (levelKey: string) => {
    setCollapsedLevels((prev) => (prev.includes(levelKey) ? prev.filter((l) => l !== levelKey) : [...prev, levelKey]))
  }

  const togglePathCollapsed = (courseId: number) => {
    setCollapsedPathIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    )
  }

  const toggleModuleCollapsed = (moduleId: number) => {
    setCollapsedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
    )
  }

  const toggleSubModuleCollapsed = (subModuleId: number) => {
    setCollapsedSubModuleIds((prev) =>
      prev.includes(subModuleId) ? prev.filter((id) => id !== subModuleId) : [...prev, subModuleId],
    )
  }

  const levelsWithContentForCourse = (course: HumanLanguageCourseTree) =>
    course.levels.filter((l) => (l.modules?.length ?? 0) > 0).map((l) => l.level.toUpperCase())

  const parseModuleNumber = (title: string): number | null => {
    const match = title.match(/module-(\d+)/i)
    if (!match) return null
    const value = Number(match[1])
    return Number.isFinite(value) ? value : null
  }

  const parseSubModuleNumber = (title: string): { module: number; sub: number } | null => {
    const match = title.match(/(?:sub-)?module-(\d+)\.(\d+)/i)
    if (!match) return null
    const module = Number(match[1])
    const sub = Number(match[2])
    if (!Number.isFinite(module) || !Number.isFinite(sub)) return null
    return { module, sub }
  }

  const handleCreateModule = async (
    courseId: number,
    levelNode: HumanLanguageCourseTree["levels"][number] | undefined,
    modules: { title: string }[],
  ) => {
    if (!levelNode?.level_id) {
      toast.error("Cannot create module: missing level identifier")
      return
    }
    const level = levelNode.level
    const key = `module-${courseId}-${level}`
    setCreatingKey(key)
    try {
      const usedNumbers = modules
        .map((m) => parseModuleNumber(m.title))
        .filter((v): v is number => v !== null && v > 0)
      const next = nextMissingPositive(usedNumbers)
      const title = `Module-${next}`
      await createModuleInLevel(levelNode.level_id, title, `${level} ${title}`, next)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to create module:", error)
      toast.error("Failed to create module")
    } finally {
      setCreatingKey(null)
    }
  }

  const handleCreateSubModule = async (
    courseId: number,
    level: string,
    moduleId: number,
    moduleTitle: string,
    existingSubModules: { title: string }[],
  ) => {
    const moduleNo = parseModuleNumber(moduleTitle)
    if (!moduleNo) {
      toast.error("Cannot derive module number from title")
      return
    }
    const key = `submodule-${courseId}-${level}-${moduleNo}`
    setCreatingKey(key)
    try {
      const usedNumbers = existingSubModules
        .map((s) => parseSubModuleNumber(s.title))
        .filter((v): v is { module: number; sub: number } => v !== null && v.module === moduleNo)
        .map((item) => item.sub)
      const next = nextMissingPositive(usedNumbers)
      const title = `Module-${moduleNo}.${next}`
      await createSubModuleInModule(moduleId, title, `${level} ${title}`, next)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to create sub-module:", error)
      toast.error("Failed to create sub-module")
    } finally {
      setCreatingKey(null)
    }
  }

  const requestRemove = (payload: PendingRemove) => {
    if (payload.ids.length === 0) return
    setPendingRemove(payload)
  }

  const executePendingRemove = async () => {
    if (!pendingRemove) return
    const { ids, target, key, successMessage } = pendingRemove
    setPendingRemove(null)
    setDeletingKey(key)
    try {
      for (const id of ids) {
        if (target === "module") {
          await deleteModule(id)
        } else {
          await deleteSubModule(id)
        }
      }
      toast.success(successMessage)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to delete item(s):", error)
      toast.error("Failed to delete item(s)")
    } finally {
      setDeletingKey(null)
    }
  }

  const handleCreateNextLevelForCourse = async (courseId: number) => {
    const course = availableCourses.find((c) => c.course_id === courseId)
    if (!course) {
      toast.error("Course not found")
      return
    }
    const existing = new Set(levelsWithContentForCourse(course))
    const next = CEFR_LEVELS.find((level) => !existing.has(level))
    if (!next) {
      toast.error("All CEFR levels (A1–C3) already have content for this path")
      return
    }
    const key = `next-level-${courseId}-${next}`
    setCreatingKey(key)
    try {
      await createHumanLanguageLesson({
        course_id: courseId,
        cefr_level: next,
        title: "Module-1",
        description: `${next} Module-1`,
      })
      toast.success(`${next} created with Module-1`)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to create next level:", error)
      toast.error("Failed to create next level")
    } finally {
      setCreatingKey(null)
    }
  }

  const handleQuickCreatePath = async () => {
    if (!quickSubCategoryName.trim() || !quickCourseName.trim()) {
      toast.error("Subcategory and course names are required")
      return
    }
    setQuickCreating(true)
    try {
      let effectiveCategoryId = categoryId
      if (!effectiveCategoryId) {
        const createdCategory = await createCourseCategory({ name: "Human Language" })
        effectiveCategoryId = createdCategory.data?.data?.id ?? null
        setCategoryId(effectiveCategoryId)
      }
      if (!effectiveCategoryId) {
        throw new Error("Missing human language category id")
      }

      const createdSubCategory = await createCourseCategory({
        name: quickSubCategoryName.trim(),
        parent_id: effectiveCategoryId,
      })
      const subCategoryId = createdSubCategory.data?.data?.id
      if (!subCategoryId) {
        throw new Error("Failed to create subcategory")
      }

      await createCourse({
        category_id: effectiveCategoryId,
        sub_category_id: Number(subCategoryId),
        title: quickCourseName.trim(),
        description: `${quickSubCategoryName.trim()} / ${quickCourseName.trim()}`,
      })
      toast.success("Subcategory/course path created")
      setQuickSubCategoryName("")
      setQuickCourseName("")
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to quick-create language path:", error)
      toast.error("Failed to create subcategory/course path")
    } finally {
      setQuickCreating(false)
    }
  }

  const handleDeleteSelectedSubCategory = async () => {
    if (!subCategoryTargetDelete) return
    setDeletingSubCategory(true)
    try {
      await deleteCourseSubCategory(subCategoryTargetDelete.id)
      toast.success("Sub-category deleted")
      setSubCategoryTargetDelete(null)
      setSelectedSubCategoryId("ALL")
      setSelectedCourseId("ALL")
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to delete sub-category:", error)
      toast.error("Failed to delete sub-category")
    } finally {
      setDeletingSubCategory(false)
    }
  }

  const handleDeleteSelectedCourse = async () => {
    if (!courseTargetDelete) return
    setDeletingCourse(true)
    try {
      await deleteCourse(courseTargetDelete.id)
      toast.success("Course deleted")
      setCourseTargetDelete(null)
      setSelectedCourseId("ALL")
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to delete course:", error)
      toast.error("Failed to delete course")
    } finally {
      setDeletingCourse(false)
    }
  }

  const loadPracticeQuestionsIfNeeded = async (practiceId: number, forceRefresh = false) => {
    let skipFetch = false
    setPracticeQuestionsState((prev) => {
      const ex = prev[practiceId]
      if (!forceRefresh && ex?.status === "ok") {
        skipFetch = true
        return prev
      }
      if (!forceRefresh && ex?.status === "loading" && Date.now() - ex.startedAt < 15000) {
        skipFetch = true
        return prev
      }
      return { ...prev, [practiceId]: { status: "loading", startedAt: Date.now() } }
    })
    if (skipFetch) return
    try {
      let questions: QuestionSetQuestion[] = []
      let totalCount = 0
      try {
        const res = await withTimeout(getPracticeQuestionsByPractice(practiceId, { limit: 200, offset: 0 }), 12000)
        const payload = res.data?.data
        questions = payload?.questions ?? []
        totalCount = payload?.total_count ?? questions.length
      } catch {
        // Fallback endpoint for environments where /practices/:id/questions can hang.
        const fallback = await withTimeout(getPracticeQuestions(practiceId), 12000)
        questions = fallback.data?.data ?? []
        totalCount = questions.length
      }
      setPracticeQuestionsState((prev) => ({
        ...prev,
        [practiceId]: { status: "ok", questions, totalCount },
      }))
    } catch (error) {
      console.error("Failed to load practice questions:", error)
      setPracticeQuestionsState((prev) => ({
        ...prev,
        [practiceId]: { status: "error", message: "Could not load questions" },
      }))
    }
  }

  const getSubModuleSelection = (smKey: string): SubModuleCardSelection =>
    subModuleCardSelection[smKey] ?? { lessonId: null, practiceId: null }

  const resetPracticeForm = () =>
    setPracticeForm({
      title: "",
      description: "",
      persona: "",
      introVideoUrl: "",
      passingScore: 50,
      timeLimitMinutes: 60,
      shuffleQuestions: false,
    })
  const resetQuestionForm = () => {
    setQuestionDraft(createEmptyPracticeQuestionDraft())
  }

  const openCreatePracticeDialog = (courseId: number, subModuleId: number) => {
    if (!categoryId) {
      toast.error("Category is not ready yet. Please try again.")
      return
    }
    navigate(`/content/human-language/${categoryId}/${courseId}/sub-module/${subModuleId}/add-practice`)
  }

  const openEditPracticeDialog = async (subModuleId: number, p: LearningPathPractice) => {
    setPracticeSubmitAttempted(false)
    setPracticeFormTouched(false)
    setPracticeDialog({ open: true, mode: "edit", subModuleId, practiceId: p.id })
    setLoadingPracticeForm(true)
    try {
      const detail = (await getQuestionSetById(p.id)).data?.data
      setPracticeForm({
        title: detail?.title ?? p.title ?? "",
        description: detail?.description ?? "",
        persona: detail?.persona ?? "",
        introVideoUrl: detail?.intro_video_url ?? "",
        passingScore: detail?.passing_score ?? 50,
        timeLimitMinutes: detail?.time_limit_minutes ?? 60,
        shuffleQuestions: detail?.shuffle_questions ?? false,
      })
    } catch (error) {
      console.error("Failed to load practice detail:", error)
      setPracticeForm({
        title: p.title ?? "",
        description: "",
        persona: "",
        introVideoUrl: "",
        passingScore: 50,
        timeLimitMinutes: 60,
        shuffleQuestions: false,
      })
      toast.error("Could not load full practice details")
    } finally {
      setLoadingPracticeForm(false)
    }
  }

  const practiceFieldErrors = useMemo(() => {
    const title = practiceForm.title.trim()
    return {
      title: title ? undefined : "Title is required.",
    }
  }, [practiceForm.title])

  const practiceCanSave = !practiceFieldErrors.title

  const handleSavePractice = async () => {
    if (!practiceDialog.open) return
    if (!practiceCanSave) {
      setPracticeSubmitAttempted(true)
      return
    }
    setSavingPractice(true)
    try {
      if (practiceDialog.mode === "create") {
        await createPractice({
          sub_course_id: practiceDialog.subModuleId,
          title: practiceForm.title.trim(),
          description: practiceForm.description.trim(),
          persona: practiceForm.persona.trim() || undefined,
        })
        toast.success("Practice created")
      } else if (practiceDialog.practiceId) {
        await updateQuestionSet(practiceDialog.practiceId, {
          title: practiceForm.title.trim(),
          description: practiceForm.description.trim() || undefined,
          persona: practiceForm.persona.trim() || undefined,
          intro_video_url: practiceForm.introVideoUrl.trim() || undefined,
          passing_score: Number.isFinite(practiceForm.passingScore) ? practiceForm.passingScore : undefined,
          time_limit_minutes: Number.isFinite(practiceForm.timeLimitMinutes) ? practiceForm.timeLimitMinutes : undefined,
          shuffle_questions: practiceForm.shuffleQuestions,
        })
        toast.success("Practice updated")
      }
      setPracticeDialog({ open: false })
      setPracticeSubmitAttempted(false)
      setPracticeFormTouched(false)
      resetPracticeForm()
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to save practice:", error)
      toast.error("Failed to save practice")
    } finally {
      setSavingPractice(false)
    }
  }

  const handlePracticeIntroVideoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploadingPracticeIntroVideo(true)
    try {
      const uploadRes = await uploadVideoFile(file, {
        title: practiceForm.title.trim() || file.name.replace(/\.[^.]+$/, "") || "Practice intro",
        description: practiceForm.description.trim() || undefined,
      })
      const finalUrl = uploadRes.data?.data?.embed_url?.trim()
        ? `${uploadRes.data.data.embed_url}?h=${uploadRes.data.data.url?.split("/").filter(Boolean).at(-1) ?? ""}`
        : uploadRes.data?.data?.url?.trim()
      if (!finalUrl) throw new Error("Missing uploaded video url")
      setPracticeForm((prev) => ({ ...prev, introVideoUrl: finalUrl }))
      toast.success("Intro video uploaded")
    } catch (error) {
      console.error("Failed to upload intro video:", error)
      toast.error("Failed to upload intro video")
    } finally {
      setUploadingPracticeIntroVideo(false)
    }
  }

  const openCreateQuestionDialog = (practiceId: number) => {
    setQuestionSubmitAttempted(false)
    setQuestionFormTouched(false)
    resetQuestionForm()
    setQuestionDialog({ open: true, mode: "create", practiceId })
  }

  const openEditQuestionDialog = async (practiceId: number, question: QuestionSetQuestion) => {
    setQuestionSubmitAttempted(false)
    setQuestionFormTouched(false)
    const qid = question.question_id ?? question.id
    resetQuestionForm()
    setLoadingQuestionEditId(qid)
    try {
      const detail = questionDetailById[qid] ?? (await getQuestionById(qid)).data?.data
      if (!detail) {
        toast.error("Could not load question details")
        return
      }
      setQuestionDetailById((prev) => ({ ...prev, [qid]: detail }))
      const sortedOpts = (detail.options ?? []).slice().sort((a, b) => a.option_order - b.option_order)
      const shortAnswer =
        Array.isArray(detail.short_answers) && detail.short_answers.length > 0
          ? typeof detail.short_answers[0] === "string"
            ? detail.short_answers[0]
            : detail.short_answers[0]?.acceptable_answer ?? ""
          : ""
      const qt = detail.question_type
      let questionType: PracticeQuestionEditorValue["questionType"] = "MCQ"
      if (qt === "TRUE_FALSE") questionType = "TRUE_FALSE"
      else if (qt === "SHORT" || qt === "SHORT_ANSWER") questionType = "SHORT"
      else if (qt === "AUDIO") questionType = "AUDIO"
      const difficultyRaw = detail.difficulty_level
      const difficultyLevel =
        difficultyRaw === "EASY" || difficultyRaw === "MEDIUM" || difficultyRaw === "HARD" ? difficultyRaw : "EASY"

      let options: PracticeQuestionEditorValue["options"]
      if (questionType === "TRUE_FALSE") {
        const trueRow =
          sortedOpts.find((o) => /\btrue\b/i.test((o.option_text ?? "").trim())) ?? sortedOpts[0]
        const falseRow =
          sortedOpts.find((o) => /\bfalse\b/i.test((o.option_text ?? "").trim())) ?? sortedOpts[1]
        const correctIsTrue =
          trueRow?.is_correct === true
            ? true
            : falseRow?.is_correct === true
              ? false
              : true
        options = [
          { text: "True", isCorrect: correctIsTrue },
          { text: "False", isCorrect: !correctIsTrue },
        ]
      } else {
        options =
          sortedOpts.length > 0
            ? sortedOpts.map((o) => ({
                text: o.option_text ?? "",
                isCorrect: !!o.is_correct,
              }))
            : createEmptyPracticeQuestionDraft().options
        if (!options.some((o) => o.isCorrect) && options.length > 0) {
          options = options.map((o, i) => ({ ...o, isCorrect: i === 0 }))
        }
      }

      setQuestionDraft({
        questionText: detail.question_text ?? "",
        questionType,
        difficultyLevel,
        points: detail.points && detail.points > 0 ? detail.points : 1,
        tips: detail.tips ?? "",
        explanation: detail.explanation ?? "",
        options,
        voicePrompt: detail.voice_prompt ?? "",
        sampleAnswerVoicePrompt: detail.sample_answer_voice_prompt ?? "",
        audioCorrectAnswerText: detail.audio_correct_answer_text ?? "",
        shortAnswer,
        imageUrl: detail.image_url ?? "",
      })
      // Open only after the same form shape as create is fully populated (no empty-state flash).
      setQuestionDialog({ open: true, mode: "edit", practiceId, questionId: qid })
    } catch (error) {
      console.error("Failed to load question detail:", error)
      toast.error("Could not load question details")
    } finally {
      setLoadingQuestionEditId(null)
    }
  }

  const buildQuestionPayload = (): CreateQuestionRequest => {
    const d = questionDraft
    const payload: CreateQuestionRequest = {
      question_text: d.questionText.trim(),
      question_type: d.questionType,
      difficulty_level: d.difficultyLevel,
      points: Number(d.points) || 1,
      tips: d.tips.trim() || undefined,
      explanation: d.explanation.trim() || undefined,
      image_url: d.imageUrl.trim() || undefined,
      voice_prompt: d.voicePrompt.trim() || undefined,
      sample_answer_voice_prompt: d.sampleAnswerVoicePrompt.trim() || undefined,
      audio_correct_answer_text: d.audioCorrectAnswerText.trim() || undefined,
      status: "PUBLISHED",
    }
    if (d.questionType === "SHORT") {
      payload.short_answers = d.shortAnswer.trim()
        ? [
            { acceptable_answer: d.shortAnswer.trim(), match_type: "EXACT" },
            { acceptable_answer: d.shortAnswer.trim(), match_type: "CASE_INSENSITIVE" },
          ]
        : undefined
      return payload
    }
    if (d.questionType === "TRUE_FALSE") {
      const trueCorrect = d.options[0]?.isCorrect === true && d.options[1]?.isCorrect !== true
      payload.options = [
        { option_order: 1, option_text: "True", is_correct: trueCorrect },
        { option_order: 2, option_text: "False", is_correct: !trueCorrect },
      ]
      return payload
    }
    if (d.questionType === "MCQ") {
      const filtered = d.options.filter((o) => o.text.trim())
      payload.options = filtered.map((o, idx) => ({
        option_order: idx + 1,
        option_text: o.text.trim(),
        is_correct: o.isCorrect,
      }))
    }
    return payload
  }

  const questionFieldErrors = useMemo(() => {
    const errors: {
      questionText?: string
      points?: string
      shortAnswer?: string
      options?: string
      correctOption?: string
    } = {}
    const d = questionDraft
    if (!d.questionText.trim()) errors.questionText = "Question text is required."
    const pts = Number(d.points)
    if (!Number.isFinite(pts) || pts < 1) errors.points = "Enter a valid number (minimum 1)."
    if (d.questionType === "SHORT" && !d.shortAnswer.trim()) {
      errors.shortAnswer = "Expected answer is required for short-answer questions."
    }
    if (d.questionType === "MCQ") {
      const filled = d.options.filter((o) => o.text.trim()).length
      if (filled < 2) errors.options = "Enter at least two non-empty options."
      const correctIdx = d.options.findIndex((o) => o.isCorrect)
      if (correctIdx >= 0 && !d.options[correctIdx]?.text?.trim()) {
        errors.correctOption = "The marked correct option must include text."
      }
    }
    return errors
  }, [questionDraft])

  const questionCanSave = Object.keys(questionFieldErrors).length === 0

  const handleSaveQuestion = async () => {
    if (!questionDialog.open) return
    if (!questionCanSave) {
      setQuestionSubmitAttempted(true)
      return
    }
    setSavingQuestion(true)
    try {
      const payload = buildQuestionPayload()
      if (questionDialog.mode === "create") {
        const created = await createQuestion(payload)
        const questionId = created.data?.data?.id
        if (!questionId) throw new Error("Missing created question id")
        await addQuestionToSet(questionDialog.practiceId, { question_id: questionId })
        toast.success("Question created")
      } else if (questionDialog.questionId) {
        await updateQuestion(questionDialog.questionId, payload)
        toast.success("Question updated")
      }
      setQuestionDialog({ open: false })
      setQuestionSubmitAttempted(false)
      setQuestionFormTouched(false)
      resetQuestionForm()
      await Promise.all([
        loadPracticeQuestionsIfNeeded(questionDialog.practiceId, true),
        loadHierarchy(),
      ])
    } catch (error) {
      console.error("Failed to save question:", error)
      toast.error("Failed to save question")
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleDeletePracticeConfirmed = async () => {
    if (!practiceTargetDelete) return
    setDeletingPractice(true)
    try {
      await deleteQuestionSet(practiceTargetDelete.id)
      toast.success("Practice deleted")
      setPracticeTargetDelete(null)
      await loadHierarchy()
    } catch (error) {
      console.error("Failed to delete practice:", error)
      toast.error("Failed to delete practice")
    } finally {
      setDeletingPractice(false)
    }
  }

  const handleDeleteQuestionConfirmed = async () => {
    if (!questionTargetDelete) return
    setDeletingQuestion(true)
    try {
      await deleteQuestion(questionTargetDelete.id)
      toast.success("Question deleted")
      await Promise.all([
        loadPracticeQuestionsIfNeeded(questionTargetDelete.practiceId, true),
        loadHierarchy(),
      ])
      setQuestionTargetDelete(null)
    } catch (error) {
      console.error("Failed to delete question:", error)
      toast.error("Failed to delete question")
    } finally {
      setDeletingQuestion(false)
    }
  }

  const toggleLessonCard = (smKey: string, lessonId: number) => {
    setSubModuleCardSelection((prev) => {
      const cur = prev[smKey] ?? { lessonId: null, practiceId: null }
      const nextLessonId = cur.lessonId === lessonId ? null : lessonId
      return { ...prev, [smKey]: { ...cur, lessonId: nextLessonId } }
    })
  }

  const togglePracticeCard = (smKey: string, practiceId: number) => {
    const currentPracticeId = subModuleCardSelection[smKey]?.practiceId ?? null
    const nextPracticeId = currentPracticeId === practiceId ? null : practiceId
    setSubModuleCardSelection((prev) => {
      const cur = prev[smKey] ?? { lessonId: null, practiceId: null }
      return { ...prev, [smKey]: { ...cur, practiceId: nextPracticeId } }
    })
    if (nextPracticeId !== null) void loadPracticeQuestionsIfNeeded(nextPracticeId)
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <div className="overflow-hidden rounded-3xl border border-brand-100/70 bg-gradient-to-r from-white via-brand-50/20 to-violet-50/40 p-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-100 p-2.5 text-brand-700 shadow-sm ring-1 ring-brand-200/70">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-grayScale-900">Human Language Content</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-grayScale-600">
                Manage CEFR learning paths from A1 to C3 with quick lesson and practice oversight.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-grayScale-700 ring-1 ring-grayScale-200">
              {selectedCourses.length} path{selectedCourses.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-grayScale-700 ring-1 ring-grayScale-200">
              {subCategories.length} sub-categor{subCategories.length === 1 ? "y" : "ies"}
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-grayScale-700 ring-1 ring-grayScale-200">
              {visibleCefrLevels.length} level{visibleCefrLevels.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <Card className="sticky top-3 z-20 border-grayScale-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-grayScale-900">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Subcategory</label>
            <select
              className="h-11 w-full rounded-xl border border-grayScale-200 bg-white px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              value={selectedSubCategoryId}
              onChange={(e) =>
                setSelectedSubCategoryId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
            >
              <option value="ALL">All subcategories</option>
              {subCategories.map((subCategory) => (
                <option key={subCategory.sub_category_id} value={subCategory.sub_category_id}>
                  {subCategory.sub_category_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Course</label>
            <select
              className="h-11 w-full rounded-xl border border-grayScale-200 bg-white px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              value={selectedCourseId}
              onChange={(e) =>
                setSelectedCourseId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
              }
            >
              <option value="ALL">All courses</option>
              {availableCourses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-grayScale-500">Fetch lessons by level</label>
            <select
              className="h-11 w-full rounded-xl border border-grayScale-200 bg-white px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as CefrLevel | "ALL")}
            >
              <option value="ALL">ALL LEVELS</option>
              {visibleCefrLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          disabled={selectedSubCategoryId === "ALL"}
          onClick={() => {
            if (selectedSubCategoryId === "ALL") return
            const selected = subCategories.find((s) => s.sub_category_id === selectedSubCategoryId)
            setSubCategoryTargetDelete({
              id: Number(selectedSubCategoryId),
              name: selected?.sub_category_name ?? `Sub-category ${selectedSubCategoryId}`,
            })
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete selected sub-category
        </Button>

        <Button
          type="button"
          variant="outline"
          className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          disabled={selectedCourseId === "ALL"}
          onClick={() => {
            if (selectedCourseId === "ALL") return
            const selected = availableCourses.find((c) => c.course_id === selectedCourseId)
            setCourseTargetDelete({
              id: Number(selectedCourseId),
              name: selected?.course_name ?? `Course ${selectedCourseId}`,
            })
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete selected course
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-grayScale-500">
          <SpinnerIcon className="h-4 w-4" />
          Loading human language lessons...
        </div>
      ) : (
        <div className="space-y-4">
          {availableCourses.length === 0 ? (
            <Card className="overflow-hidden border-grayScale-200/80">
              <div className="flex items-center justify-between border-b border-grayScale-100 bg-white px-5 py-4">
                <h3 className="text-lg font-semibold text-grayScale-800">Sub-category Management</h3>
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                  <input
                    className="h-11 w-full rounded-xl border border-grayScale-200 bg-white pl-9 pr-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    placeholder="Search sub-categories..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                  />
                </div>
              </div>
              <CardContent className="p-5">
                <div className="rounded-2xl border border-dashed border-grayScale-300 bg-grayScale-50/20 px-6 py-10 text-center">
                  <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700">
                    <Languages className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-semibold text-grayScale-800">No sub-categories yet</h4>
                  <p className="mt-2 text-sm text-grayScale-500">
                    Create your first human-language path. Level listing will appear automatically after creation.
                  </p>
                  <div className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-2 md:grid-cols-3">
                    <input
                      className="h-11 rounded-xl border border-grayScale-200 bg-white px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      placeholder="Subcategory (e.g., English)"
                      value={quickSubCategoryName}
                      onChange={(e) => setQuickSubCategoryName(e.target.value)}
                    />
                    <input
                      className="h-11 rounded-xl border border-grayScale-200 bg-white px-3 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      placeholder="Course (e.g., Speaking)"
                      value={quickCourseName}
                      onChange={(e) => setQuickCourseName(e.target.value)}
                    />
                    <Button onClick={handleQuickCreatePath} disabled={quickCreating}>
                      {quickCreating ? "Creating..." : "Add your first sub-category"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {availableCourses.length > 0
            ? selectedCourses.map((course: HumanLanguageCourseTree) => {
                const courseLevels = CEFR_LEVELS.filter((level) => {
                  if (level === "A1") return true
                  const node = course.levels.find((item) => item.level.toUpperCase() === level)
                  return (node?.modules?.length ?? 0) > 0
                }).filter((level) => selectedLevel === "ALL" || selectedLevel === level)

                const pathCollapsed = collapsedPathIds.includes(course.course_id)
                const levelsDone = levelsWithContentForCourse(course)
                const nextCefrForPath = CEFR_LEVELS.find((l) => !levelsDone.includes(l))
                const pathNextLevelLoading = creatingKey?.startsWith(`next-level-${course.course_id}-`) ?? false
                const pathLevelsFull = levelsDone.length >= CEFR_LEVELS.length

                return (
                  <Card key={course.course_id} className="overflow-hidden border-grayScale-200/80 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grayScale-100 bg-gradient-to-r from-white to-grayScale-50/40 px-4 py-3.5">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        onClick={() => togglePathCollapsed(course.course_id)}
                      >
                        {pathCollapsed ? (
                          <ChevronRight className="h-5 w-5 shrink-0 text-grayScale-500" aria-hidden />
                        ) : (
                          <ChevronDown className="h-5 w-5 shrink-0 text-grayScale-500" aria-hidden />
                        )}
                        <span className="text-base font-semibold text-brand-700">{course.course_name}</span>
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                          {levelsDone.length}/{CEFR_LEVELS.length} levels
                        </span>
                      </button>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0"
                          title={
                            pathLevelsFull
                              ? "All CEFR levels already have content for this path"
                              : nextCefrForPath
                                ? `Create ${nextCefrForPath} with Module-1`
                                : undefined
                          }
                          disabled={pathLevelsFull || pathNextLevelLoading}
                          onClick={() => handleCreateNextLevelForCourse(course.course_id)}
                        >
                          {pathNextLevelLoading ? "Creating…" : "Add next CEFR level"}
                        </Button>
                      </div>
                    </div>
                    {!pathCollapsed ? (
                    <CardContent className="space-y-3 p-4 sm:p-5">
                      {courseLevels.length === 0 ? (
                        <p className="text-sm text-grayScale-500">No levels match the current level filter.</p>
                      ) : (
                        courseLevels.map((level) => {
                          const levelNode = course.levels.find((item) => item.level.toUpperCase() === level)
                          const modules = levelNode?.modules ?? []
                          const levelKey = `${course.course_id}-${level}`
                          const levelRemoveIds = modules.map((m) => m.id)
                          const canRemoveLevel = levelRemoveIds.length > 0
                          return (
                            <div key={levelKey} className="overflow-hidden rounded-xl border border-grayScale-200/90 bg-white shadow-sm">
                              <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/80 to-white px-4 py-3">
                                <button
                                  type="button"
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                  onClick={() => toggleLevel(levelKey)}
                                >
                                  {collapsedLevels.includes(levelKey) ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                                  <span className="text-sm font-semibold text-grayScale-900">{level}</span>
                                  <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                                    {modules.length} module(s)
                                  </span>
                                </button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  title={!canRemoveLevel ? "Nothing to remove at this level" : `Remove all content at ${level} for ${course.course_name}`}
                                  className="h-8 shrink-0 gap-1 border-red-200/90 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                  disabled={!canRemoveLevel || deletingKey === `level-${course.course_id}-${level}`}
                                  onClick={() =>
                                    requestRemove({
                                      ids: levelRemoveIds,
                                      target: "module",
                                      key: `level-${course.course_id}-${level}`,
                                      successMessage: `Level ${level} removed`,
                                      title: `Remove level ${level}?`,
                                      description: `This will permanently delete all modules and sub-modules under ${level} for “${course.course_name}”. This action cannot be undone.`,
                                    })
                                  }
                                >
                                  <Trash2 className="h-3 w-3.5" aria-hidden />
                                  Remove
                                </Button>
                              </div>
                              {!collapsedLevels.includes(levelKey) ? (
                                <div className="space-y-2.5 p-3.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 border-grayScale-200 bg-white text-xs hover:border-brand-200 hover:bg-brand-50/40"
                                      onClick={() => handleCreateModule(course.course_id, levelNode, modules)}
                                      disabled={creatingKey === `module-${course.course_id}-${level}`}
                                    >
                                      {creatingKey === `module-${course.course_id}-${level}` ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                      )}
                                      Add Module
                                    </Button>
                                  </div>
                                  {modules.length === 0 ? (
                                    <p className="text-xs text-grayScale-500">No modules yet. Use “Add Module” to start.</p>
                                  ) : (
                                    modules.map((module) => (
                                      <div key={module.id} className="rounded-xl border border-grayScale-100 bg-gradient-to-b from-grayScale-50/70 to-white p-3.5">
                                        {(() => {
                                          const moduleCollapsed = collapsedModuleIds.includes(module.id)
                                          return (
                                            <>
                                        <div className="flex items-center justify-between gap-2">
                                          <button
                                            type="button"
                                            onClick={() => toggleModuleCollapsed(module.id)}
                                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                          >
                                            {moduleCollapsed ? (
                                              <ChevronRight className="h-4 w-4 shrink-0 text-grayScale-500" />
                                            ) : (
                                              <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-500" />
                                            )}
                                            <p className="truncate text-sm font-semibold text-grayScale-900">Module: {module.title}</p>
                                            <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                                              {module.sub_modules.length} sub-module(s)
                                            </span>
                                          </button>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 border-grayScale-200 bg-white text-xs hover:border-brand-200 hover:bg-brand-50/40"
                                              onClick={() =>
                                                handleCreateSubModule(
                                                  course.course_id,
                                                  level,
                                                  module.id,
                                                  module.title,
                                                  module.sub_modules,
                                                )
                                              }
                                              disabled={creatingKey === `submodule-${course.course_id}-${level}-${parseModuleNumber(module.title) ?? 0}`}
                                            >
                                              {creatingKey === `submodule-${course.course_id}-${level}-${parseModuleNumber(module.title) ?? 0}` ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              ) : (
                                                <Plus className="h-3.5 w-3.5" />
                                              )}
                                              Add Sub-module
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="h-8 gap-1 border-red-200/90 bg-white px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                              disabled={deletingKey === `module-${module.id}`}
                                              onClick={() =>
                                                requestRemove({
                                                  ids: [module.id],
                                                  target: "module",
                                                  key: `module-${module.id}`,
                                                  successMessage: `Module ${module.title} removed`,
                                                  title: `Remove ${module.title}?`,
                                                  description:
                                                    "All sub-modules in this module will be permanently deleted. This action cannot be undone.",
                                                })
                                              }
                                            >
                                              <Trash2 className="h-3 w-3.5" aria-hidden />
                                              Remove
                                            </Button>
                                          </div>
                                        </div>
                                        {!moduleCollapsed ? module.sub_modules.map((subModule) => {
                                          const subModuleCollapsed = collapsedSubModuleIds.includes(subModule.id)
                                          const smKey = `${course.course_id}-${subModule.id}`
                                          const panelTab = subModulePanelTab[smKey] ?? "lessons"
                                          const cardSel = getSubModuleSelection(smKey)
                                          const lessonRows: LearningPathVideo[] = [...subModule.videos].sort(
                                            (a, b) => a.display_order - b.display_order,
                                          )
                                          const practiceRows: LearningPathPractice[] = [...subModule.practices].sort(
                                            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
                                          )
                                          const selectedLesson =
                                            cardSel.lessonId !== null
                                              ? lessonRows.find((v) => v.id === cardSel.lessonId) ?? null
                                              : null
                                          const selectedPracticeMeta =
                                            cardSel.practiceId !== null
                                              ? practiceRows.find((p) => p.id === cardSel.practiceId) ?? null
                                              : null
                                          const practiceFetch =
                                            cardSel.practiceId !== null ? practiceQuestionsState[cardSel.practiceId] : undefined
                                          return (
                                            <div
                                              key={subModule.id}
                                              className="mt-2 overflow-hidden rounded-xl border border-grayScale-200/90 bg-white shadow-sm"
                                            >
                                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grayScale-100 bg-gradient-to-r from-grayScale-50/90 to-white px-3 py-2.5">
                                                <button
                                                  type="button"
                                                  onClick={() => toggleSubModuleCollapsed(subModule.id)}
                                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                                >
                                                  {subModuleCollapsed ? (
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-grayScale-500" />
                                                  ) : (
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-500" />
                                                  )}
                                                  <p className="truncate text-sm font-semibold text-grayScale-800">
                                                    Sub-module: {subModule.title}
                                                  </p>
                                                </button>
                                                {categoryId ? (
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                      to={`/content/human-language/${categoryId}/${course.course_id}/sub-module/${subModule.id}`}
                                                    >
                                                      <Button type="button" variant="outline" size="sm" className="h-8 border-grayScale-200 bg-white text-xs hover:border-brand-200 hover:bg-brand-50/40">
                                                        Open editor
                                                      </Button>
                                                    </Link>
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-8 gap-1 border-red-200/90 bg-white px-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                                      disabled={deletingKey === `submodule-${subModule.id}`}
                                                      onClick={() =>
                                                        requestRemove({
                                                          ids: [subModule.id],
                                                          target: "sub_module",
                                                          key: `submodule-${subModule.id}`,
                                                          successMessage: `Sub-module ${subModule.title} removed`,
                                                          title: `Remove ${subModule.title}?`,
                                                          description:
                                                            "This sub-module will be permanently deleted. This action cannot be undone.",
                                                        })
                                                      }
                                                    >
                                                      <Trash2 className="h-3 w-3.5" aria-hidden />
                                                      Remove
                                                    </Button>
                                                  </div>
                                                ) : null}
                                              </div>
                                              {!subModuleCollapsed ? (
                                              <>
                                              <div className="border-b border-grayScale-100 bg-white px-3">
                                                <div className="-mb-px flex items-center justify-between gap-4">
                                                  <div className="flex gap-6">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setSubModulePanelTab((prev) => ({ ...prev, [smKey]: "lessons" }))
                                                    }
                                                    className={`relative pb-3 pt-2 text-sm font-semibold transition-colors ${
                                                      panelTab === "lessons"
                                                        ? "text-brand-600"
                                                        : "text-grayScale-400 hover:text-grayScale-700"
                                                    }`}
                                                  >
                                                    Lessons
                                                    {panelTab === "lessons" ? (
                                                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
                                                    ) : null}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setSubModulePanelTab((prev) => ({ ...prev, [smKey]: "practices" }))
                                                    }
                                                    className={`relative pb-3 pt-2 text-sm font-semibold transition-colors ${
                                                      panelTab === "practices"
                                                        ? "text-brand-600"
                                                        : "text-grayScale-400 hover:text-grayScale-700"
                                                    }`}
                                                  >
                                                    Practices
                                                    {panelTab === "practices" ? (
                                                      <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
                                                    ) : null}
                                                  </button>
                                                  </div>
                                                  {panelTab === "practices" ? (
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-8 border-grayScale-200 bg-white px-2 text-[11px] hover:border-brand-200 hover:bg-brand-50/40"
                                                      onClick={() => openCreatePracticeDialog(course.course_id, subModule.id)}
                                                    >
                                                      <Plus className="h-3.5 w-3.5" />
                                                      New practice
                                                    </Button>
                                                  ) : null}
                                                </div>
                                              </div>

                                              <div className="p-3.5">
                                                {panelTab === "lessons" ? (
                                                  lessonRows.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/40 px-4 py-8 text-center text-sm text-grayScale-500">
                                                      No lesson videos yet. Use{" "}
                                                      <span className="font-medium text-grayScale-700">Open editor</span> to add
                                                      videos.
                                                    </div>
                                                  ) : (
                                                    <div className="space-y-3">
                                                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                        {lessonRows.map((v, idx) => {
                                                          const isActive = cardSel.lessonId === v.id
                                                          return (
                                                            <button
                                                              key={v.id}
                                                              type="button"
                                                              onClick={() => toggleLessonCard(smKey, v.id)}
                                                              className={cn(
                                                                "flex flex-col gap-1.5 rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:border-brand-200 hover:shadow-md",
                                                                isActive
                                                                  ? "border-brand-400 ring-2 ring-brand-400/30"
                                                                  : "border-grayScale-100",
                                                              )}
                                                            >
                                                              <div className="flex items-start gap-2">
                                                                <div className="rounded-lg bg-brand-50 p-1.5 text-brand-600">
                                                                  <Video className="h-3.5 w-3.5" aria-hidden />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                  <p className="line-clamp-2 text-sm font-semibold text-grayScale-900">
                                                                    {v.title}
                                                                  </p>
                                                                  <p className="mt-0.5 text-[11px] text-grayScale-500">
                                                                    Lesson {idx + 1} · {formatDurationSeconds(v.duration ?? 0)} · Order{" "}
                                                                    {v.display_order}
                                                                  </p>
                                                                </div>
                                                              </div>
                                                            </button>
                                                          )
                                                        })}
                                                      </div>
                                                      {selectedLesson ? (
                                                        <div className="rounded-xl border border-grayScale-200 bg-grayScale-50/60 p-4">
                                                          <p className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">
                                                            Lesson content
                                                          </p>
                                                          <h4 className="mt-1 text-base font-semibold text-grayScale-900">
                                                            {selectedLesson.title}
                                                          </h4>
                                                          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                                            <div>
                                                              <dt className="text-xs text-grayScale-500">Display order</dt>
                                                              <dd className="font-medium text-grayScale-800">
                                                                {selectedLesson.display_order}
                                                              </dd>
                                                            </div>
                                                            <div>
                                                              <dt className="text-xs text-grayScale-500">Duration</dt>
                                                              <dd className="tabular-nums font-medium text-grayScale-800">
                                                                {formatDurationSeconds(selectedLesson.duration ?? 0)}
                                                              </dd>
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                              <dt className="text-xs text-grayScale-500">Video</dt>
                                                              <dd className="mt-0.5 break-all">
                                                                {selectedLesson.video_url ? (
                                                                  <a
                                                                    href={selectedLesson.video_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm font-medium text-brand-600 hover:underline"
                                                                  >
                                                                    {selectedLesson.video_url}
                                                                  </a>
                                                                ) : (
                                                                  <span className="text-sm text-grayScale-400">
                                                                    No video URL set — use Open editor to add one.
                                                                  </span>
                                                                )}
                                                                {selectedLesson.video_url
                                                                  ? renderMediaPreview(
                                                                      selectedLesson.video_url,
                                                                      "video",
                                                                      "mt-3",
                                                                      "Video preview",
                                                                    )
                                                                  : null}
                                                              </dd>
                                                            </div>
                                                          </dl>
                                                        </div>
                                                      ) : (
                                                        <p className="text-center text-xs text-grayScale-400">
                                                          Select a lesson card to view full content.
                                                        </p>
                                                      )}
                                                    </div>
                                                  )
                                                ) : practiceRows.length === 0 ? (
                                                  <div className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/40 px-4 py-8 text-center text-sm text-grayScale-500">
                                                    No practices yet. Use{" "}
                                                    <span className="font-medium text-grayScale-700">Open editor</span> to create a
                                                    practice.
                                                  </div>
                                                ) : (
                                                  <div className="space-y-3">
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                      {practiceRows.map((p, pIdx) => {
                                                        const isActive = cardSel.practiceId === p.id
                                                        return (
                                                          <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => togglePracticeCard(smKey, p.id)}
                                                            className={cn(
                                                              "flex flex-col gap-1.5 rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:border-brand-200 hover:shadow-md",
                                                              isActive
                                                                ? "border-brand-400 ring-2 ring-brand-400/30"
                                                                : "border-grayScale-100",
                                                            )}
                                                          >
                                                            <div className="flex items-start justify-between gap-2">
                                                              <div className="rounded-lg bg-violet-50 p-1.5 text-violet-600">
                                                                <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                                                              </div>
                                                              <div className="min-w-0 flex-1">
                                                                <p className="line-clamp-2 text-sm font-semibold text-grayScale-900">
                                                                  {p.title}
                                                                </p>
                                                                <p className="mt-0.5 text-[11px] text-grayScale-500">
                                                                  Practice {pIdx + 1}
                                                                </p>
                                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                                  <Badge
                                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${practiceStatusStyle(p.status)}`}
                                                                  >
                                                                    {(p.status ?? "—").replace(/_/g, " ").toLowerCase()}
                                                                  </Badge>
                                                                  <span className="text-[11px] text-grayScale-500">
                                                                    {p.question_count} Q · order {p.display_order ?? "—"}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                              <div className="flex shrink-0 items-center gap-1">
                                                                <Button
                                                                  type="button"
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className="h-7 px-2 text-[10px]"
                                                                  onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    openEditPracticeDialog(subModule.id, p)
                                                                  }}
                                                                >
                                                                  Edit
                                                                </Button>
                                                                <Button
                                                                  type="button"
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className="h-7 px-2 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                  onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setPracticeTargetDelete({ id: p.id, title: p.title })
                                                                  }}
                                                                >
                                                                  Delete
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          </button>
                                                        )
                                                      })}
                                                    </div>
                                                    {cardSel.practiceId !== null && selectedPracticeMeta ? (
                                                      <div className="overflow-hidden rounded-xl border border-grayScale-200/90 bg-gradient-to-b from-white to-grayScale-50/80 shadow-sm">
                                                        <div className="border-b border-grayScale-100 bg-white/90 px-4 py-3.5">
                                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-grayScale-400">
                                                                Question bank
                                                              </p>
                                                              <h4 className="mt-0.5 truncate text-base font-semibold text-grayScale-900">
                                                                {selectedPracticeMeta.title}
                                                              </h4>
                                                              {practiceFetch?.status === "ok" ? (
                                                                <p className="mt-1 text-xs text-grayScale-500">
                                                                  {practiceFetch.totalCount}{" "}
                                                                  {practiceFetch.totalCount === 1 ? "question" : "questions"} in this
                                                                  practice
                                                                </p>
                                                              ) : null}
                                                            </div>
                                                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                              <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-xs"
                                                                onClick={() => openCreateQuestionDialog(selectedPracticeMeta.id)}
                                                              >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                Add question
                                                              </Button>
                                                              {practiceFetch?.status === "ok" ? (
                                                                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                                                                  {practiceFetch.questions.length} loaded
                                                                </span>
                                                              ) : null}
                                                            </div>
                                                          </div>
                                                        </div>
                                                        <div className="p-4">
                                                        {!practiceFetch || practiceFetch.status === "loading" ? (
                                                          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-grayScale-500">
                                                            <Loader2 className="h-5 w-5 animate-spin text-brand-500" aria-hidden />
                                                            Loading questions…
                                                          </div>
                                                        ) : practiceFetch.status === "error" ? (
                                                          <div className="rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
                                                            <div className="flex items-start gap-2">
                                                              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                                                              <div className="space-y-2">
                                                                <p className="text-sm font-medium text-red-800">{practiceFetch.message}</p>
                                                                <Button
                                                                  type="button"
                                                                  size="sm"
                                                                  variant="outline"
                                                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                                                  onClick={() => void loadPracticeQuestionsIfNeeded(selectedPracticeMeta.id)}
                                                                >
                                                                  Retry
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        ) : practiceFetch.questions.length === 0 ? (
                                                          <div className="rounded-lg border border-dashed border-grayScale-200 bg-white px-4 py-10 text-center">
                                                            <ClipboardList className="mx-auto mb-2 h-8 w-8 text-grayScale-300" aria-hidden />
                                                            <p className="text-sm text-grayScale-600">
                                                              No questions in this practice yet.
                                                            </p>
                                                            <p className="mt-1 text-xs text-grayScale-500">
                                                              Add them via <span className="font-medium text-grayScale-700">Open editor</span>.
                                                            </p>
                                                          </div>
                                                        ) : (
                                                          <ul className="max-h-[min(28rem,calc(100vh-16rem))] space-y-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                                                            {practiceFetch.questions.map((q, qIdx) => {
                                                              const qType = String(q.question_type ?? "—")
                                                              const embeddedUrls = extractUrls(q.question_text || "")
                                                              return (
                                                                <li
                                                                  key={q.question_id ?? q.id}
                                                                  className="relative overflow-hidden rounded-xl border border-grayScale-100 bg-white shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md"
                                                                >
                                                                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand-400 to-violet-500" />
                                                                  <div className="flex gap-3 px-4 py-4 pl-5">
                                                                    <div
                                                                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-sm font-bold tabular-nums text-brand-800"
                                                                      aria-hidden
                                                                    >
                                                                      {qIdx + 1}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1 space-y-3">
                                                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge
                                                                          className={cn(
                                                                            "h-6 rounded-md px-2 py-0 text-[11px] font-semibold",
                                                                            questionTypeBadgeClass(qType),
                                                                          )}
                                                                        >
                                                                          {formatQuestionTypeLabel(qType)}
                                                                        </Badge>
                                                                        {q.points != null && q.points > 0 ? (
                                                                          <span className="rounded-md bg-grayScale-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-grayScale-700">
                                                                            {q.points} pts
                                                                          </span>
                                                                        ) : null}
                                                                        {q.difficulty_level ? (
                                                                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-inset ring-amber-100">
                                                                            {q.difficulty_level}
                                                                          </span>
                                                                        ) : null}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                          <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 gap-1 px-2 text-[10px]"
                                                                            disabled={
                                                                              loadingQuestionEditId ===
                                                                              (q.question_id ?? q.id)
                                                                            }
                                                                            onClick={() =>
                                                                              void openEditQuestionDialog(
                                                                                selectedPracticeMeta.id,
                                                                                q,
                                                                              )
                                                                            }
                                                                          >
                                                                            {loadingQuestionEditId ===
                                                                            (q.question_id ?? q.id) ? (
                                                                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                                                                            ) : null}
                                                                            Edit
                                                                          </Button>
                                                                          <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 px-2 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                            onClick={() =>
                                                                              setQuestionTargetDelete({
                                                                                id: q.question_id ?? q.id,
                                                                                practiceId: selectedPracticeMeta.id,
                                                                                text: q.question_text || "Question",
                                                                              })
                                                                            }
                                                                          >
                                                                            Delete
                                                                          </Button>
                                                                        </div>
                                                                      </div>
                                                                      <div>
                                                                        <p className="text-[13px] font-medium uppercase tracking-wide text-grayScale-400">
                                                                          Prompt
                                                                        </p>
                                                                        <p className="mt-1 text-[15px] leading-relaxed text-grayScale-900">
                                                                          {q.question_text?.trim() || (
                                                                            <span className="italic text-grayScale-400">No prompt text</span>
                                                                          )}
                                                                        </p>
                                                                      </div>
                                                                      {embeddedUrls.length > 0 ? (
                                                                        <div className="space-y-2">
                                                                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-grayScale-500">
                                                                            <Link2 className="h-3 w-3" aria-hidden />
                                                                            Media in prompt
                                                                          </p>
                                                                          <div className="grid gap-2 sm:grid-cols-2">
                                                                            {embeddedUrls.map((u) => (
                                                                              <div key={u}>{renderMediaPreview(u, undefined, "", "Embedded link")}</div>
                                                                            ))}
                                                                          </div>
                                                                        </div>
                                                                      ) : null}
                                                                      {q.tips ? (
                                                                        <div className="rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2.5">
                                                                          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900">
                                                                            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                                                                            Learner tip
                                                                          </p>
                                                                          <p className="mt-1 text-sm leading-relaxed text-amber-950/90">{q.tips}</p>
                                                                        </div>
                                                                      ) : null}
                                                                      {q.image_url ||
                                                                      q.voice_prompt ||
                                                                      q.sample_answer_voice_prompt ? (
                                                                        <div className="space-y-2 border-t border-grayScale-100 pt-3">
                                                                          <p className="text-[11px] font-semibold uppercase tracking-wide text-grayScale-500">
                                                                            Assets
                                                                          </p>
                                                                          <div className="grid gap-2 sm:grid-cols-2">
                                                                            {q.image_url
                                                                              ? renderMediaPreview(q.image_url, "image", "", "Image")
                                                                              : null}
                                                                            {q.voice_prompt
                                                                              ? renderMediaPreview(q.voice_prompt, "audio", "", "Voice prompt")
                                                                              : null}
                                                                            {q.sample_answer_voice_prompt
                                                                              ? renderMediaPreview(
                                                                                  q.sample_answer_voice_prompt,
                                                                                  "audio",
                                                                                  "",
                                                                                  "Sample answer (audio)",
                                                                                )
                                                                              : null}
                                                                          </div>
                                                                        </div>
                                                                      ) : null}
                                                                      {q.audio_correct_answer_text ? (
                                                                        <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5">
                                                                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                                                                            Sample answer text
                                                                          </p>
                                                                          <p className="mt-1 text-sm leading-relaxed text-blue-900/90">
                                                                            {q.audio_correct_answer_text}
                                                                          </p>
                                                                        </div>
                                                                      ) : null}
                                                                    </div>
                                                                  </div>
                                                                </li>
                                                              )
                                                            })}
                                                          </ul>
                                                        )}
                                                        {practiceFetch?.status === "ok" &&
                                                        practiceFetch.totalCount > practiceFetch.questions.length ? (
                                                          <div className="mt-4 rounded-lg border border-grayScale-100 bg-white/80 px-3 py-2 text-center text-xs text-grayScale-600">
                                                            Showing <span className="font-semibold">{practiceFetch.questions.length}</span> of{" "}
                                                            <span className="font-semibold">{practiceFetch.totalCount}</span> questions.
                                                          </div>
                                                        ) : null}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <p className="text-center text-xs text-grayScale-400">
                                                        Select a practice card to view its questions.
                                                      </p>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                              </>
                                              ) : null}
                                            </div>
                                          )
                                        }) : null}
                                            </>
                                          )
                                        })()}
                                      </div>
                                    ))
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                    ) : null}
                  </Card>
                )
              })
            : null}
        </div>
      )}

      <Dialog open={pendingRemove !== null} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingRemove?.title ?? "Confirm removal"}</DialogTitle>
            <DialogDescription>{pendingRemove?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={() => void executePendingRemove()}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={practiceDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setPracticeDialog({ open: false })
            setPracticeSubmitAttempted(false)
            setPracticeFormTouched(false)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{practiceDialog.open && practiceDialog.mode === "edit" ? "Edit Practice" : "Create Practice"}</DialogTitle>
            <DialogDescription>
              Manage full practice (question set) metadata directly from this page.
              {!practiceCanSave ? (
                <span className="mt-1 block text-amber-700/90">Required fields must be completed before you can save.</span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {loadingPracticeForm ? (
            <div className="flex items-center gap-2 rounded-lg border border-grayScale-200 bg-grayScale-50 px-3 py-3 text-sm text-grayScale-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading practice details...
            </div>
          ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-grayScale-600">Title</label>
              <input
                value={practiceForm.title}
                onChange={(e) => {
                  setPracticeFormTouched(true)
                  setPracticeForm((p) => ({ ...p, title: e.target.value }))
                }}
                className={cn(
                  "h-10 w-full rounded-md border px-3 text-sm",
                  (practiceSubmitAttempted || practiceFormTouched) && practiceFieldErrors.title
                    ? "border-red-300 ring-1 ring-red-200"
                    : "border-grayScale-200",
                )}
                placeholder="Practice title"
                aria-invalid={Boolean(
                  (practiceSubmitAttempted || practiceFormTouched) && practiceFieldErrors.title,
                )}
              />
              {(practiceSubmitAttempted || practiceFormTouched) && practiceFieldErrors.title ? (
                <p className="text-xs text-red-600">{practiceFieldErrors.title}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-grayScale-600">Description</label>
              <textarea
                value={practiceForm.description}
                onChange={(e) => {
                  setPracticeFormTouched(true)
                  setPracticeForm((p) => ({ ...p, description: e.target.value }))
                }}
                className="min-h-[88px] w-full rounded-md border border-grayScale-200 px-3 py-2 text-sm"
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-grayScale-600">Persona</label>
              <input
                value={practiceForm.persona}
                onChange={(e) => {
                  setPracticeFormTouched(true)
                  setPracticeForm((p) => ({ ...p, persona: e.target.value }))
                }}
                className="h-10 w-full rounded-md border border-grayScale-200 px-3 text-sm"
                placeholder="Optional persona"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-grayScale-600">Intro video URL</label>
              <Input
                value={practiceForm.introVideoUrl}
                onChange={(e) => {
                  setPracticeFormTouched(true)
                  setPracticeForm((p) => ({ ...p, introVideoUrl: e.target.value }))
                }}
                placeholder="https://..."
                className="h-10 font-mono text-[13px]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-grayScale-200 px-3 py-2 text-xs text-grayScale-700 hover:bg-grayScale-50">
                  {uploadingPracticeIntroVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {uploadingPracticeIntroVideo ? "Uploading..." : "Upload intro video"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => void handlePracticeIntroVideoFileChange(e)}
                    disabled={uploadingPracticeIntroVideo || savingPractice}
                  />
                </label>
              </div>
              {practiceForm.introVideoUrl.trim()
                ? renderMediaPreview(practiceForm.introVideoUrl, "video", "", "Intro video")
                : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-grayScale-600">Passing score</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={practiceForm.passingScore}
                  onChange={(e) => {
                    setPracticeFormTouched(true)
                    setPracticeForm((p) => ({ ...p, passingScore: Number(e.target.value) || 0 }))
                  }}
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-grayScale-600">Time limit (minutes)</label>
                <Input
                  type="number"
                  min={0}
                  value={practiceForm.timeLimitMinutes}
                  onChange={(e) => {
                    setPracticeFormTouched(true)
                    setPracticeForm((p) => ({ ...p, timeLimitMinutes: Number(e.target.value) || 0 }))
                  }}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-grayScale-200 px-3 py-2.5">
              <label className="text-sm font-medium text-grayScale-700">Shuffle questions</label>
              <button
                type="button"
                onClick={() => {
                  setPracticeFormTouched(true)
                  setPracticeForm((p) => ({ ...p, shuffleQuestions: !p.shuffleQuestions }))
                }}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                  practiceForm.shuffleQuestions ? "bg-brand-500" : "bg-grayScale-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    practiceForm.shuffleQuestions ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPracticeDialog({ open: false })}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSavePractice()} disabled={savingPractice || !practiceCanSave || loadingPracticeForm}>
              {savingPractice ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={practiceTargetDelete !== null} onOpenChange={(open) => !open && setPracticeTargetDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete practice?</DialogTitle>
            <DialogDescription>
              {practiceTargetDelete ? `This will permanently delete "${practiceTargetDelete.title}".` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPracticeTargetDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleDeletePracticeConfirmed()}
              disabled={deletingPractice}
            >
              {deletingPractice ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subCategoryTargetDelete !== null} onOpenChange={(open) => !open && setSubCategoryTargetDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete sub-category?</DialogTitle>
            <DialogDescription>
              {subCategoryTargetDelete
                ? `This will permanently delete "${subCategoryTargetDelete.name}" and all courses under it.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubCategoryTargetDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleDeleteSelectedSubCategory()}
              disabled={deletingSubCategory}
            >
              {deletingSubCategory ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={courseTargetDelete !== null} onOpenChange={(open) => !open && setCourseTargetDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete course?</DialogTitle>
            <DialogDescription>
              {courseTargetDelete
                ? `This will permanently delete "${courseTargetDelete.name}" and all nested content under it.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCourseTargetDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleDeleteSelectedCourse()}
              disabled={deletingCourse}
            >
              {deletingCourse ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={questionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setQuestionDialog({ open: false })
            setQuestionSubmitAttempted(false)
            setQuestionFormTouched(false)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto gap-0 p-0 sm:max-w-4xl">
          <div className="border-b border-grayScale-100 px-5 py-5 sm:px-8">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-xl">
                {questionDialog.open && questionDialog.mode === "edit" ? "Edit question" : "Add question"}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Same layout as <span className="font-medium text-grayScale-700">Add New Practice → Step 3: Questions</span>. Add MCQ,
                True/False, Short Answer, or Audio; optional tips and voice prompts below.
                {!questionCanSave ? (
                  <span className="mt-2 block text-amber-800/90">
                    Fix the highlighted fields before saving. Save stays disabled until the form is valid.
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="rounded-2xl border border-grayScale-200/80 bg-gradient-to-r from-grayScale-50/80 to-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
              <h2 className="text-base font-semibold tracking-tight text-grayScale-900 sm:text-lg">Step 3: Questions</h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-grayScale-500">
                Add MCQ, True/False, Short Answer, or Audio items. Use the full width for stems and options.
              </p>
            </div>

            <Card className="border border-grayScale-200/90 border-l-4 border-l-brand-500 p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-grayScale-300" aria-hidden />
                  <span className="text-base font-semibold text-grayScale-900">Question 1</span>
                </div>
              </div>

              <PracticeQuestionEditorFields
                value={questionDraft}
                onChange={(next) => {
                  setQuestionFormTouched(true)
                  setQuestionDraft(next)
                }}
                fieldErrors={questionFieldErrors}
                showFieldErrors={questionSubmitAttempted || questionFormTouched}
                mediaBusy={savingQuestion}
              />
            </Card>
          </div>

          <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-grayScale-100 bg-grayScale-50/30 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
            <Button type="button" variant="outline" onClick={() => setQuestionDialog({ open: false })} className="sm:mr-auto">
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-brand-500 hover:bg-brand-600"
              onClick={() => void handleSaveQuestion()}
              disabled={savingQuestion || !questionCanSave}
            >
              {savingQuestion ? "Saving..." : "Save question"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={questionTargetDelete !== null} onOpenChange={(open) => !open && setQuestionTargetDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete question?</DialogTitle>
            <DialogDescription>
              {questionTargetDelete ? `This will permanently delete "${questionTargetDelete.text}".` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setQuestionTargetDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleDeleteQuestionConfirmed()}
              disabled={deletingQuestion}
            >
              {deletingQuestion ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

