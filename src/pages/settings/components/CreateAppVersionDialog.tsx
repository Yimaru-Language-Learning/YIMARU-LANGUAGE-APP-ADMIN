import { notifyApiError } from "../../../lib/apiErrors"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createAppVersion } from "../../../api/app-versions.api"
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
  APP_PLATFORMS,
  APP_UPDATE_TYPES,
  APP_VERSION_STATUSES,
  DEFAULT_STORE_URLS,
} from "../../../lib/appVersions"
import type {
  AppPlatform,
  AppUpdateType,
  AppVersion,
  AppVersionStatus,
  CreateAppVersionPayload,
} from "../../../types/app-version.types"

export interface CreateAppVersionDraft {
  platform: AppPlatform
  version_name: string
  version_code: string
  update_type: AppUpdateType
  release_notes: string
  store_url: string
  min_supported_version_code: string
  status: AppVersionStatus
}

export const EMPTY_APP_VERSION_DRAFT: CreateAppVersionDraft = {
  platform: "ANDROID",
  version_name: "",
  version_code: "",
  update_type: "FORCE",
  release_notes: "",
  store_url: DEFAULT_STORE_URLS.ANDROID,
  min_supported_version_code: "",
  status: "ACTIVE",
}

function draftToPayload(draft: CreateAppVersionDraft): CreateAppVersionPayload | null {
  const version_name = draft.version_name.trim()
  const version_code = Number(draft.version_code)
  const min_supported_version_code = Number(draft.min_supported_version_code)
  const release_notes = draft.release_notes.trim()
  const store_url = draft.store_url.trim()

  if (!version_name) return null
  if (!Number.isFinite(version_code) || version_code < 1) return null
  if (!Number.isFinite(min_supported_version_code) || min_supported_version_code < 0) return null
  if (!release_notes) return null
  if (!store_url) return null

  try {
    new URL(store_url)
  } catch {
    return null
  }

  return {
    platform: draft.platform,
    version_name,
    version_code,
    update_type: draft.update_type,
    release_notes,
    store_url,
    min_supported_version_code,
    status: draft.status,
  }
}

type CreateAppVersionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (version: AppVersion) => void
}

export function CreateAppVersionDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateAppVersionDialogProps) {
  const [draft, setDraft] = useState<CreateAppVersionDraft>(EMPTY_APP_VERSION_DRAFT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setDraft(EMPTY_APP_VERSION_DRAFT)
      setSaving(false)
    }
  }, [open])

  const handlePlatformChange = (platform: AppPlatform) => {
    setDraft((d) => ({
      ...d,
      platform,
      store_url:
        d.store_url === DEFAULT_STORE_URLS.ANDROID || d.store_url === DEFAULT_STORE_URLS.IOS
          ? DEFAULT_STORE_URLS[platform] ?? d.store_url
          : d.store_url,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = draftToPayload(draft)
    if (!payload) {
      toast.error("Please fill in all required fields with valid values.")
      return
    }

    setSaving(true)
    try {
      const res = await createAppVersion(payload)
      if (!res.data) {
        toast.error("Version was created but the response could not be read.")
        return
      }
      toast.success(res.message || "App version created successfully")
      onCreated(res.data)
      onOpenChange(false)
    } catch {
      notifyApiError(err, "Failed to create app version.")
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
              New app version
            </DialogTitle>
            <DialogDescription className="text-sm text-grayScale-500">
              Publish a new app release. Learners on older builds will see update prompts based on
              these rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Platform <span className="text-destructive">*</span>
                </label>
                <Select
                  value={draft.platform}
                  onChange={(e) => handlePlatformChange(e.target.value as AppPlatform)}
                  className="rounded-[6px]"
                >
                  {APP_PLATFORMS.map((opt) => (
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
                    setDraft((d) => ({ ...d, status: e.target.value as AppVersionStatus }))
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Version name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={draft.version_name}
                  onChange={(e) => setDraft((d) => ({ ...d, version_name: e.target.value }))}
                  placeholder="1.3.0"
                  className="rounded-[6px]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Version code <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={draft.version_code}
                  onChange={(e) => setDraft((d) => ({ ...d, version_code: e.target.value }))}
                  placeholder="15"
                  className="rounded-[6px]"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                  Update type
                </label>
                <Select
                  value={draft.update_type}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, update_type: e.target.value as AppUpdateType }))
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
                  Min supported code <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={draft.min_supported_version_code}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, min_supported_version_code: e.target.value }))
                  }
                  placeholder="12"
                  className="rounded-[6px]"
                  required
                />
                <p className="text-[11px] text-grayScale-500">
                  Builds below this code are prompted to update
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Store URL <span className="text-destructive">*</span>
              </label>
              <Input
                type="url"
                value={draft.store_url}
                onChange={(e) => setDraft((d) => ({ ...d, store_url: e.target.value }))}
                placeholder="https://play.google.com/store/apps/details?id=…"
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
                onChange={(e) => setDraft((d) => ({ ...d, release_notes: e.target.value }))}
                placeholder="Critical security update and performance improvements."
                className="min-h-[96px] rounded-[6px]"
                required
              />
            </div>
          </div>

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
              disabled={saving}
              className="rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
            >
              {saving ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {saving ? "Publishing…" : "Publish version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
