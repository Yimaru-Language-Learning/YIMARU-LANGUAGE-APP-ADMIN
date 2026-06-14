import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, ChevronDown, ChevronRight, FolderTree, Languages, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "../../components/ui/badge"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import {
  createModule,
  deleteModule,
  getCourseHierarchyByCourseId,
  getHumanLanguageHierarchy,
  getPracticesByLevel,
  updateModule,
} from "../../api/courses.api"
import { uploadImageFile } from "../../api/files.api"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import type { CourseHierarchyRow, HumanLanguageHierarchyFlatRow, Practice } from "../../types/course.types"

type IdFilterValue = number | "ALL"
type LevelFilterValue = number | "ALL"

type SubCategoryOption = { id: number; name: string; category_id: number; category_name: string }
type CourseOption = { id: number; title: string }
type SubModuleNode = { id: number; title: string; display_order: number | null }
type ModuleNode = { id: number; title: string; icon_url?: string | null; sub_modules: SubModuleNode[] }
type LevelNode = { id: number; cefr_level: string; title: string; modules: ModuleNode[] }
type CourseTreeNode = { course_id: number; course_title: string; levels: LevelNode[] }
type DeleteModuleTarget = {
  courseId: number
  moduleId: number
  moduleTitle: string
  levelTitle: string
  moduleKey: string
}
type EditModuleTarget = {
  courseId: number
  moduleId: number
  moduleKey: string
  levelKey: string
}
type HierarchyReturnState = {
  selectedSubCategoryId: IdFilterValue
  selectedCourseId: IdFilterValue
  selectedLevelId: LevelFilterValue
  expandedCourses: string[]
  expandedLevels: string[]
  expandedModules: string[]
  scrollY: number
}

const HUMAN_LANGUAGE_RETURN_STATE_KEY = "humanLanguageHierarchyReturnState"

const CEFR_ORDER = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"]
const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

