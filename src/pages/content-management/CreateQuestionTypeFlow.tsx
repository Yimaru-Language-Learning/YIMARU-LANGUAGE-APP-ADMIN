import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import { QuestionTypeBasicInfoStep } from "./components/question-type-steps/QuestionTypeBasicInfoStep";
import { QuestionTypeConfigStep } from "./components/question-type-steps/QuestionTypeConfigStep";

export function CreateQuestionTypeFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    "Basic Info",
    "Input & Answer Configuration",
    "Versions",
    "Review & Publish",
  ];

  const handleNext = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {/* Header */}
      <div className=" border-b border-grayScale-100 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto py-6">
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/new-content/question-types"
              className="flex items-center gap-2 text-[15px] font-medium text-grayScale-600 transition-colors hover:text-brand-500 group"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Back to Question Type Library
            </Link>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-[28px] font-bold text-grayScale-900 tracking-tight">
                Create Question Type
              </h1>
              <p className="text-grayScale-500 text-[14px] font-medium">
                Create a new immersive practice session for students.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="h-10 px-8 rounded-[6px] border-grayScale-200 text-grayScale-900 font-medium hover:bg-grayScale-50"
                onClick={() => navigate("/new-content/question-types")}
              >
                Cancel
              </Button>
              <Button className="h-10 px-8 rounded-[6px] bg-[#9E2891] font-medium text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all">
                Save as Draft
              </Button>
            </div>
          </div>

          <div className="mt-12 mx-auto">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-10 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentStep === 1 && <QuestionTypeBasicInfoStep onNext={handleNext} />}
        {currentStep === 2 && (
          <QuestionTypeConfigStep onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep > 2 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-grayScale-100 shadow-sm">
            <p className="text-grayScale-400 font-medium">
              Step {currentStep} implementation in progress...
            </p>
            <Button onClick={handleBack} variant="outline" className="mt-4">
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
