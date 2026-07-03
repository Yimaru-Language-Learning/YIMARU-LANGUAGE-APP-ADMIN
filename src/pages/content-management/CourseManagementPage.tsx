import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  PlayCircle,
  ClipboardCheck,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowRight,
  X,
  FileText,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { PracticeActionButton } from "./components/PracticeActionButton";
import { CatalogCoursePracticesPanel } from "./components/CatalogCoursePracticesPanel";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import uploadIcon from "../../assets/icons/upload.png";
import { toast } from "sonner";
import { ResolvedImage } from "../../components/media/ResolvedImage";
import {
  createExamPrepCatalogUnit,
  getExamPrepCatalogCourses,
  setExamPrepCatalogCoursePublishStatus,
  setExamPrepCatalogUnitAccessTier,
  setExamPrepCatalogUnitPublishStatus,
  updateExamPrepCatalogUnit,
  deleteExamPrepCatalogUnit,
  getExamPrepCatalogUnits,
} from "../../api/courses.api";
import { uploadImageFile } from "../../api/files.api";
import { ContentPublishStatusChip } from "./components/ContentPublishStatusChip";
import { ContentAccessTierChip } from "./components/ContentAccessTierChip";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import { ContentPageDescription } from "./components/ContentPageDescription";
import type { ContentAccessTier, PracticePublishStatus } from "../../types/course.types";
import {
  filterBySearchAndPublishStatus,
  type PublishStatusFilter,
} from "../../lib/contentListFilters";

