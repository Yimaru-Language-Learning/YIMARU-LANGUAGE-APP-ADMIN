import { LayoutGrid, Video, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Select } from "../../../../components/ui/select";
import { cn } from "../../../../lib/utils";

interface AttachPracticeStep1Props {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  onCancel: () => void;
}

export function AttachPracticeStep1({
  formData,
  setFormData,
  nextStep,
  onCancel,
}: AttachPracticeStep1Props) {
  return (
    <Card className="overflow-hidden max-w-4xl mx-auto border-grayScale-100 rounded-3xl bg-white shadow-sm animate-in fade-in duration-500">
      <div className="space-y-6 p-12">
        {/* Select Program */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-[#0F172A] ml-1">
            Select Program
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[10px] border-grayScale-200 bg-[#fff] pl-14 text-grayScale-800 font-bold focus:border-brand-500 transition-all text-sm"
              value={formData.program}
              onChange={(e) =>
                setFormData({ ...formData, program: e.target.value })
              }
            >
              <option value="">Choose Program</option>
              <option value="skill">Skill-Based Courses</option>
              <option value="exams">English Proficiency Exams</option>
            </Select>
          </div>
        </div>

        {/* Select Module */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-[#0F172A] ml-1">
            Select Module
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[10px] border-grayScale-200 bg-[#fff] pl-14 text-grayScale-800 font-bold focus:border-brand-500 transition-all text-sm"
              value={formData.module}
              onChange={(e) =>
                setFormData({ ...formData, module: e.target.value })
              }
            >
              <option value="">Choose Module</option>
              <option value="m1">Module 1: Basic Phrases</option>
              <option value="m2">Module 2: Intermediate Grammar</option>
            </Select>
          </div>
          <p className="text-[13px] text-grayScale-400 font-medium px-1">
            Select the specific learning module this practice will reinforce.
          </p>
        </div>

        {/* Select Video */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-[#0F172A] ml-1">
            Select Video
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <Video className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[10px] border-grayScale-200 bg-[#fff] pl-14 text-grayScale-800 font-bold focus:border-brand-500 transition-all text-sm"
              value={formData.video}
              onChange={(e) =>
                setFormData({ ...formData, video: e.target.value })
              }
            >
              <option value="">Choose a video</option>
              <option value="v1">Intro to Interactive Speaking</option>
              <option value="v2">Business Meeting Etiquette</option>
            </Select>
          </div>
          <p className="text-[13px] text-grayScale-400 font-medium px-1">
            Select the specific video this practice will reinforce.
          </p>
        </div>

        {/* Select Question Type */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-[#0F172A] ml-1">
            Select Question Type
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[10px] border-grayScale-200 bg-[#fff] pl-14 text-grayScale-800 font-bold focus:border-brand-500 transition-all text-sm"
              value={formData.questionType}
              onChange={(e) =>
                setFormData({ ...formData, questionType: e.target.value })
              }
            >
              <option value="">Choose question type</option>
              <option value="speaking">Speaking Practice</option>
              <option value="listening">Listening Quiz</option>
            </Select>
          </div>
          <p className="text-[13px] text-grayScale-400 font-medium px-1">
            Select one question type that associates with th selected video
          </p>
        </div>

        {/* Set Version */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-[#0F172A] ml-1">
            Set Version
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[10px] border-grayScale-200 bg-[#fff] pl-14 text-grayScale-800 font-bold focus:border-brand-500 transition-all text-sm"
              value={formData.version}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
            >
              <option value="">Choose versions</option>
              <option value="v1">Version 1.0</option>
              <option value="v2">Version 2.0</option>
            </Select>
          </div>
          <p className="text-[13px] text-grayScale-400 font-medium px-1">
            Select one or more versions
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-grayScale-200 bg-[#F8FAFC] py-4 px-12">
        <button
          className="text-[14px] text-grayScale-500 transition-colors hover:text-grayScale-700"
          onClick={onCancel}
        >
          Cancel
        </button>
        <Button
          onClick={nextStep}
          className="h-10 px-12 rounded-[6px] bg-[#9E2891] text-[14px] font-bold text-white shadow-lg shadow-brand-500/10 transition-all active:scale-95 flex items-center gap-3"
        >
          Next: Review
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
