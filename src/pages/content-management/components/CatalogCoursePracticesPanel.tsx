import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  deleteExamPrepPractice,
  getExamPrepCatalogCoursePractices,
  setExamPrepPracticePublishStatus,
} from "../../../api/courses.api"
import { unwrapPracticesList } from "../../../lib/parentContextPractice"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { ContentListSearchFilterBar } from "./ContentListSearchFilterBar"
import { ModulePracticeCard } from "./ModulePracticeCard"
import {
  filterBySearchAndPublishStatus,
  type PublishStatusFilter,
} from "../../../lib/contentListFilters"
import type {
  ParentContextPractice,
  PracticePublishStatus,
} from "../../../types/course.types"

function extractPracticesPage(
  res: Awaited<ReturnType<typeof getExamPrepCatalogCoursePractices>>,
): { practices: ParentContextPractice[]; totalCount: number } {
  const body = res.data
  const data =
    body && typeof body === "object" && "data" in body
      ? (body as { data?: { practices?: unknown[]; total_count?: number } }).data
      : null
  const practices = unwrapPracticesList(res)
  const totalCount =
    typeof data?.total_count === "number" ? data.total_count : practices.length
  return { practices, totalCount }
}

type CatalogCoursePracticesPanelProps = {
  catalogCourseId: number
  programType: string
  courseName: string
}

export function CatalogCoursePracticesPanel({
  catalogCourseId,
  programType,
  courseName,
}: CatalogCoursePracticesPanelProps) {
  const navigate = useNavigate()
  const [practices, setPractices] = useState<ParentContextPractice[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [practiceToDelete, setPracticeToDelete] = useState<ParentContextPractice | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [publishStatusUpdatingId, setPublishStatusUpdatingId] = useState<number | null>(null)
  const [listSearch, setListSearch] = useState("")
  const [publishStatusFilter, setPublishStatusFilter] = useState<PublishStatusFilter>("all")

  const validCourse = Number.isFinite(catalogCourseId) && catalogCourseId > 0

  const load = useCallback(async () => {
    if (!validCourse) {
      setLoading(false)
      setLoadError("Invalid catalog course.")
      setPractices([])
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await getExamPrepCatalogCoursePractices(catalogCourseId, {
        limit: 20,
        offset: 0,
      })
      const { practices: list, totalCount: total } = extractPracticesPage(res)
      setPractices(list)
      setTotalCount(total)
    } catch {
      setPractices([])
      setTotalCount(0)
      setLoadError("Could not load practices for this catalog course.")
      toast.error("Failed to load practices")
    } finally {
      setLoading(false)
    }
  }, [catalogCourseId, validCourse])

  useEffect(() => {
    void load()
  }, [load])

  const filteredPractices = useMemo(
    () =>
      filterBySearchAndPublishStatus(practices, {
        search: listSearch,
        publishStatusFilter,
        getSearchFields: (p) => [p.title, p.story_description, p.quick_tips],
        getPublishStatus: (p) => p.publish_status,
      }),
    [listSearch, practices, publishStatusFilter],
  )

  const editPracticeHref = (practiceId: number) =>
    `/new-content/courses/${programType}/${catalogCourseId}/edit-practice/${practiceId}?backTo=courses`

  const handlePracticePublishStatus = async (
    practiceId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusUpdatingId(practiceId)
    try {
      await setExamPrepPracticePublishStatus(practiceId, {
        publish_status: nextStatus,
      })
      setPractices((prev) =>
        prev.map((p) =>
          p.id === practiceId ? { ...p, publish_status: nextStatus } : p,
        ),
      )
      toast.success(
        nextStatus === "PUBLISHED" ? "Practice published" : "Practice saved as draft",
      )
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to update practice status")
    } finally {
      setPublishStatusUpdatingId(null)
    }
  }

  const confirmDeletePractice = async () => {
    if (!practiceToDelete) return
    setDeleting(true)
    try {
      await deleteExamPrepPractice(practiceToDelete.id)
      toast.success("Practice deleted")
      setPracticeToDelete(null)
      await load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to delete practice")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-grayScale-500">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm font-medium">Loading practices…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-6 py-8 text-center">
        <p className="text-sm text-amber-900">{loadError}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  if (practices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-grayScale-300" />
        <p className="text-sm font-medium text-grayScale-600">No practices for {courseName} yet</p>
        <p className="mt-1 text-sm text-grayScale-400">
          Add a practice to attach questions directly to this catalog course.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-grayScale-500">
        {totalCount} practice{totalCount === 1 ? "" : "s"} linked to this catalog course
      </p>
      <ContentListSearchFilterBar
        search={listSearch}
        onSearchChange={setListSearch}
        publishStatusFilter={publishStatusFilter}
        onPublishStatusFilterChange={setPublishStatusFilter}
        searchPlaceholder="Search practices by title or description…"
        searchAriaLabel="Search catalog course practices"
      />

      {filteredPractices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-grayScale-600">
            No practices match your search or status filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredPractices.map((practice) => (
            <ModulePracticeCard
              key={practice.id}
              practice={practice}
              statusUpdating={publishStatusUpdatingId === practice.id}
              onEdit={() => navigate(editPracticeHref(practice.id))}
              onPublish={() => void handlePracticePublishStatus(practice.id, "PUBLISHED")}
              onSaveAsDraft={() => void handlePracticePublishStatus(practice.id, "DRAFT")}
              onDelete={() => setPracticeToDelete(practice)}
            />
          ))}
        </div>
      )}

      <Dialog open={practiceToDelete != null} onOpenChange={(open) => !open && setPracticeToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete practice?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-grayScale-600">
            This permanently removes{" "}
            <span className="font-semibold text-grayScale-800">
              {practiceToDelete?.title || "this practice"}
            </span>
            .
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPracticeToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDeletePractice()} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
