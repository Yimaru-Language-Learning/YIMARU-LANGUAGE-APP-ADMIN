import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import successIcon from "../../assets/success.svg";

import { ContextStep } from "./components/practice-steps/ContextStep";
import { ScenarioStep } from "./components/practice-steps/ScenarioStep";
import { PersonaStep } from "./components/practice-steps/PersonaStep";
import { QuestionsStep } from "./components/practice-steps/QuestionsStep";
import { ReviewStep } from "./components/practice-steps/ReviewStep";

export function AddPracticeFlow() {
  const navigate = useNavigate();
  const { level } = useParams<{ level: string }>();
  const [searchParams] = useSearchParams();
  const backTo = searchParams.get("backTo");
  const courseId = searchParams.get("courseId");
  const moduleId = searchParams.get("moduleId");

  const isModuleContext = backTo === "module";

  const backLabel =
    backTo === "module"
      ? "Back to Module"
      : backTo === "modules"
        ? "Back to Modules"
        : "Back to Courses";
  const backPath =
    backTo === "module" && courseId && moduleId
      ? `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`
      : backTo === "modules" && courseId
        ? `/new-content/learn-english/${level}/courses/${courseId}`
        : `/new-content/learn-english/${level}/courses`;

  const flowSteps = isModuleContext
    ? ["Context", "Persona", "Questions", "Review"]
    : ["Context", "Scenario", "Persona", "Questions", "Review"];

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(
    "dawit",
  );
  const [isPublished, setIsPublished] = useState(false);

  const [formData, setFormData] = useState({
    program: "Intermediate",
    course: "A2",
    title: "",
    description: "",
    selectedVideo: "",
    tips: "Focus on using the present perfect continuous tense to describe an action that started in the past and continues now.",
    questions: [
      {
        id: "q1",
        text: "How long have you been studying English?",
        type: "Speaking",
        voicePrompt: "prompt_q1_en.mp3",
        sampleAnswer: "prompt_q1_en.mp3",
      },
    ],
  });

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, flowSteps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (isPublished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20 animate-in fade-in zoom-in duration-500 bg-white">
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full" />
          <img
            src={successIcon}
            alt="Success"
            className="h-[128px] w-[128px] relative"
          />
        </div>
        <h1 className="text-[32px] font-bold text-grayScale-900 mb-4">
          Practice Published Successfully!
        </h1>
        <p className="text-grayScale-600 text-lg mb-14 max-w-lg font-medium leading-relaxed">
          Your speaking practice is now active and available inside the module.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-[400px]">
          <Button
            onClick={() => navigate(backPath)}
            className="h-14 rounded-2xl bg-brand-500 font-bold shadow-xl shadow-brand-500/20 text-[17px] text-white hover:bg-brand-600 transition-all active:scale-95"
          >
            Go back to Module
          </Button>
          <Button
            onClick={() => {
              setIsPublished(false);
              setCurrentStep(1);
              setFormData({
                ...formData,
                title: "",
                description: "",
              });
            }}
            variant="outline"
            className="h-14 rounded-2xl border-brand-200 text-brand-500 font-bold hover:bg-brand-50 transition-all text-[17px] bg-white"
          >
            Add Another Practice
          </Button>
        </div>
      </div>
    );
  }

  // Helper to map currentStep to the actual component for the module flow
  const renderStep = () => {
    if (!isModuleContext) {
      switch (currentStep) {
        case 1:
          return (
            <ContextStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              navigate={navigate}
              level={level!}
              isModuleContext={isModuleContext}
            />
          );
        case 2:
          return (
            <ScenarioStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          );
        case 3:
          return (
            <PersonaStep
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          );
        case 4:
          return (
            <QuestionsStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          );
        case 5:
          return (
            <ReviewStep
              formData={formData}
              selectedPersona={selectedPersona}
              prevStep={prevStep}
              setIsPublished={setIsPublished}
              isModuleContext={isModuleContext}
            />
          );
        default:
          return null;
      }
    } else {
      // Module Context Flow (Skips Scenario)
      switch (currentStep) {
        case 1:
          return (
            <ContextStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              navigate={navigate}
              level={level!}
              isModuleContext={isModuleContext}
            />
          );
        case 2:
          return (
            <PersonaStep
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
            />
          );
        case 4:
          return (
            <ReviewStep
              formData={formData}
              selectedPersona={selectedPersona}
              prevStep={prevStep}
              setIsPublished={setIsPublished}
              isModuleContext={isModuleContext}
            />
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="space-y-8 pb-32 px-6 pt-6 min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="mx-auto max-w-7xl w-full">
        <div className="flex items-center justify-between mb-8">
          <Link
            to={backPath}
            className="flex items-center gap-2 text-[15px] font-medium text-grayScale-500 transition-colors hover:text-brand-500 decoration-none"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <Button
            variant="outline"
            className="rounded-[8px] border-grayScale-200 text-grayScale-600 h-10 px-6 font-bold bg-white hover:bg-grayScale-50"
            onClick={() => navigate(backPath)}
          >
            Cancel
          </Button>
        </div>

        <div className="space-y-4 mb-10">
          <h1 className="text-4xl font-bold text-[#0F172A]">
            Add New Practice
          </h1>
          <p className="text-grayScale-400 text-lg">
            Create a new immersive practice session for students.
          </p>
        </div>

        <div className="mx-auto max-w-4xl mb-12">
          <Stepper steps={flowSteps} currentStep={currentStep} />
        </div>

        <div className="mx-auto max-w-4xl">{renderStep()}</div>
      </div>
    </div>
  );
}
