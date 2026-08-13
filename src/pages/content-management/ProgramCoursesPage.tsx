import { notifyApiError } from "../../lib/apiErrors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageBackLink } from "../../components/navigation/PageBackLink";
import { toast } from "sonner";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import uploadIcon from "../../assets/icons/upload.png";
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg";
import alertSrc from "../../assets/Alert.svg";
import {
  createProgramCourse,
  deleteTopLevelCourse,
  getLearningPrograms,
  getProgramCourses,
  setProgramCourseAccessTier,
  setProgramCoursePublishStatus,
  updateTopLevelCourse,
} from "../../api/courses.api";
import { ContentPublishStatusChip } from "./components/ContentPublishStatusChip";
import { ContentAccessTierChip } from "./components/ContentAccessTierChip";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import { ContentPageDescription } from "./components/ContentPageDescription";
import {
  filterBySearchAndPublishStatus,
  hasActiveContentFilters,
  type PublishStatusFilter,
} from "../../lib/contentListFilters";
import { uploadImageFile } from "../../api/files.api";
import type {
  ContentAccessTier,
  LearningProgramListItem,
  PracticePublishStatus,
  ProgramCourseListItem,
} from "../../types/course.types";
import { PublishPracticeButton } from "./components/PublishPracticeButton";
import { DisplayValue } from "../../lib/displayValue"
import { SearchHighlight } from "../../components/SearchHighlight"
import {
  fetchAllOffsetPages,
  offsetPageFromListEnvelope,
} from "../../lib/fetchAllOffsetPages";

