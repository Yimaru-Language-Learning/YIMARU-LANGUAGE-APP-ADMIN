import { getApiErrorMessage, notifyApiError } from "../../lib/apiErrors"
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageBackLink } from "../../components/navigation/PageBackLink";
import { navigateBack } from "../../lib/navigateBack";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import successIcon from "../../assets/success.svg";
import type { PracticeParentKind } from "../../types/course.types";
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types";
import { getQuestionTypeDefinitions } from "../../api/questionTypeDefinitions.api";
import { emptyDynamicFieldValuesForDefinition } from "../../lib/learnEnglishDefinitionQuestion";
import {
  validateLearnEnglishQuestionsWithDefinitions,
} from "../../lib/learnEnglishPracticePublish";
import { executePracticeCreation } from "../../lib/practiceCreationOrchestrator";
import { syncStimulusBlocksAfterCreate } from "../../lib/practiceEditOrchestrator";
import {
  isIeltsSharedStimulusMode,
  validatePracticeStimulusBlocks,
} from "../../lib/practiceStimulusBlocks";
import {
  buildCreatePracticeParentsPayload,
  dedupeParents,
  formatPracticeParentsSummary,
  validatePracticeParents,
} from "../../lib/practiceParents";

import { ContextStep } from "./components/practice-steps/ContextStep";
import { ScenarioStep } from "./components/practice-steps/ScenarioStep";
import { PersonaStep } from "./components/practice-steps/PersonaStep";
import { QuestionsStep } from "./components/practice-steps/QuestionsStep";
import { ReviewStep } from "./components/practice-steps/ReviewStep";
import {
  personaFromId,
  personaIdNumber,
} from "./components/practice-steps/constants";
import { useActivePersonas } from "../../hooks/useActivePersonas";

const STEP_LABELS = ["Practice", "Persona", "Questions", "Review"] as const;

