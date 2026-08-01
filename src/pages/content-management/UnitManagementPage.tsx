import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  MessageCircle,
  PlayCircle,
  ClipboardCheck,
  Pencil,
  Trash2,
  ArrowRight,
  X,
  FileText,
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
import uploadIcon from "../../assets/icons/upload.png";
import { toast } from "sonner";
import { ResolvedImage } from "../../components/media/ResolvedImage";
import {
  createExamPrepUnitModule,
  getExamPrepCatalogUnits,
  getExamPrepUnitModules,
  setExamPrepCatalogUnitPublishStatus,
  setExamPrepUnitModuleAccessTier,
  setExamPrepUnitModulePublishStatus,
  updateExamPrepUnitModule,
  deleteExamPrepUnitModule,
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
import { PracticeActionButton } from "./components/PracticeActionButton";
import { UnitPracticesPanel } from "./components/UnitPracticesPanel";
import { cn } from "../../lib/utils";

export function UnitManagementPage() {
  const navigate = useNavigate();
  const { programType, courseId, unitId } = useParams<{
    programType: string;
    courseId: string;
    unitId: string;
  }>();

  const parsedUnitId = Number(unitId);
  const catalogCourseId = Number(courseId);
  const [unitDisplayName, setUnitDisplayName] = useState("Unit");
  const [unitDescription, setUnitDescription] = useState("");
  const [unitPublishStatus, setUnitPublishStatus] = useState<
    PracticePublishStatus | string | null
  >(null);
  const [unitPublishStatusUpdating, setUnitPublishStatusUpdating] =
    useState(false);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createThumbnail, setCreateThumbnail] = useState("");
  const [createIcon, setCreateIcon] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const createThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const createIconFileInputRef = useRef<HTMLInputElement>(null);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modules, setModules] = useState<
    Array<{
      id: number;
      name: string;
      description: string;
      thumbnail: string;
      icon: string;
      sortOrder: number;
      publishStatus: PracticePublishStatus | string | null;
      accessTier: ContentAccessTier | string | null;
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
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("1");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false);
  const [uploadingEditIcon, setUploadingEditIcon] = useState(false);
  const editThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const editIconFileInputRef = useRef<HTMLInputElement>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);
  const [deletingModule, setDeletingModule] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [publishStatusFilter, setPublishStatusFilter] =
    useState<PublishStatusFilter>("all");
  const [activeTab, setActiveTab] = useState<"modules" | "practices">("modules");

  const unitPracticePathOptions = useMemo(
    () => ({
      isExamPrep: true as const,
      programType,
      courseId: String(catalogCourseId),
      unitId: String(parsedUnitId),
      backTo: "unit",
    }),
    [programType, catalogCourseId, parsedUnitId],
  );

  const filteredModules = useMemo(
    () =>
      filterBySearchAndPublishStatus(modules, {
        search: listSearch,
        publishStatusFilter,
        getSearchFields: (m) => [m.name, m.description],
        getPublishStatus: (m) => m.publishStatus,
      }),
    [listSearch, modules, publishStatusFilter],
  );

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

  const resolveToMinioUrl = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return "";
    if (!isHttpUrl(trimmed) || isMinioUrl(trimmed)) return trimmed;
    const uploaded = await uploadImageFile(trimmed);
    const uploadedUrl = uploaded.data?.data?.url?.trim();
    if (!uploadedUrl) throw new Error("Failed to upload URL to MinIO");
    return uploadedUrl;
  };

  const loadUnit = useCallback(async () => {
    if (
      !Number.isFinite(catalogCourseId) ||
      catalogCourseId < 1 ||
      !Number.isFinite(parsedUnitId) ||
      parsedUnitId < 1
    ) {
      return;
    }
    try {
      const response = await getExamPrepCatalogUnits(catalogCourseId, {
        limit: 100,
        offset: 0,
      });
      const rows = response.data?.data?.units;
      const list = Array.isArray(rows) ? rows : [];
      const row = list.find((u) => Number(u.id) === parsedUnitId);
      if (row) {
        setUnitDisplayName(row.name?.trim() || `Unit ${parsedUnitId}`);
        setUnitDescription(row.description?.trim() || "");
        setUnitPublishStatus(row.publish_status ?? null);
      } else {
        setUnitDisplayName(`Unit ${parsedUnitId}`);
        setUnitDescription("");
        setUnitPublishStatus(null);
      }
    } catch (error) {
      console.error(error);
      setUnitDisplayName(`Unit ${parsedUnitId}`);
    }
  }, [catalogCourseId, parsedUnitId]);

  const loadModules = useCallback(async () => {
    if (!Number.isFinite(parsedUnitId) || parsedUnitId < 1) {
      setModules([]);
      return;
    }
    setModulesLoading(true);
    try {
      const response = await getExamPrepUnitModules(parsedUnitId, {
        limit: 20,
        offset: 0,
      });
      const rows = response.data?.data?.modules;
      const list = Array.isArray(rows) ? rows : [];
      setModules(
        list.map((row, index) => ({
          id: Number(row.id),
          name: row.name?.trim() || `Module ${row.id}`,
          description: row.description?.trim() || "unassigned",
          thumbnail: row.thumbnail?.trim() || "",
          icon: row.icon?.trim() || "",
          sortOrder: Number(row.sort_order ?? 0),
          publishStatus: row.publish_status ?? null,
          accessTier: row.access_tier ?? null,
          lessons: Number(row.lessons_count ?? row.videos_count ?? 0),
          practices: Number(row.practices_count ?? 0),
          gradient:
            index % 3 === 1
              ? "linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(79, 70, 229, 0.7) 100%)"
              : index % 3 === 2
                ? "linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0.7) 100%)"
                : "linear-gradient(135deg, rgba(158, 40, 145, 0.4) 0%, rgba(158, 40, 145, 0.7) 100%)",
        })),
      );
    } catch (error) {
      console.error(error);
      notifyApiError(error, "Failed to load modules");
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  }, [parsedUnitId]);

  useEffect(() => {
    void loadUnit();
  }, [loadUnit]);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  const handleUnitPublishStatus = async (nextStatus: PracticePublishStatus) => {
    if (!Number.isFinite(parsedUnitId) || parsedUnitId < 1) return;
    setUnitPublishStatusUpdating(true);
    try {
      await setExamPrepCatalogUnitPublishStatus(parsedUnitId, {
        publish_status: nextStatus,
      });
      setUnitPublishStatus(nextStatus);
      toast.success(
        nextStatus === "PUBLISHED" ? "Unit published" : "Unit saved as draft",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update unit status");
    } finally {
      setUnitPublishStatusUpdating(false);
    }
  };

  const handleModulePublishStatus = async (
    moduleId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusUpdatingId(moduleId);
    try {
      await setExamPrepUnitModulePublishStatus(moduleId, {
        publish_status: nextStatus,
      });
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, publishStatus: nextStatus } : m,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED" ? "Module published" : "Module saved as draft",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update module status");
    } finally {
      setPublishStatusUpdatingId(null);
    }
  };

  const handleModuleAccessTier = async (
    moduleId: number,
    nextTier: ContentAccessTier,
  ) => {
    setAccessTierUpdatingId(moduleId);
    try {
      await setExamPrepUnitModuleAccessTier(moduleId, { access_tier: nextTier });
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, accessTier: nextTier } : m,
        ),
      );
      toast.success(
        nextTier === "PREMIUM" ? "Module set to Premium" : "Module set to Free",
      );
    } catch (error: unknown) {
      notifyApiError(error, "Failed to update module access tier");
    } finally {
      setAccessTierUpdatingId(null);
    }
  };

  const clearCreateModuleForm = () => {
    setCreateName("");
    setCreateThumbnail("");
    setCreateIcon("");
    if (createThumbnailFileInputRef.current) {
      createThumbnailFileInputRef.current.value = "";
    }
    if (createIconFileInputRef.current) {
      createIconFileInputRef.current.value = "";
    }
  };

  const handleCreateImageFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "thumbnail" | "icon",
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    if (target === "thumbnail") {
      setUploadingThumbnail(true);
    } else {
      setUploadingIcon(true);
    }
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) throw new Error("Upload did not return a file URL");
      if (target === "thumbnail") {
        setCreateThumbnail(url);
      } else {
        setCreateIcon(url);
      }
      toast.success(`${target === "thumbnail" ? "Thumbnail" : "Icon"} uploaded`);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload image");
    } finally {
      if (target === "thumbnail") {
        setUploadingThumbnail(false);
      } else {
        setUploadingIcon(false);
      }
    }
  };

  const autoUploadCreateUrl = async (
    value: string,
    target: "thumbnail" | "icon",
  ) => {
    const trimmed = value.trim();
    if (!trimmed || !isHttpUrl(trimmed) || isMinioUrl(trimmed)) return;
    if (target === "thumbnail") {
      setUploadingThumbnail(true);
    } else {
      setUploadingIcon(true);
    }
    try {
      const minioUrl = await resolveToMinioUrl(trimmed);
      if (target === "thumbnail") {
        setCreateThumbnail(minioUrl);
      } else {
        setCreateIcon(minioUrl);
      }
      if (minioUrl !== trimmed) {
        toast.success(`${target === "thumbnail" ? "Thumbnail" : "Icon"} uploaded to MinIO`);
      }
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload URL to MinIO");
    } finally {
      if (target === "thumbnail") {
        setUploadingThumbnail(false);
      } else {
        setUploadingIcon(false);
      }
    }
  };

  const handleCreateModule = async () => {
    if (!Number.isFinite(parsedUnitId) || parsedUnitId < 1) {
      toast.error("Invalid unit");
      return;
    }
    const name = createName.trim();
    if (!name) {
      toast.error("Module name is required");
      return;
    }
    setCreating(true);
    try {
      const minioThumbnail = await resolveToMinioUrl(createThumbnail);
      const minioIcon = await resolveToMinioUrl(createIcon);
      await createExamPrepUnitModule(parsedUnitId, {
        name,
        description: null,
        thumbnail: minioThumbnail || null,
        icon: minioIcon || null,
      });
      await loadModules();
      toast.success("Module created");
      clearCreateModuleForm();
      setAddModuleOpen(false);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to create module");
    } finally {
      setCreating(false);
    }
  };

  const openEditModule = (module: (typeof modules)[number]) => {
    setEditingModuleId(module.id);
    setEditName(module.name ?? "");
    setEditThumbnail(module.thumbnail ?? "");
    setEditIcon(module.icon ?? "");
    setEditSortOrder(String(module.sortOrder ?? 1));
  };

  const closeEditModule = () => {
    if (savingEdit || uploadingEditThumbnail || uploadingEditIcon) return;
    setEditingModuleId(null);
    setEditName("");
    setEditThumbnail("");
    setEditIcon("");
    setEditSortOrder("1");
  };

  const handleEditImageFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "thumbnail" | "icon",
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (target === "thumbnail") {
      setUploadingEditThumbnail(true);
    } else {
      setUploadingEditIcon(true);
    }
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) throw new Error("Upload did not return a file URL");
      if (target === "thumbnail") {
        setEditThumbnail(url);
      } else {
        setEditIcon(url);
      }
      toast.success(`${target === "thumbnail" ? "Thumbnail" : "Icon"} uploaded`);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload image");
    } finally {
      if (target === "thumbnail") {
        setUploadingEditThumbnail(false);
      } else {
        setUploadingEditIcon(false);
      }
    }
  };

  const autoUploadEditUrl = async (value: string, target: "thumbnail" | "icon") => {
    const trimmed = value.trim();
    if (!trimmed || !isHttpUrl(trimmed) || isMinioUrl(trimmed)) return;
    if (target === "thumbnail") {
      setUploadingEditThumbnail(true);
    } else {
      setUploadingEditIcon(true);
    }
    try {
      const minioUrl = await resolveToMinioUrl(trimmed);
      if (target === "thumbnail") {
        setEditThumbnail(minioUrl);
      } else {
        setEditIcon(minioUrl);
      }
      if (minioUrl !== trimmed) {
        toast.success(`${target === "thumbnail" ? "Thumbnail" : "Icon"} uploaded to MinIO`);
      }
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload URL to MinIO");
    } finally {
      if (target === "thumbnail") {
        setUploadingEditThumbnail(false);
      } else {
        setUploadingEditIcon(false);
      }
    }
  };

  const handleSaveEditModule = async () => {
    if (!editingModuleId) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Module name is required");
      return;
    }
    const sortOrderNum = Number(editSortOrder);
    if (!Number.isFinite(sortOrderNum) || sortOrderNum < 0) {
      toast.error("Sort order must be a valid number");
      return;
    }

    setSavingEdit(true);
    try {
      const existing = modules.find((m) => m.id === editingModuleId);
      const preservedDescription =
        existing?.description && existing.description !== "unassigned"
          ? existing.description
          : null;
      const minioThumbnail = await resolveToMinioUrl(editThumbnail);
      const minioIcon = await resolveToMinioUrl(editIcon);
      await updateExamPrepUnitModule(editingModuleId, {
        name,
        description: preservedDescription,
        thumbnail: minioThumbnail || null,
        icon: minioIcon || null,
        sort_order: sortOrderNum,
      });
      await loadModules();
      toast.success("Module updated");
      closeEditModule();
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to update module");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!deletingModuleId) return;
    setDeletingModule(true);
    try {
      await deleteExamPrepUnitModule(deletingModuleId);
      await loadModules();
      toast.success("Module deleted");
      setDeletingModuleId(null);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to delete module");
    } finally {
      setDeletingModule(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to={`/new-content/courses/${programType}/${courseId}`}
        className="flex items-center gap-2.5 text-[15px] font-semibold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to Courses
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ContentPublishStatusChip
              publishStatus={unitPublishStatus}
              updating={unitPublishStatusUpdating}
              contentLabel="unit"
              onToggle={(nextStatus) => void handleUnitPublishStatus(nextStatus)}
            />
          </div>
          <h1 className="text-[28px] font-medium tracking-tight text-grayScale-900">
            {unitDisplayName}
          </h1>
          {unitDescription ? (
            <ContentPageDescription className="text-[15px] font-medium text-grayScale-500">
              {unitDescription}
            </ContentPageDescription>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
        <Dialog
          open={addModuleOpen}
          onOpenChange={(open) => {
            if (!open && (creating || uploadingThumbnail || uploadingIcon)) return;
            setAddModuleOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white shadow-sm hover:bg-brand-600 transition-all flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Modules
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
            <div className="flex min-h-0 flex-1 flex-col bg-white">
              <DialogHeader className="px-8 py-6 pr-14 border-b border-grayScale-200 flex flex-row items-center justify-between">
                <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                  Create Modules
                </DialogTitle>
                <DialogClose className="rounded-full p-1.5 hover:bg-grayScale-50 transition-colors">
                  <X className="h-5 w-5 text-grayScale-400" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[15px] text-grayScale-800">
                    Module Title
                  </label>
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Present tense"
                    className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                    disabled={creating || uploadingThumbnail || uploadingIcon}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[15px] text-grayScale-800">Thumbnail</label>
                  <input
                    ref={createThumbnailFileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void handleCreateImageFile(e, "thumbnail")}
                    disabled={creating || uploadingThumbnail || uploadingIcon}
                  />
                  <button
                    type="button"
                    className="relative group w-full cursor-pointer"
                    onClick={() => createThumbnailFileInputRef.current?.click()}
                    disabled={creating || uploadingThumbnail || uploadingIcon}
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
                        void autoUploadCreateUrl(pasted, "thumbnail");
                      }, 0);
                    }}
                    placeholder="Optional thumbnail URL (or leave empty for null)"
                    className="h-12 border-grayScale-400 rounded-[8px] px-4"
                    disabled={creating || uploadingThumbnail || uploadingIcon}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[15px] text-grayScale-800">Icon</label>
                  <input
                    ref={createIconFileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void handleCreateImageFile(e, "icon")}
                    disabled={creating || uploadingThumbnail || uploadingIcon}
                  />
                  <button
                    type="button"
                    className="relative group w-full cursor-pointer"
                    onClick={() => createIconFileInputRef.current?.click()}
                    disabled={creating || uploadingThumbnail || uploadingIcon}
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
                          {uploadingIcon ? "Uploading…" : "Click to upload"}
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
                  {createIcon.trim() ? (
                    <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                      <ResolvedImage
                        src={createIcon.trim()}
                        alt=""
                        className="h-24 w-full object-contain bg-white p-2"
                      />
                    </div>
                  ) : null}
                  <Input
                    value={createIcon}
                    onChange={(e) => setCreateIcon(e.target.value)}
                    onPaste={(event) => {
                      const pasted = event.clipboardData?.getData("text")?.trim();
                      if (!pasted) return;
                      setTimeout(() => {
                        void autoUploadCreateUrl(pasted, "icon");
                      }, 0);
                    }}
                    placeholder="Optional icon URL (or leave empty for null)"
                    className="h-12 border-grayScale-400 rounded-[8px] px-4"
                    disabled={creating || uploadingThumbnail || uploadingIcon}
                  />
                </div>
              </div>

              <div className="px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-200 flex justify-end gap-3">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                    disabled={creating || uploadingThumbnail || uploadingIcon}
                    onClick={clearCreateModuleForm}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                  onClick={() => void handleCreateModule()}
                  disabled={creating || uploadingThumbnail || uploadingIcon}
                >
                  {creating ? "Creating..." : "Create Module"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          <PracticeActionButton
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-brand-500 text-brand-500 font-bold flex items-center gap-2 shadow-sm"
            pathOptions={unitPracticePathOptions}
            parentLabel={unitDisplayName}
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
            onClick={() => setActiveTab("modules")}
            className={cn(
              "pb-4 text-[16px] font-medium transition-all relative",
              activeTab === "modules"
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-t-full"
                : "text-grayScale-400 hover:text-grayScale-600",
            )}
          >
            Modules
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

      {/* Grid of Modules */}
      {activeTab === "practices" ? (
        <UnitPracticesPanel
          unitId={parsedUnitId}
          programType={programType ?? ""}
          courseId={catalogCourseId}
          unitName={unitDisplayName}
        />
      ) : (
      <div className="space-y-4 pt-4">
        {!modulesLoading && modules.length > 0 ? (
          <ContentListSearchFilterBar
            search={listSearch}
            onSearchChange={setListSearch}
            publishStatusFilter={publishStatusFilter}
            onPublishStatusFilterChange={setPublishStatusFilter}
            searchPlaceholder="Search modules by name or description…"
            searchAriaLabel="Search modules"
          />
        ) : null}
        <div className="flex flex-wrap gap-4">
        {modulesLoading ? (
          <p className="text-sm text-grayScale-500">Loading modules...</p>
        ) : modules.length === 0 ? (
          <div className="w-full rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
            <p className="text-sm font-medium text-grayScale-600">
              No modules for this unit yet
            </p>
            <p className="mt-1 text-sm text-grayScale-400">
              Create your first module to start organizing lessons and practices.
            </p>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="w-full rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
            <p className="text-sm font-medium text-grayScale-600">
              No modules match your search or status filter
            </p>
          </div>
        ) : (
          filteredModules.map((module, index) => (
            <Card
              key={`${module.id}-${index}`}
              className="group relative flex w-[400px] flex-col bg-white rounded-[12px] border border-grayScale-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute right-2 top-2 z-10 flex translate-y-1 gap-1 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-md bg-white/95 text-grayScale-600 shadow-sm transition-colors hover:bg-white"
                  onClick={() => openEditModule(module)}
                  aria-label={`Edit ${module.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-md bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                  onClick={() => setDeletingModuleId(module.id)}
                  aria-label={`Delete ${module.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* Header */}
              <div
                className="h-36 w-full overflow-hidden"
                style={{ background: module.gradient }}
              >
                {module.thumbnail ? (
                  <ResolvedImage
                    src={module.thumbnail}
                    alt={`${module.name} thumbnail`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>

              <div className="p-5 flex flex-col space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-[#9E28911A] border border-[#9E289133] flex items-center justify-center overflow-hidden">
                    {module.icon ? (
                      <ResolvedImage
                        src={module.icon}
                        alt={`${module.name} icon`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-brand-500" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="mb-1 flex flex-wrap gap-2">
                      <ContentPublishStatusChip
                        publishStatus={module.publishStatus}
                        updating={publishStatusUpdatingId === module.id}
                        contentLabel="module"
                        onToggle={(nextStatus) =>
                          void handleModulePublishStatus(module.id, nextStatus)
                        }
                      />
                      <ContentAccessTierChip
                        accessTier={module.accessTier}
                        updating={accessTierUpdatingId === module.id}
                        contentLabel="module"
                        onToggle={(nextTier) =>
                          void handleModuleAccessTier(module.id, nextTier)
                        }
                      />
                    </div>
                    <h3 className="text-[16px] font-medium text-grayScale-900 leading-tight">
                      {module.name}
                    </h3>
                    <p className="text-[12px] text-grayScale-500 font-medium line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="flex items-center gap-3">
                  <div className="h-8 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                    <PlayCircle className="h-3.5 w-3.5 text-grayScale-400" />
                    <span className="text-[12px] font-bold">
                      {module.lessons} Lessons
                    </span>
                  </div>
                  <div className="h-8 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                    <ClipboardCheck className="h-3.5 w-3.5 text-grayScale-400" />
                    <span className="text-[12px] font-bold">
                      {module.practices} Practices
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full h-10 bg-brand-500 text-white rounded-[6px] font-bold flex items-center justify-center gap-2 group/btn"
                  onClick={() =>
                    navigate(
                      `/new-content/courses/${programType}/${courseId}/${unitId}/${module.id}`,
                    )
                  }
                >
                  View Detail
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </Card>
          ))
        )}
        </div>
      </div>
      )}

      <Dialog
        open={editingModuleId !== null}
        onOpenChange={(open) => {
          if (!open && (savingEdit || uploadingEditThumbnail || uploadingEditIcon)) return;
          if (!open) closeEditModule();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <DialogHeader className="px-8 py-6 pr-14 border-b border-grayScale-200 flex flex-row items-center justify-between">
              <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                Edit Module
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Module Title</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Sort Order</label>
                <Input
                  type="number"
                  min={0}
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Thumbnail</label>
                <input
                  ref={editThumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleEditImageFile(e, "thumbnail")}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                />
                <button
                  type="button"
                  className="relative group w-full cursor-pointer"
                  onClick={() => editThumbnailFileInputRef.current?.click()}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
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
                      void autoUploadEditUrl(pasted, "thumbnail");
                    }, 0);
                  }}
                  placeholder="Optional thumbnail URL (or leave empty for null)"
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Icon</label>
                <input
                  ref={editIconFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleEditImageFile(e, "icon")}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                />
                <button
                  type="button"
                  className="relative group w-full cursor-pointer"
                  onClick={() => editIconFileInputRef.current?.click()}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                >
                  <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all ">
                    <div className="mb-4">
                      <img src={uploadIcon} alt="Upload icon" className="h-10 w-10" />
                    </div>
                    <p className="text-[15px]">
                      <span className="text-brand-500 font-bold hover:underline">
                        {uploadingEditIcon ? "Uploading…" : "Click to upload"}
                      </span>{" "}
                      <span className="text-grayScale-500">or paste a URL below</span>
                    </p>
                    <p className="mt-1.5 text-[12px] text-grayScale-400 uppercase tracking-widest">
                      JPG, PNG (MAX 5 MB)
                    </p>
                  </div>
                </button>
                {editIcon.trim() ? (
                  <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                    <ResolvedImage
                      src={editIcon.trim()}
                      alt=""
                      className="h-24 w-full object-contain bg-white p-2"
                    />
                  </div>
                ) : null}
                <Input
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  onPaste={(event) => {
                    const pasted = event.clipboardData?.getData("text")?.trim();
                    if (!pasted) return;
                    setTimeout(() => {
                      void autoUploadEditUrl(pasted, "icon");
                    }, 0);
                  }}
                  placeholder="Optional icon URL (or leave empty for null)"
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                />
              </div>
            </div>
            <div className="px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
                onClick={closeEditModule}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                onClick={() => void handleSaveEditModule()}
                disabled={savingEdit || uploadingEditThumbnail || uploadingEditIcon}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingModuleId !== null}
        onOpenChange={(open) => {
          if (!open && !deletingModule) setDeletingModuleId(null);
        }}
      >
        <DialogContent className="max-w-md rounded-[16px] border-none p-0 overflow-hidden">
          <div className="bg-white">
            <DialogHeader className="border-b border-grayScale-100 px-4 py-4 pr-14 sm:px-6">
              <DialogTitle className="text-lg font-bold text-grayScale-900">
                Delete Module
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6 text-sm text-grayScale-600">
              Are you sure you want to delete this module? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-3 border-t border-grayScale-100 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setDeletingModuleId(null)}
                disabled={deletingModule}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => void handleDeleteModule()}
                disabled={deletingModule}
              >
                {deletingModule ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
