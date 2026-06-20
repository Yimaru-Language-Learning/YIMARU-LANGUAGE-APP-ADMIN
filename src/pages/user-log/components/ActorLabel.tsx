import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { User } from "lucide-react"
import { fetchActorProfile } from "../../../lib/activityLogActor"
import {
  activityLogActorPath,
  formatActorDisplay,
  formatActorFallback,
  type ActivityLogActorFields,
} from "../../../lib/activityLogDisplay"

function formatRoleLabel(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function needsActorFetch(log: ActivityLogActorFields): boolean {
  return log.actor_id != null && !log.actor_name?.trim() && !log.actor_email?.trim()
}

export function ActorLabel({
  log,
  className,
  linkToProfile = false,
}: {
  log: ActivityLogActorFields
  className?: string
  linkToProfile?: boolean
}) {
  const [fallbackName, setFallbackName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!needsActorFetch(log)) {
      setFallbackName(null)
      return
    }

    let cancelled = false
    setLoading(true)
    void fetchActorProfile(log.actor_id!, log.actor_role, log.actor_kind)
      .then((profile) => {
        if (!cancelled) setFallbackName(profile.name)
      })
      .catch(() => {
        if (!cancelled) setFallbackName(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [log.actor_id, log.actor_role, log.actor_kind, log.actor_name, log.actor_email])

  const display = formatActorDisplay(log)
  const name =
    display.name !== "System" && !display.name.startsWith("#")
      ? display.name
      : fallbackName ?? display.name
  const label = loading && needsActorFetch(log) ? "Loading…" : name

  const profilePath = linkToProfile ? activityLogActorPath(log) : null
  if (profilePath) {
    return (
      <Link to={profilePath} className={className} title={formatActorFallback(log)}>
        {label}
      </Link>
    )
  }

  return (
    <span className={className} title={formatActorFallback(log)}>
      {label}
    </span>
  )
}

export function ActorCell({
  log,
}: {
  log: ActivityLogActorFields
}) {
  const display = formatActorDisplay(log)

  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-grayScale-100 text-grayScale-500">
        <User className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-grayScale-600">
          <ActorLabel log={log} />
        </p>
        {display.role ? (
          <p className="truncate text-xs text-grayScale-400">{formatRoleLabel(display.role)}</p>
        ) : null}
      </div>
    </div>
  )
}
