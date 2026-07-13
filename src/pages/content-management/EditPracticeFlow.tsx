import { getApiErrorMessage, notifyApiError } from "../../lib/apiErrors"
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageBackLink } from "../../components/navigation/PageBackLink";
import { navigateBack } from "../../lib/navigateBack";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types";
import {
  getExamPrepPracticeFull,
  getLearnEnglishPracticeFull,
} from "../../api/courses.api";
import { getQuestionTypeDefinitions } from "../../api/questionTypeDefinitions.api";
import {
  validateLearnEnglishQuestionsWithDefinitions,
} from "../../lib/learnEnglishPracticePublish";
import { executePracticeUpdate } from "../../lib/practiceEditOrchestrator";
import {
  isIeltsSharedStimulusMode,
  validatePracticeStimulusBlocks,
} from "../../lib/practiceStimulusBlocks";
import {
  dedupeParents,
  formatPracticeParentsSummary,
  practiceParentsEqual,
  validatePracticeParents,
} from "../../lib/practiceParents";
import type { PracticeParent } from "../../types/course.types";
import {
  mapPracticeFullToFormState,
  unwrapPracticeFullData,
  type PreservedQuestionSetFields,
} from "../../lib/practiceFullMapper";
import {
  buildPracticeEditSnapshot,
  hasPracticeEditChanges,
} from "../../lib/practiceEditDirty";

import { ContextStep } from "./components/practice-steps/ContextStep";
import { ScenarioStep } from "./components/practice-steps/ScenarioStep";
import { PersonaStep } from "./components/practice-steps/PersonaStep";
import { QuestionsStep } from "./components/practice-steps/QuestionsStep";
import { ReviewStep } from "./components/practice-steps/ReviewStep";
import { personaIdNumber } from "./components/practice-steps/constants";
import { useActivePersonas } from "../../hooks/useActivePersonas";

const STEP_LABELS = ["Practice", "Persona", "Questions", "Review"] as const;

