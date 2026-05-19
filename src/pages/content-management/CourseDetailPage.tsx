import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Layers,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
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
import { cn } from "../../lib/utils";
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg";
import alertSrc from "../../assets/Alert.svg";
import {
  deleteTopLevelCourseModule,
  getProgramCourses,
  getTopLevelCourseModules,
  updateTopLevelCourseModule,
} from "../../api/courses.api";
import { refreshFileUrl, resolveFileUrl } from "../../api/files.api";
import type {
  ProgramCourseListItem,
  TopLevelCourseModuleItem,
} from "../../types/course.types";
import { AddModuleModal } from "./components/AddModuleModal";
import { ModuleIconUploadField } from "./components/ModuleIconUploadField";
import { PublishPracticeButton } from "./components/PublishPracticeButton";

const MODULE_CARD_GRADIENT = "from-[#8E44AD] to-[#C39BD3]" as const;

function isLikelyImageUrl(src: string): boolean {
  const t = src.trim();
  return (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("/") ||
    t.startsWith("data:")
  );
}

function isSignedMinioUrl(src: string): boolean {
  const value = src.trim();
  if (!value.startsWith("http://") && !value.startsWith("https://"))
    return false;
  try {
    const url = new URL(value);
    return url.searchParams.has("X-Amz-Signature");
  } catch {
    return false;
  }
}

/** Default purple gradient with optional cover image; gradient stays if URL missing or image errors. */
function ModuleCardTopMedia({ iconSrc }: { iconSrc: string }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const tryCover =
    Boolean(iconSrc.trim()) && isLikelyImageUrl(iconSrc) && !coverFailed;

  return (
    <div className="relative h-36 w-full overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b opacity-90 transition-transform duration-700",
          MODULE_CARD_GRADIENT,
        )}
      />
      {tryCover ? (
        <img
          src={iconSrc.trim()}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setCoverFailed(true)}
        />
      ) : null}
    </div>
  );
}

