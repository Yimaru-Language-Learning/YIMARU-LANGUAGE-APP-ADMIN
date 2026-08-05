import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import successIcon from "../../assets/success.svg";

import { ProgramAttachStep1 } from "./components/practice-steps/ProgramAttachStep1";
import { ProgramAttachReviewStep } from "./components/practice-steps/ProgramAttachReviewStep";

export function AttachProgramPracticeFlow() {
  const navigate = useNavigate();
  const { programType } = useParams<{ programType: string }>();

  const backPath = `/new-content/courses/${programType}`;
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);

  const [formData, setFormData] = useState({
    program: "Duolingo/IELTS",
    test: "Mock Exam 1",
    questionType: "Speaking Practice",
    version: "V 1.0",
  });

  const steps = ["Set Program", "Review & Publish"];

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (isPublished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20 animate-in fade-in zoom-in duration-700 bg-white">
        {/* Scalloped Success Icon */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full" />
          <img
            src={successIcon}
            alt="Success"
            className="h-[128px] w-[128px] relative"
          />
        </div>

        <h1 className="text-[28px] font-bold text-grayScale-900 mb-2">
          Practice Attached Successfully!
        </h1>
        <p className="text-grayScale-600 text-md mb-14 max-w-lg font-medium leading-relaxed">
          The practice has been successfully linked to the program{" "}
          <span className="text-[#9E2891]">“{formData.program}”</span>
        </p>

        <div className="flex flex-col gap-4 w-full max-w-[440px]">
          <Button
            onClick={() => navigate(backPath)}
            className="h-14 rounded-[12px] bg-[#9E2891] font-bold shadow-xl shadow-brand-500/20 text-[16px] text-white "
          >
            Go back to Program
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsPublished(false);
              setCurrentStep(1);
            }}
            className="h-14 rounded-[12px] border-[#9E2891] text-[#9E2891] font-bold text-[16px] bg-white "
          >
            Attach More Practice
          </Button>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProgramAttachStep1
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            onCancel={() => navigate(backPath)}
          />
        );
      case 2:
        return (
          <ProgramAttachReviewStep
            formData={formData}
            prevStep={prevStep}
            onPublish={() => setIsPublished(true)}
            onCancel={() => navigate(backPath)}
          />
        );
      default:
        return null;
    }
  };

  const title =
    currentStep === 1 ? "Attach Practice to a program" : "Review & Publish";
  const description =
    currentStep === 1
      ? "Create a new immersive practice session for a video."
      : "Verify practice details before publishing it.";

  return (
    <div className="space-y-8 px-6 pt-10 min-h-screen animate-in fade-in duration-500">
      <div className=" w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-12">
          <Link
            to={backPath}
            className="flex items-center gap-2 text-[15px] font-bold text-grayScale-600 transition-colors hover:text-brand-500 group"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Back to Program
          </Link>
        </div>

        {/* Stepper Area */}
        <div className="mb-20 pointer-events-none">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Page Title & Header Actions */}
        <div className="mb-10 flex items-start justify-between">
          <div className="">
            <h1 className="text-[30px] font-bold text-[#0D1421] ">{title}</h1>
            <p className="text-grayScale-500 text-[14px]">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-10 px-8 rounded-[6px] border-grayScale-100 text-grayScale-600 font-bold bg-white hover:bg-grayScale-50 shadow-sm"
              onClick={() => navigate(backPath)}
            >
              Cancel
            </Button>
            <Button className="h-10 px-8 rounded-[6px] bg-[#9E2891] font-bold text-white shadow-md hover:bg-[#8A237E] transition-all">
              Save as Draft
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div
          className={`w-full mx-auto ${
            currentStep === 1 ? "max-w-4xl" : "max-w-none"
          }`}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
