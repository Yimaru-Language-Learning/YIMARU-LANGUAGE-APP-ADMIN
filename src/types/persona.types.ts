export interface LmsPersona {
  id: number
  name: string
  description: string | null
  profile_picture: string | null
  gender: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

/** @deprecated Use LmsPersona — kept for practice picker compatibility */
export type PersonaListItem = LmsPersona

export interface PersonaListData {
  personas: LmsPersona[]
  total_count: number
  limit: number
  offset: number
}

export interface ListPersonasParams {
  active_only?: boolean
  limit?: number
  offset?: number
}

export interface CreatePersonaInput {
  name: string
  description?: string | null
  profile_picture?: string | null
  gender?: string | null
  is_active?: boolean
}

export interface UpdatePersonaInput {
  name?: string
  description?: string | null
  profile_picture?: string | null
  gender?: string | null
  is_active?: boolean
}

export interface GetPersonasResponse {
  message: string
  data: PersonaListData
  success?: boolean
  status_code?: number
  metadata?: unknown | null
}

export interface GetPersonaResponse {
  message: string
  data: LmsPersona
  success?: boolean
  status_code?: number
}

export interface MutatePersonaResponse {
  message: string
  data: LmsPersona
  success?: boolean
  status_code?: number
}

export interface DeletePersonaResponse {
  message: string
  success?: boolean
  status_code?: number
}

/** @deprecated Use ListPersonasParams */
export type GetPersonasParams = ListPersonasParams
