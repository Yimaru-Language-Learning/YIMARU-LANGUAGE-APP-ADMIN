import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, FileVideo, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import successIcon from "../../assets/success.svg";

import { AttachPracticeStep1 } from "./components/practice-steps/AttachPracticeStep1";
import { AttachPracticeReviewStep } from "./components/practice-steps/AttachPracticeReviewStep";

export function AttachPracticeFlow() {
  const navigate = useNavigate();
  const { programType, courseId, unitId, moduleId } = useParams<{
    programType: string;
    courseId: string;
    unitId: string;
    moduleId: string;
  }>();

  const backPath = `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}`;
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);

  const [formData, setFormData] = useState({
    program:
      programType === "skill"
        ? "Skill-Based Courses"
        : "Duolingo/IELTS",
    module: "Module 4: Interactive Speaking",
    video: "Intro to Interactive Speaking",
    questionType: "speaking",
    version: "v1",
  });

  const steps = ["Set Video", "Review & Publish"];

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (isPublished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20 animate-in fade-in zoom-in duration-700 ">
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
        <p className="text-grayScale-600 text-md mb-14 max-w-2xl font-medium leading-relaxed">
          The practice has been successfully linked to a video{" "}
          <span className="text-[#9E2891]">“{formData.video}”</span>
        </p>

        {/* Video Info Card */}
        <div className="w-full max-w-[600px] bg-[#9E289114] border border-[#9E2891] rounded-[12px] p-4 flex items-center justify-between mb-16 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="h-[60px] w-[120px] rounded-xl overflow-hidden shadow-inner flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1557425955-df376b5903c8?auto=format&fit=crop&q=80&w=400"
                alt="Video Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left space-y-1.5">
              <h4 className="text-[14px] font-medium text-grayScale-900">
                Intro to IELTS Speaking Part 1
              </h4>
              <div className="flex items-center gap-3 text-grayScale-400 font-medium text-[12px]">
                <div className="flex items-center gap-1.5 uppercase tracking-wide">
                  <Clock className="h-3 w-3" />
                  10:42 mins
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 uppercase tracking-wide">
                  MP4
                </div>
              </div>
            </div>
          </div>
          <div className="pr-4">
            <Check className="h-5 w-5 text-[#9E2891] stroke-[3px]" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-[440px]">
          <Button
            onClick={() => navigate(backPath)}
            className="h-14 rounded-[6px] bg-[#9E2891] font-bold shadow-xl shadow-brand-500/20 text-[16px] text-white"
          >
            Go back to Videos
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsPublished(false);
              setCurrentStep(1);
            }}
            className="h-14 rounded-[6px] border-[#9E2891] text-[#9E2891] font-semibold text-[16px] bg-white"
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
          <AttachPracticeStep1
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            onCancel={() => navigate(backPath)}
          />
        );
      case 2:
        return (
          <AttachPracticeReviewStep
            formData={formData}
            prevStep={prevStep}
            onPublish={() => setIsPublished(true)}
          />
        );
      default:
        return null;
    }
  };

  const title =
    currentStep === 1 ? "Attach Practice to a Video" : "Review & Publish";
  const description =
    currentStep === 1
      ? "Create a new immersive practice session for a video."
      : "Verify practice details before publishing it.";

  return (
    <div className="space-y-8 pb-32 px-6 pt-10 min-h-screen  animate-in fade-in duration-500">
      <div className="mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-12">
          <Link
            to={backPath}
            className="flex items-center gap-2 text-[15px] font-bold text-grayScale-600 transition-colors hover:text-brand-500 group"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Back to Videos
          </Link>
        </div>

        {/* Stepper Area */}
        <div className="mb-20 w-full pointer-events-none">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Page Title & Header Actions */}
        <div className="mb-10 flex items-start justify-between">
          <div className="">
            <h1 className="text-[30px] font-bold text-[#0D1421] ">{title}</h1>
            <p className="text-grayScale-400 text-[16px] font-medium ">
              {description}
            </p>
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
        <div className="w-full">{renderStep()}</div>
      </div>
    </div>
  );
}
