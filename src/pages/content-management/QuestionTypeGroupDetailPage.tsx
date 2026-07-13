import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Unlink,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Badge } from "../../components/ui/badge"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import {
  deleteQuestionTypeDefinitionGroup,
  getQuestionTypeDefinitionGroupById,
} from "../../api/questionTypeDefinitionGroups.api"
import { assignQuestionTypeDefinitionGroups } from "../../api/questionTypeDefinitions.api"
import { removeGroupFromMembership } from "../../lib/questionTypeGroupIds"
import type { QuestionTypeDefinitionGroupDetail } from "../../types/questionTypeDefinition.types"
import { QuestionTypeCard } from "./components/QuestionTypeCard"
import { QuestionTypeGroupFormDialog } from "./components/QuestionTypeGroupFormDialog"
import { QuestionTypeDefinitionPracticesDialog } from "./components/QuestionTypeDefinitionPracticesDialog"
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types"

export function QuestionTypeGroupDetailPage() {
  const navigate = useNavigate()
  const { groupId: groupIdParam } = useParams<{ groupId: string }>()
  const groupId = Number(groupIdParam)

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<QuestionTypeDefinitionGroupDetail | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [definitionForPractices, setDefinitionForPractices] = useState<QuestionTypeDefinition | null>(
    null,
  )
  const [detachingId, setDetachingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!Number.isFinite(groupId) || groupId <= 0) {
      setGroup(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const detail = await getQuestionTypeDefinitionGroupById(groupId)
      if (!detail) {
        toast.error("Group not found")
        navigate("/new-content/question-types")
        return
      }
      setGroup(detail)
    } catch (e) {
      notifyApiError(e, "Failed to load group")
      setGroup(null)
    } finally {
      setLoading(false)
    }
  }, [groupId, navigate])

  useEffect(() => {
    void load()
  }, [load])

  const handleDetach = async (definitionId: number) => {
    if (!group) return
    const def = group.definitions.find((d) => d.id === definitionId)
    const next = removeGroupFromMembership(def?.group_ids, groupId)
    setDetachingId(definitionId)
    try {
      await assignQuestionTypeDefinitionGroups(definitionId, next)
      toast.success("Removed from this group")
      await load()
    } catch (e) {
      notifyApiError(e, "Could not remove from group")
    } finally {
      setDetachingId(null)
    }
  }

  const handleDeleteGroup = async () => {
    if (!group) return
    setDeleteSubmitting(true)
    try {
      await deleteQuestionTypeDefinitionGroup(group.id)
      toast.success("Group deleted. Membership links for this group were removed.")
      navigate("/new-content/question-types")
    } catch (e) {
      notifyApiError(e, "Delete failed")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  if (!Number.isFinite(groupId) || groupId <= 0) {
    return (
      <div className="px-6 py-20 text-center text-sm text-grayScale-500">Invalid group id.</div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <Link
        to="/new-content/question-types"
        className="flex items-center gap-2 text-[15px] font-bold text-grayScale-600 transition-colors hover:text-brand-500 group w-fit"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to question types
      </Link>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <SpinnerIcon className="h-8 w-8 text-brand-500" />
          <p className="text-sm text-grayScale-500">Loading group…</p>
        </div>
      ) : !group ? (
        <p className="text-sm text-grayScale-500">Group not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-[28px] font-medium text-grayScale-900 tracking-tight">
                    {group.name}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "border-none shadow-none",
                        group.status === "ACTIVE"
                          ? "bg-[#F0FDF4] text-[#16A34A]"
                          : "bg-grayScale-100 text-grayScale-600",
                      )}
                    >
                      {group.status}
                    </Badge>
                    <span className="text-xs text-grayScale-500">
                      Order {group.display_order} · {group.definitions.length} definition
                      {group.definitions.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>
              {group.description ? (
                <p className="max-w-2xl text-sm text-grayScale-600">{group.description}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit group
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete group
              </Button>
              <Link to={`/new-content/question-types/create?groupId=${group.id}`}>
                <Button size="sm" className="bg-[#9E2891] hover:bg-[#8A237E] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add definition
                </Button>
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden rounded-2xl border border-grayScale-200 bg-white shadow-none">
            <CardHeader className="border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <CardTitle className="text-base font-bold text-grayScale-900">
                Definitions in this group
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {group.definitions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="text-sm font-semibold text-grayScale-700">No definitions yet</p>
                  <p className="max-w-sm text-xs text-grayScale-500">
                    Create a definition in this group or move an existing one here from the library.
                  </p>
                  <Link to={`/new-content/question-types/create?groupId=${group.id}`}>
                    <Button size="sm" className="rounded-[8px] bg-brand-600 hover:bg-brand-500">
                      <Plus className="mr-2 h-4 w-4" />
                      Create definition
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.definitions.map((d) => (
                    <div key={d.id} className="space-y-2">
                      <QuestionTypeCard
                        id={d.id}
                        definitionKey={d.key}
                        display_name={d.display_name}
                        status={d.status}
                        is_system={d.is_system}
                        stimulusKindsCount={d.stimulus_component_kinds?.length ?? 0}
                        responseKindsCount={d.response_component_kinds?.length ?? 0}
                        deleteDisabled={!!d.is_system}
                        onEdit={() => navigate(`/new-content/question-types/${d.id}/edit`)}
                        onCreatePractice={() =>
                          navigate(`/new-content/question-types/${d.id}/create-practice`)
                        }
                        onViewPractices={() => setDefinitionForPractices(d)}
                        onDelete={undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full text-xs text-grayScale-600 hover:text-red-600"
                        disabled={detachingId === d.id}
                        onClick={() => void handleDetach(d.id)}
                      >
                        {detachingId === d.id ? (
                          <SpinnerIcon className="mr-1.5 h-3.5 w-3.5" />
                        ) : (
                          <Unlink className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Remove from group
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <QuestionTypeGroupFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        group={group}
        onSaved={() => void load()}
      />

      <QuestionTypeDefinitionPracticesDialog
        definition={definitionForPractices}
        open={definitionForPractices !== null}
        onOpenChange={(open) => {
          if (!open) setDefinitionForPractices(null)
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={(open) => !deleteSubmitting && setDeleteOpen(open)}>
        <DialogContent className="max-w-md rounded-2xl border-grayScale-200">
          <DialogHeader>
            <DialogTitle>Delete group?</DialogTitle>
            <DialogDescription className="text-left">
              Deleting this group will not delete any question types. Definitions will be removed from this
              group only; other group memberships are unchanged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={deleteSubmitting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteSubmitting}
              onClick={() => void handleDeleteGroup()}
            >
              {deleteSubmitting ? <SpinnerIcon className="h-4 w-4" /> : "Delete group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
