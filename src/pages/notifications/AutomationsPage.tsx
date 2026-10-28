import { useCallback, useEffect, useState } from "react"
import { CalendarClock, Info, RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { getAutomations, saveAutomations } from "../../api/automations.api"
import { Button } from "../../components/ui/button"
import { AdminPageHeader } from "../../components/admin/AdminPageHeader"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { AutomationControls } from "../../components/notifications/AutomationControls"
import { useTeamPermissions } from "../../hooks/useTeamPermissions"
import { useAdminAccess } from "../../hooks/useAdminAccess"
import { notifyApiError } from "../../lib/apiErrors"
import { validateAutomationConfig } from "../../lib/automationRules"
import type { AutomationConfig } from "../../types/automation.types"

export function AutomationsPage() {
  const { teamRole } = useAdminAccess()
  const { hasPermission, loading: permissionsLoading } = useTeamPermissions()
  const fullAdmin = teamRole === "ADMIN" || teamRole === "SUPER_ADMIN"
  const canRead = fullAdmin || hasPermission("settings.get")
  const canEdit = fullAdmin || hasPermission("settings.update")
  const [config, setConfig] = useState<AutomationConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setConfig(await getAutomations())
      setDirty(false)
    } catch (error) {
      setError("Could not load automations.")
      notifyApiError(error, "Could not load automations")
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { if (!permissionsLoading && canRead) void load() }, [permissionsLoading, canRead, load])
  const change = (index: number, update: (rule: AutomationConfig["rules"][number]) => AutomationConfig["rules"][number]) => {
    setConfig((current) => current && ({ ...current, rules: current.rules.map((rule, i) => i === index ? update(rule) : rule) }))
    setDirty(true)
    setError(null)
  }
  const save = async () => {
    if (!config || saving || loading || !canEdit) return
    const issue = validateAutomationConfig(config)
    if (issue) {
      setError(issue)
      return
    }
    setSaving(true)
    setError(null)
    try {
      setConfig(await saveAutomations(config))
      setDirty(false)
      toast.success("Automation settings saved")
    } catch (error) {
      setError("Save failed. If another Admin changed these settings, reload before saving again.")
      notifyApiError(error, "Could not save automations")
    } finally {
      setSaving(false)
    }
  }

  if (permissionsLoading) return <p role="status" className="py-10 text-center text-sm text-grayScale-500">Checking permissions…</p>
  if (!canRead) return <p role="alert" className="py-10 text-center text-sm text-destructive">You do not have permission to view automation settings.</p>

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <AdminPageHeader
        eyebrow="Notifications"
        title={<h1 className="text-2xl font-semibold tracking-tight text-foreground">Automated reminders</h1>}
        description="Manage subscription recovery, inactivity, and new-course announcements for your learners."
        actions={
          <>
            <Button type="button" variant="outline" disabled={loading || saving} onClick={() => {
              if (!dirty || window.confirm("Discard unsaved changes and reload?")) void load()
            }}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload
            </Button>
            <Button variant="outline" asChild>
              <Link to="/notifications/scheduled">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                View scheduled jobs
              </Link>
            </Button>
          </>
        }
      />
      <div className="flex items-start gap-3 rounded-xl border border-grayScale-200 bg-card p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
        <div className="space-y-2 text-sm leading-relaxed text-grayScale-500">
          <p className="font-medium text-foreground">Before enabling reminders</p>
          <p>Only new events after enablement are eligible. Payment timing starts after confirmed failure/expiry; inactivity starts after recorded app activity; course announcements start on first publication. The first enablement excludes all existing courses, including drafts; announce those manually if needed. This historical baseline is not repeated on re-enablement. Learners can opt out. One automated message per learner/channel per day; payment recovery has priority.</p>
          <p>Edits apply to new sequences. Saving a disable or channel removal waits for in-progress deliveries; after the save succeeds, no new sends can start. Notifications already accepted by a provider cannot be recalled. These controls do not send test messages.</p>
        </div>
      </div>
      {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 rounded-xl border border-grayScale-200 bg-card py-12 text-sm text-grayScale-500">
          <SpinnerIcon className="h-5 w-5 text-brand-500" />
          Loading automations…
        </div>
      ) : config && (
        <AutomationControls
          config={config}
          canEdit={canEdit}
          canSend={(channel) => fullAdmin || hasPermission(`notifications.bulk_${channel}`)}
          saving={saving}
          dirty={dirty}
          onChange={change}
          onSave={() => void save()}
        />
      )}
    </div>
  )
}
