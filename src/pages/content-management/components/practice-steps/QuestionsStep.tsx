import { Trash2, Plus, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { DynamicSchemaSlotField } from "../../../../components/content-management/DynamicSchemaSlotField";
import type { QuestionTypeDefinition } from "../../../../types/questionTypeDefinition.types";
import { questionTypeDefinitionListLabel } from "../../../../api/questionTypeDefinitions.api";
import {
  definitionUsesDynamicPayload,
  emptyDynamicFieldValuesForDefinition,
  legacyQuestionTypeFromDefinition,
} from "../../../../lib/learnEnglishDefinitionQuestion";
import { validateLearnEnglishQuestionsWithDefinitions } from "../../../../lib/learnEnglishPracticePublish";
import { toast } from "sonner";

function defaultMcqOptions() {
  return [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ];
}

function createEmptyQuestionRow(id: string) {
  return {
    id,
    questionTypeDefinitionId: null as number | null,
    text: "",
    dynamicFieldValues: {} as Record<string, string>,
    mcqOptions: defaultMcqOptions(),
    trueFalseCorrect: true,
    shortAnswers: [""],
  };
}

interface QuestionsStepProps {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  typeDefinitions: QuestionTypeDefinition[];
  definitionsLoading: boolean;
  definitionsError: string | null;
}

export function QuestionsStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
  typeDefinitions,
  definitionsLoading,
  definitionsError,
}: QuestionsStepProps) {
  const applyDefinitionToQuestion = (
    index: number,
    definitionId: number,
    defs: QuestionTypeDefinition[],
  ) => {
    const def = defs.find((d) => d.id === definitionId);
    const newQuestions = [...formData.questions];
    const row = { ...newQuestions[index], questionTypeDefinitionId: definitionId };
    if (def) {
      row.dynamicFieldValues = emptyDynamicFieldValuesForDefinition(def);
    }
    newQuestions[index] = row;
    setFormData({ ...formData, questions: newQuestions });
  };

  const setDynamicValue = (qIndex: number, key: string, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex] = {
      ...newQuestions[qIndex],
      dynamicFieldValues: {
        ...(newQuestions[qIndex].dynamicFieldValues ?? {}),
        [key]: value,
      },
    };
    setFormData({ ...formData, questions: newQuestions });
  };

  const addQuestion = () => {
    const id = `q${Date.now()}`;
    const row = createEmptyQuestionRow(id);
    if (typeDefinitions[0]) {
      row.questionTypeDefinitionId = typeDefinitions[0].id;
      row.dynamicFieldValues = emptyDynamicFieldValuesForDefinition(
        typeDefinitions[0],
      );
    }
    setFormData({
      ...formData,
      questions: [...formData.questions, row],
    });
  };

  const renderTypeSpecificFields = (q: any, i: number, def: QuestionTypeDefinition) => {
    if (definitionUsesDynamicPayload(def)) {
      return (
        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/40 p-3">
          <p className="text-xs leading-snug text-grayScale-600">
            <span className="font-medium text-grayScale-800">Image, audio, and PDF</span> use upload or URL.{" "}
            <span className="font-medium text-grayScale-800">Table</span> uses the visual table builder. Timer and
            prep-time slots use seconds. Other slots use text or structured JSON where noted.
          </p>
          {def.stimulus_schema.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">Stimulus</p>
              {def.stimulus_schema.map((row) => (
                <div
                  key={`stimulus-${row.id}`}
                  className="rounded-lg border border-grayScale-200 bg-white p-2.5"
                >
                  <DynamicSchemaSlotField
                    row={row}
                    value={q.dynamicFieldValues?.[`stimulus:${row.id}`] ?? ""}
                    onChange={(next) =>
                      setDynamicValue(i, `stimulus:${row.id}`, next)
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}
          {def.response_schema.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">Response</p>
              {def.response_schema.map((row) => (
                <div
                  key={`response-${row.id}`}
                  className="rounded-lg border border-grayScale-200 bg-white p-2.5"
                >
                  <DynamicSchemaSlotField
                    row={row}
                    value={q.dynamicFieldValues?.[`response:${row.id}`] ?? ""}
                    onChange={(next) =>
                      setDynamicValue(i, `response:${row.id}`, next)
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    const legacy = legacyQuestionTypeFromDefinition(def);
    if (legacy === "MCQ") {
      return (
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
            Choices (mark one correct)
          </label>
          <div className="space-y-2">
            {(q.mcqOptions ?? defaultMcqOptions()).map(
              (opt: { text: string; isCorrect: boolean }, j: number) => (
                <div
                  key={j}
                  className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                >
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const newQuestions = [...formData.questions];
                      const opts = [
                        ...(newQuestions[i].mcqOptions ?? defaultMcqOptions()),
                      ];
                      opts[j] = { ...opts[j], text: e.target.value };
                      newQuestions[i].mcqOptions = opts;
                      setFormData({ ...formData, questions: newQuestions });
                    }}
                    className="min-w-0 flex-1 rounded-lg border-grayScale-200"
                    placeholder={`Option ${j + 1}`}
                  />
                  <label className="flex shrink-0 items-center gap-2 text-sm text-grayScale-600">
                    <input
                      type="radio"
                      name={`mcq-correct-${q.id}`}
                      checked={opt.isCorrect}
                      onChange={() => {
                        const newQuestions = [...formData.questions];
                        const opts = (
                          newQuestions[i].mcqOptions ?? defaultMcqOptions()
                        ).map((o: { text: string; isCorrect: boolean }, k: number) => ({
                          ...o,
                          isCorrect: k === j,
                        }));
                        newQuestions[i].mcqOptions = opts;
                        setFormData({ ...formData, questions: newQuestions });
                      }}
                    />
                    Correct
                  </label>
                </div>
              ),
            )}
          </div>
        </div>
      );
    }

    if (legacy === "TRUE_FALSE") {
      return (
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
            Correct answer
          </span>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-grayScale-700">
              <input
                type="radio"
                name={`tf-${q.id}`}
                checked={q.trueFalseCorrect !== false}
                onChange={() => {
                  const newQuestions = [...formData.questions];
                  newQuestions[i].trueFalseCorrect = true;
                  setFormData({ ...formData, questions: newQuestions });
                }}
              />
              True
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-grayScale-700">
              <input
                type="radio"
                name={`tf-${q.id}`}
                checked={q.trueFalseCorrect === false}
                onChange={() => {
                  const newQuestions = [...formData.questions];
                  newQuestions[i].trueFalseCorrect = false;
                  setFormData({ ...formData, questions: newQuestions });
                }}
              />
              False
            </label>
          </div>
        </div>
      );
    }

    if (legacy === "SHORT_ANSWER") {
      return (
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
            Acceptable answers
          </label>
          {(q.shortAnswers ?? [""]).map((line: string, j: number) => (
            <div key={j} className="flex gap-2">
              <Input
                value={line}
                onChange={(e) => {
                  const newQuestions = [...formData.questions];
                  const lines = [...(newQuestions[i].shortAnswers ?? [""])];
                  lines[j] = e.target.value;
                  newQuestions[i].shortAnswers = lines;
                  setFormData({ ...formData, questions: newQuestions });
                }}
                className="rounded-lg border-grayScale-200"
                placeholder="Acceptable wording"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newQuestions = [...formData.questions];
                  const lines = [...(newQuestions[i].shortAnswers ?? [""])];
                  lines.splice(j, 1);
                  newQuestions[i].shortAnswers =
                    lines.length > 0 ? lines : [""];
                  setFormData({ ...formData, questions: newQuestions });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newQuestions = [...formData.questions];
              newQuestions[i].shortAnswers = [
                ...(newQuestions[i].shortAnswers ?? [""]),
                "",
              ];
              setFormData({ ...formData, questions: newQuestions });
            }}
          >
            Add acceptable answer
          </Button>
        </div>
      );
    }

    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
        This definition has no schema rows and is not mapped to MCQ / True‑False /
        Short answer. It will be submitted as{" "}
        <span className="font-mono">DYNAMIC</span> with an empty payload.
      </p>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 px-2">
        <h2 className="text-2xl font-bold text-grayScale-700">Questions</h2>
        <p className="text-grayScale-400 text-lg">
          Choose a question type for each item, then fill in the fields that type requires. Questions are saved
          when you publish or save the practice.
        </p>
      </div>

      {definitionsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {definitionsError}
        </div>
      ) : null}

      {definitionsLoading ? (
        <p className="px-2 text-sm text-grayScale-500">Loading question types…</p>
      ) : null}

      <div className="space-y-6">
        {formData.questions.map((q: any, i: number) => {
          const def = typeDefinitions.find(
            (d) => d.id === q.questionTypeDefinitionId,
          );
          return (
            <Card
              key={q.id}
              className="relative overflow-hidden rounded-2xl border border-grayScale-50 bg-white shadow-soft"
            >
              <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-brand-500" />
              <div className="space-y-6 px-5 pb-7 pt-4 pl-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grayScale-50 pb-4">
                  <span className="text-base font-bold text-grayScale-500">
                    Question {i + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="text-brand-500 hover:bg-brand-50 rounded-lg"
                    onClick={() => {
                      const newQuestions = formData.questions.filter(
                        (item: any) => item.id !== q.id,
                      );
                      if (newQuestions.length > 0) {
                        setFormData({ ...formData, questions: newQuestions });
                        return;
                      }
                      const row = createEmptyQuestionRow("q1");
                      if (typeDefinitions[0]) {
                        row.questionTypeDefinitionId = typeDefinitions[0].id;
                        row.dynamicFieldValues =
                          emptyDynamicFieldValuesForDefinition(
                            typeDefinitions[0],
                          );
                      }
                      setFormData({ ...formData, questions: [row] });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
                    Question type
                  </label>
                  <select
                    className="h-11 w-full max-w-xl rounded-lg border border-grayScale-200 bg-white px-3 text-sm font-medium text-grayScale-800"
                    disabled={definitionsLoading || typeDefinitions.length === 0}
                    value={
                      q.questionTypeDefinitionId != null
                        ? String(q.questionTypeDefinitionId)
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      applyDefinitionToQuestion(i, Number(v), typeDefinitions);
                    }}
                  >
                    <option value="">
                      {definitionsLoading
                        ? "Loading…"
                        : "Select question type…"}
                    </option>
                    {typeDefinitions.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {questionTypeDefinitionListLabel(d)}
                      </option>
                    ))}
                  </select>
                  {def?.description ? (
                    <p className="text-xs text-grayScale-500">{def.description}</p>
                  ) : null}
                </div>

                {def && !definitionUsesDynamicPayload(def) ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
                      Question text
                    </label>
                    <Input
                      value={q.text}
                      onChange={(e) => {
                        const newQuestions = [...formData.questions];
                        newQuestions[i].text = e.target.value;
                        setFormData({ ...formData, questions: newQuestions });
                      }}
                      className="min-h-[52px] rounded-xl border-grayScale-200 px-4 py-3 text-base font-medium text-grayScale-700"
                      placeholder="Question prompt for learners"
                    />
                  </div>
                ) : def && definitionUsesDynamicPayload(def) ? (
                  <p className="rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 text-xs text-violet-950">
                    Enter the question prompt in the text or instruction field below, along with any other
                    required content for this type.
                  </p>
                ) : null}

                {def ? renderTypeSpecificFields(q, i, def) : null}
              </div>
            </Card>
          );
        })}

        <div className="flex items-center gap-8 pt-4">
          <button
            type="button"
            onClick={addQuestion}
            disabled={definitionsLoading || typeDefinitions.length === 0}
            className="flex items-center gap-3 text-base font-bold text-brand-500 transition-all hover:opacity-80 disabled:opacity-40"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-500">
              <Plus className="h-3 w-3 stroke-[4]" />
            </div>
            Add question
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-8">
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="h-10 w-20 rounded-[6px] border-grayScale-200 font-bold text-grayScale-600 shadow-sm"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            const mapped = formData.questions.map((row: typeof formData.questions[0]) => ({
              questionText: String(row.text ?? "").trim(),
              questionTypeDefinitionId: Number(row.questionTypeDefinitionId),
              dynamicFieldValues: { ...(row.dynamicFieldValues ?? {}) },
              mcqOptions: (row.mcqOptions ?? []).map(
                (o: { text?: string; isCorrect?: boolean }) => ({
                  option_text: String(o.text ?? "").trim(),
                  is_correct: Boolean(o.isCorrect),
                }),
              ),
              trueFalseAnswerIsTrue: row.trueFalseCorrect !== false,
              shortAnswers: (row.shortAnswers ?? []).map((s: string) => String(s)),
            }));
            const msg = validateLearnEnglishQuestionsWithDefinitions(
              mapped,
              typeDefinitions,
            );
            if (msg) {
              toast.error("Check your questions", { description: msg });
              return;
            }
            nextStep();
          }}
          disabled={definitionsLoading || !!definitionsError || typeDefinitions.length === 0}
          className="h-10 rounded-[6px] bg-brand-500 px-8 font-bold disabled:opacity-50"
        >
          Next: Review <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