const setHas = (set: Set<string>, key: string) => set.has(key)
const toggleSetValue = (setState: Dispatch<SetStateAction<Set<string>>>, key: string) => {
  setState((previous) => {
    const next = new Set(previous)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
}

function cefrSortValue(level: string) {
  const idx = CEFR_ORDER.indexOf(level.trim().toUpperCase())
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

function toSubCategoryOptions(rows: HumanLanguageHierarchyFlatRow[]): SubCategoryOption[] {
  const map = new Map<number, SubCategoryOption>()
  rows.forEach((row) => {
    if (!row.sub_category_id || map.has(row.sub_category_id)) return
    map.set(row.sub_category_id, {
      id: row.sub_category_id,
      name: row.sub_category_name ?? "Unnamed sub-category",
      category_id: row.category_id,
      category_name: row.category_name,
    })
  })
  return Array.from(map.values()).sort((a, b) => textCollator.compare(a.name, b.name) || a.id - b.id)
}

function toCourseOptions(rows: HumanLanguageHierarchyFlatRow[], subCategoryId: number): CourseOption[] {
  const map = new Map<number, CourseOption>()
  rows
    .filter((row) => row.sub_category_id === subCategoryId && !!row.course_id)
    .forEach((row) => {
      if (!row.course_id || map.has(row.course_id)) return
      map.set(row.course_id, { id: row.course_id, title: row.course_title ?? `Course ${row.course_id}` })
    })
  return Array.from(map.values()).sort((a, b) => textCollator.compare(a.title, b.title) || a.id - b.id)
}

function toLevelNodes(rows: CourseHierarchyRow[]): LevelNode[] {
  const levelMap = new Map<number, { cefr_level: string; title: string; modules: Map<number, ModuleNode> }>()
  rows.forEach((row) => {
    if (!row.level_id) return
    const levelId = Number(row.level_id)
    const cefr = (row.cefr_level ?? "").trim().toUpperCase()
    if (!levelMap.has(levelId)) {
      levelMap.set(levelId, {
        cefr_level: cefr,
        title: row.level_title?.trim() || cefr || `Level ${levelId}`,
        modules: new Map(),
      })
    }

    if (!row.module_id) return
    const moduleId = Number(row.module_id)
    const levelNode = levelMap.get(levelId)!
    if (!levelNode.modules.has(moduleId)) {
      levelNode.modules.set(moduleId, {
        id: moduleId,
        title: row.module_title?.trim() || `Module ${moduleId}`,
        icon_url: row.module_icon_url ?? null,
        sub_modules: [],
      })
    } else if (row.module_icon_url && !levelNode.modules.get(moduleId)?.icon_url) {
      levelNode.modules.set(moduleId, {
        ...levelNode.modules.get(moduleId)!,
        icon_url: row.module_icon_url,
      })
    }

    if (!row.sub_module_id) return
    const moduleNode = levelNode.modules.get(moduleId)!
    const subModuleId = Number(row.sub_module_id)
    if (moduleNode.sub_modules.some((item) => item.id === subModuleId)) return
    moduleNode.sub_modules.push({
      id: subModuleId,
      title: row.sub_module_title?.trim() || `Sub-module ${subModuleId}`,
      display_order: row.sub_module_display_order ?? null,
    })
  })

  return Array.from(levelMap.entries())
    .map(([id, level]) => ({
      id,
      cefr_level: level.cefr_level,
      title: level.title,
      modules: Array.from(level.modules.values())
        .map((module) => ({
          ...module,
          sub_modules: [...module.sub_modules].sort((a, b) => {
            const ao = a.display_order ?? Number.MAX_SAFE_INTEGER
            const bo = b.display_order ?? Number.MAX_SAFE_INTEGER
            return ao - bo || textCollator.compare(a.title, b.title) || a.id - b.id
          }),
        }))
        .sort((a, b) => textCollator.compare(a.title, b.title) || a.id - b.id),
    }))
    .sort((a, b) => {
      const byCefr = cefrSortValue(a.cefr_level) - cefrSortValue(b.cefr_level)
      return byCefr || textCollator.compare(a.title, b.title) || a.id - b.id
    })
}

function getNextDefaultModuleName(level: LevelNode) {
  const usedMinorNumbers = new Set<number>()
  level.modules.forEach((module) => {
    const match = module.title.trim().match(/^module-\s*1\.(\d+)$/i)
    if (!match) return
    const minor = Number(match[1])
    if (Number.isFinite(minor) && minor > 0) {
      usedMinorNumbers.add(minor)
    }
  })

  let nextMinor = 1
  while (usedMinorNumbers.has(nextMinor)) {
    nextMinor += 1
  }
  return `Module-1.${nextMinor}`
}

export function HumanLanguageHierarchyPage() {
  const readPersistedReturnState = (): HierarchyReturnState | null => {
    try {
      const raw = window.sessionStorage.getItem(HUMAN_LANGUAGE_RETURN_STATE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<HierarchyReturnState>
      return {
        selectedSubCategoryId: parsed.selectedSubCategoryId ?? "ALL",
        selectedCourseId: parsed.selectedCourseId ?? "ALL",
        selectedLevelId: parsed.selectedLevelId ?? "ALL",
        expandedCourses: Array.isArray(parsed.expandedCourses) ? parsed.expandedCourses : [],
        expandedLevels: Array.isArray(parsed.expandedLevels) ? parsed.expandedLevels : [],
        expandedModules: Array.isArray(parsed.expandedModules) ? parsed.expandedModules : [],
        scrollY: Number.isFinite(parsed.scrollY) ? Number(parsed.scrollY) : 0,
      }
    } catch {
      return null
    }
  }

  const persistedReturnStateRef = useRef<HierarchyReturnState | null>(readPersistedReturnState())
  const skipInitialSubCategoryResetRef = useRef(!!persistedReturnStateRef.current)
  const skipFilterValidationRef = useRef(!!persistedReturnStateRef.current)
  const pendingRestoreScrollRef = useRef<number | null>(persistedReturnStateRef.current?.scrollY ?? null)

  const [hierarchyRows, setHierarchyRows] = useState<HumanLanguageHierarchyFlatRow[]>([])
  const [hierarchyLoading, setHierarchyLoading] = useState(true)
  const [hierarchyError, setHierarchyError] = useState<string | null>(null)

  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<IdFilterValue>(
    persistedReturnStateRef.current?.selectedSubCategoryId ?? "ALL",
  )
  const [selectedCourseId, setSelectedCourseId] = useState<IdFilterValue>(
    persistedReturnStateRef.current?.selectedCourseId ?? "ALL",
  )
  const [selectedLevelId, setSelectedLevelId] = useState<LevelFilterValue>(
    persistedReturnStateRef.current?.selectedLevelId ?? "ALL",
  )

  const [courseRowsByCourseId, setCourseRowsByCourseId] = useState<Record<number, CourseHierarchyRow[]>>({})
  const [courseHierarchyLoading, setCourseHierarchyLoading] = useState(false)
  const [courseHierarchyError, setCourseHierarchyError] = useState<string | null>(null)
  const [levelPracticesByLevelId, setLevelPracticesByLevelId] = useState<Record<number, Practice[]>>({})

  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    () => new Set(persistedReturnStateRef.current?.expandedCourses ?? []),
  )
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
    () => new Set(persistedReturnStateRef.current?.expandedLevels ?? []),
  )
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(persistedReturnStateRef.current?.expandedModules ?? []),
  )
  const [createModuleOpen, setCreateModuleOpen] = useState(false)
  const [createModuleSaving, setCreateModuleSaving] = useState(false)
  const [createModuleCourseId, setCreateModuleCourseId] = useState<number | null>(null)
  const [createModuleLevelId, setCreateModuleLevelId] = useState<number | null>(null)
  const [createModuleLevelKey, setCreateModuleLevelKey] = useState<string>("")
  const [createModuleTitle, setCreateModuleTitle] = useState("")
  const [createModuleUseDefaultNaming, setCreateModuleUseDefaultNaming] = useState(false)
  const [createModuleDefaultTitle, setCreateModuleDefaultTitle] = useState("")
  const [createModuleIconSource, setCreateModuleIconSource] = useState<"url" | "file">("url")
  const [createModuleIconUrl, setCreateModuleIconUrl] = useState("")
  const [createModuleIconFile, setCreateModuleIconFile] = useState<File | null>(null)
  const [createModuleDisplayOrder, setCreateModuleDisplayOrder] = useState(0)
  const [deleteModuleSavingId, setDeleteModuleSavingId] = useState<number | null>(null)
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false)
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<DeleteModuleTarget | null>(null)
  const [editModuleDialogOpen, setEditModuleDialogOpen] = useState(false)
  const [editModuleSaving, setEditModuleSaving] = useState(false)
  const [editModuleTarget, setEditModuleTarget] = useState<EditModuleTarget | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState("")
  const [editModuleDisplayOrder, setEditModuleDisplayOrder] = useState(0)
  const [editModuleIconSource, setEditModuleIconSource] = useState<"url" | "file">("url")
  const [editModuleIconUrl, setEditModuleIconUrl] = useState("")
  const [editModuleOriginalIconUrl, setEditModuleOriginalIconUrl] = useState("")
  const [editModuleIconFile, setEditModuleIconFile] = useState<File | null>(null)

  const subCategoryOptions = useMemo(() => toSubCategoryOptions(hierarchyRows), [hierarchyRows])
  const selectedSubCategory = useMemo(
    () => (selectedSubCategoryId === "ALL" ? null : subCategoryOptions.find((item) => item.id === selectedSubCategoryId) ?? null),
    [selectedSubCategoryId, subCategoryOptions],
  )
  const courseOptions = useMemo(
    () => (selectedSubCategoryId === "ALL" ? [] : toCourseOptions(hierarchyRows, selectedSubCategoryId)),
    [hierarchyRows, selectedSubCategoryId],
  )
  const selectedCourse = useMemo(
    () => (selectedCourseId === "ALL" ? null : courseOptions.find((item) => item.id === selectedCourseId) ?? null),
    [selectedCourseId, courseOptions],
  )

  const targetCourseIds = useMemo(() => {
    if (selectedSubCategoryId === "ALL") return []
    if (selectedCourseId !== "ALL") return [selectedCourseId]
    return courseOptions.map((course) => course.id)
  }, [selectedSubCategoryId, selectedCourseId, courseOptions])

  const courseTrees = useMemo<CourseTreeNode[]>(() => {
    const targetSet = new Set(targetCourseIds)
    return courseOptions
      .filter((course) => targetSet.has(course.id))
      .map((course) => {
        const levels = toLevelNodes(courseRowsByCourseId[course.id] ?? [])
        return {
          course_id: course.id,
          course_title: course.title,
          levels: selectedLevelId === "ALL" ? levels : levels.filter((level) => level.id === selectedLevelId),
        }
      })
  }, [courseOptions, courseRowsByCourseId, targetCourseIds, selectedLevelId])

  const fetchHumanLanguageHierarchy = useCallback(async () => {
    setHierarchyLoading(true)
    setHierarchyError(null)
    try {
      const res = await getHumanLanguageHierarchy()
      setHierarchyRows(res.data?.data ?? [])
    } catch (err) {
      console.error(err)
      setHierarchyRows([])
      setHierarchyError("Could not load Human Language hierarchy")
      toast.error("Failed to load Human Language hierarchy")
    } finally {
      setHierarchyLoading(false)
    }
  }, [])

  const fetchHierarchiesForCourses = useCallback(async (courseIds: number[]) => {
    if (courseIds.length === 0) {
      setCourseRowsByCourseId({})
      setLevelPracticesByLevelId({})
      setCourseHierarchyError(null)
      return
    }

    setCourseHierarchyLoading(true)
    setCourseHierarchyError(null)
    try {
      const courseEntries = await Promise.all(
        courseIds.map(async (courseId) => {
          try {
            const response = await getCourseHierarchyByCourseId(courseId)
            return [courseId, response.data?.data ?? []] as const
          } catch {
            return [courseId, [] as CourseHierarchyRow[]] as const
          }
        }),
      )
      const nextRowsByCourseId = Object.fromEntries(courseEntries)
      setCourseRowsByCourseId(nextRowsByCourseId)

      const levelIds = Array.from(
        new Set(
          courseEntries
            .flatMap((entry) => entry[1])
            .map((row) => Number(row.level_id))
            .filter((id) => Number.isFinite(id) && id > 0),
        ),
      )

      const levelPracticeEntries = await Promise.all(
        levelIds.map(async (levelId) => {
          try {
            const practiceRes = await getPracticesByLevel(levelId)
            return [levelId, (practiceRes.data?.data?.practices ?? []).filter((practice) => practice.is_active)] as const
          } catch {
            return [levelId, [] as Practice[]] as const
          }
        }),
      )
      setLevelPracticesByLevelId(Object.fromEntries(levelPracticeEntries))
    } catch (err) {
      console.error(err)
      setCourseRowsByCourseId({})
      setLevelPracticesByLevelId({})
      setCourseHierarchyError("Could not load hierarchy for selected courses")
      toast.error("Failed to load course hierarchy")
    } finally {
      setCourseHierarchyLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHumanLanguageHierarchy()
  }, [fetchHumanLanguageHierarchy])

  useEffect(() => {
    window.sessionStorage.removeItem(HUMAN_LANGUAGE_RETURN_STATE_KEY)
  }, [])

  useEffect(() => {
    if (!hierarchyLoading) {
      skipFilterValidationRef.current = false
    }
  }, [hierarchyLoading])

  useEffect(() => {
    if (skipInitialSubCategoryResetRef.current) {
      skipInitialSubCategoryResetRef.current = false
      return
    }
    if (selectedSubCategoryId === "ALL") {
      setSelectedCourseId("ALL")
      setSelectedLevelId("ALL")
      setCourseRowsByCourseId({})
      setLevelPracticesByLevelId({})
      setExpandedCourses(new Set())
      setExpandedLevels(new Set())
      setExpandedModules(new Set())
      return
    }
    setSelectedCourseId("ALL")
    setSelectedLevelId("ALL")
  }, [selectedSubCategoryId])

  useEffect(() => {
    if (selectedSubCategoryId === "ALL") return
    void fetchHierarchiesForCourses(targetCourseIds)
  }, [selectedSubCategoryId, targetCourseIds, fetchHierarchiesForCourses])

  useEffect(() => {
    if (skipFilterValidationRef.current) return
    if (selectedSubCategoryId !== "ALL" && !subCategoryOptions.some((item) => item.id === selectedSubCategoryId)) {
      setSelectedSubCategoryId("ALL")
    }
  }, [selectedSubCategoryId, subCategoryOptions])

  useEffect(() => {
    if (skipFilterValidationRef.current) return
    if (selectedCourseId !== "ALL" && !courseOptions.some((item) => item.id === selectedCourseId)) {
      setSelectedCourseId("ALL")
    }
  }, [selectedCourseId, courseOptions])

  useEffect(() => {
    if (skipFilterValidationRef.current) return
    const levelIds = new Set(courseTrees.flatMap((course) => course.levels.map((level) => level.id)))
    if (selectedLevelId !== "ALL" && !levelIds.has(selectedLevelId)) {
      setSelectedLevelId("ALL")
    }
  }, [selectedLevelId, courseTrees])

  useEffect(() => {
    const courseKeys = new Set(courseTrees.map((course) => `course-${course.course_id}`))
    const levelKeys = new Set(
      courseTrees.flatMap((course) => course.levels.map((level) => `level-${course.course_id}-${level.id}`)),
    )
    const moduleKeys = new Set(
      courseTrees.flatMap((course) =>
        course.levels.flatMap((level) => level.modules.map((module) => `module-${course.course_id}-${level.id}-${module.id}`)),
      ),
    )

    setExpandedCourses((previous) => new Set([...previous].filter((key) => courseKeys.has(key))))
    setExpandedLevels((previous) => new Set([...previous].filter((key) => levelKeys.has(key))))
    setExpandedModules((previous) => new Set([...previous].filter((key) => moduleKeys.has(key))))

    if (courseTrees.length > 0) {
      const firstCourseKey = `course-${courseTrees[0].course_id}`
      setExpandedCourses((previous) => (previous.size > 0 ? previous : new Set([firstCourseKey])))
    }
  }, [courseTrees])

  useEffect(() => {
    if (pendingRestoreScrollRef.current == null) return
    if (courseHierarchyLoading) return
    const targetY = pendingRestoreScrollRef.current
    pendingRestoreScrollRef.current = null
    window.setTimeout(() => {
      window.scrollTo({ top: targetY, behavior: "smooth" })
    }, 60)
  }, [courseHierarchyLoading, courseTrees])

  const handleActionClick = (label: string) => {
    toast.info(`${label} UI is ready. Endpoint wiring can be added next.`)
  }

  const openCreateModuleModal = (courseId: number, level: LevelNode, levelKey: string) => {
    setCreateModuleCourseId(courseId)
    setCreateModuleLevelId(level.id)
    setCreateModuleLevelKey(levelKey)
    setCreateModuleUseDefaultNaming(false)
    setCreateModuleDefaultTitle(getNextDefaultModuleName(level))
    setCreateModuleTitle("")
    setCreateModuleIconSource("url")
    setCreateModuleIconUrl("")
    setCreateModuleIconFile(null)
    setCreateModuleDisplayOrder(level.modules.length)
    setCreateModuleOpen(true)
  }

  const handleCreateModule = async () => {
    if (createModuleLevelId == null || createModuleCourseId == null) return
    const title = (createModuleUseDefaultNaming ? createModuleDefaultTitle : createModuleTitle).trim()
    if (!title) {
      toast.error("Module title is required")
      return
    }

    setCreateModuleSaving(true)
    try {
      let uploadedIconUrl: string | undefined
      if (createModuleIconSource === "url" && createModuleIconUrl.trim()) {
        const uploadRes = await uploadImageFile(createModuleIconUrl.trim())
        uploadedIconUrl = uploadRes.data?.data?.url?.trim() || undefined
        if (!uploadedIconUrl) {
          throw new Error("Icon upload from URL did not return a file URL")
        }
      } else if (createModuleIconSource === "file" && createModuleIconFile) {
        const uploadRes = await uploadImageFile(createModuleIconFile)
        uploadedIconUrl = uploadRes.data?.data?.url?.trim() || undefined
        if (!uploadedIconUrl) {
          throw new Error("Icon file upload did not return a file URL")
        }
      }

      await createModule({
        level_id: createModuleLevelId,
        title,
        icon_url: uploadedIconUrl,
        display_order: createModuleDisplayOrder,
        is_active: true,
      })
      toast.success("Module created")

      setExpandedCourses((previous) => new Set(previous).add(`course-${createModuleCourseId}`))
      setExpandedLevels((previous) => new Set(previous).add(createModuleLevelKey))
      setCreateModuleOpen(false)

      const refreshCourseIds =
        selectedCourseId === "ALL" ? targetCourseIds : [createModuleCourseId]
      await fetchHierarchiesForCourses(refreshCourseIds)
    } catch (error) {
      console.error(error)
      toast.error("Failed to create module")
    } finally {
      setCreateModuleSaving(false)
    }
  }

  const openDeleteModuleDialog = (courseId: number, levelTitle: string, module: ModuleNode, moduleKey: string) => {
    if (deleteModuleSavingId != null) return
    setDeleteModuleTarget({
      courseId,
      moduleId: module.id,
      moduleTitle: module.title,
      levelTitle,
      moduleKey,
    })
    setDeleteModuleDialogOpen(true)
  }

  const openEditModuleDialog = (
    courseId: number,
    levelKey: string,
    moduleKey: string,
    module: ModuleNode,
    moduleDisplayOrder: number,
  ) => {
    if (editModuleSaving) return
    const existingIconUrl = module.icon_url?.trim() ?? ""
    setEditModuleTarget({
      courseId,
      moduleId: module.id,
      moduleKey,
      levelKey,
    })
    setEditModuleTitle(module.title)
    setEditModuleDisplayOrder(moduleDisplayOrder)
    setEditModuleIconSource("url")
    setEditModuleIconUrl(existingIconUrl)
    setEditModuleOriginalIconUrl(existingIconUrl)
    setEditModuleIconFile(null)
    setEditModuleDialogOpen(true)
  }

  const handleUpdateModule = async () => {
    if (!editModuleTarget) return
    const title = editModuleTitle.trim()
    if (!title) {
      toast.error("Module title is required")
      return
    }

    setEditModuleSaving(true)
    try {
      const inputIconUrl = editModuleIconUrl.trim()
      let uploadedIconUrl: string | undefined
      if (editModuleIconSource === "file" && editModuleIconFile) {
        const uploadRes = await uploadImageFile(editModuleIconFile)
        uploadedIconUrl = uploadRes.data?.data?.url?.trim() || undefined
        if (!uploadedIconUrl) {
          throw new Error("Icon file upload did not return a file URL")
        }
      } else if (editModuleIconSource === "url") {
        if (!inputIconUrl) uploadedIconUrl = undefined
        else if (inputIconUrl === editModuleOriginalIconUrl) uploadedIconUrl = inputIconUrl
        else {
          const uploadRes = await uploadImageFile(inputIconUrl)
          uploadedIconUrl = uploadRes.data?.data?.url?.trim() || undefined
          if (!uploadedIconUrl) {
            throw new Error("Icon upload from URL did not return a file URL")
          }
        }
      }

      await updateModule(editModuleTarget.moduleId, {
        title,
        icon_url: uploadedIconUrl,
        display_order: editModuleDisplayOrder,
        is_active: true,
      })
      toast.success("Module updated")

      setExpandedCourses((previous) => new Set(previous).add(`course-${editModuleTarget.courseId}`))
      setExpandedLevels((previous) => new Set(previous).add(editModuleTarget.levelKey))
      setExpandedModules((previous) => new Set(previous).add(editModuleTarget.moduleKey))
      setEditModuleDialogOpen(false)
      setEditModuleTarget(null)

      const refreshCourseIds = selectedCourseId === "ALL" ? targetCourseIds : [editModuleTarget.courseId]
      await fetchHierarchiesForCourses(refreshCourseIds)
    } catch (error) {
      console.error(error)
      toast.error("Failed to update module")
    } finally {
      setEditModuleSaving(false)
    }
  }

  const handleDeleteModule = async () => {
    if (deleteModuleSavingId != null) return
    if (!deleteModuleTarget) return

    setDeleteModuleSavingId(deleteModuleTarget.moduleId)
    try {
      await deleteModule(deleteModuleTarget.moduleId)
      toast.success("Module deleted")
      setExpandedModules((previous) => {
        const next = new Set(previous)
        next.delete(deleteModuleTarget.moduleKey)
        return next
      })

      setDeleteModuleDialogOpen(false)
      setDeleteModuleTarget(null)

      const refreshCourseIds = selectedCourseId === "ALL" ? targetCourseIds : [deleteModuleTarget.courseId]
      await fetchHierarchiesForCourses(refreshCourseIds)
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete module")
    } finally {
      setDeleteModuleSavingId(null)
    }
  }

  const persistReturnState = () => {
    const payload: HierarchyReturnState = {
      selectedSubCategoryId,
      selectedCourseId,
      selectedLevelId,
      expandedCourses: Array.from(expandedCourses),
      expandedLevels: Array.from(expandedLevels),
      expandedModules: Array.from(expandedModules),
      scrollY: window.scrollY,
    }
    window.sessionStorage.setItem(HUMAN_LANGUAGE_RETURN_STATE_KEY, JSON.stringify(payload))
  }

  const clearFilters = () => {
    setSelectedSubCategoryId("ALL")
    setSelectedCourseId("ALL")
    setSelectedLevelId("ALL")
  }

  const activeFilterCount = countActiveFilters([
    { value: selectedSubCategoryId, defaultValue: "ALL" },
    { value: selectedCourseId, defaultValue: "ALL" },
    { value: selectedLevelId, defaultValue: "ALL" },
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <Languages className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-900">Human Language</h1>
            <p className="text-sm text-grayScale-500">Hierarchy management</p>
          </div>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link to="/content">Back to Content Management</Link>
        </Button>
      </div>

      <AdminFiltersPanel
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        defaultOpen={activeFilterCount > 0}
      >
        <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="hl-subcategory-filter" className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">
                Subcategory
              </label>
              {hierarchyLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-grayScale-500">
                  <SpinnerIcon className="h-5 w-5 text-brand-500" alt="" />
                  Loading hierarchy...
                </div>
              ) : hierarchyError ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-600">{hierarchyError}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void fetchHumanLanguageHierarchy()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <Select
                  id="hl-subcategory-filter"
                  value={selectedSubCategoryId === "ALL" ? "ALL" : String(selectedSubCategoryId)}
                  onChange={(event) => {
                    const value = event.target.value
                    setSelectedSubCategoryId(value === "ALL" ? "ALL" : Number(value))
                  }}
                >
                  <option value="ALL">All subcategories</option>
                  {subCategoryOptions.map((subCategory) => (
                    <option key={subCategory.id} value={String(subCategory.id)}>
                      {subCategory.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="hl-course-filter" className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">
                Course
              </label>
              {selectedSubCategoryId === "ALL" ? (
                <p className="rounded-lg border border-dashed border-grayScale-200 bg-grayScale-50/50 px-3 py-2 text-sm text-grayScale-500">
                  Select a sub-category first.
                </p>
              ) : (
                <Select
                  id="hl-course-filter"
                  value={selectedCourseId === "ALL" ? "ALL" : String(selectedCourseId)}
                  onChange={(event) => {
                    const value = event.target.value
                    setSelectedCourseId(value === "ALL" ? "ALL" : Number(value))
                  }}
                >
                  <option value="ALL">All courses</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={String(course.id)}>
                      {course.title}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="hl-level-filter" className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">
                Fetch lessons by level
              </label>
              {selectedCourseId === "ALL" ? (
                <Select id="hl-level-filter" value="ALL LEVELS" disabled>
                  <option value="ALL LEVELS">ALL LEVELS</option>
                </Select>
              ) : (
                <Select
                  id="hl-level-filter"
                  value={selectedLevelId === "ALL" ? "ALL" : String(selectedLevelId)}
                  onChange={(event) => {
                    const value = event.target.value
                    setSelectedLevelId(value === "ALL" ? "ALL" : Number(value))
                  }}
                >
                  <option value="ALL">ALL LEVELS</option>
                  {courseTrees
                    .flatMap((course) => course.levels)
                    .map((level) => (
                      <option key={level.id} value={String(level.id)}>
                        {level.title}
                      </option>
                    ))}
                </Select>
              )}
            </div>
          </div>
      </AdminFiltersPanel>

      {selectedSubCategoryId !== "ALL" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="text-red-600" onClick={() => handleActionClick("Delete selected sub-category")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete selected sub-category
          </Button>
          <Button type="button" variant="outline" className="text-red-600" onClick={() => handleActionClick("Delete selected course")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete selected course
          </Button>
        </div>
      ) : null}

      {selectedSubCategoryId === "ALL" ? (
        <Card className="border border-dashed border-grayScale-200 bg-grayScale-50/40 shadow-sm">
          <CardContent className="flex items-start gap-3 py-5">
            <FolderTree className="mt-0.5 h-5 w-5 shrink-0 text-grayScale-400" aria-hidden />
            <div>
              <p className="text-sm font-medium text-grayScale-800">Select a sub-category to start managing hierarchy</p>
              <p className="mt-1 text-sm text-grayScale-500">
                Choose a sub-category from the list to view and manage its course structure.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : courseHierarchyLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-grayScale-500">
          <SpinnerIcon className="h-5 w-5 text-brand-500" alt="" />
          Loading hierarchy tree...
        </div>
      ) : courseHierarchyError ? (
        <Card className="border border-red-200 bg-red-50/60">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <p className="text-sm text-red-700">{courseHierarchyError}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchHierarchiesForCourses(targetCourseIds)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : courseTrees.length === 0 ? (
        <Card className="border border-dashed border-grayScale-200 bg-grayScale-50/40 shadow-sm">
          <CardContent className="py-6 text-sm text-grayScale-500">No hierarchy records found for this selection.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courseTrees.map((course) => {
            const courseKey = `course-${course.course_id}`
            const courseOpen = setHas(expandedCourses, courseKey)
            return (
              <Card key={course.course_id} className="border border-grayScale-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between gap-3 border-b border-grayScale-200 px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left"
                      onClick={() => toggleSetValue(setExpandedCourses, courseKey)}
                    >
                      {courseOpen ? <ChevronDown className="h-4 w-4 text-grayScale-500" /> : <ChevronRight className="h-4 w-4 text-grayScale-500" />}
                      <span className="font-semibold text-grayScale-900">{course.course_title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {course.levels.length} levels
                      </Badge>
                    </button>
                    <Button type="button" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleActionClick("Add next CEFR level")}>
                      Add next CEFR level
                    </Button>
                  </div>

                  {courseOpen ? (
                    <div className="space-y-3 p-4">
                      {course.levels.length === 0 ? (
                        <p className="text-sm text-grayScale-500">No levels for this course.</p>
                      ) : (
                        course.levels.map((level) => {
                          const levelKey = `level-${course.course_id}-${level.id}`
                          const levelOpen = setHas(expandedLevels, levelKey)
                          const levelPractices = levelPracticesByLevelId[level.id] ?? []
                          return (
                            <div key={level.id} className="rounded-xl border border-grayScale-200">
                              <div className="flex items-center justify-between gap-3 border-b border-grayScale-200 px-3 py-2.5">
                                <button
                                  type="button"
                                  className="flex items-center gap-2 text-left"
                                  onClick={() => toggleSetValue(setExpandedLevels, levelKey)}
                                >
                                  {levelOpen ? (
                                    <ChevronDown className="h-4 w-4 text-grayScale-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-grayScale-500" />
                                  )}
                                  <span className="font-semibold text-grayScale-900">{level.title}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {level.modules.length} module(s)
                                  </Badge>
                                </button>
                                <Button type="button" variant="outline" size="sm" className="text-red-600" onClick={() => handleActionClick("Remove level")}>
                                  <Trash2 className="mr-1.5 h-4 w-4" />
                                  Remove
                                </Button>
                              </div>

                              {levelOpen ? (
                                <div className="space-y-3 p-3">
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openCreateModuleModal(course.course_id, level, levelKey)}
                                    >
                                      <Plus className="mr-1.5 h-4 w-4" />
                                      Add Module
                                    </Button>
                                  </div>

                                  {levelPractices.length > 0 ? (
                                    <div className="rounded-lg border border-grayScale-200 bg-grayScale-50/50 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">Level practices</p>
                                      <ul className="mt-2 space-y-1.5 text-sm text-grayScale-700">
                                        {levelPractices.map((practice) => (
                                          <li key={practice.id}>{practice.title}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}

                                  {level.modules.length === 0 ? (
                                    <p className="text-sm text-grayScale-500">No modules yet.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {level.modules.map((module) => {
                                        const moduleKey = `module-${course.course_id}-${level.id}-${module.id}`
                                        const moduleOpen = setHas(expandedModules, moduleKey)
                                        return (
                                          <div key={module.id} className="rounded-lg border border-grayScale-200">
                                            <div className="flex items-center justify-between gap-3 px-3 py-2">
                                              <button
                                                type="button"
                                                className="flex items-center gap-2 text-left"
                                                onClick={() => toggleSetValue(setExpandedModules, moduleKey)}
                                              >
                                                {moduleOpen ? (
                                                  <ChevronDown className="h-4 w-4 text-grayScale-500" />
                                                ) : (
                                                  <ChevronRight className="h-4 w-4 text-grayScale-500" />
                                                )}
                                                {module.icon_url ? (
                                                  <img
                                                    src={module.icon_url}
                                                    alt=""
                                                    className="h-5 w-5 rounded object-cover ring-1 ring-grayScale-200"
                                                  />
                                                ) : null}
                                                <span className="font-medium text-grayScale-900">Module: {module.title}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                  {module.sub_modules.length} sub-module(s)
                                                </Badge>
                                              </button>
                                              <div className="flex flex-wrap gap-2">
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleActionClick("Add sub-module")}>
                                                  <Plus className="mr-1.5 h-4 w-4" />
                                                  Add Sub-module
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  disabled={editModuleSaving}
                                                  onClick={() =>
                                                    openEditModuleDialog(course.course_id, levelKey, moduleKey, module, level.modules.indexOf(module) + 1)
                                                  }
                                                >
                                                  <Pencil className="mr-1.5 h-4 w-4" />
                                                  Edit
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-red-600"
                                                  disabled={deleteModuleSavingId === module.id}
                                                  onClick={() => openDeleteModuleDialog(course.course_id, level.title, module, moduleKey)}
                                                >
                                                  <Trash2 className="mr-1.5 h-4 w-4" />
                                                  {deleteModuleSavingId === module.id ? "Removing..." : "Remove"}
                                                </Button>
                                              </div>
                                            </div>

                                            {moduleOpen ? (
                                              <div className="space-y-2 border-t border-grayScale-200 p-3">
                                                {module.sub_modules.length === 0 ? (
                                                  <p className="text-sm text-grayScale-500">No sub-modules yet.</p>
                                                ) : (
                                                  module.sub_modules.map((subModule) => (
                                                    <div
                                                      key={subModule.id}
                                                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-grayScale-200 px-3 py-2"
                                                    >
                                                      <div className="text-sm font-medium text-grayScale-900">
                                                        Sub-module: {subModule.title}
                                                      </div>
                                                      <div className="flex flex-wrap gap-2">
                                                        <Button type="button" variant="outline" size="sm" asChild>
                                                          <Link
                                                            to={`/content/human-language/${selectedSubCategory?.category_id ?? ""}/${course.course_id}/sub-module/${subModule.id}`}
                                                            onClick={persistReturnState}
                                                          >
                                                            Open
                                                          </Link>
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          variant="outline"
                                                          size="sm"
                                                          className="text-red-600"
                                                          onClick={() => handleActionClick("Remove sub-module")}
                                                        >
                                                          <Trash2 className="mr-1.5 h-4 w-4" />
                                                          Remove
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  ))
                                                )}
                                              </div>
                                            ) : null}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )
                        })
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={createModuleOpen} onOpenChange={(open) => (!createModuleSaving ? setCreateModuleOpen(open) : null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create module</DialogTitle>
            <DialogDescription>
              Add a module to this level.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Module naming</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={!createModuleUseDefaultNaming ? "default" : "outline"}
                  className={!createModuleUseDefaultNaming ? "bg-brand-500 hover:bg-brand-600" : ""}
                  disabled={createModuleSaving}
                  onClick={() => setCreateModuleUseDefaultNaming(false)}
                >
                  Custom title
                </Button>
                <Button
                  type="button"
                  variant={createModuleUseDefaultNaming ? "default" : "outline"}
                  className={createModuleUseDefaultNaming ? "bg-brand-500 hover:bg-brand-600" : ""}
                  disabled={createModuleSaving}
                  onClick={() => setCreateModuleUseDefaultNaming(true)}
                >
                  Default naming
                </Button>
              </div>
              {createModuleUseDefaultNaming ? (
                <p className="mt-2 text-xs text-grayScale-500">Auto title: {createModuleDefaultTitle}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Title</label>
              <Input
                value={createModuleUseDefaultNaming ? createModuleDefaultTitle : createModuleTitle}
                onChange={(event) => setCreateModuleTitle(event.target.value)}
                placeholder="e.g. Introduction"
                disabled={createModuleSaving || createModuleUseDefaultNaming}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Icon URL (optional)</label>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={createModuleIconSource === "url" ? "default" : "outline"}
                  className={createModuleIconSource === "url" ? "bg-brand-500 hover:bg-brand-600" : ""}
                  disabled={createModuleSaving}
                  onClick={() => setCreateModuleIconSource("url")}
                >
                  Public URL
                </Button>
                <Button
                  type="button"
                  variant={createModuleIconSource === "file" ? "default" : "outline"}
                  className={createModuleIconSource === "file" ? "bg-brand-500 hover:bg-brand-600" : ""}
                  disabled={createModuleSaving}
                  onClick={() => setCreateModuleIconSource("file")}
                >
                  Upload from PC
                </Button>
              </div>
              {createModuleIconSource === "url" ? (
                <Input
                  value={createModuleIconUrl}
                  onChange={(event) => setCreateModuleIconUrl(event.target.value)}
                  placeholder="https://example.com/icon.png"
                  disabled={createModuleSaving}
                />
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  disabled={createModuleSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setCreateModuleIconFile(file)
                  }}
                />
              )}
              <p className="mt-1 text-xs text-grayScale-500">
                Icon is uploaded through `/files/upload` and the returned MinIO URL is saved as `icon_url`.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={createModuleSaving}
              onClick={() => setCreateModuleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-brand-500 hover:bg-brand-600"
              disabled={createModuleSaving}
              onClick={() => void handleCreateModule()}
            >
              {createModuleSaving ? "Creating..." : "Create module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editModuleDialogOpen}
        onOpenChange={(open) => {
          if (editModuleSaving) return
          setEditModuleDialogOpen(open)
          if (!open) setEditModuleTarget(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update module</DialogTitle>
            <DialogDescription>
              Update this module&apos;s name, order, and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Title</label>
              <Input
                value={editModuleTitle}
                onChange={(event) => setEditModuleTitle(event.target.value)}
                placeholder="Updated title"
                disabled={editModuleSaving}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Display order</label>
              <Input
                type="number"
                min={0}
                value={editModuleDisplayOrder}
                onChange={(event) => setEditModuleDisplayOrder(Math.max(0, Number(event.target.value) || 0))}
                disabled={editModuleSaving}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">Icon URL (optional)</label>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={editModuleIconSource === "url" ? "default" : "outline"}
                  className={editModuleIconSource === "url" ? "bg-brand-500 hover:bg-brand-600" : ""}
                  disabled={editModuleSaving}
                  onClick={() => setEditModuleIconSource("url")}
                >
                  Public URL
                </Button>
                <Button
                  type="button"
                  variant={editModuleIconSource === "file" ? "default" : "outline"}
                  className={editModuleIconSource === "file" ? "bg-brand-500 hover:bg-brand-600" : ""}
                  disabled={editModuleSaving}
                  onClick={() => setEditModuleIconSource("file")}
                >
                  Upload from PC
                </Button>
              </div>
              {editModuleIconSource === "url" ? (
                <Input
                  value={editModuleIconUrl}
                  onChange={(event) => setEditModuleIconUrl(event.target.value)}
                  placeholder="https://example.com/icon.png"
                  disabled={editModuleSaving}
                />
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  disabled={editModuleSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setEditModuleIconFile(file)
                  }}
                />
              )}
              <p className="mt-1 text-xs text-grayScale-500">
                If you provide a new icon, it is uploaded through `/files/upload`, then saved as `icon_url`.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={editModuleSaving}
              onClick={() => {
                setEditModuleDialogOpen(false)
                setEditModuleTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-brand-500 hover:bg-brand-600"
              disabled={editModuleSaving || !editModuleTarget}
              onClick={() => void handleUpdateModule()}
            >
              {editModuleSaving ? "Updating..." : "Update module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteModuleDialogOpen}
        onOpenChange={(open) => {
          if (deleteModuleSavingId != null) return
          setDeleteModuleDialogOpen(open)
          if (!open) setDeleteModuleTarget(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete module?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-grayScale-700">{deleteModuleTarget?.moduleTitle ?? "this module"}</span> from{" "}
              <span className="font-medium text-grayScale-700">{deleteModuleTarget?.levelTitle ?? "this level"}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteModuleSavingId != null}
              onClick={() => {
                setDeleteModuleDialogOpen(false)
                setDeleteModuleTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteModuleSavingId != null || !deleteModuleTarget}
              onClick={() => void handleDeleteModule()}
            >
              {deleteModuleSavingId != null ? "Deleting..." : "Delete module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
