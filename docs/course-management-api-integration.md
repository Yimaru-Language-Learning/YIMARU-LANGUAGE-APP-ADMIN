# Course Management API Integration Guide

This document describes the Course Management related APIs used by the admin frontend (`Yimaru-Admin`) and how to integrate them safely.

It is based on:
- `src/api/courses.api.ts`
- `src/api/files.api.ts`
- `src/types/course.types.ts`
- `src/api/http.ts`

---

## 1) Base setup and auth behavior

### Base URL
- All requests use `VITE_API_BASE_URL` from environment.

### Authentication
- Access token is sent automatically as `Authorization: Bearer <access_token>`.
- On `401`, the frontend attempts token refresh via:
  - `POST /auth/refresh`
  - payload: `{ access_token, refresh_token, role, member_id }`
- If refresh fails, auth data is cleared and user is redirected to `/login`.

### Transport notes
- Axios automatically handles `multipart/form-data` boundaries for file upload.
- Any network failure without response also redirects to `/login` (current client behavior).

---

## 2) Core domain model used by frontend

Current hierarchy used by content management:
- `Category`
  - `Sub-category`
    - `Course`
      - `Level (CEFR)`
        - `Module`
          - `Sub-module`
            - `Videos`
            - `Lessons` (question sets with `set_type = QUIZ`)
            - `Practices` (question sets with `set_type = PRACTICE`)

Important migration note:
- Some APIs/types are marked as legacy (`Program`, old `Level/Module` flows).
- Current frontend mostly uses unified hierarchy endpoints under `/course-management/...` plus `/question-sets` and `/questions`.

---

## 3) File/media APIs (used by course management)

## 3.1 Upload media

### Endpoint
- `POST /files/upload`

### Supports
- `media_type`: `"image" | "audio" | "video"`
- File upload via multipart (`file`) or URL import via JSON (`source_url`).

### For video uploads
- Can send optional `title` and `description`.

### Typical response fields used by frontend
- `data.object_key`
- `data.url`
- `data.provider` (`MINIO` or `VIMEO`)
- `data.vimeo_id`
- `data.embed_url`

### Frontend wrapper functions
- `uploadAudioFile(fileOrUrl)`
- `uploadImageFile(fileOrUrl)`
- `uploadVideoFile(fileOrUrl, { title?, description? })`

## 3.2 Resolve object key to URL

### Endpoint
- `GET /files/url?key=<object_key>`

### Use case
- Resolve media object key when only key is stored.

---

## 4) Category and course APIs

## 4.1 Get categories (normalized in frontend)

### Endpoint called
- `GET /course-management/hierarchy`

### Frontend behavior
- Client transforms flat hierarchy rows into category list.
- Duplicated category names are merged client-side by "richest" record.

### Wrapper
- `getCourseCategories()`

## 4.2 Create category or sub-category

### Category
- `POST /course-management/categories`
- body: `{ name }`

### Sub-category
- `POST /course-management/sub-categories`
- body: `{ category_id, name }`

### Wrapper
- `createCourseCategory({ name, parent_id? })`
  - if `parent_id` exists, creates sub-category; else category.

## 4.3 Delete category/sub-category
- `DELETE /course-management/categories/:categoryId`
- `DELETE /course-management/sub-categories/:subCategoryId`

Wrappers:
- `deleteCourseCategory(categoryId)`
- `deleteCourseSubCategory(subCategoryId)`

## 4.4 Courses by category

### Endpoint called
- `GET /course-management/hierarchy`

### Frontend behavior
- Filters and maps rows to courses client-side.
- If duplicate category names exist, it includes rows matching requested category name.

Wrapper:
- `getCoursesByCategory(categoryId)`

## 4.5 Course CRUD
- `POST /course-management/courses`
- `PUT /course-management/courses/:courseId`
- `PUT /course-management/courses/:courseId` (status toggle via `is_active`)
- `DELETE /course-management/courses/:courseId`
- `POST /course-management/courses/:courseId/thumbnail`

Wrappers:
- `createCourse(data)`
- `updateCourse(courseId, data)`
- `updateCourseStatus(courseId, isActive)`
- `deleteCourse(courseId)`
- `updateCourseThumbnail(courseId, thumbnailUrl)`

---

## 5) Course hierarchy (levels/modules/sub-modules)

## 5.1 Get full hierarchy for one course

### Endpoint
- `GET /course-management/courses/:courseId/hierarchy`

### Wrapper
- `getSubModulesByCourse(courseId)`

### Frontend behavior
- Maps hierarchy rows into `sub_courses` shape (compatibility naming).
- This is the primary source for module/sub-module tree rendering.

## 5.2 Create sub-module flow (composed)

`createSubModule(data)` is a multi-step client workflow:
1. `POST /course-management/levels`
2. `POST /course-management/modules`
3. `POST /course-management/sub-modules`

Use this when creating a new sub-module from minimal info.

## 5.3 Direct level/module/sub-module creation
- `createModuleInLevel(levelId, title, description, displayOrder?)`
  - `POST /course-management/modules`
- `createSubModuleInModule(moduleId, title, description, displayOrder?)`
  - `POST /course-management/sub-modules`

