import { useState } from "react"
import { toast } from "sonner"
import { notifyApiError } from "../../../lib/apiErrors"
import {
  bulkDeletePractices,
  bulkUnlinkPractices,
  formatBulkPracticeActionToast,
  type PracticeUnlinkContext,
} from "../../../lib/practiceBulkActions"
import { usePracticeListSelection } from "../../../hooks/usePracticeListSelection"
import type { ParentContextPractice } from "../../../types/course.types"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { ModulePracticeCard } from "./ModulePracticeCard"

type PracticeSelectableGridProps = {
  practices: ParentContextPractice[]
  searchQuery?: string
  locationLabel: string
  unlinkContext: PracticeUnlinkContext
  isExamPrep?: boolean
  publishStatusUpdatingId?: number | null
  onReload: () => Promise<void>
  onEdit: (practice: ParentContextPractice) => void
  onPublish: (practiceId: number) => void
  onSaveAsDraft: (practiceId: number) => void
  onUnlink: (practice: ParentContextPractice) => void
  onDelete: (practice: ParentContextPractice) => void
  unlinkActionLabel?: string
  deleteActionLabel?: string
}

function summarizePracticeTitles(practices: ParentContextPractice[]): string {
  const titles = practices
    .slice(0, 3)
    .map((practice) => practice.title?.trim() || `Practice #${practice.id}`)
  if (practices.length <= 3) {
    return titles.join(", ")
  }
  return `${titles.join(", ")}, and ${practices.length - 3} more`
}

export function PracticeSelectableGrid({
  practices,
  searchQuery = "",
  locationLabel,
  unlinkContext,
  isExamPrep = false,
  publishStatusUpdatingId = null,
  onReload,
  onEdit,
  onPublish,
  onSaveAsDraft,
  onUnlink,
  onDelete,
  unlinkActionLabel = "Remove from location",
  deleteActionLabel = "Delete permanently",
}: PracticeSelectableGridProps) {
  const selection = usePracticeListSelection(practices)
  const [bulkUnlinkOpen, setBulkUnlinkOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkUnlinking, setBulkUnlinking] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const runBulkUnlink = async () => {
    if (selection.selectedPractices.length === 0) return
    setBulkUnlinking(true)
    try {
      const result = await bulkUnlinkPractices({
        practices: selection.selectedPractices,
        context: unlinkContext,
        isExamPrep,
      })
      const toastResult = formatBulkPracticeActionToast(
        "unlink",
        locationLabel,
        result,
      )
      if (toastResult.kind === "success") {
        toast.success(toastResult.message)
      } else if (toastResult.kind === "info") {
        toast.info(toastResult.message)
      } else {
        toast.error(toastResult.message)
      }
      setBulkUnlinkOpen(false)
      selection.clear()
      await onReload()
    } catch (error) {
      notifyApiError(error, "Could not unlink selected practices")
    } finally {
      setBulkUnlinking(false)
    }
  }

  const runBulkDelete = async () => {
    if (selection.selectedPractices.length === 0) return
    setBulkDeleting(true)
    try {
      const result = await bulkDeletePractices({
        practices: selection.selectedPractices,
        isExamPrep,
      })
      const toastResult = formatBulkPracticeActionToast(
        "delete",
        locationLabel,
        result,
      )
      if (toastResult.kind === "success") {
        toast.success(toastResult.message)
      } else if (toastResult.kind === "info") {
        toast.info(toastResult.message)
      } else {
        toast.error(toastResult.message)
      }
      setBulkDeleteOpen(false)
      selection.clear()
      await onReload()
    } catch (error) {
      notifyApiError(error, "Could not delete selected practices")
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-grayScale-100 bg-grayScale-50/60 px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-grayScale-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-grayScale-300 text-brand-500 focus:ring-brand-500"
            checked={selection.allSelected}
            onChange={() => selection.toggleAll()}
            aria-label="Select all visible practices"
          />
          Select all ({selection.selectedCount}/{practices.length})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-[6px]"
          disabled={selection.selectedCount === 0 || bulkUnlinking || bulkDeleting}
          onClick={() => setBulkUnlinkOpen(true)}
        >
          Unlink selected ({selection.selectedCount})
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="rounded-[6px]"
          disabled={selection.selectedCount === 0 || bulkUnlinking || bulkDeleting}
          onClick={() => setBulkDeleteOpen(true)}
        >
          Delete selected ({selection.selectedCount})
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {practices.map((practice) => (
          <ModulePracticeCard
            key={practice.id}
            practice={practice}
            statusUpdating={publishStatusUpdatingId === practice.id}
            searchQuery={searchQuery}
            selectable
            selected={selection.isSelected(practice.id)}
            onSelectedChange={() => selection.toggle(practice.id)}
            onEdit={() => onEdit(practice)}
            onPublish={() => onPublish(practice.id)}
            onSaveAsDraft={() => onSaveAsDraft(practice.id)}
            onUnlink={() => onUnlink(practice)}
            onDelete={() => onDelete(practice)}
          />
        ))}
      </div>

      <Dialog
        open={bulkUnlinkOpen}
        onOpenChange={(open) => {
          if (!open && !bulkUnlinking) setBulkUnlinkOpen(false)
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Remove {selection.selectedCount} practice
              {selection.selectedCount === 1 ? "" : "s"} from {locationLabel}?
            </DialogTitle>
            <DialogDescription>
              {summarizePracticeTitles(selection.selectedPractices)} will be
              detached from this location. Questions are kept unless you delete
              the practices afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              variant="outline"
              disabled={bulkUnlinking}
              onClick={() => setBulkUnlinkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={bulkUnlinking}
              onClick={() => void runBulkUnlink()}
            >
              {bulkUnlinking ? "Removing…" : unlinkActionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !bulkDeleting) setBulkDeleteOpen(false)
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Delete {selection.selectedCount} practice
              {selection.selectedCount === 1 ? "" : "s"} permanently?
            </DialogTitle>
            <DialogDescription>
              {summarizePracticeTitles(selection.selectedPractices)} and all of
              their questions will be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              variant="outline"
              disabled={bulkDeleting}
              onClick={() => setBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              disabled={bulkDeleting}
              onClick={() => void runBulkDelete()}
            >
              {bulkDeleting ? "Deleting…" : deleteActionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
