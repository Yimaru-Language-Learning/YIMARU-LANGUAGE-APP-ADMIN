import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BookOpen, GraduationCap, Layers, PlayCircle, RefreshCw, Pencil, Search, Trash2 } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Select } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"
import {
  deleteParentLinkedPractice,
  getLearningPrograms,
  getModuleLessons,
  getPracticesByParentCourse,
  getPracticesByParentLesson,
  getPracticesByParentModule,
  getProgramCourses,
  getTopLevelCourseModules,
  updateParentLinkedPractice,
} from "../../api/courses.api"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import type {
  LearningProgramListItem,
  ParentContextPractice,
  ProgramCourseListItem,
  TopLevelCourseModuleItem,
  TopLevelModuleLessonItem,
  UpdateParentLinkedPracticeRequest,
} from "../../types/course.types"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { CreatePracticeWizard } from "./components/CreatePracticeWizard"
import type { PracticeParentKind } from "../../types/course.types"
import { cn } from "../../lib/utils"

type ParentTab = "course" | "module" | "lesson"

type FlowMode = "view" | "create"

function toApiParentKind(tab: ParentTab): PracticeParentKind {
  if (tab === "course") return "COURSE"
  if (tab === "module") return "MODULE"
  return "LESSON"
}

function parseParentTab(s: string | null): ParentTab {
  if (s === "module" || s === "lesson" || s === "course") return s
  return "course"
}

