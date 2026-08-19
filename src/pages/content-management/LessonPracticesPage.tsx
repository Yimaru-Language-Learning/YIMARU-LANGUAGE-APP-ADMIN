import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Calendar, RefreshCw } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  deleteExamPrepPractice,
  deleteParentLinkedPractice,
  getExamPrepLessonPractices,
  getPracticesByParentLesson,
  setExamPrepPracticePublishStatus,
  setLearnEnglishPracticePublishStatus,
} from "../../api/courses.api";
import {
  learnEnglishPracticeLimitHint,
  parentsFromPractice,
} from "../../lib/practiceParents";
import {
  isPracticeParentUnlinkNotLinkedError,
  unlinkPracticeFromParent,
} from "../../lib/practiceParentUnlink";
import { Button } from "../../components/ui/button";
import { PracticeActionButton } from "./components/PracticeActionButton";
import { PracticeSelectableGrid } from "./components/PracticeSelectableGrid";
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
  ParentContextPractice,
  PracticeParent,
  PracticePublishStatus,
} from "../../types/course.types";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import { ContentPageDescription } from "./components/ContentPageDescription";
import {
  filterBySearchAndPublishStatus,
  type PublishStatusFilter,
} from "../../lib/contentListFilters";
import { cn } from "../../lib/utils";
import { fetchAllOffsetPages } from "../../lib/fetchAllOffsetPages";
import { unwrapPracticesPage } from "../../lib/parentContextPractice";

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
  const [practiceToUnlink, setPracticeToUnlink] = useState<ParentContextPractice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
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
        const list = await fetchAllOffsetPages(async (offset, limit) => {
          const res = await getExamPrepLessonPractices(lid, { limit, offset });
          const envelope = unwrapExamPrepPracticesEnvelope(res);
          const practices = Array.isArray(envelope?.practices)
            ? envelope.practices.map(mapExamPrepPracticeToCard)
            : [];
          return {
            items: practices,
            total_count: envelope?.total_count,
          };
        });
        setPractices(list);
        setTotalCount(list.length);
      } else {
        const list = await fetchAllOffsetPages(async (offset, limit) =>
          unwrapPracticesPage(
            await getPracticesByParentLesson(lid, { limit, offset }),
          ),
        );
        setPractices(list);
        setTotalCount(list.length);
      }
    } catch (error) {
      setPractices([]);
      setTotalCount(0);
      setLoadError("Could not load practices for this lesson.");
      notifyApiError(error, "Failed to load practices");
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
      backTo: "lesson",
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
      notifyApiError(err, "Failed to update practice status");
    } finally {
      setPublishStatusUpdatingId(null);
    }
  };

  const lessonParent = useMemo(
    (): PracticeParent => ({ parent_kind: "LESSON", parent_id: lid }),
    [lid],
  );

  const confirmUnlinkPractice = async () => {
    if (!practiceToUnlink) return;
    setUnlinking(true);
    try {
      await unlinkPracticeFromParent({
        practiceId: practiceToUnlink.id,
        parent: lessonParent,
        isExamPrep,
      });
      toast.success(`Practice removed from ${displayTitle}`);
      setPracticeToUnlink(null);
      await load();
    } catch (error) {
      if (isPracticeParentUnlinkNotLinkedError(error)) {
        toast.info("This location was already removed.");
        setPracticeToUnlink(null);
        await load();
        return;
      }
      notifyApiError(error, "Could not remove from lesson");
    } finally {
      setUnlinking(false);
    }
  };

  const confirmDeletePractice = async () => {
    if (!practiceToDelete) return;
    setDeleting(true);
    try {
      if (isExamPrep) {
        await deleteExamPrepPractice(practiceToDelete.id);
      } else {
        await deleteParentLinkedPractice(practiceToDelete.id);
      }
      toast.success("Practice deleted");
      setPracticeToDelete(null);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      notifyApiError(err, "Failed to delete practice");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-10 pt-10 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <Link
          to={backHref}
          className="flex items-center gap-2 text-[15px] font-medium text-grayScale-600 transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to module
        </Link>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium tracking-tight text-grayScale-900">
            {displayTitle}
          </h1>
          <ContentPageDescription className="mt-1 text-[14px] text-grayScale-500">
            Review speaking practices linked to this lesson.
          </ContentPageDescription>
          {!isExamPrep && practices.length >= 1 ? (
            <p className="mt-2 text-sm text-grayScale-500">
              {learnEnglishPracticeLimitHint}
            </p>
          ) : null}
          {!loading && !loadError ? (
            <p className="mt-2 text-sm text-grayScale-500">
              {totalCount} practice{totalCount === 1 ? "" : "s"} linked to this
              lesson
              {totalCount > practices.length
                ? ` · showing ${practices.length}`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-[6px] border-grayScale-200 text-grayScale-600"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw
              className={cn("h-4 w-4", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <PracticeActionButton
            className="rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
            pathOptions={practicePathOptions}
            parentLabel={displayTitle}
            disabled={!isExamPrep && practices.length >= 1}
            title={
              !isExamPrep && practices.length >= 1
                ? learnEnglishPracticeLimitHint
                : undefined
            }
          >
            <Calendar className="h-4 w-4" />
            Add Practice
          </PracticeActionButton>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[15px] font-medium text-grayScale-500">
          Loading practices…
        </div>
      ) : loadError ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-100 bg-amber-50/80 px-6 py-8 text-center text-sm text-amber-900">
          {loadError}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : practices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-grayScale-300" />
          <p className="text-sm font-medium text-grayScale-600">
            No practices for this lesson yet
          </p>
          <p className="mt-1 max-w-md text-sm text-grayScale-400">
            Add a practice to give learners a structured speaking activity after
            the video.
          </p>
          <PracticeActionButton
            variant="outline"
            className="mt-6 rounded-[6px] border-brand-500 text-brand-500"
            pathOptions={practicePathOptions}
            parentLabel={displayTitle}
          >
            <Calendar className="h-4 w-4" />
            Add Practice
          </PracticeActionButton>
        </div>
      ) : (
        <div className="space-y-8">
          <ContentListSearchFilterBar
            search={listSearch}
            onSearchChange={setListSearch}
            publishStatusFilter={publishStatusFilter}
            onPublishStatusFilterChange={setPublishStatusFilter}
            searchPlaceholder="Search practices by title or description…"
            searchAriaLabel="Search practices"
          />
          {filteredPractices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-grayScale-600">
                No practices match your search or status filter
              </p>
            </div>
          ) : (
            <PracticeSelectableGrid
              practices={filteredPractices}
              searchQuery={listSearch}
              locationLabel={displayTitle}
              unlinkContext={{ scope: "lesson", lessonId: lid }}
              isExamPrep={isExamPrep}
              publishStatusUpdatingId={publishStatusUpdatingId}
              onReload={load}
              unlinkActionLabel="Remove from lesson"
              deleteActionLabel="Delete selected"
              onEdit={(practice) => void navigate(editPracticeHref(practice.id))}
              onPublish={(practiceId) =>
                void handlePracticePublishStatus(practiceId, "PUBLISHED")
              }
              onSaveAsDraft={(practiceId) =>
                void handlePracticePublishStatus(practiceId, "DRAFT")
              }
              onUnlink={(practice) => setPracticeToUnlink(practice)}
              onDelete={(practice) => setPracticeToDelete(practice)}
            />
          )}
        </div>
      )}

      <Dialog
        open={practiceToUnlink !== null}
        onOpenChange={(open) => {
          if (!open && !unlinking) setPracticeToUnlink(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Remove from this lesson?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-grayScale-600">
            <span className="font-semibold text-grayScale-800">
              {practiceToUnlink?.title}
            </span>{" "}
            will be detached from{" "}
            <span className="font-semibold text-grayScale-800">{displayTitle}</span>.
            {practiceToUnlink &&
            parentsFromPractice(practiceToUnlink).filter(
              (p) =>
                !(
                  p.parent_kind === lessonParent.parent_kind &&
                  p.parent_id === lessonParent.parent_id
                ),
            ).length === 0
              ? " The practice will be unlinked until you attach it again. Questions are kept."
              : " Other locations are unaffected."}
          </p>
          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={unlinking}
              onClick={() => setPracticeToUnlink(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={unlinking}
              onClick={() => void confirmUnlinkPractice()}
            >
              {unlinking ? "Removing…" : "Remove from lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={practiceToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPracticeToDelete(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete this practice permanently?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-grayScale-600">
            <span className="font-semibold text-grayScale-800">
              {practiceToDelete?.title}
            </span>{" "}
            and all of its questions will be deleted. This cannot be undone.
          </p>
          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
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
