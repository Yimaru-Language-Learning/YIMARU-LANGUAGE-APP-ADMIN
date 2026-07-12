import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { notifyApiError } from "../../lib/apiErrors"
import { deleteNotification } from "../../api/notifications.api"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { getNotificationTitle, type Notification } from "../../types/notification.types"

type NotificationDeleteDialogProps = {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (id: string) => void
}

export function NotificationDeleteDialog({
  notification,
  open,
  onOpenChange,
  onDeleted,
}: NotificationDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next && !deleting) onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!notification) return

    setDeleting(true)
    try {
      const response = await deleteNotification(notification.id)
      toast.success(response.message || "Notification deleted")
      onOpenChange(false)
      onDeleted?.(notification.id)
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to delete notification")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-grayScale-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
            <Trash2 className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
            Delete notification?
          </DialogTitle>
          <DialogDescription className="text-left text-grayScale-600">
            This permanently removes the notification from your inbox.
          </DialogDescription>
        </DialogHeader>
        {notification ? (
          <div className="space-y-1 rounded-xl border border-grayScale-200 bg-grayScale-50 px-4 py-3">
            <p className="line-clamp-2 text-sm font-semibold text-grayScale-900">
              {getNotificationTitle(notification) || "Notification"}
            </p>
            <p className="text-xs text-grayScale-500">#{notification.id}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
          <Button
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleting || !notification}
            onClick={() => void handleConfirm()}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