/** Circular module icon: image when load succeeds, otherwise default Layers icon. */
function ModuleIconCircle({
  iconSrc,
  index,
}: {
  iconSrc: string;
  index: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg =
    Boolean(iconSrc.trim()) && isLikelyImageUrl(iconSrc) && !imgFailed;

  return (
    <div
      className={cn(
        "flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-purple-100/50 p-2",
        index % 2 === 1 ? "bg-[#F8FAFC]" : "bg-[#f3e8ff]",
      )}
    >
      {showImg ? (
        <img
          src={iconSrc.trim()}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Layers
          className={cn(
            "h-6 w-6",
            index % 2 === 1 ? "text-[#64748B]" : "text-brand-500",
          )}
        />
      )}
    </div>
  );
}

export function CourseDetailPage() {
  const navigate = useNavigate();
  const { level: programIdParam, courseId: courseIdParam } = useParams<{
    level: string;
    courseId: string;
  }>();
  const programId = Number(programIdParam);
  const courseIdNum = Number(courseIdParam);

  const [course, setCourse] = useState<ProgramCourseListItem | null>(null);
  const [modules, setModules] = useState<TopLevelCourseModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);

  const [editingModule, setEditingModule] =
    useState<TopLevelCourseModuleItem | null>(null);
  const [editModuleName, setEditModuleName] = useState("");
  const [editModuleDescription, setEditModuleDescription] = useState("");
  const [editModuleSortOrder, setEditModuleSortOrder] = useState("");
  const [editModuleIcon, setEditModuleIcon] = useState("");
  const [editModuleIconUploadBusy, setEditModuleIconUploadBusy] =
    useState(false);
  const [savingModuleEdit, setSavingModuleEdit] = useState(false);

  const [deletingModule, setDeletingModule] =
    useState<TopLevelCourseModuleItem | null>(null);
  const [deletingModuleInFlight, setDeletingModuleInFlight] = useState(false);

  const openEditModule = (module: TopLevelCourseModuleItem) => {
    setEditingModule(module);
    setEditModuleName(module.name ?? "");
    setEditModuleDescription(module.description ?? "");
    setEditModuleSortOrder(String(module.sort_order ?? 0));
    setEditModuleIcon(module.icon?.trim() ?? "");
    setEditModuleIconUploadBusy(false);
  };

  const closeEditModule = () => {
    if (savingModuleEdit || editModuleIconUploadBusy) return;
    setEditingModule(null);
    setEditModuleIconUploadBusy(false);
  };

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(programId) || programId < 1) {
      setError("Invalid program");
      setCourse(null);
      setModules([]);
      setLoading(false);
      return;
    }
    if (!Number.isFinite(courseIdNum) || courseIdNum < 1) {
      setError("Invalid course");
      setCourse(null);
      setModules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [courseOutcome, modulesOutcome] = await Promise.allSettled([
        getProgramCourses(programId, { limit: 200, offset: 0 }),
        getTopLevelCourseModules(courseIdNum, { limit: 100, offset: 0 }),
      ]);

      if (courseOutcome.status === "fulfilled") {
        const raw = courseOutcome.value.data?.data?.courses;
        const list = Array.isArray(raw) ? raw : [];
        const found = list.find((c) => c.id === courseIdNum) ?? null;
        setCourse(found);
        if (!found) {
          setError("Course not found in this program");
        }
      } else {
        console.error(courseOutcome.reason);
        setCourse(null);
        setError("Failed to load course");
      }

      if (modulesOutcome.status === "fulfilled") {
        const raw = modulesOutcome.value.data?.data?.modules;
        const list = Array.isArray(raw) ? raw : [];
        const refreshed = await Promise.all(
          list.map(async (module) => {
            const icon = module.icon?.trim() ?? "";
            if (!icon) return module;
            try {
              if (isSignedMinioUrl(icon)) {
                const refreshedRes = await refreshFileUrl(icon);
                const refreshedUrl = refreshedRes.data?.data?.url?.trim();
                if (refreshedUrl) {
                  return { ...module, icon: refreshedUrl };
                }
                return module;
              }
              if (isLikelyImageUrl(icon)) return module;
              const resolved = await resolveFileUrl(icon);
              const freshUrl = resolved.data?.data?.url?.trim();
              if (!freshUrl) return module;
              return { ...module, icon: freshUrl };
            } catch {
              return module;
            }
          }),
        );
        const sorted = [...refreshed].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        setModules(sorted);
      } else {
        console.error(modulesOutcome.reason);
        setModules([]);
        toast.error("Could not load modules", {
          description: "Check your connection or try again.",
        });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load course");
      setCourse(null);
      setModules([]);
      toast.error("Could not load course", {
        description: "Check your connection or try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [programId, courseIdNum]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const handleSaveModuleEdit = async () => {
    if (!editingModule) return;
    const name = editModuleName.trim();
    if (!name) {
      toast.error("Module name is required");
      return;
    }
    const sortOrderRaw = editModuleSortOrder.trim();
    if (!sortOrderRaw) {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setSavingModuleEdit(true);
    try {
      await updateTopLevelCourseModule(editingModule.id, {
        name,
        description: editModuleDescription.trim(),
        icon: editModuleIcon.trim(),
        sort_order,
      });
      toast.success("Module updated");
      setEditModuleIconUploadBusy(false);
      setEditingModule(null);
      await loadPage();
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update module";
      toast.error(msg);
    } finally {
      setSavingModuleEdit(false);
    }
  };

  const handleConfirmDeleteModule = async () => {
    if (!deletingModule) return;
    setDeletingModuleInFlight(true);
    try {
      await deleteTopLevelCourseModule(deletingModule.id);
      toast.success("Module deleted");
      setDeletingModule(null);
      await loadPage();
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete module";
      toast.error(msg);
    } finally {
      setDeletingModuleInFlight(false);
    }
  };

  const displayTitle = course?.name?.trim() || courseIdParam || "Course";
  const displayDescription =
    course?.description?.trim() ||
    (!loading && !course
      ? "This course could not be loaded."
      : !course?.description?.trim() && course
        ? "—"
        : "");

  return (
    <div className="space-y-10 pb-20 pt-10">
      {/* Header Navigation */}
      <div className="flex items-center gap-2">
        <Link
          to={`/new-content/learn-english/${programIdParam}/courses`}
          className="flex items-center gap-2 text-sm font-medium text-grayScale-600 transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Courses
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
        </div>
      ) : error && !course ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-6 py-14 text-center">
          <img src={alertSrc} alt="" className="h-10 w-10" />
          <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void loadPage()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-medium tracking-tight text-grayScale-900">
                {displayTitle}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-grayScale-500">
                {displayDescription}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="rounded-[6px] border-brand-500 text-brand-500 "
                onClick={() =>
                  navigate(
                    `/new-content/learn-english/${programIdParam}/courses/add-practice?backTo=modules&courseId=${courseIdParam}`,
                  )
                }
              >
                <Calendar className="h-4 w-4" />
                Add Practice
              </Button>
              <Button
                className="rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
                onClick={() => setIsAddModuleOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Module
              </Button>
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-grayScale-200" />
            </div>
            <div className="relative flex justify-center">
              <div
                className="h-[0.5px] w-full rounded-full opacity-20"
                style={{
                  background: "gray",
                }}
              />
            </div>
          </div>

          <AddModuleModal
            isOpen={isAddModuleOpen}
            onClose={() => setIsAddModuleOpen(false)}
            courseId={courseIdNum}
            onCreated={() => loadPage()}
          />

          <Dialog
            open={editingModule !== null}
            onOpenChange={(open) => {
              if (!open && savingModuleEdit) return;
              if (!open && editModuleIconUploadBusy) return;
              if (!open) closeEditModule();
            }}
          >
            <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-lg flex-col gap-0 overflow-hidden p-0">
              <DialogHeader className="shrink-0 space-y-1.5 border-b border-grayScale-100 px-6 pb-4 pt-6 pr-12">
                <DialogTitle>Edit module</DialogTitle>
                <DialogDescription>
                  Update name, description, sort order, and icon (upload or URL).
                  Saved with{" "}
                  <code className="rounded bg-grayScale-100 px-1 py-0.5 text-[11px]">
                    PUT /modules/:id
                  </code>
                  .
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-700">
                    Name
                  </label>
                  <Input
                    value={editModuleName}
                    onChange={(e) => setEditModuleName(e.target.value)}
                    className="rounded-xl"
                    placeholder="e.g. Grammar basics"
                    disabled={savingModuleEdit}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-grayScale-700">
                    Description
                  </label>
                  <Textarea
                    value={editModuleDescription}
                    onChange={(e) => setEditModuleDescription(e.target.value)}
                    rows={4}
                    className="min-h-[100px] resize-y rounded-xl"
                    placeholder="Optional short description."
                    disabled={savingModuleEdit || editModuleIconUploadBusy}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-module-sort-order"
                    className="text-sm font-medium text-grayScale-700"
                  >
                    Sort Order
                  </label>
                  <Input
                    id="edit-module-sort-order"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={editModuleSortOrder}
                    onChange={(e) => setEditModuleSortOrder(e.target.value)}
                    className="rounded-xl"
                    placeholder="e.g. 5"
                    disabled={savingModuleEdit || editModuleIconUploadBusy}
                  />
                  <p className="text-xs text-grayScale-500">
                    Lower numbers appear first when modules are listed.
                  </p>
                </div>
                <ModuleIconUploadField
                  value={editModuleIcon}
                  onChange={setEditModuleIcon}
                  disabled={savingModuleEdit}
                  onUploadBusyChange={setEditModuleIconUploadBusy}
                />
              </div>
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t border-grayScale-100 bg-white px-6 py-4 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModule}
                  disabled={savingModuleEdit || editModuleIconUploadBusy}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-brand-500 hover:bg-brand-600"
                  disabled={savingModuleEdit || editModuleIconUploadBusy}
                  onClick={() => void handleSaveModuleEdit()}
                >
                  {savingModuleEdit ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-grayScale-600">
                No modules in this course yet
              </p>
              <p className="mt-1 text-sm text-grayScale-400">
                Add modules when your workflow is connected, or create them via
                the API.
              </p>
            </div>
          ) : (
            <div
              className="grid justify-start gap-10"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(330px, 330px))",
              }}
            >
              {modules.map((module, index) => {
                const iconSrc = module.icon?.trim() ?? "";
                return (
                  <Card
                    key={module.id}
                    className="group relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-grayScale-50 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="absolute right-2 top-2 z-10 flex translate-y-1 gap-1 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-md bg-white/95 text-grayScale-600 shadow-sm transition-colors hover:bg-white"
                        aria-label={`Edit ${module.name}`}
                        onClick={() => openEditModule(module)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-md bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                        aria-label={`Delete ${module.name}`}
                        onClick={() => setDeletingModule(module)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <ModuleCardTopMedia iconSrc={iconSrc} />

                    <div className="flex min-h-0 flex-1 flex-col gap-6 p-2 pb-4 pt-4">
                      <div className="flex min-h-0 flex-1 gap-4">
                        <ModuleIconCircle iconSrc={iconSrc} index={index} />

                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-lg font-bold tracking-tight text-[#0F172A]">
                            {module.name}
                          </h3>
                          <p className="text-[12px] font-medium leading-snug text-grayScale-400 line-clamp-3">
                            {module.description?.trim()
                              ? module.description
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex shrink-0 items-center gap-3">
                        <Button
                          variant="outline"
                          className="h-10 flex-1 rounded-[6px] border-[#9E2891] text-sm text-[#9E2891] transition-all"
                          onClick={() =>
                            navigate(
                              `/new-content/learn-english/${programIdParam}/courses/${courseIdParam}/modules/${module.id}`,
                              {
                                state: {
                                  moduleName: module.name,
                                  moduleDescription:
                                    module.description?.trim() ?? "",
                                },
                              },
                            )
                          }
                        >
                          View Detail
                        </Button>
                        <PublishPracticeButton
                          parentKind="MODULE"
                          parentId={module.id}
                          className="h-10 flex-1 rounded-[6px] bg-brand-500 text-sm text-white shadow-md shadow-brand-500/10 hover:bg-brand-600 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {deletingModule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-grayScale-100 px-6 py-5">
                  <h2 className="text-lg font-bold text-grayScale-700">
                    Delete module
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      !deletingModuleInFlight && setDeletingModule(null)
                    }
                    disabled={deletingModuleInFlight}
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
                      {deletingModule.name}
                    </span>
                    ? This cannot be undone. Related content may be affected
                    depending on your backend.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeletingModule(null)}
                    disabled={deletingModuleInFlight}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="w-full bg-red-500 shadow-sm transition-all hover:bg-red-600 hover:shadow-md sm:w-auto"
                    disabled={deletingModuleInFlight}
                    onClick={() => void handleConfirmDeleteModule()}
                  >
                    {deletingModuleInFlight ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
