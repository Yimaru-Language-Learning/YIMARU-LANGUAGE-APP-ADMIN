import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import { createModuleLesson } from "../../api/courses.api";

import { VideoDetailStep } from "./components/video-steps/VideoDetailStep";
import { ReviewPublishStep } from "./components/video-steps/ReviewPublishStep";
import successIcon from "../../assets/success.svg";

const STEPS = [
  { id: 1, label: "Video Detail" },
  { id: 2, label: "Review & Publish" },
];

export type AddLessonFormData = {
  title: string;
  order: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
};

const emptyForm = (): AddLessonFormData => ({
  title: "",
  order: "1",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
});

function descriptionToApiPlain(html: string): string {
  if (!html?.trim()) return "";
  const t = html.trim();
  if (!t.includes("<")) return t;
  if (typeof document === "undefined") {
    return t.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function AddVideoFlow() {
  const navigate = useNavigate();
  const { level, courseId, moduleId } = useParams<{
    level: string;
    courseId: string;
    moduleId: string;
  }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [formData, setFormData] = useState<AddLessonFormData>(emptyForm);
  const [publishing, setPublishing] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const backPath = `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`;

  const handlePublish = async () => {
    const mid = Number(moduleId);
    if (!Number.isFinite(mid) || mid < 1) {
      toast.error("Invalid module");
      return;
    }
    const title = formData.title.trim();
    const videoUrl = formData.videoUrl.trim();
    const thumbnail = formData.thumbnailUrl.trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }
    if (!videoUrl) {
      toast.error("Video URL is required");
      return;
    }
    if (!thumbnail) {
      toast.error("Thumbnail is required");
      return;
    }
    const description = descriptionToApiPlain(formData.description);
    if (!description) {
      toast.error("Description is required");
      return;
    }
    setPublishing(true);
    try {
      await createModuleLesson(mid, {
        title,
        video_url: videoUrl,
        thumbnail,
        description,
      });
      toast.success("Lesson created");
      setIsPublished(true);
    } catch (e: unknown) {
      console.error(e);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create lesson";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  if (isPublished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20 animate-in fade-in zoom-in duration-500 ">
        <div className="mb-12 relative scale-110">
          <div className="absolute inset-0 bg-brand-500/5 blur-3xl rounded-full" />
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full" />
            <img
              src={successIcon}
              alt="Success"
              className="h-[128px] w-[128px] relative"
            />
          </div>
        </div>

        <h1 className="text-[26px] font-bold text-grayScale-900 mb-4">
          Lesson created successfully
        </h1>
        <p className="text-grayScale-600 text-base mb-14 max-w-lg font-medium leading-relaxed">
          Your lesson is now available in this module.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-[400px]">
          <Button
            onClick={() => navigate(backPath)}
            className="h-12 rounded-[6px] bg-brand-500 font-bold text-[17px] text-white  transition-all active:scale-95"
          >
            View module
          </Button>
          <Button
            onClick={() => {
              setFormData(emptyForm());
              setFormResetKey((k) => k + 1);
              setIsPublished(false);
              setCurrentStep(1);
            }}
            variant="outline"
            className="h-12 rounded-[6px] border-brand-200 text-brand-500 font-bold text-[17px] active:scale-95 bg-white"
          >
            Add another lesson
          </Button>
          <Button
            onClick={() => navigate(`/new-content/learn-english/${level}/courses`)}
            variant="ghost"
            className="h-10 text-grayScale-600 font-medium"
          >
            All courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 px-6 pt-6 min-h-screen ">
      <div className="mx-auto max-w-7xl w-full">
        <div className="flex items-center justify-between mb-8">
          <Link
            to={backPath}
            className="flex items-center gap-2 text-[15px] font-medium text-grayScale-500 transition-colors hover:text-brand-500 decoration-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to module
          </Link>
          <Button
            variant="outline"
            className="rounded-[8px] border-grayScale-200 text-grayScale-600 h-10 px-6 font-bold bg-white hover:bg-grayScale-50"
            onClick={() => navigate(backPath)}
          >
            Cancel
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-[#0F172A] mb-10">
          Add new lesson
        </h1>

        <div className="mx-auto max-w-4xl mb-12">
          <Stepper
            steps={STEPS.map((s) => s.label)}
            currentStep={currentStep}
          />
        </div>

        <div className="mx-auto max-w-7xl">
          {currentStep === 1 && (
            <VideoDetailStep
              key={formResetKey}
              formData={formData}
              setFormData={setFormData}
              onContinue={nextStep}
            />
          )}

          {currentStep === 2 && (
            <ReviewPublishStep
              formData={formData}
              prevStep={prevStep}
              onPublish={() => void handlePublish()}
              publishing={publishing}
            />
          )}
        </div>
      </div>
    </div>
  );
}
