import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "../layouts/AppLayout"
import { DashboardPage } from "../pages/DashboardPage"
import { AnalyticsPage } from "../pages/analytics/AnalyticsPage"
import { ContentManagementLayout } from "../pages/content-management/ContentManagementLayout"
import { ContentOverviewPage } from "../pages/content-management/ContentOverviewPage"
import { CoursesPage } from "../pages/content-management/CoursesPage"
import { SpeakingPage } from "../pages/content-management/SpeakingPage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { NotificationsPage } from "../pages/notifications/NotificationsPage"
import { PlaceholderPage } from "../pages/PlaceholderPage"
import { UserDetailPage } from "../pages/user-management/UserDetailPage"
import { UserManagementLayout } from "../pages/user-management/UserManagementLayout"
import { UsersListPage } from "../pages/user-management/UsersListPage"
import { UserLogPage } from "../pages/user-log/UserLogPage"

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UserManagementLayout />}>
          <Route index element={<UsersListPage />} />
          <Route path=":id" element={<UserDetailPage />} />
        </Route>

        <Route path="/content" element={<ContentManagementLayout />}>
          <Route index element={<ContentOverviewPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="speaking" element={<SpeakingPage />} />
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


