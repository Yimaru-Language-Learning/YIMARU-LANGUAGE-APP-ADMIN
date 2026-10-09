# Admin and backend regression tests

Coverage: Admin commits after `07c651fd177594325132b4e9562bf7b0f1231c34` and backend commits after `38e9f81372f39c9ba32a17a677d4b064c8facb6a`, including uncommitted realtime fixes and merged features. Mobile counterpart: [Mobile regression tests](../Yimaru-Mobile/TESTING.md).

## Setup

Use staging and disposable records. Prepare users with different saved age groups/genders, English and Amharic gender values, missing profile fields, and Active/Pending/Expired/Never subscribed states. Use Admin and a content-manager account for permission checks. Send notifications only to test accounts. Use a second browser session, network throttling, or a QA proxy for timing/failure cases.

## Users and CSV export

- [ ] A01 — Select each Age group, then each Gender on Users and access → All users → check matching users and totals; age means the saved profile group, not a calculated date of birth. Male/Female must match equivalent Amharic values too.
- [ ] A01b — Select Gender → Unassigned → check only users with NULL or blank gender appear, with correct totals across pages. Combine it with Age group, then export CSV → check the same filters apply. Select All genders → check assigned users return.
- [ ] A02 — Combine age + gender + country/subscription/date/search filters; paginate → check every row satisfies all selected filters. Change a filter from page 2 → check pagination resets to page 1.
- [ ] A03 — Clear filters or select All age groups/All genders → check restrictions and active-filter counts reset; users with missing age/gender reappear.
- [ ] A04 — Search a known full name with leading/trailing/repeated spaces and mixed casing → check the same matching users; also test email and phone searches.
- [ ] A05 — Select historical Created on/after and Created on/before times in EAT, then export CSV → check filters are sent, rows match the on-screen criteria across all pages, and EAT converts to UTC correctly (10:00 EAT → 07:00Z). Repeat in a browser using another timezone.
- [ ] A06 — Throttle requests and rapidly change filters/pages; make an older request fail after the latest succeeds → check stale responses do not replace current rows/totals, stop the current loading indicator, or show stale error toasts. Leave the page during loading → check no late updates/toasts.

## Notification audiences and schedules

- [ ] A07 — Select Pending, Expired, and Never subscribed individually when creating a platform notification → check preview/recipient counts match each group. Never subscribed excludes anyone with any subscription history.
- [ ] A08 — Select Pending + Expired together and add country/age/plan filters → check statuses form an OR union, other filters still narrow it, and recipients are not duplicated. Clear to Any status → check the subscription restriction disappears.
- [ ] A09 — Inspect selected options and use keyboard navigation → check labels/checkmarks remain readable. Send/schedule to the selected test audience → check actual recipients match the preview, including recipients beyond the first page.
- [ ] A10 — Schedule a future test notification; open row actions → View details, then Cancel job → check details load, cancellation updates status, and the job is not delivered. Check terminal jobs do not offer cancellation; past scheduling times must still be rejected.

## Dashboard and analytics

- [ ] A11 — Open Dashboard/Analytics, change a KPI using a test registration/payment, and wait about 20 seconds or press Refresh → check KPI values update and the “KPI data updated” banner appears without reloading the page.
- [ ] A12 — Wait through unchanged polls, then change date/category filters → check neither an unchanged result nor a new filter baseline produces a false update banner. Scroll down before a real update → check the banner remains visible; dismiss it and check it stays dismissed until another change.
- [ ] A13 — Hide the browser tab, then return → check polling pauses while hidden and refreshes on return. Force a background fetch failure → check previous figures stay visible and retries back off. Delay a response while changing filters → check the old response is ignored.
- [ ] A14 — Select a historical month on Dashboard, then add a sandbox payment in a different month of that year → check the yearly revenue card refreshes independently while the selected month's figures remain unchanged.

## Payments and plans

- [ ] A15 — Open list and detail views for SUCCESS, PENDING, FAILED, EXPIRED, and CANCELLED payments → check green/amber/red/slate-clock/grey-x styling respectively, with consistent labels in both views; unknown statuses remain readable.
- [ ] A16 — Paginate/filter Payments and inspect network requests → check rows use server pagination rather than fetching the entire dataset, totals/statistics cover the filtered set, and opening details still works.
- [ ] A17 — Create a valid Free subscription plan with price 0, then try a negative price or a Paid plan priced 0 → check the valid free plan saves and invalid price/category combinations are rejected.

## Content authoring

- [ ] A18 — Search “Duolingo English Test” as `duolingoenglishtest`, with extra spaces, and mixed casing → check matching courses and highlights; clearing search restores the list and publication filtering still works.
- [ ] A19 — Create/edit a skill-based course → check it saves and appears in the correct catalogue. Create an exam-prep catalogue course without a category, then with IELTS/Duolingo → check a category is required and the selected category persists.
- [ ] A20 — Create/edit lesson, module, and course practices with an explicit story title/description and formatted quick tips → check fields remain available, lesson titles are not silently substituted, and rich text survives save/reopen/review.
- [ ] A21 — Open a Learn English course/module/lesson already owning a direct practice before opening its Practice tab → check Add Practice is disabled. Open one without a direct practice → check creation is available.

## Realtime backend and permissions

Keep the corresponding lesson open in Mobile; repeat in LMS and exam prep.

- [ ] A22 — Save a lesson rename/description/reorder or publish/unpublish → check Mobile updates without manual refresh. Fail the write before commit → check no false change is emitted. Reconnect after a missed event → check REST restores current data.
- [ ] A23 — Create, publish/unpublish, unlink, move, and delete lesson-linked practices, including publication through the full-practice editor → check practice buttons update in affected modules; moves refresh both old and new modules, with no duplicate module events per mutation.
- [ ] A24 — Unpublish/delete each parent level and change Free/Premium access → check Mobile refreshes child availability. Request both the lesson list and lesson detail as a learner → check hidden ancestors return 404, missing subscription returns 403 where required, and a temporary database failure returns 500 rather than a successful empty result.
- [ ] A25 — Request those same hidden lesson lists/details as an authorized Admin/content manager → check editing access remains available. Try subscribing to a hidden hierarchy as a learner → check denial, while already-subscribed clients still receive the invalidation that hides their content.
- [ ] A26 — Use a QA API client: `/api/v1/users?age_group=18_24&gender=female`, mixed-case equivalents, CSV export with the same filters, and `subscription_status=PENDING,EXPIRED,NEVER_SUBSCRIBED` → check matching results/union semantics. Send an invalid subscription status → check HTTP 400; legacy `Unsubscribed` remains supported.
- [ ] A27 — Pause practice publication after its parent lookup; request a move from another session → check the move waits until publication commits, then both modules refresh correctly. Repeat through the full-practice editor, reverse the request order, and overlap moves A → B → C → check intermediate modules lose the practice button and C gains it. Force a transaction/commit failure → check the change rolls back with no realtime event.

Run the Mobile guide for denied-subscription retries, full lesson pagination, network recovery, logout/account switching, video behavior, payment fallback, and Android token registration. No new schema migration is required for the three realtime gap fixes. Cross-instance realtime delivery is not provided by the current in-memory hub.
