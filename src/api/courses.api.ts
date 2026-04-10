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
  GetQuestionSetsParams,
  GetQuestionSetDetailResponse,
  GetQuestionSetQuestionsResponse,
  GetPracticeQuestionsByPracticeResponse,
  CreateQuestionSetRequest,
  CreateQuestionSetResponse,
  AddQuestionToSetRequest,
  CreateQuestionRequest,
  CreateQuestionResponse,
  GetQuestionDetailResponse,
  GetQuestionsParams,
  GetQuestionsResponse,
  CreateVimeoVideoRequest,
  CreateCourseCategoryRequest,
  GetSubCoursePrerequisitesResponse,
  AddSubCoursePrerequisiteRequest,
  GetLearningPathResponse,
  GetHumanLanguageLessonsResponse,
  GetHumanLanguageHierarchyResponse,
  CreateHumanLanguageLessonRequest,
  GetSubCourseEntryAssessmentResponse,
  ReorderItem,
  GetRatingsResponse,
  GetRatingsParams,
  GetVimeoSampleResponse,
  CreateCourseVideoRequest,
} from "../types/course.types"

type UnifiedHierarchyRow = {
  category_id: number
  category_name: string
  sub_category_id?: number | null
  sub_category_name?: string | null
  course_id?: number | null
  course_title?: string | null
}

type CourseHierarchyRow = {
  course_id: number
  course_title: string
  level_id?: number | null
  cefr_level?: string | null
  module_id?: number | null
  module_title?: string | null
  sub_module_id?: number | null
  sub_module_title?: string | null
}

export const getCourseCategories = () =>
  http.get("/course-management/hierarchy").then((res) => {
    const rows: UnifiedHierarchyRow[] = res.data?.data ?? []
    const categoriesMap = new Map<number, { id: number; name: string; is_active: boolean; created_at: string }>()
    rows.forEach((r) => {
      if (!categoriesMap.has(r.category_id)) {
        categoriesMap.set(r.category_id, {
          id: r.category_id,
          name: r.category_name,
          is_active: true,
          created_at: new Date().toISOString(),
        })
      }
    })
    const categories = Array.from(categoriesMap.values())
    return {
      ...res,
      data: {
        ...res.data,
        data: {
          categories,
          total_count: categories.length,
        },
      },
    } as unknown as { data: GetCourseCategoriesResponse }
  })

export const createCourseCategory = (data: CreateCourseCategoryRequest) =>
  http.post("/course-management/sub-categories", { category_id: data.parent_id ?? 1, name: data.name })

export const getCoursesByCategory = (categoryId: number) =>
  http.get("/course-management/hierarchy").then((res) => {
    const rows: UnifiedHierarchyRow[] = res.data?.data ?? []
    const courses = rows
      .filter((r) => r.category_id === categoryId && r.course_id)
      .map((r) => ({
        id: Number(r.course_id),
        category_id: r.category_id,
        sub_category_id: r.sub_category_id ?? null,
        title: r.course_title ?? "",
        description: "",
        thumbnail: "",
        is_active: true,
      }))
    return {
      ...res,
      data: { ...res.data, data: { courses, total_count: courses.length } },
    } as unknown as { data: GetCoursesResponse }
  })

export const createCourse = (data: CreateCourseRequest) =>
  http.post("/course-management/courses", data)

export const updateCourseThumbnail = (courseId: number, thumbnailUrl: string) =>
  http.post(`/course-management/courses/${courseId}/thumbnail`, {
    thumbnail_url: thumbnailUrl,
  })

export const deleteCourse = (courseId: number) =>
  http.delete(`/course-management/courses/${courseId}`)

export const updateCourseStatus = (courseId: number, isActive: boolean) =>
  http.put(`/course-management/courses/${courseId}`, { is_active: isActive })

export const updateCourse = (courseId: number, data: UpdateCourseRequest) =>
  http.put(`/course-management/courses/${courseId}`, data)

// SubCourse APIs (New Hierarchy)
export const getSubCoursesByCourse = (courseId: number) =>
  http.get(`/course-management/courses/${courseId}/hierarchy`).then((res) => {
    const rows: CourseHierarchyRow[] = res.data?.data ?? []
    const subModuleMap = new Map<number, { id: number; course_id: number; module_id?: number; title: string; description: string; level: string; cefr_level?: string; thumbnail: string; display_order: number; sub_level?: string; is_active: boolean }>()
    rows.forEach((r, idx) => {
      if (!r.sub_module_id) return
      if (!subModuleMap.has(r.sub_module_id)) {
        subModuleMap.set(r.sub_module_id, {
          id: r.sub_module_id,
          course_id: courseId,
          module_id: r.module_id ?? undefined,
          title: r.sub_module_title ?? "",
          description: "",
          level: r.cefr_level ?? "",
          cefr_level: r.cefr_level ?? undefined,
          thumbnail: "",
          display_order: idx + 1,
          sub_level: r.cefr_level ?? undefined,
          is_active: true,
        })
      }
    })
    const sub_courses = Array.from(subModuleMap.values())
    return {
      ...res,
      data: {
        ...res.data,
        data: { sub_courses, total_count: sub_courses.length },
      },
    } as unknown as { data: GetSubCoursesResponse }
  })

