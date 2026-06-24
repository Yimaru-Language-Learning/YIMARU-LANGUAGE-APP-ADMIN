import axios from "axios"
import type {
  ApiErrorResponse,
  LoginResponse,
  LoginResponseData,
  TeamMemberRefreshRequest,
  TeamMemberSession,
} from "../types/auth.types"
import { TeamAuthError } from "../types/auth.types"

function mapSessionData(data: LoginResponseData): TeamMemberSession {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    member_id: data.member_id,
    team_role: data.team_role,
  }
}

function parseAuthError(body: unknown, status: number): TeamAuthError {
  const record = body && typeof body === "object" ? (body as ApiErrorResponse) : null
  const message = record?.message || "Authentication failed"
  return new TeamAuthError(message, record?.error, status)
}

/** POST /team/refresh — raw axios only (no http interceptors). */
export async function teamRefresh(refreshToken: string): Promise<TeamMemberSession> {
  const payload: TeamMemberRefreshRequest = { refresh_token: refreshToken }
  try {
    const res = await axios.post<LoginResponse>(
      `${import.meta.env.VITE_API_BASE_URL}/team/refresh`,
      payload,
    )

    if (!res.data?.data?.access_token || !res.data?.data?.refresh_token) {
      throw parseAuthError(res.data, res.status)
    }

    return mapSessionData(res.data.data)
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw parseAuthError(err.response.data, err.response.status)
    }
    throw err
  }
}

export { TeamAuthError } from "../types/auth.types"
