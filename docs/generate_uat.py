"""Generate Yimaru Admin UAT document from template."""
from __future__ import annotations

import copy
import shutil
from pathlib import Path

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

TEMPLATE = Path(__file__).parent / "Copy of UAT.docx"
OUTPUT = TEMPLATE



def set_paragraph_text(paragraph: Paragraph, text: str) -> None:
    if not paragraph.runs:
        paragraph.add_run(text)
        return
    paragraph.runs[0].text = text
    for run in paragraph.runs[1:]:
        run.text = ""


def clear_table_rows(table: Table, keep_header: bool = True) -> None:
    start = 1 if keep_header else 0
    while len(table.rows) > start:
        table._tbl.remove(table.rows[-1]._tr)


def fill_row(row, values: list[str]) -> None:
    for i, value in enumerate(values):
        if i < len(row.cells):
            row.cells[i].text = value


def fill_table(table: Table, rows: list[list[str]], keep_header: bool = True) -> None:
    template_index = 1 if len(table.rows) > 1 else 0
    template_tr = copy.deepcopy(table.rows[template_index]._tr)
    clear_table_rows(table, keep_header=keep_header)
    for values in rows:
        new_tr = copy.deepcopy(template_tr)
        table._tbl.append(new_tr)
        fill_row(table.rows[-1], values)


def paragraph_at(doc: Document, body_index: int) -> Paragraph:
    child = doc.element.body[body_index]
    return Paragraph(child, doc)


