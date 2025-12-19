import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "../layouts/AppLayout"
import { DashboardPage } from "../pages/DashboardPage"
import { AnalyticsPage } from "../pages/analytics/AnalyticsPage"
import { ContentManagementLayout } from "../pages/content-management/ContentManagementLayout"
import { ContentOverviewPage } from "../pages/content-management/ContentOverviewPage"
import { CoursesPage } from "../pages/content-management/CoursesPage"
import { SpeakingPage } from "../pages/content-management/SpeakingPage"
import { AddVideoPage } from "../pages/content-management/AddVideoPage"
import { AddPracticePage } from "../pages/content-management/AddPracticePage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { NotificationsPage } from "../pages/notifications/NotificationsPage"
import { PlaceholderPage } from "../pages/PlaceholderPage"
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
import { UserLogPage } from "../pages/user-log/UserLogPage"

export function AppRoutes() {
  return (
    <Routes>
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
          <Route index element={<ContentOverviewPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/add-video" element={<AddVideoPage />} />
          <Route path="speaking" element={<SpeakingPage />} />
          <Route path="speaking/add-practice" element={<AddPracticePage />} />
          <Route path="practices" element={<PracticeDetailsPage />} />
          <Route path="practices/members" element={<PracticeMembersPage />} />
        </Route>

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/user-log" element={<UserLogPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        <Route path="/team" element={<PlaceholderPage title="Team Management" />} />
        <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}


