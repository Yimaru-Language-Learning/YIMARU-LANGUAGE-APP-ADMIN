import { notifyApiError } from "../../../../lib/apiErrors"
import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Upload, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { toast } from "sonner";
import { uploadImageFile } from "../../../../api/files.api";
interface ScenarioStepProps {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  cancelHref: string;
}

export function ScenarioStep({
  formData,
  setFormData,
  nextStep,
  cancelHref,
}: ScenarioStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const onBannerFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await uploadImageFile(file);
      const url = res.data?.data?.url?.trim();
      if (!url) throw new Error("Missing URL");
      setFormData({ ...formData, storyImageUrl: url });
      toast.success("Story image uploaded");
    } catch {
      notifyApiError(err, "Could not upload image");
    } finally {
      setUploadingBanner(false);
    }
  };

  const canContinue =
    Boolean(formData.title?.trim()) && Boolean(formData.description?.trim());

  return (
    <div className="space-y-6">
      <div className="space-y-1 px-2">
        <h2 className="text-2xl font-extrabold text-grayScale-700">
          Practice details
        </h2>
        <p className="text-grayScale-400 text-lg">
          Story fields and question set options used when saving the practice.
        </p>
      </div>

      <Card className="p-8 space-y-6 border-grayScale-200 rounded-2xl bg-white">
        <div className="space-y-2">
          <label className="text-sm font-medium text-grayScale-700">
            Story image <span className="text-grayScale-400">(optional)</span>
          </label>
          <Input
            value={formData.storyImageUrl ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, storyImageUrl: e.target.value })
            }
            placeholder="Image URL"
            className="h-10 rounded-lg border-grayScale-200 font-mono text-xs"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onBannerFile}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploadingBanner}
            onClick={() => fileRef.current?.click()}
            className="gap-2"
          >
            {uploadingBanner ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload image
          </Button>
        </div>

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

        <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-grayScale-800">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-grayScale-300 text-sky-600 focus:ring-sky-500"
              checked={formData.authoringProfile === "IELTS_SHARED_STIMULUS"}
              onChange={(e) => {
                const nextProfile = e.target.checked
                  ? "IELTS_SHARED_STIMULUS"
                  : "STANDALONE";
                if (
                  !e.target.checked &&
                  formData.authoringProfile === "IELTS_SHARED_STIMULUS" &&
                  (formData.stimulusBlocks?.length ?? 0) > 0
                ) {
                  const proceed = window.confirm(
                    "Switching off IELTS shared stimulus mode will remove stimulus blocks on save. Continue?",
                  );
                  if (!proceed) return;
                }
                setFormData({
                  ...formData,
                  authoringProfile: nextProfile,
                  ...(nextProfile === "STANDALONE"
                    ? {
                        stimulusBlocks: [],
                        questions: (formData.questions ?? []).map(
                          (q: { stimulusBlockKey?: string | null }) => ({
                            ...q,
                            stimulusBlockKey: null,
                          }),
                        ),
                      }
                    : {}),
                });
              }}
            />
            <span>
              <span className="font-semibold text-sky-900">
                Use shared stimulus sections (IELTS mode)
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-sky-900/80">
                Authors define shared audio, passages, or instructions per section.
              </span>
            </span>
          </label>
        </div>
      </Card>

      <Card className="p-8 space-y-6 border-grayScale-200 rounded-2xl bg-white">
        <div className="space-y-2">
          <label className="text-sm font-medium text-grayScale-700">
            Practice title <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g. Ordering coffee at a cafe"
            className="h-12 rounded-xl border-grayScale-200 focus:border-brand-500 placeholder:text-grayScale-500 bg-white"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-grayScale-700">
            Story description <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Textarea
              placeholder="Describe the scenario…"
              className="min-h-[160px] rounded-xl resize-none p-4 border-grayScale-200 focus:border-brand-500 leading-relaxed placeholder:text-grayScale-500 bg-white"
              maxLength={1000}
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
            <div className="absolute bottom-4 right-4 text-xs font-bold text-grayScale-500">
              {formData.description.length} / 1000
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-grayScale-700">
            Quick tips <span className="text-grayScale-400">(optional)</span>
          </label>
          <Textarea
            value={formData.tips ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, tips: e.target.value })
            }
            placeholder="Learner-facing tips (quick_tips)"
            className="min-h-[80px] rounded-xl border-grayScale-200"
            maxLength={1000}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" className="h-10 px-6" asChild>
          <Link to={cancelHref}>Cancel</Link>
        </Button>
        <Button
          type="button"
          onClick={nextStep}
          disabled={!canContinue}
          className="h-10 rounded-[6px] bg-brand-500 px-8 disabled:opacity-50"
        >
          Next: Persona <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
