import { useState } from "react"
import { ChevronDown, ChevronRight, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { ActivityLogListPanel } from "../../user-log/components/ActivityLogListPanel"

export function UserAccountActivitySection({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="min-w-0 shadow-soft">
      <CardHeader className="pb-3">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100/80">
              <ClipboardList className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-base">Account activity</CardTitle>
              <p className="mt-0.5 text-xs text-grayScale-500">
                Platform audit trail for actions performed by this user (not learning milestones).
              </p>
            </div>
          </div>
          {open ? (
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
          ) : (
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
          )}
        </button>
      </CardHeader>
      {open ? (
        <CardContent className="min-w-0 overflow-hidden p-6 pt-0">
          <ActivityLogListPanel
            fixedActorId={userId}
            compact
            showStats={false}
            scrollable
          />
        </CardContent>
      ) : null}
    </Card>
  )
}
