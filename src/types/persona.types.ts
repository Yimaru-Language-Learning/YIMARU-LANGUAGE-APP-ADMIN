export interface PersonaListItem {
  id: number
  name: string
  description: string
  profile_picture: string | null
  is_active: boolean
  created_at: string
}

export interface GetPersonasParams {
  limit?: number
  offset?: number
}

export interface GetPersonasResponse {
  message: string
  data: {
    personas: PersonaListItem[]
    total_count: number
    limit: number
    offset: number
  }
  success: boolean
  status_code: number
  metadata: unknown | null
}
