import { notifyApiError } from "../../lib/apiErrors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, ArrowRight, Pencil, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { PageBackLink } from "../../components/navigation/PageBackLink";
import { toast } from "sonner";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import uploadIcon from "../../assets/icons/upload.png";
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg";
import alertSrc from "../../assets/Alert.svg";
import {
  getLearningPrograms,
  createLearningProgram,
  setLearningProgramAccessTier,
  setLearningProgramPublishStatus,
  updateLearningProgram,
  deleteLearningProgram,
} from "../../api/courses.api";
import { ContentPublishStatusChip } from "./components/ContentPublishStatusChip";
import { ContentAccessTierChip } from "./components/ContentAccessTierChip";
import { ContentListSearchFilterBar } from "./components/ContentListSearchFilterBar";
import type {
  ContentAccessTier,
  PracticePublishStatus,
} from "../../types/course.types";
import {
  filterBySearchAndPublishStatus,
  hasActiveContentFilters,
  type PublishStatusFilter,
} from "../../lib/contentListFilters";
import { refreshFileUrl, uploadImageFile } from "../../api/files.api";
import type { LearningProgramListItem } from "../../types/course.types";

/** Presigned MinIO/S3 URLs and our storage hosts — safe to send to POST /files/refresh-url. */
function looksLikeRefreshableFileUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://"))
    return false;
  try {
    const u = new URL(trimmed);
    const q = u.search.toLowerCase();
    if (q.includes("x-amz-")) return true;
    const h = u.hostname.toLowerCase();
    if (h.includes("yimaruacademy.com")) return true;
    if (h.includes("minio")) return true;
    return false;
  } catch {
    return false;
  }
}

