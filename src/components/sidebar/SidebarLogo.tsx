import { BrandLogo } from "../brand/BrandLogo"
import logoSymbolSrc from "../../assets/logo-icon.svg"
import { useTheme } from "../../contexts/ThemeContext"

type SidebarLogoProps = {
  collapsed: boolean
}

export function SidebarLogo({ collapsed }: SidebarLogoProps) {
  const { resolvedTheme } = useTheme()

  if (collapsed) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500">
        <img
          src={logoSymbolSrc}
          alt="Yimaru"
          className="h-6 w-6"
        />
      </span>
    )
  }

  return <BrandLogo variant={resolvedTheme === "dark" ? "light" : "dark"} />
}
