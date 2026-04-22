import { GraduationCap, ArrowRight, LayoutGrid, Monitor } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Select } from "../../../../components/ui/select";

interface ContextStepProps {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  navigate: (path: string) => void;
  level: string;
  isModuleContext?: boolean;
}

export function ContextStep({
  formData,
  setFormData,
  nextStep,
  navigate,
  level,
  isModuleContext,
}: ContextStepProps) {
  return (
    <Card className="overflow-hidden border-grayScale-50 shadow-soft rounded-2xl bg-white animate-in fade-in duration-500">
      <div className="border-b border-grayScale-50 p-8">
        <h2 className="text-2xl font-bold text-grayScale-900 leading-none">
          Step 1: Context Definition
        </h2>
        <p className="text-grayScale-400 text-base mt-3">
          Define the educational level and curriculum module for this practice.
        </p>
      </div>

      <div className="space-y-10 p-10">
        {/* Program Field */}
        <div className="space-y-3">
          <label className="text-[17px] font-bold text-grayScale-700 ml-1">
            Program{" "}
            <span className="text-grayScale-300 font-medium">
              (Auto-selected)
            </span>
          </label>
          <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
              <GraduationCap className="h-6 w-6 text-grayScale-400" />
            </div>
            <Select
              className="h-16 w-full rounded-2xl border-grayScale-50 bg-[#F9FAFB] pl-16 text-grayScale-700 font-bold focus:border-brand-500 focus:ring-0 transition-all cursor-default"
              disabled
            >
              <option>{formData.program || "Intermediate"}</option>
            </Select>
          </div>
        </div>

        {/* Course Field */}
        <div className="space-y-3">
          <label className="text-[17px] font-bold text-grayScale-700 ml-1">
            Course{" "}
            <span className="text-grayScale-300 font-medium">
              (Auto-selected)
            </span>
          </label>
          <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
              <GraduationCap className="h-6 w-6 text-grayScale-400" />
            </div>
            <Select
              className="h-16 w-full rounded-2xl border-grayScale-50 bg-[#F9FAFB] pl-16 text-grayScale-700 font-bold focus:border-brand-500 focus:ring-0 transition-all cursor-default"
              disabled
            >
              <option>{formData.course || "B2"}</option>
            </Select>
          </div>
        </div>

        {/* Select Module Field */}
        <div className="space-y-3">
          <label className="text-[17px] font-bold text-grayScale-700 ml-1">
            Select Module
          </label>
          <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
              <LayoutGrid className="h-6 w-6 text-grayScale-400" />
            </div>
            <Select className="h-16 w-full rounded-2xl border-grayScale-100 bg-white pl-16 text-grayScale-700 font-bold focus:border-brand-500 focus:ring-0 transition-all ring-offset-0">
              <option value="">Choose a module...</option>
              <option value="m1">Introduction Basics</option>
              <option value="m2">Daily Routines</option>
              <option value="m3">Travel Essentials</option>
            </Select>
          </div>
          <p className="text-[13px] text-grayScale-400 font-medium px-2">
            Select the specific learning module this practice will reinforce.
          </p>
        </div>

        {/* Select Video Field (Conditional) */}
        {isModuleContext && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-[17px] font-bold text-grayScale-700 ml-1">
              Select Video
            </label>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2">
                <Monitor className="h-6 w-6 text-grayScale-400" />
              </div>
              <Select
                className="h-16 w-full rounded-2xl border-grayScale-100 bg-white pl-16 text-grayScale-700 font-bold focus:border-brand-500 focus:ring-0 transition-all"
                value={formData.selectedVideo}
                onChange={(e) =>
                  setFormData({ ...formData, selectedVideo: e.target.value })
                }
              >
                <option value="">Choose a video</option>
                <option value="v1">Intro to Greetings</option>
                <option value="v2">Advanced Grammar</option>
              </Select>
            </div>
            <p className="text-[13px] text-grayScale-400 font-medium px-2">
              Select the specific learning module this practice will reinforce.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-grayScale-50 bg-[#F9FAFB]/50 p-10 px-12">
        <button
          className="text-[17px] font-bold text-grayScale-500 transition-colors hover:text-grayScale-700"
          onClick={() =>
            navigate(`/new-content/learn-english/${level}/courses`)
          }
        >
          Cancel
        </button>
        <Button
          onClick={nextStep}
          className="h-14 px-10 rounded-2xl bg-brand-500 text-[17px] font-bold text-white hover:bg-brand-600 shadow-xl shadow-brand-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          Next: {isModuleContext ? "Persona" : "Scenario"}{" "}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}
