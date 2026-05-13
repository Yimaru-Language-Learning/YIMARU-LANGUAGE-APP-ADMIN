import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Video,
  Calendar,
  Mic,
  Layers,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteTopLevelModuleLesson,
  getModuleLessons,
  getTopLevelCourseModules,
  updateTopLevelModuleLesson,
} from "../../api/courses.api";
import type { TopLevelModuleLessonItem } from "../../types/course.types";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { resolveThumbnailForPreview } from "../../lib/videoPreview";
import { cn } from "../../lib/utils";
import { LessonMediaUploadField } from "./components/LessonMediaUploadField";
import { VideoCard } from "./components/VideoCard";

const LESSON_THUMB_GRADIENTS = [
  "from-[#CBD5E1] to-[#94A3B8]",
  "from-[#DBEAFE] to-[#93C5FD]",
  "from-[#FEF3C7] to-[#FCD34D]",
  "from-[#FCE7F3] to-[#F9A8D4]",
] as const;

const MOCK_PRACTICES = [
  {
    id: "p1",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
  {
    id: "p2",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
  {
    id: "p3",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
  {
    id: "p4",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
];

type ModuleDetailState = {
  moduleName?: string;
  moduleDescription?: string;
};

export function ModuleDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as ModuleDetailState | null;
  const { level, courseId, moduleId } = useParams<{
    level: string;
    courseId: string;
    moduleId: string;
  }>();
  const [activeTab, setActiveTab] = useState<"video" | "practice">("video");
  const [activeFilter, setActiveFilter] = useState("Draft");
  const [lessons, setLessons] = useState<TopLevelModuleLessonItem[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsLoadError, setLessonsLoadError] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] =
    useState<TopLevelModuleLessonItem | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("");
  const [editLessonThumbnail, setEditLessonThumbnail] = useState("");
  const [editLessonDescription, setEditLessonDescription] = useState("");
  const [savingLessonEdit, setSavingLessonEdit] = useState(false);
  const [thumbUploadBusy, setThumbUploadBusy] = useState(false);
  const [videoUploadBusy, setVideoUploadBusy] = useState(false);
  const lessonMediaUploadBusy = thumbUploadBusy || videoUploadBusy;
  const [deletingLesson, setDeletingLesson] =
    useState<TopLevelModuleLessonItem | null>(null);
  const [deletingLessonInFlight, setDeletingLessonInFlight] = useState(false);
  const [practices] = useState(MOCK_PRACTICES);
  const [loadedModuleName, setLoadedModuleName] = useState<string | null>(null);
  const [loadedModuleDescription, setLoadedModuleDescription] = useState<
    string | null
  >(null);
  const [moduleListResolved, setModuleListResolved] = useState(
    Boolean(navState?.moduleName?.trim()),
  );

  const moduleTitleFallback =
    moduleId
      ?.split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Module";

  const displayModuleName =
    navState?.moduleName?.trim() ||
    loadedModuleName ||
    moduleTitleFallback;

  const hasNavName = Boolean(navState?.moduleName?.trim());

  const displayModuleDescription = (() => {
    if (hasNavName) {
      return navState?.moduleDescription?.trim() || "—";
    }
    if (!moduleListResolved) {
      return "Loading…";
    }
    if (loadedModuleDescription !== null) {
      return loadedModuleDescription.trim() || "—";
    }
    return "—";
  })();

  useEffect(() => {
    if (navState?.moduleName?.trim()) {
      return;
    }
    const id = Number(moduleId);
    const cid = Number(courseId);
    if (!Number.isFinite(id) || id < 1 || !Number.isFinite(cid) || cid < 1) {
      setModuleListResolved(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getTopLevelCourseModules(cid, { limit: 100, offset: 0 });
        if (cancelled) return;
        const list = res.data?.data?.modules;
        if (Array.isArray(list)) {
          const m = list.find((mod) => mod.id === id);
          if (m) {
            setLoadedModuleName(m.name);
            setLoadedModuleDescription(m.description ?? "");
          } else {
            setLoadedModuleName(null);
            setLoadedModuleDescription("");
          }
        } else {
          setLoadedModuleName(null);
          setLoadedModuleDescription(null);
        }
      } catch {
        if (!cancelled) {
          setLoadedModuleName(null);
          setLoadedModuleDescription(null);
        }
      } finally {
        if (!cancelled) {
          setModuleListResolved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navState?.moduleName, courseId, moduleId]);

  const loadModuleLessons = useCallback(
    async (options?: { showPageLoading?: boolean }) => {
      const showPageLoading = options?.showPageLoading ?? true;
      const mid = Number(moduleId);
      if (!Number.isFinite(mid) || mid < 1) {
        setLessons([]);
        setLessonsLoadError(null);
        setLessonsLoading(false);
        return;
      }
      if (showPageLoading) {
        setLessonsLoading(true);
        setLessonsLoadError(null);
      }
      try {
        const res = await getModuleLessons(mid, { limit: 100, offset: 0 });
        const list = res.data?.data?.lessons;
        if (Array.isArray(list)) {
          setLessons(
            [...list].sort(
              (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
            ),
          );
        } else {
          setLessons([]);
        }
        if (showPageLoading) {
          setLessonsLoadError(null);
        }
      } catch {
        if (showPageLoading) {
          setLessons([]);
          setLessonsLoadError("Failed to load lessons. Please try again.");
        } else {
          toast.error("Failed to refresh lessons");
        }
      } finally {
        if (showPageLoading) {
          setLessonsLoading(false);
        }
      }
    },
    [moduleId],
  );

  useEffect(() => {
    void loadModuleLessons({ showPageLoading: true });
  }, [loadModuleLessons]);

  const openEditLesson = (lesson: TopLevelModuleLessonItem) => {
    setEditingLesson(lesson);
    setEditLessonTitle(lesson.title ?? "");
    setEditLessonVideoUrl(lesson.video_url ?? "");
    setEditLessonThumbnail(lesson.thumbnail ?? "");
    setEditLessonDescription(lesson.description ?? "");
  };

  const closeEditLesson = () => {
    if (savingLessonEdit || lessonMediaUploadBusy) return;
    setEditingLesson(null);
  };

  const handleSaveLessonEdit = async () => {
    if (!editingLesson) return;
    const title = editLessonTitle.trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }
    setSavingLessonEdit(true);
    try {
      await updateTopLevelModuleLesson(editingLesson.id, {
        title,
        video_url: editLessonVideoUrl.trim(),
        thumbnail: editLessonThumbnail.trim(),
        description: editLessonDescription.trim(),
      });
      toast.success("Lesson updated");
      setEditingLesson(null);
      await loadModuleLessons({ showPageLoading: false });
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update lesson";
      toast.error(msg);
    } finally {
      setSavingLessonEdit(false);
    }
  };

  const handleConfirmDeleteLesson = async () => {
    if (!deletingLesson) return;
    setDeletingLessonInFlight(true);
    try {
      await deleteTopLevelModuleLesson(deletingLesson.id);
      toast.success("Lesson deleted");
      setDeletingLesson(null);
      await loadModuleLessons({ showPageLoading: false });
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete lesson";
      toast.error(msg);
    } finally {
      setDeletingLessonInFlight(false);
    }
  };

  return (
    <div className="space-y-10 pt-10 pb-20 animate-in fade-in duration-500">
      {/* Header Navigation */}
      <div className="flex items-center gap-2">
        <Link
          to={`/new-content/learn-english/${level}/courses/${courseId}`}
          className="flex items-center gap-2 text-[15px] font-medium text-grayScale-600 transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Modules
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="">
          <h1 className="text-2xl font-medium text-grayScale-900 tracking-tight">
            {displayModuleName}
          </h1>
          <p className="text-grayScale-500 text-[14px] max-w-2xl">
            {displayModuleDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-[6px] border-brand-500 text-brand-500 "
            onClick={() =>
              navigate(
                `/new-content/learn-english/${level}/courses/add-practice?backTo=module&courseId=${courseId}&moduleId=${moduleId}`,
              )
            }
          >
            <Calendar className="h-4 w-4" />
            Add Practice
          </Button>
          <Button
            className="rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
            onClick={() =>
              navigate(
                `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/add-video`,
              )
            }
          >
            <div className="h-4 w-4 flex items-center justify-center">
              <span className="text-xl leading-none font-light">+</span>
            </div>
            Add Lesson
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-grayScale-200">
        <div className="flex gap-10">
          <button
            onClick={() => setActiveTab("video")}
            className={cn(
              "pb-4 text-[16px] font-medium transition-all relative",
              activeTab === "video"
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-t-full"
                : "text-grayScale-400 hover:text-grayScale-600",
            )}
          >
            Lesson
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={cn(
              "pb-4 text-[16px] font-medium transition-all relative",
              activeTab === "practice"
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-t-full"
                : "text-grayScale-400 hover:text-grayScale-600",
            )}
          >
            Practice
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === "video" ? (
          lessonsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-grayScale-500 text-[15px] font-medium">
              Loading lessons…
            </div>
          ) : lessonsLoadError ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-6 py-8 text-center text-sm text-amber-900 max-w-lg mx-auto">
              {lessonsLoadError}
            </div>
          ) : lessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {lessons.map((lesson, i) => (
                <VideoCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  videoUrl={lesson.video_url}
                  hoverModuleActions
                  thumbnailUrl={resolveThumbnailForPreview(lesson.thumbnail)}
                  thumbnailGradient={LESSON_THUMB_GRADIENTS[i % LESSON_THUMB_GRADIENTS.length]}
                  onEdit={() => openEditLesson(lesson)}
                  onDelete={() => setDeletingLesson(lesson)}
                  description={lesson.description}
                  onAddPractice={() =>
                    navigate(
                      `/new-content/learn-english/${level}/courses/add-practice?backTo=module&courseId=${courseId}&moduleId=${moduleId}&lessonId=${lesson.id}&lessonTitle=${encodeURIComponent(lesson.title)}`,
                    )
                  }
                />
              ))}
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
                onClick={() =>
                  navigate(
                    `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/add-video`,
                  )
                }
              >
                <Video className="h-5 w-5" />
                Add Lesson
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {/* Practice Tab Filter Bar */}
            <div className="bg-white border border-grayScale-100 rounded-2xl p-4 flex items-center gap-10 shadow-sm overflow-x-auto whitespace-nowrap px-8">
              <div className="flex items-center gap-2 text-[12px] font-bold text-grayScale-300 uppercase tracking-widest mr-2">
                STATUS:
              </div>
              <div className="flex items-center gap-3">
                {["All", "Published", "Draft", "Archived"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setActiveFilter(label)}
                    className={cn(
                      "h-9 px-5 rounded-full text-[13px] font-bold transition-all",
                      activeFilter === label
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                        : "bg-[#F1F5F9] text-grayScale-500 hover:bg-grayScale-100",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {practices.map((practice) => (
                <PracticeCard key={practice.id} {...practice} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={editingLesson !== null}
        onOpenChange={(open) => {
          if (!open && (savingLessonEdit || lessonMediaUploadBusy)) return;
          if (!open) closeEditLesson();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit lesson</DialogTitle>
            <DialogDescription>
              Update details. Video and thumbnail files use{" "}
              <code className="rounded bg-grayScale-100 px-1 py-0.5 text-[11px]">
                POST /files/upload
              </code>
              ; the form is saved with{" "}
              <code className="rounded bg-grayScale-100 px-1 py-0.5 text-[11px]">
                PUT /lessons/:id
              </code>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-grayScale-700"
                htmlFor="edit-lesson-title"
              >
                Title
              </label>
              <Input
                id="edit-lesson-title"
                value={editLessonTitle}
                onChange={(e) => setEditLessonTitle(e.target.value)}
                disabled={savingLessonEdit}
              />
            </div>
            <LessonMediaUploadField
              kind="video"
              value={editLessonVideoUrl}
              onChange={setEditLessonVideoUrl}
              disabled={savingLessonEdit}
              onUploadBusyChange={setVideoUploadBusy}
            />
            <LessonMediaUploadField
              kind="thumbnail"
              value={editLessonThumbnail}
              onChange={setEditLessonThumbnail}
              disabled={savingLessonEdit}
              onUploadBusyChange={setThumbUploadBusy}
            />
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-grayScale-700"
                htmlFor="edit-lesson-desc"
              >
                Description
              </label>
              <Textarea
                id="edit-lesson-desc"
                value={editLessonDescription}
                onChange={(e) => setEditLessonDescription(e.target.value)}
                rows={4}
                disabled={savingLessonEdit}
                className="min-h-[100px] resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditLesson}
              disabled={savingLessonEdit || lessonMediaUploadBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveLessonEdit()}
              disabled={savingLessonEdit || lessonMediaUploadBusy}
            >
              {savingLessonEdit ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deletingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
              <h2 className="text-lg font-bold text-grayScale-700">
                Delete lesson
              </h2>
              <button
                type="button"
                onClick={() =>
                  !deletingLessonInFlight && setDeletingLesson(null)
                }
                disabled={deletingLessonInFlight}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600 disabled:pointer-events-none disabled:opacity-50"
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
                  {deletingLesson.title}
                </span>
                ? This cannot be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingLesson(null)}
                disabled={deletingLessonInFlight}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full bg-red-500 shadow-sm transition-all hover:bg-red-600 hover:shadow-md sm:w-auto"
                disabled={deletingLessonInFlight}
                onClick={() => void handleConfirmDeleteLesson()}
              >
                {deletingLessonInFlight ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PracticeCard({
  title,
  level,
  variations,
  status,
}: {
  title: string;
  level: string;
  variations: number;
  status: string;
}) {
  return (
    <div className="bg-white rounded-[24px] border border-grayScale-50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-grayScale-400/5 transition-all group p-6 flex flex-col h-full min-h-[340px]">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-grayScale-900 line-clamp-1">
            {title}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="bg-[#22C55E] text-white text-[11px] font-bold px-2 py-1 rounded-[4px]">
            {level}
          </span>
          <div className="flex items-center gap-1.5 text-grayScale-500">
            <Mic className="h-4 w-4" />
            <span className="text-[13px] font-bold">Speaking</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-brand-400 w-fit py-2  rounded-xl">
          <Layers className="h-4 w-4" />
          <span className="text-[14px] font-bold">{variations} Variations</span>
        </div>

        <div className="flex border-t border-grayScale-200 items-center justify-between pt-2">
          <div className="bg-grayScale-100 text-grayScale-400 text-[11px] font-bold px-3 py-1.5 rounded-[6px] tracking-wide uppercase">
            {status}
          </div>
          <div className="flex items-center gap-3">
            <button className="h-8 w-8 rounded-lg  flex items-center justify-center text-grayScale-400 hover:text-brand-500 hover:border-brand-100 transition-all">
              <Edit2 className="h-5 w-5" />
            </button>
            <button className="h-8 w-8 rounded-lg  flex items-center justify-center text-grayScale-400 hover:text-red-500 hover:border-red-100 transition-all">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button className="bg-brand-500 text-white rounded-xl h-11 text-[13px] font-bold shadow-md shadow-brand-500/10 hover:bg-brand-600 transition-all px-0">
          Publish Practice
        </Button>
        <Button
          variant="outline"
          className="border-brand-500 text-brand-500 rounded-xl h-11 text-[13px] font-bold bg-white hover:bg-brand-50 transition-all px-0"
        >
          Publish Video
        </Button>
      </div>
    </div>
  );
}
