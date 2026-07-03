import type {
  GetPersonasResponse,
  PersonaListItem,
} from "../types/persona.types"
import amanuelAvatar from "../assets/personas/amanuel.png"
import aseffaAvatar from "../assets/personas/aseffa.png"
import bethelAvatar from "../assets/personas/bethel.png"
import dawitAvatar from "../assets/personas/dawit.png"
import hanaAvatar from "../assets/personas/hana.png"
import liyaAvatar from "../assets/personas/liya.png"
import mahletAvatar from "../assets/personas/mahlet.png"
import nahomAvatar from "../assets/personas/nahom.png"

export type PersonaCardModel = {
  id: string
  name: string
  description: string
  avatar: string
}

/** Realistic default portraits bundled with the admin app (see src/assets/personas). */
const DEFAULT_PERSONA_AVATARS = [
  dawitAvatar,
  mahletAvatar,
  amanuelAvatar,
  bethelAvatar,
  liyaAvatar,
  aseffaAvatar,
  hanaAvatar,
  nahomAvatar,
] as const

const PERSONA_NAME_AVATARS: Record<string, string> = {
  dawit: dawitAvatar,
  mahlet: mahletAvatar,
  amanuel: amanuelAvatar,
  bethel: bethelAvatar,
  liya: liyaAvatar,
  aseffa: aseffaAvatar,
  hana: hanaAvatar,
  nahom: nahomAvatar,
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function defaultPersonaAvatarUrl(
  name: string,
  personaId?: number | string,
): string {
  const normalizedName = name.trim().toLowerCase()
  const byName = PERSONA_NAME_AVATARS[normalizedName]
  if (byName) return byName

  const numericId = personaId != null ? Number(personaId) : NaN
  const index =
    Number.isFinite(numericId) && numericId > 0
      ? (numericId - 1) % DEFAULT_PERSONA_AVATARS.length
      : hashString(normalizedName || "persona") % DEFAULT_PERSONA_AVATARS.length

  return DEFAULT_PERSONA_AVATARS[index]
}

/**
 * Default avatar when `profile_picture` is null: realistic bundled portrait,
 * matched by persona name when possible.
 */
export function personaAvatarUrl(
  profilePicture: string | null | undefined,
  name: string,
  personaId?: number | string,
): string {
  const url = profilePicture?.trim()
  if (url) return url
  return defaultPersonaAvatarUrl(name, personaId)
}

export function mapPersonaToCard(persona: PersonaListItem): PersonaCardModel {
  return {
    id: String(persona.id),
    name: persona.name,
    description: persona.description?.trim() ?? "",
    avatar: personaAvatarUrl(persona.profile_picture, persona.name, persona.id),
  }
}

export function formatPersonaDate(dateStr: string | null | undefined): string {
  if (!dateStr?.trim()) return "—"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function personaStatusLabel(isActive: boolean): string {
  return isActive ? "Active" : "Inactive"
}

export function personaGenderLabel(gender: string | null | undefined): string {
  const value = gender?.trim()
  return value ? value : "—"
}

export function unwrapPersonasList(
  res: { data?: GetPersonasResponse & { Data?: GetPersonasResponse["data"] } },
): PersonaListItem[] {
  const body = res.data
  if (!body) return []
  const data = body.data ?? body.Data
  const raw = data?.personas
  return Array.isArray(raw) ? raw : []
}
