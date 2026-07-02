import { useEffect, useMemo, useState } from "react";
import { Edit2, Loader2, MoreVertical, Unlink } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { ResolvedImage } from "../../../components/media/ResolvedImage";
import type {
  ParentContextPractice,
  PracticePublishStatus,
} from "../../../types/course.types";
import {
  isPracticePublished,
  practicePublishStatus,
} from "../../../lib/parentContextPractice";
import { resolveThumbnailForPreview } from "../../../lib/videoPreview";
import { cn } from "../../../lib/utils";
import { PublishStatusConfirmDialog } from "./PublishStatusConfirmDialog";

type ModulePracticeCardProps = {
  practice: ParentContextPractice;
  statusUpdating?: boolean;
  onEdit?: () => void;
  onPublish?: () => void;
  onSaveAsDraft?: () => void;
  onUnlink?: () => void;
  onDelete?: () => void;
};

export function ModulePracticeCard({
  practice,
  statusUpdating = false,
  onEdit,
  onPublish,
  onSaveAsDraft,
  onUnlink,
  onDelete,
}: ModulePracticeCardProps) {
  const isPublished = isPracticePublished(practice);
  const statusLabel = practicePublishStatus(practice) ?? "DRAFT";
  const thumbnailSrc = useMemo(
    () => resolveThumbnailForPreview(practice.story_image),
    [practice.story_image],
  );
  const [thumbFailed, setThumbFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<PracticePublishStatus | null>(null);

  useEffect(() => {
    setThumbFailed(false);
  }, [thumbnailSrc]);

  const requestStatusChange = (
    nextStatus: PracticePublishStatus,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    if (statusUpdating) return;
    setPendingStatus(nextStatus);
    setConfirmOpen(true);
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    if (pendingStatus === "PUBLISHED") {
      onPublish?.();
    } else {
      onSaveAsDraft?.();
    }
    setConfirmOpen(false);
    setPendingStatus(null);
  };

  return (
    <>
      <Card className="group flex flex-col overflow-hidden rounded-[20px] border border-grayScale-50 bg-white shadow-sm transition-all hover:shadow-xl hover:shadow-grayScale-400/5">
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#E0F2FE] to-[#BFDBFE]">
          {thumbnailSrc && !thumbFailed ? (
            <ResolvedImage
              src={thumbnailSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setThumbFailed(true)}
            />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col space-y-5 p-5">
          <div className="flex items-center justify-between gap-2">
            <div
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                isPublished
                  ? "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]"
                  : "border-grayScale-100 bg-grayScale-50 text-grayScale-400",
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                  isPublished ? "bg-[#16A34A]" : "bg-grayScale-300",
                )}
              />
              {statusLabel}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 rounded-full text-grayScale-400 hover:bg-grayScale-50 hover:text-grayScale-600"
                  disabled={statusUpdating}
                  aria-label={`Practice options: ${practice.title}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {statusUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  disabled={statusUpdating}
                  onClick={(e) => {
                    requestStatusChange(
                      isPublished ? "DRAFT" : "PUBLISHED",
                      e,
                    );
                  }}
                >
                  {isPublished ? "Save as draft" : "Publish practice"}
                </DropdownMenuItem>
                {onUnlink ? (
                  <DropdownMenuItem
                    disabled={statusUpdating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlink();
                    }}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Unlink
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem
                    disabled={statusUpdating}
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="line-clamp-3 min-h-[2.75rem] text-[14px] font-bold leading-snug text-[#0F172A]">
            {practice.title}
          </h3>

          <div className="mt-auto grid grid-cols-1 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-[10px] border-brand-500 text-[12px] font-bold text-brand-500 hover:bg-brand-50"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              disabled={isPublished || statusUpdating}
              className={cn(
                "h-10 w-full rounded-[10px] text-[12px] font-bold shadow-sm transition-all",
                isPublished
                  ? "cursor-default bg-[#ECD5E9] text-[#9E2891] hover:bg-[#ECD5E9]"
                  : "bg-brand-500 text-white hover:bg-brand-600",
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPublished) requestStatusChange("PUBLISHED", e);
              }}
            >
              {statusUpdating
                ? "Updating…"
                : isPublished
                  ? "Published"
                  : "Publish"}
            </Button>
          </div>
        </div>
      </Card>
      <PublishStatusConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPendingStatus(null);
        }}
        nextStatus={pendingStatus}
        contentLabel="practice"
        confirming={statusUpdating}
        onConfirm={confirmStatusChange}
      />
    </>
  );
}
