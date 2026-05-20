import http from "./http"
import type { GetPersonasParams, GetPersonasResponse } from "../types/persona.types"

/** GET /personas — list personas (filter active client-side when needed). */
export const getPersonas = (params?: GetPersonasParams) =>
  http.get<GetPersonasResponse>("/personas", { params })
