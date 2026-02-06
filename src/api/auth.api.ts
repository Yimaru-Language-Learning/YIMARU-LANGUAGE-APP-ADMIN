import http from "./http"
import type { LoginRequest, LoginResponse, LoginResponseData } from "../types/auth.types"

export interface LoginResult {
  accessToken: string
  refreshToken: string
  role: string
  memberId: number
}

export const login = async (payload: LoginRequest): Promise<LoginResult> => {
  const res = await http.post<LoginResponse>("/team/login", payload)

  const data: LoginResponseData = res.data.data

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    role: data.team_role,
    memberId: data.member_id,
  }
}
