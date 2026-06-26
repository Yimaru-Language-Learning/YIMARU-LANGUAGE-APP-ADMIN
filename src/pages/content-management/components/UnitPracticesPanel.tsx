import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, Clock, Edit2, Hash, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  deleteExamPrepPractice,
  getExamPrepUnitPractices,
  setExamPrepPracticePublishStatus,
} from "../../../api/courses.api"
import { unwrapPracticesList } from "../../../lib/parentContextPractice"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { ContentListSearchFilterBar } from "./ContentListSearchFilterBar"
import { ContentPublishStatusChip } from "./ContentPublishStatusChip"
import {
  filterBySearchAndPublishStatus,
  type PublishStatusFilter,
} from "../../../lib/contentListFilters"
import { resolveThumbnailForPreview } from "../../../lib/videoPreview"
import { cn } from "../../../lib/utils"
import type {
  ParentContextPractice,
  PracticePublishStatus,
} from "../../../types/course.types"

function extractPracticesPage(
  res: Awaited<ReturnType<typeof getExamPrepUnitPractices>>,
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

function formatPracticeDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function PracticeCard({
  practice,
  index,
  total,
  onEdit,
  onDelete,
  onTogglePublishStatus,
  publishStatusUpdating,
}: {
  practice: ParentContextPractice
  index: number
  total: number
  onEdit?: () => void
  onDelete?: () => void
  onTogglePublishStatus?: (nextStatus: PracticePublishStatus) => void
  publishStatusUpdating?: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const thumb = resolveThumbnailForPreview(practice.story_image)
  const showThumb = Boolean(thumb) && !imgFailed

  return (
    <Card
      className={cn(
        "overflow-hidden border-grayScale-100/90 bg-white shadow-sm transition-all duration-300",
        "hover:border-brand-200/60 hover:shadow-md hover:shadow-brand-500/5",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="relative shrink-0 lg:w-[280px]">
            <div
              className={cn(
                "relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-grayScale-100 to-grayScale-50 lg:aspect-auto lg:h-full lg:min-h-[220px]",
                !showThumb && "grid min-h-[180px] place-items-center lg:min-h-[220px]",
              )}
            >
              {showThumb ? (
                <>
                  <img
                    src={thumb!}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-grayScale-400">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-inner ring-1 ring-grayScale-200/80">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    No cover image
                  </span>
                </div>
              )}
            </div>
            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-grayScale-600 shadow-sm ring-1 ring-black/5">
              {index + 1} / {total}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold tracking-tight text-grayScale-900">
                  {practice.title || "Untitled practice"}
                </h3>
                {practice.story_description ? (
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-grayScale-500">
                    {practice.story_description}
                  </p>
                ) : null}
              </div>
              {onTogglePublishStatus ? (
                <ContentPublishStatusChip
                  publishStatus={practice.publish_status}
                  updating={publishStatusUpdating}
                  contentLabel="practice"
                  onToggle={onTogglePublishStatus}
                />
              ) : null}
            </div>

            {practice.quick_tips?.trim() ? (
              <div className="rounded-xl border border-amber-100/80 bg-amber-50/60 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/75">
                  Quick tips
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-grayScale-800">
                  {practice.quick_tips}
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-grayScale-100 pt-5">
              <Badge variant="secondary" className="gap-1.5 py-1 pl-2 pr-2.5 font-medium normal-case">
                <Hash className="h-3 w-3 opacity-70" aria-hidden />
                Question set {practice.question_set_id}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1 pl-2 pr-2.5 font-medium normal-case">
                <Clock className="h-3 w-3 opacity-70" aria-hidden />
                {formatPracticeDate(practice.created_at)}
              </Badge>
              {onEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto h-9 rounded-[10px] border-brand-500 text-xs font-bold text-brand-500 hover:bg-brand-50"
                  onClick={onEdit}
                >
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type UnitPracticesPanelProps = {
  unitId: number
  programType: string
  courseId: number
  unitName: string
}

export function UnitPracticesPanel({
  unitId,
  programType,
  courseId,
  unitName,
}: UnitPracticesPanelProps) {
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

  const validUnit = Number.isFinite(unitId) && unitId > 0

  const load = useCallback(async () => {
    if (!validUnit) {
      setLoading(false)
      setLoadError("Invalid unit.")
      setPractices([])
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await getExamPrepUnitPractices(unitId, {
        limit: 20,
        offset: 0,
      })
      const { practices: list, totalCount: total } = extractPracticesPage(res)
      setPractices(list)
      setTotalCount(total)
    } catch {
      setPractices([])
      setTotalCount(0)
      setLoadError("Could not load practices for this unit.")
      toast.error("Failed to load practices")
    } finally {
      setLoading(false)
    }
  }, [unitId, validUnit])

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
    `/new-content/courses/${programType}/${courseId}/${unitId}/edit-practice/${practiceId}?backTo=unit`

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
        <p className="text-sm font-medium text-grayScale-600">No practices for {unitName} yet</p>
        <p className="mt-1 text-sm text-grayScale-400">
          Add a practice to attach questions directly to this unit.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-grayScale-500">
        {totalCount} practice{totalCount === 1 ? "" : "s"} linked to this unit
      </p>
      <ContentListSearchFilterBar
        search={listSearch}
        onSearchChange={setListSearch}
        publishStatusFilter={publishStatusFilter}
        onPublishStatusFilterChange={setPublishStatusFilter}
        searchPlaceholder="Search practices by title or description…"
        searchAriaLabel="Search unit practices"
      />

      {filteredPractices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-grayScale-600">
            No practices match your search or status filter
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredPractices.map((practice, index) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              index={index}
              total={filteredPractices.length}
              onEdit={() => navigate(editPracticeHref(practice.id))}
              onDelete={() => setPracticeToDelete(practice)}
              onTogglePublishStatus={(nextStatus) =>
                void handlePracticePublishStatus(practice.id, nextStatus)
              }
              publishStatusUpdating={publishStatusUpdatingId === practice.id}
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
