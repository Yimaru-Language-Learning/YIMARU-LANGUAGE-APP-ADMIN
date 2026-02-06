export interface LoginRequest {
    email: string
    password: string
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
