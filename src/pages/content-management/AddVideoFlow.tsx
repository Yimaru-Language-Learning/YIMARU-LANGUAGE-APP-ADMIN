import { notifyApiError } from "../../lib/apiErrors"
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageBackLink } from "../../components/navigation/PageBackLink";
import { navigateBack } from "../../lib/navigateBack";
import { Button } from "../../components/ui/button";
import { Stepper } from "../../components/ui/stepper";
import { createModuleLesson } from "../../api/courses.api";
import type { PracticePublishStatus } from "../../types/course.types";

import { VideoDetailStep } from "./components/video-steps/VideoDetailStep";
import { ReviewPublishStep } from "./components/video-steps/ReviewPublishStep";
import successIcon from "../../assets/success.svg";

const STEPS = [
  { id: 1, label: "Video Detail" },
  { id: 2, label: "Review & Publish" },
];

export type AddLessonFormData = {
  title: string;
  sortOrder: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
};

const emptyForm = (): AddLessonFormData => ({
  title: "",
  sortOrder: "0",
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
  const [lastCreatedPublishStatus, setLastCreatedPublishStatus] =
    useState<PracticePublishStatus>("PUBLISHED");
  const [formData, setFormData] = useState<AddLessonFormData>(emptyForm);
  const [publishing, setPublishing] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const backPath = `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`;
  const goBack = () => navigateBack(navigate, backPath);

  const handleCreateLesson = async (publishStatus: PracticePublishStatus) => {
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
    const sortOrderRaw = formData.sortOrder.trim();
    if (sortOrderRaw === "") {
      toast.error("Sort order is required");
      return;
    }
    const sort_order = Number(sortOrderRaw);
    if (!Number.isInteger(sort_order) || sort_order < 0) {
      toast.error("Sort order must be a whole number of 0 or greater");
      return;
    }
    setPublishing(true);
    try {
      await createModuleLesson(mid, {
        title,
        video_url: videoUrl,
        thumbnail,
        description,
        sort_order,
        publish_status: publishStatus,
      });
      setLastCreatedPublishStatus(publishStatus);
      toast.success(
        publishStatus === "DRAFT"
          ? "Lesson saved as draft"
          : "Lesson published",
      );
      setIsPublished(true);
    } catch (e: unknown) {
      console.error(e);
      notifyApiError(e, "Failed to create lesson");
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
          {lastCreatedPublishStatus === "DRAFT"
            ? "Lesson saved as draft"
            : "Lesson published successfully"}
        </h1>
        <p className="text-grayScale-600 text-base mb-14 max-w-lg font-medium leading-relaxed">
          {lastCreatedPublishStatus === "DRAFT"
            ? "You can finish editing and publish it later from the module."
            : "Your lesson is now available in this module."}
        </p>

        <div className="flex flex-col gap-4 w-full max-w-[400px]">
          <Button
            onClick={goBack}
            className="h-12 rounded-[6px] bg-brand-500 font-bold text-[17px] text-white  transition-all active:scale-95"
          >
            View module
          </Button>
          <Button
            onClick={() => {
              setFormData(emptyForm());
              setFormResetKey((k) => k + 1);
              setLastCreatedPublishStatus("PUBLISHED");
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
    <div className="min-h-screen space-y-6 px-0 pb-24 pt-2 sm:space-y-8 sm:px-2 sm:pb-32 sm:pt-4">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <PageBackLink fallbackTo={backPath} label="Back to module" className="text-grayScale-500" />
          <Button
            variant="outline"
            className="h-10 w-full rounded-[6px] border-grayScale-200 bg-white px-6 font-bold text-grayScale-600 hover:bg-grayScale-50 sm:w-auto"
            onClick={goBack}
          >
            Cancel
          </Button>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-[#0F172A] sm:mb-10">
          Add new lesson
        </h1>

        <div className="mx-auto mb-8 w-full max-w-3xl sm:mb-12">
          <Stepper
            steps={STEPS.map((s) => s.label)}
            currentStep={currentStep}
          />
        </div>

        <div className="mx-auto min-w-0 max-w-7xl">
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
              onCreateLesson={(status) => void handleCreateLesson(status)}
              publishing={publishing}
            />
          )}
        </div>
      </div>
    </div>
  );
}
