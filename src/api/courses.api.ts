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
  GetCategorySubCategoriesResponse,
  GetSubCategoryCoursesResponse,
  GetSubCoursePrerequisitesResponse,
  AddSubCoursePrerequisiteRequest,
  GetLearningPathResponse,
  GetHumanLanguageLessonsResponse,
  GetHumanLanguageHierarchyResponse,
  GetCourseHierarchyResponse,
  CreateHumanLanguageLessonRequest,
  GetSubModuleLessonsResponse,
  GetSubModuleLessonDetailResponse,
  UpdateSubModuleLessonRequest,
  UpdateSubModuleLessonResponse,
  GetCourseLevelsForCourseResponse,
  GetSubModulesByModuleResponse,
  SubCourse,
  GetSubCourseEntryAssessmentResponse,
  ReorderItem,
  GetRatingsResponse,
  GetRatingsParams,
  GetVimeoSampleResponse,
  CreateCourseVideoRequest,
  GetLearningProgramsResponse,
  UpdateLearningProgramRequest,
  CreateLearningProgramRequest,
  CreateLearningProgramResponse,
  GetProgramCoursesResponse,
  GetTopLevelCourseModulesResponse,
  UpdateTopLevelCourseRequest,
  UpdateTopLevelCourseModuleRequest,
  CreateTopLevelCourseModuleRequest,
  CreateTopLevelCourseModuleResponse,
  CreateProgramCourseRequest,
  CreateProgramCourseResponse,
  CreateExamPrepCatalogCourseRequest,
  CreateExamPrepCatalogCourseResponse,
  GetExamPrepCatalogCoursesResponse,
  UpdateExamPrepCatalogCourseRequest,
  UpdateExamPrepCatalogCourseResponse,
  CreateExamPrepCatalogUnitRequest,
  CreateExamPrepCatalogUnitResponse,
  UpdateExamPrepCatalogUnitRequest,
  UpdateExamPrepCatalogUnitResponse,
  GetExamPrepCatalogUnitsResponse,
  CreateExamPrepUnitModuleRequest,
  CreateExamPrepUnitModuleResponse,
  UpdateExamPrepUnitModuleRequest,
  UpdateExamPrepUnitModuleResponse,
  GetExamPrepUnitModulesResponse,
  CreateExamPrepModuleLessonRequest,
  CreateExamPrepModuleLessonResponse,
  UpdateExamPrepModuleLessonRequest,
  UpdateExamPrepModuleLessonResponse,
  GetExamPrepModuleLessonsResponse,
  GetTopLevelModuleLessonsResponse,
  GetPracticesByParentContextResponse,
  CreateParentLinkedPracticeRequest,
  CreateParentLinkedPracticeResponse,
  UpdateParentLinkedPracticeRequest,
  UpdateParentLinkedPracticeResponse,
  PublishParentLinkedPracticeRequest,
  UpdateTopLevelModuleLessonRequest,
  CreateTopLevelModuleLessonRequest,
  CreateTopLevelModuleLessonResponse,
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
  data.parent_id
    ? http.post("/course-management/sub-categories", { category_id: data.parent_id, name: data.name })
    : http.post("/course-management/categories", { name: data.name })

export const deleteCourseCategory = (categoryId: number) =>
  http.delete(`/course-management/categories/${categoryId}`)

export const getSubCategoriesByCategoryId = (categoryId: number) =>
  http.get<GetCategorySubCategoriesResponse>(`/course-management/categories/${categoryId}/sub-categories`)

export const getCoursesBySubCategoryId = (subCategoryId: number) =>
  http.get<GetSubCategoryCoursesResponse>(`/course-management/sub-categories/${subCategoryId}/courses`)

export const createSubCategory = (payload: {
  category_id: number
  name: string
  description?: string | null
  display_order?: number
}) => http.post("/course-management/sub-categories", payload)

export const deleteCourseSubCategory = (subCategoryId: number) =>
  http.delete(`/course-management/sub-categories/${subCategoryId}`)

export const updateSubCategory = (
  subCategoryId: number,
  payload: Partial<{
    name: string
    description: string | null
    is_active: boolean
    display_order: number
  }>,
) => http.patch(`/course-management/sub-categories/${subCategoryId}`, payload)

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