export function LearnEnglishPage() {
  const [programs, setPrograms] = useState<LearningProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingProgram, setEditingProgram] =
    useState<LearningProgramListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditThumbnail, setUploadingEditThumbnail] = useState(false);
  const editThumbnailFileInputRef = useRef<HTMLInputElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSortOrder, setCreateSortOrder] = useState("");
  const [createThumbnail, setCreateThumbnail] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createUploadingThumbnail, setCreateUploadingThumbnail] =
    useState(false);
  const createThumbnailFileInputRef = useRef<HTMLInputElement>(null);

  const [deletingProgram, setDeletingProgram] =
    useState<LearningProgramListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishStatusUpdatingId, setPublishStatusUpdatingId] = useState<
    number | null
  >(null);
  const [accessTierUpdatingId, setAccessTierUpdatingId] = useState<
    number | null
  >(null);
  const [listSearch, setListSearch] = useState("");
  const [publishStatusFilter, setPublishStatusFilter] =
    useState<PublishStatusFilter>("all");

  const filteredPrograms = useMemo(
    () =>
      filterBySearchAndPublishStatus(programs, {
        search: listSearch,
        publishStatusFilter,
        getSearchFields: (p) => [p.name, p.description],
        getPublishStatus: (p) => p.publish_status,
      }),
    [programs, listSearch, publishStatusFilter],
  );

  const openEdit = (program: LearningProgramListItem) => {
    setEditingProgram(program);
    setEditName(program.name ?? "");
    setEditDescription(program.description?.trim() ?? "");
    setEditSortOrder(String(program.sort_order ?? 0));
    setEditThumbnail(program.thumbnail?.trim() ?? "");
  };

  const closeEdit = () => {
    setEditingProgram(null);
    setEditName("");
    setEditDescription("");
    setEditSortOrder("");
    setEditThumbnail("");
    setUploadingEditThumbnail(false);
    if (editThumbnailFileInputRef.current)
      editThumbnailFileInputRef.current.value = "";
  };

  const handleEditThumbnailFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image is too large", {
        description: "Maximum size is 5 MB.",
      });
      return;
    }
    setUploadingEditThumbnail(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) {
        throw new Error("Upload did not return a file URL");
      }
      setEditThumbnail(url);
      toast.success("Thumbnail uploaded");
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to upload thumbnail");
    } finally {
      setUploadingEditThumbnail(false);
    }
  };

  const clearCreateFormFields = () => {
    setCreateName("");
    setCreateDescription("");
    setCreateSortOrder("");
    setCreateThumbnail("");
    if (createThumbnailFileInputRef.current) {
      createThumbnailFileInputRef.current.value = "";
    }
  };

  const handleCreateDialogOpenChange = (open: boolean) => {
    if (!open && (createSaving || createUploadingThumbnail)) return;
    clearCreateFormFields();
    setCreateOpen(open);
  };

  const handleCreateThumbnailFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image is too large", {
        description: "Maximum size is 5 MB.",
      });
      return;
    }
    setCreateUploadingThumbnail(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) {
        throw new Error("Upload did not return a file URL");
      }
      setCreateThumbnail(url);
      toast.success("Thumbnail uploaded");
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to upload thumbnail");
    } finally {
      setCreateUploadingThumbnail(false);
    }
  };

  const handleCreateProgram = async () => {
    const name = createName.trim();
    if (!name) {
      toast.error("Program name is required");
      return;
    }
    const sortOrderRaw = createSortOrder.trim();
    if (!sortOrderRaw) {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setCreateSaving(true);
    try {
      await createLearningProgram({
        name,
        description: createDescription.trim(),
        category: "LEARN_ENGLISH",
        thumbnail: createThumbnail.trim(),
        sort_order,
      });
      toast.success("Program created");
      clearCreateFormFields();
      setCreateOpen(false);
      await fetchPrograms();
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to create program");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProgram) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Program name is required");
      return;
    }
    const sortOrderRaw = editSortOrder.trim();
    if (!sortOrderRaw) {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setSavingEdit(true);
    try {
      await updateLearningProgram(editingProgram.id, {
        name,
        description: editDescription.trim(),
        thumbnail: editThumbnail.trim(),
        sort_order,
      });
      toast.success("Program updated");
      closeEdit();
      await fetchPrograms();
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to update program");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleProgramPublishStatus = async (
    programId: number,
    nextStatus: PracticePublishStatus,
  ) => {
    setPublishStatusUpdatingId(programId);
    try {
      await setLearningProgramPublishStatus(programId, {
        publish_status: nextStatus,
      });
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === programId ? { ...p, publish_status: nextStatus } : p,
        ),
      );
      toast.success(
        nextStatus === "PUBLISHED"
          ? "Program published"
          : "Program saved as draft",
      );
    } catch (e: unknown) {
      notifyApiError(e, "Failed to update program status");
    } finally {
      setPublishStatusUpdatingId(null);
    }
  };

  const handleProgramAccessTier = async (
    programId: number,
    nextTier: ContentAccessTier,
  ) => {
    setAccessTierUpdatingId(programId);
    try {
      await setLearningProgramAccessTier(programId, { access_tier: nextTier });
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === programId ? { ...p, access_tier: nextTier } : p,
        ),
      );
      toast.success(
        nextTier === "PREMIUM"
          ? "Program set to Premium"
          : "Program set to Free",
      );
    } catch (e: unknown) {
      notifyApiError(e, "Failed to update program access tier");
    } finally {
      setAccessTierUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProgram) return;
    setDeleting(true);
    try {
      await deleteLearningProgram(deletingProgram.id);
      toast.success("Program deleted");
      setDeletingProgram(null);
      await fetchPrograms();
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to delete program");
    } finally {
      setDeleting(false);
    }
  };

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLearningPrograms({ limit: 100, offset: 0 });
      const raw = res.data?.data?.programs;
      const list = Array.isArray(raw) ? raw : [];
      const sorted = [...list].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
      setPrograms(sorted);

      void (async () => {
        const results = await Promise.all(
          sorted.map(async (p) => {
            const ref = p.thumbnail?.trim();
            if (!ref || !looksLikeRefreshableFileUrl(ref)) return null;
            try {
              const res = await refreshFileUrl(ref);
              const url = res.data?.data?.url?.trim();
              if (!url) return null;
              return { id: p.id, url };
            } catch {
              return null;
            }
          }),
        );
        const map = new Map(
          results
            .filter((r): r is { id: number; url: string } => r != null)
            .map((r) => [r.id, r.url] as const),
        );
        if (map.size === 0) return;
        setPrograms((prev) =>
          prev.map((prog) => {
            const next = map.get(prog.id);
            return next ? { ...prog, thumbnail: next } : prog;
          }),
        );
      })();
    } catch (e) {
      console.error(e);
      setError("Failed to load programs");
      setPrograms([]);
      notifyApiError(e, "Could not load programs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

  return (
    <div className="space-y-8">
      <PageBackLink
        fallbackTo="/new-content"
        label="Back to Content Management"
      />
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">
            Learn English
          </h1>
          <p className="mt-1 text-sm text-grayScale-500">
            Manage learning content by program
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-[6px] bg-brand-500 px-6 font-semibold ">
              <Plus className="mr-2 h-5 w-5" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-2xl flex-col gap-0 overflow-hidden border-none p-0">
            <div className="shrink-0">
              <DialogHeader className="p-8 pb-4">
                <DialogTitle className="text-2xl font-bold text-grayScale-700">
                  Add New Program
                </DialogTitle>
                <DialogDescription className="text-sm text-grayScale-400">
                  Create a new learning program. Add a thumbnail as an image URL
                  or by uploading a file.
                </DialogDescription>
              </DialogHeader>
              {/* Gradient Divider */}
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
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
            </div>

            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreateProgram();
              }}
            >
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-8 py-4">
                <div className="space-y-2">
                  <label className="text-[15px] text-grayScale-700">
                    Program Name
                  </label>
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Intermediate Track"
                    className="h-12 rounded-xl ring-0"
                    disabled={createSaving || createUploadingThumbnail}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] text-grayScale-700">
                    Description
                  </label>
                  <Textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Short summary of the program"
                    rows={3}
                    className="min-h-[88px] resize-y rounded-xl"
                    disabled={createSaving || createUploadingThumbnail}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="create-program-sort-order"
                    className="text-[15px] text-grayScale-700"
                  >
                    Sort Order
                  </label>
                  <Input
                    id="create-program-sort-order"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={createSortOrder}
                    onChange={(e) => setCreateSortOrder(e.target.value)}
                    placeholder="e.g. 5"
                    className="h-12 rounded-xl ring-0"
                    disabled={createSaving || createUploadingThumbnail}
                  />
                  <p className="text-xs text-grayScale-500">
                    Lower numbers appear first when programs are listed.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] text-grayScale-700">
                    Thumbnail
                  </label>
                  <input
                    ref={createThumbnailFileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void handleCreateThumbnailFile(e)}
                    disabled={createSaving || createUploadingThumbnail}
                  />
                  <button
                    type="button"
                    className="relative w-full cursor-pointer rounded-2xl border-2 border-dashed border-[#9E289133] bg-white p-10 text-left transition-all hover:border-[#9E289180] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={createSaving || createUploadingThumbnail}
                    onClick={() => createThumbnailFileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4">
                        <img src={uploadIcon} alt="" className="h-10 w-10" />
                      </div>
                      <p className="text-sm">
                        <span className="font-bold text-[#9E2891]">
                          {createUploadingThumbnail
                            ? "Uploading…"
                            : "Click to upload"}
                        </span>{" "}
                        <span className="text-grayScale-500">
                          or paste a URL below
                        </span>
                      </p>
                      <p className="mt-1 text-xs font-medium text-grayScale-400 uppercase tracking-wider">
                        JPG, PNG (max 5 MB)
                      </p>
                    </div>
                  </button>
                  {createThumbnail.trim() ? (
                    <div className="overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                      <img
                        src={createThumbnail.trim()}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <Input
                    value={createThumbnail}
                    onChange={(e) => setCreateThumbnail(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="https://…"
                    disabled={createSaving || createUploadingThumbnail}
                  />
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-grayScale-100 bg-white px-8 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 min-w-[120px] rounded-[6px] border-grayScale-200 font-semibold"
                  disabled={createSaving || createUploadingThumbnail}
                  onClick={() => handleCreateDialogOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-12 min-w-[160px] rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
                  disabled={createSaving || createUploadingThumbnail}
                >
                  {createSaving ? "Creating…" : "Create Program"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
          <p className="mt-3 text-sm text-grayScale-500">Loading programs…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-6 py-14 text-center">
          <img src={alertSrc} alt="" className="h-10 w-10" />
          <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void fetchPrograms()}
          >
            Try again
          </Button>
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-grayScale-600">
            No programs yet
          </p>
          <p className="mt-1 text-sm text-grayScale-400">
            Add programs in the backend or use Add Program when it is connected.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <ContentListSearchFilterBar
            search={listSearch}
            onSearchChange={setListSearch}
            publishStatusFilter={publishStatusFilter}
            onPublishStatusFilterChange={setPublishStatusFilter}
            searchPlaceholder="Search programs by name or description…"
            searchAriaLabel="Search programs"
          />
          {filteredPrograms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-grayScale-600">
                No programs match your search or status filter
              </p>
              {hasActiveContentFilters(listSearch, publishStatusFilter) ? (
                <p className="mt-1 text-sm text-grayScale-400">
                  Try different keywords or clear the publish status filter.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap gap-10">
              {filteredPrograms.map((program) => (
                <Card
                  key={program.id}
                  className="group relative w-[320px] overflow-hidden border-none shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="absolute right-2 top-2 z-10 flex translate-y-1 gap-1 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-md bg-white/95 text-grayScale-600 shadow-sm transition-colors hover:bg-white"
                      aria-label={`Edit ${program.name}`}
                      onClick={() => openEdit(program)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-md bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                      aria-label={`Delete ${program.name}`}
                      onClick={() => setDeletingProgram(program)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div
                    className="h-32 w-full bg-cover bg-center"
                    style={
                      program.thumbnail?.trim()
                        ? {
                            backgroundImage: `url(${program.thumbnail.trim()})`,
                          }
                        : {
                            background:
                              "linear-gradient(135deg, #9E289180 0%, #9E2891 100%)",
                          }
                    }
                  />
                  <CardContent className="bg-white p-6 flex flex-col h-[280px]">
                    <div className="flex-1 min-h-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <ContentPublishStatusChip
                          publishStatus={program.publish_status}
                          updating={publishStatusUpdatingId === program.id}
                          contentLabel="program"
                          onToggle={(nextStatus) =>
                            void handleProgramPublishStatus(
                              program.id,
                              nextStatus,
                            )
                          }
                        />
                        <ContentAccessTierChip
                          accessTier={program.access_tier}
                          updating={accessTierUpdatingId === program.id}
                          contentLabel="program"
                          onToggle={(nextTier) =>
                            void handleProgramAccessTier(program.id, nextTier)
                          }
                        />
                      </div>
                      <h3 className="text-xl font-bold text-grayScale-700 line-clamp-2">
                        {program.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-grayScale-500 line-clamp-4">
                        {program.description?.trim()
                          ? program.description
                          : "unassigned"}
                      </p>
                    </div>
                    <Link
                      to={`/new-content/learn-english/${program.id}/courses`}
                      className="mt-4 block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button className="h-11 w-full rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600">
                        View Courses
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={editingProgram !== null}
        onOpenChange={(open) => {
          if (!open && (savingEdit || uploadingEditThumbnail)) return;
          if (!open) closeEdit();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-lg flex-col gap-0 overflow-hidden p-0">
           <DialogHeader className="shrink-0 space-y-1.5 border-b border-grayScale-100 px-6 pb-4 pt-6 pr-14">
            <DialogTitle>Edit program</DialogTitle>
            <DialogDescription>
              Update name, description, sort order, and thumbnail. Upload an
              image from your computer (via file storage) or paste a URL.
              Changes are saved to the server.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">
                  Name
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl"
                  placeholder="Program name"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="rounded-xl resize-y min-h-[100px]"
                  placeholder="Short summary of the program"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="edit-program-sort-order"
                  className="text-sm font-medium text-grayScale-700"
                >
                  Sort Order
                </label>
                <Input
                  id="edit-program-sort-order"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="rounded-xl"
                  placeholder="e.g. 5"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <p className="text-xs text-grayScale-500">
                  Lower numbers appear first when programs are listed.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-grayScale-700">
                  Thumbnail
                </label>
                <input
                  ref={editThumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void handleEditThumbnailFile(e)}
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 rounded-xl border-grayScale-200 font-semibold"
                    disabled={savingEdit || uploadingEditThumbnail}
                    onClick={() => editThumbnailFileInputRef.current?.click()}
                  >
                    {uploadingEditThumbnail
                      ? "Uploading…"
                      : "Upload from computer"}
                  </Button>
                  {editThumbnail.trim() ? (
                    <div className="flex-1 overflow-hidden rounded-xl border border-grayScale-200 bg-grayScale-50">
                      <img
                        src={editThumbnail.trim()}
                        alt=""
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
                <Input
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  className="rounded-xl"
                  placeholder="Or paste image URL (https://…)"
                  disabled={savingEdit || uploadingEditThumbnail}
                />
                <p className="text-xs text-grayScale-500">
                  Uploaded images are stored and used as the program thumbnail.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-grayScale-100 bg-white px-6 py-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeEdit}
              disabled={savingEdit || uploadingEditThumbnail}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-brand-500 hover:bg-brand-600"
              disabled={savingEdit || uploadingEditThumbnail}
              onClick={() => void handleSaveEdit()}
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deletingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-grayScale-700">
                Delete program
              </h2>
              <button
                type="button"
                onClick={() => !deleting && setDeletingProgram(null)}
                disabled={deleting}
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
                  {deletingProgram.name}
                </span>
                ? This action cannot be undone. Courses under this program may
                be affected depending on your backend.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingProgram(null)}
                disabled={deleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full bg-red-500 shadow-sm transition-all hover:bg-red-600 hover:shadow-md sm:w-auto"
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
