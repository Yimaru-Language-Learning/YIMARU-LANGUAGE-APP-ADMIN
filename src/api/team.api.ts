import http from "./http"
import type {
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
