import { useMemo } from "react";
import {
  PracticeSequentialReview,
  type PracticeReviewQuestion,
} from "./practice-steps/PracticeSequentialReview";
import type { PersonaCardModel } from "../../../lib/personaDisplay";

type IntroVideoPreview =
  | { kind: "vimeo"; url: string }
  | { kind: "video"; url: string }
  | null;

function plainTextFromHtml(raw: string): string {
  if (!raw.trim()) return "";
  if (!/<\/?[a-z][\s\S]*>/i.test(raw)) return raw.trim();
  try {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    return doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
  } catch {
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

export type AddNewPracticeReviewStepProps = {
  practiceTitle: string;
  practiceDescription: string;
  selectedProgram: string;
  selectedCourse: string;
  moduleLabel: string;
  selectedPersona: string | null;
  personas: PersonaCardModel[];
  introVideoPreview: IntroVideoPreview;
  questions: PracticeReviewQuestion[];
  saving: boolean;
  saveError: string | null;
  onEditContext: () => void;
  onEditQuestions: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

export function AddNewPracticeReviewStep({
  practiceTitle,
  practiceDescription,
  selectedProgram,
  selectedCourse,
  moduleLabel,
  selectedPersona,
  personas,
  introVideoPreview,
  questions,
  saving,
  saveError,
  onEditContext,
  onEditQuestions,
  onBack,
  onSaveDraft,
  onPublish,
}: AddNewPracticeReviewStepProps) {
  const persona = personas.find((p) => p.id === selectedPersona);

  const guidanceText = useMemo(() => {
    const fromDescription = plainTextFromHtml(practiceDescription);
    if (fromDescription) return fromDescription;
    const tips = questions
      .map((q) => q.tips?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
    return tips || "unassigned";
  }, [practiceDescription, questions]);

  const thumbnailKind =
    introVideoPreview?.kind === "video"
      ? "video"
      : introVideoPreview?.kind === "vimeo"
        ? "vimeo"
        : "gradient";

  return (
    <PracticeSequentialReview
      practiceTitle={practiceTitle}
      thumbnailUrl={
        introVideoPreview?.kind === "video" ? introVideoPreview.url : null
      }
      thumbnailKind={thumbnailKind}
      persona={persona ?? null}
      metadata={[
        { label: "Program", value: selectedProgram },
        { label: "Course", value: selectedCourse },
        { label: "Module", value: moduleLabel },
      ]}
      guidanceText={guidanceText}
      questions={questions}
      saving={saving}
      saveError={saveError}
      onEditContext={onEditContext}
      onEditQuestions={onEditQuestions}
      onBack={onBack}
      onSaveDraft={onSaveDraft}
      onPublish={onPublish}
    />
  );
}
