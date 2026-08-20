import { useState } from "react";
import { Edit, Info, Loader2, Play, Rocket } from "lucide-react";
import { PersonaAvatar } from "../../../../components/personas/PersonaAvatar";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { cn } from "../../../../lib/utils";
import { UnassignedLabel, isUnassignedLabel } from "../../../../lib/displayValue"
import { RichTextContent } from "../../../../components/ui/rich-text-content";

export type PracticeReviewQuestion = {
  id: string;
  questionText: string;
  voicePrompt: string;
  sampleAnswerVoicePrompt: string;
  tips?: string;
};

export type PracticeReviewMetadataItem = {
  label: string;
  value: string;
};

export type PracticeSequentialReviewProps = {
  practiceTitle: string;
  thumbnailUrl?: string | null;
  thumbnailKind?: "image" | "video" | "vimeo" | "gradient";
  persona?: { name: string; avatar: string } | null;
  metadata?: PracticeReviewMetadataItem[];
  parentLink?: string | null;
  guidanceText: string;
  questions: PracticeReviewQuestion[];
  saving?: boolean;
  saveError?: string | null;
  canPublish?: boolean;
  showMissingParentWarning?: boolean;
  showUnlinkedBanner?: boolean;
  onEditContext?: () => void;
  onEditQuestions?: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  publishLabel?: string;
  publishingLabel?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
};

function audioFileLabel(url: string, fallback: string): string {
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  try {
    const path = new URL(trimmed).pathname.split("/").filter(Boolean).pop();
    if (path) return decodeURIComponent(path);
  } catch {
    // fall through
  }
  const seg = trimmed.split("/").filter(Boolean).pop();
  return seg && seg.length < 64 ? seg : fallback;
}

export function ReviewAudioPlayer({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const fileName = audioFileLabel(src, label);

  if (!src.trim()) {
    return (
      <p className="text-xs italic text-grayScale-400">No audio URL provided</p>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/40 px-2 py-1.5",
        className,
      )}
    >
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-brand-500 text-white shadow-sm transition-colors hover:bg-brand-600"
        aria-label={`Play ${fileName}`}
        onClick={() => {
          const audio = new Audio(src);
          setPlaying(true);
          void audio.play().finally(() => setPlaying(false));
        }}
      >
        <Play
          className={cn("h-3.5 w-3.5", playing && "opacity-80")}
          fill="currentColor"
        />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className="flex h-6 flex-1 items-end gap-0.5 px-1 opacity-70"
          aria-hidden
        >
          {[3, 5, 4, 7, 5, 8, 4, 6, 5, 4, 6, 4].map((h, i) => (
            <span
              key={i}
              className="w-0.5 shrink-0 rounded-full bg-brand-400"
              style={{ height: `${h + 4}px` }}
            />
          ))}
        </div>
        <span className="max-w-[8rem] truncate text-[11px] font-medium text-brand-700 sm:max-w-[10rem]">
          {fileName}
        </span>
      </div>
      <span className="sr-only">{src}</span>
    </div>
  );
}

function formatQuestionIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function PracticeSequentialReview({
  practiceTitle,
  thumbnailUrl,
  thumbnailKind = "gradient",
  persona = null,
  metadata = [],
  parentLink = null,
  guidanceText,
  questions,
  saving = false,
  saveError = null,
  canPublish = true,
  showMissingParentWarning = false,
  showUnlinkedBanner = false,
  onEditContext,
  onEditQuestions,
  onBack,
  onSaveDraft,
  onPublish,
  publishLabel = "Publish Now",
  publishingLabel = "Publishing…",
  sectionTitle = "Create Practice Questions",
  sectionSubtitle = "Define the dialogue flow and interactions for this scenario.",
}: PracticeSequentialReviewProps) {
  const filledQuestions = questions.filter(
    (q) =>
      q.questionText.trim() ||
      q.voicePrompt.trim() ||
      q.sampleAnswerVoicePrompt.trim(),
  );

  return (
    <div className="w-full space-y-6">
      {sectionTitle ? (
        <div className="space-y-1 px-0.5">
          <h2 className="text-xl font-bold tracking-tight text-grayScale-900 sm:text-2xl">
            {sectionTitle}
          </h2>
          {sectionSubtitle ? (
            <p className="text-sm text-grayScale-500 sm:text-[15px]">
              {sectionSubtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      {showUnlinkedBanner && parentLink === "Not attached to any course, module, or lesson" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Not attached yet</p>
          <p className="mt-1 text-amber-900/90">
            This practice will be saved without course, module, or lesson links. Attach locations
            later from the practice editor.
          </p>
        </div>
      ) : null}

      {showMissingParentWarning && !canPublish ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Missing parent for the API</p>
          <p className="mt-1 text-amber-900/90">
            Open Add Practice from a course, module, or lesson so parent IDs are
            in the URL.
          </p>
        </div>
      ) : null}

      <Card className="overflow-hidden border-grayScale-200/80 p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
          <h3 className="font-semibold text-grayScale-900">Basic Information</h3>
          {onEditContext ? (
            <button
              type="button"
              onClick={onEditContext}
              className="flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <div className="h-[70px] w-[85px] shrink-0 overflow-hidden rounded-xl bg-grayScale-100 shadow-inner sm:h-20 sm:w-24">
            {thumbnailKind === "video" && thumbnailUrl ? (
              <video
                src={thumbnailUrl}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : thumbnailKind === "vimeo" ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grayScale-200 to-grayScale-300">
                <Play className="h-6 w-6 text-brand-500" fill="currentColor" />
              </div>
            ) : thumbnailUrl?.trim() ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : persona?.avatar ? (
              <PersonaAvatar src={persona.avatar} alt={persona.name} size="md" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E0F2FE] to-[#BFDBFE]" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <h4 className="text-lg font-bold leading-tight text-grayScale-900 sm:text-xl">
              {practiceTitle.trim() || "Untitled Practice"}
            </h4>
            {metadata.length > 0 ? (
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {metadata.map((item) => (
                  <div key={item.label}>
                    <dt className="inline text-grayScale-900">{item.label}: </dt>
                    <dd className="inline font-medium text-brand-600">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : parentLink ? (
              <p className="text-sm text-grayScale-600">
                <span className="font-medium text-grayScale-800">Link:</span>{" "}
                {parentLink}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-grayScale-500">
              Persona
            </span>
            {persona ? (
              <div className="flex flex-col items-center gap-1.5">
                <PersonaAvatar src={persona.avatar} alt={persona.name} size="md" />
                <span className="text-sm font-semibold text-grayScale-900">
                  {persona.name}
                </span>
              </div>
            ) : (
              <span className="text-sm text-grayScale-400">None selected</span>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-grayScale-900">
            Tips / Guidance
          </span>
          <Info className="h-4 w-4 text-brand-500" />
        </div>
        <div className="rounded-xl border border-grayScale-200 bg-white px-5 py-4 shadow-sm">
          {isUnassignedLabel(guidanceText) ? (
            <UnassignedLabel />
          ) : (
            <RichTextContent
              html={guidanceText}
              className="text-sm leading-relaxed text-grayScale-600"
            />
          )}
        </div>
      </div>

      <Card className="overflow-hidden border-grayScale-200/80 p-0 shadow-sm">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-grayScale-100">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h3 className="font-semibold text-grayScale-900">Questions</h3>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-grayScale-100 px-2 text-xs font-semibold text-grayScale-500">
                {filledQuestions.length}
              </span>
            </div>
            <div className="space-y-6 px-6 py-5">
              {filledQuestions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <span className="text-sm font-bold text-grayScale-400">
                    {formatQuestionIndex(index)}
                  </span>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-grayScale-500">
                      Text prompt
                    </p>
                    <p className="text-sm leading-relaxed text-grayScale-800">
                      {question.questionText.trim() || <UnassignedLabel />}
                    </p>
                  </div>
                  {question.voicePrompt.trim() ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-grayScale-500">
                        Voice prompt
                      </p>
                      <ReviewAudioPlayer
                        src={question.voicePrompt}
                        label={`prompt_q${index + 1}.mp3`}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col border-t border-grayScale-100 md:border-t-0">
            <div className="flex items-center justify-between gap-2 border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-grayScale-900">Answers</h3>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-grayScale-100 px-2 text-xs font-semibold text-grayScale-500">
                  {filledQuestions.length}
                </span>
              </div>
              {onEditQuestions ? (
                <button
                  type="button"
                  onClick={onEditQuestions}
                  className="flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : null}
            </div>
            <div className="space-y-6 px-6 py-5">
              {filledQuestions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <span className="text-sm font-bold text-grayScale-400">
                    {formatQuestionIndex(index)}
                  </span>
                  {question.sampleAnswerVoicePrompt.trim() ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-grayScale-500">
                        Voice prompt
                      </p>
                      <ReviewAudioPlayer
                        src={question.sampleAnswerVoicePrompt}
                        label={`answer_q${index + 1}.mp3`}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-grayScale-400"><UnassignedLabel /></p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {saveError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{saveError}</p>
        </div>
      ) : null}

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 rounded-[6px] border-grayScale-200 bg-white px-8 text-sm font-bold text-grayScale-600 shadow-sm hover:bg-grayScale-50"
        >
          Back
        </Button>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={saving || !canPublish}
            className="h-10 rounded-[6px] border-brand-500 bg-white px-8 text-sm font-bold text-brand-500 hover:bg-brand-50 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save as Draft"
            )}
          </Button>
          <Button
            type="button"
            onClick={onPublish}
            disabled={saving || !canPublish}
            className="h-10 gap-2 rounded-[6px] bg-brand-500 px-8 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {saving ? publishingLabel : publishLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
