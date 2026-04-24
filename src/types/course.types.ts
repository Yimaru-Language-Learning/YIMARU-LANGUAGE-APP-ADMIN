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
  sub_category_id?: number | null
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
  sub_category_id?: number | null
  title: string
  description: string
}

export interface UpdateCourseRequest {
  title?: string
  description?: string
  thumbnail?: string
  is_active?: boolean
}

/** Row from GET /programs (e.g. Beginner / Intermediate program buckets) */
export interface LearningProgramListItem {
  id: number
  name: string
  description?: string | null
  thumbnail?: string | null
  sort_order: number
  created_at: string
}

export interface UpdateLearningProgramRequest {
  name: string
  description: string
  thumbnail: string
}

export interface CreateLearningProgramRequest {
  name: string
  description: string
  thumbnail: string
}

export interface CreateLearningProgramResponse {
  message: string
  data: LearningProgramListItem
  success: boolean
  status_code: number
  metadata: unknown | null
}

export interface GetLearningProgramsResponse {
  message: string
  data: {
    programs: LearningProgramListItem[]
    total_count: number
    limit?: number
    offset?: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /programs/:program_id/courses */
export interface ProgramCourseListItem {
  id: number
  program_id: number
  name: string
  description: string
  sort_order: number
  created_at: string
  thumbnail?: string | null
  /** Some list endpoints may expose the image as `thumbnail_url` instead. */
  thumbnail_url?: string | null
  /** When the API adds aggregates, map these for the course cards. */
  modules_count?: number
  videos_count?: number
  practices_count?: number
}

/** Body for PUT /courses/:id (program-linked Learn English courses). */
export interface UpdateTopLevelCourseRequest {
  name: string
  description: string
  thumbnail: string
}

/** Body for POST /programs/:program_id/courses */
export interface CreateProgramCourseRequest {
  name: string
  description: string
  thumbnail: string
}

export interface CreateProgramCourseResponse {
  message: string
  data: ProgramCourseListItem
  success: boolean
  status_code: number
  metadata: unknown | null
}

export interface GetProgramCoursesResponse {
  message: string
  data: {
    total_count: number
    limit: number
    offset: number
    courses: ProgramCourseListItem[]
  }
  success: boolean
  status_code: number
  metadata: unknown | null
}

/** Row from GET /courses/:courseId/modules (Learn English track). */
export interface TopLevelCourseModuleItem {
  id: number
  program_id: number
  course_id: number
  name: string
  description: string
  icon?: string | null
  sort_order: number
  created_at: string
}

export interface GetTopLevelCourseModulesResponse {
  message: string
  data: {
    limit: number
    offset: number
    modules: TopLevelCourseModuleItem[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown | null
}

/** Body for PUT /modules/:id (Learn English top-level modules). */
export interface UpdateTopLevelCourseModuleRequest {
  name: string
  description: string
  icon: string
}

/** Body for POST /courses/:courseId/modules */
export interface CreateTopLevelCourseModuleRequest {
  name: string
  description: string
  icon: string
}

export interface CreateTopLevelCourseModuleResponse {
  message: string
  data: TopLevelCourseModuleItem
  success: boolean
  status_code: number
  metadata: unknown | null
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
  /** Legacy field kept for backward compatibility. */
  content?: string
  /** Preferred field for module detail text. */
  description?: string
  icon_url?: string
  display_order?: number
  is_active?: boolean
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
  /** Present when derived from course hierarchy rows (levels → modules → sub-modules). */
  level_id?: number
  module_id?: number
  title: string
  description: string
  level: string
  cefr_level?: string
  thumbnail: string
  display_order: number
  sub_level?: string
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

/** Compatibility request used to create sub-modules */
export interface CreateSubCourseRequest {
  course_id: number
  title: string
  description: string
  thumbnail: string
  display_order: number
  level: string
  sub_level: string
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
  sub_course_id?: number
  sub_module_id?: number
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
  sub_course_id?: number
  sub_module_id?: number
  title: string
  description: string
  video_url: string
}

export type VideoVisibility = "PUBLISHED" | "DRAFT" | "PRIVATE" | "UNLISTED" | string
export type VideoStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED" | string

export interface CreateCourseVideoRequest {
  sub_course_id?: number
  sub_module_id?: number
  title: string
  description: string
  video_url: string
  duration: number
  resolution?: string
  visibility?: VideoVisibility
  display_order?: number
  status?: VideoStatus
}

export interface CreateVimeoVideoRequest {
  sub_course_id?: number
  sub_module_id?: number
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
  sub_course_id?: number
  sub_module_id?: number
  title: string
  description: string
  thumbnail?: string
  intro_video_url?: string
  question_set_id?: number
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
  sub_course_id?: number
  sub_module_id?: number
  title: string
  description: string
  thumbnail?: string
  intro_video_url?: string
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
  points?: number
  difficulty_level?: string
  question_voice_prompt: string
  sample_answer_voice_prompt: string
  sample_answer: string
  tips: string
  type: "MCQ" | "TRUE_FALSE" | "SHORT" | "AUDIO"
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
  explanation?: string
  difficulty_level?: string
  points?: number
  options?: QuestionOption[]
  short_answers?: string[]
  type: "MCQ" | "TRUE_FALSE" | "SHORT"
}

export interface UpdatePracticeQuestionRequest {
  question: string
  question_voice_prompt?: string
  sample_answer_voice_prompt?: string
  sample_answer: string
  tips?: string
  explanation?: string
  difficulty_level?: string
  points?: number
  options?: QuestionOption[]
  short_answers?: string[]
  type: "MCQ" | "TRUE_FALSE" | "SHORT"
}

// Question Sets (Practice sets fetched via /question-sets)
export type QuestionSetType = "PRACTICE" | "EXAM"
export type QuestionSetStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED"
export type QuestionSetOwnerType = "SUB_COURSE" | "SUB_MODULE" | "COURSE"

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
  data: QuestionSet[] | { question_sets: QuestionSet[]; total_count?: number }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetQuestionSetsParams {
  set_type?: "PRACTICE" | "INITIAL_ASSESSMENT" | "EXAM" | string
  owner_type?: "SUB_COURSE" | "SUB_MODULE" | "COURSE" | string
  owner_id?: number
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string
  limit?: number
  offset?: number
}

export interface QuestionSetDetail {
  id: number
  title: string
  description: string
  set_type: string
  owner_type: string
  owner_id: number
  banner_image?: string | null
  persona?: string | null
  time_limit_minutes?: number | null
  passing_score?: number | null
  shuffle_questions?: boolean
  status: string
  sub_course_video_id?: number | null
  intro_video_url?: string | null
  created_at: string
  question_count: number
}

export interface GetQuestionSetDetailResponse {
  message: string
  data: QuestionSetDetail
  success: boolean
  status_code: number
  metadata: unknown
}

export interface QuestionSetQuestion {
  id: number
  set_id: number
  question_id: number
  display_order: number
  question_text: string
  question_type: "MCQ" | "TRUE_FALSE" | "SHORT" | "SHORT_ANSWER" | "AUDIO" | string
  difficulty_level?: string | null
  points?: number
  explanation?: string | null
  tips?: string | null
  voice_prompt?: string | null
  sample_answer_voice_prompt?: string | null
  image_url?: string | null
  audio_correct_answer_text?: string | null
  question_status?: string
}

export interface GetQuestionSetQuestionsResponse {
  message: string
  data: QuestionSetQuestion[]
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetPracticeQuestionsByPracticeResponse {
  message: string
  data: {
    questions: QuestionSetQuestion[]
    total_count: number
    limit: number
    offset: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** POST /question-sets — practices use set_type: "PRACTICE", owner_type: "SUB_COURSE", owner_id: sub-course id */
export interface CreateQuestionSetRequest {
  title: string
  set_type: string
  description?: string | null
  owner_type?: string | null
  owner_id?: number | null
  banner_image?: string | null
  persona?: string | null
  time_limit_minutes?: number | null
  passing_score?: number | null
  shuffle_questions?: boolean | null
  status?: string | null
  sub_course_video_id?: number | null
  intro_video_url?: string | null
}

export interface AddQuestionToSetRequest {
  display_order?: number
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
  difficulty_level?: string
  points?: number
  tips?: string
  explanation?: string
  status?: string
  image_url?: string
  options?: QuestionOption[]
  voice_prompt?: string
  sample_answer_voice_prompt?: string
  audio_correct_answer_text?: string
  short_answers?: string[] | { acceptable_answer: string; match_type: "EXACT" | "CASE_INSENSITIVE" }[]
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

export interface QuestionShortAnswer {
  acceptable_answer: string
  match_type?: "EXACT" | "CASE_INSENSITIVE" | string
}

export interface QuestionDetail {
  id: number
  question_text: string
  question_type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "SHORT" | string
  difficulty_level?: string | null
  points?: number | null
  status?: string
  created_at?: string
  options?: ({ id?: number } & QuestionOption)[]
  short_answers?: string[] | QuestionShortAnswer[]
  tips?: string | null
  explanation?: string | null
  image_url?: string | null
  voice_prompt?: string | null
  sample_answer_voice_prompt?: string | null
  audio_correct_answer_text?: string | null
}

export interface GetQuestionDetailResponse {
  message: string
  data: QuestionDetail
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetQuestionsParams {
  question_type?: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "AUDIO" | string
  difficulty?: "EASY" | "MEDIUM" | "HARD" | string
  status?: "DRAFT" | "PUBLISHED" | "INACTIVE" | string
  limit?: number
  offset?: number
}

export interface GetQuestionsResponse {
  message: string
  data: QuestionDetail[] | { questions: QuestionDetail[]; total_count?: number }
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
  sub_level?: string
  prerequisite_count: number
  video_count: number
  practice_count: number
  prerequisites: { sub_course_id: number; title: string; level: string }[]
  videos: LearningPathVideo[]
  practices: LearningPathPractice[]
}

export interface LearningPathVideo {
  id: number
  title: string
  display_order: number
  duration: number
  video_url: string
}

export interface LearningPathPractice {
  id: number
  title: string
  status: string
  question_count: number
  display_order?: number
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

export interface HumanLanguageLesson {
  id: number
  course_id: number
  title: string
  description?: string | null
  thumbnail?: string | null
  display_order: number
  level: string
  video_count: number
  practice_count: number
  videos: LearningPathVideo[]
  practices: LearningPathPractice[]
}

export interface SubModuleLessonDetail {
  id: number
  sub_module_id: number
  display_order: number
  is_active: boolean
  created_at: string
  title: string
  description?: string | null
  thumbnail?: string | null
  teaching_text?: string | null
  teaching_image_url?: string | null
  teaching_audio_url?: string | null
  teaching_video_url?: string | null
}

export interface SubModuleLesson {
  id: number
  sub_module_id: number
  display_order: number
  is_active: boolean
  created_at: string
  title: string
  description?: string | null
  thumbnail?: string | null
  teaching_text?: string | null
  teaching_image_url?: string | null
  teaching_audio_url?: string | null
  teaching_video_url?: string | null
}

export interface GetSubModuleLessonDetailResponse {
  message: string
  data: SubModuleLessonDetail
  success: boolean
  status_code: number
  metadata: unknown
}

export interface UpdateSubModuleLessonRequest {
  title: string
  description?: string | null
  thumbnail?: string | null
  teaching_text?: string | null
  teaching_image_url?: string | null
  teaching_audio_url?: string | null
  teaching_video_url?: string | null
  display_order: number
  is_active: boolean
}

export interface UpdateSubModuleLessonResponse {
  message: string
  data: SubModuleLessonDetail
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetSubModuleLessonsResponse {
  message: string
  data: SubModuleLesson[]
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetHumanLanguageLessonsResponse {
  message: string
  data: {
    course_id: number
    course_title: string
    cefr_level: string
    lessons: HumanLanguageLesson[]
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /course-management/human-language/sub-categories */
export interface HumanLanguageSubCategoryListItem {
  id: number
  category_id: number
  category_name: string
  name: string
  description?: string | null
  display_order: number
  is_active: boolean
  created_at: string
  /** Present on some payloads; ignore if unused. */
  total_count?: number
}

export interface GetHumanLanguageSubCategoriesResponse {
  message: string
  data: {
    sub_categories: HumanLanguageSubCategoryListItem[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /course-management/categories/:categoryId/sub-categories */
export interface CategorySubCategoryListItem {
  id: number
  category_id: number
  category_name: string
  name: string
  description?: string | null
  display_order: number
  is_active: boolean
  created_at: string
  /** Sometimes echoed per row by the API; safe to ignore. */
  total_count?: number
}

export interface GetCategorySubCategoriesResponse {
  message: string
  data: {
    sub_categories: CategorySubCategoryListItem[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /course-management/sub-categories/:subCategoryId/courses */
export interface SubCategoryCourseListItem {
  id: number
  category_id: number
  sub_category_id: number
  title: string
  description?: string | null
  thumbnail?: string | null
  intro_video_url?: string | null
  is_active: boolean
  total_count?: number
}

export interface GetSubCategoryCoursesResponse {
  message: string
  data: {
    courses: SubCategoryCourseListItem[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /course-management/courses/:courseId/levels or GET /course-management/levels */
export interface CourseLevelRow {
  id: number
  course_id: number
  cefr_level: string
  display_order: number
  is_active: boolean
  created_at: string
  title: string
  description?: string | null
  thumbnail?: string | null
  total_count?: number
}

export interface GetCourseLevelsForCourseResponse {
  message: string
  data: {
    levels: CourseLevelRow[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetCourseLevelsAllResponse {
  message: string
  data: {
    levels: CourseLevelRow[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface GetCourseLevelByIdResponse {
  message: string
  data: CourseLevelRow
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /course-management/modules/:moduleId/sub-modules */
export interface CourseSubModuleListItem {
  id: number
  module_id: number
  title: string
  description?: string | null
  display_order: number
  is_active: boolean
  created_at: string
  legacy_sub_course_id?: number | null
  thumbnail?: string | null
  tips?: string | null
  total_count?: number
}

export interface GetSubModulesByModuleResponse {
  message: string
  data: {
    sub_modules: CourseSubModuleListItem[]
    total_count: number
  }
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /course-management/human-language/hierarchy */
export interface HumanLanguageHierarchyFlatRow {
  category_id: number
  category_name: string
  sub_category_id?: number | null
  sub_category_name?: string | null
  course_id?: number | null
  course_title?: string | null
}

export interface GetHumanLanguageHierarchyFlatResponse {
  message: string
  data: HumanLanguageHierarchyFlatRow[]
  success: boolean
  status_code: number
  metadata: unknown
}

/** Row from GET /course-management/courses/:courseId/hierarchy */
export interface CourseHierarchyRow {
  course_id: number
  course_title: string
  level_id?: number | null
  cefr_level?: string | null
  level_title?: string | null
  level_description?: string | null
  level_thumbnail?: string | null
  module_id?: number | null
  module_title?: string | null
  module_icon_url?: string | null
  sub_module_id?: number | null
  sub_module_title?: string | null
  sub_module_description?: string | null
  sub_module_thumbnail?: string | null
  sub_module_tips?: string | null
  sub_module_display_order?: number | null
}

export interface GetCourseHierarchyResponse {
  message: string
  data: CourseHierarchyRow[]
  success: boolean
  status_code: number
  metadata: unknown
}

export interface HumanLanguageSubModule {
  id: number
  title: string
  videos: LearningPathVideo[]
  lessons?: {
    id: number
    question_set_id: number
    title: string
    status: string
    question_count: number
    display_order: number
    intro_video_url?: string | null
  }[]
  practices: LearningPathPractice[]
}

export interface HumanLanguageModule {
  id: number
  title: string
  sub_modules: HumanLanguageSubModule[]
}

export interface HumanLanguageLevelTree {
  level_id?: number
  level: string
  modules: HumanLanguageModule[]
}

export interface HumanLanguageCourseTree {
  course_id: number
  course_name: string
  levels: HumanLanguageLevelTree[]
}

export interface HumanLanguageSubCategoryTree {
  sub_category_id: number
  sub_category_name: string
  courses: HumanLanguageCourseTree[]
}

export interface GetHumanLanguageHierarchyResponse {
  message: string
  data: {
    category_id: number
    category_name: string
    sub_categories: HumanLanguageSubCategoryTree[]
  }
  success: boolean
  status_code: number
  metadata: unknown
}

export interface CreateHumanLanguageLessonRequest {
  course_id: number
  title: string
  description?: string
  thumbnail?: string
  display_order?: number
  cefr_level: string
}

export interface GetSubCourseEntryAssessmentResponse {
  message: string
  data: QuestionSet | null
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
