import { useMemo } from "react";
import type { QuestionTypeDefinition } from "../../../../types/questionTypeDefinition.types";
import { personaFromId } from "./constants";
import type { PersonaCardModel } from "../../../../lib/personaDisplay";
import { mapFormQuestionsForPracticeReview } from "./mapQuestionsForPracticeReview";
import {
  PracticeSequentialReview,
  type PracticeReviewMetadataItem,
} from "./PracticeSequentialReview";

interface ReviewStepProps {
  formData: {
    title?: string;
    description?: string;
    storyImageUrl?: string;
    tips?: string;
    shuffleQuestions?: boolean;
    questions: {
      id: string;
      text?: string;
      dynamicFieldValues?: Record<string, string>;
      questionTypeDefinitionId?: number | null;
    }[];
  };
  selectedPersona?: string | null;
  personas?: PersonaCardModel[];
  isLessonPractice?: boolean;
  lessonTitle?: string | null;
  programLabel?: string | null;
  courseLabel?: string | null;
  moduleLabel?: string | null;
  prevStep: () => void;
  onEditContext?: () => void;
  onEditQuestions?: () => void;
  parentSummary: string | null;
  typeDefinitions: QuestionTypeDefinition[];
  canPublish: boolean;
  submitting: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function ReviewStep({
  formData,
  selectedPersona = null,
  personas = [],
  isLessonPractice = false,
  lessonTitle = null,
  programLabel = null,
  courseLabel = null,
  moduleLabel = null,
  prevStep,
  onEditContext,
  onEditQuestions,
  parentSummary,
  typeDefinitions,
  canPublish,
  submitting,
  onSaveDraft,
  onPublish,
}: ReviewStepProps) {
  const persona = personaFromId(selectedPersona, personas);

  const reviewQuestions = useMemo(
    () => mapFormQuestionsForPracticeReview(formData.questions, typeDefinitions),
    [formData.questions, typeDefinitions],
  );

  const metadata = useMemo((): PracticeReviewMetadataItem[] => {
    const items: PracticeReviewMetadataItem[] = [];
    if (programLabel?.trim()) {
      items.push({ label: "Program", value: programLabel.trim() });
    }
    if (courseLabel?.trim()) {
      items.push({ label: "Course", value: courseLabel.trim() });
    }
    if (moduleLabel?.trim()) {
      items.push({ label: "Module", value: moduleLabel.trim() });
    }
    if (isLessonPractice && lessonTitle?.trim()) {
      items.push({ label: "Lesson", value: lessonTitle.trim() });
    }
    return items;
  }, [programLabel, courseLabel, moduleLabel, isLessonPractice, lessonTitle]);

  const practiceTitle = isLessonPractice
    ? lessonTitle?.trim() || parentSummary || "Lesson practice"
    : formData.title?.trim() || "Untitled Practice";

  const guidanceText =
    formData.tips?.trim() ||
    (!isLessonPractice ? formData.description?.trim() : "") ||
    "—";

  const thumbnailUrl = isLessonPractice
    ? null
    : formData.storyImageUrl?.trim() || null;

  return (
    <PracticeSequentialReview
      practiceTitle={practiceTitle}
      thumbnailUrl={thumbnailUrl}
      thumbnailKind={thumbnailUrl ? "image" : "gradient"}
      persona={persona ?? null}
      metadata={metadata}
      parentLink={metadata.length === 0 ? parentSummary : null}
      guidanceText={guidanceText}
      questions={reviewQuestions}
      saving={submitting}
      canPublish={canPublish}
      showMissingParentWarning
      onEditContext={onEditContext}
      onEditQuestions={onEditQuestions}
      onBack={prevStep}
      onSaveDraft={onSaveDraft}
      onPublish={onPublish}
    />
  );
}
