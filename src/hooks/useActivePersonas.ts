import { useCallback, useEffect, useState } from "react"
import { getPersonaById, listActivePersonasForPicker } from "../api/personas.api"
import { mapPersonaToCard, type PersonaCardModel } from "../lib/personaDisplay"

type UseActivePersonasOptions = {
  limit?: number
  /** Include this persona in the picker even when inactive or missing from the active list. */
  ensurePersonaId?: number | null
}

export function useActivePersonas(options: UseActivePersonasOptions = {}) {
  const { limit = 200, ensurePersonaId = null } = options
  const [personas, setPersonas] = useState<PersonaCardModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let list = await listActivePersonasForPicker(limit)
      const ensureId =
        ensurePersonaId != null &&
        Number.isFinite(ensurePersonaId) &&
        ensurePersonaId > 0
          ? ensurePersonaId
          : null
      if (ensureId != null && !list.some((persona) => persona.id === ensureId)) {
        try {
          const res = await getPersonaById(ensureId)
          if (res.data) {
            list = [res.data, ...list]
          }
        } catch {
          // Keep active list only if the saved persona cannot be loaded.
        }
      }
      setPersonas(list.map(mapPersonaToCard))
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to load personas"
      setError(msg)
      setPersonas([])
    } finally {
      setLoading(false)
    }
  }, [limit, ensurePersonaId])

  useEffect(() => {
    void load()
  }, [load])

  return { personas, loading, error, reload: load }
}
