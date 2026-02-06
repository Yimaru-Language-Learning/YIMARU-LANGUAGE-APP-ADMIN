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
