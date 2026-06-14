import { useCallback, useEffect, useState } from "react"
import { listActivePersonasForPicker } from "../api/personas.api"
import { mapPersonaToCard, type PersonaCardModel } from "../lib/personaDisplay"

type UseActivePersonasOptions = {
  limit?: number
}

export function useActivePersonas(options: UseActivePersonasOptions = {}) {
  const { limit = 200 } = options
  const [personas, setPersonas] = useState<PersonaCardModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listActivePersonasForPicker(limit)
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
  }, [limit])

  useEffect(() => {
    void load()
  }, [load])

  return { personas, loading, error, reload: load }
}
