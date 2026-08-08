import { Edit2, Trash2, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { cn } from "../../../../lib/utils";

interface ProgramAttachReviewStepProps {
  formData: any;
  prevStep: () => void;
  onPublish: () => void;
  onCancel: () => void;
}

const MOCK_QUESTIONS = [
  {
    id: "q1",
    title: "1. Speak About The Photo",
    description:
      'Passage: "Good morning, everyone. I\'d like to start by reviewing the quarterly figures. As you can see from the chart..."',
  },
  {
    id: "q2",
    title: "2. Fill In the Blank",
    description:
      'Passage: "Attention passengers on Flight 492 to London. We are now inviting passengers with small children..."',
  },
  {
    id: "q3",
    title: "3. Writing Part 1",
    description:
      'Passage: "In today\'s lecture on astrophysics, we will discuss the concept of event horizons and their implications..."',
  },
];

export function ProgramAttachReviewStep({
  formData,
  prevStep,
  onPublish,
  onCancel,
}: ProgramAttachReviewStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Questions List */}
      <div className="space-y-6">
        {MOCK_QUESTIONS.map((q) => (
          <Card
            key={q.id}
            className="group relative flex border-grayScale-200 rounded-2xl bg-white  overflow-hidden  transition-all"
          >
            {/* Grip Area */}
            <div className="w-[50px] flex items-center justify-center bg-white border-r border-grayScale-200">
              <GripVertical className="h-3 w-3 text-grayScale-600" />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 py-10">
              <h4 className="text-[18px] font-medium text-[#0F172A] mb-3 leading-tight">
                {q.title}
              </h4>
              <p className="text-[14px] text-grayScale-400  leading-relaxed line-clamp-2">
                {q.description}
              </p>
            </div>

            {/* Actions Area (Vertical Stack) */}
            <div className="w-[50px] border-l border-grayScale-200 flex flex-col items-center justify-center divide-y divide-grayScale-50">
              <button className="flex-1 w-full flex items-center justify-center text-grayScale-600 hover:text-brand-500 transition-colors border-b border-grayScale-200">
                <Edit2 className="h-4 w-4" />
              </button>
              <button className="flex-1 w-full flex items-center justify-center text-grayScale-600 hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse gap-3 rounded-[12px] border border-grayScale-200 bg-[#F8FAFC] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Button
          onClick={onCancel}
          variant="outline"
          className="h-10 w-full rounded-[6px] border-grayScale-100 bg-white px-6 text-lg font-bold text-grayScale-500 transition-all hover:bg-grayScale-50 sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={onPublish}
          className="flex h-10 w-full items-center justify-center gap-3 rounded-[6px] bg-[#9E2891] px-10 text-[16px] font-medium text-white transition-all active:scale-95 sm:w-auto"
        >
          Next: Review & Publish
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// GripVertical helper
function GripVertical({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-0.5", className)}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-1 w-1 rounded-full bg-current" />
      ))}
    </div>
  );
}
