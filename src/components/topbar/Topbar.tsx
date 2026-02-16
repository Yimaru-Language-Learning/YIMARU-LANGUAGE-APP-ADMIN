"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut, Menu, Settings, UserCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { cn } from "../../lib/utils"
import { NotificationDropdown } from "./NotificationDropdown"

type TopbarProps = {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const [shortName, setShortName] = useState("AA")

  useEffect(() => {
    const updateShortName = () => {
      const first = localStorage.getItem("user_first_name") ?? "A"
      const last = localStorage.getItem("user_last_name") ?? "A"
      setShortName(first.charAt(0).toUpperCase() + last.charAt(0).toUpperCase())
    }

    updateShortName()

    window.addEventListener("user-profile-updated", updateShortName)
    return () => window.removeEventListener("user-profile-updated", updateShortName)
  }, [])

  const handleOptionClick = (option: string) => {
    switch (option) {
      case "profile":
        navigate("/profile")
        break
      case "settings":
        navigate("/settings")
        break
      case "logout":
        localStorage.clear()
        window.location.href = "/login"
        break
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b bg-grayScale-50/85 px-4 backdrop-blur lg:justify-end lg:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border bg-white text-grayScale-500 transition-colors hover:text-brand-600 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationDropdown />

        {/* Separator */}
        <div className="h-6 w-px bg-grayScale-200" />

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
            className="z-50 w-48 rounded-lg bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5"
          >
            <DropdownMenu.Item
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-grayScale-600 hover:bg-grayScale-100 hover:text-brand-600"
              )}
              onClick={() => handleOptionClick("profile")}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 group-hover:bg-brand-100 group-hover:text-brand-600">
                <UserCircle2 className="h-4 w-4" />
              </span>
              Profile
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-grayScale-600 hover:bg-grayScale-100 hover:text-brand-600"
              )}
              onClick={() => handleOptionClick("settings")}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 group-hover:bg-brand-100 group-hover:text-brand-600">
                <Settings className="h-4 w-4" />
              </span>
              Settings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-grayScale-600 hover:bg-grayScale-100 hover:text-brand-600"
              )}
              onClick={() => handleOptionClick("logout")}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 group-hover:bg-brand-100 group-hover:text-brand-600">
                <LogOut className="h-4 w-4" />
              </span>
              Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
