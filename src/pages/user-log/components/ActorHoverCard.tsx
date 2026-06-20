import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { Mail, Shield, User } from "lucide-react"
import { cn } from "../../../lib/utils"
import {
  fetchActorProfile,
  formatActorDate,
  type ActorProfile,
} from "../../../lib/activityLogActor"
import {
  activityLogActorPath,
  formatActorDisplay,
  type ActivityLogActorFields,
} from "../../../lib/activityLogDisplay"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"

const HOVER_DELAY_MS = 280
const HIDE_DELAY_MS = 120

type ActorHoverCardProps = {
  log: ActivityLogActorFields
  children: ReactNode
}

function hasApiEnrichment(log: ActivityLogActorFields): boolean {
  return Boolean(log.actor_name?.trim() || log.actor_email?.trim())
}

function needsProfileFetch(log: ActivityLogActorFields): boolean {
  return log.actor_id != null && !hasApiEnrichment(log)
}

export function ActorHoverCard({ log, children }: ActorHoverCardProps) {
  const tooltipId = useId()
  const triggerRef = useRef<HTMLDivElement>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRef = useRef(0)

  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ActorProfile | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const display = formatActorDisplay(log)
  const profilePath = activityLogActorPath(log)

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cardWidth = 288
    const gap = 10
    let left = rect.right + gap
    if (left + cardWidth > window.innerWidth - 12) {
      left = rect.left - cardWidth - gap
    }
    setPosition({
      top: rect.top + rect.height / 2,
      left: Math.max(12, left),
    })
  }, [])

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const close = useCallback(() => {
    clearTimers()
    setOpen(false)
    setVisible(false)
  }, [clearTimers])

  const loadProfile = useCallback(async () => {
    if (log.actor_id == null || !needsProfileFetch(log)) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const data = await fetchActorProfile(log.actor_id, log.actor_role, log.actor_kind)
      if (requestId !== requestRef.current) return
      setProfile(data)
    } catch {
      if (requestId !== requestRef.current) return
      setProfile(null)
      setError("Could not load actor details")
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [log])

  const handleEnter = useCallback(() => {
    if (log.actor_id == null) return
    clearTimers()
    hideTimerRef.current = setTimeout(() => {
      updatePosition()
      setOpen(true)
      requestAnimationFrame(() => setVisible(true))
      if (needsProfileFetch(log)) void loadProfile()
    }, HOVER_DELAY_MS)
  }, [log, clearTimers, loadProfile, updatePosition])

  const handleLeave = useCallback(() => {
    clearTimers()
    showTimerRef.current = setTimeout(() => {
      setVisible(false)
      hideTimerRef.current = setTimeout(() => {
        setOpen(false)
        setProfile(null)
        setError(null)
      }, 180)
    }, HIDE_DELAY_MS)
  }, [clearTimers])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [open, updatePosition])

  useEffect(() => () => clearTimers(), [clearTimers])

  if (log.actor_id == null) {
    return <>{children}</>
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex cursor-default"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        aria-describedby={open ? tooltipId : undefined}
      >
        {children}
      </div>

      {open &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={cn(
              "fixed z-[100] w-72 -translate-y-1/2 rounded-xl border border-grayScale-100 bg-white p-4 shadow-lg transition-all duration-200 ease-out",
              visible ? "translate-x-0 opacity-100" : "translate-x-1 opacity-0",
            )}
            style={{ top: position.top, left: position.left }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-grayScale-500">
                <SpinnerIcon className="h-5 w-5 text-brand-500" />
                Loading…
              </div>
            ) : error ? (
              <p className="py-4 text-center text-sm text-grayScale-500">{error}</p>
            ) : profile ? (
              <ActorProfileContent profile={profile} profilePath={profilePath} />
            ) : (
              <EnrichedActorContent log={log} display={display} profilePath={profilePath} />
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

function EnrichedActorContent({
  log,
  display,
  profilePath,
}: {
  log: ActivityLogActorFields
  display: ReturnType<typeof formatActorDisplay>
  profilePath: string | null
}) {
  const isTeam = log.actor_kind === "team_member"

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            isTeam ? "bg-brand-50 text-brand-600" : "bg-mint-50 text-mint-700",
          )}
        >
          {isTeam ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          {profilePath ? (
            <Link
              to={profilePath}
              className="truncate text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {display.name}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-grayScale-900">{display.name}</p>
          )}
          <p className="text-[11px] font-medium uppercase tracking-wide text-grayScale-400">
            {isTeam ? "Team member" : log.actor_kind === "user" ? "User" : "Actor"}
            {log.actor_id != null ? ` · #${log.actor_id}` : ""}
          </p>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        {display.email ? (
          <DetailRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={display.email} />
        ) : null}
        {display.role ? <DetailRow label="Role" value={display.role.replace(/_/g, " ")} capitalize /> : null}
      </dl>
    </div>
  )
}

function ActorProfileContent({
  profile,
  profilePath,
}: {
  profile: ActorProfile
  profilePath: string | null
}) {
  const isTeam = profile.kind === "team"

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            isTeam ? "bg-brand-50 text-brand-600" : "bg-mint-50 text-mint-700",
          )}
        >
          {isTeam ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          {profilePath ? (
            <Link
              to={profilePath}
              className="truncate text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {profile.name}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-grayScale-900">{profile.name}</p>
          )}
          <p className="text-[11px] font-medium uppercase tracking-wide text-grayScale-400">
            {isTeam ? "Team member" : "Learner"} · #{profile.id}
          </p>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <DetailRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={profile.email} />
        <DetailRow label="Role" value={profile.roleLabel} />
        <DetailRow label="Status" value={profile.status} capitalize />
        <DetailRow label="Email verified" value={profile.emailVerified ? "Yes" : "No"} />
        {profile.kind === "user" ? (
          <>
            <DetailRow label="Location" value={`${profile.region}, ${profile.country}`} />
            <DetailRow
              label="Last login"
              value={profile.lastLogin ? formatActorDate(profile.lastLogin) : "Never"}
            />
            <DetailRow label="Subscription" value={profile.subscriptionStatus} />
          </>
        ) : null}
        <DetailRow label="Joined" value={formatActorDate(profile.createdAt)} />
      </dl>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  capitalize,
}: {
  icon?: ReactNode
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="flex gap-2">
      {icon ? (
        <span className="mt-0.5 shrink-0 text-grayScale-400">{icon}</span>
      ) : (
        <span className="w-3.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-grayScale-400">{label}</dt>
        <dd
          className={cn("truncate font-medium text-grayScale-700", capitalize && "capitalize")}
          title={value}
        >
          {value}
        </dd>
      </div>
    </div>
  )
}
