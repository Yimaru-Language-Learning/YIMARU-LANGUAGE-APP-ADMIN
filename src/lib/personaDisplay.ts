import type {
  GetPersonasResponse,
  PersonaListItem,
} from "../types/persona.types"

export type PersonaCardModel = {
  id: string
  name: string
  description: string
  avatar: string
}

/** Soft, professional palette aligned with the admin brand (slate, indigo, violet). */
const PERSONA_FALLBACK_BACKGROUNDS = "f1f5f9,e0e7ff,ede9fe,fdf4ff,ecfeff"

/**
 * Default avatar when `profile_picture` is null: professional illustrated portrait
 * (DiceBear personas), not casual cartoon avataaars.
 */
export function personaAvatarUrl(
  profilePicture: string | null | undefined,
  name: string,
  personaId?: number | string,
): string {
  const url = profilePicture?.trim()
  if (url) return url
  const params = new URLSearchParams({
    seed: personaId != null ? `yimaru-persona-${personaId}` : `yimaru-persona-${name}`,
    backgroundColor: PERSONA_FALLBACK_BACKGROUNDS,
    radius: "50",
  })
  return `https://api.dicebear.com/7.x/personas/svg?${params.toString()}`
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
