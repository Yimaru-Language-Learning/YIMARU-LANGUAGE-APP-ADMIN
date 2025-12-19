import { Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-3 border-b bg-grayScale-50/85 px-6 backdrop-blur">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border bg-white text-grayScale-500 hover:text-brand-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </button>

      <Avatar className="h-10 w-10 ring-2 ring-brand-100">
        <AvatarImage src="" alt="Admin" />
        <AvatarFallback className="bg-brand-500 text-sm font-medium text-white">JA</AvatarFallback>
      </Avatar>
    </header>
  )
}


