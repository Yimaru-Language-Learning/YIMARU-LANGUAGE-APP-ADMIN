import { notifyApiError } from "../../../lib/apiErrors";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "sonner";
import { createTopLevelCourseModule } from "../../../api/courses.api";
import { ModuleIconUploadField } from "./ModuleIconUploadField";

interface AddModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  onCreated?: () => void | Promise<void>;
}

export function AddModuleModal({
  isOpen,
  onClose,
  courseId,
  onCreated,
}: AddModuleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [icon, setIcon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [iconUploadBusy, setIconUploadBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setSortOrder("");
      setIcon("");
      setSubmitting(false);
      setIconUploadBusy(false);
    }
  }, [isOpen]);

  const resetAndClose = () => {
    setName("");
    setDescription("");
    setSortOrder("");
    setIcon("");
    setIconUploadBusy(false);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && (submitting || iconUploadBusy)) return;
    if (!open) {
      resetAndClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Module name is required");
      return;
    }
    if (!Number.isFinite(courseId) || courseId < 1) {
      toast.error("Invalid course");
      return;
    }
    const sortOrderRaw = sortOrder.trim();
    if (!sortOrderRaw) {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setSubmitting(true);
    try {
      await createTopLevelCourseModule(courseId, {
        name: trimmedName,
        description: description.trim(),
        icon: icon.trim(),
        sort_order,
      });
      toast.success("Module created");
      if (onCreated) {
        await onCreated();
      }
      resetAndClose();
    } catch (err: unknown) {
      console.error(err);
      notifyApiError(err, "Failed to create module");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,calc(100dvh-2rem))] max-w-2xl flex-col gap-0 overflow-hidden rounded-[16px] border-none p-0 shadow-2xl">
        <div className="flex-shrink-0">
          <DialogHeader className="relative p-8 pb-4">
            <DialogTitle className="text-2xl font-bold text-grayScale-700">
              Add New Module
            </DialogTitle>
            <DialogDescription className="text-sm text-grayScale-400">
              Add a new module to this course.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-grayScale-100" />
            </div>
            <div className="relative flex justify-center">
              <div
                className="h-[0.5px] w-full opacity-20"
                style={{ background: "gray" }}
              />
            </div>
          </div>
        </div>

        <form
          className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-8 pt-4"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-grayScale-700">
              Module title
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greetings & Introductions"
              className="h-12 rounded-xl"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[15px] font-medium text-grayScale-700">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of the module"
              rows={3}
              className="min-h-[88px] resize-y rounded-xl"
              disabled={submitting || iconUploadBusy}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="create-module-sort-order"
              className="text-[15px] font-medium text-grayScale-700"
            >
              Sort Order
            </label>
            <Input
              id="create-module-sort-order"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="e.g. 5"
              className="h-12 rounded-xl"
              disabled={submitting || iconUploadBusy}
            />
            <p className="text-xs text-grayScale-500">
              Lower numbers appear first when modules are listed.
            </p>
          </div>

          <ModuleIconUploadField
            value={icon}
            onChange={setIcon}
            disabled={submitting}
            onUploadBusyChange={setIconUploadBusy}
          />

          <div className="flex justify-end gap-3 border-t border-grayScale-100  pt-4 pb-6">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 min-w-[120px] rounded-[6px] border-grayScale-200 font-semibold"
                disabled={submitting || iconUploadBusy}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-12 min-w-[160px] rounded-[6px] bg-brand-500 font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600"
              disabled={submitting || iconUploadBusy}
            >
              {submitting ? "Creating…" : "Create module"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
