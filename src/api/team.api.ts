import http from "./http"
import type { GetTeamMembersResponse, GetTeamMemberResponse } from "../types/team.types"

export const getTeamMembers = (page?: number, pageSize?: number) =>
  http.get<GetTeamMembersResponse>("/team/members", {
    params: {
      page,
      page_size: pageSize,
    },
  })

export const getTeamMemberById = (id: number) =>
  http.get<GetTeamMemberResponse>(`/team/members/${id}`)
