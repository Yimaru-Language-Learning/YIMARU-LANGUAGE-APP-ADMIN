export interface CourseCategory {
  id: number
  name: string
  is_active: boolean
  parent_id?: number | null
  created_at: string
}

export interface CreateCourseCategoryRequest {
  name: string
  parent_id?: number | null
}

export interface GetCourseCategoriesResponse {
  message: string
  data: {
    categories: CourseCategory[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface Course {
  id: number
  category_id: number
  title: string
  description: string
  thumbnail: string
  is_active: boolean
}

export interface GetCoursesResponse {
  message: string
  data: {
    courses: Course[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreateCourseRequest {
  category_id: number
  title: string
  description: string
}

export interface UpdateCourseRequest {
  title?: string
  description?: string
  thumbnail?: string
  is_active?: boolean
}

// ============================================
// Legacy Types (deprecated - using SubCourse hierarchy now)
// Keeping for backward compatibility with existing API endpoints
// ============================================

/** @deprecated Use SubCourse instead */
export interface Program {
  id: number
  course_id: number
  title: string
  description: string
  thumbnail: string
  display_order: number
  is_active: boolean
}

/** @deprecated Use GetSubCoursesResponse instead */
export interface GetProgramsResponse {
  message: string
  data: {
    programs: Program[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** @deprecated Use UpdateSubCourseStatusRequest instead */
export interface UpdateProgramStatusRequest {
  is_active: boolean
}

/** @deprecated Use CreateSubCourseRequest instead */
export interface CreateProgramRequest {
  course_id: number
  title: string
  description: string
}

/** @deprecated Use UpdateSubCourseRequest instead */
export interface UpdateProgramRequest {
  title: string
  description: string
  is_active: boolean
}

/** @deprecated Use SubCourse instead */
export interface Level {
  id: number
  program_id: number
  title: string
  description: string
  level_index: number
  number_of_modules: number
  number_of_practices: number
  number_of_videos: number
  is_active: boolean
}

/** @deprecated Use GetSubCoursesResponse instead */
export interface GetLevelsResponse {
  message: string
  data: {
    levels: Level[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** @deprecated Use CreateSubCourseRequest instead */
export interface CreateLevelRequest {
  program_id: number
  title: string
  description: string
}

/** @deprecated Use UpdateSubCourseRequest instead */
export interface UpdateLevelRequest {
  title: string
  description: string
}

/** @deprecated Use UpdateSubCourseStatusRequest instead */
export interface UpdateLevelStatusRequest {
  is_active: boolean
}

/** @deprecated Use SubCourse hierarchy instead */
export interface Module {
  id: number
  level_id: number
  title: string
  content: string
  display_order: number
  is_active: boolean
}

/** @deprecated Use GetSubCoursesResponse instead */
export interface GetModulesResponse {
  message: string
  data: {
    modules: Module[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** @deprecated Use CreateSubCourseRequest instead */
export interface CreateModuleRequest {
  level_id: number
  title: string
  content: string
}

/** @deprecated Use UpdateSubCourseRequest instead */
export interface UpdateModuleRequest {
  title: string
  content: string
}

/** @deprecated Use UpdateSubCourseStatusRequest instead */
export interface UpdateModuleStatusRequest {
  is_active: boolean
}

// ============================================
// New Hierarchy: SubCourse (replaces Program/Level/Module)
// ============================================
export interface SubCourse {
  id: number
  course_id: number
  title: string
  description: string
  level: string
  thumbnail: string
  display_order: number
  is_active: boolean
}

export interface GetSubCoursesResponse {
  message: string
  data: {
    sub_courses: SubCourse[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreateSubCourseRequest {
  course_id: number
  title: string
  description: string
  level: string
}

export interface UpdateSubCourseRequest {
  title: string
  description: string
  level: string
}

export interface UpdateSubCourseStatusRequest {
  is_active: boolean
  level: string
  title: string
}

// SubCourse Video
export interface SubCourseVideo {
  id: number
  sub_course_id: number
  title: string
  description: string
  video_url: string
  duration: number
  thumbnail: string
  is_published: boolean
  is_active: boolean
}

export interface GetSubCourseVideosResponse {
  message: string
  data: {
    videos: SubCourseVideo[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreateSubCourseVideoRequest {
  sub_course_id: number
  title: string
  description: string
  video_url: string
}

export interface CreateVimeoVideoRequest {
  sub_course_id: number
  title: string
  description: string
  source_url: string
  file_size: number
  duration: number
}

export interface UpdateSubCourseVideoRequest {
  title: string
  description: string
  video_url: string
}

// Practice now belongs to SubCourse
export interface Practice {
  id: number
  sub_course_id: number
  title: string
  description: string
  banner_image: string
  persona: string
  is_active: boolean
}

export interface GetPracticesResponse {
  message: string
  data: {
    practices: Practice[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreatePracticeRequest {
  sub_course_id: number
  title: string
  description: string
  persona?: string
}

export interface UpdatePracticeRequest {
  title: string
  description: string
  persona?: string
}

export interface UpdatePracticeStatusRequest {
  is_active: boolean
}

export interface PracticeQuestion {
  id: number
  practice_id: number
  question: string
  question_voice_prompt: string
  sample_answer_voice_prompt: string
  sample_answer: string
  tips: string
  type: "MCQ" | "TRUE_FALSE" | "SHORT"
}

export interface GetPracticeQuestionsResponse {
  message: string
  data: {
    questions: PracticeQuestion[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreatePracticeQuestionRequest {
  practice_id: number
  question: string
  question_voice_prompt?: string
  sample_answer_voice_prompt?: string
  sample_answer: string
  tips?: string
  type: "MCQ" | "TRUE_FALSE" | "SHORT"
}

export interface UpdatePracticeQuestionRequest {
  question: string
  question_voice_prompt?: string
  sample_answer_voice_prompt?: string
  sample_answer: string
  tips?: string
  type: "MCQ" | "TRUE_FALSE" | "SHORT"
}

// Question Sets (Practice sets fetched via /question-sets)
export type QuestionSetType = "PRACTICE" | "EXAM"
export type QuestionSetStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED"
export type QuestionSetOwnerType = "SUB_COURSE" | "COURSE"

export interface QuestionSet {
  id: number
  title: string
  description: string
  set_type: QuestionSetType
  owner_type: QuestionSetOwnerType
  owner_id: number
  persona: string
  shuffle_questions: boolean
  status: QuestionSetStatus
  created_at: string
}

export interface GetQuestionSetsResponse {
  message: string
  data: QuestionSet[]
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreateQuestionSetRequest {
  title: string
  description: string
  set_type: string
  owner_type: string
  owner_id: number
  persona?: string
  shuffle_questions?: boolean
  status?: string
  banner_image?: string
  passing_score?: number
  time_limit_minutes?: number
}

export interface AddQuestionToSetRequest {
  display_order: number
  question_id: number
}

export interface QuestionOption {
  option_order: number
  option_text: string
  is_correct: boolean
}

export interface CreateQuestionRequest {
  question_text: string
  question_type: string
  difficulty_level: string
  points: number
  tips?: string
  explanation?: string
  status?: string
  options?: QuestionOption[]
  voice_prompt?: string
  sample_answer_voice_prompt?: string
  short_answers?: string[]
}

export interface CreateQuestionResponse {
  message: string
  data: {
    id: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreateQuestionSetResponse {
  message: string
  data: {
    id: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

// Sub-course Prerequisites
export interface SubCoursePrerequisite {
  id: number
  sub_course_id: number
  prerequisite_sub_course_id: number
  prerequisite_title: string
  prerequisite_level: string
  prerequisite_display_order: number
}

export interface GetSubCoursePrerequisitesResponse {
  message: string
  data: SubCoursePrerequisite[]
  success: boolean
  status_code: number
  metadata: unknown
}

export interface AddSubCoursePrerequisiteRequest {
  prerequisite_sub_course_id: number
}

// Learning Path (full tree from GET /courses/:courseId/learning-path)
export interface LearningPathSubCourse {
  id: number
  title: string
  description: string
  thumbnail: string
  display_order: number
  level: string
  prerequisite_count: number
  video_count: number
  practice_count: number
  prerequisites: { sub_course_id: number; title: string; level: string }[]
  videos: unknown[]
  practices: unknown[]
}

export interface LearningPath {
  course_id: number
  course_title: string
  description: string
  thumbnail: string
  intro_video_url: string
  category_id: number
  category_name: string
  sub_courses: LearningPathSubCourse[]
}

export interface GetLearningPathResponse {
  message: string
  data: LearningPath
  success: boolean
  status_code: number
  metadata: unknown
}

export interface ReorderItem {
  id: number
  position: number
}

// Ratings
export interface Rating {
  id: number
  user_id: number
  target_type: string
  target_id: number
  stars: number
  review: string
  created_at: string
  updated_at: string
}

export interface GetRatingsParams {
  target_type: string
  target_id: number
  limit?: number
  offset?: number
}

export interface GetRatingsResponse {
  message: string
  data: Rating[]
  success: boolean
  status_code: number
  metadata: unknown
}

// Vimeo Sample Video
export interface VimeoSampleVideo {
  vimeo_id: string
  uri: string
  name: string
  description: string
  duration: number
  width: number
  height: number
  link: string
  embed_url: string
  embed_html: string
  thumbnail_url: string
  status: string
  transcode_status: string
}

export interface GetVimeoSampleResponse {
  message: string
  data: {
    video: VimeoSampleVideo
    iframe: string
  }
  success: boolean
  status_code: number
  metadata: unknown
}
