import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Select } from "../../../../components/ui/select";
import { Badge } from "../../../../components/ui/badge";

interface QuestionTypeBasicInfoStepProps {
  onNext: () => void;
}

export function QuestionTypeBasicInfoStep({
  onNext,
}: QuestionTypeBasicInfoStepProps) {
  const [selectedChips, setSelectedChips] = useState([
    "Multiple Choice",
    "Sentence Completion",
  ]);
  const suggestions = ["Matching Headings", "True/False/NG"];

  const removeChip = (chip: string) => {
    setSelectedChips(selectedChips.filter((c) => c !== chip));
  };

  const addChip = (chip: string) => {
    if (!selectedChips.includes(chip)) {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <Card className="max-w-4xl mx-auto overflow-hidden border-grayScale-100 shadow-sm rounded-2xl bg-white">
        <div className="p-10 border-b border-grayScale-200">
          <h2 className="text-[20px] font-medium text-grayScale-900">
            STEP 1: Basic Info
          </h2>
          <p className="text-grayScale-500 font-medium mt-1">
            Define what this question type is and where it applies.
          </p>
        </div>

        <div className="p-10 space-y-10">
          {/* Top Row: Course Type & Skill Category */}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[14px] font-medium text-grayScale-700 flex items-center gap-1">
                Course Type <span className="text-red-500">*</span>
              </label>
              <Select className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] font-medium text-grayScale-900 transition-all ">
                <option>Select an exam type</option>
                <option>IELTS</option>
                <option>Duolingo</option>
                <option>TOEFL</option>
              </Select>
              <p className="text-grayScale-400 text-[13px] font-medium leading-relaxed">
                The core framework for the practice test.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[14px] font-medium text-grayScale-700 flex items-center gap-1">
                Skill Category <span className="text-red-500">*</span>
              </label>
              <Select className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] font-medium text-grayScale-900 transition-all ">
                <option>Select a skill</option>
                <option>Speaking</option>
                <option>Writing</option>
                <option>Listening</option>
                <option>Reading</option>
              </Select>
            </div>
          </div>

          {/* Question Type */}
          <div className="space-y-3">
            <label className="text-[14px] font-bold text-grayScale-700 flex items-center gap-1">
              Question Type <span className="text-red-500">*</span>
            </label>
            <Select className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] font-medium text-grayScale-900 transition-all ">
              <option>Single Format</option>
              <option>Mixed Format</option>
            </Select>
          </div>

          {/* Question Types Chip Input */}
          <div className="space-y-3">
            <label className="text-[14px] font-bold text-grayScale-700 flex items-center gap-1">
              Question Types <span className="text-red-500">*</span>
            </label>
            <div className="min-h-[56px] p-3 flex flex-wrap gap-2.5 rounded-[12px] border border-grayScale-300 bg-[#F8FAFC]">
              {selectedChips.map((chip) => (
                <Badge
                  key={chip}
                  className="bg-[#9E28911A] text-[#9E2891] border-[#9E289133] px-2 py-0 rounded-full text-[13px] font-medium flex items-center gap-2"
                >
                  {chip}
                  <button
                    onClick={() => removeChip(chip)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
              <input
                className="flex-1 min-w-[150px] bg-transparent border-none focus:ring-0 text-[14px] font-medium text-grayScale-900 px-3 placeholder:text-grayScale-400"
                placeholder="Add question types..."
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-[13px] font-medium text-grayScale-500">
                Suggestions:
              </span>
              <div className="flex items-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => addChip(s)}
                    className="px-3 py-1.5 rounded-[6px] border border-grayScale-300 text-[13px] font-medium text-grayScale-600 hover:bg-grayScale-50 hover:text-[#9E2891] hover:border-[#9E2891]/20 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border border-grayScale-200 flex items-center justify-between bg-[#F8FAFC]">
          <Button
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-none shadow-none text-grayScale-600 font-bold hover:bg-grayScale-100"
          >
            Cancel
          </Button>
          <Button
            onClick={onNext}
            className="h-10 px-10 rounded-[6px] bg-[#9E2891] font-medium text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all flex items-center gap-3"
          >
            Next: Structure
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
