import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import successIcon from "../../assets/success.svg";
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types";
import {
  getExamPrepPracticeFull,
  getLearnEnglishPracticeFull,
} from "../../api/courses.api";
import { getQuestionTypeDefinitions } from "../../api/questionTypeDefinitions.api";
import {
  learnEnglishPracticeApiErrorMessage,
  validateLearnEnglishQuestionsWithDefinitions,
} from "../../lib/learnEnglishPracticePublish";
import { executePracticeUpdate } from "../../lib/practiceEditOrchestrator";
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

  const isExamPrep = Boolean(programType?.trim());
  const lessonId = routeLessonId ?? searchParams.get("lessonId");

  const effectiveBackTo = useMemo(() => {
    if (backToParam?.trim()) return backToParam.trim();
    if (routeLessonId) return "lesson";
    if (isExamPrep && routeModuleId) return "module";
    if (isExamPrep && routeCourseId) return "courses";
    if (routeModuleId) return "module";
    if (routeCourseId) return "courses";
    return null;
  }, [
    backToParam,
    routeLessonId,
    isExamPrep,
    routeModuleId,
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
  const isCourseContext =
    effectiveBackTo === "courses" || effectiveBackTo === "modules";
  const isLessonContext = effectiveBackTo === "lesson" || Boolean(routeLessonId);
  const isLessonPractice = useMemo(() => {
    const lid = lessonId ? Number(lessonId) : NaN;
    return Number.isFinite(lid) && lid > 0;
  }, [lessonId]);
  const isLearnEnglishLessonPractice = isLessonPractice && !isExamPrep;

  const parentSummary = useMemo(() => {
    if (lessonId)
      return `Lesson #${lessonId}${lessonTitleDisplay ? ` — ${lessonTitleDisplay}` : ""}`;
    if (isModuleContext && moduleId) return `Module #${moduleId}`;
    if (isCourseContext && courseId) return `Course #${courseId}`;
    return null;
  }, [
    lessonId,
    lessonTitleDisplay,
    isModuleContext,
    isCourseContext,
    moduleId,
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
    effectiveBackTo === "lesson"
      ? "Back to lesson practices"
      : effectiveBackTo === "module"
        ? "Back to Module"
        : effectiveBackTo === "modules"
          ? "Back to Modules"
          : effectiveBackTo === "courses"
            ? "Back to Course"
            : isExamPrep
              ? "Back to Program"
              : "Back to Courses";

  const backPath = useMemo(() => {
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

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
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
  } = useActivePersonas();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    storyImageUrl: "",
    shuffleQuestions: false,
    tips: "",
    parents: [] as PracticeParent[],
    questions: [
      {
        id: "q1",
        displayOrder: 1,
        serverQuestionId: null as number | null,
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
          setDefinitionsError(learnEnglishPracticeApiErrorMessage(e));
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
        setFormData(mapped.formData);
        setPreservedQuestionSet(mapped.preservedQuestionSet);
        initialParentsRef.current = mapped.parents;
        if (mapped.personaId != null) {
          setSelectedPersona(String(mapped.personaId));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(learnEnglishPracticeApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoadingPractice(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [validPracticeId, practiceId, isExamPrep, typeDefinitions, definitionsLoading]);

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

    const validationMsg = validateLearnEnglishQuestionsWithDefinitions(
      mappedQuestions,
      typeDefinitions,
    );
    if (validationMsg) {
      toast.error("Check your questions", { description: validationMsg });
      return;
    }

    const lessonDefaultTitle =
      lessonTitleDisplay?.trim() ||
      (lessonId ? `Lesson ${lessonId} practice` : "Lesson practice");

    if (!isExamPrep) {
      const parentsErr = validatePracticeParents(formData.parents);
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
        parentsChanged:
          !isExamPrep &&
          !practiceParentsEqual(formData.parents, initialParentsRef.current),
      });
      toast.success(
        status === "PUBLISHED" ? "Practice updated and published" : "Practice saved as draft",
      );
      if (!isExamPrep) {
        initialParentsRef.current = dedupeParents(formData.parents);
      }
      setIsSaved(true);
    } catch (e) {
      toast.error("Could not update practice", {
        description: learnEnglishPracticeApiErrorMessage(e),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, STEP_LABELS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (!validPracticeId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-grayScale-800">Invalid practice link</p>
        <Button className="mt-6" variant="outline" onClick={() => navigate(-1)}>
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
          <Button variant="outline" onClick={() => navigate(backPath)}>
            {backLabel}
          </Button>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20 animate-in fade-in zoom-in duration-500">
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full" />
          <img
            src={successIcon}
            alt="Success"
            className="h-[128px] w-[128px] relative"
          />
        </div>
        <h1 className="text-[28px] font-bold text-grayScale-900 mb-2">
          Practice Updated Successfully!
        </h1>
        <p className="text-grayScale-600 text-md mb-14 max-w-lg font-medium leading-relaxed">
          Your changes to this practice have been saved.
        </p>
        <Button
          onClick={() => navigate(backPath)}
          className="h-14 rounded-[6px] bg-[#9E2891] font-bold shadow-xl shadow-brand-500/20 text-[16px] text-white w-full max-w-[400px]"
        >
          {backLabel}
        </Button>
      </div>
    );
  }

  const reviewParentSummary =
    formData.parents.length > 0
      ? formatPracticeParentsSummary(formData.parents)
      : parentSummary;

  const renderStep = () => {
    const useContextStep =
      isModuleContext || isCourseContext || isLessonContext;

    if (useContextStep) {
      switch (currentStep) {
        case 1:
          return (
            <ContextStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              onCancel={() => navigate(backPath)}
              isLessonPractice={isLearnEnglishLessonPractice}
              lessonTitle={lessonTitleDisplay}
              parentSummary={reviewParentSummary}
              showParentsEditor={!isExamPrep}
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
          <Link
            to={backPath}
            className="flex items-center gap-2 text-[15px] font-medium text-grayScale-600 transition-colors hover:text-brand-500 decoration-none"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[#0F172A]">Edit Practice</h1>
            <Button
              variant="outline"
              className="rounded-[8px] border-grayScale-200 text-grayScale-600 h-10 px-6 font-bold bg-white hover:bg-grayScale-50"
              onClick={() => navigate(backPath)}
            >
              Cancel
            </Button>
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
