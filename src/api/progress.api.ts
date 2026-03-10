import http from "./http"
import type {
  LearnerCourseProgressResponse,
  LearnerCourseProgressSummaryResponse,
} from "../types/progress.types"

export const getAdminLearnerCourseProgress = (userId: number, courseId: number) =>
  http.get<LearnerCourseProgressResponse>(`/admin/users/${userId}/progress/courses/${courseId}`)

export const getAdminLearnerCourseProgressSummary = (userId: number, courseId: number) =>
  http.get<LearnerCourseProgressSummaryResponse>(
    `/admin/users/${userId}/progress/courses/${courseId}/summary`,
  )
