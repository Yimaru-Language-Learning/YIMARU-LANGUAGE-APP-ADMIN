import http from "./http"
import type {
  GetCourseCategoriesResponse,
  GetCoursesResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
  GetSubCoursesResponse,
  CreateSubCourseRequest,
  UpdateSubCourseRequest,
  UpdateSubCourseStatusRequest,
  GetSubCourseVideosResponse,
  CreateSubCourseVideoRequest,
  UpdateSubCourseVideoRequest,
  GetPracticesResponse,
  CreatePracticeRequest,
  UpdatePracticeRequest,
  UpdatePracticeStatusRequest,
  GetPracticeQuestionsResponse,
  CreatePracticeQuestionRequest,
  UpdatePracticeQuestionRequest,
  GetProgramsResponse,
  GetLevelsResponse,
  GetModulesResponse,
  UpdateProgramStatusRequest,
  CreateProgramRequest,
  UpdateProgramRequest,
  CreateLevelRequest,
  UpdateLevelRequest,
  UpdateLevelStatusRequest,
  CreateModuleRequest,
  UpdateModuleRequest,
  UpdateModuleStatusRequest,
  GetQuestionSetsResponse,
  CreateQuestionSetRequest,
  CreateQuestionSetResponse,
  AddQuestionToSetRequest,
  CreateQuestionRequest,
  CreateQuestionResponse,
  CreateVimeoVideoRequest,
  CreateCourseCategoryRequest,
  GetSubCoursePrerequisitesResponse,
  AddSubCoursePrerequisiteRequest,
  GetLearningPathResponse,
  ReorderItem,
  GetRatingsResponse,
  GetRatingsParams,
  GetVimeoSampleResponse,
} from "../types/course.types"

export const getCourseCategories = () =>
  http.get<GetCourseCategoriesResponse>("/course-management/categories")

export const createCourseCategory = (data: CreateCourseCategoryRequest) =>
  http.post("/course-management/categories", data)

export const getCoursesByCategory = (categoryId: number) =>
  http.get<GetCoursesResponse>(`/course-management/categories/${categoryId}/courses`)

export const createCourse = (data: CreateCourseRequest) =>
  http.post("/course-management/courses", data)

export const deleteCourse = (courseId: number) =>
  http.delete(`/course-management/courses/${courseId}`)

export const updateCourseStatus = (courseId: number, isActive: boolean) =>
  http.put(`/course-management/courses/${courseId}`, { is_active: isActive })

export const updateCourse = (courseId: number, data: UpdateCourseRequest) =>
  http.put(`/course-management/courses/${courseId}`, data)

// SubCourse APIs (New Hierarchy)
export const getSubCoursesByCourse = (courseId: number) =>
  http.get<GetSubCoursesResponse>(`/course-management/courses/${courseId}/sub-courses`)

export const createSubCourse = (data: CreateSubCourseRequest) =>
  http.post("/course-management/sub-courses", data)

export const updateSubCourse = (subCourseId: number, data: UpdateSubCourseRequest) =>
  http.patch(`/course-management/sub-courses/${subCourseId}`, data)

export const updateSubCourseStatus = (subCourseId: number, data: UpdateSubCourseStatusRequest) =>
  http.patch(`/course-management/sub-courses/${subCourseId}`, data)

export const deleteSubCourse = (subCourseId: number) =>
  http.delete(`/course-management/sub-courses/${subCourseId}`)

// SubCourse Video APIs
export const getVideosBySubCourse = (subCourseId: number) =>
  http.get<GetSubCourseVideosResponse>(`/course-management/sub-courses/${subCourseId}/videos`)

export const createSubCourseVideo = (data: CreateSubCourseVideoRequest) =>
  http.post("/course-management/sub-course-videos", data)

export const updateSubCourseVideo = (videoId: number, data: UpdateSubCourseVideoRequest) =>
  http.put(`/course-management/sub-course-videos/${videoId}`, data)

export const deleteSubCourseVideo = (videoId: number) =>
  http.delete(`/course-management/sub-course-videos/${videoId}`)

// Practice APIs - for SubCourse practices (New Hierarchy)
export const getPracticesBySubCourse = (subCourseId: number) =>
  http.get<GetPracticesResponse>(`/course-management/sub-courses/${subCourseId}/practices`)

export const createPractice = (data: CreatePracticeRequest) =>
  http.post("/course-management/practices", data)

export const updatePractice = (practiceId: number, data: UpdatePracticeRequest) =>
  http.put(`/course-management/practices/${practiceId}`, data)

export const updatePracticeStatus = (practiceId: number, data: UpdatePracticeStatusRequest) =>
  http.put(`/course-management/practices/${practiceId}`, data)

export const deletePractice = (practiceId: number) =>
  http.delete(`/course-management/practices/${practiceId}`)

// Practice Questions APIs
export const getPracticeQuestions = (practiceId: number) =>
  http.get<GetPracticeQuestionsResponse>(`/course-management/practices/${practiceId}/questions`)