export function EditPracticeFlow() {
  const navigate = useNavigate();
  const {
    level,
    programType,
    courseId: routeCourseId,
    unitId: routeUnitId,
    moduleId: routeModuleId,
    lessonId: routeLessonId,
    practiceId: routePracticeId,
  } = useParams<{
    level?: string;
    programType?: string;
    courseId?: string;
    unitId?: string;
    moduleId?: string;
    lessonId?: string;
    practiceId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const backToParam = searchParams.get("backTo");
  const lessonTitleRaw = searchParams.get("lessonTitle");

  const practiceId = routePracticeId ? Number(routePracticeId) : NaN;
  const validPracticeId = Number.isFinite(practiceId) && practiceId > 0;

  const kindParam = (searchParams.get("kind") || "").trim().toUpperCase();
  /** Edit opened without a hierarchy URL (e.g. unlinked practice from question-type list). */
  const isStandalonePracticeEdit =
    !level?.trim() && !programType?.trim() && !routeCourseId?.trim();
  const isExamPrep =
    kindParam === "EXAM_PREP" ||
    (Boolean(programType?.trim()) && kindParam !== "LMS");
  const lessonId = routeLessonId ?? searchParams.get("lessonId");

  const effectiveBackTo = useMemo(() => {
    if (backToParam?.trim()) return backToParam.trim();
    if (isStandalonePracticeEdit) return "question-types";
    if (routeLessonId) return "lesson";
    if (isExamPrep && routeModuleId) return "module";
    if (isExamPrep && routeUnitId && !routeModuleId) return "unit";
    if (isExamPrep && routeCourseId) return "courses";
    if (routeModuleId) return "module";
    if (routeCourseId) return "courses";
    return null;
  }, [
    backToParam,
    isStandalonePracticeEdit,
    routeLessonId,
    isExamPrep,
    routeModuleId,
    routeUnitId,
    routeCourseId,
  ]);

  const courseId = isExamPrep
    ? routeCourseId ?? searchParams.get("courseId")
    : routeCourseId ?? searchParams.get("courseId");
  const moduleId = isExamPrep
    ? routeModuleId ?? searchParams.get("moduleId")
    : routeModuleId ?? searchParams.get("moduleId");
  const unitId = isExamPrep ? routeUnitId : null;

  const lessonTitleDisplay = (() => {
    const raw = lessonTitleRaw?.trim();
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  const isModuleContext = effectiveBackTo === "module";
  const isUnitContext = effectiveBackTo === "unit";
  const isCourseContext =
    effectiveBackTo === "courses" || effectiveBackTo === "modules";
  const isLessonContext = effectiveBackTo === "lesson" || Boolean(routeLessonId);
  /** Allow optional parents when editing an unlinked shell (or exam-prep). */
  const parentsOptional = isExamPrep || isStandalonePracticeEdit;
  const isLessonPractice = useMemo(() => {
    const lid = lessonId ? Number(lessonId) : NaN;
    return Number.isFinite(lid) && lid > 0;
  }, [lessonId]);
  const isLearnEnglishLessonPractice = isLessonPractice && !isExamPrep;

  const parentSummary = useMemo(() => {
    if (lessonId)
      return `Lesson #${lessonId}${lessonTitleDisplay ? ` — ${lessonTitleDisplay}` : ""}`;
    if (isModuleContext && moduleId) return `Module #${moduleId}`;
    if (isUnitContext && unitId) return `Unit #${unitId}`;
    if (isCourseContext && courseId) {
      return isExamPrep
        ? `Catalog course #${courseId}`
        : `Course #${courseId}`;
    }
    return null;
  }, [
    lessonId,
    lessonTitleDisplay,
    isModuleContext,
    isUnitContext,
    isCourseContext,
    moduleId,
    unitId,
    courseId,
  ]);

  const programLabel = isExamPrep
    ? programType === "skill"
      ? "Skill-Based Courses"
      : "English Proficiency Exams"
    : level
      ? `Program ${level}`
      : null;

  const backLabel =
    effectiveBackTo === "question-types"
      ? "Back to Question Types"
      : effectiveBackTo === "lesson"
      ? "Back to lesson practices"
      : effectiveBackTo === "module"
        ? "Back to Module"
        : effectiveBackTo === "unit"
          ? "Back to Unit"
          : effectiveBackTo === "modules"
          ? "Back to Modules"
          : effectiveBackTo === "courses"
            ? "Back to Course"
            : isExamPrep
              ? "Back to Program"
              : "Back to Courses";

  const backPath = useMemo(() => {
    if (effectiveBackTo === "question-types" || isStandalonePracticeEdit) {
      return "/new-content/question-types";
    }
    if (isExamPrep) {
      if (routeLessonId && programType && courseId && unitId && moduleId) {
        const title = lessonTitleRaw
          ? `?lessonTitle=${encodeURIComponent(lessonTitleRaw)}`
          : "";
        return `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}/lessons/${routeLessonId}/practices${title}`;
      }
      if (
        effectiveBackTo === "module" &&
        programType &&
        courseId &&
        unitId &&
        moduleId
      ) {
        return `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}`;
      }
      if (effectiveBackTo === "unit" && programType && courseId && unitId) {
        return `/new-content/courses/${programType}/${courseId}/${unitId}`;
      }
      if (effectiveBackTo === "courses" && programType && courseId) {
        return `/new-content/courses/${programType}/${courseId}`;
      }
      if (programType) return `/new-content/courses/${programType}`;
      return "/new-content";
    }
    if (routeLessonId && level && courseId && moduleId) {
      const title = lessonTitleRaw
        ? `?lessonTitle=${encodeURIComponent(lessonTitleRaw)}`
        : "";
      return `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/lessons/${routeLessonId}/practices${title}`;
    }
    if (effectiveBackTo === "module" && level && courseId && moduleId) {
      return `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`;
    }
    if (effectiveBackTo === "courses" && level && courseId) {
      return `/new-content/learn-english/${level}/courses/${courseId}`;
    }
    if (level) return `/new-content/learn-english/${level}/courses`;
    return "/new-content";
  }, [
    isStandalonePracticeEdit,
    isExamPrep,
    routeLessonId,
    programType,
    courseId,
    unitId,
    moduleId,
    lessonTitleRaw,
    effectiveBackTo,
    level,
  ]);

  const goBack = () => navigateBack(navigate, backPath);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [loadedPersonaId, setLoadedPersonaId] = useState<number | null>(null);
  const [preservedQuestionSet, setPreservedQuestionSet] =
    useState<PreservedQuestionSetFields>({
      timeLimitMinutes: null,
      passingScore: null,
      introVideoUrl: "",
      status: "PUBLISHED",
    });

  const {
    personas,
    loading: personasLoading,
    error: personasError,
    reload: reloadPersonas,
  } = useActivePersonas({ ensurePersonaId: loadedPersonaId });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    storyImageUrl: "",
    shuffleQuestions: false,
    tips: "",
    authoringProfile: "STANDALONE" as const,
    stimulusBlocks: [] as import("../../lib/practiceStimulusBlocks").PracticeFormStimulusBlock[],
    parents: [] as PracticeParent[],
    questions: [
      {
        id: "q1",
        displayOrder: 1,
        serverQuestionId: null as number | null,
        associatedQuestionId: null as number | null,
        associatedAnchorRowId: null as string | null,
        stimulusBlockKey: null as string | null,
        questionTypeDefinitionId: null as number | null,
        text: "",
        difficultyLevel: "EASY" as "EASY" | "MEDIUM" | "HARD",
        points: 1,
        dynamicFieldValues: {} as Record<string, string>,
        mcqOptions: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        trueFalseCorrect: true,
        shortAnswers: [""],
      },
    ],
  });

  const [typeDefinitions, setTypeDefinitions] = useState<QuestionTypeDefinition[]>(
    [],
  );
  const [definitionsLoading, setDefinitionsLoading] = useState(true);
  const [definitionsError, setDefinitionsError] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  const initialParentsRef = useRef<PracticeParent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDefinitionsLoading(true);
      setDefinitionsError(null);
      try {
        const { definitions: list } = await getQuestionTypeDefinitions({
          include_system: true,
          status: "ACTIVE",
        });
        if (!cancelled) setTypeDefinitions(list);
      } catch (e) {
        if (!cancelled) {
          setDefinitionsError(getApiErrorMessage(e, "Failed to load question type definitions"));
          setTypeDefinitions([]);
        }
      } finally {
        if (!cancelled) setDefinitionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!validPracticeId || definitionsLoading) return;
    let cancelled = false;
    (async () => {
      setLoadingPractice(true);
      setLoadError(null);
      try {
        const res = isExamPrep
          ? await getExamPrepPracticeFull(practiceId)
          : await getLearnEnglishPracticeFull(practiceId);
        const full = unwrapPracticeFullData(res);
        if (!full) throw new Error("Practice details were missing from the response.");
        const mapped = mapPracticeFullToFormState(full, typeDefinitions);
        if (cancelled) return;
        const loadedPersona =
          mapped.personaId != null ? String(mapped.personaId) : null;
        setFormData(mapped.formData);
        setPreservedQuestionSet(mapped.preservedQuestionSet);
        initialParentsRef.current = mapped.parents;
        setLoadedPersonaId(mapped.personaId);
        setSelectedPersona(loadedPersona);
        setInitialSnapshot(
          buildPracticeEditSnapshot({
            formData: mapped.formData,
            selectedPersona: loadedPersona,
            preservedQuestionSet: mapped.preservedQuestionSet,
          }),
        );
      } catch (e) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(e, "Failed to load practice"));
        }
      } finally {
        if (!cancelled) setLoadingPractice(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [validPracticeId, practiceId, isExamPrep, typeDefinitions, definitionsLoading]);

  useEffect(() => {
    if (loadedPersonaId == null || personasLoading) return;
    const idStr = String(loadedPersonaId);
    if (!personas.some((persona) => persona.id === idStr)) return;
    setSelectedPersona((current) => (current === idStr ? current : idStr));
  }, [loadedPersonaId, personas, personasLoading]);

  const hasUnsavedChanges = useMemo(
    () =>
      hasPracticeEditChanges(initialSnapshot, {
        formData,
        selectedPersona,
        preservedQuestionSet,
      }),
    [initialSnapshot, formData, selectedPersona, preservedQuestionSet],
  );

  const submitPractice = async (status: "DRAFT" | "PUBLISHED") => {
    if (!validPracticeId) {
      toast.error("Invalid practice", { description: "Missing practice id in the URL." });
      return;
    }
    if (
      !isLearnEnglishLessonPractice &&
      (!formData.title.trim() || !formData.description.trim())
    ) {
      toast.error("Title and story description are required", {
        description: "Complete the first step before saving.",
      });
      return;
    }
    if (!selectedPersona) {
      toast.error("Select a persona", {
        description: "Choose a character on the Persona step before saving.",
      });
      return;
    }
    const personaId = personaIdNumber(selectedPersona);
    if (!personaId) {
      toast.error("Invalid persona", {
        description: "Re-select a persona from the list and try again.",
      });
      return;
    }

    const mappedQuestions = formData.questions.map((q, index) => ({
      clientRowId: q.id,
      questionText: String(q.text ?? "").trim(),
      questionTypeDefinitionId: Number(q.questionTypeDefinitionId),
      difficultyLevel: (q.difficultyLevel ?? "EASY") as "EASY" | "MEDIUM" | "HARD",
      points: Number.isFinite(Number(q.points)) ? Number(q.points) : 1,
      displayOrder:
        Number.isFinite(Number(q.displayOrder)) && Number(q.displayOrder) > 0
          ? Number(q.displayOrder)
          : index + 1,
      serverQuestionId: q.serverQuestionId ?? null,
      associatedQuestionId: q.associatedQuestionId ?? null,
      associatedAnchorRowId: q.associatedAnchorRowId ?? null,
      stimulusBlockKey: q.stimulusBlockKey ?? null,
      dynamicFieldValues: { ...(q.dynamicFieldValues ?? {}) },
      mcqOptions: (q.mcqOptions ?? []).map(
        (o: { text?: string; isCorrect?: boolean }) => ({
          option_text: String(o.text ?? ""),
          is_correct: Boolean(o.isCorrect),
        }),
      ),
      trueFalseAnswerIsTrue: q.trueFalseCorrect !== false,
      shortAnswers: (q.shortAnswers ?? []).map((s: string) => String(s)),
    }));

    const validationMsg = isIeltsSharedStimulusMode(formData.authoringProfile)
      ? validatePracticeStimulusBlocks(
          formData.authoringProfile,
          formData.stimulusBlocks,
          mappedQuestions,
          typeDefinitions,
        )
      : validateLearnEnglishQuestionsWithDefinitions(mappedQuestions, typeDefinitions);
    if (validationMsg) {
      toast.error("Check your questions", { description: validationMsg });
      return;
    }

    const lessonDefaultTitle =
      lessonTitleDisplay?.trim() ||
      (lessonId ? `Lesson ${lessonId} practice` : "Lesson practice");

    if (!isExamPrep) {
      const parentsErr = validatePracticeParents(formData.parents, {
        required: !parentsOptional,
      });
      if (parentsErr) {
        toast.error("Check practice locations", { description: parentsErr });
        return;
      }
    } else {
      const parentsErr = validatePracticeParents(formData.parents, { required: false });
      if (parentsErr) {
        toast.error("Check practice locations", { description: parentsErr });
        return;
      }
    }

    setSubmitting(true);
    try {
      await executePracticeUpdate({
        practiceId,
        isExamPrep,
        status,
        formData,
        personaId,
        preservedQuestionSet: {
          ...preservedQuestionSet,
          status,
        },
        questions: mappedQuestions,
        definitions: typeDefinitions,
        isLearnEnglishLessonPractice,
        lessonDefaultTitle,
        parents: dedupeParents(formData.parents),
        parentsChanged: !practiceParentsEqual(
          formData.parents,
          initialParentsRef.current,
        ),
      });
      initialParentsRef.current = dedupeParents(formData.parents);
      setPreservedQuestionSet((prev) => ({ ...prev, status }));
      toast.success(
        status === "PUBLISHED" ? "Practice updated and published" : "Practice saved as draft",
      );
      navigate(backPath);
    } catch (e) {
      notifyApiError(e, "Could not update practice");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, STEP_LABELS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const saveStatus: "DRAFT" | "PUBLISHED" =
    preservedQuestionSet.status === "DRAFT" ? "DRAFT" : "PUBLISHED";

  const handleSaveChanges = () => void submitPractice(saveStatus);

  if (!validPracticeId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-grayScale-800">Invalid practice link</p>
        <Button className="mt-6" variant="outline" onClick={goBack}>
          Go back
        </Button>
      </div>
    );
  }

  if (loadingPractice || definitionsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm font-medium text-grayScale-600">Loading practice details…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-grayScale-800">Could not load practice</p>
        <p className="mt-2 max-w-md text-sm text-grayScale-600">{loadError}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => goBack()}>
            {backLabel}
          </Button>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  const reviewParentSummary =
    formData.parents.length > 0
      ? formatPracticeParentsSummary(formData.parents, { isExamPrep })
      : parentSummary;

  const renderStep = () => {
    const useContextStep =
      isModuleContext ||
      isCourseContext ||
      isLessonContext ||
      isUnitContext ||
      isStandalonePracticeEdit;

    if (useContextStep) {
      switch (currentStep) {
        case 1:
          return (
            <ContextStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              onCancel={() => goBack()}
              isLessonPractice={isLearnEnglishLessonPractice}
              lessonTitle={lessonTitleDisplay}
              parentSummary={reviewParentSummary}
              showParentsEditor={!isLearnEnglishLessonPractice}
              isExamPrepParents={isExamPrep}
              parentsOptional={parentsOptional}
              parentsCollapsedDefault={parentsOptional}
              practiceId={practiceId}
              onParentsUnlinked={(parents) => {
                setFormData((fd) => ({ ...fd, parents }));
                initialParentsRef.current = parents;
                setInitialSnapshot(
                  buildPracticeEditSnapshot({
                    formData: { ...formData, parents },
                    selectedPersona,
                    preservedQuestionSet,
                  }),
                );
              }}
            />
          );
        case 2:
          return (
            <PersonaStep
              personas={personas}
              loading={personasLoading}
              error={personasError}
              onRetry={() => void reloadPersonas()}
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          );
        case 3:
          return (
            <QuestionsStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep}
              typeDefinitions={typeDefinitions}
              definitionsLoading={definitionsLoading}
              definitionsError={definitionsError}
            />
          );
        case 4:
          return (
            <ReviewStep
              formData={formData}
              selectedPersona={selectedPersona}
              personas={personas}
              isLessonPractice={isLearnEnglishLessonPractice}
              lessonTitle={lessonTitleDisplay}
              programLabel={programLabel}
              courseLabel={courseId ? `Course ${courseId}` : null}
              moduleLabel={moduleId ? `Module ${moduleId}` : null}
              prevStep={prevStep}
              onEditContext={() => setCurrentStep(1)}
              onEditQuestions={() => setCurrentStep(3)}
              parentSummary={reviewParentSummary}
              typeDefinitions={typeDefinitions}
              canPublish
              allowUnlinkedParents={isStandalonePracticeEdit}
              submitting={submitting}
              onSaveDraft={() => void submitPractice("DRAFT")}
              onPublish={() => void submitPractice("PUBLISHED")}
              publishLabel="Publish Updates"
              publishingLabel="Publishing updates…"
            />
          );
        default:
          return null;
      }
    }

    switch (currentStep) {
      case 1:
        return (
          <ScenarioStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            cancelHref={backPath}
          />
        );
      case 2:
        return (
          <PersonaStep
            personas={personas}
            loading={personasLoading}
            error={personasError}
            onRetry={() => void reloadPersonas()}
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <QuestionsStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            typeDefinitions={typeDefinitions}
            definitionsLoading={definitionsLoading}
            definitionsError={definitionsError}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            selectedPersona={selectedPersona}
            personas={personas}
            isLessonPractice={isLearnEnglishLessonPractice}
            lessonTitle={lessonTitleDisplay}
            programLabel={programLabel}
            courseLabel={courseId ? `Course ${courseId}` : null}
            moduleLabel={moduleId ? `Module ${moduleId}` : null}
            prevStep={prevStep}
            onEditContext={() => setCurrentStep(1)}
            onEditQuestions={() => setCurrentStep(3)}
            parentSummary={parentSummary}
            typeDefinitions={typeDefinitions}
            canPublish
            allowUnlinkedParents={isStandalonePracticeEdit}
            submitting={submitting}
            onSaveDraft={() => void submitPractice("DRAFT")}
            onPublish={() => void submitPractice("PUBLISHED")}
            publishLabel="Publish Updates"
            publishingLabel="Publishing updates…"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 px-6 pb-16 pt-6">
      <div className="mx-auto max-w-7xl w-full">
        <div className="flex items-center justify-between mb-8">
          <PageBackLink fallbackTo={backPath} label={backLabel} />
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-[#0F172A]">Edit Practice</h1>
            <div className="flex shrink-0 items-center gap-3">
              <Button
                className="h-10 rounded-[8px] bg-brand-500 px-6 font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-50"
                disabled={submitting || !hasUnsavedChanges}
                onClick={handleSaveChanges}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-[8px] border-grayScale-200 bg-white px-6 font-bold text-grayScale-600 hover:bg-grayScale-50"
                disabled={submitting}
                onClick={() => goBack()}
              >
                Cancel
              </Button>
            </div>
          </div>
          <p className="text-grayScale-400 text-base">
            Update story details, persona, and questions for practice #{practiceId}.
          </p>
        </div>

        <div className="mx-auto w-[70%] mb-12">
          <Stepper steps={[...STEP_LABELS]} currentStep={currentStep} />
        </div>

        <div
          className={`mx-auto ${currentStep === 3 || currentStep === 4 ? "max-w-6xl" : "max-w-4xl"}`}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
