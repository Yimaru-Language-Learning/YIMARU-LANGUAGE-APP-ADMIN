// This matches the API response 1:1
export interface UserApiDTO {
  id: number
  first_name: string
  last_name: string
  gender: string
  birth_day: string | null

  email: string
  phone_number?: string
  role: string

  age_group: string
  education_level: string
  country: string
  region: string

  nick_name: string
  occupation: string
  learning_goal: string
  language_goal: string
  language_challange: string
  favoutite_topic: string

  email_verified: boolean
  phone_verified: boolean
  status: string

  profile_completed: boolean
  profile_picture_url: string
  preferred_language: string

  created_at: string
}

export interface GetUsersResponse {
  status: string
  message: string
  data: {
    total: number
    users: UserApiDTO[]
  }
  timestamp: string
}

export interface User {
  id: number
  firstName: string
  lastName: string
  nickName: string
  email: string
  phoneNumber: string
  region: string
  country: string
  lastLogin: string | null
}

export const mapUserApiToUser = (u: UserApiDTO): User => ({
  id: u.id,
  firstName: u.first_name,
  lastName: u.last_name,
  nickName: u.nick_name,
  email: u.email,
  phoneNumber: u.phone_number ?? "",
  region: u.region,
  country: u.country,
  lastLogin: null,
})

export interface UserProfileData {
  id: number
  first_name: string
  last_name: string
  gender: string
  birth_day: string | null

  email: string
  phone_number: string
  role: string
  age: number
  education_level: string
  country: string
  region: string

  nick_name: string
  occupation: string
  learning_goal: string
  language_goal: string
  language_challange: string
  favoutite_topic: string

  email_verified: boolean
  phone_verified: boolean
  status: string

  last_login: string | null
  profile_completed: boolean
  preferred_language: string
  profile_picture_url: string

  created_at: string
  updated_at?: string | null // optional
  age_group?: string
  profile_completion_percentage?: number
}

export interface UserProfileResponse {
  status: string
  message: string
  data: UserProfileData
  timestamp: string
}

export interface UserSummary {
  total_users: number
  active_users: number
  joined_this_month: number
}

export interface UserSummaryResponse {
  message: string
  data: UserSummary
  success: boolean
  status_code: number
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  gender?: string
  birth_day?: string
  age_group?: string
  education_level?: string
  country?: string
  region?: string
  nick_name?: string
  occupation?: string
  learning_goal?: string
  language_goal?: string
  language_challange?: string
  favoutite_topic?: string
  profile_picture_url?: string
  preferred_language?: string
}