export function AddPracticeFlow() {
  const navigate = useNavigate();
  const {
    level,
    programType,
    courseId: routeCourseId,
    unitId: routeUnitId,
    moduleId: routeModuleId,
    definitionId: routeDefinitionId,
  } = useParams<{
    level?: string;
    programType?: string;
    courseId?: string;
    unitId?: string;
    moduleId?: string;
    definitionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const backToParam = searchParams.get("backTo");
  const lessonId = searchParams.get("lessonId");
  const lessonTitleRaw = searchParams.get("lessonTitle");

  const seedDefinitionId = routeDefinitionId ? Number(routeDefinitionId) : NaN;
  const isFromQuestionType =
    Number.isFinite(seedDefinitionId) && seedDefinitionId > 0;

  const isExamPrep = Boolean(programType?.trim()) && !isFromQuestionType;

  const effectiveBackTo = useMemo(() => {
    if (backToParam?.trim()) return backToParam.trim();
    if (isExamPrep && routeModuleId) return "module";
    if (isExamPrep && routeUnitId && !routeModuleId) return "unit";
    if (isExamPrep && routeCourseId) return "courses";
    return null;
  }, [backToParam, isExamPrep, routeModuleId, routeUnitId, routeCourseId]);

  const courseId = isExamPrep
    ? routeCourseId ?? searchParams.get("courseId")
    : searchParams.get("courseId");
  const moduleId = isExamPrep
    ? routeModuleId ?? searchParams.get("moduleId")
    : searchParams.get("moduleId");
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
    effectiveBackTo === "modules" || effectiveBackTo === "courses";
  const isLessonPractice = useMemo(() => {
    const lid = lessonId ? Number(lessonId) : NaN;
    return Number.isFinite(lid) && lid > 0;
  }, [lessonId]);
  /** Learn English lesson practices skip story fields; exam prep lessons use the full form. */
  const isLearnEnglishLessonPractice = isLessonPractice && !isExamPrep;

  const parentContext = useMemo((): {
    kind: PracticeParentKind;
    id: number;
  } | null => {
    const lid = lessonId ? Number(lessonId) : NaN;
    if (Number.isFinite(lid) && lid > 0) return { kind: "LESSON", id: lid };
    const mid = moduleId ? Number(moduleId) : NaN;
    if (isModuleContext && !isExamPrep && Number.isFinite(mid) && mid > 0)
      return { kind: "MODULE", id: mid };
    const uid = unitId ? Number(unitId) : NaN;
    if (isUnitContext && isExamPrep && Number.isFinite(uid) && uid > 0)
      return { kind: "UNIT", id: uid };
    const cid = courseId ? Number(courseId) : NaN;
    if (isCourseContext && Number.isFinite(cid) && cid > 0) {
      return { kind: isExamPrep ? "CATALOG_COURSE" : "COURSE", id: cid };
    }
    return null;
  }, [lessonId, moduleId, unitId, courseId, isModuleContext, isUnitContext, isCourseContext, isExamPrep]);

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
      : "Duolingo/IELTS"
    : level
      ? `Program ${level}`
      : null;

  const backLabel = isFromQuestionType
    ? "Back to Question Types"
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
    if (isFromQuestionType) return "/new-content/question-types";
    if (isExamPrep) {
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
      if (programType) {
        return `/new-content/courses/${programType}`;
      }
      return "/new-content";
    }
    if (effectiveBackTo === "module" && level && courseId && moduleId) {
      return `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`;
    }
    if (effectiveBackTo === "modules" && level && courseId) {
      return `/new-content/learn-english/${level}/courses/${courseId}`;
    }
    return `/new-content/learn-english/${level}/courses`;
  }, [
    isExamPrep,
    effectiveBackTo,
    programType,
    courseId,
    unitId,
    moduleId,
    level,
    isFromQuestionType,
  ]);

  const goBack = () => navigateBack(navigate, backPath);

  const [currentStep, setCurrentStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
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
    authoringProfile: "STANDALONE" as const,
    stimulusBlocks: [] as import("../../lib/practiceStimulusBlocks").PracticeFormStimulusBlock[],
    parents: [] as { parent_kind: PracticeParentKind; parent_id: number }[],
    questions: [
      {
        id: "q1",
        displayOrder: 1,
        serverQuestionId: null as number | null,
        associatedQuestionId: null as number | null,
        associatedAnchorRowId: null as string | null,
        prerequisiteQuestionIds: [] as number[],
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
    if (typeDefinitions.length === 0) return;
    setFormData((fd) => ({
      ...fd,
      questions: fd.questions.map((q) => {
        if (q.questionTypeDefinitionId != null) return q;
        const def = isFromQuestionType
          ? typeDefinitions.find((d) => d.id === seedDefinitionId) ?? typeDefinitions[0]
          : typeDefinitions[0];
        return {
          ...q,
          questionTypeDefinitionId: def.id,
          dynamicFieldValues: emptyDynamicFieldValuesForDefinition(def),
        };
      }),
    }));
  }, [typeDefinitions, isFromQuestionType, seedDefinitionId]);

  useEffect(() => {
    if (!isFromQuestionType || typeDefinitions.length === 0) return;
    const def = typeDefinitions.find((d) => d.id === seedDefinitionId);
    if (!def) return;
    setFormData((fd) => ({
      ...fd,
      questions: fd.questions.map((q, index) =>
        index === 0
          ? {
              ...q,
              questionTypeDefinitionId: def.id,
              dynamicFieldValues: emptyDynamicFieldValuesForDefinition(def),
            }
          : q,
      ),
    }));
  }, [isFromQuestionType, seedDefinitionId, typeDefinitions]);

  useEffect(() => {
    if (!parentContext || isExamPrep) return;
    setFormData((fd) => {
      const seeded = dedupeParents([
        { parent_kind: parentContext.kind, parent_id: parentContext.id },
        ...(fd.parents ?? []),
      ]);
      return { ...fd, parents: seeded };
    });
  }, [parentContext, isExamPrep]);

  const submitPractice = async (status: "DRAFT" | "PUBLISHED") => {
    if (!parentContext && !isExamPrep && !isFromQuestionType) {
      toast.error("Missing practice parent", {
        description:
          "Open this screen from a course, module, or lesson so the API receives at least one parent location.",
      });
      return;
    }
    const parents = dedupeParents(
      isExamPrep && parentContext
        ? [{ parent_kind: parentContext.kind, parent_id: parentContext.id }]
        : formData.parents,
    );
    const parentsErr = validatePracticeParents(parents, {
      required: !isFromQuestionType && !isExamPrep,
    });
    if (parentsErr) {
      toast.error("Check practice locations", { description: parentsErr });
      return;
    }
    const createParents = buildCreatePracticeParentsPayload(parents);
    if (
      !isLearnEnglishLessonPractice &&
      (!formData.title.trim() || !formData.description.trim())
    ) {
      toast.error("Title and story description are required", {
        description: "Complete the first step before publishing.",
      });
      return;
    }
    if (!selectedPersona) {
      toast.error("Select a persona", {
        description: "Choose a character on the Persona step before publishing.",
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
    const persona = personaFromId(selectedPersona, personas);
    const mappedQuestions = formData.questions.map((q, index) => ({
        clientRowId: q.id,
        questionText: String(q.text ?? "").trim(),
        questionTypeDefinitionId: Number(q.questionTypeDefinitionId),
        difficultyLevel: (q.difficultyLevel ?? "EASY") as
          | "EASY"
          | "MEDIUM"
          | "HARD",
        points: Number.isFinite(Number(q.points)) ? Number(q.points) : 1,
        displayOrder:
          Number.isFinite(Number(q.displayOrder)) && Number(q.displayOrder) > 0
            ? Number(q.displayOrder)
            : index + 1,
        associatedQuestionId: q.associatedQuestionId ?? null,
        associatedAnchorRowId: q.associatedAnchorRowId ?? null,
        stimulusBlockKey: q.stimulusBlockKey ?? null,
        dynamicFieldValues: { ...(q.dynamicFieldValues ?? {}) },
        sourceDynamicPayload: q.sourceDynamicPayload ?? null,
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

    const useExamPrepLessonApi =
      isExamPrep &&
      isLessonPractice &&
      parentContext?.kind === "LESSON" &&
      parentContext != null &&
      Number.isFinite(parentContext.id);

    const useExamPrepCatalogCourseApi =
      isExamPrep &&
      isCourseContext &&
      !isLessonPractice &&
      parentContext?.kind === "CATALOG_COURSE" &&
      parentContext != null &&
      Number.isFinite(parentContext.id);

    const useExamPrepUnitApi =
      isExamPrep &&
      isUnitContext &&
      !isLessonPractice &&
      parentContext?.kind === "UNIT" &&
      parentContext != null &&
      Number.isFinite(parentContext.id);

    setSubmitting(true);
    try {
      const { practiceId } = await executePracticeCreation({
        parents: createParents,
        parentKind: parentContext?.kind,
        parentId: parentContext?.id,
        examPrepLessonId: useExamPrepLessonApi ? parentContext!.id : undefined,
        examPrepCatalogCourseId: useExamPrepCatalogCourseApi
          ? parentContext!.id
          : undefined,
        examPrepUnitId: useExamPrepUnitApi ? parentContext!.id : undefined,
        isExamPrep,
        status,
        questionSetTitle: isLearnEnglishLessonPractice
          ? lessonDefaultTitle
          : formData.title.trim() || "Practice set",
        questionSetDescription: isLearnEnglishLessonPractice
          ? null
          : formData.description.trim() || null,
        shuffleQuestions: formData.shuffleQuestions,
        practiceTitle: isLearnEnglishLessonPractice
          ? lessonDefaultTitle
          : formData.title.trim() || "Untitled practice",
        storyDescription: isLearnEnglishLessonPractice
          ? ""
          : formData.description.trim(),
        storyImage: isLearnEnglishLessonPractice
          ? ""
          : formData.storyImageUrl.trim(),
        quickTips: formData.tips.trim(),
        personaName: persona?.name ?? null,
        personaId,
        questions: mappedQuestions,
        definitions: typeDefinitions,
      });
      if (isIeltsSharedStimulusMode(formData.authoringProfile)) {
        await syncStimulusBlocksAfterCreate({
          practiceId,
          isExamPrep,
          status,
          formData,
          personaId,
          preservedQuestionSet: {
            timeLimitMinutes: null,
            passingScore: null,
            introVideoUrl: "",
            status,
          },
          questions: mappedQuestions,
          definitions: typeDefinitions,
          isLearnEnglishLessonPractice,
          lessonDefaultTitle,
        });
      }
      toast.success("Practice created successfully");
      setIsPublished(true);
    } catch (e) {
      notifyApiError(e, "Could not save practice");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, STEP_LABELS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (isPublished) {
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
          Practice Published Successfully!
        </h1>
        <p className="text-grayScale-600 text-md mb-14 max-w-lg font-medium leading-relaxed">
          {isFromQuestionType
            ? dedupeParents(formData.parents).length > 0
              ? "Your practice is saved with the selected locations. You can edit questions or attach more locations anytime."
              : "Your practice is saved as a draft shell. Attach it to courses, modules, or lessons when you are ready."
            : isExamPrep
              ? parentContext
                ? "Your speaking practice is saved for the linked catalog course, unit, or lesson."
                : "Your practice is saved as a draft shell. Attach it to catalog courses, units, or lessons when you are ready."
              : lessonId
              ? "Your speaking practice is saved and linked to this lesson’s question set."
              : "Your speaking practice is saved for the linked course or module."}
        </p>
        <div className="flex flex-col gap-4 w-full max-w-[400px]">
          <Button
            onClick={goBack}
            className="h-14 rounded-[6px] bg-[#9E2891] font-bold shadow-xl shadow-brand-500/20 text-[16px] text-white "
          >
            {backLabel}
          </Button>
          <Button
            onClick={() => {
              setIsPublished(false);
              setCurrentStep(1);
              setSelectedPersona(null);
              setFormData({
                title: "",
                description: "",
                storyImageUrl: "",
                shuffleQuestions: false,
                tips: "",
                authoringProfile: "STANDALONE",
                stimulusBlocks: [],
                parents: [],
                questions: [
                  {
                    id: "q1",
                    displayOrder: 1,
                    serverQuestionId: null as number | null,
                    associatedQuestionId: null as number | null,
                    associatedAnchorRowId: null as string | null,
                    prerequisiteQuestionIds: [] as number[],
                    stimulusBlockKey: null as string | null,
                    questionTypeDefinitionId:
                      typeDefinitions[0]?.id ?? (null as number | null),
                    text: "",
                    difficultyLevel: "EASY" as "EASY" | "MEDIUM" | "HARD",
                    points: 1,
                    dynamicFieldValues: typeDefinitions[0]
                      ? emptyDynamicFieldValuesForDefinition(typeDefinitions[0])
                      : {},
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
            }}
            variant="outline"
            className="h-14 rounded-[6px] border-[#9E2891] text-[#9E2891] font-semibold text-[16px] bg-white "
          >
            Add Another Practice
          </Button>
        </div>
      </div>
    );
  }

  const useLearnEnglishContextStep =
    (Boolean(parentContext) && !isExamPrep) || isFromQuestionType;

  const reviewParentSummary =
    formData.parents.length > 0
      ? formatPracticeParentsSummary(formData.parents)
      : isFromQuestionType
        ? formatPracticeParentsSummary([])
        : parentSummary;

  const seededQuestionType = typeDefinitions.find((d) => d.id === seedDefinitionId);

  const renderStep = () => {
    if (useLearnEnglishContextStep) {
      switch (currentStep) {
        case 1:
          return (
            <ContextStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              onCancel={goBack}
              isLessonPractice={isLearnEnglishLessonPractice}
              lessonTitle={lessonTitleDisplay}
              parentSummary={parentSummary}
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
              canPublish={
                isFromQuestionType ||
                formData.parents.length > 0 ||
                parentContext !== null
              }
              allowUnlinkedParents={isFromQuestionType}
              submitting={submitting}
              onSaveDraft={() => void submitPractice("DRAFT")}
              onPublish={() => void submitPractice("PUBLISHED")}
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
            parentSummary={parentSummary ?? (isExamPrep ? formatPracticeParentsSummary([], { isExamPrep: true }) : null)}
            typeDefinitions={typeDefinitions}
            canPublish={isExamPrep || parentContext !== null}
            submitting={submitting}
            onSaveDraft={() => void submitPractice("DRAFT")}
            onPublish={() => void submitPractice("PUBLISHED")}
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

        <div className=" mb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[#0F172A]">
              {isFromQuestionType ? "Create Practice from Question Type" : "Add New Practice"}
            </h1>
            <Button
              variant="outline"
              className="rounded-[8px] border-grayScale-200 text-grayScale-600 h-10 px-6 font-bold bg-white hover:bg-grayScale-50"
              onClick={goBack}
            >
              Cancel
            </Button>
          </div>
          <p className="text-grayScale-400 text-base">
            {isFromQuestionType
              ? `Build a practice using ${seededQuestionType?.display_name ?? "the selected question type"}. Locations are optional — attach courses, modules, or lessons later.`
              : "Create a practice with story details, a persona, and questions from your question type library."}
          </p>
          {isFromQuestionType && seededQuestionType ? (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
              <p className="font-semibold text-violet-900">Question type</p>
              <p className="mt-1 text-violet-800/90">
                <span className="font-medium">{seededQuestionType.display_name}</span>
                <span className="mx-1.5 text-violet-400">·</span>
                <span className="font-mono text-xs">#{seededQuestionType.id}</span>
              </p>
            </div>
          ) : null}
          {isExamPrep && !parentContext && !lessonId ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold text-amber-900">No placement yet</p>
              <p className="mt-1 text-amber-900/90">
                This practice will be created without catalog course, unit, or lesson links. Attach
                locations later from the attach-practice flow or practice editor.
              </p>
            </div>
          ) : null}
          {lessonId ? (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
              <p className="font-semibold text-violet-900">Lesson practice</p>
              <p className="mt-1 text-violet-800/90">
                Linked to lesson{" "}
                <span className="font-mono font-bold text-violet-950">
                  #{lessonId}
                </span>
                {lessonTitleDisplay ? (
                  <>
                    {" "}
                    — <span className="font-medium">{lessonTitleDisplay}</span>
                  </>
                ) : null}
                .
              </p>
            </div>
          ) : null}
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
