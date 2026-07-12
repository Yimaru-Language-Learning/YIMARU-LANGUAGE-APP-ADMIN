import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createFAQ } from "../../../api/faq.api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Stepper } from "../../../components/ui/stepper";
import { notifyApiError } from "../../../lib/apiErrors";
import {
  draftToCreatePayload,
  EMPTY_FAQ_FORM_DRAFT,
  FaqForm,
  validateFaqDraft,
  type FaqFormDraft,
} from "./FaqForm";
import type { FAQStatus } from "../../../types/faq.types";

const STEPS = ["Question & Answer", "Category & Details"];

type CreateFaqDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  suggestedDisplayOrder: number;
  onCreated?: () => void;
};

export function CreateFaqDialog({
  open,
  onOpenChange,
  categories,
  suggestedDisplayOrder,
  onCreated,
}: CreateFaqDialogProps) {
  const [draft, setDraft] = useState<FaqFormDraft>(EMPTY_FAQ_FORM_DRAFT);
  const [saving, setSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<"draft" | "publish" | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (open) {
      setDraft({
        ...EMPTY_FAQ_FORM_DRAFT,
        display_order: String(suggestedDisplayOrder),
      });
      setSavingAction(null);
      setCurrentStep(1);
    }
  }, [open, suggestedDisplayOrder]);

  const handleOpenChange = (next: boolean) => {
    if (!next && !saving) onOpenChange(false);
  };

  const handleCreate = async (status: FAQStatus) => {
    const validationError = validateFaqDraft(draft);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    setSavingAction(status === "ACTIVE" ? "publish" : "draft");
    try {
      const response = await createFAQ(draftToCreatePayload(draft, status));
      if (!response.data) {
        throw new Error("Empty create response");
      }
      toast.success(
        status === "ACTIVE"
          ? (response.message ?? "FAQ published successfully")
          : (response.message ?? "FAQ saved as draft"),
      );
      onOpenChange(false);
      onCreated?.();
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to create FAQ");
    } finally {
      setSaving(false);
      setSavingAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg p-0 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-grayScale-100 px-6 py-5 pr-14">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-grayScale-900">
              New FAQ
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-grayScale-500">
              Add a question and answer for the learner help center.
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 pt-5">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        <FaqForm
          draft={draft}
          saving={saving}
          savingAction={savingAction}
          categories={categories}
          currentStep={currentStep}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          onStepChange={setCurrentStep}
          onSaveDraft={() => void handleCreate("INACTIVE")}
          onPublish={() => void handleCreate("ACTIVE")}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
