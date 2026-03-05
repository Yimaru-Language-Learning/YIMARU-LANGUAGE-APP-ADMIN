export interface Role {
  id: number
  name: string
  description: string
  is_system: boolean
  created_at: string
}

export interface RolePermission {
  id: number
  key: string
  name: string
  description: string
  group_name: string
  created_at: string
}

export interface RoleDetail extends Role {
  permissions: RolePermission[]
}

export interface GetRolesResponse {
  message: string
  data: {
    roles: Role[]
    total: number
    page: number
    page_size: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetRoleDetailResponse {
  message: string
  data: RoleDetail
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetRolesParams {
  query?: string
  is_system?: boolean
  page?: number
  page_size?: number
}

export interface CreateRoleRequest {
  name: string
  description: string
}

export interface CreateRoleResponse {
  message: string
  data: Role
  success: boolean
  status_code: number
  metadata: unknown
}

export interface SetRolePermissionsRequest {
  permission_ids: number[]
}

export interface GetPermissionsResponse {
  message: string
  data: Record<string, RolePermission[]>
  success: boolean
  status_code: number
  metadata: unknown
}
