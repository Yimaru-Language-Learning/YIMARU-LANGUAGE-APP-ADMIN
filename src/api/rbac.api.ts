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
  Role,
} from "../types/rbac.types"

export const getRoles = (params?: GetRolesParams) =>
  http.get<GetRolesResponse>("/rbac/roles", { params })

/** Fetch every RBAC role across paginated list responses. */
export async function fetchAllRoles(
  params?: Pick<GetRolesParams, "query" | "is_system">,
): Promise<Role[]> {
  const pageSize = 50
  const firstRes = await getRoles({ page: 1, page_size: pageSize, ...params })
  const firstBatch = firstRes.data?.data?.roles ?? []
  const total = firstRes.data?.data?.total ?? firstBatch.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (totalPages === 1) return firstBatch

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, idx) =>
      getRoles({ page: idx + 2, page_size: pageSize, ...params }),
    ),
  )
  return [...firstBatch, ...remaining.flatMap((res) => res.data?.data?.roles ?? [])]
}

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

/** POST /rbac/permissions/sync — upsert permission definitions and default role links. */
export const syncRbacPermissions = () =>
  http.post<{ message?: string }>("/rbac/permissions/sync")

export const deleteRole = (roleId: number) =>
  http.delete<DeleteRoleResponse>(`/rbac/roles/${roleId}`)

/** Deactivate all users and team members tied to this role (admin). */
export const bulkDeactivateRole = (roleId: number) =>
  http.post<BulkRoleDeactivateResponse>(`/admin/roles/${roleId}/bulk-deactivate`, {})

/** Reactivate users and team members tied to this role (admin). */
export const bulkReactivateRole = (roleId: number) =>
  http.post<BulkRoleReactivateResponse>(`/admin/roles/${roleId}/bulk-reactivate`, {})