export function ProgramCoursesPage() {
  const navigate = useNavigate();
  /** Route segment is the numeric program id (see Learn English program cards). */
  const { level: programIdParam } = useParams<{ level: string }>();
  const programId = Number(programIdParam);

  const [program, setProgram] = useState<LearningProgramListItem | null>(null);
  const [courses, setCourses] = useState<ProgramCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingCourse, setDeletingCourse] =
    useState<ProgramCourseListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingCourse, setEditingCourse] =
    useState<ProgramCourseListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false);
  const editThumbnailFileInputRef = useRef<HTMLInputElement>(null);

  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSortOrder, setCreateSortOrder] = useState("");
  const [createThumbnail, setCreateThumbnail] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createUploadingThumbnail, setCreateUploadingThumbnail] =
    useState(false);
  const createThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [publishStatusUpdatingId, setPublishStatusUpdatingId] = useState<
    number | null
  >(null);
  const [accessTierUpdatingId, setAccessTierUpdatingId] = useState<
    number | null
  >(null);
  const [listSearch, setListSearch] = useState("");
  const [publishStatusFilter, setPublishStatusFilter] =
    useState<PublishStatusFilter>("all");

  const filteredCourses = useMemo(
    () =>
      filterBySearchAndPublishStatus(courses, {
        search: listSearch,
        publishStatusFilter,
        getSearchFields: (c) => [c.name, c.description],
        getPublishStatus: (c) => c.publish_status,
      }),
    [courses, listSearch, publishStatusFilter],
  );

  const programIdValid = Number.isFinite(programId) && programId >= 1;

  const handleCoursePublishStatus = async (
    courseId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusUpdatingId(courseId);
    try {
      await setProgramCoursePublishStatus(courseId, {
        publish_status: nextStatus,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, publish_status: nextStatus } : c,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Course published"
          : "Course saved as draft",
      );
    } catch (e: unknown) {
      notifyApiError(e, "Failed to update course status");
    } finally {
      setPublishStatusUpdatingId(null);
    }
  };

  const handleCourseAccessTier = async (
    courseId: number,
    nextTier: ContentAccessTier,
  ) => {
    setAccessTierUpdatingId(courseId);
    try {
      await setProgramCourseAccessTier(courseId, { access_tier: nextTier });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, access_tier: nextTier } : c,
        ),
      );
      toast.success(
        nextTier === "PREMIUM" ? "Course set to Premium" : "Course set to Free",
      );
    } catch (e: unknown) {
      notifyApiError(e, "Failed to update course access tier");
    } finally {
      setAccessTierUpdatingId(null);
    }
  };

  const loadData = useCallback(async () => {
    if (!Number.isFinite(programId) || programId < 1) {
      setError("Invalid program");
      setLoading(false);
      setCourses([]);
      setProgram(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [courseList, programRows] = await Promise.all([
        fetchAllOffsetPages(async (offset, limit) =>
          offsetPageFromListEnvelope<ProgramCourseListItem>(
            await getProgramCourses(programId, { limit, offset }),
            "courses",
          ),
        ),
        fetchAllOffsetPages(async (offset, limit) =>
          offsetPageFromListEnvelope<LearningProgramListItem>(
            await getLearningPrograms({ limit, offset }),
            "programs",
          ),
        ),
      ]);

      const found = programRows.find((p) => p.id === programId) ?? null;
      setProgram(found);
      const sorted = [...courseList].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
      setCourses(sorted);
    } catch (e) {
      console.error(e);
      setError("Failed to load courses");
      setCourses([]);
      setProgram(null);
      notifyApiError(e, "Could not load courses");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleConfirmDeleteCourse = async () => {
    if (!deletingCourse) return;
    setDeleting(true);
    try {
      await deleteTopLevelCourse(deletingCourse.id);
      toast.success("Course deleted");
      setDeletingCourse(null);
      await loadData();
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  const openEditCourse = (course: ProgramCourseListItem) => {
    setEditingCourse(course);
    setEditName(course.name ?? "");
    setEditDescription(course.description?.trim() ?? "");
    setEditThumbnail(
      course.thumbnail?.trim() || course.thumbnail_url?.trim() || "",
    );
    setEditSortOrder(String(course.sort_order ?? 0));
  };

  const closeEditCourse = () => {
    setEditingCourse(null);
    setEditName("");
    setEditDescription("");
    setEditSortOrder("");
    setEditThumbnail("");
    setUploadingEditThumbnail(false);
    if (editThumbnailFileInputRef.current) {
      editThumbnailFileInputRef.current.value = "";
    }
  };

  const handleEditCourseThumbnailFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image is too large", {
        description: "Maximum size is 5 MB.",
      });
      return;
    }
    setUploadingEditThumbnail(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) {
        throw new Error("Upload did not return a file URL");
      }
      setEditThumbnail(url);
      toast.success("Thumbnail uploaded");
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to upload thumbnail");
    } finally {
      setUploadingEditThumbnail(false);
    }
  };

  const handleSaveEditCourse = async () => {
    if (!editingCourse) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Course name is required");
      return;
    }
    const sortOrderRaw = editSortOrder.trim();
    if (!sortOrderRaw) {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setSavingEdit(true);
    try {
      await updateTopLevelCourse(editingCourse.id, {
        name,
        description: editDescription.trim(),
        thumbnail: editThumbnail.trim(),
        sort_order,
      });
      toast.success("Course updated");
      closeEditCourse();
      await loadData();
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to update course");
    } finally {
      setSavingEdit(false);
    }
  };

  const clearCreateCourseForm = () => {
    setCreateName("");
    setCreateDescription("");
    setCreateSortOrder("");
    setCreateThumbnail("");
    setCreateUploadingThumbnail(false);
    if (createThumbnailFileInputRef.current) {
      createThumbnailFileInputRef.current.value = "";
    }
  };

  const handleCreateCourseDialogOpenChange = (open: boolean) => {
    if (!open && (createSaving || createUploadingThumbnail)) return;
    clearCreateCourseForm();
    setCreateCourseOpen(open);
  };

  const handleCreateCourseThumbnailFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image is too large", {
        description: "Maximum size is 5 MB.",
      });
      return;
    }
    setCreateUploadingThumbnail(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) {
        throw new Error("Upload did not return a file URL");
      }
      setCreateThumbnail(url);
      toast.success("Thumbnail uploaded");
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to upload thumbnail");
    } finally {
      setCreateUploadingThumbnail(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!programIdValid) return;
    const name = createName.trim();
    if (!name) {
      toast.error("Course name is required");
      return;
    }
    const sortOrderRaw = createSortOrder.trim();
    if (!sortOrderRaw) {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setCreateSaving(true);
    try {
      await createProgramCourse(programId, {
        name,
        description: createDescription.trim(),
        thumbnail: createThumbnail.trim(),
        sort_order,
      });
      toast.success("Course created");
      clearCreateCourseForm();
      setCreateCourseOpen(false);
      await loadData();
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to create course");
    } finally {
      setCreateSaving(false);
    }
  };

  const programTitle = !programIdValid
    ? "Program not found"
    : program?.name?.trim() || `Program ${programId}`;
  const programDescription =
    program?.description?.trim() ||
    (!loading && programIdValid && !program
      ? "Program details are unavailable. You can still browse courses below if they loaded."
      : "");

  return (
    <div className="space-y-8 pt-10">
      {/* Navigation */}
      <PageBackLink
        fallbackTo="/new-content/learn-english"
        label="Back to Programs"
        className="text-sm text-grayScale-500"
      />

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-grayScale-700">
            {programTitle}
          </h1>
          {programDescription ? (
            <ContentPageDescription className="text-[15px] text-grayScale-400">
              {programDescription}
            </ContentPageDescription>
          ) : loading ? (
            <div className="flex items-center gap-2 pt-1">
              <img src={spinnerSrc} alt="" className="h-6 w-6 animate-spin" />
            </div>
          ) : null}
        </div>

        <div className="flex gap-3">
          {programIdValid ? (
            <>
              <Dialog
                open={createCourseOpen}
                onOpenChange={handleCreateCourseDialogOpenChange}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    className="rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Courses
                  </Button>
                </DialogTrigger>
                <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-2xl flex-col gap-0 overflow-hidden border-none p-0">
                  <div className="shrink-0">
                    <DialogHeader className="p-8 pb-4">
                      <DialogTitle className="text-2xl font-bold text-grayScale-700">
                        Add New Course
                      </DialogTitle>
                      <DialogDescription className="text-sm text-grayScale-400">
                        Add a new course to this program. Use an image URL or
                        upload a file for the thumbnail.
                      </DialogDescription>
                    </DialogHeader>

                    {/* Gradient Divider */}
                    <div className="relative">
                      <div
                        className="absolute inset-0 flex items-center"
                        aria-hidden="true"
                      >
                        <div className="w-full border-t border-grayScale-100" />
                      </div>
                      <div className="relative flex justify-center">
                        <div
                          className="h-[0.5px] w-full opacity-20 rounded-full"
                          style={{
                            background: "gray",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleCreateCourse();
                    }}
                  >
                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-8 py-4">
                      <div className="space-y-2">
                        <label className="text-[15px] font-medium text-grayScale-700">
                          Course Name
                        </label>
                        <Input
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          placeholder="e.g. Introduction to German A1"
                          className="h-12 rounded-xl"
                          disabled={createSaving || createUploadingThumbnail}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[15px] font-medium text-grayScale-700">
                          Description
                        </label>
                        <Textarea
                          value={createDescription}
                          onChange={(e) => setCreateDescription(e.target.value)}
                          placeholder="Short summary of the course"
                          rows={3}
                          className="min-h-[88px] resize-y rounded-xl"
                          disabled={createSaving || createUploadingThumbnail}
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="create-course-sort-order"
                          className="text-[15px] font-medium text-grayScale-700"
                        >
                          Sort Order
                        </label>
                        <Input
                          id="create-course-sort-order"
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={createSortOrder}
                          onChange={(e) => setCreateSortOrder(e.target.value)}
                          placeholder="e.g. 5"
                          className="h-12 rounded-xl"
                          disabled={createSaving || createUploadingThumbnail}
                        />
                        <p className="text-xs text-grayScale-500">
                          Lower numbers appear first when courses are listed.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[15px] font-medium text-grayScale-700">
                          Thumbnail
                        </label>
                        <input
                          ref={createThumbnailFileInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) =>
                            void handleCreateCourseThumbnailFile(e)
                          }
                          disabled={createSaving || createUploadingThumbnail}
                        />
                        <button
                          type="button"
                          className="relative w-full cursor-pointer rounded-[6px] border-2 border-dashed border-[#9E289133] bg-white p-10 text-left transition-all hover:border-[#9E289180] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={createSaving || createUploadingThumbnail}
                          onClick={() =>
                            createThumbnailFileInputRef.current?.click()
                          }
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="mb-4">
                              <img
                                src={uploadIcon}
                                alt=""
                                className="h-10 w-10"
                              />
                            </div>
                            <p className="text-sm">
                              <span className="font-bold text-[#9E2891]">
                                {createUploadingThumbnail
                                  ? "Uploading…"
                                  : "Click to upload"}
                              </span>{" "}
                              <span className="text-grayScale-500">
                                or paste a URL below
                              </span>
                            </p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-grayScale-400">
                              JPG, PNG (max 5 MB)
                            </p>
                          </div>
                        </button>
                        {createThumbnail.trim() ? (
                          <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                            <img
                              src={createThumbnail.trim()}
                              alt=""
                              className="h-28 w-full object-cover"
                            />
                          </div>
                        ) : null}
                        <Input
                          value={createThumbnail}
                          onChange={(e) => setCreateThumbnail(e.target.value)}
                          className="h-12 rounded-xl"
                          placeholder="https://…"
                          disabled={createSaving || createUploadingThumbnail}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 justify-end gap-3 border-t border-grayScale-100 bg-white px-8 py-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 min-w-[120px] rounded-[6px] border-grayScale-200 font-semibold"
                        disabled={createSaving || createUploadingThumbnail}
                        onClick={() =>
                          handleCreateCourseDialogOpenChange(false)
                        }
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="h-12 min-w-[160px] rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
                        disabled={createSaving || createUploadingThumbnail}
                      >
                        {createSaving ? "Creating…" : "Create Course"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
        </div>
      </div>

      {/* Gradient Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-grayScale-200" />
        </div>
        <div className="relative flex justify-center">
          <div
            className="h-[0.5px] w-full opacity-20 rounded-full"
            style={{
              background: "gray",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
        </div>
      ) : error && courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-6 py-14 text-center">
          <img src={alertSrc} alt="" className="h-10 w-10" />
          <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void loadData()}
          >
            Try again
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-grayScale-600">
            No courses in this program yet
          </p>
          <p className="mt-1 text-sm text-grayScale-400">
            Add courses using the button above when the flow is connected to the
            API.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <ContentListSearchFilterBar
            search={listSearch}
            onSearchChange={setListSearch}
            publishStatusFilter={publishStatusFilter}
            onPublishStatusFilterChange={setPublishStatusFilter}
            searchPlaceholder="Search courses by name or description…"
            searchAriaLabel="Search courses"
          />
          {filteredCourses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-grayScale-600">
                No courses match your search or status filter
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-10">
              {filteredCourses.map((course) => {
                const modules =
                  course.module_count ?? course.modules_count ?? 0;
                const lessons = course.lesson_count ?? course.videos_count ?? 0;
                const practices =
                  course.practice_count ?? course.practices_count ?? 0;
                const thumbnailSrc =
                  course.thumbnail?.trim() ||
                  course.thumbnail_url?.trim() ||
                  "";
                return (
                  <Card
                    key={course.id}
                    className="group relative w-[350px] overflow-hidden border border-grayScale-100 shadow-soft transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="absolute right-2 top-2 z-10 flex translate-y-1 gap-1 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-[6px] bg-white/95 text-grayScale-600 shadow-sm transition-colors hover:bg-white"
                        aria-label={`Edit ${course.name}`}
                        onClick={() => openEditCourse(course)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-[6px] bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                        aria-label={`Delete ${course.name}`}
                        onClick={() => setDeletingCourse(course)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={
                        thumbnailSrc
                          ? {
                              backgroundImage: `url(${thumbnailSrc})`,
                            }
                          : {
                              background:
                                "linear-gradient(135deg, #9E289180 0%, #9E2891 100%)",
                            }
                      }
                    />
                    <CardContent className="p-6">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <ContentPublishStatusChip
                          publishStatus={course.publish_status}
                          updating={publishStatusUpdatingId === course.id}
                          contentLabel="course"
                          onToggle={(nextStatus) =>
                            void handleCoursePublishStatus(
                              course.id,
                              nextStatus,
                            )
                          }
                        />
                        <ContentAccessTierChip
                          accessTier={course.access_tier}
                          updating={accessTierUpdatingId === course.id}
                          contentLabel="course"
                          onToggle={(nextTier) =>
                            void handleCourseAccessTier(course.id, nextTier)
                          }
                        />
                      </div>
                      <h3 className="text-xl font-bold text-grayScale-700">
                        <SearchHighlight text={course.name} query={listSearch} />
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-grayScale-500 line-clamp-2">
                        <DisplayValue value={course.description} query={listSearch} />
                      </p>

                      <div className="my-6 grid grid-cols-3 gap-4 border-y border-grayScale-50 py-4">
                        <div className="text-center">
                          <p className="text-base font-bold text-grayScale-700">
                            {modules}
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-grayScale-400">
                            Modules
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-grayScale-700">
                            {lessons}
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-grayScale-400">
                            Lessons
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-grayScale-700">
                            {practices}
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-grayScale-400">
                            Practices
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="h-10 flex-1 rounded-[6px] border-brand-500 text-[13px] font-semibold text-brand-500 "
                          onClick={() =>
                            navigate(
                              `/new-content/learn-english/${programIdParam}/courses/${course.id}`,
                            )
                          }
                        >
                          View Detail
                        </Button>
                        <PublishPracticeButton
                          parentKind="COURSE"
                          parentId={course.id}
                          className="h-10 flex-1 rounded-[6px] bg-brand-500 text-[13px] font-semibold hover:bg-brand-600 disabled:opacity-60"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={editingCourse !== null}
        onOpenChange={(open) => {
          if (!open && (savingEdit || uploadingEditThumbnail)) return;
          if (!open) closeEditCourse();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-lg flex-col gap-0 overflow-hidden p-0">
           <DialogHeader className="shrink-0 space-y-1.5 border-b border-grayScale-100 px-6 pb-4 pt-6 pr-14">
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>
              Update name, description, sort order, and thumbnail.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">
                  Name
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl"
                  placeholder="Course name"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="min-h-[100px] resize-y rounded-xl"
                  placeholder="Short summary of the course"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="edit-course-sort-order"
                  className="text-sm font-medium text-grayScale-700"
                >
                  Sort Order
                </label>
                <Input
                  id="edit-course-sort-order"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="rounded-xl"
                  placeholder="e.g. 5"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <p className="text-xs text-grayScale-500">
                  Lower numbers appear first when courses are listed.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">
                  Thumbnail
                </label>
                <input
                  ref={editThumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleEditCourseThumbnailFile(e)}
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 rounded-[6px] border-grayScale-200 font-semibold"
                    disabled={savingEdit || uploadingEditThumbnail}
                    onClick={() => editThumbnailFileInputRef.current?.click()}
                  >
                    {uploadingEditThumbnail
                      ? "Uploading…"
                      : "Upload from computer"}
                  </Button>
                  {editThumbnail.trim() ? (
                    <div className="flex-1 overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                      <img
                        src={editThumbnail.trim()}
                        alt=""
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
                <Input
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  className="rounded-xl"
                  placeholder="Or paste image URL (https://…)"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-grayScale-100 bg-white px-6 py-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditCourse}
              disabled={savingEdit || uploadingEditThumbnail}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-brand-500 hover:bg-brand-600"
              disabled={savingEdit || uploadingEditThumbnail}
              onClick={() => void handleSaveEditCourse()}
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-grayScale-700">
                Delete course
              </h2>
              <button
                type="button"
                onClick={() => !deleting && setDeletingCourse(null)}
                disabled={deleting}
                className="grid h-8 w-8 place-items-center rounded-[6px] text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-center text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-grayScale-700">
                  {deletingCourse.name}
                </span>
                ? This cannot be undone. Related modules and content may be
                affected depending on your backend.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingCourse(null)}
                disabled={deleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full bg-red-500 shadow-sm transition-all hover:bg-red-600 hover:shadow-md sm:w-auto"
                disabled={deleting}
                onClick={() => void handleConfirmDeleteCourse()}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