function parseQuickTipParts(text: string): string[] {
  return text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

const parentTabCopy: Record<ParentTab, { label: string; hint: string; icon: typeof BookOpen }> = {
  course: { label: "Course", hint: "Pick a program, then the course the practice is attached to.", icon: BookOpen },
  module: { label: "Module", hint: "Pick program → course → module.", icon: Layers },
  lesson: { label: "Lesson", hint: "Pick program → course → module → video lesson.", icon: PlayCircle },
}

const LIST_LIMIT = 200

const sortBySortOrder = <T extends { sort_order?: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

function courseLabel(c: ProgramCourseListItem) {
  return c.name?.trim() || `Course #${c.id}`
}
function moduleLabel(m: TopLevelCourseModuleItem) {
  return m.name?.trim() || `Module #${m.id}`
}
function lessonLabel(l: TopLevelModuleLessonItem) {
  return l.title?.trim() || `Lesson #${l.id}`
}
function programLabel(p: LearningProgramListItem) {
  return p.name?.trim() || `Program #${p.id}`
}

function parseIntParam(s: string | null): number | null {
  if (!s?.trim() || !/^\d+$/.test(s.trim())) return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** When URL matches what is already on screen (after "Load"), skip network to fill dropdowns. */
function selectionMatchesUrl(
  type: ParentTab,
  leafIdParam: string,
  sp: URLSearchParams,
  pId: string,
  cId: string,
  mId: string,
  lId: string,
): boolean {
  const pro = sp.get("program")
  const cou = sp.get("course")
  const mod = sp.get("module")
  if (type === "course") {
    if (!pId || cId !== leafIdParam) return false
    return pro === pId
  }
  if (type === "module") {
    if (!pId || !cId || mId !== leafIdParam) return false
    return pro === pId && cou === cId
  }
  if (type === "lesson") {
    if (!pId || !cId || !mId || lId !== leafIdParam) return false
    return pro === pId && cou === cId && mod === mId
  }
  return false
}

export function PracticeDetailsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [parentTab, setParentTab] = useState<ParentTab>(() => parseParentTab(searchParams.get("type")))

  const [programs, setPrograms] = useState<LearningProgramListItem[]>([])
  const [courses, setCourses] = useState<ProgramCourseListItem[]>([])
  const [modules, setModules] = useState<TopLevelCourseModuleItem[]>([])
  const [lessons, setLessons] = useState<TopLevelModuleLessonItem[]>([])

  const [programId, setProgramId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [moduleId, setModuleId] = useState("")
  const [lessonId, setLessonId] = useState("")

  const [programsLoading, setProgramsLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [modulesLoading, setModulesLoading] = useState(false)
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [locationRestoring, setLocationRestoring] = useState(false)
  const programsForRestoreRef = useRef<LearningProgramListItem[] | null>(null)
  useEffect(() => {
    if (programs.length) programsForRestoreRef.current = programs
  }, [programs])

  const [loading, setLoading] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [practice, setPractice] = useState<ParentContextPractice | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [flowMode, setFlowMode] = useState<FlowMode>("view")
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [savePracticeLoading, setSavePracticeLoading] = useState(false)
  const [deletePracticeLoading, setDeletePracticeLoading] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editStory, setEditStory] = useState("")
  const [editImage, setEditImage] = useState("")
  const [editQuestionSetId, setEditQuestionSetId] = useState("")
  const [editQuickTips, setEditQuickTips] = useState("")
  const [editPersonaId, setEditPersonaId] = useState("")

  const syncTabFromUrl = useRef(false)
  useEffect(() => {
    if (syncTabFromUrl.current) return
    setParentTab(parseParentTab(searchParams.get("type")))
  }, [searchParams])

  useEffect(() => {
    if (editOpen && practice) {
      setEditTitle(practice.title)
      setEditStory(practice.story_description)
      setEditImage(practice.story_image)
      setEditQuestionSetId(String(practice.question_set_id))
      setEditQuickTips(practice.quick_tips ?? "")
      setEditPersonaId(practice.persona_id != null ? String(practice.persona_id) : "")
    }
  }, [editOpen, practice])

  const loadPrograms = useCallback(async () => {
    setProgramsLoading(true)
    try {
      const res = await getLearningPrograms({ limit: LIST_LIMIT, offset: 0 })
      const list = res.data?.data?.programs ?? []
      setPrograms(sortBySortOrder(list))
    } catch {
      setPrograms([])
    } finally {
      setProgramsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrograms()
  }, [loadPrograms])

  const loadCourses = useCallback(async (pid: number) => {
    setCoursesLoading(true)
    try {
      const res = await getProgramCourses(pid, { limit: LIST_LIMIT, offset: 0 })
      const list = res.data?.data?.courses ?? []
      setCourses(sortBySortOrder(list))
    } catch {
      setCourses([])
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  const loadModules = useCallback(async (cid: number) => {
    setModulesLoading(true)
    try {
      const res = await getTopLevelCourseModules(cid, { limit: LIST_LIMIT, offset: 0 })
      const list = res.data?.data?.modules ?? []
      setModules(sortBySortOrder(list))
    } catch {
      setModules([])
    } finally {
      setModulesLoading(false)
    }
  }, [])

  const loadLessons = useCallback(async (mid: number) => {
    setLessonsLoading(true)
    try {
      const res = await getModuleLessons(mid, { limit: LIST_LIMIT, offset: 0 })
      const list = res.data?.data?.lessons ?? []
      setLessons(sortBySortOrder(list))
    } catch {
      setLessons([])
    } finally {
      setLessonsLoading(false)
    }
  }, [])

  const onProgramChange = (value: string) => {
    setSelectionError(null)
    setProgramId(value)
    setCourseId("")
    setModuleId("")
    setLessonId("")
    setCourses([])
    setModules([])
    setLessons([])
    if (value) {
      loadCourses(Number(value))
    }
  }

  const onCourseChange = (value: string) => {
    setSelectionError(null)
    setCourseId(value)
    setModuleId("")
    setLessonId("")
    setModules([])
    setLessons([])
    if (value && (parentTab === "module" || parentTab === "lesson")) {
      loadModules(Number(value))
    }
  }

  const onModuleChange = (value: string) => {
    setSelectionError(null)
    setModuleId(value)
    setLessonId("")
    setLessons([])
    if (value && parentTab === "lesson") {
      loadLessons(Number(value))
    }
  }

  const onParentTabChange = (next: ParentTab) => {
    setSelectionError(null)
    setParentTab(next)
    setModuleId("")
    setLessonId("")
    setModules([])
    setLessons([])
    if (next === "course") {
      // module/lesson not needed; keep program + course if already chosen
    } else if (next === "module" && programId && courseId) {
      loadModules(Number(courseId))
    } else if (next === "lesson" && programId && courseId) {
      loadModules(Number(courseId))
      if (moduleId) {
        loadLessons(Number(moduleId))
      }
    }
  }

  const getLeafId = useCallback((): number | null => {
    if (parentTab === "course") {
      if (!courseId) return null
      const n = Number(courseId)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    if (parentTab === "module") {
      if (!moduleId) return null
      const n = Number(moduleId)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    if (!lessonId) return null
    const n = Number(lessonId)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [parentTab, courseId, moduleId, lessonId])

  const runFetch = useCallback(async (tab: ParentTab, rawId: string) => {
    const id = Number(String(rawId).trim())
    if (!rawId.trim() || !Number.isFinite(id) || id < 1) {
      setLoadError("Invalid selection (missing or invalid id).")
      setPractice(null)
      setTotalCount(0)
      return
    }
    setLoading(true)
    setLoadError(null)
    setSelectionError(null)
    setPractice(null)
    try {
      const params = { limit: 20, offset: 0 }
      const res =
        tab === "course"
          ? await getPracticesByParentCourse(id, params)
          : tab === "module"
            ? await getPracticesByParentModule(id, params)
            : await getPracticesByParentLesson(id, params)
      const data = res.data?.data
      const list = data?.practices ?? []
      setTotalCount(data?.total_count ?? list.length)
      setPractice(list[0] ?? null)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setLoadError(err.response?.data?.message || "Failed to load practices for this parent.")
      setPractice(null)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const restoreFromUrl = useCallback(
    async (type: ParentTab, targetId: number, sp: URLSearchParams) => {
      setLocationRestoring(true)
      try {
        const pHint = parseIntParam(sp.get("program"))
        const cHint = parseIntParam(sp.get("course"))
        const mHint = parseIntParam(sp.get("module"))

        /* ---- Fast path: hints in URL = a few parallel calls ---- */
        if (type === "course" && pHint != null) {
          const [progRes, cRes] = await Promise.all([
            getLearningPrograms({ limit: LIST_LIMIT, offset: 0 }),
            getProgramCourses(pHint, { limit: LIST_LIMIT, offset: 0 }),
          ])
          const programList = sortBySortOrder(progRes.data?.data?.programs ?? [])
          setPrograms(programList)
          const cl = sortBySortOrder(cRes.data?.data?.courses ?? [])
          const c = cl.find((x) => x.id === targetId)
          if (c) {
            setProgramId(String(pHint))
            setCourses(cl)
            setCourseId(String(c.id))
            return
          }
        }

        if (type === "module" && pHint != null && cHint != null) {
          const [progRes, cRes, mRes] = await Promise.all([
            getLearningPrograms({ limit: LIST_LIMIT, offset: 0 }),
            getProgramCourses(pHint, { limit: LIST_LIMIT, offset: 0 }),
            getTopLevelCourseModules(cHint, { limit: LIST_LIMIT, offset: 0 }),
          ])
          setPrograms(sortBySortOrder(progRes.data?.data?.programs ?? []))
          setCourses(sortBySortOrder(cRes.data?.data?.courses ?? []))
          setProgramId(String(pHint))
          setCourseId(String(cHint))
          const ml = sortBySortOrder(mRes.data?.data?.modules ?? [])
          const m = ml.find((x) => x.id === targetId)
          if (m) {
            setModules(ml)
            setModuleId(String(m.id))
            return
          }
        }

        if (type === "lesson" && pHint != null && cHint != null && mHint != null) {
          const [progRes, cRes, mRes, lRes] = await Promise.all([
            getLearningPrograms({ limit: LIST_LIMIT, offset: 0 }),
            getProgramCourses(pHint, { limit: LIST_LIMIT, offset: 0 }),
            getTopLevelCourseModules(cHint, { limit: LIST_LIMIT, offset: 0 }),
            getModuleLessons(mHint, { limit: LIST_LIMIT, offset: 0 }),
          ])
          setPrograms(sortBySortOrder(progRes.data?.data?.programs ?? []))
          setCourses(sortBySortOrder(cRes.data?.data?.courses ?? []))
          setModules(sortBySortOrder(mRes.data?.data?.modules ?? []))
          setProgramId(String(pHint))
          setCourseId(String(cHint))
          setModuleId(String(mHint))
          const ll = sortBySortOrder(lRes.data?.data?.lessons ?? [])
          const lesson = ll.find((x) => x.id === targetId)
          if (lesson) {
            setLessons(ll)
            setLessonId(String(lesson.id))
            return
          }
        }

        /* ---- Legacy / wrong hints: programs list, then search ---- */
        let programList: LearningProgramListItem[] = programsForRestoreRef.current ?? []
        if (programList.length === 0) {
          const progRes = await getLearningPrograms({ limit: LIST_LIMIT, offset: 0 })
          programList = sortBySortOrder(progRes.data?.data?.programs ?? [])
        }
        setPrograms(programList)

        if (type === "course") {
          const courseResults = await Promise.all(
            programList.map((p) => getProgramCourses(p.id, { limit: LIST_LIMIT, offset: 0 })),
          )
          for (let i = 0; i < programList.length; i++) {
            const cl = sortBySortOrder(courseResults[i].data?.data?.courses ?? [])
            const c = cl.find((x) => x.id === targetId)
            if (c) {
              setProgramId(String(programList[i].id))
              setCourses(cl)
              setCourseId(String(c.id))
              return
            }
          }
          return
        }

        if (type === "module") {
          for (const p of programList) {
            const cRes = await getProgramCourses(p.id, { limit: LIST_LIMIT, offset: 0 })
            const cl = sortBySortOrder(cRes.data?.data?.courses ?? [])
            const modBatches = await Promise.all(
              cl.map((c) => getTopLevelCourseModules(c.id, { limit: LIST_LIMIT, offset: 0 })),
            )
            for (let j = 0; j < cl.length; j++) {
              const ml = sortBySortOrder(modBatches[j].data?.data?.modules ?? [])
              const m = ml.find((x) => x.id === targetId)
              if (m) {
                setProgramId(String(p.id))
                setCourses(cl)
                setCourseId(String(cl[j].id))
                setModules(ml)
                setModuleId(String(m.id))
                return
              }
            }
          }
          return
        }

        if (type === "lesson") {
          for (const p of programList) {
            const cRes = await getProgramCourses(p.id, { limit: LIST_LIMIT, offset: 0 })
            const cl = sortBySortOrder(cRes.data?.data?.courses ?? [])
            for (const c of cl) {
              const mRes = await getTopLevelCourseModules(c.id, { limit: LIST_LIMIT, offset: 0 })
              const ml = sortBySortOrder(mRes.data?.data?.modules ?? [])
              const lessonBatches = await Promise.all(
                ml.map((m) => getModuleLessons(m.id, { limit: LIST_LIMIT, offset: 0 })),
              )
              for (let k = 0; k < ml.length; k++) {
                const ll = sortBySortOrder(lessonBatches[k].data?.data?.lessons ?? [])
                const lesson = ll.find((x) => x.id === targetId)
                if (lesson) {
                  setProgramId(String(p.id))
                  setCourses(cl)
                  setCourseId(String(c.id))
                  setModules(ml)
                  setModuleId(String(ml[k].id))
                  setLessons(ll)
                  setLessonId(String(lesson.id))
                  return
                }
              }
            }
          }
        }
      } finally {
        setLocationRestoring(false)
      }
    },
    [],
  )

  /** Only re-run when the query string actually changes (not when the user only edits a dropdown). */
  const lastUrlKeyProcessedRef = useRef<string | null>(null)
  const selectionUrlSyncedRef = useRef<string | null>(null)
  useEffect(() => {
    const idParam = searchParams.get("id")
    if (!idParam?.trim() || !/^\d+$/.test(idParam.trim())) {
      lastUrlKeyProcessedRef.current = null
      selectionUrlSyncedRef.current = null
      return
    }
    const type = parseParentTab(searchParams.get("type"))
    const id = Number(idParam)
    if (!Number.isFinite(id) || id < 1) return

    const urlKey = searchParams.toString()
    if (urlKey === lastUrlKeyProcessedRef.current) {
      return
    }
    lastUrlKeyProcessedRef.current = urlKey

    if (selectionMatchesUrl(type, idParam, searchParams, programId, courseId, moduleId, lessonId)) {
      if (selectionUrlSyncedRef.current === urlKey) return
      selectionUrlSyncedRef.current = urlKey
      syncTabFromUrl.current = true
      setParentTab(type)
      queueMicrotask(() => {
        syncTabFromUrl.current = false
      })
      return
    }
    selectionUrlSyncedRef.current = null
    syncTabFromUrl.current = true
    setParentTab(type)
    queueMicrotask(() => {
      syncTabFromUrl.current = false
    })
    void restoreFromUrl(type, id, searchParams)
  }, [searchParams, restoreFromUrl, programId, courseId, moduleId, lessonId])

  useEffect(() => {
    const id = searchParams.get("id")
    const type = parseParentTab(searchParams.get("type"))
    if (!id?.trim() || !/^\d+$/.test(id.trim())) {
      return
    }
    runFetch(type, id)
  }, [searchParams, runFetch])

  const handleLoad = () => {
    const leaf = getLeafId()
    if (leaf == null) {
      setSelectionError("Choose all required items from the lists before loading.")
      return
    }
    setSelectionError(null)
    setLoadError(null)
    const next: Record<string, string> = {
      type: parentTab,
      id: String(leaf),
    }
    if (programId) next.program = programId
    if (courseId) next.course = courseId
    if (moduleId) next.module = moduleId
    setSearchParams(next)
  }

  const savePracticeEdit = async () => {
    if (!practice) return
    const qid = Number(editQuestionSetId.trim())
    if (!Number.isFinite(qid) || qid < 1) {
      toast.error("Enter a valid question set id")
      return
    }
    if (!editTitle.trim() || !editStory.trim() || !editImage.trim()) {
      toast.error("Title, story description, and story image are required")
      return
    }
    const payload: UpdateParentLinkedPracticeRequest = {
      title: editTitle.trim(),
      story_description: editStory.trim(),
      story_image: editImage.trim(),
      question_set_id: qid,
      quick_tips: editQuickTips.trim(),
    }
    const p = editPersonaId.trim()
    if (p) {
      const n = Number(p)
      if (!Number.isFinite(n) || n < 1) {
        toast.error("Persona id must be a positive number or empty")
        return
      }
      payload.persona_id = n
    } else {
      payload.persona_id = null
    }
    setSavePracticeLoading(true)
    try {
      const res = await updateParentLinkedPractice(practice.id, payload)
      const updated = res.data?.data
      if (updated) {
        setPractice(updated)
      } else {
        setPractice({
          ...practice,
          ...payload,
          id: practice.id,
          parent_kind: practice.parent_kind,
          parent_id: practice.parent_id,
          created_at: practice.created_at,
        })
      }
      toast.success("Practice updated")
      setEditOpen(false)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to update practice")
    } finally {
      setSavePracticeLoading(false)
    }
  }

  const confirmDeletePractice = async () => {
    if (!practice) return
    setDeletePracticeLoading(true)
    try {
      await deleteParentLinkedPractice(practice.id)
      toast.success("Practice deleted")
      setDeleteOpen(false)
      const id = searchParams.get("id")
      const t = parseParentTab(searchParams.get("type"))
      if (id?.trim() && /^\d+$/.test(id.trim())) {
        await runFetch(t, id)
      } else {
        setPractice(null)
        setTotalCount(0)
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to delete practice")
    } finally {
      setDeletePracticeLoading(false)
    }
  }

  const quickTipParts = useMemo(
    () => (practice?.quick_tips ? parseQuickTipParts(practice.quick_tips) : []),
    [practice?.quick_tips],
  )

  const canLoad =
    parentTab === "course"
      ? Boolean(programId && courseId)
      : parentTab === "module"
        ? Boolean(programId && courseId && moduleId)
        : Boolean(programId && courseId && moduleId && lessonId)

  const createWizardParent = useMemo((): { kind: PracticeParentKind; id: number } | null => {
    const leaf = getLeafId()
    if (leaf == null) return null
    return { kind: toApiParentKind(parentTab), id: leaf }
  }, [parentTab, getLeafId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">Practice Management</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            View the practice linked to a course, module, or lesson. Each parent has at most one
            practice.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div
            className="flex rounded-2xl border border-grayScale-200 bg-grayScale-50/80 p-1 shadow-sm"
            role="tablist"
            aria-label="View or create practice"
          >
            <button
              type="button"
              role="tab"
              aria-selected={flowMode === "view"}
              onClick={() => setFlowMode("view")}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition",
                flowMode === "view"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-grayScale-500 hover:text-grayScale-800",
              )}
            >
              <Search className="h-4 w-4" />
              View
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={flowMode === "create"}
              onClick={() => setFlowMode("create")}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition",
                flowMode === "create"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-grayScale-500 hover:text-grayScale-800",
              )}
            >
              <Pencil className="h-4 w-4" />
              Create
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const id = searchParams.get("id")
              if (id?.trim() && /^\d+$/.test(id.trim())) {
                runFetch(parseParentTab(searchParams.get("type")), id)
              }
            }}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? <SpinnerIcon className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">Look up practice</CardTitle>
          <p className="text-sm font-normal text-grayScale-500">
            Choose a program and narrow down to the {parentTabCopy[parentTab].label.toLowerCase()} you
            need, then load. The URL includes program / course / module so shared links and refreshes
            load quickly.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Practice is attached to
              </p>
              <Select
                value={parentTab}
                onChange={(e) => onParentTabChange(parseParentTab(e.target.value))}
                className="w-full"
              >
                <option value="course">Course</option>
                <option value="module">Module</option>
                <option value="lesson">Lesson (video)</option>
              </Select>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Program
              </p>
              <Select
                value={programId}
                onChange={(e) => onProgramChange(e.target.value)}
                className="w-full"
                disabled={programsLoading}
              >
                <option value="">{programsLoading ? "Loading programs…" : "Select a program"}</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {programLabel(p)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Course
              </p>
              <Select
                value={courseId}
                onChange={(e) => onCourseChange(e.target.value)}
                className="w-full"
                disabled={!programId || coursesLoading}
              >
                <option value="">
                  {!programId
                    ? "Select a program first"
                    : coursesLoading
                      ? "Loading courses…"
                      : "Select a course"}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {courseLabel(c)}
                  </option>
                ))}
              </Select>
            </div>

            {parentTab !== "course" && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                  Module
                </p>
                <Select
                  value={moduleId}
                  onChange={(e) => onModuleChange(e.target.value)}
                  className="w-full"
                  disabled={!courseId || modulesLoading}
                >
                  <option value="">
                    {!courseId
                      ? "Select a course first"
                      : modulesLoading
                        ? "Loading modules…"
                        : "Select a module"}
                  </option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {moduleLabel(m)}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {parentTab === "lesson" && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                  Lesson
                </p>
                <Select
                  value={lessonId}
                  onChange={(e) => {
                    setSelectionError(null)
                    setLessonId(e.target.value)
                  }}
                  className="w-full"
                  disabled={!moduleId || lessonsLoading}
                >
                  <option value="">
                    {!moduleId
                      ? "Select a module first"
                      : lessonsLoading
                        ? "Loading lessons…"
                        : "Select a lesson"}
                  </option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {lessonLabel(l)}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              onClick={handleLoad}
              disabled={loading || !canLoad}
            >
              {loading ? <SpinnerIcon className="h-4 w-4" /> : null}
              Load practice
            </Button>
            {selectionError && <p className="text-sm text-amber-700">{selectionError}</p>}
            {locationRestoring && (
              <p className="text-xs text-grayScale-500 flex items-center gap-2">
                <SpinnerIcon className="h-3.5 w-3.5" />
                Resolving your link…
              </p>
            )}
          </div>

          <p className="mt-3 flex items-start gap-2 text-xs text-grayScale-500">
            {(() => {
              const meta = parentTabCopy[parentTab]
              const Icon = meta.icon
              return (
                <>
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-grayScale-400" />
                  {meta.hint}
                </>
              )
            })()}
          </p>
        </CardContent>
      </Card>

      {flowMode === "create" && (
        <CreatePracticeWizard
          parent={createWizardParent}
          onCreated={() => {
            setFlowMode("view")
            if (canLoad) {
              handleLoad()
            }
          }}
        />
      )}

      {flowMode === "view" && (
        <Card className="shadow-soft overflow-hidden">
        <CardHeader className="border-b border-grayScale-200 bg-grayScale-50/80 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-grayScale-600">Practice</CardTitle>
            {searchParams.get("id") && (
              <span className="text-xs text-grayScale-500">
                {totalCount === 0
                  ? "No results"
                  : totalCount === 1
                    ? "1 result"
                    : `${totalCount} results (showing first)`}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <SpinnerIcon className="h-8 w-8 text-brand-500" />
              <span className="text-sm text-grayScale-500">Loading practice…</span>
            </div>
          )}

          {!loading && loadError && searchParams.get("id") && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
            </div>
          )}

          {!loading && !loadError && searchParams.get("id") && !practice && (
            <div className="px-6 py-14 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-grayScale-300" />
              <p className="mt-3 text-sm font-medium text-grayScale-600">No practice for this parent</p>
              <p className="mt-1 max-w-md mx-auto text-sm text-grayScale-500">
                There is no practice attached to this {parentTabCopy[parentTab].label.toLowerCase()}{" "}
                yet, or the selection may be wrong.
              </p>
            </div>
          )}

          {!loading && !loadError && practice && (
            <div className="grid gap-0 md:grid-cols-[minmax(0,380px),1fr]">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-grayScale-900 md:aspect-auto md:min-h-[280px]">
                {practice.story_image?.trim() ? (
                  <img
                    src={practice.story_image}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center bg-gradient-to-br from-grayScale-800 to-grayScale-900 text-grayScale-500">
                    <span className="text-sm">No banner image</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                      {practice.parent_kind}
                    </Badge>
                    <span className="text-xs text-grayScale-500">
                      parent #{practice.parent_id} · practice #{practice.id}
                    </span>
                  </div>
                  {flowMode === "view" && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="font-semibold"
                        onClick={() => setEditOpen(true)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="font-semibold text-red-600 hover:text-red-700"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold leading-tight text-grayScale-800 sm:text-2xl">
                  {practice.title}
                </h2>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-grayScale-500">Story</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-grayScale-700">
                    {practice.story_description?.trim() || "—"}
                  </p>
                </div>
                {quickTipParts.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-grayScale-500">
                      Quick tips
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-grayScale-700">
                      {quickTipParts.map((tip, i) => (
                        <li key={i} className="leading-relaxed">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-auto flex flex-col gap-2 border-t border-grayScale-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-grayScale-500">
                    <span className="text-gray-400">Question set</span>{" "}
                    <span className="font-mono font-medium text-grayScale-700">
                      #{practice.question_set_id}
                    </span>
                  </div>
                  <p className="text-xs text-grayScale-500">Created {formatDate(practice.created_at)}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !loadError && !searchParams.get("id") && (
            <div className="px-6 py-14 text-center text-sm text-grayScale-500">
              Choose a program{parentTab !== "course" ? ", course" : ""}
              {parentTab === "module" || parentTab === "lesson" ? ", module" : ""}
              {parentTab === "lesson" ? ", lesson" : ""} above, then <strong>Load practice</strong>.
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit practice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Title
              </p>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Story description
              </p>
              <Textarea
                value={editStory}
                onChange={(e) => setEditStory(e.target.value)}
                rows={4}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Story image URL
              </p>
              <Input value={editImage} onChange={(e) => setEditImage(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Question set id
              </p>
              <Input
                value={editQuestionSetId}
                onChange={(e) => setEditQuestionSetId(e.target.value)}
                inputMode="numeric"
                className="font-mono"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Quick tips
              </p>
              <Textarea
                value={editQuickTips}
                onChange={(e) => setEditQuickTips(e.target.value)}
                rows={2}
                placeholder="Optional"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                Persona id
              </p>
              <Input
                value={editPersonaId}
                onChange={(e) => setEditPersonaId(e.target.value)}
                inputMode="numeric"
                className="font-mono"
                placeholder="Optional"
              />
            </div>
            <p className="text-xs text-grayScale-500">
              Uses <span className="font-mono">PUT /practices/&#123;id&#125;</span> with the fields above.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={savePracticeLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={savePracticeEdit} disabled={savePracticeLoading}>
              {savePracticeLoading ? <SpinnerIcon className="h-4 w-4" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this practice?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-grayScale-600">
            This will call <span className="font-mono">DELETE /practices/&#123;id&#125;</span> and remove the practice
            for this {parentTabCopy[parentTab].label.toLowerCase()}. The question set is not deleted unless your API
            cascades.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletePracticeLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeletePractice}
              disabled={deletePracticeLoading}
            >
              {deletePracticeLoading ? <SpinnerIcon className="h-4 w-4" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
