import { LayoutGrid, Plus, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Select } from "../../../../components/ui/select";
import { cn } from "../../../../lib/utils";

interface ProgramAttachStep1Props {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  onCancel: () => void;
}

export function ProgramAttachStep1({
  formData,
  setFormData,
  nextStep,
  onCancel,
}: ProgramAttachStep1Props) {
  return (
    <Card className="overflow-hidden border-grayScale-100 rounded-[16px] bg-white shadow-sm animate-in fade-in duration-500">
      <div className="space-y-6 p-8 pb-16">
        {/* Select Program */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-[#0F172A] ml-1">
            Select Program
          </label>
          <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[12px] border-grayScale-200 bg-white pl-16 text-grayScale-700 font-medium focus:border-brand-500 transition-all text-sm appearance-none"
              value={formData.program}
              onChange={(e) =>
                setFormData({ ...formData, program: e.target.value })
              }
            >
              <option value="">Choose Program</option>
              <option value="exams">English Proficiency Exams</option>
              <option value="skill">Skill-Based Courses</option>
            </Select>
          </div>
        </div>

        {/* Tests (Auto Select) */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-grayScale-900 ml-1">
            Tests{" "}
            <span className="text-grayScale-400 font-medium">
              (Auto Select)
            </span>
          </label>
          <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <div className="h-[56px] w-full rounded-[12px] border border-grayScale-200 bg-white flex items-center pl-16 text-grayScale-700 font-medium text-sm">
              Mock Exam 1
            </div>
          </div>
        </div>

        <div className="w-full border-t border-grayScale-300" />

        {/* Select Question Type */}
        <div className="space-y-4">
          <label className="text-[14px] font-medium text-[#0F172A] ml-1">
            Select Question Type
          </label>
          <div className="relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[12px] border-grayScale-200 bg-white pl-16 text-grayScale-700 font-medium focus:border-brand-500 transition-all text-sm appearance-none"
              value={formData.questionType}
              onChange={(e) =>
                setFormData({ ...formData, questionType: e.target.value })
              }
            >
              <option value="">Choose question type</option>
              <option value="Speaking Practice">Speaking Practice</option>
              <option value="Writing Part 1">Writing Part 1</option>
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
            <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LayoutGrid className="h-5 w-5 text-grayScale-400" />
            </div>
            <Select
              className="h-[56px] w-full rounded-[12px] border-grayScale-200 bg-white pl-16 text-grayScale-700 font-medium focus:border-brand-500 transition-all text-sm appearance-none"
              value={formData.version}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
            >
              <option value="">Choose a version</option>
              <option value="V 1.0">V 1.0</option>
              <option value="V 2.0">V 2.0</option>
            </Select>
          </div>
        </div>

        {/* Add More Button */}
        <button className="flex items-center gap-2 text-[#9E2891] font-medium text-[14px] group transition-all hover:translate-x-1">
          <div className="h-5 w-5 rounded-full border-2 border-[#9E2891] flex items-center justify-center">
            <Plus className="h-3 w-3" />
          </div>
          Add More
        </button>
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
