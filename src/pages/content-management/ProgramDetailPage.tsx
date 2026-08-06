import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  ListChecks,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { ResolvedImage } from "../../components/media/ResolvedImage";
import {
  createExamPrepCatalogCourse,
  getExamPrepCatalogCourses,
  setExamPrepCatalogCourseAccessTier,
  setExamPrepCatalogCoursePublishStatus,
  updateExamPrepCatalogCourse,
  deleteExamPrepCatalogCourse,
} from "../../api/courses.api";
import { ContentPublishStatusChip } from "./components/ContentPublishStatusChip";
import { ContentAccessTierChip } from "./components/ContentAccessTierChip";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import { ContentPageDescription } from "./components/ContentPageDescription";
import type { ContentAccessTier, PracticePublishStatus } from "../../types/course.types";
import {
  filterBySearchAndPublishStatus,
  hasActiveContentFilters,
  type PublishStatusFilter,
} from "../../lib/contentListFilters";
import { uploadImageFile } from "../../api/files.api";
import uploadIcon from "../../assets/icons/upload.png";
import { DisplayValue } from "../../lib/displayValue"
import { SearchHighlight } from "../../components/SearchHighlight"

export function ProgramDetailPage() {
  const navigate = useNavigate();
  const { programType } = useParams<{ programType: string }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createThumbnail, setCreateThumbnail] = useState("");
  const [createThumbnailFromUpload, setCreateThumbnailFromUpload] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const createThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [createdCourses, setCreatedCourses] = useState<
    {
      id: number;
      name: string;
      description: string;
      thumbnail?: string | null;
      sortOrder: number;
      publishStatus: PracticePublishStatus | string | null;
      accessTier: ContentAccessTier | string | null;
      unitsCount: number;
      modulesCount: number;
      lessonsCount: number;
    }[]
  >([]);
  const [publishStatusUpdatingId, setPublishStatusUpdatingId] = useState<
    number | null
  >(null);
  const [accessTierUpdatingId, setAccessTierUpdatingId] = useState<
    number | null
  >(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("1");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false);
  const editThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  const [deletingCourse, setDeletingCourse] = useState(false);

  // Mock data for "proficiency" program type
  const programs: Record<string, any> = {
    proficiency: {
      title: "Duolingo/IELTS",
      description:
        "Manage Duolingo/IELTS learning programs.",
      courses: [],
    },
    "skill-based": {
      title: "Skill-Based Courses",
      description:
        "Practice-focused communication and skills training for real-world scenarios.",
      courses: [], // To be implemented or shown if needed
    },
  };

  const currentProgram =
    programs[programType || "proficiency"] || programs.proficiency;

  const loadCatalogCourses = useCallback(async () => {
    if (programType !== "proficiency") return;
    setCatalogLoading(true);
    try {
      const response = await getExamPrepCatalogCourses({ limit: 20, offset: 0 });
      const rows = response.data?.data?.catalog_courses;
      const list = Array.isArray(rows) ? rows : [];
      setCreatedCourses(
        list.map((row) => ({
          id: Number(row.id),
          name: row.name?.trim() || `Course ${row.id}`,
          description: row.description?.trim() || "",
          thumbnail: row.thumbnail?.trim() || null,
          sortOrder: Number(row.sort_order ?? 0),
          publishStatus: row.publish_status ?? null,
          accessTier: row.access_tier ?? null,
          unitsCount: Number(row.units_count ?? 0),
          modulesCount: Number(row.modules_count ?? 0),
          lessonsCount: Number(row.lessons_count ?? 0),
        })),
      );
    } catch (error) {
      console.error(error);
      notifyApiError(error, "Failed to fetch catalog courses");
      setCreatedCourses([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [programType]);

  useEffect(() => {
    void loadCatalogCourses();
  }, [loadCatalogCourses]);
  const proficiencyCourses = useMemo(
    () => [
      ...currentProgram.courses,
      ...createdCourses.map((course) => ({
        id: course.id,
        name: course.name,
        description: course.description,
        units_count: course.unitsCount,
        modules_count: course.modulesCount,
        lessons_count: course.lessonsCount,
        logo: null,
        thumbnail: course.thumbnail ?? "",
        sort_order: course.sortOrder,
        publish_status: course.publishStatus,
        access_tier: course.accessTier,
        buttonText: "View Detail",
      })),
    ],
    [createdCourses, currentProgram.courses],
  );
  const [listSearch, setListSearch] = useState("");
  const [publishStatusFilter, setPublishStatusFilter] =
    useState<PublishStatusFilter>("all");

  const filteredProficiencyCourses = useMemo(
    () =>
      filterBySearchAndPublishStatus(proficiencyCourses, {
        search: listSearch,
        publishStatusFilter,
        getSearchFields: (c) => [c.name, c.description],
        getPublishStatus: (c) => c.publish_status,
      }),
    [listSearch, proficiencyCourses, publishStatusFilter],
  );

  const handleCoursePublishStatus = async (
    courseId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusUpdatingId(courseId);
    try {
      await setExamPrepCatalogCoursePublishStatus(courseId, {
        publish_status: nextStatus,
      });
      setCreatedCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, publishStatus: nextStatus } : c,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED" ? "Course published" : "Course saved as draft",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update course status");
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
      await setExamPrepCatalogCourseAccessTier(courseId, {
        access_tier: nextTier,
      });
      setCreatedCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, accessTier: nextTier } : c,
        ),
      );
      toast.success(
        nextTier === "PREMIUM" ? "Course set to Premium" : "Course set to Free",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update course access tier");
    } finally {
      setAccessTierUpdatingId(null);
    }
  };

  const isHttpUrl = (value: string) =>
    value.startsWith("http://") || value.startsWith("https://");

  const isMinioUrl = (value: string) => {
    try {
      const url = new URL(value);
      return url.host === "s3.yimaruacademy.com";
    } catch {
      return false;
    }
  };

  const autoUploadThumbnailUrlIfNeeded = async (rawValue: string) => {
    const candidate = rawValue.trim();
    if (!candidate) return;
    if (!isHttpUrl(candidate)) return;
    if (isMinioUrl(candidate)) return;
    if (uploadingThumbnail || creating) return;

    setUploadingThumbnail(true);
    try {
      const uploaded = await uploadImageFile(candidate);
      const uploadedUrl = uploaded.data?.data?.url?.trim();
      if (!uploadedUrl) {
        throw new Error("Failed to upload thumbnail URL to MinIO");
      }
      setCreateThumbnail(uploadedUrl);
      setCreateThumbnailFromUpload(true);
      toast.success("Thumbnail URL uploaded to MinIO");
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload thumbnail URL");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const resolveThumbnailToMinioUrl = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return "";
    if (!isHttpUrl(trimmed) || isMinioUrl(trimmed)) return trimmed;
    const uploaded = await uploadImageFile(trimmed);
    const uploadedUrl = uploaded.data?.data?.url?.trim();
    if (!uploadedUrl) {
      throw new Error("Failed to upload thumbnail URL to MinIO");
    }
    return uploadedUrl;
  };

  const handleCreateCourse = async () => {
    if (programType !== "proficiency") {
      toast.error("Create Course is supported only for proficiency catalog.");
      return;
    }
    const name = createName.trim();
    if (!name) {
      toast.error("Course name is required");
      return;
    }
    setCreating(true);
    try {
      let thumbnailToSend: string | null = createThumbnail.trim() || null;
      if (
        thumbnailToSend &&
        !createThumbnailFromUpload &&
        isHttpUrl(thumbnailToSend) &&
        !isMinioUrl(thumbnailToSend)
      ) {
        const uploaded = await uploadImageFile(thumbnailToSend);
        const uploadedUrl = uploaded.data?.data?.url?.trim();
        if (!uploadedUrl) {
          throw new Error("Failed to upload thumbnail URL to MinIO");
        }
        thumbnailToSend = uploadedUrl;
      }

      const response = await createExamPrepCatalogCourse({
        name,
        description: null,
        thumbnail: thumbnailToSend,
      });
      const row = response.data?.data;
      if (!row?.id) {
        throw new Error("Missing created course payload");
      }
      setCreatedCourses((prev) => [
        {
          id: row.id,
          name: row.name ?? name,
          description: row.description?.trim() || "",
          thumbnail: row.thumbnail?.trim() || null,
          sortOrder: Number(row.sort_order ?? 0),
          unitsCount: Number(row.units_count ?? 0),
          modulesCount: Number(row.modules_count ?? 0),
          lessonsCount: Number(row.lessons_count ?? 0),
        },
        ...prev,
      ]);
      await loadCatalogCourses();
      toast.success("Course created");
      setCreateName("");
      setCreateThumbnail("");
      setCreateThumbnailFromUpload(false);
      setCreateOpen(false);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  const openEditCourse = (course: (typeof proficiencyCourses)[number]) => {
    const idNum = Number(course.id);
    if (!Number.isFinite(idNum)) return;
    setEditingCourseId(idNum);
    setEditName(String(course.name ?? ""));
    setEditThumbnail(String(course.thumbnail ?? ""));
    setEditSortOrder(String(course.sort_order ?? 1));
  };

  const closeEditCourse = () => {
    if (savingEdit || uploadingEditThumbnail) return;
    setEditingCourseId(null);
    setEditName("");
    setEditThumbnail("");
    setEditSortOrder("1");
  };

  const handleEditThumbnailFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploadingEditThumbnail(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) throw new Error("Upload did not return a file URL");
      setEditThumbnail(url);
      toast.success("Thumbnail uploaded");
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload thumbnail");
    } finally {
      setUploadingEditThumbnail(false);
    }
  };

  const handleSaveEditCourse = async () => {
    if (!editingCourseId) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Course name is required");
      return;
    }
    const sortOrderNum = Number(editSortOrder);
    if (!Number.isFinite(sortOrderNum) || sortOrderNum < 0) {
      toast.error("Sort order must be a valid number");
      return;
    }

    setSavingEdit(true);
    try {
      const minioThumbnail = await resolveThumbnailToMinioUrl(editThumbnail);
      const existing = createdCourses.find((c) => c.id === editingCourseId);
      const preservedDescription =
        typeof existing?.description === "string" ? existing.description.trim() || null : null;
      const response = await updateExamPrepCatalogCourse(editingCourseId, {
        name,
        description: preservedDescription,
        thumbnail: minioThumbnail || null,
        sort_order: sortOrderNum,
      });
      const row = response.data?.data;
      setCreatedCourses((prev) =>
        prev.map((course) =>
          course.id === editingCourseId
            ? {
                ...course,
                name: row?.name ?? name,
                description: row?.description?.trim() || preservedDescription || "",
                thumbnail: row?.thumbnail?.trim() || null,
                sortOrder: Number(row?.sort_order ?? sortOrderNum),
                unitsCount: Number(row?.units_count ?? course.unitsCount ?? 0),
                modulesCount: Number(row?.modules_count ?? course.modulesCount ?? 0),
                lessonsCount: Number(row?.lessons_count ?? course.lessonsCount ?? 0),
              }
            : course,
        ),
      );
      await loadCatalogCourses();
      toast.success("Course updated");
      closeEditCourse();
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to update course");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourseId) return;
    setDeletingCourse(true);
    try {
      await deleteExamPrepCatalogCourse(deletingCourseId);
      await loadCatalogCourses();
      toast.success("Course deleted");
      setDeletingCourseId(null);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to delete course");
    } finally {
      setDeletingCourse(false);
    }
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
      toast.error("Image is too large", { description: "Maximum size is 5 MB." });
      return;
    }
    setUploadingThumbnail(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) {
        throw new Error("Upload did not return a file URL");
      }
      setCreateThumbnail(url);
      setCreateThumbnailFromUpload(true);
      toast.success("Thumbnail uploaded");
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to="/new-content/courses"
        className="flex items-center gap-2.5 text-[15px] font-semibold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-[26px] font-medium tracking-tight text-grayScale-900">
            {currentProgram.title}
          </h1>
          <ContentPageDescription className="text-[15px] font-medium text-grayScale-500">
            {currentProgram.description}
          </ContentPageDescription>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              if (!open && (creating || uploadingThumbnail)) return;
              setCreateOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white transition-all flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
              <div className="flex min-h-0 flex-1 flex-col bg-white">
                <DialogHeader className="shrink-0 border-b border-grayScale-200 px-8 py-6 pr-14 flex flex-row items-center justify-between">
                  <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                    Create Course
                  </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-8">
                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Name
                    </label>
                    <Input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. TOEFL, IELTS"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                      disabled={creating}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Thumbnail
                    </label>
                    <input
                      ref={createThumbnailFileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleCreateCourseThumbnailFile(e)}
                      disabled={creating || uploadingThumbnail}
                    />
                    <button
                      type="button"
                      className="relative w-full cursor-pointer rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white px-10 py-8 text-left transition-all hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={creating || uploadingThumbnail}
                      onClick={() => createThumbnailFileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-4">
                          <img src={uploadIcon} alt="" className="h-10 w-10" />
                        </div>
                        <p className="text-[15px]">
                          <span className="font-bold text-brand-500">
                            {uploadingThumbnail ? "Uploading…" : "Click to upload"}
                          </span>{" "}
                          <span className="text-grayScale-500">or paste a URL below</span>
                        </p>
                        <p className="mt-1.5 text-[12px] uppercase tracking-widest text-grayScale-400">
                          JPG, PNG (MAX 5 MB)
                        </p>
                      </div>
                    </button>
                    {createThumbnail.trim() ? (
                      <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                        <ResolvedImage
                          src={createThumbnail.trim()}
                          alt=""
                          className="h-28 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <Input
                      value={createThumbnail}
                      onChange={(e) => {
                        setCreateThumbnail(e.target.value);
                        setCreateThumbnailFromUpload(false);
                      }}
                      onBlur={(e) => {
                        void autoUploadThumbnailUrlIfNeeded(e.target.value);
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (!pasted) return;
                        setCreateThumbnail(pasted);
                        setCreateThumbnailFromUpload(false);
                        void autoUploadThumbnailUrlIfNeeded(pasted);
                      }}
                      placeholder="Optional thumbnail URL (or leave empty for null)"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                      disabled={creating || uploadingThumbnail}
                    />
                  </div>
                </div>

                <div className="shrink-0 px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-50 flex justify-end gap-3">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                      disabled={creating || uploadingThumbnail}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                    disabled={creating || uploadingThumbnail}
                    onClick={() => void handleCreateCourse()}
                  >
                    {creating ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

      {/* Cards Grid */}
      <div className="mt-10 space-y-6">
        {programType === "proficiency" && !catalogLoading && proficiencyCourses.length > 0 ? (
          <ContentListSearchFilterBar
            search={listSearch}
            onSearchChange={setListSearch}
            publishStatusFilter={publishStatusFilter}
            onPublishStatusFilterChange={setPublishStatusFilter}
            searchPlaceholder="Search courses by name or description…"
            searchAriaLabel="Search catalog courses"
          />
        ) : null}
        <div className="flex flex-wrap gap-8">
        {programType === "proficiency" && catalogLoading ? (
          <p className="text-sm text-grayScale-500">Loading catalog courses...</p>
        ) : null}
        {(programType === "proficiency"
          ? proficiencyCourses
          : currentProgram.courses
        ).length === 0 && !catalogLoading ? (
          <div className="w-full rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
            <p className="text-sm font-medium text-grayScale-600">
              No catalog courses yet
            </p>
            <p className="mt-1 text-sm text-grayScale-400">
              Create your first Duolingo/IELTS catalog course to start organizing units, modules, and lessons.
            </p>
          </div>
        ) : programType === "proficiency" && filteredProficiencyCourses.length === 0 ? (
          <div className="w-full rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
            <p className="text-sm font-medium text-grayScale-600">
              No courses match your search or status filter
            </p>
            {hasActiveContentFilters(listSearch, publishStatusFilter) ? (
              <p className="mt-1 text-sm text-grayScale-400">
                Try different keywords or clear the publish status filter.
              </p>
            ) : null}
          </div>
        ) : (
          (programType === "proficiency"
            ? filteredProficiencyCourses
            : currentProgram.courses
          ).map((course: any) => (
            <Card
              key={course.id}
              className="group relative bg-white w-[500px] rounded-[20px] border border-grayScale-100 p-6 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow"
            >
            {programType === "proficiency" ? (
              <div className="absolute right-3 top-3 z-10 flex translate-y-1 gap-1 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-md bg-white/95 text-grayScale-600 shadow-sm transition-colors hover:bg-white"
                  onClick={() => openEditCourse(course)}
                  aria-label={`Edit ${course.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-md bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                  onClick={() => setDeletingCourseId(Number(course.id))}
                  aria-label={`Delete ${course.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
            {/* Logo */}
            <div className="h-16 flex items-center">
              {course.thumbnail ? (
                <ResolvedImage
                  src={course.thumbnail}
                  alt={course.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : course.logo ? (
                course.logo
              ) : (
                <div className="h-14 w-14 rounded-full bg-brand-50 text-brand-600 grid place-items-center text-xs font-bold">
                  {String(course.name ?? "C").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-4 pt-2 flex-1">
              {programType === "proficiency" ? (
                <div className="flex flex-wrap gap-2">
                  <ContentPublishStatusChip
                    publishStatus={course.publish_status}
                    updating={publishStatusUpdatingId === Number(course.id)}
                    contentLabel="course"
                    onToggle={(nextStatus) =>
                      void handleCoursePublishStatus(Number(course.id), nextStatus)
                    }
                  />
                  <ContentAccessTierChip
                    accessTier={course.access_tier}
                    updating={accessTierUpdatingId === Number(course.id)}
                    contentLabel="course"
                    onToggle={(nextTier) =>
                      void handleCourseAccessTier(Number(course.id), nextTier)
                    }
                  />
                </div>
              ) : null}
              <h3 className="text-[18px] font-medium text-grayScale-900">
                <SearchHighlight text={course.name} query={listSearch} />
              </h3>
                <p className="text-[14px] text-grayScale-500 font-medium">
                <DisplayValue value={course.description} query={listSearch} />
              </p>
            </div>

            {/* Badges/Stats */}
            <div className="flex items-center pt-4 gap-4">
              <div className="h-10 px-4 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-700">
                <ClipboardList className="h-3 w-3 text-grayScale-400" />
                <span className="text-[12px] ">
                  {Number(course.units_count ?? 0)} Units
                </span>
              </div>
              <div className="h-10 px-4 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-700">
                <ListChecks className="h-3 w-3 text-grayScale-400" />
                <span className="text-[12px] ">
                  {Number(course.modules_count ?? 0)} Modules
                </span>
              </div>
              <div className="h-10 px-4 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-700">
                <ListChecks className="h-3 w-3 text-grayScale-400" />
                <span className="text-[12px] ">
                  {Number(course.lessons_count ?? 0)} Lessons
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full mt-4 h-10 bg-brand-500  text-white rounded-[8px] font-bold flex items-center justify-center gap-2 group/btn"
              onClick={() =>
                navigate(`/new-content/courses/${programType}/${course.id}`)
              }
            >
              {course.buttonText}
              <ChevronRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
            </Card>
          ))
        )}
        </div>
      </div>

      <Dialog
        open={editingCourseId !== null}
        onOpenChange={(open) => {
          if (!open && (savingEdit || uploadingEditThumbnail)) return;
          if (!open) closeEditCourse();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <DialogHeader className="shrink-0 border-b border-grayScale-200 px-8 py-6 pr-14 flex flex-row items-center justify-between">
              <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                Edit Course
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-8">
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Sort Order</label>
                <Input
                  type="number"
                  min={0}
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Thumbnail</label>
                <input
                  ref={editThumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleEditThumbnailFile(e)}
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <button
                  type="button"
                  className="relative w-full cursor-pointer rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white px-10 py-8 text-left transition-all hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => editThumbnailFileInputRef.current?.click()}
                  disabled={savingEdit || uploadingEditThumbnail}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-4">
                      <img src={uploadIcon} alt="" className="h-10 w-10" />
                    </div>
                    <p className="text-[15px]">
                      <span className="font-bold text-brand-500">
                        {uploadingEditThumbnail ? "Uploading…" : "Click to upload"}
                      </span>{" "}
                      <span className="text-grayScale-500">or paste a URL below</span>
                    </p>
                    <p className="mt-1.5 text-[12px] uppercase tracking-widest text-grayScale-400">
                      JPG, PNG (MAX 5 MB)
                    </p>
                  </div>
                </button>
                {editThumbnail.trim() ? (
                  <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                    <ResolvedImage
                      src={editThumbnail.trim()}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                  </div>
                ) : null}
                <Input
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                  placeholder="https://..."
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
            </div>
            <div className="shrink-0 px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-50 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                onClick={closeEditCourse}
                disabled={savingEdit || uploadingEditThumbnail}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                onClick={() => void handleSaveEditCourse()}
                disabled={savingEdit || uploadingEditThumbnail}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingCourseId !== null}
        onOpenChange={(open) => {
          if (!open && !deletingCourse) setDeletingCourseId(null);
        }}
      >
        <DialogContent className="max-w-md rounded-[16px] border-none p-0 overflow-hidden">
          <div className="bg-white">
            <DialogHeader className="border-b border-grayScale-100 px-4 py-4 pr-14 sm:px-6">
              <DialogTitle className="text-lg font-bold text-grayScale-900">
                Delete Course
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6 text-sm text-grayScale-600">
              Are you sure you want to delete this course? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-3 border-t border-grayScale-100 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setDeletingCourseId(null)}
                disabled={deletingCourse}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => void handleDeleteCourse()}
                disabled={deletingCourse}
              >
                {deletingCourse ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
