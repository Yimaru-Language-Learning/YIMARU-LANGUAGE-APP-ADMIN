import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Select } from "../../../components/ui/select";
import { SpinnerIcon } from "../../../components/ui/spinner-icon";
import { cn } from "../../../lib/utils";
import type {
  LearningActivityAccess,
  LearningActivityCourse,
  LearningActivityLesson,
  LearningActivityModule,
  LearningActivityProgram,
  LearningActivityUnit,
  UserLearningActivityData,
} from "../../../types/userAdmin.types";

type Track = "lms" | "exam_prep";

function ProgressBar({ access }: { access: LearningActivityAccess }) {
  const percent = Math.min(100, Math.max(0, access.progress_percent));
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-grayScale-200">
        <div
          className={cn(
            "h-1.5 rounded-full transition-all",
            access.is_completed ? "bg-mint-500" : access.is_accessible ? "bg-brand-500" : "bg-grayScale-300",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-[11px] text-grayScale-500">{percent}%</span>
    </div>
  );
}

function AccessStatusBadge({ access }: { access: LearningActivityAccess }) {
  if (access.is_completed) {
    return (
      <Badge className="bg-mint-500/15 text-mint-600 border border-mint-500/25">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Completed
      </Badge>
    );
  }
  if (!access.is_accessible) {
    return (
      <Badge variant="secondary">
        <Lock className="mr-1 h-3 w-3" />
        Locked
      </Badge>
    );
  }
  return <Badge variant="warning">Accessible</Badge>;
}

function AccessMeta({ access }: { access: LearningActivityAccess }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AccessStatusBadge access={access} />
      <span className="text-xs text-grayScale-500">
        {access.completed_count}/{access.total_count} completed
      </span>
      <ProgressBar access={access} />
    </div>
  );
}

function LessonRow({ lesson }: { lesson: LearningActivityLesson }) {
  return (
    <div className="rounded-lg border border-grayScale-100 bg-white px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-grayScale-700">{lesson.title || `Lesson #${lesson.id}`}</p>
        <AccessMeta access={lesson.access} />
      </div>
      {!lesson.access.is_accessible && lesson.access.reason ? (
        <p className="mt-1.5 text-xs text-grayScale-400">{lesson.access.reason}</p>
      ) : null}
    </div>
  );
}

