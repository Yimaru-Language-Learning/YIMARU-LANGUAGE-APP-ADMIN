import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  Plus,
  ArrowRight,
  GripVertical,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
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
import {
  fixAssociationsAfterReorder,
  findLastSectionAnchor,
  sectionBadgeLabel,
  setQuestionSectionAnchorRef,
  validateQuestionAssociations,
} from "../../../../lib/questionAssociations";
import { cn } from "../../../../lib/utils";
import { toast } from "sonner";
import { QuestionAssociationField } from "./QuestionAssociationField";
import { StimulusBlocksPanel } from "./StimulusBlocksPanel";
import {
  isIeltsSharedStimulusMode,
  validatePracticeStimulusBlocks,
} from "../../../../lib/practiceStimulusBlocks";

function syncQuestionDisplayOrders<T extends { displayOrder?: number }>(
  questions: T[],
): T[] {
  return fixAssociationsAfterReorder(
    questions.map((q, index) => ({ ...q, displayOrder: index + 1 })),
  );
}

function truncateText(value: string, max = 100): string {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function questionSummaryPreview(
  q: {
    text?: string;
    dynamicFieldValues?: Record<string, string>;
    questionTypeDefinitionId?: number | null;
    difficultyLevel?: string;
    points?: number;
  },
  def: QuestionTypeDefinition | undefined,
): string {
  const text = String(q.text ?? "").trim();
  if (text) return truncateText(text);

  const values = Object.values(q.dynamicFieldValues ?? {})
    .map((v) => String(v ?? "").trim())
    .filter((v) => v && !v.startsWith("{") && !v.startsWith("["));
  if (values[0]) return truncateText(values[0]);

  if (def) return questionTypeDefinitionListLabel(def);
  return "No content yet";
}

function QuestionCollapsibleBody({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-in-out",
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "border-t border-grayScale-50 transition-opacity duration-300",
            expanded ? "opacity-100" : "opacity-0",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface SortableQuestionCardProps {
  id: string;
  children: (opts: {
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
    isDragging: boolean;
  }) => React.ReactNode;
}

function SortableQuestionCard({ id, children }: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "relative z-50 opacity-60")}
    >
      {children({
        isDragging,
        dragHandleProps: {
          ...attributes,
          ...listeners,
          type: "button",
        },
      })}
    </div>
  );
}

function defaultMcqOptions() {
  return [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ];
}

