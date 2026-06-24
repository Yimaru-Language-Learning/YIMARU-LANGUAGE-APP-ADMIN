export interface LoginRequest {
    email: string
    password: string
}

export interface TeamMemberSession {
  access_token: string
  refresh_token: string
  member_id: number
  team_role: string
}

export interface TeamMemberRefreshRequest {
  refresh_token: string
}

export interface LoginResponseData {
  access_token: string
  refresh_token: string
  member_id: number
  team_role: string
}

export interface LoginResponse {
  message: string
  data: LoginResponseData
  success: boolean
  status_code: number
  metadata: any | null
}

export interface ApiErrorResponse {
  message: string
  error?: string
}

export class TeamAuthError extends Error {
  constructor(
    message: string,
    public readonly detail: string | undefined,
    public readonly status: number,
  ) {
    super(message)
    this.name = "TeamAuthError"
  }
}
