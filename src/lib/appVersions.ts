import type {
  AppPlatform,
  AppUpdateType,
  AppVersion,
  AppVersionStatus,
} from "../types/app-version.types"
import { formatAppDateTime } from "./datetime"

export const APP_PLATFORMS: { value: AppPlatform; label: string }[] = [
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iOS" },
]

export const APP_UPDATE_TYPES: { value: AppUpdateType; label: string; description: string }[] = [
  {
    value: "FORCE",
    label: "Force update",
    description: "Users must update before continuing",
  },
  {
    value: "SOFT",
    label: "Soft update",
    description: "Recommended update; users can dismiss",
  },
  {
    value: "OPTIONAL",
    label: "Optional",
    description: "Informational prompt only",
  },
]

export const APP_VERSION_STATUSES: { value: AppVersionStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DRAFT", label: "Draft" },
]

export const DEFAULT_STORE_URLS: Record<string, string> = {
  ANDROID: "https://play.google.com/store/apps/details?id=com.yimaru.app",
  IOS: "https://apps.apple.com/app/id000000000",
}

export function formatAppPlatform(platform: string): string {
  const match = APP_PLATFORMS.find((p) => p.value === platform)
  if (match) return match.label
  return platform.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatUpdateType(updateType: string): string {
  const match = APP_UPDATE_TYPES.find((t) => t.value === updateType)
  if (match) return match.label
  return updateType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatVersionStatus(status: string): string {
  const match = APP_VERSION_STATUSES.find((s) => s.value === status)
  if (match) return match.label
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatAppVersionCreatedAt(raw: string): string {
  if (!raw) return "unassigned"
  const normalized = raw.replace(" +0000 UTC", "Z").replace(/^(\d{4}-\d{2}-\d{2}) /, "$1T")
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) {
    const datePart = raw.split(" ")[0]
    return datePart || raw
  }
  return formatAppDateTime(normalized)
}

export function versionLabel(version: Pick<AppVersion, "version_name" | "version_code">): string {
  return `v${version.version_name} (${version.version_code})`
}