export function CourseManagementPage() {
  const navigate = useNavigate();
  const { programType, courseId } = useParams<{
    programType: string;
    courseId: string;
  }>();
  const catalogCourseId = Number(courseId);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSortOrder, setCreateSortOrder] = useState("");
  const [createThumbnail, setCreateThumbnail] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const createThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [units, setUnits] = useState<
    Array<{
      id: number;
      name: string;
      description: string;
      thumbnail: string;
      sortOrder: number;
      publishStatus: PracticePublishStatus | string | null;
      accessTier: ContentAccessTier | string | null;
      modules: number;
      lessons: number;
      practices: number;
      gradient: string;
    }>
  >([]);
  const [publishStatusUpdatingId, setPublishStatusUpdatingId] = useState<
    number | null
  >(null);
  const [accessTierUpdatingId, setAccessTierUpdatingId] = useState<
    number | null
  >(null);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("1");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false);
  const editThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<number | null>(null);
  const [deletingUnit, setDeletingUnit] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [publishStatusFilter, setPublishStatusFilter] =
    useState<PublishStatusFilter>("all");
  const [catalogCourseName, setCatalogCourseName] = useState("Course");
  const [catalogCourseDescription, setCatalogCourseDescription] = useState("");
  const [catalogCoursePublishStatus, setCatalogCoursePublishStatus] = useState<
    PracticePublishStatus | string | null
  >(null);
  const [catalogCoursePublishStatusUpdating, setCatalogCoursePublishStatusUpdating] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"units" | "practices">("units");

  const catalogCoursePracticePathOptions = useMemo(
    () => ({
      isExamPrep: true as const,
      programType,
      courseId: String(catalogCourseId),
      backTo: "courses",
    }),
    [programType, catalogCourseId],
  );

  const filteredUnits = useMemo(
    () =>
      filterBySearchAndPublishStatus(units, {
        search: listSearch,
        publishStatusFilter,
        getSearchFields: (u) => [u.name, u.description],
        getPublishStatus: (u) => u.publishStatus,
      }),
    [listSearch, publishStatusFilter, units],
  );

  const courseDisplayName = catalogCourseName;

  const loadCatalogCourse = useCallback(async () => {
    if (!Number.isFinite(catalogCourseId) || catalogCourseId < 1) return;
    try {
      const response = await getExamPrepCatalogCourses({ limit: 100, offset: 0 });
      const rows = response.data?.data?.catalog_courses;
      const list = Array.isArray(rows) ? rows : [];
      const row = list.find((c) => Number(c.id) === catalogCourseId);
      if (row) {
        setCatalogCourseName(row.name?.trim() || `Course ${catalogCourseId}`);
        setCatalogCourseDescription(row.description?.trim() || "");
        setCatalogCoursePublishStatus(row.publish_status ?? null);
      }
    } catch (error) {
      console.error(error);
    }
  }, [catalogCourseId]);

  const loadUnits = useCallback(async () => {
    if (!Number.isFinite(catalogCourseId) || catalogCourseId < 1) {
      setUnits([]);
      return;
    }
    setUnitsLoading(true);
    try {
      const response = await getExamPrepCatalogUnits(catalogCourseId, {
        limit: 20,
        offset: 0,
      });
      const rows = response.data?.data?.units;
      const list = Array.isArray(rows) ? rows : [];
      setUnits(
        list.map((row, index) => ({
          id: Number(row.id),
          name: row.name?.trim() || `Unit ${row.id}`,
          description: row.description?.trim() || "—",
          thumbnail: row.thumbnail?.trim() || "",
          sortOrder: Number(row.sort_order ?? 0),
          publishStatus: row.publish_status ?? null,
          accessTier: row.access_tier ?? null,
          modules: Number(row.modules_count ?? 0),
          lessons: Number(row.lessons_count ?? row.videos_count ?? 0),
          practices: Number(row.practices_count ?? 0),
          gradient:
            index % 3 === 1
              ? "linear-gradient(135deg, rgba(79, 70, 229, 0.5) 0%, rgba(79, 70, 229, 0.8) 100%)"
              : index % 3 === 2
                ? "linear-gradient(135deg, rgba(124, 58, 237, 0.5) 0%, rgba(124, 58, 237, 0.8) 100%)"
                : "linear-gradient(135deg, rgba(158, 40, 145, 0.5) 0%, rgba(158, 40, 145, 0.8) 100%)",
        })),
      );
    } catch (error) {
      console.error(error);
      notifyApiError(error, "Failed to load units");
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, [catalogCourseId]);

  useEffect(() => {
    void loadCatalogCourse();
  }, [loadCatalogCourse]);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  const handleCatalogCoursePublishStatus = async (
    nextStatus: PracticePublishStatus,
  ) => {
    if (!Number.isFinite(catalogCourseId) || catalogCourseId < 1) return;
    setCatalogCoursePublishStatusUpdating(true);
    try {
      await setExamPrepCatalogCoursePublishStatus(catalogCourseId, {
        publish_status: nextStatus,
      });
      setCatalogCoursePublishStatus(nextStatus);
      toast.success(
        nextStatus === "PUBLISHED" ? "Course published" : "Course saved as draft",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update course status");
    } finally {
      setCatalogCoursePublishStatusUpdating(false);
    }
  };

  const handleUnitPublishStatus = async (
    unitId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusUpdatingId(unitId);
    try {
      await setExamPrepCatalogUnitPublishStatus(unitId, {
        publish_status: nextStatus,
      });
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unitId ? { ...u, publishStatus: nextStatus } : u,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED" ? "Unit published" : "Unit saved as draft",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update unit status");
    } finally {
      setPublishStatusUpdatingId(null);
    }
  };

  const handleUnitAccessTier = async (
    unitId: number,
    nextTier: ContentAccessTier,
  ) => {
    setAccessTierUpdatingId(unitId);
    try {
      await setExamPrepCatalogUnitAccessTier(unitId, { access_tier: nextTier });
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unitId ? { ...u, accessTier: nextTier } : u,
        ),
      );
      toast.success(
        nextTier === "PREMIUM" ? "Unit set to Premium" : "Unit set to Free",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update unit access tier");
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

  const resolveThumbnailToMinioUrl = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return "";
    if (!isHttpUrl(trimmed) || isMinioUrl(trimmed)) return trimmed;
    const uploaded = await uploadImageFile(trimmed);
    const uploadedUrl = uploaded.data?.data?.url?.trim();
    if (!uploadedUrl) throw new Error("Failed to upload thumbnail URL to MinIO");
    return uploadedUrl;
  };

  const clearCreateUnitForm = () => {
    setCreateName("");
    setCreateSortOrder("");
    setCreateThumbnail("");
    if (createThumbnailFileInputRef.current) {
      createThumbnailFileInputRef.current.value = "";
    }
  };

  const handleCreateUnitThumbnailFile = async (
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
      if (!url) throw new Error("Upload did not return a file URL");
      setCreateThumbnail(url);
      toast.success("Thumbnail uploaded");
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!Number.isFinite(catalogCourseId) || catalogCourseId < 1) {
      toast.error("Invalid catalog course");
      return;
    }
    const name = createName.trim();
    if (!name) {
      toast.error("Unit name is required");
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
    setCreating(true);
    try {
      const minioThumbnail = await resolveThumbnailToMinioUrl(createThumbnail);
      const response = await createExamPrepCatalogUnit(catalogCourseId, {
        name,
        description: null,
        thumbnail: minioThumbnail || null,
        sort_order,
      });
      void response;
      await loadUnits();
      toast.success("Unit created");
      clearCreateUnitForm();
      setAddUnitOpen(false);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to create unit");
    } finally {
      setCreating(false);
    }
  };

  const autoUploadCreateThumbnailUrl = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed || !isHttpUrl(trimmed) || isMinioUrl(trimmed)) return;
    setUploadingThumbnail(true);
    try {
      const minioUrl = await resolveThumbnailToMinioUrl(trimmed);
      if (minioUrl && minioUrl !== trimmed) {
        setCreateThumbnail(minioUrl);
        toast.success("Thumbnail uploaded to MinIO");
      }
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload URL to MinIO");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const autoUploadEditThumbnailUrl = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed || !isHttpUrl(trimmed) || isMinioUrl(trimmed)) return;
    setUploadingEditThumbnail(true);
    try {
      const minioUrl = await resolveThumbnailToMinioUrl(trimmed);
      if (minioUrl && minioUrl !== trimmed) {
        setEditThumbnail(minioUrl);
        toast.success("Thumbnail uploaded to MinIO");
      }
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload URL to MinIO");
    } finally {
      setUploadingEditThumbnail(false);
    }
  };

  const openEditUnit = (unit: (typeof units)[number]) => {
    setEditingUnitId(unit.id);
    setEditName(unit.name ?? "");
    setEditThumbnail(unit.thumbnail ?? "");
    setEditSortOrder(String(unit.sortOrder ?? 0));
  };

  const closeEditUnit = () => {
    if (savingEdit || uploadingEditThumbnail) return;
    setEditingUnitId(null);
    setEditName("");
    setEditThumbnail("");
    setEditSortOrder("");
  };

  const handleEditUnitThumbnailFile = async (
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

  const handleSaveEditUnit = async () => {
    if (!editingUnitId) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Unit name is required");
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
      const existing = units.find((u) => u.id === editingUnitId);
      const preservedDescription =
        existing?.description && existing.description !== "—"
          ? existing.description
          : null;
      const minioThumbnail = await resolveThumbnailToMinioUrl(editThumbnail);
      await updateExamPrepCatalogUnit(editingUnitId, {
        name,
        description: preservedDescription,
        thumbnail: minioThumbnail || null,
        sort_order,
      });
      await loadUnits();
      toast.success("Unit updated");
      closeEditUnit();
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to update unit");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnitId) return;
    setDeletingUnit(true);
    try {
      await deleteExamPrepCatalogUnit(deletingUnitId);
      await loadUnits();
      toast.success("Unit deleted");
      setDeletingUnitId(null);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to delete unit");
    } finally {
      setDeletingUnit(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to={`/new-content/courses/${programType}`}
        className="flex items-center gap-2.5 text-[15px] font-semibold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to Courses
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ContentPublishStatusChip
              publishStatus={catalogCoursePublishStatus}
              updating={catalogCoursePublishStatusUpdating}
              contentLabel="course"
              onToggle={(nextStatus) =>
                void handleCatalogCoursePublishStatus(nextStatus)
              }
            />
          </div>
          <h1 className="text-[28px] font-medium tracking-tight text-grayScale-900">
            {courseDisplayName}
          </h1>
          {catalogCourseDescription ? (
            <ContentPageDescription className="text-[15px] font-medium text-grayScale-500">
              {catalogCourseDescription}
            </ContentPageDescription>
          ) : (
            <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-grayScale-500">
              Manage units and practices inside {courseDisplayName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Dialog
            open={addUnitOpen}
            onOpenChange={(open) => {
              if (!open && (creating || uploadingThumbnail)) return;
              setAddUnitOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white shadow-sm hover:bg-brand-600 transition-all flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
              <div className="flex min-h-0 flex-1 flex-col bg-white">
                <DialogHeader className="shrink-0 px-8 py-6 border-b border-grayScale-200 flex flex-row items-center justify-between">
                  <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                    Create Unit
                  </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Unit Name
                    </label>
                    <Input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. Reading"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                      disabled={creating || uploadingThumbnail}
                    />
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="create-unit-sort-order"
                      className="text-[15px] text-grayScale-800"
                    >
                      Sort Order
                    </label>
                    <Input
                      id="create-unit-sort-order"
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={createSortOrder}
                      onChange={(e) => setCreateSortOrder(e.target.value)}
                      placeholder="e.g. 0"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                      disabled={creating || uploadingThumbnail}
                    />
                    <p className="text-xs text-grayScale-500">
                      Lower numbers appear first when units are listed.
                    </p>
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
                      onChange={(e) => void handleCreateUnitThumbnailFile(e)}
                      disabled={creating || uploadingThumbnail}
                    />
                    <button
                      type="button"
                      className="relative group w-full cursor-pointer"
                      onClick={() => createThumbnailFileInputRef.current?.click()}
                      disabled={creating || uploadingThumbnail}
                    >
                      <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all ">
                        <div className="mb-4">
                          <img
                            src={uploadIcon}
                            alt="Upload icon"
                            className="h-10 w-10"
                          />
                        </div>
                        <p className="text-[15px]">
                          <span className="text-brand-500 font-bold hover:underline">
                            {uploadingThumbnail ? "Uploading…" : "Click to upload"}
                          </span>{" "}
                          <span className="text-grayScale-500">
                            or paste a URL below
                          </span>
                        </p>
                        <p className="mt-1.5 text-[12px] text-grayScale-400 uppercase tracking-widest">
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
                      onChange={(e) => setCreateThumbnail(e.target.value)}
                      onPaste={(event) => {
                        const pasted = event.clipboardData?.getData("text")?.trim();
                        if (!pasted) return;
                        setTimeout(() => {
                          void autoUploadCreateThumbnailUrl(pasted);
                        }, 0);
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
                      type="button"
                      variant="outline"
                      className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                      disabled={creating || uploadingThumbnail}
                      onClick={clearCreateUnitForm}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                    disabled={creating || uploadingThumbnail}
                    onClick={() => void handleCreateUnit()}
                  >
                    {creating ? "Creating..." : "Create Unit"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <PracticeActionButton
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-brand-500 text-brand-500 font-bold flex items-center gap-2 shadow-sm"
            pathOptions={catalogCoursePracticePathOptions}
            parentLabel={courseDisplayName}
          >
            <FileText className="h-5 w-5" />
            Attach Practice
          </PracticeActionButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-grayScale-200">
        <div className="flex gap-10">
          <button
            type="button"
            onClick={() => setActiveTab("units")}
            className={cn(
              "pb-4 text-[16px] font-medium transition-all relative",
              activeTab === "units"
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-t-full"
                : "text-grayScale-400 hover:text-grayScale-600",
            )}
          >
            Units
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("practices")}
            className={cn(
              "pb-4 text-[16px] font-medium transition-all relative",
              activeTab === "practices"
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-t-full"
                : "text-grayScale-400 hover:text-grayScale-600",
            )}
          >
            Practices
          </button>
        </div>
      </div>

      {/* Horizontal Divider */}
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

      {/* Grid of Units / Practices */}
      <div className="space-y-4 pt-4">
        {activeTab === "practices" ? (
          <CatalogCoursePracticesPanel
            catalogCourseId={catalogCourseId}
            programType={programType ?? "proficiency"}
            courseName={courseDisplayName}
          />
        ) : (
        <>
        {!unitsLoading && units.length > 0 ? (
          <ContentListSearchFilterBar
            search={listSearch}
            onSearchChange={setListSearch}
            publishStatusFilter={publishStatusFilter}
            onPublishStatusFilterChange={setPublishStatusFilter}
            searchPlaceholder="Search units by name or description…"
            searchAriaLabel="Search units"
          />
        ) : null}
        <div className="flex flex-wrap gap-4">
        {unitsLoading ? (
          <p className="text-sm text-grayScale-500">Loading units...</p>
        ) : units.length === 0 ? (
          <div className="w-full rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
            <p className="text-sm font-medium text-grayScale-600">
              No units for this course yet
            </p>
            <p className="mt-1 text-sm text-grayScale-400">
              Create your first unit to start organizing modules, lessons, and practices.
            </p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="w-full rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
            <p className="text-sm font-medium text-grayScale-600">
              No units match your search or status filter
            </p>
          </div>
        ) : (
          filteredUnits.map((unit) => (
          <Card
            key={unit.id}
            className="group relative flex w-[400px] flex-col h-full bg-white rounded-[12px] border border-grayScale-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="absolute right-2 top-2 z-10 flex translate-y-1 gap-1 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-md bg-white/95 text-grayScale-600 shadow-sm transition-colors hover:bg-white"
                onClick={() => openEditUnit(unit)}
                aria-label={`Edit ${unit.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-md bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                onClick={() => setDeletingUnitId(unit.id)}
                aria-label={`Delete ${unit.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Gradient Header */}
            <div
              className="relative h-36 w-full overflow-hidden transition-transform duration-500"
              style={{ background: unit.gradient }}
            >
              {unit.thumbnail ? (
                <ResolvedImage
                  src={unit.thumbnail}
                  alt={`${unit.name} thumbnail`}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </div>

            <div className="p-4 flex flex-col flex-1 space-y-6">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <ContentPublishStatusChip
                    publishStatus={unit.publishStatus}
                    updating={publishStatusUpdatingId === unit.id}
                    contentLabel="unit"
                    onToggle={(nextStatus) =>
                      void handleUnitPublishStatus(unit.id, nextStatus)
                    }
                  />
                  <ContentAccessTierChip
                    accessTier={unit.accessTier}
                    updating={accessTierUpdatingId === unit.id}
                    contentLabel="unit"
                    onToggle={(nextTier) =>
                      void handleUnitAccessTier(unit.id, nextTier)
                    }
                  />
                </div>
                <h3 className="text-[18px] font-medium text-grayScale-900  transition-colors">
                  {unit.name}
                </h3>
                <p className="text-[12px] text-grayScale-500 font-medium line-clamp-3">
                  {unit.description}
                </p>
              </div>

              {/* Stats Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="h-9 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <LayoutGrid className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {unit.modules} Modules
                  </span>
                </div>
                <div className="h-9 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <PlayCircle className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {unit.lessons} Lessons
                  </span>
                </div>
                <div className="h-9 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <ClipboardCheck className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {unit.practices} Practices
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full h-10 bg-brand-500  text-white rounded-[6px] font-bold flex items-center justify-center gap-2 group/btn"
                onClick={() =>
                  navigate(
                    `/new-content/courses/${programType}/${courseId}/${unit.id}`,
                  )
                }
              >
                View Detail
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
          ))
        )}
        </div>
        </>
        )}
      </div>

      <Dialog
        open={editingUnitId !== null}
        onOpenChange={(open) => {
          if (!open && (savingEdit || uploadingEditThumbnail)) return;
          if (!open) closeEditUnit();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <DialogHeader className="shrink-0 px-8 py-6 border-b border-grayScale-200 flex flex-row items-center justify-between">
              <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                Edit Unit
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Unit Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
              <div className="space-y-3">
                <label
                  htmlFor="edit-unit-sort-order"
                  className="text-[15px] text-grayScale-800"
                >
                  Sort Order
                </label>
                <Input
                  id="edit-unit-sort-order"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  placeholder="e.g. 0"
                  className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <p className="text-xs text-grayScale-500">
                  Lower numbers appear first when units are listed.
                </p>
              </div>
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Thumbnail</label>
                <input
                  ref={editThumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleEditUnitThumbnailFile(e)}
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <button
                  type="button"
                  className="relative group w-full cursor-pointer"
                  onClick={() => editThumbnailFileInputRef.current?.click()}
                  disabled={savingEdit || uploadingEditThumbnail}
                >
                  <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all ">
                    <div className="mb-4">
                      <img src={uploadIcon} alt="Upload icon" className="h-10 w-10" />
                    </div>
                    <p className="text-[15px]">
                      <span className="text-brand-500 font-bold hover:underline">
                        {uploadingEditThumbnail ? "Uploading…" : "Click to upload"}
                      </span>{" "}
                      <span className="text-grayScale-500">or paste a URL below</span>
                    </p>
                    <p className="mt-1.5 text-[12px] text-grayScale-400 uppercase tracking-widest">
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
                  onPaste={(event) => {
                    const pasted = event.clipboardData?.getData("text")?.trim();
                    if (!pasted) return;
                    setTimeout(() => {
                      void autoUploadEditThumbnailUrl(pasted);
                    }, 0);
                  }}
                  placeholder="Optional thumbnail URL (or leave empty for null)"
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
            </div>
            <div className="shrink-0 px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-50 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                disabled={savingEdit || uploadingEditThumbnail}
                onClick={closeEditUnit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                disabled={savingEdit || uploadingEditThumbnail}
                onClick={() => void handleSaveEditUnit()}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingUnitId !== null}
        onOpenChange={(open) => {
          if (!open && !deletingUnit) setDeletingUnitId(null);
        }}
      >
        <DialogContent className="max-w-md rounded-[16px] border-none p-0 overflow-hidden">
          <div className="bg-white">
            <DialogHeader className="border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <DialogTitle className="text-lg font-bold text-grayScale-900">
                Delete Unit
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6 text-sm text-grayScale-600">
              Are you sure you want to delete this unit? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-3 border-t border-grayScale-100 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setDeletingUnitId(null)}
                disabled={deletingUnit}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => void handleDeleteUnit()}
                disabled={deletingUnit}
              >
                {deletingUnit ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
