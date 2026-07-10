export interface TeamMember {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number: string
  team_role: string
  department: string
  job_title: string
  employment_type?: string
  hire_date?: string
  bio?: string
  status: string
  email_verified: boolean
  permissions?: string[]
  last_login?: string | null
  created_at: string
}

/** GET /team/members/:id — single team member detail */
export interface TeamMemberDetail {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number: string
  team_role: string
  department: string
  job_title: string
  bio: string | null
  status: string
  email_verified: boolean
  last_login: string | null
  created_at: string
  updated_at: string | null
}

/** GET /team/me — signed-in team member profile */
export interface TeamMeProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number: string
  team_role: string
  department: string
  job_title: string
  status: string
  email_verified: boolean
  last_login: string | null
  created_at: string
  updated_at: string | null
  profile_picture_url?: string | null
  bio?: string | null
  work_phone?: string | null
}

export interface GetTeamMeResponse {
  message: string
  data: TeamMeProfile
  success: boolean
  status_code: number
  metadata: unknown | null
}

/** PUT /team/me — update signed-in team member profile */
export interface UpdateTeamMeRequest {
  first_name?: string
  last_name?: string
  phone_number?: string
  department?: string
  job_title?: string
  profile_picture_url?: string
  bio?: string
  work_phone?: string
}

export interface CreateTeamMemberRequest {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  team_role: string
  department: string
  job_title: string
  employment_type: string
  hire_date: string
  bio?: string
}

export interface UpdateTeamMemberRequest {
  bio?: string
  department?: string
  emergency_contact?: string
  employment_type?: string
  first_name?: string
  hire_date?: string
  job_title?: string
  last_name?: string
  permissions?: string[]
  phone_number?: string
  profile_picture_url?: string
  team_role?: string
  work_phone?: string
}

export interface TeamMembersMetadata {
  total: number
  total_pages: number
  current_page: number
  limit: number
}

export interface GetTeamMembersResponse {
  message: string
  data: TeamMember[]
  success: boolean
  status_code: number
  metadata: TeamMembersMetadata
}

export interface GetTeamMemberResponse {
  message: string
  data: TeamMemberDetail
  success: boolean
  status_code: number
  metadata: null
}

/** POST /team/members/:id/change-password */
export interface ChangeTeamMemberPasswordRequest {
  current_password: string
  new_password: string
}

export interface ChangeTeamMemberPasswordResponse {
  message?: string
  success?: boolean
  status_code?: number
  metadata?: unknown
}

/** POST /team/sendResetCode — public forgot-password */
export interface TeamSendPasswordResetRequest {
  email: string
}

/** POST /team/resetPassword — public complete reset from email link */
export interface TeamResetPasswordRequest {
  email: string
  otp: string
  password: string
}

export interface TeamPasswordResetResponse {
  message?: string
  success?: boolean
  data?: unknown
}

/** GET /team/verifyResetCode — public; checks link without consuming OTP */
export type TeamVerifyPasswordResetReason =
  | "missing"
  | "invalid"
  | "used"
  | "expired"

export interface TeamVerifyPasswordResetData {
  valid: boolean
  reason?: TeamVerifyPasswordResetReason | string
}

export interface TeamVerifyPasswordResetResponse {
  message?: string
  success?: boolean
  data?: TeamVerifyPasswordResetData
}