function createEmptyQuestionRow(id: string, displayOrder = 1, inheritAnchor?: {
  associatedQuestionId: number | null
  associatedAnchorRowId: string | null
}) {
  return {
    id,
    displayOrder,
    serverQuestionId: null as number | null,
    associatedQuestionId: inheritAnchor?.associatedQuestionId ?? null,
    associatedAnchorRowId: inheritAnchor?.associatedAnchorRowId ?? null,
    prerequisiteQuestionIds: [] as number[],
    stimulusBlockKey: null as string | null,
    questionTypeDefinitionId: null as number | null,
    text: "",
    difficultyLevel: "EASY" as "EASY" | "MEDIUM" | "HARD",
    points: 1,
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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(
    () => new Set(formData.questions[0]?.id ? [formData.questions[0].id] : []),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const questionIds = formData.questions.map((q: { id: string }) => q.id);
  const canReorder = formData.questions.length > 1;
  const activeDragIndex = activeDragId
    ? formData.questions.findIndex((q: { id: string }) => q.id === activeDragId)
    : -1;

  const reorderQuestions = (activeId: string, overId: string) => {
    const oldIndex = formData.questions.findIndex(
      (q: { id: string }) => q.id === activeId,
    );
    const newIndex = formData.questions.findIndex(
      (q: { id: string }) => q.id === overId,
    );
    if (oldIndex === -1 || newIndex === -1) return;
    setFormData({
      ...formData,
      questions: syncQuestionDisplayOrders(
        arrayMove(formData.questions, oldIndex, newIndex),
      ),
    });
  };

  const toggleQuestionExpanded = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAllQuestions = () => setExpandedQuestionIds(new Set());

  const expandAllQuestions = () =>
    setExpandedQuestionIds(new Set(questionIds));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    collapseAllQuestions();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderQuestions(String(active.id), String(over.id));
    }
    setActiveDragId(null);
  };

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

  const addQuestion = (startNewSection = false) => {
    const id = `q${Date.now()}`;
    const lastAnchor = startNewSection ? undefined : findLastSectionAnchor(formData.questions);
    const inheritAnchor = lastAnchor
      ? (() => {
          const linked = setQuestionSectionAnchorRef(
            { id, associatedQuestionId: null, associatedAnchorRowId: null },
            lastAnchor,
          );
          return {
            associatedQuestionId: linked.associatedQuestionId ?? null,
            associatedAnchorRowId: linked.associatedAnchorRowId ?? null,
          };
        })()
      : undefined;
    const row = createEmptyQuestionRow(id, formData.questions.length + 1, inheritAnchor);
    if (typeDefinitions[0]) {
      row.questionTypeDefinitionId = typeDefinitions[0].id;
      row.dynamicFieldValues = emptyDynamicFieldValuesForDefinition(
        typeDefinitions[0],
      );
    }
    setFormData({
      ...formData,
      questions: syncQuestionDisplayOrders([...formData.questions, row]),
    });
    setExpandedQuestionIds(new Set([id]));
  };

  const renderTypeSpecificFields = (
    q: any,
    i: number,
    def: QuestionTypeDefinition,
  ) => {
    if (definitionUsesDynamicPayload(def)) {
      return (
        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/40 p-3">
          <p className="text-xs leading-snug text-grayScale-600">
            {q.stimulusBlockKey ? (
              <>
                This question also receives the shared stimulus from block{" "}
                <span className="font-medium text-grayScale-800">{q.stimulusBlockKey}</span>.
                Its own stimulus and response remain separate and are edited below.
              </>
            ) : (
              <>
                <span className="font-medium text-grayScale-800">Image, audio, and PDF</span> use upload or URL.{" "}
                <span className="font-medium text-grayScale-800">Table</span> uses the visual table builder. Timer and
                prep-time slots use seconds. Other slots use text or structured JSON where noted.
              </>
            )}
          </p>
          {def.stimulus_schema.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">
                Question stimulus
              </p>
              {def.stimulus_schema.map((row) => (
                <div
                  key={`stimulus-${row.id}`}
                  className="rounded-lg border border-grayScale-200 bg-white p-2.5"
                >
                  <DynamicSchemaSlotField
                    row={row}
                    side="stimulus"
                    value={q.dynamicFieldValues?.[`stimulus:${row.id}`] ?? ""}
                    onChange={(next) =>
                      setDynamicValue(i, `stimulus:${row.id}`, next)
                    }
                    allFieldValues={q.dynamicFieldValues}
                    stimulusSchema={def.stimulus_schema}
                    responseSchema={def.response_schema}
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
                    side="response"
                    value={q.dynamicFieldValues?.[`response:${row.id}`] ?? ""}
                    onChange={(next) =>
                      setDynamicValue(i, `response:${row.id}`, next)
                    }
                    allFieldValues={q.dynamicFieldValues}
                    stimulusSchema={def.stimulus_schema}
                    responseSchema={def.response_schema}
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

  const ieltsMode = isIeltsSharedStimulusMode(formData.authoringProfile);

  return (
    <div className="space-y-6">
      <div className="space-y-1 px-2">
        <h2 className="text-2xl font-bold text-grayScale-700">Questions</h2>
        <p className="text-grayScale-400 text-lg">
          {ieltsMode
            ? "Create shared stimulus blocks, link questions to a block, then fill in each question's own stimulus and response fields."
            : "Choose a question type for each item, then fill in the fields that type requires."}{" "}
          Group questions into sections so learners complete earlier blocks before later ones unlock.
          Collapse cards to compare and drag them into order.
        </p>
      </div>

      {ieltsMode ? (
        <div className="px-2">
          <StimulusBlocksPanel
            blocks={formData.stimulusBlocks ?? []}
            questions={formData.questions}
            onChange={(stimulusBlocks) => setFormData({ ...formData, stimulusBlocks })}
            onClearQuestionBlockKeys={(blockKey) => {
              setFormData({
                ...formData,
                questions: formData.questions.map((row: { stimulusBlockKey?: string | null }) =>
                  row.stimulusBlockKey?.trim() === blockKey.trim()
                    ? { ...row, stimulusBlockKey: null }
                    : row,
                ),
              });
            }}
          />
        </div>
      ) : null}

      {formData.questions.length > 1 ? (
        <div className="flex flex-wrap items-center justify-end gap-2 px-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg border-grayScale-200 text-grayScale-700"
            onClick={collapseAllQuestions}
          >
            <ChevronsDownUp className="h-4 w-4" />
            Collapse all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg border-grayScale-200 text-grayScale-700"
            onClick={expandAllQuestions}
          >
            <ChevronsUpDown className="h-4 w-4" />
            Expand all
          </Button>
        </div>
      ) : null}

      {definitionsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {definitionsError}
        </div>
      ) : null}

      {definitionsLoading ? (
        <p className="px-2 text-sm text-grayScale-500">Loading question types…</p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questionIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {formData.questions.map((q: any, i: number) => {
              const def = typeDefinitions.find(
                (d) => d.id === q.questionTypeDefinitionId,
              );
              const isExpanded = expandedQuestionIds.has(q.id);
              const summary = questionSummaryPreview(q, def);
              const typeLabel = def
                ? questionTypeDefinitionListLabel(def)
                : "No type selected";
              return (
                <SortableQuestionCard key={q.id} id={q.id}>
                  {({ dragHandleProps, isDragging }) => (
                    <Card
                      className={cn(
                        "relative overflow-hidden rounded-2xl border border-grayScale-50 bg-white shadow-soft transition-shadow duration-300",
                        isDragging && "shadow-lg ring-2 ring-brand-200",
                        !isExpanded && "hover:border-grayScale-200",
                      )}
                    >
                      <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-brand-500" />
                      <div className="pl-7">
                        <div
                          className={cn(
                            "flex items-start gap-2 px-4 py-3 sm:px-5",
                            isExpanded ? "pb-1" : "pb-3",
                          )}
                        >
                          {canReorder ? (
                            <button
                              {...dragHandleProps}
                              className="mt-0.5 shrink-0 cursor-grab touch-none rounded-lg p-1 text-grayScale-400 transition-colors hover:bg-grayScale-50 hover:text-grayScale-600 active:cursor-grabbing"
                              aria-label={`Drag to reorder question ${i + 1}`}
                            >
                              <GripVertical className="h-5 w-5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                            onClick={() => toggleQuestionExpanded(q.id)}
                            aria-expanded={isExpanded}
                          >
                            <ChevronDown
                              className={cn(
                                "mt-0.5 h-5 w-5 shrink-0 text-grayScale-400 transition-transform duration-300",
                                isExpanded && "rotate-180",
                              )}
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-base font-bold text-grayScale-700">
                                  Question {q.displayOrder ?? i + 1}
                                </span>
                                <span className="rounded-full bg-grayScale-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-grayScale-600">
                                  {q.difficultyLevel ?? "EASY"}
                                </span>
                                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                                  {sectionBadgeLabel(q, formData.questions)}
                                </span>
                                {q.stimulusBlockKey ? (
                                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800">
                                    {q.stimulusBlockKey}
                                  </span>
                                ) : null}
                                <span className="text-xs font-medium text-grayScale-500">
                                  {q.points ?? 1} pt{(q.points ?? 1) === 1 ? "" : "s"}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-brand-600">
                                {typeLabel}
                              </p>
                              <p
                                className={cn(
                                  "text-sm text-grayScale-500 transition-all duration-300",
                                  isExpanded
                                    ? "line-clamp-1 opacity-80"
                                    : "line-clamp-2",
                                )}
                              >
                                {summary}
                              </p>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="shrink-0 text-brand-500 hover:bg-brand-50 rounded-lg"
                            onClick={() => {
                              const newQuestions = formData.questions.filter(
                                (item: any) => item.id !== q.id,
                              );
                              setExpandedQuestionIds((prev) => {
                                const next = new Set(prev);
                                next.delete(q.id);
                                return next;
                              });
                              if (newQuestions.length > 0) {
                                setFormData({
                                  ...formData,
                                  questions: syncQuestionDisplayOrders(newQuestions),
                                });
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
                              setFormData({
                                ...formData,
                                questions: syncQuestionDisplayOrders([row]),
                              });
                              setExpandedQuestionIds(new Set(["q1"]));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <QuestionCollapsibleBody expanded={isExpanded}>
                          <div className="space-y-6 px-4 pb-6 pt-4 sm:px-5 sm:pb-7">
                <QuestionAssociationField
                  question={q}
                  allQuestions={formData.questions}
                  onChange={(patch) => {
                    const newQuestions = [...formData.questions];
                    newQuestions[i] = { ...newQuestions[i], ...patch };
                    setFormData({ ...formData, questions: newQuestions });
                  }}
                />

                {ieltsMode ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
                      Shared stimulus block
                    </label>
                    <select
                      className="h-11 w-full max-w-xl rounded-lg border border-grayScale-200 bg-white px-3 text-sm font-medium text-grayScale-800"
                      value={q.stimulusBlockKey ?? ""}
                      onChange={(e) => {
                        const newQuestions = [...formData.questions];
                        newQuestions[i] = {
                          ...newQuestions[i],
                          stimulusBlockKey: e.target.value ? e.target.value : null,
                        };
                        setFormData({ ...formData, questions: newQuestions });
                      }}
                    >
                      <option value="">None (standalone)</option>
                      {(formData.stimulusBlocks ?? [])
                        .slice()
                        .sort(
                          (a: { displayOrder?: number }, b: { displayOrder?: number }) =>
                            (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
                        )
                        .map((block: { blockKey: string }) => (
                          <option key={block.blockKey} value={block.blockKey}>
                            {block.blockKey}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
                      Difficulty
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-grayScale-200 bg-white px-3 text-sm font-medium text-grayScale-800"
                      value={q.difficultyLevel ?? "EASY"}
                      onChange={(e) => {
                        const newQuestions = [...formData.questions];
                        newQuestions[i] = {
                          ...newQuestions[i],
                          difficultyLevel: e.target.value as
                            | "EASY"
                            | "MEDIUM"
                            | "HARD",
                        };
                        setFormData({ ...formData, questions: newQuestions });
                      }}
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-grayScale-700">
                      Points
                    </label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={q.points ?? 1}
                      onChange={(e) => {
                        const newQuestions = [...formData.questions];
                        const parsed = Number.parseInt(e.target.value, 10);
                        newQuestions[i] = {
                          ...newQuestions[i],
                          points:
                            Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                        };
                        setFormData({ ...formData, questions: newQuestions });
                      }}
                      className="h-11 rounded-lg border-grayScale-200"
                    />
                  </div>
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
                        </QuestionCollapsibleBody>
                      </div>
                    </Card>
                  )}
                </SortableQuestionCard>
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDragId && activeDragIndex >= 0 ? (
            <Card className="relative w-[min(100vw-2rem,42rem)] overflow-hidden rounded-2xl border border-brand-300 bg-white py-3 pl-7 pr-4 shadow-xl">
              <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-brand-500" />
              {(() => {
                const dragged = formData.questions[activeDragIndex];
                const draggedDef = typeDefinitions.find(
                  (d) => d.id === dragged?.questionTypeDefinitionId,
                );
                return (
                  <div className="flex items-start gap-2 pl-4">
                    <GripVertical className="mt-0.5 h-5 w-5 shrink-0 text-grayScale-400" />
                    <div className="min-w-0 space-y-1">
                      <p className="text-base font-bold text-grayScale-700">
                        Question{" "}
                        {dragged?.displayOrder ?? activeDragIndex + 1}
                      </p>
                      <p className="text-xs font-medium text-brand-600">
                        {draggedDef
                          ? questionTypeDefinitionListLabel(draggedDef)
                          : "No type selected"}
                      </p>
                      <p className="line-clamp-2 text-sm text-grayScale-500">
                        {questionSummaryPreview(dragged, draggedDef)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex flex-wrap items-center gap-6 pt-4">
        <button
          type="button"
          onClick={() => addQuestion(false)}
          disabled={definitionsLoading || typeDefinitions.length === 0}
          className="flex items-center gap-3 text-base font-bold text-brand-500 transition-all hover:opacity-80 disabled:opacity-40"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-500">
            <Plus className="h-3 w-3 stroke-[4]" />
          </div>
          Add question
        </button>
        <button
          type="button"
          onClick={() => addQuestion(true)}
          disabled={definitionsLoading || typeDefinitions.length === 0}
          className="flex items-center gap-3 text-base font-bold text-sky-700 transition-all hover:opacity-80 disabled:opacity-40"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-sky-600">
            <Plus className="h-3 w-3 stroke-[4]" />
          </div>
          Start new section
        </button>
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
              clientRowId: row.id,
              questionText: String(row.text ?? "").trim(),
              questionTypeDefinitionId: Number(row.questionTypeDefinitionId),
              dynamicFieldValues: { ...(row.dynamicFieldValues ?? {}) },
              sourceDynamicPayload: row.sourceDynamicPayload ?? null,
              displayOrder: row.displayOrder,
              associatedQuestionId: row.associatedQuestionId ?? null,
              associatedAnchorRowId: row.associatedAnchorRowId ?? null,
              stimulusBlockKey: row.stimulusBlockKey ?? null,
              mcqOptions: (row.mcqOptions ?? []).map(
                (o: { text?: string; isCorrect?: boolean }) => ({
                  option_text: String(o.text ?? ""),
                  is_correct: Boolean(o.isCorrect),
                }),
              ),
              trueFalseAnswerIsTrue: row.trueFalseCorrect !== false,
              shortAnswers: (row.shortAnswers ?? []).map((s: string) => String(s)),
            }));
            const associationErr = validateQuestionAssociations(
              formData.questions.map((row: typeof formData.questions[0]) => ({
                id: row.id,
                serverQuestionId: row.serverQuestionId ?? null,
                displayOrder: row.displayOrder,
                associatedQuestionId: row.associatedQuestionId ?? null,
                associatedAnchorRowId: row.associatedAnchorRowId ?? null,
              })),
            );
            if (associationErr) {
              toast.error("Check question sections", { description: associationErr });
              return;
            }
            const blockErr = isIeltsSharedStimulusMode(formData.authoringProfile)
              ? validatePracticeStimulusBlocks(
                  formData.authoringProfile ?? "STANDALONE",
                  formData.stimulusBlocks ?? [],
                  mapped,
                  typeDefinitions,
                )
              : null;
            if (blockErr) {
              toast.error("Check stimulus blocks", { description: blockErr });
              return;
            }
            const msg = isIeltsSharedStimulusMode(formData.authoringProfile)
              ? null
              : validateLearnEnglishQuestionsWithDefinitions(mapped, typeDefinitions);
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
