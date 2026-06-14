import http from "./http"
import type {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  InviteTeamMemberRequest,
  InviteTeamMemberResponse,
  VerifyInvitationResponse,
} from "../types/teamInvitation.types"
import type {
  ChangeTeamMemberPasswordRequest,
  ChangeTeamMemberPasswordResponse,
  GetTeamMeResponse,
  GetTeamMembersResponse,
  GetTeamMemberResponse,
  CreateTeamMemberRequest,
  UpdateTeamMemberRequest,
  UpdateTeamMeRequest,
  TeamMember,
  TeamMemberDetail,
} from "../types/team.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function optionalString(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text ? text : null
}

export function normalizeTeamMemberDetail(raw: unknown): TeamMemberDetail | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null

  return {
    id,
    first_name: String(raw.first_name ?? ""),
    last_name: String(raw.last_name ?? ""),
    email: String(raw.email ?? ""),
    phone_number: String(raw.phone_number ?? ""),
    team_role: String(raw.team_role ?? ""),
    department: String(raw.department ?? ""),
    job_title: String(raw.job_title ?? ""),
    bio: optionalString(raw.bio),
    status: String(raw.status ?? ""),
    email_verified: raw.email_verified === true,
    last_login: optionalString(raw.last_login),
    created_at: String(raw.created_at ?? ""),
    updated_at: optionalString(raw.updated_at),
  }
}

export function normalizeTeamMember(raw: unknown): TeamMember | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  if (!Number.isFinite(id)) return null

  const permissionsRaw = raw.permissions
  const permissions = Array.isArray(permissionsRaw)
    ? permissionsRaw.map((entry) => String(entry))
    : undefined

  return {
    id,
    first_name: String(raw.first_name ?? ""),
    last_name: String(raw.last_name ?? ""),
    email: String(raw.email ?? ""),
    phone_number: String(raw.phone_number ?? ""),
    team_role: String(raw.team_role ?? ""),
    department: String(raw.department ?? ""),
    job_title: String(raw.job_title ?? ""),
    employment_type: optionalString(raw.employment_type) ?? undefined,
    hire_date: optionalString(raw.hire_date) ?? undefined,
    bio: optionalString(raw.bio) ?? undefined,
    status: String(raw.status ?? ""),
    email_verified: raw.email_verified === true,
    permissions,
    last_login: optionalString(raw.last_login),
    created_at: String(raw.created_at ?? ""),
  }
}

export const getTeamMembers = (page?: number, pageSize?: number) =>
  http.get<GetTeamMembersResponse>("/team/members", {
    params: {
      page,
      page_size: pageSize,
    },
  })

export const getTeamMemberById = (id: number) =>
  http.get<GetTeamMemberResponse>(`/team/members/${id}`).then((res) => {
    const body = res.data
    const member = normalizeTeamMemberDetail(body?.data)
    if (!member) {
      throw new Error("Invalid team member response")
    }
    return {
      ...res,
      data: {
        ...body,
        data: member,
      },
    }
  })

/** GET /team/me — signed-in team member profile */
export const getTeamMe = () => http.get<GetTeamMeResponse>("/team/me")

/** PUT /team/me — update signed-in team member profile */
export const updateTeamMe = (data: UpdateTeamMeRequest) =>
  http.put<GetTeamMeResponse>("/team/me", data)

export const createTeamMember = (data: CreateTeamMemberRequest) =>
  http.post("/team/register", data)

export const updateTeamMemberStatus = (id: number, status: string) =>
  http.patch(`/team/members/${id}/status`, { status })

export const updateTeamMember = (id: number, data: UpdateTeamMemberRequest) =>
  http.put(`/team/members/${id}`, data)

/** POST /team/members/:id/change-password — change the signed-in member's password. */
export const changeTeamMemberPassword = (id: number, data: ChangeTeamMemberPasswordRequest) =>
  http.post<ChangeTeamMemberPasswordResponse>(`/team/members/${id}/change-password`, data)

/** POST /team/members/invite — send invitation email (permission: team.members.invite). */
export const inviteTeamMember = (data: InviteTeamMemberRequest) =>
  http.post<InviteTeamMemberResponse>("/team/members/invite", data)

/** GET /team/invitations/verify?token= — public (accept-invite page). */
export const verifyTeamInvitation = (token: string) =>
  http.get<VerifyInvitationResponse>("/team/invitations/verify", {
    params: { token },
  })

/** POST /team/invitations/accept — public (set password after invite). */
export const acceptTeamInvitation = (data: AcceptInvitationRequest) =>
  http.post<AcceptInvitationResponse>("/team/invitations/accept", data)

export function parseVerifyInvitation(
  response: Awaited<ReturnType<typeof verifyTeamInvitation>>,
): VerifyInvitationResponse["data"] | null {
  const body = response.data
  if (body?.data && typeof body.data === "object" && "valid" in body.data) {
    return body.data
  }
  return null
}
