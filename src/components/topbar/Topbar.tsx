"use client" // make sure this is a client component

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { cn } from "../../lib/utils"

export function Topbar() {
  // const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [shortName, setShortName] = useState("AA") 

  useEffect(() => {
    const first = localStorage.getItem("user_first_name") ?? "A"
    const last = localStorage.getItem("user_last_name") ?? "A"
    setShortName(first.charAt(0).toUpperCase() + last.charAt(0).toUpperCase())
  }, [])

  const handleOptionClick = (option: string) => {
    switch (option) {
      case "profile":
        console.log("Go to profile")
        break
      case "settings":
        console.log("Go to settings")
        break
      case "logout":
        localStorage.clear()
        window.location.href = "/login"
        // setShowLogoutConfirm(true) // Show confirmation popup instead of immediate logout
        break
    }
  }

  // const confirmLogout = () => {
  //   localStorage.clear()
  //   window.location.href = "/login"
  // }

  // const cancelLogout = () => setShowLogoutConfirm(false)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-3 border-b bg-grayScale-50/85 px-6 backdrop-blur">
      {/* Notifications */}
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border bg-white text-grayScale-500 hover:text-brand-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </button>

      {/* Avatar + Radix Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="focus:outline-none">
            <Avatar className="h-10 w-10 ring-2 ring-brand-100">
              <AvatarImage src="" alt="Admin" />
              <AvatarFallback className="bg-brand-500 text-sm font-medium text-white">
                {shortName}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          side="bottom"
          align="end"
          className="z-50 w-40 rounded-lg bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5"
        >
          <DropdownMenu.Item
            className={cn(
              "cursor-pointer rounded px-3 py-2 text-grayScale-700 text-sm hover:bg-grayScale-100"
            )}
            onClick={() => handleOptionClick("profile")}
          >
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={cn(
              "cursor-pointer rounded px-3 py-2 text-grayScale-700 text-sm hover:bg-grayScale-100"
            )}
            onClick={() => handleOptionClick("settings")}
          >
            Settings
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={cn(
              "cursor-pointer rounded px-3 py-2 text-grayScale-700 text-sm hover:bg-grayScale-100"
            )}
            onClick={() => handleOptionClick("logout")}
          >
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {/* Logout Confirmation Modal */}
      {/* {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-animation-fade">
          <div className="w-80 rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-grayScale-700">
              Confirm Logout
            </h3>
            <p className="mb-6 text-sm text-grayScale-500">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelLogout}
                className="rounded bg-grayScale-200 px-4 py-2 text-sm font-medium text-grayScale-700 hover:bg-grayScale-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )} */}

    </header>
  )
}
