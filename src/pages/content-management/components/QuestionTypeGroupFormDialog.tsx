import { notifyApiError } from "../../../lib/apiErrors"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Select } from "../../../components/ui/select"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import {
  createQuestionTypeDefinitionGroup,
  extractGroupMutationId,
  updateQuestionTypeDefinitionGroup,
} from "../../../api/questionTypeDefinitionGroups.api"
import type {
  QuestionTypeDefinitionGroup,
  QuestionTypeDefinitionGroupStatus,
} from "../../../types/questionTypeDefinition.types"

interface QuestionTypeGroupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, dialog edits this group; otherwise creates a new one */
  group?: QuestionTypeDefinitionGroup | null
  onSaved?: (group: QuestionTypeDefinitionGroup) => void
}

export function QuestionTypeGroupFormDialog({
  open,
  onOpenChange,
  group,
  onSaved,
}: QuestionTypeGroupFormDialogProps) {
  const isEdit = group != null
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [displayOrder, setDisplayOrder] = useState("0")
  const [status, setStatus] = useState<QuestionTypeDefinitionGroupStatus>("ACTIVE")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (group) {
      setName(group.name)
      setDescription(group.description ?? "")
      setDisplayOrder(String(group.display_order))
      setStatus(group.status)
    } else {
      setName("")
      setDescription("")
      setDisplayOrder("0")
      setStatus("ACTIVE")
    }
  }, [open, group])

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Group name is required")
      return
    }
    const order = Number(displayOrder)
    const body = {
      name: trimmedName,
      description: description.trim() || null,
      display_order: Number.isFinite(order) ? order : 0,
      status,
    }

    setSubmitting(true)
    try {
      if (isEdit && group) {
        const res = await updateQuestionTypeDefinitionGroup(group.id, body)
        toast.success(res.data?.message || "Group updated")
        onSaved?.({ ...group, ...body })
      } else {
        const res = await createQuestionTypeDefinitionGroup(body)
        const id = extractGroupMutationId(res)
        toast.success(res.data?.message || "Group created")
        if (id != null) {
          onSaved?.({
            id,
            name: body.name,
            description: body.description ?? null,
            display_order: body.display_order ?? 0,
            status: body.status ?? "ACTIVE",
            created_at: new Date().toISOString(),
          })
        }
      }
      onOpenChange(false)
    } catch (e) {
      notifyApiError(e, isEdit ? "Update failed" : "Create failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-grayScale-200">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit group" : "Create group"}</DialogTitle>
          <DialogDescription>
            Groups organize question type definitions in the catalog. Deleting a group does not delete
            definitions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-grayScale-700">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Speaking & Listening"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-grayScale-700">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for admins"
              className="min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700">Display order</label>
              <Input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-grayScale-700">Status</label>
              <Select
                className="h-10"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value === "INACTIVE" ? "INACTIVE" : "ACTIVE")
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#9E2891] hover:bg-[#8A237E] text-white"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <SpinnerIcon className="h-4 w-4" /> : isEdit ? "Save changes" : "Create group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
