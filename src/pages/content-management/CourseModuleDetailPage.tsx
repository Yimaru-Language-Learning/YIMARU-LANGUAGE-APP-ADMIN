import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, Video } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { PracticeActionChoiceDialog } from "./components/PracticeActionChoiceDialog";
import {
  buildPracticeContentPaths,
  type PracticeContentPathOptions,
} from "../../lib/practiceContentPaths";
import { cn } from "../../lib/utils";
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
import { Textarea } from "../../components/ui/textarea";
import uploadIcon from "../../assets/icons/upload.png";
import { toast } from "sonner";
import { ResolvedImage } from "../../components/media/ResolvedImage";
import { VideoCard } from "./components/VideoCard";
import {
  createExamPrepModuleLesson,
  updateExamPrepModuleLesson,
  deleteExamPrepModuleLesson,
  getExamPrepModuleLessons,
  getExamPrepUnitModules,
  setExamPrepModuleLessonAccessTier,
  setExamPrepModuleLessonPublishStatus,
  setExamPrepUnitModulePublishStatus,
} from "../../api/courses.api";
import { uploadImageFile, uploadVideoFile } from "../../api/files.api";
import { resolveThumbnailForPreview } from "../../lib/videoPreview";
import type {
  ContentAccessTier,
  PracticePublishStatus,
} from "../../types/course.types";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import { ContentPageDescription } from "./components/ContentPageDescription";
import { ContentPublishStatusChip } from "./components/ContentPublishStatusChip";
import {
  filterBySearchAndPublishStatus,
  type PublishStatusFilter,
} from "../../lib/contentListFilters";

const LESSON_THUMB_GRADIENTS = [
  "from-[#CBD5E1] to-[#94A3B8]",
  "from-[#DBEAFE] to-[#93C5FD]",
  "from-[#FEF3C7] to-[#FCD34D]",
  "from-[#FCE7F3] to-[#F9A8D4]",
] as const;

