import http from "./http"
import type { LearnerCourseProgressResponse } from "../types/progress.types"

export const getAdminLearnerCourseProgress = (userId: number, courseId: number) =>
  http.get<LearnerCourseProgressResponse>(`/admin/users/${userId}/progress/courses/${courseId}`)
