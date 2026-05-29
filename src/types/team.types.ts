export interface TeamMember {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number: string
  team_role: string
  department: string
  job_title: string
  employment_type: string
  hire_date: string
  bio: string
  status: string
  email_verified: boolean
  permissions: string[]
  last_login?: string | null
  created_at: string
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
  data: TeamMember
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
