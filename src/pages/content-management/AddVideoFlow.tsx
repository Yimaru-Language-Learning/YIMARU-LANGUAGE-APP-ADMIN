import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";

import { VideoDetailStep } from "./components/video-steps/VideoDetailStep";
import { ReviewPublishStep } from "./components/video-steps/ReviewPublishStep";

const STEPS = [
  { id: 1, label: "Video Detail" },
  { id: 2, label: "Review & Publish" },
];

export function AddVideoFlow() {
  const navigate = useNavigate();
  const { level, courseId, moduleId } = useParams<{
    level: string;
    courseId: string;
    moduleId: string;
  }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    order: "1",
    description: "",
    thumbnail: null,
    videoFile: null,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const backPath = `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`;

  if (isPublished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20 animate-in fade-in zoom-in duration-500 bg-white">
        {/* Success Icon Wrapper (Jagged Circle Style) */}
        <div className="mb-12 relative scale-110">
          <div className="absolute inset-0 bg-brand-500/5 blur-3xl rounded-full" />
          <div className="relative">
            <div
              className="h-24 w-24 bg-brand-500 flex items-center justify-center"
              style={{
                clipPath:
                  "polygon(50% 0%, 61% 10%, 75% 10%, 80% 24%, 94% 30%, 90% 44%, 100% 56%, 90% 68%, 94% 82%, 80% 88%, 75% 100%, 61% 100%, 50% 90%, 39% 100%, 25% 100%, 20% 88%, 6% 82%, 10% 68%, 0% 56%, 10% 44%, 6% 30%, 20% 24%, 25% 10%, 39% 10%)",
              }}
            >
              <Check className="h-12 w-12 text-white stroke-[4px]" />
            </div>
            {/* Sub-Jagged layer for depth if needed */}
            <div
              className="absolute inset-0 bg-brand-500/20 scale-110 -z-10"
              style={{
                clipPath:
                  "polygon(50% 0%, 61% 10%, 75% 10%, 80% 24%, 94% 30%, 90% 44%, 100% 56%, 90% 68%, 94% 82%, 80% 88%, 75% 100%, 61% 100%, 50% 90%, 39% 100%, 25% 100%, 20% 88%, 6% 82%, 10% 68%, 0% 56%, 10% 44%, 6% 30%, 20% 24%, 25% 10%, 39% 10%)",
                opacity: 0.3,
              }}
            />
          </div>
        </div>

        <h1 className="text-[32px] font-bold text-grayScale-900 mb-4">
          Video Published Successfully!
        </h1>
        <p className="text-grayScale-600 text-lg mb-14 max-w-lg font-medium leading-relaxed">
          Your video is now live and available inside the selected module.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-[400px]">
          <Button
            onClick={() => navigate(`/new-content/learn-english/${level}`)}
            className="h-14 rounded-2xl bg-brand-500 font-bold shadow-xl shadow-brand-500/20 text-[17px] text-white hover:bg-brand-600 transition-all active:scale-95"
          >
            Go back to Learn English
          </Button>
          <Button
            onClick={() => {
              setFormData({
                title: "",
                order: "1",
                description: "",
                thumbnail: null,
                videoFile: null,
              });
              setIsPublished(false);
              setCurrentStep(1);
            }}
            variant="outline"
            className="h-14 rounded-2xl border-brand-200 text-brand-500 font-bold hover:bg-brand-50 transition-all text-[17px] active:scale-95 bg-white"
          >
            Add Another Video
          </Button>
        </div>
      </div>
    );
  }

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
            Back to Modules
          </Link>
          <Button
            variant="outline"
            className="rounded-[8px] border-grayScale-200 text-grayScale-600 h-10 px-6 font-bold bg-white hover:bg-grayScale-50"
            onClick={() => navigate(backPath)}
          >
            Cancel
          </Button>
        </div>

        <h1 className="text-4xl font-bold text-[#0F172A] mb-10">
          Add New Video
        </h1>

        <div className="mx-auto max-w-4xl mb-12">
          <Stepper
            steps={STEPS.map((s) => s.label)}
            currentStep={currentStep}
          />
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-7xl">
          {currentStep === 1 && (
            <VideoDetailStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
            />
          )}

          {currentStep === 2 && (
            <ReviewPublishStep
              formData={formData}
              prevStep={prevStep}
              setIsPublished={setIsPublished}
            />
          )}
        </div>
      </div>
    </div>
  );
}
