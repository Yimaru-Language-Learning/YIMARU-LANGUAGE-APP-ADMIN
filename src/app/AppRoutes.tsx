import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "../layouts/AppLayout"
import { DashboardPage } from "../pages/DashboardPage"
import { AnalyticsPage } from "../pages/analytics/AnalyticsPage"
import { ContentManagementLayout } from "../pages/content-management/ContentManagementLayout"
import { CourseCategoryPage } from "../pages/content-management/CourseCategoryPage"
import { AllCoursesPage } from "../pages/content-management/AllCoursesPage"
import { CourseFlowBuilderPage } from "../pages/content-management/CourseFlowBuilderPage"
import { ContentOverviewPage } from "../pages/content-management/ContentOverviewPage"
import { CoursesPage } from "../pages/content-management/CoursesPage"
import { PracticeQuestionsPage } from "../pages/content-management/PracticeQuestionsPage"
import { AddNewPracticePage } from "../pages/content-management/AddNewPracticePage"
import { SubCoursesPage } from "../pages/content-management/SubCoursesPage"
import { SubCourseContentPage } from "../pages/content-management/SubCourseContentPage"
import { SpeakingPage } from "../pages/content-management/SpeakingPage"
import { AddVideoPage } from "../pages/content-management/AddVideoPage"
import { AddPracticePage } from "../pages/content-management/AddPracticePage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { NotificationsPage } from "../pages/notifications/NotificationsPage"
import { UserDetailPage } from "../pages/user-management/UserDetailPage"
import { UserManagementLayout } from "../pages/user-management/UserManagementLayout"
import { UsersListPage } from "../pages/user-management/UsersListPage"
import { UserManagementDashboard } from "../pages/user-management/UserManagementDashboard"
import { UserGroupsPage } from "../pages/user-management/UserGroupsPage"
import { RegisterUserPage } from "../pages/user-management/RegisterUserPage"
import { RoleManagementLayout } from "../pages/role-management/RoleManagementLayout"
import { RolesListPage } from "../pages/role-management/RolesListPage"
import { AddRolePage } from "../pages/role-management/AddRolePage"
import { PracticeDetailsPage } from "../pages/content-management/PracticeDetailsPage"
import { PracticeMembersPage } from "../pages/content-management/PracticeMembersPage"
import { QuestionsPage } from "../pages/content-management/QuestionsPage"
import { AddQuestionPage } from "../pages/content-management/AddQuestionPage"
import { UserLogPage } from "../pages/user-log/UserLogPage"
import { IssuesPage } from "../pages/issues/IssuesPage"
import { ProfilePage } from "../pages/ProfilePage"
import { SettingsPage } from "../pages/SettingsPage"
import { TeamManagementPage } from "../pages/team/TeamManagementPage"
import { AddTeamMemberPage } from "../pages/team/AddTeamMemberPage"
import { TeamMemberDetailPage } from "../pages/team/TeamMemberDetailPage"
import { LoginPage } from "../pages/auth/LoginPage"
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage"
import { VerificationPage } from "../pages/auth/VerificationPage"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verification" element={<VerificationPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UserManagementLayout />}>
          <Route index element={<UserManagementDashboard />} />
          <Route path="list" element={<UsersListPage />} />
          <Route path="register" element={<RegisterUserPage />} />
          <Route path="groups" element={<UserGroupsPage />} />
          <Route path=":id" element={<UserDetailPage />} />
        </Route>

        <Route path="/roles" element={<RoleManagementLayout />}>
          <Route index element={<RolesListPage />} />
          <Route path="add" element={<AddRolePage />} />
        </Route>

        <Route path="/content" element={<ContentManagementLayout />}>
          <Route index element={<CourseCategoryPage />} />
          <Route path="courses" element={<AllCoursesPage />} />
          <Route path="flows" element={<CourseFlowBuilderPage />} />
          <Route path="category/:categoryId" element={<ContentOverviewPage />} />
          <Route path="category/:categoryId/courses" element={<CoursesPage />} />
          {/* Course → Sub-course → Video/Practice */}
          <Route path="category/:categoryId/courses/:courseId/sub-courses" element={<SubCoursesPage />} />
          <Route path="category/:categoryId/courses/:courseId/sub-courses/:subCourseId" element={<SubCourseContentPage />} />
          <Route path="category/:categoryId/courses/:courseId/sub-courses/:subCourseId/add-practice" element={<AddNewPracticePage />} />
          <Route path="category/:categoryId/courses/:courseId/sub-courses/:subCourseId/practices/:practiceId/questions" element={<PracticeQuestionsPage />} />
          <Route path="category/:categoryId/courses/add-video" element={<AddVideoPage />} />
          <Route path="speaking" element={<SpeakingPage />} />
          <Route path="speaking/add-practice" element={<AddPracticePage />} />
          <Route path="practices" element={<PracticeDetailsPage />} />
          <Route path="practices/members" element={<PracticeMembersPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="questions/add" element={<AddQuestionPage />} />
          <Route path="questions/edit/:id" element={<AddQuestionPage />} />
        </Route>

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/user-log" element={<UserLogPage />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        <Route path="/team" element={<TeamManagementPage />} />
        <Route path="/team/add" element={<AddTeamMemberPage />} />
        <Route path="/team/:id" element={<TeamMemberDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}


