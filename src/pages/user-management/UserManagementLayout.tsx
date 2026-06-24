import { Outlet } from "react-router-dom"

export function UserManagementLayout() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <Outlet />
    </div>
  )
}


