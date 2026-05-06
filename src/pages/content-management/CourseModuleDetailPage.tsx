import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, FileText, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
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
} from "../../api/courses.api";
import { uploadImageFile, uploadVideoFile } from "../../api/files.api";

const MOCK_PRACTICES = [
  {
    id: "p1",
    title: "1.1 Conversation Practice",
    duration: "08:45",
    status: "Published",
    thumbnailColor: "bg-[#E0F2FE]",
  },
  {
    id: "p2",
    title: "1.2 Roleplay Scenario",
    duration: "08:45",
    status: "Draft",
    thumbnailColor: "bg-[#F0FDF4]",
  },
];

export function CourseModuleDetailPage() {
  const navigate = useNavigate();
  const { programType, courseId, unitId, moduleId } = useParams<{
    programType: string;
    courseId: string;
    unitId: string;
    moduleId: string;
  }>();
  const parsedModuleId = Number(moduleId);

  const [activeTab, setActiveTab] = useState<"video" | "practice">("video");
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessons, setLessons] = useState<
    Array<{
      id: number;
      title: string;
      videoUrl: string;
      description: string;
      thumbnail: string;
      sortOrder: number;
      gradient: string;
    }>
  >([]);
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

  const moduleTitle = "Module 1: Basic Phrases";
  const moduleDescription = "Learn essential phrases for daily conversations.";

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
    try {
      const response = await getExamPrepModuleLessons(parsedModuleId, {
        limit: 20,
        offset: 0,
      });
      const rows = response.data?.data?.lessons;
      const list = Array.isArray(rows) ? rows : [];
      setLessons(
        list.map((row, index) => ({
          id: Number(row.id),
          title: row.title?.trim() || `Lesson ${row.id}`,
          videoUrl: row.video_url?.trim() || "",
          description: row.description?.trim() || "—",
          thumbnail: row.thumbnail?.trim() || "",
          sortOrder: Number(row.sort_order ?? 0),
          gradient:
            index % 3 === 1
              ? "linear-gradient(135deg, rgba(79, 70, 229, 0.35) 0%, rgba(79, 70, 229, 0.6) 100%)"
              : index % 3 === 2
                ? "linear-gradient(135deg, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0.6) 100%)"
                : "linear-gradient(135deg, rgba(158, 40, 145, 0.35) 0%, rgba(158, 40, 145, 0.6) 100%)",
        })),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load lessons");
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }, [parsedModuleId]);

  useEffect(() => {
    if (activeTab !== "video") return;
    void loadLessons();
  }, [activeTab, loadLessons]);

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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload video";
      toast.error(message);
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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload thumbnail";
      toast.error(message);
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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload URL to MinIO";
      toast.error(message);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleCreateLesson = async () => {
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
      });
      await loadLessons();
      toast.success("Lesson created");
      clearCreateLessonForm();
      setCreateLessonOpen(false);
    } catch (error: unknown) {
      console.error(error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create lesson";
      toast.error(message);
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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload video";
      toast.error(message);
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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload thumbnail";
      toast.error(message);
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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload URL to MinIO";
      toast.error(message);
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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update lesson";
      toast.error(message);
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
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete lesson";
      toast.error(message);
    } finally {
      setDeletingLesson(false);
    }
  };

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
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#0D1421]">
            {moduleTitle}
          </h1>
          <p className="max-w-2xl text-[16px] font-medium leading-relaxed text-grayScale-400">
            {moduleDescription}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-brand-500 text-brand-500 font-bold hover:bg-brand-50 transition-all flex items-center gap-2 shadow-sm"
            onClick={() =>
              navigate(
                `/new-content/courses/${programType}/${courseId}/unit/${unitId}/module/${moduleId}/attach-practice`,
              )
            }
          >
            <FileText className="h-5 w-5" />
            Attach Practice
          </Button>
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
                <div className="shrink-0 px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-50 flex justify-end gap-3">
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
                    className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600"
                    disabled={creatingLesson || uploadingThumbnail || uploadingVideo}
                    onClick={() => void handleCreateLesson()}
                  >
                    {creatingLesson ? "Creating..." : "Create Lesson"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-10 border-b border-grayScale-100">
        <button
          onClick={() => setActiveTab("video")}
          className={cn(
            "pb-4 text-[16px] font-bold transition-all relative px-2",
            activeTab === "video"
              ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-500"
              : "text-grayScale-400 hover:text-grayScale-600",
          )}
        >
          Lesson
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          className={cn(
            "pb-4 text-[16px] font-bold transition-all relative px-2",
            activeTab === "practice"
              ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-500"
              : "text-grayScale-400 hover:text-grayScale-600",
          )}
        >
          Practice
        </button>
      </div>

      {/* Grid of Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {activeTab === "video" ? (
          lessonsLoading ? (
            <p className="text-sm text-grayScale-500">Loading lessons...</p>
          ) : lessons.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-grayScale-600">
                No lessons for this module yet
              </p>
              <p className="mt-1 text-sm text-grayScale-400">
                Create your first lesson to start building this module.
              </p>
            </div>
          ) : (
            lessons.map((lesson) => (
              <VideoCard
                key={lesson.id}
                title={lesson.title}
                thumbnailUrl={lesson.thumbnail}
                videoUrl={lesson.videoUrl}
                thumbnailGradient={lesson.gradient}
                hoverModuleActions
                onEdit={() => openEditLesson(lesson)}
                onDelete={() => setDeletingLessonId(lesson.id)}
              />
            ))
          )
        ) : (
          MOCK_PRACTICES.map((item) => <PracticeCard key={item.id} {...item} />)
        )}
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
            <DialogHeader className="border-b border-grayScale-100 px-6 py-5">
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
    </div>
  );
}

function PracticeCard({
  title,
  duration,
  status,
  thumbnailColor,
}: {
  title: string;
  duration: string;
  status: string;
  thumbnailColor: string;
}) {
  return (
    <Card className="group flex flex-col bg-white rounded-[20px] border border-grayScale-50 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-grayScale-400/5 transition-all">
      {/* Thumbnail Area */}
      <div className={cn("h-44 w-full relative", thumbnailColor)}>
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
          {duration}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 space-y-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border",
              status === "Published"
                ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]"
                : "bg-grayScale-50 text-grayScale-400 border-grayScale-100",
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "Published" ? "bg-[#16A34A]" : "bg-grayScale-300",
              )}
            />
            {status}
          </div>
          <div />
        </div>

        <h3 className="text-[14px] font-bold text-[#0F172A] line-clamp-2 leading-snug">
          {title}
        </h3>

        <div className="pt-2 grid grid-cols-1 gap-2 mt-auto">
          <Button variant="outline" className="w-full h-10 rounded-[10px] border-grayScale-200 text-grayScale-600 font-bold text-xs">
            Edit
          </Button>
          <Button
            className={cn(
              "w-full h-10 rounded-[10px] font-bold text-xs shadow-sm",
              status === "Published"
                ? "bg-[#ECD5E9] text-[#9E2891] hover:bg-[#EBD0E7]"
                : "bg-brand-500 text-white hover:bg-brand-600",
            )}
          >
            {status === "Published" ? "Published" : "Publish"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

