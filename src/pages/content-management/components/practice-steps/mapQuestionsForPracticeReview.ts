import type { QuestionTypeDefinition } from "../../../../types/questionTypeDefinition.types";
import {
  definitionUsesDynamicPayload,
  legacyQuestionTypeFromDefinition,
} from "../../../../lib/learnEnglishDefinitionQuestion";
import type { PracticeReviewQuestion } from "./PracticeSequentialReview";

function isAudioLikeKind(kind: string): boolean {
  const k = kind.toLowerCase();
  return (
    k.includes("audio") ||
    k.includes("voice") ||
    k === "url" ||
    k === "file" ||
    k === "media"
  );
}

function firstUrlFromSchema(
  schema: { id: number; kind: string }[],
  prefix: "stimulus" | "response",
  values: Record<string, string>,
): string {
  for (const row of schema) {
    if (!isAudioLikeKind(row.kind)) continue;
    const v = values[`${prefix}:${row.id}`]?.trim();
    if (v) return v;
  }
  for (const row of schema) {
    const v = values[`${prefix}:${row.id}`]?.trim();
    if (v && /^https?:\/\//i.test(v)) return v;
  }
  return "";
}

export function mapFormQuestionsForPracticeReview(
  questions: {
    id: string;
    text?: string;
    dynamicFieldValues?: Record<string, string>;
    questionTypeDefinitionId?: number | null;
  }[],
  typeDefinitions: QuestionTypeDefinition[],
): PracticeReviewQuestion[] {
  return questions.map((q) => {
    const def = typeDefinitions.find(
      (d) => d.id === q.questionTypeDefinitionId,
    );
    const values = q.dynamicFieldValues ?? {};
    let voicePrompt = "";
    let sampleAnswerVoicePrompt = "";

    if (def && definitionUsesDynamicPayload(def)) {
      voicePrompt = firstUrlFromSchema(def.stimulus_schema, "stimulus", values);
      sampleAnswerVoicePrompt = firstUrlFromSchema(
        def.response_schema,
        "response",
        values,
      );
    } else if (def) {
      const legacy = legacyQuestionTypeFromDefinition(def);
      const key = def.key.toLowerCase();
      if (legacy === null && key.includes("audio")) {
        voicePrompt = Object.entries(values)
          .filter(([k]) => k.startsWith("stimulus:"))
          .map(([, v]) => v?.trim())
          .find(Boolean) ?? "";
        sampleAnswerVoicePrompt =
          Object.entries(values)
            .filter(([k]) => k.startsWith("response:"))
            .map(([, v]) => v?.trim())
            .find(Boolean) ?? "";
      }
    }

    return {
      id: q.id,
      questionText: String(q.text ?? "").trim(),
      voicePrompt,
      sampleAnswerVoicePrompt,
    };
  });
}
