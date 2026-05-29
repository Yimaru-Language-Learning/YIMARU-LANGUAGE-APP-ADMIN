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
  GetTeamMembersResponse,
  GetTeamMemberResponse,
  CreateTeamMemberRequest,
  UpdateTeamMemberRequest,
} from "../types/team.types"

export const getTeamMembers = (page?: number, pageSize?: number) =>
  http.get<GetTeamMembersResponse>("/team/members", {
    params: {
      page,
      page_size: pageSize,
    },
  })

export const getTeamMemberById = (id: number) =>
  http.get<GetTeamMemberResponse>(`/team/members/${id}`)

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
