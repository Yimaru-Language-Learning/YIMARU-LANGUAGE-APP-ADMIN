export type TeamInvitationStatus = "pending" | "accepted" | "expired" | "revoked" | string

/** GET /team/invitations/verify?token= — data payload */
export interface VerifyInvitationData {
  valid: boolean
  email?: string
  first_name?: string
  last_name?: string
  team_role?: string
  needs_profile_setup?: boolean
  expires_at?: string
  status?: TeamInvitationStatus
  message?: string
}

export interface VerifyInvitationResponse {
  success: boolean
  message: string
  data: VerifyInvitationData
  status_code?: number
  metadata?: unknown | null
}

/** POST /team/invitations/accept — finalize account setup */
export interface AcceptInvitationRequest {
  token: string
  password: string
  first_name: string
  last_name: string
  phone_number: string
  department: string
  job_title: string
}

export interface AcceptInvitationResponse {
  message: string
  data?: unknown
  success: boolean
  status_code: number
  metadata: unknown | null
}

/** POST /team/members/invite */
export interface InviteTeamMemberRequest {
  email: string
  team_role: string
}

export interface InviteTeamMemberResponse {
  message: string
  data: {
    invitation_id: number
    team_member_id: number
    email: string
    expires_at: string
  }
  success: boolean
  status_code: number
  metadata: unknown | null
}
