import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Video, Calendar, Trash2, X } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteTopLevelModuleLesson,
  getModuleLessons,
  getPracticesByParentModule,
  getTopLevelCourseModules,
  publishTopLevelModuleLesson,
  setParentLinkedPracticePublishStatus,
  setTopLevelModuleLessonAccessTier,
  updateTopLevelModuleLesson,
} from "../../api/courses.api";
import type {
  ContentAccessTier,
  ParentContextPractice,
  PracticePublishStatus,
  TopLevelModuleLessonItem,
} from "../../types/course.types";
import { unwrapPracticesList } from "../../lib/parentContextPractice";
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
import { ModulePracticeCard } from "./components/ModulePracticeCard";
import { VideoCard } from "./components/VideoCard";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import { ContentPageDescription } from "./components/ContentPageDescription";
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
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonPublishStatusFilter, setLessonPublishStatusFilter] =
    useState<PublishStatusFilter>("all");
  const [practiceSearch, setPracticeSearch] = useState("");
  const [practicePublishStatusFilter, setPracticePublishStatusFilter] =
    useState<PublishStatusFilter>("all");
  const [lessons, setLessons] = useState<TopLevelModuleLessonItem[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsLoadError, setLessonsLoadError] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] =
    useState<TopLevelModuleLessonItem | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonSortOrder, setEditLessonSortOrder] = useState("");
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
  const [publishStatusLessonId, setPublishStatusLessonId] = useState<
    number | null
  >(null);
  const [accessTierLessonId, setAccessTierLessonId] = useState<number | null>(
    null,
  );
  const [practices, setPractices] = useState<ParentContextPractice[]>([]);
  const [practicesLoading, setPracticesLoading] = useState(false);
  const [practicesLoadError, setPracticesLoadError] = useState<string | null>(
    null,
  );
  const [publishStatusPracticeId, setPublishStatusPracticeId] = useState<
    number | null
  >(null);
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

  const loadModulePractices = useCallback(async () => {
    const mid = Number(moduleId);
    if (!Number.isFinite(mid) || mid < 1) {
      setPractices([]);
      setPracticesLoadError(null);
      setPracticesLoading(false);
      return;
    }
    setPracticesLoading(true);
    setPracticesLoadError(null);
    try {
      const res = await getPracticesByParentModule(mid, {
        limit: 100,
        offset: 0,
      });
      setPractices(unwrapPracticesList(res));
    } catch {
      setPractices([]);
      setPracticesLoadError("Failed to load practices. Please try again.");
    } finally {
      setPracticesLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (activeTab !== "practice") return;
    void loadModulePractices();
  }, [activeTab, loadModulePractices]);

  const filteredLessons = useMemo(
    () =>
      filterBySearchAndPublishStatus(lessons, {
        search: lessonSearch,
        publishStatusFilter: lessonPublishStatusFilter,
        getSearchFields: (l) => [l.title, l.description],
        getPublishStatus: (l) => l.publish_status,
      }),
    [lessonPublishStatusFilter, lessonSearch, lessons],
  );

  const filteredPractices = useMemo(
    () =>
      filterBySearchAndPublishStatus(practices, {
        search: practiceSearch,
        publishStatusFilter: practicePublishStatusFilter,
        getSearchFields: (p) => [
          p.title,
          p.story_description,
          p.quick_tips,
        ],
        getPublishStatus: (p) => p.publish_status,
      }),
    [practicePublishStatusFilter, practiceSearch, practices],
  );

  const handlePracticePublishStatus = async (
    practiceId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusPracticeId(practiceId);
    try {
      await setParentLinkedPracticePublishStatus(practiceId, {
        publish_status: nextStatus,
      });
      setPractices((prev) =>
        prev.map((p) =>
          p.id === practiceId ? { ...p, publish_status: nextStatus } : p,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Practice published"
          : "Practice saved as draft",
      );
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update practice status";
      toast.error(msg);
    } finally {
      setPublishStatusPracticeId(null);
    }
  };

  const openEditLesson = (lesson: TopLevelModuleLessonItem) => {
    setEditingLesson(lesson);
    setEditLessonTitle(lesson.title ?? "");
    setEditLessonSortOrder(String(lesson.sort_order ?? 0));
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
    const sortOrderRaw = editLessonSortOrder.trim();
    if (sortOrderRaw === "") {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setSavingLessonEdit(true);
    try {
      await updateTopLevelModuleLesson(editingLesson.id, {
        title,
        video_url: editLessonVideoUrl.trim(),
        thumbnail: editLessonThumbnail.trim(),
        description: editLessonDescription.trim(),
        sort_order,
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

  const handleToggleLessonPublishStatus = async (
    lessonId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusLessonId(lessonId);
    try {
      await publishTopLevelModuleLesson(lessonId, {
        publish_status: nextStatus,
      });
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId ? { ...l, publish_status: nextStatus } : l,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Lesson published"
          : "Lesson saved as draft",
      );
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (nextStatus === "PUBLISHED"
          ? "Failed to publish lesson"
          : "Failed to save lesson as draft");
      toast.error(msg);
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
      await setTopLevelModuleLessonAccessTier(lessonId, {
        access_tier: nextTier,
      });
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId ? { ...l, access_tier: nextTier } : l,
        ),
      );
      toast.success(
        nextTier === "PREMIUM" ? "Lesson set to Premium" : "Lesson set to Free",
      );
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update lesson access tier";
      toast.error(msg);
    } finally {
      setAccessTierLessonId(null);
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
          <ContentPageDescription className="text-[14px] text-grayScale-500">
            {displayModuleDescription}
          </ContentPageDescription>
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
                  videoUrl={lesson.video_url}
                  publishStatus={lesson.publish_status}
                  hoverModuleActions
                  thumbnailUrl={resolveThumbnailForPreview(lesson.thumbnail)}
                  thumbnailGradient={LESSON_THUMB_GRADIENTS[i % LESSON_THUMB_GRADIENTS.length]}
                  durationSeconds={(() => {
                    const raw =
                      lesson.duration_seconds ?? lesson.duration ?? null;
                    if (raw == null) return null;
                    const n = typeof raw === "number" ? raw : Number(raw);
                    return Number.isFinite(n) && n > 0 ? n : null;
                  })()}
                  onEdit={() => openEditLesson(lesson)}
                  onDelete={() => setDeletingLesson(lesson)}
                  description={lesson.description}
                  onAddPractice={() =>
                    navigate(
                      `/new-content/learn-english/${level}/courses/add-practice?backTo=module&courseId=${courseId}&moduleId=${moduleId}&lessonId=${lesson.id}&lessonTitle=${encodeURIComponent(lesson.title)}`,
                    )
                  }
                  onViewPractices={() =>
                    navigate(
                      `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/practices?lessonTitle=${encodeURIComponent(lesson.title ?? "")}`,
                    )
                  }
                  onTogglePublishStatus={(nextStatus) =>
                    void handleToggleLessonPublishStatus(lesson.id, nextStatus)
                  }
                  publishStatusUpdating={publishStatusLessonId === lesson.id}
                  accessTier={lesson.access_tier}
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
            <ContentListSearchFilterBar
              search={practiceSearch}
              onSearchChange={setPracticeSearch}
              publishStatusFilter={practicePublishStatusFilter}
              onPublishStatusFilterChange={setPracticePublishStatusFilter}
              searchPlaceholder="Search practices by title or description…"
              searchAriaLabel="Search practices"
            />

            {practicesLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-grayScale-500 text-[15px] font-medium">
                Loading practices…
              </div>
            ) : practicesLoadError ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-6 py-8 text-center text-sm text-amber-900 max-w-lg mx-auto">
                {practicesLoadError}
              </div>
            ) : filteredPractices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredPractices.map((practice) => (
                  <ModulePracticeCard
                    key={practice.id}
                    practice={practice}
                    statusUpdating={publishStatusPracticeId === practice.id}
                    onEdit={() =>
                      navigate(
                        `/content/practices?type=module&id=${moduleId}`,
                      )
                    }
                    onPublish={() =>
                      void handlePracticePublishStatus(
                        practice.id,
                        "PUBLISHED",
                      )
                    }
                    onSaveAsDraft={() =>
                      void handlePracticePublishStatus(practice.id, "DRAFT")
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 px-4 rounded-[40px] border-2 border-dashed border-[#F1F5F9] bg-white max-w-4xl mx-auto shadow-sm">
                <div className="h-20 w-20 rounded-full bg-[#FAF5FF] flex items-center justify-center mb-6">
                  <div className="h-14 w-14 rounded-full bg-[#F5EBFF] flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-brand-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-grayScale-900 mb-3">
                  {practices.length === 0
                    ? "No practices in this module yet"
                    : "No practices match your search or status filter"}
                </h2>
                <p className="text-grayScale-400 font-medium text-[15px] text-center max-w-sm mb-10 leading-relaxed">
                  {practices.length === 0
                    ? "Add a practice to give learners speaking exercises for this module."
                    : "Try different keywords or clear the publish status filter."}
                </p>
                {practices.length === 0 ? (
                  <Button
                    variant="outline"
                    className="h-12 px-8 rounded-xl border-brand-500 text-brand-500 font-bold hover:bg-brand-50 transition-all flex items-center gap-2"
                    onClick={() =>
                      navigate(
                        `/new-content/learn-english/${level}/courses/add-practice?backTo=module&courseId=${courseId}&moduleId=${moduleId}`,
                      )
                    }
                  >
                    <Calendar className="h-5 w-5" />
                    Add Practice
                  </Button>
                ) : null}
              </div>
            )}
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
              Update lesson details. Uploaded video and thumbnail files are stored automatically.
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
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-grayScale-700"
                htmlFor="edit-lesson-sort-order"
              >
                Sort order
              </label>
              <Input
                id="edit-lesson-sort-order"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={editLessonSortOrder}
                onChange={(e) => setEditLessonSortOrder(e.target.value)}
                disabled={savingLessonEdit}
                className="max-w-[200px]"
              />
              <p className="text-xs text-grayScale-500">
                Whole number, 0 or greater.
              </p>
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