## 5.4 Update/delete sub-module
- `PUT /course-management/sub-modules/:subModuleId`
- `PUT /course-management/sub-modules/:subModuleId` (status payload)
- `DELETE /course-management/sub-modules/:subModuleId`
- `POST /course-management/sub-courses/:subModuleId/thumbnail` (compat endpoint)

Wrappers:
- `updateSubModule(...)`
- `updateSubModuleStatus(...)`
- `deleteSubModule(...)`
- `updateSubModuleThumbnail(...)`

---

## 6) Video APIs (sub-module videos)

## 6.1 List videos for sub-module
- `GET /course-management/sub-modules/:subModuleId/videos`
- wrapper: `getVideosBySubModule(subModuleId)`

## 6.2 Create video

Two wrapper variants, same endpoint:
- `POST /course-management/sub-module-videos`

### Minimal variant
- `createSubCourseVideo({ sub_module_id|sub_course_id, title, description, video_url })`

### Extended variant
- `createCourseVideo({ sub_module_id|sub_course_id, title, description, video_url, duration, resolution?, visibility?, display_order?, status? })`

## 6.3 Update/delete video
- `PUT /course-management/sub-module-videos/:videoId`
- `DELETE /course-management/sub-module-videos/:videoId`

Wrappers:
- `updateSubCourseVideo(videoId, data)`
- `deleteSubCourseVideo(videoId)`

---

## 7) Practices and lessons

## 7.1 Practices by sub-module
- `GET /question-sets/by-owner?owner_type=SUB_MODULE&owner_id=:subModuleId`
- wrapper: `getPracticesBySubModule(subModuleId)`

## 7.2 Create practice (composed)

`createPractice(data)` does:
1. `POST /question-sets`
   - `set_type: "PRACTICE"`
   - `owner_type: "SUB_MODULE"`
   - `owner_id: sub_module_id`
2. If step 1 succeeds, links to sub-module practice:
   - `POST /course-management/sub-module-practices`
   - includes `question_set_id` and intro metadata

## 7.3 Create lesson (composed)

`createLesson(data)` does:
1. `POST /question-sets`
   - `set_type: "QUIZ"`
   - `owner_type: "SUB_MODULE"`
2. Link question set as lesson:
   - `POST /course-management/sub-module-lessons`

## 7.4 Practice update/delete/status
- `PUT /course-management/practices/:practiceId`
- `PUT /course-management/practices/:practiceId` (status)
- `DELETE /course-management/practices/:practiceId`

Wrappers:
- `updatePractice(...)`
- `updatePracticeStatus(...)`
- `deletePractice(...)`

---

## 8) Question sets and questions

## 8.1 Question sets
- `GET /question-sets` with optional query params
- `GET /question-sets/by-owner`
- `GET /question-sets/:id`
- `PUT /question-sets/:id`
- `DELETE /question-sets/:id`
- `POST /question-sets`

Wrappers:
- `getQuestionSets(params?)`
- `getQuestionSetsByOwner(ownerType, ownerId)`
- `getQuestionSetById(questionSetId)`
- `createQuestionSet(data)`
- `updateQuestionSet(questionSetId, partialData)`
- `deleteQuestionSet(questionSetId)`

## 8.2 Question list within set
- `GET /question-sets/:questionSetId/questions`
- `POST /question-sets/:questionSetId/questions` (add by question id)

Wrappers:
- `getQuestionSetQuestions(questionSetId)`
- `addQuestionToSet(questionSetId, { question_id, display_order? })`

## 8.3 Questions CRUD
- `GET /questions` (filters)
- `GET /questions/:questionId`
- `POST /questions`
- `PUT /questions/:questionId`
- `DELETE /questions/:questionId`

Wrappers:
- `getQuestions(params)`
- `getQuestionById(questionId)`
- `createQuestion(data)`
- `updateQuestion(questionId, data)`
- `deleteQuestion(questionId)`

## 8.4 Practice-question convenience wrappers

`createPracticeQuestion(data)`:
1. Creates question via `POST /questions`
2. Adds it to practice set via `POST /question-sets/:practiceId/questions`

`updatePracticeQuestion(questionId, data)`:
- maps to `PUT /questions/:questionId`

`deletePracticeQuestion(questionId)`:
- `DELETE /questions/:questionId`

## 8.5 Practice question listing endpoint variants
- `getPracticeQuestions(practiceId)` -> `GET /question-sets/:practiceId/questions`
- `getPracticeQuestionsByPractice(practiceId, params)` -> `GET /practices/:practiceId/questions`

Use the second when you need pagination/filtering by question type.

---

## 9) Human language specific APIs

## 9.1 Human language hierarchy
- `getHumanLanguageHierarchy()`
- Calls `GET /course-management/hierarchy`
- If backend already returns nested `sub_categories`, uses it directly.
- If backend returns flat rows, client builds nested structure and enriches each course by:
  - requesting `/course-management/courses/:courseId/hierarchy`
  - requesting `/question-sets/by-owner` per sub-module
  - deriving lessons from question sets where `set_type = "QUIZ"`

