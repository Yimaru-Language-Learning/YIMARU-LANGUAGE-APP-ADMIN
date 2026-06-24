import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { updateAppVersion } from "../../../api/app-versions.api"
import { Badge } from "../../../components/ui/badge"
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
import { Select } from "../../../components/ui/select"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { Textarea } from "../../../components/ui/textarea"
import {
  APP_UPDATE_TYPES,
  APP_VERSION_STATUSES,
  formatAppPlatform,
  versionLabel,
} from "../../../lib/appVersions"
import type {
  AppUpdateType,
  AppVersion,
  AppVersionStatus,
  UpdateAppVersionPayload,
} from "../../../types/app-version.types"

interface EditDraft {
  update_type: AppUpdateType
  release_notes: string
  store_url: string
  min_supported_version_code: string
  status: AppVersionStatus
}

function versionToDraft(version: AppVersion): EditDraft {
  return {
    update_type: version.update_type,
    release_notes: version.release_notes,
    store_url: version.store_url,
    min_supported_version_code: String(version.min_supported_version_code),
    status: version.status,
  }
}

function draftToPayload(draft: EditDraft): UpdateAppVersionPayload | null {
  const release_notes = draft.release_notes.trim()
  const store_url = draft.store_url.trim()
  const min_supported_version_code = Number(draft.min_supported_version_code)

  if (!release_notes) return null
  if (!store_url) return null
  if (!Number.isFinite(min_supported_version_code) || min_supported_version_code < 0) return null

  try {
    new URL(store_url)
  } catch {
    return null
  }

  return {
    update_type: draft.update_type,
    release_notes,
    store_url,
    min_supported_version_code,
    status: draft.status,
  }
}

type EditAppVersionDialogProps = {
  version: AppVersion | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (version: AppVersion) => void
}

export function EditAppVersionDialog({
  version,
  open,
  onOpenChange,
  onUpdated,
}: EditAppVersionDialogProps) {
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && version) {
      setDraft(versionToDraft(version))
      setSaving(false)
    }
    if (!open) {
      setDraft(null)
      setSaving(false)
    }
  }, [open, version])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!version || !draft) return

    const payload = draftToPayload(draft)
    if (!payload) {
      toast.error("Please fill in all required fields with valid values.")
      return
    }

    setSaving(true)
    try {
      const res = await updateAppVersion(version.id, payload)
      if (!res.data) {
        toast.error("Version was updated but the response could not be read.")
        return
      }
      toast.success(res.message || "App version updated successfully")
      onUpdated({
        ...res.data,
        platform: res.data.platform || version.platform,
        version_name: res.data.version_name || version.version_name,
        version_code: res.data.version_code || version.version_code,
        created_at: res.data.created_at || version.created_at,
      })
      onOpenChange(false)
    } catch {
      toast.error("Failed to update app version.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[12px] border border-grayScale-100 p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-grayScale-100 px-4 py-4 sm:px-6">
            <DialogTitle className="text-lg font-bold text-grayScale-900">
              Edit app version
            </DialogTitle>
            <DialogDescription className="text-sm text-grayScale-500">
              Update release rules and messaging for this version.
            </DialogDescription>
          </DialogHeader>

          {draft && version ? (
            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-grayScale-100 bg-grayScale-50/50 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Release
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-grayScale-900">
                    {versionLabel(version)}
                  </p>
                  <p className="text-xs text-grayScale-500">
                    Platform and version identifiers cannot be changed
                  </p>
                </div>
                <Badge variant="secondary">{formatAppPlatform(version.platform)}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Update type
                  </label>
                  <Select
                    value={draft.update_type}
                    onChange={(e) =>
                      setDraft((d) => d && { ...d, update_type: e.target.value as AppUpdateType })
                    }
                    className="rounded-[6px]"
                  >
                    {APP_UPDATE_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Status
                  </label>
                  <Select
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((d) => d && { ...d, status: e.target.value as AppVersionStatus })
                    }
                    className="rounded-[6px]"
                  >
                    {APP_VERSION_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Min supported code <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={draft.min_supported_version_code}
                  onChange={(e) =>
                    setDraft((d) => d && { ...d, min_supported_version_code: e.target.value })
                  }
                  className="rounded-[6px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Store URL <span className="text-destructive">*</span>
                </label>
                <Input
                  type="url"
                  value={draft.store_url}
                  onChange={(e) => setDraft((d) => d && { ...d, store_url: e.target.value })}
                  className="rounded-[6px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Release notes <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={draft.release_notes}
                  onChange={(e) => setDraft((d) => d && { ...d, release_notes: e.target.value })}
                  className="min-h-[96px] rounded-[6px]"
                  required
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-[6px]"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !draft}
              className="rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
            >
              {saving ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