export const createPracticeQuestion = (data: CreatePracticeQuestionRequest) =>
  http.post("/course-management/practice-questions", data)

export const updatePracticeQuestion = (questionId: number, data: UpdatePracticeQuestionRequest) =>
  http.put(`/course-management/practice-questions/${questionId}`, data)

export const deletePracticeQuestion = (questionId: number) =>
  http.delete(`/course-management/practice-questions/${questionId}`)

// ============================================
// Legacy APIs (deprecated - using SubCourse hierarchy now)
// Keeping for backward compatibility
// ============================================

export const getProgramsByCourse = (courseId: number) =>
  http.get<GetProgramsResponse>(`/course-management/courses/${courseId}/programs`)

export const updateProgramStatus = (programId: number, data: UpdateProgramStatusRequest) =>
  http.patch(`/course-management/programs/${programId}`, data)

export const deleteProgram = (programId: number) =>
  http.delete(`/course-management/programs/${programId}`)

export const createProgram = (data: CreateProgramRequest) =>
  http.post("/course-management/programs", data)

export const updateProgram = (programId: number, data: UpdateProgramRequest) =>
  http.patch(`/course-management/programs/${programId}`, data)

export const getLevelsByProgram = (programId: number) =>
  http.get<GetLevelsResponse>(`/course-management/programs/${programId}/levels`)

export const createLevel = (data: CreateLevelRequest) =>
  http.post("/course-management/levels", data)

export const updateLevel = (levelId: number, data: UpdateLevelRequest) =>
  http.put(`/course-management/levels/${levelId}`, data)

export const updateLevelStatus = (levelId: number, data: UpdateLevelStatusRequest) =>
  http.put(`/course-management/levels/${levelId}`, data)

export const deleteLevel = (levelId: number) =>
  http.delete(`/course-management/levels/${levelId}`)

export const getModulesByLevel = (levelId: number) =>
  http.get<GetModulesResponse>(`/course-management/levels/${levelId}/modules`)

export const createModule = (data: CreateModuleRequest) =>
  http.post("/course-management/modules", data)

export const updateModule = (moduleId: number, data: UpdateModuleRequest) =>
  http.put(`/course-management/modules/${moduleId}`, data)

export const updateModuleStatus = (moduleId: number, data: UpdateModuleStatusRequest) =>
  http.put(`/course-management/modules/${moduleId}`, data)

export const deleteModule = (moduleId: number) =>
  http.delete(`/course-management/modules/${moduleId}`)

export const getPracticesByLevel = (levelId: number) =>
  http.get<GetPracticesResponse>(`/course-management/levels/${levelId}/practices`)

export const getPracticesByModule = (moduleId: number) =>
  http.get<GetPracticesResponse>(`/course-management/modules/${moduleId}/practices`)

// Question Sets API
export const getQuestionSetsByOwner = (ownerType: string, ownerId: number) =>
  http.get<GetQuestionSetsResponse>("/question-sets/by-owner", {
    params: { owner_type: ownerType, owner_id: ownerId },
  })

export const createQuestionSet = (data: CreateQuestionSetRequest) =>
  http.post<CreateQuestionSetResponse>("/question-sets", data)

export const addQuestionToSet = (questionSetId: number, data: AddQuestionToSetRequest) =>
  http.post(`/question-sets/${questionSetId}/questions`, data)

export const createQuestion = (data: CreateQuestionRequest) =>
  http.post<CreateQuestionResponse>("/questions", data)

export const deleteQuestionSet = (questionSetId: number) =>
  http.delete(`/question-sets/${questionSetId}`)

export const createVimeoVideo = (data: CreateVimeoVideoRequest) =>
  http.post("/course-management/videos/vimeo", data)

// Sub-course Prerequisite APIs
export const getSubCoursePrerequisites = (subCourseId: number) =>
  http.get<GetSubCoursePrerequisitesResponse>(`/course-management/sub-courses/${subCourseId}/prerequisites`)

export const addSubCoursePrerequisite = (subCourseId: number, data: AddSubCoursePrerequisiteRequest) =>
  http.post(`/course-management/sub-courses/${subCourseId}/prerequisites`, data)

export const removeSubCoursePrerequisite = (subCourseId: number, prerequisiteId: number) =>
  http.delete(`/course-management/sub-courses/${subCourseId}/prerequisites/${prerequisiteId}`)

// Learning Path APIs
export const getLearningPath = (courseId: number) =>
  http.get<GetLearningPathResponse>(`/course-management/courses/${courseId}/learning-path`)

export const reorderSubCourses = (courseId: number, items: ReorderItem[]) =>
  http.put(`/course-management/courses/${courseId}/reorder-sub-courses`, { items })

// Ratings
export const getRatings = (params: GetRatingsParams) =>
  http.get<GetRatingsResponse>("/ratings", { params })

// Vimeo Sample Video
export const getVimeoSample = (videoId: string, width = 640, height = 360) =>
  http.get<GetVimeoSampleResponse>("/vimeo/sample", {
    params: { video_id: videoId, width, height },
  })