This method is heavier than basic endpoints and can issue many requests.

## 9.2 Human language lessons by course+level
- `GET /course-management/human-language/courses/:courseId/lessons?cefr_level=...`
- wrapper: `getHumanLanguageLessonsByCourse(courseId, cefrLevel)`

## 9.3 Create human language lesson structure

`createHumanLanguageLesson(data)` is composed:
1. `POST /course-management/levels`
2. `POST /course-management/modules`
3. `POST /course-management/sub-modules`

---

## 10) Learning path and assessments

- `GET /course-management/courses/:courseId/learning-path`
  - wrapper: `getLearningPath(courseId)`

- `GET /question-sets/sub-courses/:subModuleId/entry-assessment`
  - wrapper: `getSubModuleEntryAssessment(subModuleId)`

---

## 11) Unsupported or stubbed features in current frontend API layer

The following wrappers are intentionally stubbed in frontend and return resolved promises (no real backend call):
- `getSubModulePrerequisites`
- `addSubModulePrerequisite`
- `removeSubModulePrerequisite`
- `reorderCategories`
- `reorderCourses`
- `reorderSubModules`
- `reorderVideos`
- `reorderPractices`

Implication:
- UI may appear to support these flows, but persistence is not implemented through backend yet.

---

## 12) Legacy endpoints still exposed (backward compatibility)

These are still present in `courses.api.ts` but marked deprecated in types:
- Programs APIs
- Old levels APIs
- Old modules APIs
- Practices by level/module APIs

Prefer unified hierarchy/sub-module/question-set APIs for new work.

---

## 13) Integration patterns and recommendations

## 13.1 Safe creation flows
- For practice/lesson creation, keep composed behavior:
  - create question set first
  - then link to sub-module entity
- Handle partial failure:
  - if link step fails after question set creation, frontend should show recoverable error and optionally support manual relink.

## 13.2 Request normalization
- `getQuestionSetsResponse.data` can be either:
  - raw array
  - object with `question_sets`
- Normalize before rendering.

## 13.3 Question type mapping
- UI uses `"SHORT"`; backend commonly expects `"SHORT_ANSWER"`.
- Existing wrappers already map `"SHORT"` to `"SHORT_ANSWER"` on create/update practice question.

## 13.4 Media handling
- Prefer using `/files/upload` wrappers for all media.
- For Vimeo-backed responses, frontend typically consumes `embed_url` (and may append hash from page URL where applicable).

## 13.5 Retry behavior
- Some hierarchy fetches use single retry (`withSingleRetry`) for resiliency against transient auth/network race conditions.

---

## 14) Quick endpoint index

### Course management
- `GET /course-management/hierarchy`
- `POST /course-management/categories`
- `POST /course-management/sub-categories`
- `DELETE /course-management/categories/:id`
- `DELETE /course-management/sub-categories/:id`
- `POST /course-management/courses`
- `PUT /course-management/courses/:id`
- `DELETE /course-management/courses/:id`
- `POST /course-management/courses/:id/thumbnail`
- `GET /course-management/courses/:courseId/hierarchy`
- `POST /course-management/levels`
- `POST /course-management/modules`
- `PUT /course-management/levels/:id`
- `DELETE /course-management/levels/:id`
- `PUT /course-management/modules/:id`
- `DELETE /course-management/modules/:id`
- `POST /course-management/sub-modules`
- `PUT /course-management/sub-modules/:id`
- `DELETE /course-management/sub-modules/:id`
- `GET /course-management/sub-modules/:subModuleId/videos`
- `POST /course-management/sub-module-videos`
- `PUT /course-management/sub-module-videos/:id`
- `DELETE /course-management/sub-module-videos/:id`
- `POST /course-management/sub-module-practices`
- `POST /course-management/sub-module-lessons`
- `GET /course-management/courses/:courseId/learning-path`
- `GET /course-management/human-language/courses/:courseId/lessons`

### Question sets and questions
- `GET /question-sets`
- `GET /question-sets/by-owner`
- `GET /question-sets/:id`
- `POST /question-sets`
- `PUT /question-sets/:id`
- `DELETE /question-sets/:id`
- `GET /question-sets/:id/questions`
- `POST /question-sets/:id/questions`
- `GET /practices/:practiceId/questions`
- `GET /questions`
- `GET /questions/:id`
- `POST /questions`
- `PUT /questions/:id`
- `DELETE /questions/:id`
- `POST /questions/audio-answer`

### File/media
- `POST /files/upload`
- `GET /files/url`
- `GET /vimeo/sample`
- `POST /vimeo/uploads/pull`

---

## 15) Suggested frontend service contract shape

For any new frontend module, follow this contract:
- **Input DTOs**: UI-friendly types (can include UI aliases like `SHORT`)
- **Mapper layer**: convert UI DTOs to backend DTOs
- **Transport layer**: pure API calls
- **Normalizer layer**: normalize polymorphic responses (`array` vs `object`)
- **Error policy**:
  - show user-actionable toast
  - preserve enough context to retry failed composed steps

This keeps integration robust even with mixed legacy/unified backend surfaces.

