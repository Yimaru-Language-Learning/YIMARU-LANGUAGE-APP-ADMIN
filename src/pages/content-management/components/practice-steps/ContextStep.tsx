import { notifyApiError } from "../../../../lib/apiErrors"
import { useRef, useState, type ChangeEvent } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Loader2, Upload } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { toast } from "sonner";
import { uploadImageFile } from "../../../../api/files.api";
import type { PracticeParent, AuthoringProfile } from "../../../../types/course.types";
import { PracticeParentsField } from "./PracticeParentsField";
import { formatPracticeParentsSummary } from "../../../../lib/practiceParents";

interface ContextStepProps {
  formData: {
    title?: string;
    description?: string;
    storyImageUrl?: string;
    shuffleQuestions?: boolean;
    tips?: string;
    authoringProfile?: AuthoringProfile;
    parents?: PracticeParent[];
  };
  setFormData: (data: ContextStepProps["formData"]) => void;
  nextStep: () => void;
  onCancel: () => void;
  /** Lesson-linked practice: no title, story description, or story image on step 1. */
  isLessonPractice?: boolean;
  lessonTitle?: string | null;
  parentSummary?: string | null;
  /** Learn English LMS — show multi-parent picker. */
  showParentsEditor?: boolean;
  lockedParentKey?: string | null;
  /** When true, locations are optional and the picker can stay collapsed. */
  parentsOptional?: boolean;
  /** Use exam-prep parent kinds in the locations editor. */
  isExamPrepParents?: boolean;
  parentsCollapsedDefault?: boolean;
  /** When editing an existing practice, enable per-parent DELETE unlink. */
  practiceId?: number;
  onParentsUnlinked?: (parents: PracticeParent[]) => void;
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
  parentSummary = null,
  showParentsEditor = false,
  lockedParentKey = null,
  parentsOptional = false,
  parentsCollapsedDefault = false,
  isExamPrepParents = false,
  practiceId,
  onParentsUnlinked,
}: ContextStepProps) {
  const storyFileRef = useRef<HTMLInputElement>(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [parentsExpanded, setParentsExpanded] = useState(!parentsCollapsedDefault);

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
      notifyApiError(err, "Could not upload story image");
    } finally {
      setUploadingStory(false);
    }
  };

  const canContinue = isLessonPractice
    ? true
    : Boolean(formData.title?.trim()) && Boolean(formData.description?.trim());

  const parentsSummary =
    formData.parents && formData.parents.length > 0
      ? formatPracticeParentsSummary(formData.parents)
      : parentSummary;

  return (
    <Card className="overflow-hidden border-grayScale-300 rounded-2xl bg-white animate-in fade-in duration-500">
      <div className="border-b border-grayScale-50 px-8 pt-8 pb-4">
        <h2 className="text-xl font-bold text-grayScale-900 leading-none">
          {isLessonPractice ? "Practice options" : "Practice details"}
        </h2>
        <p className="text-grayScale-600 text-base mt-3">
          {isLessonPractice ? (
            <>
              Story fields and question set options used when saving the practice. Linked to{" "}
              <span className="font-medium text-grayScale-800">
                {lessonTitle?.trim() || "the selected lesson"}
              </span>
              .
            </>
          ) : (
            <>
              Story fields and question set options used when saving the practice.
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
        {parentsSummary && !showParentsEditor ? (
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-grayScale-800">
            <p className="font-semibold text-brand-700">LMS parent</p>
            <p className="mt-1">{parentsSummary}</p>
            <p className="mt-1 text-xs text-grayScale-500">
              The question set and practice will be linked to these locations.
            </p>
          </div>
        ) : null}

        {showParentsEditor ? (
          parentsOptional ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                <p className="font-semibold text-amber-900">Locations optional</p>
                <p className="mt-1 text-amber-900/90">
                  You can create this practice now and attach it to{" "}
                  {isExamPrepParents
                    ? "catalog courses, units, or lessons"
                    : "courses, modules, or lessons"}{" "}
                  later from the practice editor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setParentsExpanded((open) => !open)}
                className="flex w-full items-center justify-between rounded-xl border border-grayScale-200 bg-grayScale-50/60 px-4 py-3 text-left transition-colors hover:bg-grayScale-50"
              >
                <div>
                  <p className="text-sm font-semibold text-grayScale-800">Locations (optional)</p>
                  <p className="mt-0.5 text-xs text-grayScale-500">
                    {parentsSummary &&
                    parentsSummary !== "Not attached to any course, module, or lesson"
                      ? parentsSummary
                      : "Skip for now — attach later"}
                  </p>
                </div>
                {parentsExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-grayScale-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-500" />
                )}
              </button>
              {parentsExpanded ? (
                <PracticeParentsField
                  parents={formData.parents ?? []}
                  lockedParentKey={lockedParentKey}
                  optional
                  isExamPrep={isExamPrepParents}
                  practiceId={practiceId}
                  onUnlinked={onParentsUnlinked}
                  onChange={(parents) => setFormData({ ...formData, parents })}
                />
              ) : null}
            </div>
          ) : (
            <PracticeParentsField
              parents={formData.parents ?? []}
              lockedParentKey={lockedParentKey}
              isExamPrep={isExamPrepParents}
              practiceId={practiceId}
              onUnlinked={onParentsUnlinked}
              onChange={(parents) => setFormData({ ...formData, parents })}
            />
          )
        ) : null}

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
            placeholder="Optional tips shown to learners before they start"
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

        <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-grayScale-800">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-grayScale-300 text-sky-600 focus:ring-sky-500"
              checked={formData.authoringProfile === "IELTS_SHARED_STIMULUS"}
              onChange={(e) => {
                const nextProfile: AuthoringProfile = e.target.checked
                  ? "IELTS_SHARED_STIMULUS"
                  : "STANDALONE";
                if (
                  !e.target.checked &&
                  formData.authoringProfile === "IELTS_SHARED_STIMULUS"
                ) {
                  const hasBlocks =
                    Array.isArray((formData as { stimulusBlocks?: unknown[] }).stimulusBlocks) &&
                    ((formData as { stimulusBlocks?: unknown[] }).stimulusBlocks?.length ?? 0) > 0;
                  if (hasBlocks) {
                    const proceed = window.confirm(
                      "Switching off IELTS shared stimulus mode will remove stimulus blocks on save. Continue?",
                    );
                    if (!proceed) return;
                  }
                }
                setFormData({
                  ...formData,
                  authoringProfile: nextProfile,
                  ...(nextProfile === "STANDALONE"
                    ? {
                        stimulusBlocks: [],
                        questions: Array.isArray((formData as { questions?: { stimulusBlockKey?: string | null }[] }).questions)
                          ? (formData as { questions: { stimulusBlockKey?: string | null }[] }).questions.map(
                              (q) => ({ ...q, stimulusBlockKey: null }),
                            )
                          : undefined,
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
                Authors define shared audio, passages, or instructions per section. Questions
                link to a block and edit response fields only.
              </span>
            </span>
          </label>
        </div>
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
