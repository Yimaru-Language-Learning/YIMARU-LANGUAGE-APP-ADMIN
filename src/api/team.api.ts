import http from "./http"
import { syncSessionTeamRole } from "../lib/teamRole"
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
  TeamResetPasswordRequest,
  TeamPasswordResetResponse,
  TeamSendPasswordResetRequest,
  TeamVerifyPasswordResetData,
  TeamVerifyPasswordResetResponse,
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

/** Lowercased emails for every team member (active, pending invite, etc.). */
export async function fetchAllTeamMemberEmails(): Promise<Set<string>> {
  const emails = new Set<string>()
  const batchSize = 100
  let page = 1
  let totalPages = 1

  do {
    const res = await getTeamMembers(page, batchSize)
    totalPages = res.data.metadata?.total_pages ?? 1
    const members = (res.data.data ?? [])
      .map((entry) => normalizeTeamMember(entry))
      .filter((entry): entry is TeamMember => entry != null)
    for (const member of members) {
      const email = member.email.trim().toLowerCase()
      if (email) emails.add(email)
    }
    page++
  } while (page <= totalPages)

  return emails
}

/** Permissions for the signed-in team member (from the members list payload). */
export async function fetchCurrentTeamMemberPermissions(): Promise<string[]> {
  const memberId = Number(localStorage.getItem("member_id"))
  if (!Number.isFinite(memberId)) return []

  const batchSize = 100
  let page = 1
  let totalPages = 1

  do {
    const res = await getTeamMembers(page, batchSize)
    totalPages = res.data.metadata?.total_pages ?? 1
    const members = (res.data.data ?? [])
      .map((entry) => normalizeTeamMember(entry))
      .filter((entry): entry is TeamMember => entry != null)
    const self = members.find((member) => member.id === memberId)
    if (self) {
      syncSessionTeamRole(self.team_role)
      return self.permissions ?? []
    }
    page++
  } while (page <= totalPages)

  return []
}

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

/** POST /team/sendResetCode — public; emails a password-reset link. */
export const sendTeamPasswordReset = (data: TeamSendPasswordResetRequest) =>
  http.post<TeamPasswordResetResponse>("/team/sendResetCode", data, {
    skipErrorToast: true,
  })

/** GET /team/verifyResetCode — public; validates email+otp without consuming. */
export const verifyTeamPasswordReset = (email: string, otp: string) =>
  http.get<TeamVerifyPasswordResetResponse>("/team/verifyResetCode", {
    params: { email, otp },
    skipErrorToast: true,
  })

export function parseVerifyPasswordReset(
  response: Awaited<ReturnType<typeof verifyTeamPasswordReset>>,
): TeamVerifyPasswordResetData | null {
  const body = response.data
  if (body?.data && typeof body.data === "object" && "valid" in body.data) {
    return body.data
  }
  return null
}

/** POST /team/resetPassword — public; completes reset with email + OTP from the link. */
export const resetTeamPassword = (data: TeamResetPasswordRequest) =>
  http.post<TeamPasswordResetResponse>("/team/resetPassword", data, {
    skipErrorToast: true,
  })

/** POST /team/members/invite — send invitation email (permission: team.members.invite). */
export const inviteTeamMember = (data: InviteTeamMemberRequest) =>
  http.post<InviteTeamMemberResponse>("/team/members/invite", data, {
    skipErrorToast: true,
  })

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
