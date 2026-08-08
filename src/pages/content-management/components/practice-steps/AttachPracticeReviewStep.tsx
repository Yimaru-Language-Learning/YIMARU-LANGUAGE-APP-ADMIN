import {
  Rocket,
  GraduationCap,
  Folder,
  ChevronUp,
  ChevronDown,
  Eye,
  Video as VideoIcon,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { cn } from "../../../../lib/utils";

interface AttachPracticeReviewStepProps {
  formData: any;
  prevStep: () => void;
  onPublish: () => void;
}

export function AttachPracticeReviewStep({
  formData,
  prevStep,
  onPublish,
}: AttachPracticeReviewStepProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const questions = [
    { order: "01", text: "What is the main idea of the passage?" },
    { order: "02", text: "What does the speaker mainly talk about in the..." },
    { order: "03", text: "Which option best completes the sentence?" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500  mx-auto">
      {/* 1. Video Summary Card */}
      <Card className="p-6 border-grayScale-200  rounded-2xl bg-white overflow-hidden">
        <div className="flex gap-8 items-start">
          {/* Thumbnail */}
          <div className="relative h-[150px] w-[260px] rounded-xl overflow-hidden shadow-inner flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1557425955-df376b5903c8?auto=format&fit=crop&q=80&w=600"
              alt="Video Thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
              <VideoIcon className="h-3 w-3" />
              12:30
            </div>
          </div>

          {/* Details */}
          <div className="pt-12">
            <h3 className="text-[20px] font-bold text-grayScale-900 leading-tight">
              Intro to Interactive Speaking
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="h-8 pr-2 rounded-full flex items-center gap-2 text-brand-500  text-[13px]">
                <GraduationCap className="h-4 w-4" />
                IELTS
              </div>
              <div className="h-8 pr-2 rounded-full  flex items-center gap-2 text-brand-500  text-[13px]">
                <Folder className="h-4 w-4" />
                Unit 2: Speaking
              </div>
              <div className="h-8 rounded-full   flex items-center gap-2 text-brand-500  text-[13px]">
                <Folder className="h-4 w-4" />
                Module 4: Interactive Speaking
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Attached Practices Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between ">
          <h2 className="text-[20px] font-bold text-[#0F172A] flex items-center gap-3">
            Attached Practices
          </h2>
          <span className="h-6 px-3 rounded-full bg-grayScale-200/40 text-grayScale-500 text-[12px] font-bold flex items-center justify-center">
            Total Items: 3
          </span>
        </div>

        <Card className="overflow-hidden border border-grayScale-200 shadow-sm rounded-2xl bg-white">
          {/* Header */}
          <div
            className="p-6 flex items-center justify-between transition-colors hover:bg-grayScale-25 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#FDF2F8] flex items-center justify-center text-[#9E2891]">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[17px] font-medium text-grayScale-900">
                  Multiple Choice
                </h4>
                <p className="text-[14px] text-grayScale-400 font-medium">
                  3 Questions • ~4 min to complete
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-[#9E2891] font-medium text-[14px] hover:opacity-80 transition-opacity">
                <Eye className="h-4 w-4" />
                Preview
              </button>
              {isExpanded ? (
                <ChevronUp className="h-6 w-6 text-grayScale-300" />
              ) : (
                <ChevronDown className="h-6 w-6 text-grayScale-300" />
              )}
            </div>
          </div>

          {/* Expanded Content (Table) */}
          {isExpanded && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className="border-t border-grayScale-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white">
                      <th className="py-4 pl-10 pr-0 w-[80px]"></th>
                      <th className="py-4 px-4 text-[13px] font-medium text-[#A5B4C1] uppercase tracking-wide w-24">
                        Order
                      </th>
                      <th className="py-4 px-4 text-[13px] font-medium text-[#A5B4C1] uppercase tracking-wide">
                        Versions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-t border-grayScale-100">
                    {questions.map((q, i) => (
                      <tr
                        key={i}
                        className="border-b border-grayScale-200 last:border-0 group hover:bg-grayScale-25 transition-colors"
                      >
                        <td className="py-6 pl-10 pr-0 text-center">
                          <GripVertical className="h-4 w-4 text-[#A5B4C1]" />
                        </td>
                        <td className="py-6 px-4">
                          <span className="text-[15px] text-[#A5B4C1]">
                            {q.order}
                          </span>
                        </td>
                        <td className="py-6 px-4">
                          <p className="text-[15px] font-medium text-[#0D1421]">
                            {q.text}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 3. Confirmation Checkbox */}
      <div className="bg-[#F1F5F9] border border-[#E2E8F0] px-6 py-4 rounded-[12px] flex items-start gap-4">
        <input
          type="checkbox"
          id="confirm"
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-grayScale-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
        />
        <div className="">
          <label
            htmlFor="confirm"
            className="text-[16px] font-bold text-grayScale-900 cursor-pointer"
          >
            I confirm these details are correct
          </label>
          <p className="text-[13px] text-grayScale-400">
            This action cannot be undone immediately. Rollback requires manual
            intervention.
          </p>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="flex flex-col-reverse gap-3 px-0 pt-8 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:pt-10">
        <Button
          onClick={prevStep}
          variant="outline"
          className="h-12 w-full rounded-[6px] border-grayScale-400 bg-transparent px-10 font-bold text-grayScale-600 transition-all sm:w-auto"
        >
          Back
        </Button>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Button
            variant="outline"
            className="h-12 w-full rounded-[6px] border-grayScale-200 bg-white px-10 font-bold text-grayScale-600 shadow-none transition-all sm:w-auto"
          >
            Save as Draft
          </Button>
          <Button
            onClick={onPublish}
            disabled={!isConfirmed}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-3 rounded-[6px] px-10 font-bold text-white shadow-xl transition-all active:scale-95 sm:w-auto",
              isConfirmed
                ? "bg-[#9E2891] shadow-[#9E2891]/20 hover:bg-[#8A237E]"
                : "cursor-not-allowed bg-grayScale-200 opacity-50",
            )}
          >
            <Rocket className="h-5 w-5" />
            Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add GripVertical helper since it might not be imported from lucide-react if I missed it
function GripVertical({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-0.5", className)}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-0.5 w-0.5 rounded-full bg-current" />
      ))}
    </div>
  );
}