function ModuleBlock({ module }: { module: LearningActivityModule }) {
  const [open, setOpen] = useState(module.access.is_accessible || module.access.is_completed);

  return (
    <div className="rounded-xl border border-grayScale-100 bg-grayScale-50/60">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-grayScale-800">{module.name || `Module #${module.id}`}</p>
          <div className="mt-2">
            <AccessMeta access={module.access} />
          </div>
          {!module.access.is_accessible && module.access.reason ? (
            <p className="mt-1.5 text-xs text-grayScale-400">{module.access.reason}</p>
          ) : null}
        </div>
        {open ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
        )}
      </button>
      {open ? (
        <div className="space-y-2 border-t border-grayScale-100 px-3 py-3">
          {module.lessons.length === 0 ? (
            <p className="text-xs text-grayScale-400">No lessons in this module.</p>
          ) : (
            module.lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

function UnitBlock({ unit }: { unit: LearningActivityUnit }) {
  const [open, setOpen] = useState(unit.access.is_accessible || unit.access.is_completed);

  return (
    <div className="rounded-xl border border-grayScale-100">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-grayScale-800">{unit.name || `Unit #${unit.id}`}</p>
          <div className="mt-2">
            <AccessMeta access={unit.access} />
          </div>
        </div>
        {open ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
        )}
      </button>
      {open ? (
        <div className="space-y-3 border-t border-grayScale-100 px-3 py-3">
          {unit.modules.length === 0 ? (
            <p className="text-xs text-grayScale-400">No modules in this unit.</p>
          ) : (
            unit.modules.map((module) => <ModuleBlock key={module.id} module={module} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

function CourseBlock({ course, examPrep }: { course: LearningActivityCourse; examPrep?: boolean }) {
  const [open, setOpen] = useState(course.access.is_accessible || course.access.is_completed);
  const children = examPrep ? (course.units ?? []) : (course.modules ?? []);

  return (
    <div className="rounded-xl border border-grayScale-200 bg-white">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-grayScale-800">{course.name || `Course #${course.id}`}</p>
          <div className="mt-2">
            <AccessMeta access={course.access} />
          </div>
          {!course.access.is_accessible && course.access.reason ? (
            <p className="mt-1.5 text-xs text-grayScale-400">{course.access.reason}</p>
          ) : null}
        </div>
        {open ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-grayScale-400" />
        )}
      </button>
      {open ? (
        <div className="space-y-3 border-t border-grayScale-100 px-4 py-3">
          {children.length === 0 ? (
            <p className="text-xs text-grayScale-400">No content available.</p>
          ) : examPrep ? (
            (course.units ?? []).map((unit) => <UnitBlock key={unit.id} unit={unit} />)
          ) : (
            (course.modules ?? []).map((module) => <ModuleBlock key={module.id} module={module} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-grayScale-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-grayScale-700">{value}</p>
    </div>
  );
}

export function UserLearningActivitySection({
  activity,
  loading,
  error,
}: {
  activity: UserLearningActivityData | null;
  loading: boolean;
  error: string | null;
}) {
  const [track, setTrack] = useState<Track>("lms");
  const programs = activity?.lms.progress.programs ?? [];
  const catalogCourses = activity?.exam_prep.progress.catalog_courses ?? [];

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [selectedCatalogCourseId, setSelectedCatalogCourseId] = useState<number | null>(null);

  useEffect(() => {
    if (programs.length === 0) {
      setSelectedProgramId(null);
      return;
    }
    if (!selectedProgramId || !programs.some((program) => program.id === selectedProgramId)) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  useEffect(() => {
    if (catalogCourses.length === 0) {
      setSelectedCatalogCourseId(null);
      return;
    }
    if (
      !selectedCatalogCourseId ||
      !catalogCourses.some((course) => course.id === selectedCatalogCourseId)
    ) {
      setSelectedCatalogCourseId(catalogCourses[0].id);
    }
  }, [catalogCourses, selectedCatalogCourseId]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const selectedCatalogCourse = useMemo(
    () => catalogCourses.find((course) => course.id === selectedCatalogCourseId) ?? null,
    [catalogCourses, selectedCatalogCourseId],
  );

  const completedIds = activity?.lms.completed_ids;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100/70">
              <BarChart3 className="h-4 w-4 text-sky-600" />
            </div>
            <CardTitle className="text-base">Learning activity</CardTitle>
          </div>
          <div className="flex rounded-lg border border-grayScale-200 p-1">
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                track === "lms" ? "bg-brand-500 text-white" : "text-grayScale-500 hover:text-grayScale-700",
              )}
              onClick={() => setTrack("lms")}
            >
              Learn English
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                track === "exam_prep"
                  ? "bg-brand-500 text-white"
                  : "text-grayScale-500 hover:text-grayScale-700",
              )}
              onClick={() => setTrack("exam_prep")}
            >
              Exam prep
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-grayScale-200 bg-grayScale-100 px-3 py-2 text-xs text-grayScale-500">
            <SpinnerIcon className="h-3.5 w-3.5" />
            Loading learning activity...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        {!loading && !error && activity && track === "lms" ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Programs" value={programs.length} />
              <Metric label="Completed programs" value={completedIds?.program_ids.length ?? 0} />
              <Metric label="Completed courses" value={completedIds?.course_ids.length ?? 0} />
              <Metric label="Completed lessons" value={completedIds?.lesson_ids.length ?? 0} />
            </div>

            <div className="w-full sm:max-w-sm">
              <Select
                value={selectedProgramId ? String(selectedProgramId) : ""}
                onChange={(e) => setSelectedProgramId(e.target.value ? Number(e.target.value) : null)}
                disabled={programs.length === 0}
              >
                <option value="">{programs.length === 0 ? "No programs available" : "Select program..."}</option>
                {programs.map((program: LearningActivityProgram) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </Select>
            </div>

            {selectedProgram ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
                  <p className="text-sm font-semibold text-grayScale-800">{selectedProgram.name}</p>
                  <div className="mt-2">
                    <AccessMeta access={selectedProgram.access} />
                  </div>
                </div>
                {selectedProgram.courses.length === 0 ? (
                  <p className="py-6 text-center text-sm text-grayScale-400">No courses in this program.</p>
                ) : (
                  selectedProgram.courses.map((course) => (
                    <CourseBlock key={course.id} course={course} />
                  ))
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-grayScale-400">No LMS learning activity yet.</p>
            )}
          </>
        ) : null}

        {!loading && !error && activity && track === "exam_prep" ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Exam prep courses" value={catalogCourses.length} />
              <Metric
                label="Accessible courses"
                value={catalogCourses.filter((course) => course.access.is_accessible).length}
              />
              <Metric
                label="Completed courses"
                value={catalogCourses.filter((course) => course.access.is_completed).length}
              />
            </div>

            <div className="w-full sm:max-w-sm">
              <Select
                value={selectedCatalogCourseId ? String(selectedCatalogCourseId) : ""}
                onChange={(e) =>
                  setSelectedCatalogCourseId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={catalogCourses.length === 0}
              >
                <option value="">
                  {catalogCourses.length === 0 ? "No exam prep courses" : "Select exam prep course..."}
                </option>
                {catalogCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </div>

            {selectedCatalogCourse ? (
              <CourseBlock course={selectedCatalogCourse} examPrep />
            ) : (
              <p className="py-6 text-center text-sm text-grayScale-400">No exam prep activity yet.</p>
            )}
          </>
        ) : null}

        {!loading && !error && !activity ? (
          <p className="py-6 text-center text-sm text-grayScale-400">No learning activity available.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