// Sub-Module APIs (Unified Hierarchy)
export const getCourseHierarchyByCourseId = (courseId: number) =>
  http.get<GetCourseHierarchyResponse>(`/course-management/courses/${courseId}/hierarchy`)

export const getSubModulesByCourse = (courseId: number) =>
  http.get(`/course-management/courses/${courseId}/hierarchy`).then((res) => {
    const raw = res.data?.data
    const rows: CourseHierarchyRow[] = Array.isArray(raw) ? raw : []
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

export const createSubModule = (data: CreateSubCourseRequest) =>
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

export const updateSubModuleThumbnail = (subModuleId: number, thumbnailUrl: string) =>
  http.post(`/course-management/sub-courses/${subModuleId}/thumbnail`, {
    thumbnail_url: thumbnailUrl,
  })

export const updateSubModule = (subModuleId: number, data: UpdateSubCourseRequest) =>
  http.put(`/course-management/sub-modules/${subModuleId}`, data)

export const updateSubModuleStatus = (subModuleId: number, data: UpdateSubCourseStatusRequest) =>
  http.put(`/course-management/sub-modules/${subModuleId}`, data)

export const deleteSubModule = (subModuleId: number) =>
  http.delete(`/course-management/sub-modules/${subModuleId}`)

// Sub-Module Video APIs
export const getVideosBySubModule = (subModuleId: number) =>
  http.get<GetSubCourseVideosResponse>(`/course-management/sub-modules/${subModuleId}/videos`)

export const getLessonsBySubModule = (subModuleId: number, options?: { includeInactive?: boolean }) =>
  http.get<GetSubModuleLessonsResponse>(`/course-management/sub-modules/${subModuleId}/lessons`, {
    params: { include_inactive: options?.includeInactive ?? true },
  })

export const getSubModuleLessonById = (
  lessonId: number,
  options?: { cacheBust?: boolean },
) =>
  http.get<GetSubModuleLessonDetailResponse>(`/course-management/sub-module-lessons/${lessonId}`, {
    params: options?.cacheBust ? { _t: Date.now() } : undefined,
  })

export const updateSubModuleLesson = (lessonId: number, data: UpdateSubModuleLessonRequest) =>
  http.put<UpdateSubModuleLessonResponse>(`/course-management/sub-module-lessons/${lessonId}`, data)

export const softDeleteSubModuleLesson = (lessonId: number) =>
  http.put<UpdateSubModuleLessonResponse>(`/course-management/sub-module-lessons/${lessonId}`, {
    is_active: false,
  })

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

// Practice APIs - for Sub-Module practices (Unified Hierarchy)
export const getPracticesBySubModule = (subModuleId: number) =>
  http.get<GetQuestionSetsResponse>("/question-sets/by-owner", {
    params: { owner_type: "SUB_MODULE", owner_id: subModuleId },
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
  http
    .post<CreateQuestionResponse>("/questions", {
      question_text: data.question,
      question_type: data.type === "SHORT" ? "SHORT_ANSWER" : data.type,
      points: data.points ?? 1,
      difficulty_level: data.difficulty_level,
      tips: data.tips,
      explanation: data.explanation,
      voice_prompt: data.question_voice_prompt,
      sample_answer_voice_prompt: data.sample_answer_voice_prompt,
      audio_correct_answer_text: data.sample_answer,
      options: data.options,
      short_answers: data.short_answers,
    })
    .then((res) =>
      http.post(`/question-sets/${data.practice_id}/questions`, {
        question_id: res.data?.data?.id,
      }),
    )

export const updatePracticeQuestion = (questionId: number, data: UpdatePracticeQuestionRequest) =>
  http.put(`/questions/${questionId}`, {
    question_text: data.question,
    question_type: data.type === "SHORT" ? "SHORT_ANSWER" : data.type,
    points: data.points ?? 1,
    difficulty_level: data.difficulty_level,
    tips: data.tips,
    explanation: data.explanation,
    voice_prompt: data.question_voice_prompt,
    sample_answer_voice_prompt: data.sample_answer_voice_prompt,
    audio_correct_answer_text: data.sample_answer,
    options: data.options,
    short_answers: data.short_answers,
  })

export const deletePracticeQuestion = (questionId: number) =>
  http.delete(`/questions/${questionId}`)

/** Top-level learning programs (Learn English cards, etc.) — GET /programs */
export const getLearningPrograms = (params?: { limit?: number; offset?: number }) =>
  http.get<GetLearningProgramsResponse>("/programs", { params })

export const createLearningProgram = (data: CreateLearningProgramRequest) =>
  http.post<CreateLearningProgramResponse>("/programs", data)

export const getProgramCourses = (
  programId: number,
  params?: { limit?: number; offset?: number },
) => http.get<GetProgramCoursesResponse>(`/programs/${programId}/courses`, { params })

export const createProgramCourse = (
  programId: number,
  data: CreateProgramCourseRequest,
) => http.post<CreateProgramCourseResponse>(`/programs/${programId}/courses`, data)

/** English proficiency catalog course — POST /exam-prep/catalog-courses */
export const createExamPrepCatalogCourse = (
  data: CreateExamPrepCatalogCourseRequest,
) => http.post<CreateExamPrepCatalogCourseResponse>("/exam-prep/catalog-courses", data)

/** English proficiency catalog courses — GET /exam-prep/catalog-courses */
export const getExamPrepCatalogCourses = (params?: { limit?: number; offset?: number }) =>
  http.get<GetExamPrepCatalogCoursesResponse>("/exam-prep/catalog-courses", { params })

/** English proficiency catalog course — PUT /exam-prep/catalog-courses/:catalogCourseId */
export const updateExamPrepCatalogCourse = (
  catalogCourseId: number,
  data: UpdateExamPrepCatalogCourseRequest,
) =>
  http.put<UpdateExamPrepCatalogCourseResponse>(
    `/exam-prep/catalog-courses/${catalogCourseId}`,
    data,
  )

/** English proficiency catalog course — DELETE /exam-prep/catalog-courses/:catalogCourseId */
export const deleteExamPrepCatalogCourse = (catalogCourseId: number) =>
  http.delete(`/exam-prep/catalog-courses/${catalogCourseId}`)

/** English proficiency catalog unit — POST /exam-prep/catalog-courses/:catalogCourseId/units */
export const createExamPrepCatalogUnit = (
  catalogCourseId: number,
  data: CreateExamPrepCatalogUnitRequest,
) =>
  http.post<CreateExamPrepCatalogUnitResponse>(
    `/exam-prep/catalog-courses/${catalogCourseId}/units`,
    data,
  )

/** English proficiency catalog units — GET /exam-prep/catalog-courses/:catalogCourseId/units */
export const getExamPrepCatalogUnits = (
  catalogCourseId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetExamPrepCatalogUnitsResponse>(
    `/exam-prep/catalog-courses/${catalogCourseId}/units`,
    { params },
  )

/** English proficiency unit — PUT /exam-prep/units/:unitId */
export const updateExamPrepCatalogUnit = (
  unitId: number,
  data: UpdateExamPrepCatalogUnitRequest,
) => http.put<UpdateExamPrepCatalogUnitResponse>(`/exam-prep/units/${unitId}`, data)

/** English proficiency unit — DELETE /exam-prep/units/:unitId */
export const deleteExamPrepCatalogUnit = (unitId: number) =>
  http.delete(`/exam-prep/units/${unitId}`)

/** English proficiency unit modules — POST /exam-prep/units/:unitId/modules */
export const createExamPrepUnitModule = (
  unitId: number,
  data: CreateExamPrepUnitModuleRequest,
) =>
  http.post<CreateExamPrepUnitModuleResponse>(
    `/exam-prep/units/${unitId}/modules`,
    data,
  )

/** English proficiency unit modules — GET /exam-prep/units/:unitId/modules */
export const getExamPrepUnitModules = (
  unitId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetExamPrepUnitModulesResponse>(`/exam-prep/units/${unitId}/modules`, {
    params,
  })

/** English proficiency module — PUT /exam-prep/modules/:moduleId */
export const updateExamPrepUnitModule = (
  moduleId: number,
  data: UpdateExamPrepUnitModuleRequest,
) =>
  http.put<UpdateExamPrepUnitModuleResponse>(
    `/exam-prep/modules/${moduleId}`,
    data,
  )

/** English proficiency module — DELETE /exam-prep/modules/:moduleId */
export const deleteExamPrepUnitModule = (moduleId: number) =>
  http.delete(`/exam-prep/modules/${moduleId}`)

/** English proficiency module lessons — GET /exam-prep/modules/:moduleId/lessons */
export const getExamPrepModuleLessons = (
  moduleId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetExamPrepModuleLessonsResponse>(
    `/exam-prep/modules/${moduleId}/lessons`,
    {
      params,
    },
  )

/** English proficiency module lesson — POST /exam-prep/modules/:moduleId/lessons */
export const createExamPrepModuleLesson = (
  moduleId: number,
  data: CreateExamPrepModuleLessonRequest,
) =>
  http.post<CreateExamPrepModuleLessonResponse>(
    `/exam-prep/modules/${moduleId}/lessons`,
    data,
  )

/** English proficiency lesson — PUT /exam-prep/lessons/:lessonId */
export const updateExamPrepModuleLesson = (
  lessonId: number,
  data: UpdateExamPrepModuleLessonRequest,
) =>
  http.put<UpdateExamPrepModuleLessonResponse>(
    `/exam-prep/lessons/${lessonId}`,
    data,
  )

/** English proficiency lesson — DELETE /exam-prep/lessons/:lessonId */
export const deleteExamPrepModuleLesson = (lessonId: number) =>
  http.delete(`/exam-prep/lessons/${lessonId}`)

/** Top-level course resource (Learn English track) — PUT /courses/:id */
export const updateTopLevelCourse = (courseId: number, data: UpdateTopLevelCourseRequest) =>
  http.put(`/courses/${courseId}`, data)

export const deleteTopLevelCourse = (courseId: number) =>
  http.delete(`/courses/${courseId}`)

export const getTopLevelCourseModules = (
  courseId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetTopLevelCourseModulesResponse>(`/courses/${courseId}/modules`, {
    params,
  })

/** Learn English top-level module — POST /courses/:courseId/modules */
export const createTopLevelCourseModule = (
  courseId: number,
  data: CreateTopLevelCourseModuleRequest,
) =>
  http.post<CreateTopLevelCourseModuleResponse>(
    `/courses/${courseId}/modules`,
    data,
  )

/** Learn English top-level module — PUT /modules/:id */
export const updateTopLevelCourseModule = (
  moduleId: number,
  data: UpdateTopLevelCourseModuleRequest,
) => http.put(`/modules/${moduleId}`, data)

/** Learn English top-level module — DELETE /modules/:id */
export const deleteTopLevelCourseModule = (moduleId: number) =>
  http.delete(`/modules/${moduleId}`)

/** Learn English top-level module lessons — GET /modules/:moduleId/lessons */
export const getModuleLessons = (
  moduleId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetTopLevelModuleLessonsResponse>(`/modules/${moduleId}/lessons`, {
    params,
  })

/** Learn English top-level module lesson — POST /modules/:moduleId/lessons */
export const createModuleLesson = (
  moduleId: number,
  data: CreateTopLevelModuleLessonRequest,
) =>
  http.post<CreateTopLevelModuleLessonResponse>(`/modules/${moduleId}/lessons`, data)

/** Learn English top-level module lesson — PUT /lessons/:id */
export const updateTopLevelModuleLesson = (
  lessonId: number,
  data: UpdateTopLevelModuleLessonRequest,
) => http.put(`/lessons/${lessonId}`, data)

/** Learn English top-level module lesson — DELETE /lessons/:id */
export const deleteTopLevelModuleLesson = (lessonId: number) =>
  http.delete(`/lessons/${lessonId}`)

/** GET /courses/:courseId/practices — practices linked to a top-level course (at most one in normal use). */
export const getPracticesByParentCourse = (
  courseId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetPracticesByParentContextResponse>(`/courses/${courseId}/practices`, { params })

/** GET /modules/:moduleId/practices */
export const getPracticesByParentModule = (
  moduleId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetPracticesByParentContextResponse>(`/modules/${moduleId}/practices`, { params })

/** GET /lessons/:lessonId/practices */
export const getPracticesByParentLesson = (
  lessonId: number,
  params?: { limit?: number; offset?: number },
) =>
  http.get<GetPracticesByParentContextResponse>(`/lessons/${lessonId}/practices`, { params })

/** POST /practices — create a practice (story + question set) for course / module / lesson. */
export const createParentLinkedPractice = (data: CreateParentLinkedPracticeRequest) =>
  http.post<CreateParentLinkedPracticeResponse>("/practices", data)

/** PUT /practices/:id */
export const updateParentLinkedPractice = (
  practiceId: number,
  data: UpdateParentLinkedPracticeRequest,
) => http.put<UpdateParentLinkedPracticeResponse>(`/practices/${practiceId}`, data)

/** PUT /practices/:id — set publish_status (e.g. publish a draft). */
export const publishParentLinkedPractice = (practiceId: number) =>
  http.put<UpdateParentLinkedPracticeResponse>(`/practices/${practiceId}`, {
    publish_status: "PUBLISHED",
  } satisfies PublishParentLinkedPracticeRequest)

/** DELETE /practices/:id */
export const deleteParentLinkedPractice = (practiceId: number) =>
  http.delete<{ message: string; success: boolean; status_code: number; metadata: unknown }>(
    `/practices/${practiceId}`,
  )

export const updateLearningProgram = (programId: number, data: UpdateLearningProgramRequest) =>
  http.put(`/programs/${programId}`, data)

export const deleteLearningProgram = (programId: number) => http.delete(`/programs/${programId}`)

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

export const getCourseLevelsForCourse = (courseId: number) =>
  http.get<GetCourseLevelsForCourseResponse>(`/course-management/courses/${courseId}/levels`)

export const getSubModulesByModuleId = (moduleId: number) =>
  http.get<GetSubModulesByModuleResponse>(`/course-management/modules/${moduleId}/sub-modules`)

/**
 * Finds a sub-module under a course by walking levels → modules → sub-modules APIs.
 */
export async function resolveSubModuleForCourse(
  courseId: number,
  subModuleId: number,
): Promise<SubCourse | null> {
  try {
    const levelsRes = await getCourseLevelsForCourse(courseId)
    const levels = Array.isArray(levelsRes.data?.data?.levels) ? levelsRes.data.data.levels : []
    const sortedLevels = [...levels].sort((a, b) => {
      const o = (a.display_order ?? 0) - (b.display_order ?? 0)
      if (o !== 0) return o
      return String(a.cefr_level ?? "").localeCompare(String(b.cefr_level ?? ""))
    })

    const modulesNested = await Promise.all(
      sortedLevels.map(async (level) => {
        const modsRes = await getModulesByLevel(level.id)
        const rawMods = modsRes.data?.data?.modules
        const modules = Array.isArray(rawMods) ? rawMods : []
        const sortedMods = [...modules].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        return sortedMods.map((module) => ({ level, module }))
      }),
    )
    const modulePairs = modulesNested.flat()

    const bundles = await Promise.all(
      modulePairs.map(async ({ level, module }) => {
        const subsRes = await getSubModulesByModuleId(module.id)
        const rawSubs = subsRes.data?.data?.sub_modules
        const subs = Array.isArray(rawSubs) ? rawSubs : []
        const sortedSubs = [...subs].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        return { level, module, subs: sortedSubs }
      }),
    )

    for (const { level, module, subs } of bundles) {
      const found = subs.find((s) => s.id === subModuleId)
      if (found) {
        return {
          id: found.id,
          course_id: courseId,
          level_id: level.id,
          module_id: module.id,
          title: found.title,
          description: found.description ?? "",
          level: level.cefr_level,
          cefr_level: level.cefr_level,
          thumbnail: found.thumbnail ?? "",
          display_order: found.display_order,
          sub_level: level.cefr_level,
          is_active: found.is_active,
        }
      }
    }
  } catch (e) {
    console.error("resolveSubModuleForCourse failed:", e)
  }
  return null
}

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
  http.post("/vimeo/uploads/pull", {
    name: data.title,
    description: data.description,
    source_url: data.source_url,
    file_size: data.file_size,
  })

// Sub-module Prerequisite APIs
export const getSubModulePrerequisites = (subModuleId: number) =>
  Promise.resolve({
    data: {
      message: "Sub-module prerequisites are not supported by this backend yet",
      data: { prerequisites: [], total_count: 0 },
      success: true,
      status_code: 200,
      metadata: { sub_module_id: subModuleId },
    },
  })

export const addSubModulePrerequisite = (subModuleId: number, data: AddSubCoursePrerequisiteRequest) =>
  Promise.resolve({
    data: {
      message: "Sub-module prerequisites are not supported by this backend yet",
      data: { sub_module_id: subModuleId, prerequisite_sub_module_id: data.prerequisite_sub_course_id },
      success: true,
      status_code: 200,
      metadata: null,
    },
  })

export const removeSubModulePrerequisite = (subModuleId: number, prerequisiteId: number) =>
  Promise.resolve({
    data: {
      message: "Sub-module prerequisites are not supported by this backend yet",
      data: { sub_module_id: subModuleId, prerequisite_id: prerequisiteId },
      success: true,
      status_code: 200,
      metadata: null,
    },
  })

// Learning Path APIs
export const getLearningPath = (courseId: number) =>
  http.get<GetLearningPathResponse>(`/course-management/courses/${courseId}/learning-path`)

export const getHumanLanguageLessonsByCourse = (courseId: number, cefr_level: string) =>
  http.get<GetHumanLanguageLessonsResponse>(`/course-management/human-language/courses/${courseId}/lessons`, {
    params: { cefr_level },
  })

export const getHumanLanguageHierarchy = () =>
  http.get<GetHumanLanguageHierarchyResponse>("/course-management/hierarchy").then(async (res) => {
    const payload = res.data?.data as unknown
    if (payload && typeof payload === "object" && !Array.isArray(payload) && "sub_categories" in payload) {
      return res
    }

    const rows: UnifiedHierarchyRow[] = Array.isArray(payload) ? payload : []
    const categoryMap = new Map<
      number,
      {
        category_id: number
        category_name: string
        sub_categories: Map<
          number,
          {
            sub_category_id: number
            sub_category_name: string
            courses: Map<
              number,
              {
                course_id: number
                course_name: string
              }
            >
          }
        >
      }
    >()

    rows.forEach((row) => {
      const categoryId = Number(row.category_id)
      if (!Number.isFinite(categoryId)) return

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          category_name: row.category_name ?? "",
          sub_categories: new Map(),
        })
      }

      if (!row.sub_category_id) return
      const subCategoryId = Number(row.sub_category_id)
      if (!Number.isFinite(subCategoryId)) return

      const categoryNode = categoryMap.get(categoryId)!
      if (!categoryNode.sub_categories.has(subCategoryId)) {
        categoryNode.sub_categories.set(subCategoryId, {
          sub_category_id: subCategoryId,
          sub_category_name: row.sub_category_name ?? "",
          courses: new Map(),
        })
      }

      if (!row.course_id) return
      const courseId = Number(row.course_id)
      if (!Number.isFinite(courseId)) return

      const subCategoryNode = categoryNode.sub_categories.get(subCategoryId)!
      if (!subCategoryNode.courses.has(courseId)) {
        subCategoryNode.courses.set(courseId, {
          course_id: courseId,
          course_name: row.course_title ?? "",
        })
      }
    })

    const selectedCategory =
      Array.from(categoryMap.values()).find((c) => c.category_name.toLowerCase().includes("human")) ??
      Array.from(categoryMap.values())[0]

    if (!selectedCategory) {
      return {
        ...res,
        data: {
          ...res.data,
          data: {
            category_id: 0,
            category_name: "",
            sub_categories: [],
          },
        },
      } as unknown as { data: GetHumanLanguageHierarchyResponse }
    }

    const courses = Array.from(selectedCategory.sub_categories.values()).flatMap((sub) =>
      Array.from(sub.courses.values()).map((course) => ({ sub_category_id: sub.sub_category_id, course })),
    )

    const hierarchyResponses = await Promise.all(
      courses.map(({ course }) =>
        http
          .get(`/course-management/courses/${course.course_id}/hierarchy`)
          .then((courseRes) => ({ course_id: course.course_id, rows: (courseRes.data?.data ?? []) as CourseHierarchyRow[] }))
          .catch(() => ({ course_id: course.course_id, rows: [] as CourseHierarchyRow[] })),
      ),
    )

    const hierarchyByCourse = new Map<number, CourseHierarchyRow[]>(
      hierarchyResponses.map((h) => [h.course_id, h.rows]),
    )

    const subCategories = Array.from(selectedCategory.sub_categories.values()).map((sub) => ({
      sub_category_id: sub.sub_category_id,
      sub_category_name: sub.sub_category_name,
      courses: Array.from(sub.courses.values()).map((course) => {
        const levelMap = new Map<
          string,
          {
            level: string
            modules: Map<
              number,
              {
                id: number
                title: string
                sub_modules: Map<number, { id: number; title: string; videos: []; practices: [] }>
              }
            >
          }
        >()

        ;(hierarchyByCourse.get(course.course_id) ?? []).forEach((row) => {
          if (!row.level_id || !row.cefr_level) return
          const levelKey = String(row.cefr_level).toUpperCase()
          if (!levelMap.has(levelKey)) {
            levelMap.set(levelKey, { level: levelKey, modules: new Map() })
          }

          if (!row.module_id) return
          const levelNode = levelMap.get(levelKey)!
          const moduleId = Number(row.module_id)
          if (!levelNode.modules.has(moduleId)) {
            levelNode.modules.set(moduleId, {
              id: moduleId,
              title: row.module_title ?? "",
              sub_modules: new Map(),
            })
          }

          if (!row.sub_module_id) return
          const moduleNode = levelNode.modules.get(moduleId)!
          const subModuleId = Number(row.sub_module_id)
          if (!moduleNode.sub_modules.has(subModuleId)) {
            moduleNode.sub_modules.set(subModuleId, {
              id: subModuleId,
              title: row.sub_module_title ?? "",
              videos: [],
              practices: [],
            })
          }
        })

        return {
          course_id: course.course_id,
          course_name: course.course_name,
          levels: Array.from(levelMap.values()).map((levelNode) => ({
            level: levelNode.level,
            modules: Array.from(levelNode.modules.values()).map((moduleNode) => ({
              id: moduleNode.id,
              title: moduleNode.title,
              sub_modules: Array.from(moduleNode.sub_modules.values()),
            })),
          })),
        }
      }),
    }))

    return {
      ...res,
      data: {
        ...res.data,
        data: {
          category_id: selectedCategory.category_id,
          category_name: selectedCategory.category_name,
          sub_categories: subCategories,
        },
      },
    } as unknown as { data: GetHumanLanguageHierarchyResponse }
  })

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

export const getSubModuleEntryAssessment = (subModuleId: number) =>
  http.get<GetSubCourseEntryAssessmentResponse>(
    `/question-sets/sub-courses/${subModuleId}/entry-assessment`,
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

const reorderNotYetSupported = (items: ReorderItem[]) => Promise.resolve({ data: { data: buildReorderPayload(items) } })

export const reorderCategories = reorderNotYetSupported

export const reorderCourses = reorderNotYetSupported

export const reorderSubModules = reorderNotYetSupported

// Backward-compatible aliases
export const getSubCoursesByCourse = getSubModulesByCourse
export const createSubCourse = createSubModule
export const updateSubCourseThumbnail = updateSubModuleThumbnail
export const updateSubCourse = updateSubModule
export const updateSubCourseStatus = updateSubModuleStatus
export const deleteSubCourse = deleteSubModule
export const getVideosBySubCourse = getVideosBySubModule
export const getPracticesBySubCourse = getPracticesBySubModule
export const getSubCoursePrerequisites = getSubModulePrerequisites
export const addSubCoursePrerequisite = addSubModulePrerequisite
export const removeSubCoursePrerequisite = removeSubModulePrerequisite
export const getSubCourseEntryAssessment = getSubModuleEntryAssessment
export const reorderSubCourses = reorderSubModules

export const reorderVideos = reorderNotYetSupported

export const reorderPractices = reorderNotYetSupported

// Ratings
export const getRatings = (params: GetRatingsParams) =>
  http.get<GetRatingsResponse>("/ratings", { params })

// Vimeo Sample Video
export const getVimeoSample = (videoId: string, width = 640, height = 360) =>
  http.get<GetVimeoSampleResponse>("/vimeo/sample", {
    params: { video_id: videoId, width, height },
  })
