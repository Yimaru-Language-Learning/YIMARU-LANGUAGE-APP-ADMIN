export type ThemeMode = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "yimaru-admin-theme"

const MEDIA_QUERY = "(prefers-color-scheme: dark)"

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

/** Resolved appearance: light mode always forces light; dark forces dark; system follows OS. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light") return "light"
  if (mode === "dark") return "dark"
  return getSystemTheme()
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light"
  const value = localStorage.getItem(THEME_STORAGE_KEY)
  if (value === "light" || value === "dark" || value === "system") return value
  return "light"
}

function syncMetaThemeColor(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement("meta")
    meta.name = "theme-color"
    document.head.appendChild(meta)
  }
  meta.content = resolved === "dark" ? "#12121a" : "#f5f5f5"
}

export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(mode)
  const root = document.documentElement

  root.classList.remove("dark")
  if (resolved === "dark") {
    root.classList.add("dark")
  }

  root.dataset.theme = resolved
  root.dataset.themePreference = mode
  root.style.colorScheme = resolved

  syncMetaThemeColor(resolved)

  return resolved
}

export function watchSystemTheme(onChange: (resolved: ResolvedTheme) => void): () => void {
  if (typeof window === "undefined") return () => undefined

  const media = window.matchMedia(MEDIA_QUERY)
  const handler = () => onChange(getSystemTheme())

  media.addEventListener("change", handler)
  return () => media.removeEventListener("change", handler)
}