export const createSubCourse = (data: CreateSubCourseRequest) =>
  http
    .post("/course-management/levels", {
      course_id: data.course_id,
      cefr_level: data.sub_level || data.level,
      display_order: data.display_order ?? 0,
      is_active: true,
    })
    .then((levelRes) =>
      http.post("/course-management/modules", {
        level_id: levelRes.data?.data?.id,
        title: `${data.sub_level || data.level} Module`,
        description: `${data.title} container module`,
        display_order: 1,
        is_active: true,
      }),
    )
    .then((moduleRes) =>
      http.post("/course-management/sub-modules", {
        module_id: moduleRes.data?.data?.id,
        title: data.title,
        description: data.description,
        display_order: data.display_order ?? 0,
        is_active: true,
      }),
    )

export const updateSubCourseThumbnail = (subCourseId: number, thumbnailUrl: string) =>
  http.post(`/course-management/sub-courses/${subCourseId}/thumbnail`, {
    thumbnail_url: thumbnailUrl,
  })

export const updateSubCourse = (subCourseId: number, data: UpdateSubCourseRequest) =>
  http.put(`/course-management/sub-modules/${subCourseId}`, data)

export const updateSubCourseStatus = (subCourseId: number, data: UpdateSubCourseStatusRequest) =>
  http.put(`/course-management/sub-modules/${subCourseId}`, data)

export const deleteSubCourse = (subCourseId: number) =>
  http.delete(`/course-management/sub-modules/${subCourseId}`)

// SubCourse Video APIs
export const getVideosBySubCourse = (subCourseId: number) =>
  http.get<GetSubCourseVideosResponse>(`/course-management/sub-modules/${subCourseId}/videos`)

export const createSubCourseVideo = (data: CreateSubCourseVideoRequest) =>
  http.post("/course-management/sub-module-videos", {
    sub_module_id: data.sub_module_id ?? data.sub_course_id,
    title: data.title,
    description: data.description,
    video_url: data.video_url,
  })

export const createCourseVideo = (data: CreateCourseVideoRequest) =>
  http.post("/course-management/sub-module-videos", {
    sub_module_id: data.sub_module_id ?? data.sub_course_id,
    title: data.title,
    description: data.description,
    video_url: data.video_url,
    duration: data.duration,
    resolution: data.resolution,
    visibility: data.visibility,
    display_order: data.display_order,
    status: data.status,
  })

export const updateSubCourseVideo = (videoId: number, data: UpdateSubCourseVideoRequest) =>
  http.put(`/course-management/sub-module-videos/${videoId}`, data)

export const deleteSubCourseVideo = (videoId: number) =>
  http.delete(`/course-management/sub-module-videos/${videoId}`)

// Practice APIs - for SubCourse practices (New Hierarchy)
// Practices are question sets: POST /question-sets with set_type: "PRACTICE", owner_type: "SUB_COURSE".
export const getPracticesBySubCourse = (subCourseId: number) =>
  http.get<GetQuestionSetsResponse>("/question-sets/by-owner", {
    params: { owner_type: "SUB_MODULE", owner_id: subCourseId },
  })

export const createPractice = (data: CreatePracticeRequest) =>
  http
    .post<CreateQuestionSetResponse>("/question-sets", {
      title: data.title,
      set_type: "PRACTICE",
      owner_type: "SUB_MODULE",
      owner_id: data.sub_module_id ?? data.sub_course_id,
      ...(data.description?.trim() ? { description: data.description.trim() } : {}),
      ...(data.persona ? { persona: data.persona } : {}),
      ...(data.intro_video_url?.trim() ? { intro_video_url: data.intro_video_url.trim() } : {}),
    })
    .then((res) => {
      const questionSetID = res.data?.data?.id
      const subModuleID = data.sub_module_id ?? data.sub_course_id
      if (!questionSetID || !subModuleID) return res
      return http
        .post("/course-management/sub-module-practices", {
          sub_module_id: subModuleID,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          intro_video_url: data.intro_video_url,
          question_set_id: questionSetID,
        })
        .then(() => res)
    })

export const updatePractice = (practiceId: number, data: UpdatePracticeRequest) =>
  http.put(`/course-management/practices/${practiceId}`, data)

export const updatePracticeStatus = (practiceId: number, data: UpdatePracticeStatusRequest) =>
  http.put(`/course-management/practices/${practiceId}`, data)

export const deletePractice = (practiceId: number) =>
  http.delete(`/course-management/practices/${practiceId}`)

// Practice Questions APIs
export const getPracticeQuestions = (practiceId: number) =>
  http.get<GetQuestionSetQuestionsResponse>(`/question-sets/${practiceId}/questions`)

export const getPracticeQuestionsByPractice = (
  practiceId: number,
  params?: { limit?: number; offset?: number; question_type?: string },
) =>
  http.get<GetPracticeQuestionsByPracticeResponse>(`/practices/${practiceId}/questions`, {
    params,
  })

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
export const getQuestionSets = (params?: GetQuestionSetsParams) =>
  http.get<GetQuestionSetsResponse>("/question-sets", { params })

