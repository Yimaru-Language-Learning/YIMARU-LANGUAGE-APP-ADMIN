import { cn } from "../../lib/utils"

const SIZE_CLASSES = {
  sm: "size-10",
  md: "size-12",
  lg: "size-16",
  xl: "size-24",
} as const

type PersonaAvatarProps = {
  src: string
  alt?: string
  size?: keyof typeof SIZE_CLASSES
  selected?: boolean
  className?: string
}

export function PersonaAvatar({
  src,
  alt = "",
  size = "md",
  selected = false,
  className,
}: PersonaAvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full bg-grayScale-100",
        "aspect-square",
        SIZE_CLASSES[size],
        selected && "ring-[3px] ring-brand-500 ring-offset-2 ring-offset-white",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
        draggable={false}
      />
    </div>
  )
}
