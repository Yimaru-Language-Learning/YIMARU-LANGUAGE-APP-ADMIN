import http from "./http"
import type {
  GetRolesResponse,
  GetRoleDetailResponse,
  GetRolesParams,
  CreateRoleRequest,
  CreateRoleResponse,
  DeleteRoleResponse,
  SetRolePermissionsRequest,
  GetPermissionsResponse,
  BulkRoleDeactivateResponse,
  BulkRoleReactivateResponse,
} from "../types/rbac.types"

export const getRoles = (params?: GetRolesParams) =>
  http.get<GetRolesResponse>("/rbac/roles", { params })

export const getRoleDetail = (roleId: number) =>
  http.get<GetRoleDetailResponse>(`/rbac/roles/${roleId}`)

export const createRole = (data: CreateRoleRequest) =>
  http.post<CreateRoleResponse>("/rbac/roles", data)

export const updateRole = (roleId: number, data: CreateRoleRequest) =>
  http.put<CreateRoleResponse>(`/rbac/roles/${roleId}`, data)

export const setRolePermissions = (roleId: number, data: SetRolePermissionsRequest) =>
  http.put(`/rbac/roles/${roleId}/permissions`, data)

export const getAllPermissions = () =>
  http.get<GetPermissionsResponse>("/rbac/permissions")

export const deleteRole = (roleId: number) =>
  http.delete<DeleteRoleResponse>(`/rbac/roles/${roleId}`)

/** Deactivate all users and team members tied to this role (admin). */
export const bulkDeactivateRole = (roleId: number) =>
  http.post<BulkRoleDeactivateResponse>(`/admin/roles/${roleId}/bulk-deactivate`, {})

/** Reactivate users and team members tied to this role (admin). */
export const bulkReactivateRole = (roleId: number) =>
  http.post<BulkRoleReactivateResponse>(`/admin/roles/${roleId}/bulk-reactivate`, {})
