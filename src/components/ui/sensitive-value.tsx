import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../lib/utils"

type SensitiveRevealContextValue = {
  revealed: boolean
  toggle: () => void
}

const SensitiveRevealContext = createContext<SensitiveRevealContextValue | null>(null)

export function SensitiveRevealProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false)
  const toggle = useCallback(() => setRevealed((v) => !v), [])

  return (
    <SensitiveRevealContext.Provider value={{ revealed, toggle }}>
      {children}
    </SensitiveRevealContext.Provider>
  )
}

export function useSensitiveReveal() {
  const ctx = useContext(SensitiveRevealContext)
  const [localRevealed, setLocalRevealed] = useState(false)
  const toggleLocal = useCallback(() => setLocalRevealed((v) => !v), [])

  if (ctx) return ctx

  return {
    revealed: localRevealed,
    toggle: toggleLocal,
  }
}

export function SensitiveRevealToggle({
  className,
  label = "revenue",
}: {
  className?: string
  label?: string
}) {
  const { revealed, toggle } = useSensitiveReveal()

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-grayScale-500 transition-colors hover:bg-grayScale-100 hover:text-grayScale-800",
        className,
      )}
      aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
      title={revealed ? `Hide ${label}` : `Show ${label}`}
    >
      {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

export function SensitiveValue({
  children,
  className,
  showToggle = true,
}: {
  children: ReactNode
  className?: string
  showToggle?: boolean
}) {
  const { revealed } = useSensitiveReveal()

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "transition-[filter] duration-200",
          !revealed && "select-none blur-[6px]",
        )}
        aria-hidden={!revealed}
      >
        {children}
      </span>
      {showToggle ? <SensitiveRevealToggle /> : null}
    </span>
  )
}

export function SensitiveChart({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { revealed, toggle } = useSensitiveReveal()

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div
        className={cn(
          "h-full w-full transition-[filter] duration-200",
          !revealed && "pointer-events-none select-none blur-md",
        )}
        aria-hidden={!revealed}
      >
        {children}
      </div>
      {!revealed ? (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/40 text-sm font-medium text-grayScale-600 backdrop-blur-[1px] transition-colors hover:bg-white/55 hover:text-grayScale-800"
        >
          <Eye className="h-5 w-5" />
          Show revenue
        </button>
      ) : null}
    </div>
  )
}