def replace_document() -> None:
    working_copy = Path(__file__).parent / "_uat_working.docx"
    shutil.copy2(TEMPLATE, working_copy)
    doc = Document(working_copy)

    tables = [Table(child, doc) for child in doc.element.body if child.tag.split("}")[-1] == "tbl"]

    paragraph_updates: dict[int, str] = {
        0: "UAT Document: Yimaru Admin Panel",
        1: "1. UAT Objective",
        2: (
            "To confirm that the Yimaru Admin Panel meets business requirements, role-based access "
            "expectations, security standards, and operational readiness before production release. "
            "This panel is used by internal teams to manage learners, learning content, subscriptions, "
            "notifications, payments, and platform operations for the Yimaru LMS mobile application."
        ),
        3: "2. Scope",
        4: "This UAT covers the Yimaru Admin Panel web application, including:",
        5: "Authentication & team onboarding",
        6: "Dashboard and analytics",
        7: "User management (learners, groups, deletion requests)",
        8: "Roles and team member access control",
        9: "Learning content management (practices, courses, question types, reordering)",
        10: "Personas management",
        11: "Notifications (inbox, email templates, send & scheduled)",
        12: "Payments and subscription oversight",
        13: "User activity log and issue reports",
        14: "FAQs, app reviews, and profile/settings",
        15: "Out of scope: mobile learner app flows, backend API unit tests, and infrastructure deployment.",
        16: "",
        17: "",
        18: "",
        19: "",
        20: "3. UAT Participants",
        23: "4. Test Environment",
        26: "5. Entry Criteria",
        27: "UAT may begin when:",
        28: "Core admin development for the release scope is completed",
        29: "QA smoke testing is passed on the UAT/staging environment",
        30: "UAT environment is available and reachable",
        31: "Test team member accounts are created with appropriate roles/permissions",
        32: "Sample learners, courses, practices, and payment test data are prepared",
        33: "Known critical/blocker defects from QA are resolved or waived",
        34: "Business requirements and acceptance criteria are documented",
        35: "6. Exit Criteria",
        36: "UAT is complete when:",
        37: "All critical and high-priority test cases pass",
        38: "No open blocker or high-severity defects remain",
        39: "Medium/low defects are accepted with documented remediation plan",
        40: "Business owner / product owner signs off",
        41: "Production deployment readiness is confirmed",
        42: "7. UAT Test Cases",
        43: "A. Authentication, Onboarding & Public Pages",
        46: "B. Yimaru Admin Panel — Core Modules (incl. bulk & scheduled notifications)",
        49: "8. Cross-System UAT Tests",
        52: "9. Defect Log",
        55: "10. Sign-Off",
        57: (
            "Final UAT Decision:\n"
            "☐ Approved for Production\n"
            "☐ Approved with Minor Issues\n"
            "☐ Not Approved"
        ),
    }

    for index, text in paragraph_updates.items():
        set_paragraph_text(paragraph_at(doc, index), text)

    # --- Participants table ---
    fill_table(
        tables[0],
        [
            ["Product Owner", "Approves final UAT acceptance"],
            ["UAT Lead", "Coordinates testing schedule and sign-off"],
            ["Content Admin Tester", "Tests learning content, practices, and question types"],
            ["Operations Tester", "Tests users, payments, notifications, and issue workflows"],
            ["Security/Access Tester", "Tests roles, permissions, and team member access"],
            ["Developer / Support", "Fixes defects and supports retesting"],
            ["QA Team", "Tracks defects, verifies fixes, and confirms retests"],
        ],
    )

    # --- Environment table ---
    fill_table(
        tables[1],
        [
            ["Environment", "UAT / Staging"],
            ["Application", "Yimaru Admin Panel (React + Vite SPA)"],
            ["Admin URL", "<staging-admin-url>"],
            ["API Backend", "<staging-api-url>"],
            ["Browsers", "Chrome (latest), Microsoft Edge, Firefox, Safari"],
            ["Devices", "Desktop (primary), tablet (responsive check)"],
            ["Test Accounts", "Super admin, content editor, support/ops roles with varied permissions"],
            ["Test Data", "Sample learners, courses, practices, subscriptions, notifications, payments"],
        ],
    )

    # --- Section A: Auth & public pages ---
    auth_cases = [
        [
            "YA-AUTH-001",
            "Login form validation — empty fields",
            'Navigate to /login. Leave email and password blank. Click "Sign in".',
            'Inline validation or error toast appears; user is not authenticated.',
            "",
        ],
        [
            "YA-AUTH-002",
            "Login with invalid credentials",
            "Enter invalid email/password and submit.",
            "Login fails with a clear error message; no access token is stored.",
            "",
        ],
        [
            "YA-AUTH-003",
            "Login with valid team credentials",
            "Enter valid admin email and password. Submit.",
            "User is authenticated, tokens are stored, and user is redirected to /dashboard.",
            "",
        ],
        [
            "YA-AUTH-004",
            "Login with Google SSO",
            'On /login, click "Continue with Google" and complete Google auth.',
            "User is authenticated and redirected to the dashboard when account is authorized.",
            "",
        ],
        [
            "YA-AUTH-005",
            "Password visibility toggle",
            "On login page, toggle the eye icon on the password field.",
            "Password text toggles between masked and visible.",
            "",
        ],
        [
            "YA-AUTH-006",
            "Forgot password flow",
            'From /login, click "Forgot password". Submit registered email.',
            "Password reset instructions/OTP flow initiates successfully.",
            "",
        ],
        [
            "YA-AUTH-007",
            "Email verification page",
            "Open /verification with a valid verification token/link.",
            "Verification succeeds or shows appropriate success/error state.",
            "",
        ],
        [
            "YA-AUTH-008",
            "Accept team invite",
            "Open /accept-invite with a valid invite token. Set password and submit.",
            "Invite is accepted; user can sign in with new credentials.",
            "",
        ],
        [
            "YA-AUTH-009",
            "Protected route redirect",
            "Clear local storage tokens and open /dashboard directly.",
            "User is redirected to /login.",
            "",
        ],
        [
            "YA-AUTH-010",
            "Logout",
            'From sidebar, click "Logout".',
            "Session tokens are cleared and user is redirected to /login.",
            "",
        ],
        [
            "YA-AUTH-011",
            "Public legal pages",
            "Visit /about, /terms, /privacy, and /account-deletion without logging in.",
            "Pages load correctly with expected legal/content information.",
            "",
        ],
        [
            "YA-AUTH-012",
            "Password changed re-login",
            "Change password in Settings > Security. Complete forced logout.",
            "User is redirected to login with success message; new password works.",
            "",
        ],
    ]
    fill_table(tables[2], auth_cases)

    # --- Section B: Admin modules ---
    admin_cases = [
        # Shell & navigation
        [
            "YA-ADM-001",
            "Sidebar navigation",
            "Log in and click each primary sidebar section (Dashboard, Analytics, Users & access, Content, etc.).",
            "Each section loads the correct page without errors.",
            "",
        ],
        [
            "YA-ADM-002",
            "Sidebar collapse/expand",
            "On desktop, collapse and expand the sidebar using the toggle control.",
            "Sidebar collapses to icon-only mode and expands back with labels intact.",
            "",
        ],
        [
            "YA-ADM-003",
            "Mobile sidebar drawer",
            "On mobile viewport, open and close the sidebar menu.",
            "Overlay drawer opens/closes; navigation works and backdrop dismisses menu.",
            "",
        ],
        [
            "YA-ADM-004",
            "Topbar notification dropdown",
            "Click the bell icon in the topbar.",
            "Notification panel opens with unread count badge when applicable.",
            "",
        ],
        [
            "YA-ADM-005",
            "Dark/light theme toggle",
            "Toggle theme from topbar or Settings > Appearance.",
            "UI switches between light and dark themes consistently across pages.",
            "",
        ],
        [
            "YA-ADM-006",
            "Permission-based menu visibility",
            "Log in as a user without personas/FAQs/ratings permissions.",
            "Restricted menu items (Personas, FAQs, App reviews) are hidden.",
            "",
        ],
        # Dashboard
        [
            "YA-ADM-007",
            "Dashboard load & welcome",
            "Navigate to /dashboard.",
            "Dashboard loads summary cards, charts, and personalized greeting without errors.",
            "",
        ],
        [
            "YA-ADM-008",
            "Dashboard time range filter",
            "Change dashboard analytics time range filter (e.g., all time, custom range).",
            "Metrics and charts refresh according to selected range.",
            "",
        ],
        [
            "YA-ADM-009",
            "Dashboard quick links",
            "Click dashboard stat cards/links to related modules (users, payments, reviews, etc.).",
            "User is navigated to the correct destination page.",
            "",
        ],
        # Analytics
        [
            "YA-ADM-010",
            "Analytics page",
            "Navigate to /analytics.",
            "Analytics charts, filters, and summary data render correctly.",
            "",
        ],
        [
            "YA-ADM-011",
            "Analytics filter interaction",
            "Apply date/time filters on analytics page.",
            "Displayed metrics update to match filter selection.",
            "",
        ],
        # Users
        [
            "YA-ADM-012",
            "Users list load",
            "Navigate to Users & access > All users (/users/list).",
            "Paginated user table loads with avatar, status, and metadata.",
            "",
        ],
        [
            "YA-ADM-013",
            "Search users",
            "Use search field to find a user by name or email.",
            "Table filters to matching users.",
            "",
        ],
        [
            "YA-ADM-014",
            "Filter users",
            "Open filters panel; apply country, region, status, and date filters.",
            "Results reflect applied filters; active filter count is shown.",
            "",
        ],
        [
            "YA-ADM-015",
            "Toggle user status",
            "Activate/deactivate a user from the users list.",
            "Status updates successfully with confirmation toast.",
            "",
        ],
        [
            "YA-ADM-016",
            "View user detail",
            "Open a user from the list (/users/:id).",
            "User profile, subscriptions, and related sections display correctly.",
            "",
        ],
        [
            "YA-ADM-017",
            "Deletion requests",
            "Navigate to /users/deletion-requests.",
            "Account deletion requests list loads; actions can be reviewed/processed.",
            "",
        ],
        [
            "YA-ADM-018",
            "User groups",
            "Navigate to /users/groups.",
            "User groups page loads and group management actions work as designed.",
            "",
        ],
        # Roles & team
        [
            "YA-ADM-019",
            "Roles list",
            "Navigate to /roles.",
            "Roles table loads with permissions summary.",
            "",
        ],
        [
            "YA-ADM-020",
            "Create role",
            "Go to /roles/add. Create a role with selected permissions. Save.",
            "New role is created and appears in roles list.",
            "",
        ],
        [
            "YA-ADM-021",
            "Team members list",
            "Navigate to /team.",
            "Team members list loads with role and status information.",
            "",
        ],
        [
            "YA-ADM-022",
            "Invite team member",
            "Go to /team/add. Submit invite with email and role.",
            "Invitation is sent; member appears in list or pending state.",
            "",
        ],
        [
            "YA-ADM-023",
            "Team member detail",
            "Open /team/:id for an existing member.",
            "Member details, role, and edit actions display correctly.",
            "",
        ],
        # Content management
        [
            "YA-ADM-024",
            "Manage practices overview",
            "Navigate to Content > Manage practices (/content).",
            "Practice management page loads with search/filter and practice list.",
            "",
        ],
        [
            "YA-ADM-025",
            "Practice members",
            "Open /content/practices/members.",
            "Practice members list and management UI loads correctly.",
            "",
        ],
        [
            "YA-ADM-026",
            "Questions library",
            "Navigate to /content/questions.",
            "Questions list loads; add/edit navigation works.",
            "",
        ],
        [
            "YA-ADM-027",
            "Add question",
            "Go to /content/questions/add. Create a question and save.",
            "Question is created and visible in questions list.",
            "",
        ],
        [
            "YA-ADM-028",
            "Edit question",
            "Open /content/questions/edit/:id for an existing question.",
            "Question loads in editor; updates persist after save.",
            "",
        ],
        [
            "YA-ADM-029",
            "All courses (legacy content)",
            "Navigate to /content/courses and browse category/course hierarchy.",
            "Course hierarchy pages load; drill-down navigation works.",
            "",
        ],
        [
            "YA-ADM-030",
            "Course flow builder",
            "Navigate to /content/flows.",
            "Flow builder interface loads for course sequencing.",
            "",
        ],
        [
            "YA-ADM-031",
            "Human language hierarchy",
            "Navigate to /content/human-language and open a sub-module.",
            "Hierarchy, lessons, and practice links display correctly.",
            "",
        ],
        [
            "YA-ADM-032",
            "New content hub",
            "Navigate to /new-content.",
            "New content landing page loads program/course entry points.",
            "",
        ],
        [
            "YA-ADM-033",
            "Learn English program flow",
            "From /new-content/learn-english, open level > course > module > lesson practices.",
            "Full hierarchy navigation works; lesson practices page loads.",
            "",
        ],
        [
            "YA-ADM-034",
            "Add practice flow",
            "Start add-practice flow from a course/module context and complete all steps.",
            "Practice is created and attached to the selected lesson/module.",
            "",
        ],
        [
            "YA-ADM-035",
            "Edit practice flow",
            "Open edit-practice flow for an existing practice.",
            "Practice data loads; edits save successfully.",
            "",
        ],
        [
            "YA-ADM-036",
            "Add video to module",
            "Use add-video flow under Learn English module.",
            "Video upload/metadata step completes; video appears in module.",
            "",
        ],
        [
            "YA-ADM-037",
            "Reorder content structure",
            "Navigate to /new-content/reorder and change item order.",
            "Drag/reorder saves new structure order successfully.",
            "",
        ],
        [
            "YA-ADM-038",
            "Question type library",
            "Navigate to /new-content/question-types.",
            "Question type definitions list loads.",
            "",
        ],
        [
            "YA-ADM-039",
            "Create question type definition",
            "Go to /new-content/question-types/create and complete schema builder.",
            "New question type is saved and listed in library.",
            "",
        ],
        [
            "YA-ADM-040",
            "Edit question type definition",
            "Open /new-content/question-types/:definitionId/edit.",
            "Definition loads; updates persist after save.",
            "",
        ],
        # Personas
        [
            "YA-ADM-041",
            "Personas list",
            "Navigate to /personas (with permission).",
            "Personas table loads with status and metadata.",
            "",
        ],
        [
            "YA-ADM-042",
            "Create persona",
            "Create a new persona from personas page.",
            "Persona is created and appears in list.",
            "",
        ],
        [
            "YA-ADM-043",
            "Edit/delete persona",
            "Edit an existing persona; test delete confirmation dialog.",
            "Updates save correctly; delete requires confirmation and removes persona.",
            "",
        ],
        # Notifications — bulk & scheduled (see Bulk Notifications Integration Guide)
        [
            "YA-ADM-044",
            "Notifications inbox",
            "Navigate to /notifications.",
            "Admin inbox loads; unread count badge updates in sidebar when notifications are read.",
            "",
        ],
        [
            "YA-ADM-045",
            "Send notification composer — channels",
            "Open /notifications/create. Switch between Push, SMS, Email, and In-app channels.",
            "Channel-specific fields render correctly (subject for email, in-app type/level, etc.).",
            "",
        ],
        [
            "YA-ADM-046",
            "Bulk SMS — immediate by role",
            'Channel: SMS. Audience: role STUDENT. Message filled. Send now. Submit.',
            "API returns 200; toast shows sent/failed/total_recipients counts.",
            "",
        ],
        [
            "YA-ADM-047",
            "Bulk SMS — direct phone numbers",
            "Channel: SMS. Audience: direct phones. Enter E.164/local numbers. Send now.",
            "SMS dispatched to listed numbers; success summary displayed.",
            "",
        ],
        [
            "YA-ADM-048",
            "Bulk SMS — scheduled",
            "Channel: SMS. Set Send later with future RFC3339 UTC datetime. Submit.",
            "API returns 201; toast shows job id and scheduled_at; job appears in /notifications/scheduled.",
            "",
        ],
        [
            "YA-ADM-049",
            "Bulk email — immediate free-form",
            "Channel: Email. Subject + plain message and/or HTML. Target by role. Send now.",
            "API returns 200 with sent/failed/total_recipients; email delivered to test inboxes.",
            "",
        ],
        [
            "YA-ADM-050",
            "Bulk email — attachment (immediate only)",
            "Channel: Email. Send now with optional file attachment.",
            "Attachment included in immediate send; attachment field hidden/disabled when scheduling.",
            "",
        ],
        [
            "YA-ADM-051",
            "Bulk email — scheduled",
            "Channel: Email. Target by direct emails JSON list. Schedule for future time.",
            "API returns 201 ScheduledNotification (channel: email); no attachment accepted.",
            "",
        ],
        [
            "YA-ADM-052",
            "Bulk email — custom_message template (compose)",
            "Channel: Email. Select custom_message template; provide subject + message (and optional template_variables). Send now or schedule.",
            "Server renders branded template; scheduled job stores email_template_slug and variables when applicable.",
            "",
        ],
        [
            "YA-ADM-053",
            "Bulk push — immediate",
            "Channel: Push. Title + message. Target selected user_ids. Send now.",
            "API returns 200 with target_users, sent, failed counts (token-level).",
            "",
        ],
        [
            "YA-ADM-054",
            "Bulk push — image (immediate only)",
            "Channel: Push. Send now with optional image upload.",
            "Image URL returned in response data; image upload unavailable when scheduling.",
            "",
        ],
        [
            "YA-ADM-055",
            "Bulk push — scheduled",
            "Channel: Push. Target by role. Schedule for future datetime.",
            "API returns 201; job listed with channel push and status pending.",
            "",
        ],
        [
            "YA-ADM-056",
            "Bulk in-app — immediate",
            "Channel: In-app. Title + message. Set type (e.g. system_alert) and level (info/warning/error/success). Send now.",
            "API returns 200; learners receive in-app row; connected clients get WebSocket CREATED_NOTIFICATION.",
            "",
        ],
        [
            "YA-ADM-057",
            "Bulk in-app — scheduled",
            "Channel: In-app. Target user_ids. Schedule future send with type/level metadata.",
            "API returns 201; target_raw stores type/level; job dispatches at scheduled_at.",
            "",
        ],
        [
            "YA-ADM-058",
            "Recipient targeting — selected users",
            "Audience mode: multi-select users from platform user list with search.",
            "user_ids sent to API; error if zero users selected.",
            "",
        ],
        [
            "YA-ADM-059",
            "Recipient targeting — platform role",
            "Audience mode: role dropdown (STUDENT, OPEN_LEARNER, INSTRUCTOR, ADMIN, SUPER_ADMIN, SUPPORT).",
            "role field sent; API resolves all matching users.",
            "",
        ],
        [
            "YA-ADM-060",
            "Recipient targeting — direct emails",
            "Channel: Email. Audience: direct emails (comma/newline separated).",
            "emails JSON array sent via multipart form; at least one recipient required.",
            "",
        ],
        [
            "YA-ADM-061",
            "Send now vs schedule toggle",
            "Toggle between Send now and Send later on compose screen.",
            "Schedule picker and attachment/image controls follow immediate vs scheduled rules.",
            "",
        ],
        [
            "YA-ADM-062",
            "Compose validation — missing content/recipients",
            "Submit with empty message, missing subject (non-SMS), or no recipients.",
            "Client-side validation or API 400 with clear error (e.g. No recipients specified).",
            "",
        ],
        [
            "YA-ADM-063",
            "Schedule validation — past datetime",
            "Set scheduled_at to a past timestamp and submit.",
            "API returns 400: scheduled_at must be in the future.",
            "",
        ],
        [
            "YA-ADM-064",
            "Immediate send feedback",
            "Complete any immediate bulk send.",
            "Success toast shows sent, failed, and total/target counts from API data.",
            "",
        ],
        [
            "YA-ADM-065",
            "Scheduled send feedback",
            "Complete any scheduled bulk send.",
            "Success toast shows job id and scheduled time; link navigates to scheduled jobs list.",
            "",
        ],
        [
            "YA-ADM-066",
            "Scheduled jobs list",
            "Navigate to /notifications/scheduled.",
            "Paginated table shows id, channel, title/message preview, scheduled_at, status badges.",
            "",
        ],
        [
            "YA-ADM-067",
            "Scheduled jobs — filter by status and channel",
            "Apply status (pending/processing/sent/failed/cancelled) and channel filters.",
            "List refreshes per GET /notifications/scheduled query params.",
            "",
        ],
        [
            "YA-ADM-068",
            "Cancel scheduled job",
            "For a pending or processing job, click Cancel.",
            "POST /notifications/scheduled/:id/cancel succeeds; status becomes cancelled.",
            "",
        ],
        [
            "YA-ADM-069",
            "Email templates — list",
            "Navigate to /notifications/email-templates.",
            "Templates list loads (requires email_templates.list permission).",
            "",
        ],
        [
            "YA-ADM-070",
            "Email templates — create and edit",
            "Create template at /notifications/email-templates/new; edit existing template.",
            "Template saved via admin API; custom_message available for outbound campaigns.",
            "",
        ],
        [
            "YA-ADM-071",
            "Email templates — preview",
            "Open template detail; use preview with sample variables.",
            "POST preview returns rendered subject/text/html without sending mail.",
            "",
        ],
        [
            "YA-ADM-072",
            "RBAC — notification permissions",
            "Log in as team member without notifications.bulk_* or notifications_scheduled.* permissions.",
            "Send/scheduled actions blocked (403) or UI hidden per permission matrix.",
            "",
        ],
        # Operations
        [
            "YA-ADM-073",
            "Payments page",
            "Navigate to /payments.",
            "Payments/transactions table and summary metrics load.",
            "",
        ],
        [
            "YA-ADM-074",
            "Payments search/filter",
            "Search and filter payments by user, status, or date.",
            "Table updates to show matching payment records.",
            "",
        ],
        [
            "YA-ADM-075",
            "User activity log",
            "Navigate to /user-log.",
            "Activity log entries load with actor, action, and timestamp.",
            "",
        ],
        [
            "YA-ADM-076",
            "Activity log filters",
            "Apply filters on user activity log.",
            "Filtered audit entries display correctly.",
            "",
        ],
        [
            "YA-ADM-077",
            "Issue reports",
            "Navigate to /issues.",
            "Reported issues list loads with status and details.",
            "",
        ],
        [
            "YA-ADM-078",
            "FAQs management",
            "Navigate to /help/faqs (with permission).",
            "FAQ list loads; create/edit flows work.",
            "",
        ],
        [
            "YA-ADM-079",
            "Create FAQ",
            "Create a new FAQ from FAQs page.",
            "FAQ is saved and visible in list.",
            "",
        ],
        [
            "YA-ADM-080",
            "Edit FAQ",
            "Open /help/faqs/:id/edit and update content.",
            "FAQ updates persist after save.",
            "",
        ],
        [
            "YA-ADM-081",
            "App reviews",
            "Navigate to /app-reviews (with permission).",
            "App ratings/reviews list and summary load correctly.",
            "",
        ],
        # Profile & settings
        [
            "YA-ADM-082",
            "Profile page",
            "Navigate to /profile.",
            "Current user profile information displays correctly.",
            "",
        ],
        [
            "YA-ADM-083",
            "Settings — subscription packages",
            "Open /settings > Subscription packages tab.",
            "Plans list loads; create/edit/delete plan dialogs work.",
            "",
        ],
        [
            "YA-ADM-084",
            "Settings — app versions",
            "Open /settings > App versions tab.",
            "App version records load; add/edit/delete version works.",
            "",
        ],
        [
            "YA-ADM-085",
            "Settings — security",
            "Open /settings > Security. Change password with validation rules.",
            "Validation enforced; successful change logs user out to re-authenticate.",
            "",
        ],
        [
            "YA-ADM-086",
            "Settings — appearance",
            "Open /settings > Appearance and switch theme mode.",
            "Theme preview and selection persist across sessions.",
            "",
        ],
        [
            "YA-ADM-087",
            "404 not found page",
            "Navigate to an invalid route (e.g., /unknown-page).",
            "Not found page displays with navigation option.",
            "",
        ],
    ]
    fill_table(tables[3], admin_cases)

    # --- Cross-system tests ---
    fill_table(
        tables[4],
        [
            [
                "SYS-001",
                "Admin content appears in mobile app",
                "Published course/practice/content changes in admin are reflected in the learner mobile app after sync/cache refresh.",
            ],
            [
                "SYS-002",
                "Subscription plan consistency",
                "Plans created/edited in Settings match offerings shown to learners and payment records.",
            ],
            [
                "SYS-003",
                "Bulk notification delivery (SMS/email/push/in-app)",
                "Immediate and scheduled sends from admin reach recipients on correct channel with accurate content and branding.",
            ],
            [
                "SYS-003a",
                "In-app WebSocket real-time delivery",
                "Learner app connected via GET /ws/connect?token= receives CREATED_NOTIFICATION when admin sends in-app bulk.",
            ],
            [
                "SYS-003b",
                "Scheduled job worker dispatch",
                "Pending scheduled job transitions to sent/failed within ~30s of scheduled_at; cancel prevents dispatch.",
            ],
            [
                "SYS-004",
                "RBAC enforcement",
                "Users without required permissions cannot access restricted routes or perform protected actions.",
            ],
            [
                "SYS-005",
                "Payment data accuracy",
                "Payment records in admin match backend transaction data and user subscription state.",
            ],
            [
                "SYS-006",
                "Audit trail completeness",
                "Critical admin actions (user status, content publish, role changes) appear in user activity log.",
            ],
            [
                "SYS-007",
                "Performance",
                "Key admin pages (dashboard, users list, content lists) load within acceptable time on staging.",
            ],
            [
                "SYS-008",
                "Session security",
                "Expired/invalid tokens force re-login; admin pages are not accessible after logout.",
            ],
        ],
    )

    # --- Defect log (empty template rows) ---
    fill_table(
        tables[5],
        [
            ["", "", "", "", "", ""],
            ["", "", "", "", "", ""],
            ["", "", "", "", "", ""],
        ],
    )

    # --- Sign-off ---
    fill_table(
        tables[6],
        [
            ["", "Business Owner / Product Owner", "", ""],
            ["", "UAT Lead", "", ""],
            ["", "Project Manager", "", ""],
        ],
    )

    doc.save(working_copy)
    shutil.copy2(working_copy, OUTPUT)
    working_copy.unlink(missing_ok=True)
    print(f"Updated: {OUTPUT}")


if __name__ == "__main__":
    replace_document()
