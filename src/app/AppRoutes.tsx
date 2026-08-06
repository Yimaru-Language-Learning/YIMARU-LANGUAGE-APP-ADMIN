import { Navigate, Route, Routes } from "react-router-dom";
import { getDefaultAppHome } from "../lib/adminAccess";
import { getNormalizedSessionTeamRole } from "../lib/teamRole";
import { FullPanelGuard } from "../components/access/AdminAccessGates";
import { AppLayout } from "../layouts/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { AnalyticsPage } from "../pages/analytics/AnalyticsPage";
import { ContentManagementLayout } from "../pages/content-management/ContentManagementLayout";
import { AllCoursesPage } from "../pages/content-management/AllCoursesPage";
import { CourseFlowBuilderPage } from "../pages/content-management/CourseFlowBuilderPage";
import { ContentOverviewPage } from "../pages/content-management/ContentOverviewPage";
import { CoursesPage } from "../pages/content-management/CoursesPage";
import { PracticeQuestionsPage } from "../pages/content-management/PracticeQuestionsPage";
import { AddNewPracticePage } from "../pages/content-management/AddNewPracticePage";
import { SubModulesPage } from "../pages/content-management/SubCoursesPage";
import { SubModuleContentPage } from "../pages/content-management/SubCourseContentPage";
import { SpeakingPage } from "../pages/content-management/SpeakingPage";
import { AddVideoPage } from "../pages/content-management/AddVideoPage";
import { AddPracticePage } from "../pages/content-management/AddPracticePage";
import { NewContentPage } from "../pages/content-management/NewContentPage";
import { ReorderContentPage } from "../pages/content-management/ReorderContentPage";
import { LearnEnglishPage } from "../pages/content-management/LearnEnglishPage";
import { ProgramCoursesPage } from "../pages/content-management/ProgramCoursesPage";
import { CourseDetailPage } from "../pages/content-management/CourseDetailPage";
import { LessonPracticesPage } from "../pages/content-management/LessonPracticesPage";
import { ModuleDetailPage } from "../pages/content-management/ModuleDetailPage";
import { AddVideoFlow } from "../pages/content-management/AddVideoFlow";
import { AddPracticeFlow } from "../pages/content-management/AddPracticeFlow";
import { LinkExistingPracticeFlow } from "../pages/content-management/LinkExistingPracticeFlow";
import { EditPracticeFlow } from "../pages/content-management/EditPracticeFlow";
import { CourseModuleDetailPage } from "../pages/content-management/CourseModuleDetailPage";
import { ProgramTypeSelectionPage } from "../pages/content-management/ProgramTypeSelectionPage";
import { ProgramDetailPage } from "../pages/content-management/ProgramDetailPage";
import { CourseManagementPage } from "../pages/content-management/CourseManagementPage";
import { UnitManagementPage } from "../pages/content-management/UnitManagementPage";
import { InitialAssessmentPage } from "../pages/content-management/InitialAssessmentPage";
import { QuestionTypeLibraryPage } from "../pages/content-management/QuestionTypeLibraryPage";
import { CreateQuestionTypeFlow } from "../pages/content-management/CreateQuestionTypeFlow";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { CreateNotificationPage } from "../pages/notifications/CreateNotificationPage";
import { ScheduledNotificationsPage } from "../pages/notifications/ScheduledNotificationsPage";
import { AllNotificationsPage } from "../pages/notifications/AllNotificationsPage";
import { EmailTemplatesPage } from "../pages/notifications/EmailTemplatesPage";
import { EmailTemplateDetailPage } from "../pages/notifications/EmailTemplateDetailPage";
import { CreateEmailTemplatePage } from "../pages/notifications/CreateEmailTemplatePage";
import { UserDetailPage } from "../pages/user-management/UserDetailPage";
import { UserManagementLayout } from "../pages/user-management/UserManagementLayout";
import { UsersListPage } from "../pages/user-management/UsersListPage";
import { UserGroupsPage } from "../pages/user-management/UserGroupsPage";
import { DeletionRequestsPage } from "../pages/user-management/DeletionRequestsPage";
import { PracticeDetailsPage } from "../pages/content-management/PracticeDetailsPage";
import { PracticeMembersPage } from "../pages/content-management/PracticeMembersPage";
import { QuestionsPage } from "../pages/content-management/QuestionsPage";
import { AddQuestionPage } from "../pages/content-management/AddQuestionPage";
import { HumanLanguageHierarchyPage } from "../pages/content-management/HumanLanguageHierarchyPage";
import { HumanLanguageSubModulePage } from "../pages/content-management/HumanLanguageSubModulePage";
import { UserLogPage } from "../pages/user-log/UserLogPage";
import { PaymentsPage } from "../pages/payments/PaymentsPage";
import { SubscriptionsExportPage } from "../pages/subscriptions/SubscriptionsExportPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SettingsPage } from "../pages/SettingsPage";
import { TeamManagementPage } from "../pages/team/TeamManagementPage";
import { AddTeamMemberPage } from "../pages/team/AddTeamMemberPage";
import { TeamMemberDetailPage } from "../pages/team/TeamMemberDetailPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { VerificationPage } from "../pages/auth/VerificationPage";
import { AcceptInvitePage } from "../pages/auth/AcceptInvitePage";
import { AboutPage } from "../pages/AboutPage";
import { TermsPage } from "../pages/TermsPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { AccountDeletionPage } from "../pages/AccountDeletionPage";
import { AppReviewsPage } from "../pages/ratings/AppReviewsPage";
import { PersonasPage } from "../pages/personas/PersonasPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verification" element={<VerificationPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/account-deletion" element={<AccountDeletionPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to={getDefaultAppHome(getNormalizedSessionTeamRole())} replace />} />

        <Route element={<FullPanelGuard />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UserManagementLayout />}>
          <Route index element={<Navigate to="list" replace />} />
          <Route path="list" element={<UsersListPage />} />
          <Route path="deletion-requests" element={<DeletionRequestsPage />} />
          <Route path="groups" element={<UserGroupsPage />} />
          <Route path=":id" element={<UserDetailPage />} />
        </Route>

        <Route path="/roles" element={<Navigate to="/settings?tab=security" replace />} />
        <Route path="/roles/*" element={<Navigate to="/settings?tab=security" replace />} />
        </Route>

        <Route path="/content" element={<ContentManagementLayout />}>
          <Route index element={<Navigate to="practices" replace />} />
          <Route path="courses" element={<AllCoursesPage />} />
          <Route path="flows" element={<CourseFlowBuilderPage />} />
          <Route path="human-language" element={<HumanLanguageHierarchyPage />} />
          <Route
            path="human-language/:categoryId/:courseId/sub-module/:subModuleId/add-practice"
            element={<AddNewPracticePage />}
          />
          <Route
            path="human-language/:categoryId/:courseId/sub-module/:subModuleId/practices/:practiceId/questions"
            element={<PracticeQuestionsPage />}
          />
          <Route
            path="human-language/:categoryId/:courseId/sub-module/:subModuleId"
            element={<HumanLanguageSubModulePage />}
          />
          <Route
            path="category/:categoryId"
            element={<ContentOverviewPage />}
          />
          <Route
            path="category/:categoryId/courses"
            element={<CoursesPage />}
          />
          {/* Course → Sub-module → Lesson/Practice */}
          <Route
            path="category/:categoryId/courses/:courseId/sub-modules"
            element={<SubModulesPage />}
          />
          <Route
            path="category/:categoryId/courses/:courseId/sub-modules/:subModuleId"
            element={<SubModuleContentPage />}
          />
          <Route
            path="category/:categoryId/courses/:courseId/sub-modules/:subModuleId/add-practice"
            element={<AddNewPracticePage />}
          />
          <Route
            path="category/:categoryId/courses/:courseId/sub-modules/:subModuleId/practices/:practiceId/questions"
            element={<PracticeQuestionsPage />}
          />
          {/* Legacy aliases */}
          <Route
            path="category/:categoryId/courses/:courseId/sub-courses"
            element={<SubModulesPage />}
          />
          <Route
            path="category/:categoryId/courses/:courseId/sub-courses/:subModuleId"
            element={<SubModuleContentPage />}
          />
          <Route
            path="category/:categoryId/courses/:courseId/sub-courses/:subModuleId/add-practice"
            element={<AddNewPracticePage />}
          />
          <Route
            path="category/:categoryId/courses/:courseId/sub-courses/:subModuleId/practices/:practiceId/questions"
            element={<PracticeQuestionsPage />}
          />
          <Route
            path="category/:categoryId/courses/add-video"
            element={<AddVideoPage />}
          />
          <Route path="speaking" element={<SpeakingPage />} />
          <Route path="speaking/add-practice" element={<AddPracticePage />} />
          <Route path="practices" element={<PracticeDetailsPage />} />
          <Route path="practices/members" element={<PracticeMembersPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="questions/add" element={<AddQuestionPage />} />
          <Route path="questions/edit/:id" element={<AddQuestionPage />} />
        </Route>

        <Route path="/new-content" element={<NewContentPage />} />
        <Route path="/new-content/reorder" element={<ReorderContentPage />} />
        <Route
          path="/new-content/courses"
          element={<ProgramTypeSelectionPage />}
        />
        <Route
          path="/new-content/question-types"
          element={<QuestionTypeLibraryPage />}
        />
        <Route
          path="/new-content/initial-assessment"
          element={<InitialAssessmentPage />}
        />
        <Route
          path="/new-content/question-types/:definitionId/create-practice"
          element={<AddPracticeFlow />}
        />
        <Route
          path="/new-content/practices/:practiceId/edit"
          element={<EditPracticeFlow />}
        />
        <Route
          path="/new-content/question-types/:definitionId/edit"
          element={<CreateQuestionTypeFlow />}
        />
        <Route
          path="/new-content/question-types/create"
          element={<CreateQuestionTypeFlow />}
        />
        <Route
          path="/new-content/courses/:programType"
          element={<ProgramDetailPage />}
        />
        <Route
          path="/new-content/courses/:programType/add-practice"
          element={<AddPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/attach-practice"
          element={<LinkExistingPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/add-practice"
          element={<AddPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/attach-practice"
          element={<LinkExistingPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/add-practice"
          element={<AddPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/attach-practice"
          element={<LinkExistingPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/:moduleId/add-practice"
          element={<AddPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/:moduleId/attach-practice"
          element={<LinkExistingPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId"
          element={<CourseManagementPage />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId"
          element={<UnitManagementPage />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/:moduleId"
          element={<CourseModuleDetailPage />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/edit-practice/:practiceId"
          element={<EditPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/edit-practice/:practiceId"
          element={<EditPracticeFlow />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/:moduleId/lessons/:lessonId/practices"
          element={<LessonPracticesPage />}
        />
        <Route
          path="/new-content/courses/:programType/:courseId/:unitId/:moduleId/lessons/:lessonId/edit-practice/:practiceId"
          element={<EditPracticeFlow />}
        />
        <Route
          path="/new-content/learn-english"
          element={<LearnEnglishPage />}
        />
        <Route
          path="/new-content/learn-english/:level/courses"
          element={<ProgramCoursesPage />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/:courseId"
          element={<CourseDetailPage />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/:courseId/modules/:moduleId"
          element={<ModuleDetailPage />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/:courseId/modules/:moduleId/add-video"
          element={<AddVideoFlow />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/:courseId/modules/:moduleId/lessons/:lessonId/practices"
          element={<LessonPracticesPage />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/:courseId/edit-practice/:practiceId"
          element={<EditPracticeFlow />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/:courseId/modules/:moduleId/edit-practice/:practiceId"
          element={<EditPracticeFlow />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/:courseId/modules/:moduleId/lessons/:lessonId/edit-practice/:practiceId"
          element={<EditPracticeFlow />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/add-practice"
          element={<AddPracticeFlow />}
        />
        <Route
          path="/new-content/learn-english/:level/courses/attach-practice"
          element={<LinkExistingPracticeFlow />}
        />

        <Route path="/personas" element={<PersonasPage />} />
        <Route path="/admin/personas" element={<PersonasPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route element={<FullPanelGuard />}>
        <Route
          path="/notifications/email-templates"
          element={<EmailTemplatesPage />}
        />
        <Route
          path="/notifications/email-templates/new"
          element={<CreateEmailTemplatePage />}
        />
        <Route
          path="/notifications/email-templates/:slug"
          element={<EmailTemplateDetailPage />}
        />
        <Route
          path="/notifications/create"
          element={<CreateNotificationPage />}
        />
        <Route
          path="/notifications/scheduled"
          element={<ScheduledNotificationsPage />}
        />
        <Route path="/notifications/all" element={<AllNotificationsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/subscriptions/export" element={<SubscriptionsExportPage />} />
        <Route path="/user-log" element={<UserLogPage />} />
        <Route path="/app-reviews" element={<AppReviewsPage />} />
        <Route path="/admin/app-reviews" element={<AppReviewsPage />} />
        <Route path="/operations/app-reviews" element={<AppReviewsPage />} />
        <Route path="/ratings" element={<AppReviewsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        <Route path="/team" element={<TeamManagementPage />} />
        <Route path="/team/add" element={<AddTeamMemberPage />} />
        <Route path="/team/:id" element={<TeamMemberDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
