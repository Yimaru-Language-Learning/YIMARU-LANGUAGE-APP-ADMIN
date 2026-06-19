import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Edit2,
  Hash,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteExamPrepPractice,
  getExamPrepLessonPractices,
  getPracticesByParentLesson,
  setExamPrepPracticePublishStatus,
  setLearnEnglishPracticePublishStatus,
} from "../../api/courses.api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { PracticeActionButton } from "./components/PracticeActionButton";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type {
  ExamPrepLessonPractice,
  GetExamPrepLessonPracticesResponse,
  GetPracticesByParentContextResponse,
  ParentContextPractice,
  PracticePublishStatus,
} from "../../types/course.types";
import { ContentPublishStatusChip } from "./components/ContentPublishStatusChip";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import {
  filterBySearchAndPublishStatus,
  type PublishStatusFilter,
} from "../../lib/contentListFilters";
import { resolveThumbnailForPreview } from "../../lib/videoPreview";
import { cn } from "../../lib/utils";

function unwrapPracticesEnvelope(
  res: { data?: GetPracticesByParentContextResponse & { Data?: GetPracticesByParentContextResponse["data"] } },
): GetPracticesByParentContextResponse["data"] | null {
  const b = res.data;
  if (!b) return null;
  return b.data ?? b.Data ?? null;
}

function unwrapExamPrepPracticesEnvelope(
  res: { data?: GetExamPrepLessonPracticesResponse & { Data?: GetExamPrepLessonPracticesResponse["data"] } },
): GetExamPrepLessonPracticesResponse["data"] | null {
  const b = res.data;
  if (!b) return null;
  return b.data ?? b.Data ?? null;
}

function mapExamPrepPracticeToCard(
  practice: ExamPrepLessonPractice,
): ParentContextPractice {
  return {
    id: practice.id,
    parents: [{ parent_kind: "LESSON", parent_id: practice.lesson_id }],
    parent_kind: "LESSON",
    parent_id: practice.lesson_id,
    title: practice.title,
    story_description: practice.story_description ?? "",
    story_image: practice.story_image ?? "",
    question_set_id: practice.question_set_id,
    quick_tips: practice.quick_tips ?? "",
    publish_status: practice.publish_status,
    persona_id: practice.persona_id,
    created_at: practice.created_at,
  };
}

function formatPracticeDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function PracticeCard({
  practice,
  index,
  total,
  onEdit,
  onDelete,
  onTogglePublishStatus,
  publishStatusUpdating,
}: {
  practice: ParentContextPractice;
  index: number;
  total: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePublishStatus?: (nextStatus: PracticePublishStatus) => void;
  publishStatusUpdating?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const thumb = resolveThumbnailForPreview(practice.story_image);
  const showThumb = Boolean(thumb) && !imgFailed;

  return (
    <Card
      className={cn(
        "overflow-hidden border-grayScale-100/90 bg-white shadow-sm transition-all duration-300",
        "hover:border-brand-200/60 hover:shadow-md hover:shadow-brand-500/5",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="relative shrink-0 lg:w-[280px]">
            <div
              className={cn(
                "relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-grayScale-100 to-grayScale-50 lg:aspect-auto lg:h-full lg:min-h-[220px]",
                !showThumb && "grid min-h-[180px] place-items-center lg:min-h-[220px]",
              )}
            >
              {showThumb ? (
                <>
                  <img
                    src={thumb!}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-grayScale-400">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-inner ring-1 ring-grayScale-200/80">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    No cover image
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-7">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-500">
                  Practice {index + 1} of {total}
                </span>
                <Badge variant="secondary" className="font-mono text-[10px] font-semibold">
                  ID {practice.id}
                </Badge>
                <ContentPublishStatusChip
                  publishStatus={practice.publish_status}
                  updating={publishStatusUpdating}
                  contentLabel="practice"
                  onToggle={onTogglePublishStatus}
                />
              </div>
              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              ) : null}
            </div>

            <h2 className="text-xl font-semibold leading-snug tracking-tight text-grayScale-900 sm:text-[1.35rem]">
              {practice.title}
            </h2>

            {practice.story_description?.trim() ? (
              <div className="mt-4 rounded-xl border border-grayScale-100 bg-grayScale-50/80 px-4 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-grayScale-400">
                  Story & instructions
                </p>
                <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-grayScale-700">
                  {practice.story_description}
                </p>
              </div>
            ) : null}

            {practice.quick_tips?.trim() ? (
              <div className="mt-4 border-l-[3px] border-amber-400 bg-gradient-to-r from-amber-50/90 to-amber-50/30 py-3 pl-4 pr-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/75">
                  Quick tips
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-grayScale-800">
                  {practice.quick_tips}
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-grayScale-100 pt-5">
              <Badge variant="secondary" className="gap-1.5 pl-2 pr-2.5 py-1 font-medium normal-case">
                <Hash className="h-3 w-3 opacity-70" aria-hidden />
                Question set {practice.question_set_id}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 pl-2 pr-2.5 py-1 font-medium normal-case">
                <Clock className="h-3 w-3 opacity-70" aria-hidden />
                {formatPracticeDate(practice.created_at)}
              </Badge>
              {onEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto h-9 rounded-[10px] border-brand-500 text-xs font-bold text-brand-500 hover:bg-brand-50"
                  onClick={onEdit}
                >
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LessonPracticesPage() {
  const navigate = useNavigate();
  const { level, programType, courseId, unitId, moduleId, lessonId } = useParams<{
    level?: string;
    programType?: string;
    courseId?: string;
    unitId?: string;
    moduleId?: string;
    lessonId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const lessonTitle = searchParams.get("lessonTitle")?.trim() || "";

  const isExamPrep = Boolean(programType?.trim());
  const backHref = isExamPrep
    ? `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}`
    : `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`;

  const [practices, setPractices] = useState<ParentContextPractice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [practiceToDelete, setPracticeToDelete] = useState<ParentContextPractice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishStatusUpdatingId, setPublishStatusUpdatingId] = useState<
    number | null
  >(null);
  const [listSearch, setListSearch] = useState("");
  const [publishStatusFilter, setPublishStatusFilter] =
    useState<PublishStatusFilter>("all");

  const filteredPractices = useMemo(
    () =>
      filterBySearchAndPublishStatus(practices, {
        search: listSearch,
        publishStatusFilter,
        getSearchFields: (p) => [
          p.title,
          p.story_description,
          p.quick_tips,
        ],
        getPublishStatus: (p) => p.publish_status,
      }),
    [listSearch, practices, publishStatusFilter],
  );

  const lid = lessonId ? Number(lessonId) : NaN;
  const validLesson = Number.isFinite(lid) && lid > 0;

  const load = useCallback(async () => {
    if (!validLesson) {
      setLoading(false);
      setLoadError("Invalid lesson.");
      setPractices([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      if (isExamPrep) {
        const res = await getExamPrepLessonPractices(lid, { limit: 100, offset: 0 });
        const envelope = unwrapExamPrepPracticesEnvelope(res);
        const list = Array.isArray(envelope?.practices)
          ? envelope.practices.map(mapExamPrepPracticeToCard)
          : [];
        setPractices(list);
        setTotalCount(
          typeof envelope?.total_count === "number"
            ? envelope.total_count
            : list.length,
        );
      } else {
        const res = await getPracticesByParentLesson(lid, { limit: 100, offset: 0 });
        const envelope = unwrapPracticesEnvelope(res);
        const list = Array.isArray(envelope?.practices) ? envelope.practices : [];
        setPractices(list);
        setTotalCount(
          typeof envelope?.total_count === "number"
            ? envelope.total_count
            : list.length,
        );
      }
    } catch {
      setPractices([]);
      setTotalCount(0);
      setLoadError("Could not load practices for this lesson.");
      toast.error("Failed to load practices");
    } finally {
      setLoading(false);
    }
  }, [isExamPrep, lid, validLesson]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayTitle =
    lessonTitle || (validLesson ? `Lesson #${lid}` : "Lesson practices");

  const practicePathOptions = useMemo(
    () => ({
      isExamPrep,
      level,
      programType,
      courseId,
      unitId,
      moduleId,
      lessonId: validLesson ? String(lid) : null,
      lessonTitle: lessonTitle || displayTitle,
      backTo: isExamPrep ? "lesson" : "module",
    }),
    [
      isExamPrep,
      level,
      programType,
      courseId,
      unitId,
      moduleId,
      validLesson,
      lid,
      lessonTitle,
      displayTitle,
    ],
  );

  const editPracticeHref = (practiceId: number) => {
    const titleQuery = lessonTitle
      ? `lessonTitle=${encodeURIComponent(lessonTitle)}&`
      : "";
    if (isExamPrep) {
      return `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}/lessons/${lid}/edit-practice/${practiceId}?${titleQuery}backTo=lesson`;
    }
    return `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/lessons/${lid}/edit-practice/${practiceId}?${titleQuery}backTo=lesson`;
  };

  const handlePracticePublishStatus = async (
    practiceId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusUpdatingId(practiceId);
    try {
      if (isExamPrep) {
        await setExamPrepPracticePublishStatus(practiceId, {
          publish_status: nextStatus,
        });
      } else {
        await setLearnEnglishPracticePublishStatus(practiceId, {
          publish_status: nextStatus,
        });
      }
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
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update practice status");
    } finally {
      setPublishStatusUpdatingId(null);
    }
  };

  const confirmDeletePractice = async () => {
    if (!practiceToDelete) return;
    setDeleting(true);
    try {
      await deleteExamPrepPractice(practiceToDelete.id);
      toast.success("Practice deleted");
      setPracticeToDelete(null);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete practice");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F6FB] via-white to-[#F8FAFC]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/[0.06] blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-violet-500/[0.05] blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Link
            to={backHref}
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-transparent px-1 py-1 text-[14px] font-medium text-grayScale-600 transition-colors hover:border-grayScale-200 hover:bg-white/80 hover:text-brand-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-grayScale-100 transition-transform group-hover:-translate-x-0.5">
              <ArrowLeft className="h-4 w-4" />
            </span>
            Back to module
          </Link>

          <Card className="mb-10 border-grayScale-100/80 bg-white/90 shadow-md shadow-grayScale-200/40 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25">
                    <BookOpen className="h-7 w-7" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-500/90">
                      Lesson practices
                    </p>
                    <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-grayScale-900 sm:text-3xl">
                      {displayTitle}
                    </h1>
                    <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-grayScale-500">
                      Review speaking practices linked to this lesson. Thumbnails
                      and copy come from your published practice content.
                    </p>
                    {!loading && !loadError ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge variant="default" className="px-3 py-1 text-xs font-semibold">
                          {practices.length}{" "}
                          {practices.length === 1 ? "practice" : "practices"}
                        </Badge>
                        {totalCount > practices.length ? (
                          <span className="text-[12px] text-grayScale-500">
                            Showing {practices.length} of {totalCount}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <PracticeActionButton
                    type="button"
                    className="h-11 rounded-xl bg-brand-500 px-6 font-semibold shadow-md shadow-brand-500/20 hover:bg-brand-600"
                    pathOptions={practicePathOptions}
                    parentLabel={displayTitle}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Add practice
                  </PracticeActionButton>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-grayScale-200 font-semibold text-grayScale-700 hover:bg-grayScale-50"
                    disabled={loading}
                    onClick={() => void load()}
                  >
                    <RefreshCw
                      className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card className="border-grayScale-100 bg-white/95 py-20 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-semibold text-grayScale-800">
                    Loading practices
                  </p>
                  <p className="mt-1 text-[14px] text-grayScale-500">
                    Fetching content for this lesson…
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : loadError ? (
            <Card className="border-red-100 bg-gradient-to-br from-red-50/90 to-white shadow-sm">
              <CardContent className="flex flex-col items-center gap-5 py-14 text-center sm:py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-grayScale-900">
                    Something went wrong
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-grayScale-600">
                    {loadError}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-grayScale-300 font-semibold"
                  onClick={() => void load()}
                >
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : practices.length === 0 ? (
            <Card className="border-dashed border-grayScale-200 bg-white/90 shadow-sm">
              <CardContent className="flex flex-col items-center px-6 py-16 text-center sm:py-20">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-50 to-brand-50 ring-1 ring-brand-100/60">
                  <Sparkles className="h-9 w-9 text-brand-500" strokeWidth={1.5} />
                </div>
                <p className="text-xl font-semibold text-grayScale-900">
                  No practices yet
                </p>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-grayScale-500">
                  This lesson does not have any linked practices. Create one to
                  give learners a structured speaking activity after the video.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <PracticeActionButton
                    type="button"
                    className="h-11 rounded-xl bg-brand-500 px-8 font-semibold shadow-md shadow-brand-500/15 hover:bg-brand-600"
                    pathOptions={practicePathOptions}
                    parentLabel={displayTitle}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Create practice
                  </PracticeActionButton>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-grayScale-200 px-8 font-semibold"
                    asChild
                  >
                    <Link to={backHref}>Return to module</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              <ContentListSearchFilterBar
                search={listSearch}
                onSearchChange={setListSearch}
                publishStatusFilter={publishStatusFilter}
                onPublishStatusFilterChange={setPublishStatusFilter}
                searchPlaceholder="Search practices by title or description…"
                searchAriaLabel="Search practices"
              />
              {filteredPractices.length === 0 ? (
                <Card className="border-dashed border-grayScale-200 bg-white/90 shadow-sm">
                  <CardContent className="px-6 py-14 text-center">
                    <p className="text-sm font-medium text-grayScale-600">
                      No practices match your search or status filter
                    </p>
                  </CardContent>
                </Card>
              ) : (
              filteredPractices.map((p, i) => (
                <PracticeCard
                  key={p.id}
                  practice={p}
                  index={i}
                  total={filteredPractices.length}
                  onEdit={() => void navigate(editPracticeHref(p.id))}
                  onDelete={
                    isExamPrep ? () => setPracticeToDelete(p) : undefined
                  }
                  publishStatusUpdating={publishStatusUpdatingId === p.id}
                  onTogglePublishStatus={(nextStatus) =>
                    void handlePracticePublishStatus(p.id, nextStatus)
                  }
                />
              ))
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={practiceToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPracticeToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this practice?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-grayScale-600">
            <span className="font-semibold text-grayScale-900">
              {practiceToDelete?.title}
            </span>{" "}
            will be removed from this lesson. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setPracticeToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDeletePractice()}
            >
              {deleting ? "Deleting…" : "Delete practice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
