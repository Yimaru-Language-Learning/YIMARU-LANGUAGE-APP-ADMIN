import http from "./http"
import type { LoginRequest, LoginResponse } from "../types/auth.types"
import { TeamAuthError } from "../types/auth.types"

export interface LoginResult {
  accessToken: string
  refreshToken: string
  role: string
  memberId: number
}

function mapLoginResult(data: LoginResponse["data"]): LoginResult {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    role: data.team_role,
    memberId: data.member_id,
  }
}

export const login = async (payload: LoginRequest): Promise<LoginResult> => {
  const res = await http.post<LoginResponse>("/team/login", payload)
  if (!res.data?.data?.access_token || !res.data?.data?.refresh_token) {
    throw new TeamAuthError("Login failed", "Missing tokens in response", res.status)
  }
  return mapLoginResult(res.data.data)
}

export const loginWithGoogle = async (credential: string): Promise<LoginResult> => {
  const res = await http.post<LoginResponse>("/team/google-login", {
    token: credential,
  })
  if (!res.data?.data?.access_token || !res.data?.data?.refresh_token) {
    throw new TeamAuthError("Google sign-in failed", "Missing tokens in response", res.status)
  }
  return mapLoginResult(res.data.data)
}

export { TeamAuthError } from "../types/auth.types"
