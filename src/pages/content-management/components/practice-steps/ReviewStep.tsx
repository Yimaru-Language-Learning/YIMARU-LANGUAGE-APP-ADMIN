import { Rocket, Info, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import type { QuestionTypeDefinition } from "../../../../types/questionTypeDefinition.types";
import {
  definitionUsesDynamicPayload,
  legacyQuestionTypeFromDefinition,
} from "../../../../lib/learnEnglishDefinitionQuestion";
import { PublishStatusField } from "./PublishStatusField";
import type { PracticePublishStatus } from "../../../../types/course.types";

interface ReviewStepProps {
  formData: any;
  setFormData: (data: any) => void;
  prevStep: () => void;
  parentSummary: string | null;
  typeDefinitions: QuestionTypeDefinition[];
  canPublish: boolean;
  submitting: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function ReviewStep({
  formData,
  setFormData,
  prevStep,
  parentSummary,
  typeDefinitions,
  canPublish,
  submitting,
  onSaveDraft,
  onPublish,
}: ReviewStepProps) {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-grayScale-900 tracking-tight">
          Review
        </h2>
      </div>

      {!canPublish && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Missing parent for the API</p>
          <p className="mt-1 text-amber-900/90">
            Open Add Practice from a course, module, or lesson so parent IDs are
            in the URL.
          </p>
        </div>
      )}

      <Card className="overflow-hidden border border-grayScale-200 rounded-2xl bg-white">
        <div className="border-b border-grayScale-50 px-5 py-4">
          <h3 className="text-[17px] font-extrabold text-grayScale-900">
            Practice
          </h3>
        </div>
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-grayScale-100" />
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-[70px] w-[85px] shrink-0 overflow-hidden rounded-xl bg-grayScale-100 shadow-inner">
              <img
                src={
                  formData.storyImageUrl?.trim() ||
                  "https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=200"
                }
                alt="Story"
                className="h-full w-full object-cover opacity-80"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h4 className="text-xl font-bold leading-tight text-grayScale-900">
                {formData.title || "Untitled"}
              </h4>
              <p className="text-sm text-grayScale-600">
                {parentSummary ? (
                  <span>
                    <span className="font-medium text-grayScale-800">Link:</span>{" "}
                    {parentSummary}
                  </span>
                ) : (
                  "—"
                )}
              </p>
              {formData.shuffleQuestions ? (
                <p className="text-xs text-grayScale-500">Shuffle questions: on</p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4 px-2">
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-bold uppercase tracking-widest text-grayScale-900">
            Quick tips
          </label>
          <Info className="h-4 w-4 text-brand-500" />
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm">
          <p className="text-[14px] font-medium leading-relaxed text-grayScale-600">
            {formData.tips?.trim() || "—"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="px-2 text-lg font-bold text-grayScale-900">Questions</h3>
        <div className="space-y-4">
          {formData.questions.map((q: any, i: number) => (
            <QuestionReviewBlock
              key={q.id}
              q={q}
              index={i}
              typeDefinitions={typeDefinitions}
            />
          ))}
        </div>
      </div>

      <PublishStatusField
        className="px-2"
        value={(formData.publishStatus ?? "DRAFT") as PracticePublishStatus}
        onChange={(publishStatus) => setFormData({ ...formData, publishStatus })}
        disabled={submitting}
      />

      <div className="flex items-center justify-between pt-12">
        <Button
          onClick={prevStep}
          variant="outline"
          className="h-10 rounded-[6px] border-grayScale-200 bg-white px-10 text-sm font-bold text-grayScale-600 shadow-sm transition-all hover:bg-grayScale-50"
        >
          Back
        </Button>
        <div className="flex gap-4">
          <Button
            variant="outline"
            disabled={submitting || !canPublish}
            onClick={() => {
              setFormData({ ...formData, publishStatus: "DRAFT" });
              onSaveDraft();
            }}
            className="h-10 rounded-[6px] border-grayScale-100 bg-white px-8 text-sm font-bold text-grayScale-600 shadow-sm hover:bg-grayScale-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Save as Draft
          </Button>
          <Button
            disabled={submitting || !canPublish}
            onClick={() => {
              setFormData({ ...formData, publishStatus: "PUBLISHED" });
              onPublish();
            }}
            className="h-10 gap-3 rounded-[6px] bg-brand-500 px-10 text-sm font-bold text-white shadow-xl shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionReviewBlock({
  q,
  index,
  typeDefinitions,
}: {
  q: any;
  index: number;
  typeDefinitions: QuestionTypeDefinition[];
}) {
  const def = typeDefinitions.find((d) => d.id === q.questionTypeDefinitionId);
  const badge =
    def != null
      ? `${def.display_name}${def.is_system ? "" : ` · ${def.key}`}`
      : q.questionTypeDefinitionId != null
        ? `Type #${q.questionTypeDefinitionId}`
        : "No type selected";

  const isDynamic = def != null && definitionUsesDynamicPayload(def);
  const legacy = def != null ? legacyQuestionTypeFromDefinition(def) : null;

  const schemaRows: { key: string; label: string; value: string }[] = [];
  if (isDynamic && def) {
    const vals = (q.dynamicFieldValues ?? {}) as Record<string, string>;
    for (const r of def.stimulus_schema) {
      const k = `stimulus:${r.id}`;
      schemaRows.push({
        key: k,
        label: r.label?.trim() || r.kind,
        value: vals[k] ?? "",
      });
    }
    for (const r of def.response_schema) {
      const k = `response:${r.id}`;
      schemaRows.push({
        key: k,
        label: r.label?.trim() || r.kind,
        value: vals[k] ?? "",
      });
    }
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border-grayScale-50 bg-white shadow-soft">
      <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-brand-500" />
      <div className="space-y-4 px-5 pb-6 pt-4 pl-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grayScale-50 pb-3">
          <span className="text-base font-bold text-grayScale-500">
            Question {index + 1}
          </span>
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {badge}
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-grayScale-600">
            Question text
          </span>
          <Input
            value={q.text}
            readOnly
            className="min-h-[52px] rounded-xl border-grayScale-200 bg-white px-4 py-3 text-base font-medium text-grayScale-700"
          />
        </div>

        {isDynamic && schemaRows.length > 0 ? (
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-grayScale-600">
              Stimulus and response fields
            </span>
            <ul className="space-y-2 text-sm">
              {schemaRows.map((row) => (
                <li key={row.key} className="rounded-lg border border-grayScale-100 bg-grayScale-50/50 px-3 py-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-grayScale-500">
                    {row.label}
                  </span>
                  <span className="mt-1 block break-all font-mono text-xs text-grayScale-800">
                    {row.value?.trim() ? row.value : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {legacy === "MCQ" && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-grayScale-600">
              Choices
            </span>
            <ul className="space-y-1.5 text-sm">
              {(q.mcqOptions ?? []).map(
                (opt: { text?: string; isCorrect?: boolean }, j: number) =>
                  opt.text?.trim() ? (
                    <li
                      key={j}
                      className={
                        opt.isCorrect
                          ? "font-medium text-green-700"
                          : "text-grayScale-600"
                      }
                    >
                      {opt.isCorrect ? "✓ " : ""}
                      {opt.text}
                    </li>
                  ) : null,
              )}
            </ul>
          </div>
        )}

        {legacy === "TRUE_FALSE" && (
          <p className="text-sm text-grayScale-700">
            <span className="font-semibold">Correct:</span>{" "}
            {q.trueFalseCorrect !== false ? "True" : "False"}
          </p>
        )}

        {legacy === "SHORT_ANSWER" && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-grayScale-600">
              Acceptable answers
            </span>
            <ul className="list-disc space-y-1 pl-5 text-sm text-grayScale-700">
              {(q.shortAnswers ?? [])
                .filter((s: string) => s?.trim())
                .map((s: string, j: number) => (
                  <li key={j}>{s}</li>
                ))}
            </ul>
          </div>
        )}

        {def != null && legacy == null && !isDynamic ? (
          <p className="text-xs text-amber-800">
            This type has no schema and is not mapped to a classic MCQ / true–false /
            short-answer form. Publish still sends the best-effort payload from the
            builder.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