export function CourseModuleDetailPage() {
  const navigate = useNavigate();
  const { programType, courseId, unitId, moduleId } = useParams<{
    programType: string;
    courseId: string;
    unitId: string;
    moduleId: string;
  }>();
  const parsedModuleId = Number(moduleId);
  const parsedUnitId = Number(unitId);

  const [lessonPracticeChoice, setLessonPracticeChoice] =
    useState<PracticeContentPathOptions | null>(null);
  const lessonPracticeChoicePaths = useMemo(
    () =>
      lessonPracticeChoice
        ? buildPracticeContentPaths(lessonPracticeChoice)
        : null,
    [lessonPracticeChoice],
  );
  const [moduleTitle, setModuleTitle] = useState("Module");
  const [moduleDescription, setModuleDescription] = useState("—");
  const [modulePublishStatus, setModulePublishStatus] = useState<
    PracticePublishStatus | string | null
  >(null);
  const [modulePublishStatusUpdating, setModulePublishStatusUpdating] =
    useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessons, setLessons] = useState<
    Array<{
      id: number;
      title: string;
      videoUrl: string;
      description: string | null;
      thumbnail: string;
      sortOrder: number;
      publishStatus: PracticePublishStatus | string | null;
      accessTier: ContentAccessTier | string | null;
      durationSeconds: number | null;
    }>
  >([]);
  const [lessonsLoadError, setLessonsLoadError] = useState<string | null>(null);
  const [publishStatusLessonId, setPublishStatusLessonId] = useState<
    number | null
  >(null);
  const [accessTierLessonId, setAccessTierLessonId] = useState<number | null>(
    null,
  );
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonPublishStatusFilter, setLessonPublishStatusFilter] =
    useState<PublishStatusFilter>("all");

  const filteredLessons = useMemo(
    () =>
      filterBySearchAndPublishStatus(lessons, {
        search: lessonSearch,
        publishStatusFilter: lessonPublishStatusFilter,
        getSearchFields: (l) => [l.title, l.description],
        getPublishStatus: (l) => l.publishStatus,
      }),
    [lessonPublishStatusFilter, lessonSearch, lessons],
  );
  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createVideoUrl, setCreateVideoUrl] = useState("");
  const [createThumbnail, setCreateThumbnail] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const createThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const createVideoFileInputRef = useRef<HTMLInputElement>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("1");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false);
  const [uploadingEditVideo, setUploadingEditVideo] = useState(false);
  const editThumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const editVideoFileInputRef = useRef<HTMLInputElement>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);

  const loadModule = useCallback(async () => {
    if (
      !Number.isFinite(parsedUnitId) ||
      parsedUnitId < 1 ||
      !Number.isFinite(parsedModuleId) ||
      parsedModuleId < 1
    ) {
      return;
    }
    try {
      const response = await getExamPrepUnitModules(parsedUnitId, {
        limit: 100,
        offset: 0,
      });
      const rows = response.data?.data?.modules;
      const list = Array.isArray(rows) ? rows : [];
      const row = list.find((m) => Number(m.id) === parsedModuleId);
      if (row) {
        setModuleTitle(row.name?.trim() || `Module ${parsedModuleId}`);
        setModuleDescription(row.description?.trim() || "—");
        setModulePublishStatus(row.publish_status ?? null);
      } else {
        setModuleTitle(`Module ${parsedModuleId}`);
        setModuleDescription("—");
        setModulePublishStatus(null);
      }
    } catch (error) {
      console.error(error);
      setModuleTitle(`Module ${parsedModuleId}`);
      setModuleDescription("—");
    }
  }, [parsedModuleId, parsedUnitId]);

  useEffect(() => {
    void loadModule();
  }, [loadModule]);

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

  const loadLessons = useCallback(async () => {
    if (!Number.isFinite(parsedModuleId) || parsedModuleId < 1) {
      setLessons([]);
      return;
    }
    setLessonsLoading(true);
    setLessonsLoadError(null);
    try {
      const response = await getExamPrepModuleLessons(parsedModuleId, {
        limit: 20,
        offset: 0,
      });
      const rows = response.data?.data?.lessons;
      const list = Array.isArray(rows) ? rows : [];
      setLessons(
        list.map((row) => {
          const raw = row.duration_seconds ?? row.duration ?? null;
          const n =
            raw == null ? NaN : typeof raw === "number" ? raw : Number(raw);
          const durationSeconds =
            Number.isFinite(n) && n > 0 ? n : null;
          return {
            id: Number(row.id),
            title: row.title?.trim() || `Lesson ${row.id}`,
            videoUrl: row.video_url?.trim() || "",
            description: row.description?.trim() || null,
            thumbnail: row.thumbnail?.trim() || "",
            sortOrder: Number(row.sort_order ?? 0),
            publishStatus: row.publish_status ?? null,
            accessTier: row.access_tier ?? null,
            durationSeconds,
          };
        }),
      );
    } catch (error) {
      console.error(error);
      setLessonsLoadError("Failed to load lessons. Please try again.");
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }, [parsedModuleId]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const clearCreateLessonForm = () => {
    setCreateTitle("");
    setCreateVideoUrl("");
    setCreateThumbnail("");
    setCreateDescription("");
    if (createThumbnailFileInputRef.current) {
      createThumbnailFileInputRef.current.value = "";
    }
    if (createVideoFileInputRef.current) {
      createVideoFileInputRef.current.value = "";
    }
  };

  const handleCreateLessonVideoFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    setUploadingVideo(true);
    try {
      const res = await uploadVideoFile(file, {
        title: createTitle.trim() || "Lesson video",
        description: createDescription.trim() || undefined,
      });
      const finalUrl =
        res.data?.data?.url?.trim() || res.data?.data?.embed_url?.trim() || "";
      if (!finalUrl) throw new Error("Upload did not return a video URL");
      setCreateVideoUrl(finalUrl);
      toast.success("Video uploaded");
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCreateLessonThumbnailFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
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

  const handleCreateLesson = async (publishStatus: PracticePublishStatus) => {
    if (!Number.isFinite(parsedModuleId) || parsedModuleId < 1) {
      toast.error("Invalid module");
      return;
    }
    const title = createTitle.trim();
    const videoUrl = createVideoUrl.trim();
    if (!title) {
      toast.error("Lesson title is required");
      return;
    }
    if (!videoUrl) {
      toast.error("Video URL is required");
      return;
    }

    setCreatingLesson(true);
    try {
      const minioThumbnail = await resolveThumbnailToMinioUrl(createThumbnail);
      await createExamPrepModuleLesson(parsedModuleId, {
        title,
        video_url: videoUrl,
        thumbnail: minioThumbnail || null,
        description: createDescription.trim() || null,
        publish_status: publishStatus,
      });
      await loadLessons();
      toast.success(
        publishStatus === "DRAFT"
          ? "Lesson saved as draft"
          : "Lesson created",
      );
      clearCreateLessonForm();
      setCreateLessonOpen(false);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to create lesson");
    } finally {
      setCreatingLesson(false);
    }
  };

  const openEditLesson = (lesson: (typeof lessons)[number]) => {
    setEditingLessonId(lesson.id);
    setEditTitle(lesson.title ?? "");
    setEditVideoUrl(lesson.videoUrl ?? "");
    setEditThumbnail(lesson.thumbnail ?? "");
    setEditDescription(lesson.description ?? "");
    setEditSortOrder(String(lesson.sortOrder ?? 1));
  };

  const closeEditLesson = () => {
    if (savingEdit || uploadingEditThumbnail || uploadingEditVideo) return;
    setEditingLessonId(null);
    setEditTitle("");
    setEditVideoUrl("");
    setEditThumbnail("");
    setEditDescription("");
    setEditSortOrder("1");
  };

  const handleEditLessonVideoFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    setUploadingEditVideo(true);
    try {
      const res = await uploadVideoFile(file, {
        title: editTitle.trim() || "Lesson video",
        description: editDescription.trim() || undefined,
      });
      const finalUrl =
        res.data?.data?.url?.trim() || res.data?.data?.embed_url?.trim() || "";
      if (!finalUrl) throw new Error("Upload did not return a video URL");
      setEditVideoUrl(finalUrl);
      toast.success("Video uploaded");
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to upload video");
    } finally {
      setUploadingEditVideo(false);
    }
  };

  const handleEditLessonThumbnailFile = async (
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

  const handleSaveEditLesson = async () => {
    if (!editingLessonId) return;
    const title = editTitle.trim();
    if (!title) {
      toast.error("Lesson title is required");
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
      await updateExamPrepModuleLesson(editingLessonId, {
        title,
        video_url: editVideoUrl.trim() || null,
        thumbnail: minioThumbnail || null,
        description: editDescription.trim() || null,
        sort_order: sortOrderNum,
      });
      await loadLessons();
      toast.success("Lesson updated");
      closeEditLesson();
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to update lesson");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLessonId) return;
    setDeletingLesson(true);
    try {
      await deleteExamPrepModuleLesson(deletingLessonId);
      await loadLessons();
      toast.success("Lesson deleted");
      setDeletingLessonId(null);
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to delete lesson");
    } finally {
      setDeletingLesson(false);
    }
  };

  const handleModulePublishStatus = async (nextStatus: PracticePublishStatus) => {
    if (!Number.isFinite(parsedModuleId) || parsedModuleId < 1) return;
    setModulePublishStatusUpdating(true);
    try {
      await setExamPrepUnitModulePublishStatus(parsedModuleId, {
        publish_status: nextStatus,
      });
      setModulePublishStatus(nextStatus);
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Module published"
          : "Module saved as draft",
      );
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to update module status");
    } finally {
      setModulePublishStatusUpdating(false);
    }
  };

  const handleToggleLessonPublishStatus = async (
    lessonId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusLessonId(lessonId);
    try {
      await setExamPrepModuleLessonPublishStatus(lessonId, {
        publish_status: nextStatus,
      });
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId ? { ...l, publishStatus: nextStatus } : l,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Lesson published"
          : "Lesson saved as draft",
      );
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(
        error,
        nextStatus === "PUBLISHED" ? "Failed to publish lesson" : "Failed to save lesson as draft",
      );
    } finally {
      setPublishStatusLessonId(null);
    }
  };

  const handleToggleLessonAccessTier = async (
    lessonId: number,
    nextTier: ContentAccessTier,
  ) => {
    setAccessTierLessonId(lessonId);
    try {
      await setExamPrepModuleLessonAccessTier(lessonId, {
        access_tier: nextTier,
      });
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId ? { ...l, accessTier: nextTier } : l,
        ),
      );
      toast.success(
        nextTier === "PREMIUM" ? "Lesson set to Premium" : "Lesson set to Free",
      );
    } catch (error: unknown) {
      console.error(error);
      notifyApiError(error, "Failed to update lesson access tier");
    } finally {
      setAccessTierLessonId(null);
    }
  };

  const lessonPracticesPath = (lesson: (typeof lessons)[number]) =>
    `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}/lessons/${lesson.id}/practices?lessonTitle=${encodeURIComponent(lesson.title)}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to={`/new-content/courses/${programType}/${courseId}/${unitId}`}
        className="flex items-center gap-2.5 text-[15px] font-bold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to Modules
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ContentPublishStatusChip
              publishStatus={modulePublishStatus}
              updating={modulePublishStatusUpdating}
              contentLabel="module"
              onToggle={(nextStatus) => void handleModulePublishStatus(nextStatus)}
            />
          </div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#0D1421]">
            {moduleTitle}
          </h1>
          <ContentPageDescription className="text-[16px] font-medium text-grayScale-400">
            {moduleDescription}
          </ContentPageDescription>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Dialog
            open={createLessonOpen}
            onOpenChange={(open) => {
              if (!open && (creatingLesson || uploadingThumbnail || uploadingVideo))
                return;
              setCreateLessonOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white shadow-md hover:bg-brand-600 transition-all flex items-center gap-2 text-[15px]">
                <Plus className="h-5 w-5" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
              <div className="flex min-h-0 flex-1 flex-col bg-white">
                <DialogHeader className="shrink-0 px-8 py-6 border-b border-grayScale-200 flex flex-row items-center justify-between">
                  <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                    Create Lesson
                  </DialogTitle>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Lesson Title
                    </label>
                    <Input
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="e.g. Intro lesson"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4"
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Video URL
                    </label>
                    <input
                      ref={createVideoFileInputRef}
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      onChange={(e) => void handleCreateLessonVideoFile(e)}
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    />
                    <button
                      type="button"
                      className="relative group w-full cursor-pointer"
                      onClick={() => createVideoFileInputRef.current?.click()}
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    >
                      <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all">
                        <div className="mb-4">
                          <img
                            src={uploadIcon}
                            alt="Upload icon"
                            className="h-10 w-10"
                          />
                        </div>
                        <p className="text-[15px]">
                          <span className="text-brand-500 font-bold hover:underline">
                            {uploadingVideo ? "Uploading…" : "Click to upload"}
                          </span>{" "}
                          <span className="text-grayScale-500">
                            video from your computer
                          </span>
                        </p>
                        <p className="mt-1.5 text-[12px] text-grayScale-400 uppercase tracking-widest">
                          MP4, MOV, WEBM
                        </p>
                      </div>
                    </button>
                    <Input
                      value={createVideoUrl}
                      onChange={(e) => setCreateVideoUrl(e.target.value)}
                      placeholder="https://example.com/video"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4"
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Description
                    </label>
                    <Textarea
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="Optional lesson description"
                      rows={4}
                      className="min-h-[96px] rounded-[8px] border-grayScale-400"
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
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
                      onChange={(e) => void handleCreateLessonThumbnailFile(e)}
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    />
                    <button
                      type="button"
                      className="relative group w-full cursor-pointer"
                      onClick={() => createThumbnailFileInputRef.current?.click()}
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    >
                      <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all">
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
                      className="h-12 border-grayScale-400 rounded-[8px] px-4"
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    />
                  </div>
                </div>
                <div className="shrink-0 px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-50 flex flex-wrap justify-end gap-3">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                      disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                      onClick={clearCreateLessonForm}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold hover:bg-grayScale-50"
                    disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    onClick={() => void handleCreateLesson("DRAFT")}
                  >
                    {creatingLesson ? "Saving…" : "Save as draft"}
                  </Button>
                  <Button
                    type="button"
                    className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                    disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    onClick={() => void handleCreateLesson("PUBLISHED")}
                  >
                    {creatingLesson ? "Creating..." : "Publish lesson"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lessons */}
      <div className="mt-8">
        {lessonsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-grayScale-500 text-[15px] font-medium">
              Loading lessons…
            </div>
          ) : lessonsLoadError ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-6 py-8 text-center text-sm text-amber-900 max-w-lg mx-auto">
              {lessonsLoadError}
            </div>
          ) : lessons.length > 0 ? (
            <div className="space-y-6">
              <ContentListSearchFilterBar
                search={lessonSearch}
                onSearchChange={setLessonSearch}
                publishStatusFilter={lessonPublishStatusFilter}
                onPublishStatusFilterChange={setLessonPublishStatusFilter}
                searchPlaceholder="Search lessons by title or description…"
                searchAriaLabel="Search lessons"
              />
              {filteredLessons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
                  <p className="text-sm font-medium text-grayScale-600">
                    No lessons match your search or status filter
                  </p>
                </div>
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredLessons.map((lesson, i) => (
                <VideoCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  videoUrl={lesson.videoUrl}
                  publishStatus={lesson.publishStatus}
                  hoverModuleActions
                  thumbnailUrl={resolveThumbnailForPreview(lesson.thumbnail)}
                  thumbnailGradient={
                    LESSON_THUMB_GRADIENTS[i % LESSON_THUMB_GRADIENTS.length]
                  }
                  durationSeconds={lesson.durationSeconds}
                  onEdit={() => openEditLesson(lesson)}
                  onDelete={() => setDeletingLessonId(lesson.id)}
                  description={lesson.description}
                  onAddPractice={() =>
                    setLessonPracticeChoice({
                      isExamPrep: true,
                      programType,
                      courseId,
                      unitId,
                      moduleId,
                      lessonId: String(lesson.id),
                      lessonTitle: lesson.title,
                    })
                  }
                  onViewPractices={() => navigate(lessonPracticesPath(lesson))}
                  onTogglePublishStatus={(nextStatus) =>
                    void handleToggleLessonPublishStatus(lesson.id, nextStatus)
                  }
                  publishStatusUpdating={publishStatusLessonId === lesson.id}
                  accessTier={lesson.accessTier}
                  onToggleAccessTier={(nextTier) =>
                    void handleToggleLessonAccessTier(lesson.id, nextTier)
                  }
                  accessTierUpdating={accessTierLessonId === lesson.id}
                />
              ))}
            </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 px-4 rounded-[40px] border-2 border-dashed border-[#F1F5F9] bg-white max-w-4xl mx-auto shadow-sm">
              <div className="h-20 w-20 rounded-full bg-[#FAF5FF] flex items-center justify-center mb-6">
                <div className="h-14 w-14 rounded-full bg-[#F5EBFF] flex items-center justify-center">
                  <Video className="h-7 w-7 text-brand-500 fill-brand-500/10" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-grayScale-900 mb-3">
                No lessons in this module yet
              </h2>
              <p className="text-grayScale-400 font-medium text-[15px] text-center max-w-sm mb-10 leading-relaxed">
                Lessons are a great way to engage students. Add your first
                lesson to get started.
              </p>
              <Button
                variant="outline"
                className="h-12 px-8 rounded-xl border-brand-500 text-brand-500 font-bold hover:bg-brand-50 transition-all flex items-center gap-2"
                onClick={() => setCreateLessonOpen(true)}
              >
                <Video className="h-5 w-5" />
                Add Lesson
              </Button>
            </div>
          )
        }
      </div>

      <Dialog
        open={editingLessonId !== null}
        onOpenChange={(open) => {
          if (!open && (savingEdit || uploadingEditThumbnail || uploadingEditVideo))
            return;
          if (!open) closeEditLesson();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-[600px] flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0">
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <DialogHeader className="shrink-0 px-8 py-6 border-b border-grayScale-200 flex flex-row items-center justify-between">
              <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                Edit Lesson
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Lesson Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Video URL</label>
                <input
                  ref={editVideoFileInputRef}
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  onChange={(e) => void handleEditLessonVideoFile(e)}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                />
                <button
                  type="button"
                  className="relative group w-full cursor-pointer"
                  onClick={() => editVideoFileInputRef.current?.click()}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                >
                  <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all">
                    <div className="mb-4">
                      <img src={uploadIcon} alt="Upload icon" className="h-10 w-10" />
                    </div>
                    <p className="text-[15px]">
                      <span className="text-brand-500 font-bold hover:underline">
                        {uploadingEditVideo ? "Uploading…" : "Click to upload"}
                      </span>{" "}
                      <span className="text-grayScale-500">
                        video from your computer
                      </span>
                    </p>
                    <p className="mt-1.5 text-[12px] text-grayScale-400 uppercase tracking-widest">
                      MP4, MOV, WEBM
                    </p>
                  </div>
                </button>
                <Input
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  placeholder="https://example.com/video"
                  className="h-12 border-grayScale-400 rounded-[8px] px-4"
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Description</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="min-h-[96px] rounded-[8px] border-grayScale-400"
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
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
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[15px] text-grayScale-800">Thumbnail</label>
                <input
                  ref={editThumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleEditLessonThumbnailFile(e)}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                />
                <button
                  type="button"
                  className="relative group w-full cursor-pointer"
                  onClick={() => editThumbnailFileInputRef.current?.click()}
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                >
                  <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all">
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
                  disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                />
              </div>
            </div>
            <div className="shrink-0 px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-50 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                onClick={closeEditLesson}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                disabled={savingEdit || uploadingEditThumbnail || uploadingEditVideo}
                onClick={() => void handleSaveEditLesson()}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingLessonId !== null}
        onOpenChange={(open) => {
          if (!open && !deletingLesson) setDeletingLessonId(null);
        }}
      >
        <DialogContent className="max-w-md rounded-[16px] border-none p-0 overflow-hidden">
          <div className="bg-white">
            <DialogHeader className="border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <DialogTitle className="text-lg font-bold text-grayScale-900">
                Delete Lesson
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6 text-sm text-grayScale-600">
              Are you sure you want to delete this lesson? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-3 border-t border-grayScale-100 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setDeletingLessonId(null)}
                disabled={deletingLesson}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => void handleDeleteLesson()}
                disabled={deletingLesson}
              >
                {deletingLesson ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {lessonPracticeChoice && lessonPracticeChoicePaths ? (
        <PracticeActionChoiceDialog
          open={lessonPracticeChoice != null}
          onOpenChange={(open) => {
            if (!open) setLessonPracticeChoice(null)
          }}
          createHref={lessonPracticeChoicePaths.create}
          attachHref={lessonPracticeChoicePaths.attach}
          pathOptions={lessonPracticeChoice}
          parentLabel={
            lessonPracticeChoice.lessonTitle
              ? `Lesson — ${lessonPracticeChoice.lessonTitle}`
              : null
          }
        />
      ) : null}
    </div>
  );
}

