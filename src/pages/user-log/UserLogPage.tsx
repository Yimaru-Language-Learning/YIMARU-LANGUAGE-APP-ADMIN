import { ActivityLogListPanel } from "./components/ActivityLogListPanel"

export function UserLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grayScale-600">Activity log</h1>
        <p className="text-sm text-grayScale-400">
          Platform audit trail of who did what, to which resource, and when. This is separate from
          learner progress timelines on user profiles.
        </p>
      </div>

      <ActivityLogListPanel />
    </div>
  )
}
