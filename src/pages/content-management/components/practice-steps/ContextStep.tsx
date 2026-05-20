import { useRef, useState, type ChangeEvent } from "react";
import { ArrowRight, Loader2, Upload } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { toast } from "sonner";
import { uploadImageFile } from "../../../../api/files.api";

interface ContextStepProps {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  onCancel: () => void;
  /** Lesson-linked practice: no title, story description, or story image on step 1. */
  isLessonPractice?: boolean;
  lessonTitle?: string | null;
}

/**
 * Module / lesson entry: fields that map to POST /practices and POST /question-sets.
 */
export function ContextStep({
  formData,
  setFormData,
  nextStep,
  onCancel,
  isLessonPractice = false,
  lessonTitle = null,
}: ContextStepProps) {
  const storyFileRef = useRef<HTMLInputElement>(null);
  const [uploadingStory, setUploadingStory] = useState(false);

  const handleStoryImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingStory(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) throw new Error("Missing image URL from upload");
      setFormData({ ...formData, storyImageUrl: url });
      toast.success("Story image uploaded");
    } catch {
      toast.error("Could not upload story image");
    } finally {
      setUploadingStory(false);
    }
  };

  const canContinue = isLessonPractice
    ? true
    : Boolean(formData.title?.trim()) && Boolean(formData.description?.trim());

  return (
    <Card className="overflow-hidden border-grayScale-300 rounded-2xl bg-white animate-in fade-in duration-500">
      <div className="border-b border-grayScale-50 px-8 pt-8 pb-4">
        <h2 className="text-xl font-bold text-grayScale-900 leading-none">
          {isLessonPractice ? "Practice options" : "Practice details"}
        </h2>
        <p className="text-grayScale-600 text-base mt-3">
          {isLessonPractice ? (
            <>
              This practice is linked to{" "}
              <span className="font-medium text-grayScale-800">
                {lessonTitle?.trim() || "the selected lesson"}
              </span>
              . Set optional quick tips and question order below.
            </>
          ) : (
            <>
              Title, story, optional image, shuffle, and quick tips match the create
              practice and question set APIs.
            </>
          )}
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-grayScale-200" />
        </div>
        <div className="relative flex justify-center">
          <div
            className="h-[0.5px] w-full opacity-20 rounded-full"
            style={{ background: "gray" }}
          />
        </div>
      </div>

      <div className="space-y-8 p-10">
        {!isLessonPractice ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-grayScale-700">
                Practice title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Module conversation drill"
                className="h-11 rounded-xl border-grayScale-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-grayScale-700">
                Story description <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Short scenario for learners…"
                className="min-h-[120px] rounded-xl border-grayScale-200"
                maxLength={2000}
              />
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-grayScale-700">
            Quick tips <span className="text-grayScale-400">(optional)</span>
          </label>
          <Textarea
            value={formData.tips ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, tips: e.target.value })
            }
            placeholder="Learner-facing tips (quick_tips on POST /practices)"
            className="min-h-[80px] rounded-xl border-grayScale-200"
            maxLength={1000}
          />
        </div>

        {!isLessonPractice ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-grayScale-700">
              Story image <span className="text-grayScale-400">(optional)</span>
            </label>
            <Input
              value={formData.storyImageUrl ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, storyImageUrl: e.target.value })
              }
              placeholder="https://… or upload"
              className="h-11 rounded-xl border-grayScale-200 font-mono text-[13px]"
            />
            <input
              ref={storyFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleStoryImageFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingStory}
              onClick={() => storyFileRef.current?.click()}
              className="gap-2"
            >
              {uploadingStory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload image
            </Button>
          </div>
        ) : null}

        <label className="flex cursor-pointer items-center gap-3 text-sm text-grayScale-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-grayScale-300 text-brand-600 focus:ring-brand-500"
            checked={Boolean(formData.shuffleQuestions)}
            onChange={(e) =>
              setFormData({
                ...formData,
                shuffleQuestions: e.target.checked,
              })
            }
          />
          <span>Shuffle questions in the set</span>
        </label>
      </div>

      <div className="flex items-center justify-between border-t border-grayScale-100 bg-[#F8FAFC] p-4 px-12">
        <button
          type="button"
          className="text-[14px] font-bold text-grayScale-500 transition-colors hover:text-grayScale-700"
          onClick={onCancel}
        >
          Cancel
        </button>
        <Button
          type="button"
          onClick={nextStep}
          disabled={!canContinue}
          className="h-10 px-10 rounded-[6px] bg-brand-500 text-[14px] font-bold text-white transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          Next: Persona <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}
