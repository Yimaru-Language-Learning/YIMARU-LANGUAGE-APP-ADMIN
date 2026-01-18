// This matches the API response 1:1
export interface UserApiDTO {
  ID: number
  FirstName: string
  LastName: string
  Gender: string
  birth_day: string | null

  Email: string
  PhoneNumber: string
  Role: string

  Age: number
  EducationLevel: string
  Country: string
  Region: string

  KnowledgeLevel: string
  InitialAssessmentCompleted: boolean
  NickName: string
  Occupation: string
  LearningGoal: string
  LanguageGoal: string
  LanguageChallange: string
  FavouriteTopic: string

  EmailVerified: boolean
  PhoneVerified: boolean
  Status: string

  LastLogin: string | null
  ProfileCompleted: boolean
  ProfilePictureURL: string
  PreferredLanguage: string

  CreatedAt: string
  UpdatedAt: string | null
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
  id: u.ID,
  firstName: u.FirstName,
  lastName: u.LastName,
  nickName: u.NickName,
  email: u.Email,
  phoneNumber: u.PhoneNumber,
  region: u.Region,
  country: u.Country,
  lastLogin: u.LastLogin,
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
}

export interface UserProfileResponse {
  status: string
  message: string
  data: UserProfileData
  timestamp: string
}
