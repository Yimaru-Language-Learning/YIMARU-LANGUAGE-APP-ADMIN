import http from "./http"
import type {
  GetRolesResponse,
  GetRoleDetailResponse,
  GetRolesParams,
  CreateRoleRequest,
  CreateRoleResponse,
  SetRolePermissionsRequest,
  GetPermissionsResponse,
} from "../types/rbac.types"

export const getRoles = (params?: GetRolesParams) =>
  http.get<GetRolesResponse>("/rbac/roles", { params })

export const getRoleDetail = (roleId: number) =>
  http.get<GetRoleDetailResponse>(`/rbac/roles/${roleId}`)

export const createRole = (data: CreateRoleRequest) =>
  http.post<CreateRoleResponse>("/rbac/roles", data)

export const setRolePermissions = (roleId: number, data: SetRolePermissionsRequest) =>
  http.put(`/rbac/roles/${roleId}/permissions`, data)

export const getAllPermissions = () =>
  http.get<GetPermissionsResponse>("/rbac/permissions")
