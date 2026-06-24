import { Outlet } from "react-router-dom"

export function RoleManagementLayout() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <div className="mb-4 text-sm font-semibold text-grayScale-500">Role Management</div>
      <Outlet />
    </div>
  )
}

