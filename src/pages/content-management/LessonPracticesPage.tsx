import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Hash,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getPracticesByParentLesson } from "../../api/courses.api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import type {
  GetPracticesByParentContextResponse,
  ParentContextPractice,
} from "../../types/course.types";
import { resolveThumbnailForPreview } from "../../lib/videoPreview";
import { cn } from "../../lib/utils";

function unwrapPracticesEnvelope(
  res: { data?: GetPracticesByParentContextResponse & { Data?: GetPracticesByParentContextResponse["data"] } },
): GetPracticesByParentContextResponse["data"] | null {
  const b = res.data;
  if (!b) return null;
  return b.data ?? b.Data ?? null;
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
}: {
  practice: ParentContextPractice;
  index: number;
  total: number;
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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-500">
                Practice {index + 1} of {total}
              </span>
              <Badge variant="secondary" className="font-mono text-[10px] font-semibold">
                ID {practice.id}
              </Badge>
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

            <div className="mt-6 flex flex-wrap gap-2 border-t border-grayScale-100 pt-5">
              <Badge variant="secondary" className="gap-1.5 pl-2 pr-2.5 py-1 font-medium normal-case">
                <Hash className="h-3 w-3 opacity-70" aria-hidden />
                Question set {practice.question_set_id}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 pl-2 pr-2.5 py-1 font-medium normal-case">
                <Clock className="h-3 w-3 opacity-70" aria-hidden />
                {formatPracticeDate(practice.created_at)}
              </Badge>
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
      const res = await getPracticesByParentLesson(lid, { limit: 100, offset: 0 });
      const envelope = unwrapPracticesEnvelope(res);
      const list = Array.isArray(envelope?.practices) ? envelope.practices : [];
      setPractices(list);
      setTotalCount(
        typeof envelope?.total_count === "number"
          ? envelope.total_count
          : list.length,
      );
    } catch {
      setPractices([]);
      setTotalCount(0);
      setLoadError("Could not load practices for this lesson.");
      toast.error("Failed to load practices");
    } finally {
      setLoading(false);
    }
  }, [lid, validLesson]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayTitle =
    lessonTitle || (validLesson ? `Lesson #${lid}` : "Lesson practices");

  const addPracticeHref = isExamPrep
    ? `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}/add-practice?lessonId=${lid}&lessonTitle=${encodeURIComponent(lessonTitle || displayTitle)}`
    : `/new-content/learn-english/${level}/courses/add-practice?backTo=module&courseId=${courseId}&moduleId=${moduleId}&lessonId=${lid}&lessonTitle=${encodeURIComponent(lessonTitle || displayTitle)}`;

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
                  <Button
                    type="button"
                    className="h-11 rounded-xl bg-brand-500 px-6 font-semibold shadow-md shadow-brand-500/20 hover:bg-brand-600"
                    onClick={() => void navigate(addPracticeHref)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Add practice
                  </Button>
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
                  <Button
                    type="button"
                    className="h-11 rounded-xl bg-brand-500 px-8 font-semibold shadow-md shadow-brand-500/15 hover:bg-brand-600"
                    onClick={() => void navigate(addPracticeHref)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Create practice
                  </Button>
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
              {practices.map((p, i) => (
                <PracticeCard
                  key={p.id}
                  practice={p}
                  index={i}
                  total={practices.length}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