export const getQuestionSetsByOwner = (ownerType: string, ownerId: number) =>
  http.get<GetQuestionSetsResponse>("/question-sets/by-owner", {
    params: {
      owner_type: ownerType === "SUB_COURSE" ? "SUB_MODULE" : ownerType,
      owner_id: ownerId,
    },
  })

export const getQuestionSetById = (questionSetId: number) =>
  http.get<GetQuestionSetDetailResponse>(`/question-sets/${questionSetId}`)

export const getQuestionSetQuestions = (questionSetId: number) =>
  http.get<GetQuestionSetQuestionsResponse>(`/question-sets/${questionSetId}/questions`)

export const createQuestionSet = (data: CreateQuestionSetRequest) =>
  http.post<CreateQuestionSetResponse>("/question-sets", data)

export const updateQuestionSet = (questionSetId: number, data: Partial<CreateQuestionSetRequest>) =>
  http.put(`/question-sets/${questionSetId}`, data)

export const addQuestionToSet = (questionSetId: number, data: AddQuestionToSetRequest) =>
  http.post(`/question-sets/${questionSetId}/questions`, data)

export const createQuestion = (data: CreateQuestionRequest) =>
  http.post<CreateQuestionResponse>("/questions", data)

export const getQuestions = (params: GetQuestionsParams) =>
  http.get<GetQuestionsResponse>("/questions", { params })

export const getQuestionById = (questionId: number) =>
  http.get<GetQuestionDetailResponse>(`/questions/${questionId}`)

export const deleteQuestion = (questionId: number) =>
  http.delete(`/questions/${questionId}`)

export const updateQuestion = (questionId: number, data: CreateQuestionRequest) =>
  http.put(`/questions/${questionId}`, data)

export interface SubmitAudioAnswerRequest {
  question_id: number
  question_set_id: number
  object_key: string
}

export const submitAudioAnswer = (data: SubmitAudioAnswerRequest) =>
  http.post("/questions/audio-answer", data)

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

export const getHumanLanguageLessonsByCourse = (courseId: number, cefr_level: string) =>
  http.get<GetHumanLanguageLessonsResponse>(`/course-management/human-language/courses/${courseId}/lessons`, {
    params: { cefr_level },
  })

export const getHumanLanguageHierarchy = () =>
  http.get<GetHumanLanguageHierarchyResponse>("/course-management/hierarchy")

export const createHumanLanguageLesson = (data: CreateHumanLanguageLessonRequest) =>
  http
    .post("/course-management/levels", {
      course_id: data.course_id,
      cefr_level: data.cefr_level,
      display_order: data.display_order ?? 0,
      is_active: true,
    })
    .then((levelRes) =>
      http.post("/course-management/modules", {
        level_id: levelRes.data?.data?.id,
        title: `${data.cefr_level} Module`,
        description: "Generated module for CEFR level",
        display_order: 1,
        is_active: true,
      }),
    )
    .then((moduleRes) =>
      http.post("/course-management/sub-modules", {
        module_id: moduleRes.data?.data?.id,
        title: data.title,
        description: data.description ?? "",
        display_order: data.display_order ?? 0,
        is_active: true,
      }),
    )

export const getSubCourseEntryAssessment = (subCourseId: number) =>
  http.get<GetSubCourseEntryAssessmentResponse>(
    `/question-sets/sub-courses/${subCourseId}/entry-assessment`,
  )

const buildReorderPayload = (items: ReorderItem[]) => {
  const normalized = items.map((item, idx) => ({
    id: Number(item.id),
    position: Number(item.position ?? idx),
  }))

  const hasInvalid = normalized.some(
    (item) =>
      Number.isNaN(item.id) ||
      Number.isNaN(item.position) ||
      !Number.isFinite(item.id) ||
      !Number.isFinite(item.position),
  )

  if (hasInvalid) {
    throw new Error("Invalid reorder payload: ids/positions must be numeric.")
  }

  return { items: normalized }
}

export const reorderCategories = (items: ReorderItem[]) =>
  http.put("/course-management/categories/reorder", buildReorderPayload(items))

export const reorderCourses = (items: ReorderItem[]) =>
  http.put("/course-management/courses/reorder", buildReorderPayload(items))

export const reorderSubCourses = (items: ReorderItem[]) =>
  http.put("/course-management/sub-courses/reorder", buildReorderPayload(items))

export const reorderVideos = (items: ReorderItem[]) =>
  http.put("/course-management/videos/reorder", buildReorderPayload(items))

export const reorderPractices = (items: ReorderItem[]) =>
  http.put("/course-management/practices/reorder", buildReorderPayload(items))

// Ratings
export const getRatings = (params: GetRatingsParams) =>
  http.get<GetRatingsResponse>("/ratings", { params })

// Vimeo Sample Video
export const getVimeoSample = (videoId: string, width = 640, height = 360) =>
  http.get<GetVimeoSampleResponse>("/vimeo/sample", {
    params: { video_id: videoId, width, height },
  })
