import { Outlet } from "react-router-dom"

export function UserManagementLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 text-sm font-semibold text-grayScale-500">User Management</div>
      <Outlet />
    </div>
  )
}


