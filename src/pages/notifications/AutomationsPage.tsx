import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { getAutomations, saveAutomations } from "../../api/automations.api"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { AutomationControls } from "../../components/notifications/AutomationControls"
import { useTeamPermissions } from "../../hooks/useTeamPermissions"
import { useAdminAccess } from "../../hooks/useAdminAccess"
import { notifyApiError } from "../../lib/apiErrors"
import { validateAutomationConfig } from "../../lib/automationRules"
import type { AutomationConfig, AutomationStep } from "../../types/automation.types"

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
  const [preview, setPreview] = useState<AutomationStep | null>(null)
  const [dirty, setDirty] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setConfig(await getAutomations()); setDirty(false) }
    catch (error) { setError("Could not load automations."); notifyApiError(error, "Could not load automations") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { if (!permissionsLoading && canRead) void load() }, [permissionsLoading, canRead, load])
  const change = (index: number, update: (rule: AutomationConfig["rules"][number]) => AutomationConfig["rules"][number]) => {
    setConfig((current) => current && ({ ...current, rules: current.rules.map((rule, i) => i === index ? update(rule) : rule) }))
    setDirty(true); setError(null)
  }
  const save = async () => {
    if (!config || saving) return
    const issue = validateAutomationConfig(config); if (issue) { setError(issue); return }
    setSaving(true); setError(null)
    try { setConfig(await saveAutomations(config)); setDirty(false); toast.success("Automation settings saved") }
    catch (error) { setError("Save failed. If another Admin changed these settings, reload before saving again."); notifyApiError(error, "Could not save automations") }
    finally { setSaving(false) }
  }
  if (permissionsLoading) return <p>Checking permissions…</p>
  if (!canRead) return <p role="alert">You do not have permission to view automation settings.</p>
  return <div className="space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Automated reminders</h1><Link to="/notifications/scheduled">View scheduled jobs</Link></div>
    <p className="text-sm text-grayScale-500">Only new events after enablement are eligible. Payment timing starts after confirmed failure/expiry; inactivity starts after recorded app activity. Learners can opt out. One reminder step per learner/channel per day.</p>
    <p className="text-sm text-grayScale-500">Edits apply to new sequences. Saving a disable or channel removal waits for in-progress deliveries; after the save succeeds, no new sends can start. Notifications already accepted by a provider cannot be recalled. These controls do not send test messages.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button variant="outline" disabled={loading || saving} onClick={() => { if (!dirty || window.confirm("Discard unsaved changes and reload?")) void load() }}>Reload</Button>
    {loading ? <p>Loading automations…</p> : config && <AutomationControls config={config} canEdit={canEdit} canSend={(channel) => fullAdmin || hasPermission(`notifications.bulk_${channel}`)} saving={saving} dirty={dirty} onChange={change} onPreview={setPreview} onSave={() => void save()} />}
    {preview && <Card><CardHeader><CardTitle>Message preview — not sent</CardTitle></CardHeader><CardContent><h3>{preview.title}</h3><p className="whitespace-pre-wrap py-3">{preview.message}</p><p className="text-xs text-grayScale-500">Emails use the existing branded custom-message template and include an unsubscribe link.</p><Button variant="outline" onClick={() => setPreview(null)}>Close preview</Button></CardContent></Card>}
  </div>
}
