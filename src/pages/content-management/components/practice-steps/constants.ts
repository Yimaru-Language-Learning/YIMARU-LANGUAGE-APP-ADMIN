import type { PersonaCardModel } from "../../../../lib/personaDisplay"

export const STEPS = ["Context", "Scenario", "Persona", "Questions", "Review"]

export function personaFromId(
  selectedPersona: string | null,
  personas: PersonaCardModel[],
): PersonaCardModel | undefined {
  if (!selectedPersona) return undefined
  return personas.find((p) => p.id === selectedPersona)
}

export function personaIdNumber(selectedPersona: string | null): number | undefined {
  const n = Number(selectedPersona)
  return Number.isFinite(n) && n > 0 ? n : undefined
}
