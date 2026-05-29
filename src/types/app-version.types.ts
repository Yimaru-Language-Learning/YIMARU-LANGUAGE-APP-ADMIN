export type AppPlatform = "ANDROID" | "IOS" | string

export type AppUpdateType = "FORCE" | "SOFT" | "OPTIONAL" | string

export type AppVersionStatus = "ACTIVE" | "INACTIVE" | "DRAFT" | string

export interface AppVersion {
  id: number
  platform: AppPlatform
  version_name: string
  version_code: number
  update_type: AppUpdateType
  release_notes: string
  store_url: string
  min_supported_version_code: number
  status: AppVersionStatus
  created_at: string
}

export interface CreateAppVersionPayload {
  platform: AppPlatform
  version_name: string
  version_code: number
  update_type: AppUpdateType
  release_notes: string
  store_url: string
  min_supported_version_code: number
  status: AppVersionStatus
}

export interface UpdateAppVersionPayload {
  update_type: AppUpdateType
  release_notes: string
  store_url: string
  min_supported_version_code: number
  status: AppVersionStatus
}

export interface AppVersionsListData {
  versions: AppVersion[]
  total_count: number
}

export interface AppVersionsListResponse {
  message?: string
  data: AppVersionsListData
  success?: boolean
  status_code?: number
  metadata?: unknown
}

export interface AppVersionMutationResponse {
  message?: string
  data: AppVersion
  success?: boolean
  status_code?: number
  metadata?: unknown
}
