import { Edit2, Trash2, Mic2, Keyboard, Layers, MicIcon } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Card } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";

interface QuestionTypeCardProps {
  title: string;
  exam: "DUOLINGO" | "IELTS" | "TOEFL";
  skill: "Speaking" | "Writing" | "Listening" | "Reading";
  variations: number;
  status: "Published" | "Draft" | "Archived";
}

export function QuestionTypeCard({
  title,
  exam,
  skill,
  variations,
  status,
}: QuestionTypeCardProps) {
  const SkillIcon = skill === "Speaking" ? MicIcon : Keyboard;

  const examColors = {
    DUOLINGO: "bg-[#22C55EE5] text-[#fff] border-transparent",
    IELTS: "bg-[#EF4444E5] text-[#fff] border-transparent",
    TOEFL: "bg-[#DBEAFE] text-[#fff] border-transparent",
  };

  const statusColors = {
    Published: "bg-[#F0FDF4] text-[#16A34A]",
    Draft: "bg-grayScale-50 text-grayScale-500",
    Archived: "bg-red-50 text-red-500",
  };

  return (
    <Card className="group overflow-hidden border-grayScale-200 rounded-[12px] bg-white  transition-all duration-300">
      <div className="px-4 py-6 space-y-8">
        <h3 className="text-[20px] font-bold text-grayScale-900 leading-[1.2]">
          {title}
        </h3>

        <div className="flex items-center justify-between">
          <Badge
            className={cn(
              "px-3 py-1 rounded-[4px] text-[11px] font-bold tracking-wider shadow-none border-none",
              examColors[exam],
            )}
          >
            {exam}
          </Badge>
          <div className="flex items-center gap-1 text-grayScale-900 font-bold text-[13px]">
            <SkillIcon className="h-4 w-4" />
            {skill}
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[#9E2891] font-medium text-[15px]">
          <Layers className="h-[16px] w-[16px]" />
          {variations} Variations
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-grayScale-200">
          <Badge
            className={cn(
              "px-3 py-1 rounded-[4px] text-[12px] font-bold shadow-none border-none",
              statusColors[status],
            )}
          >
            {status}
          </Badge>
          <div className="flex items-center gap-5 transition-opacity">
            <button className="text-grayScale-500/70 transition-all">
              <Edit2 className="h-5 w-5" />
            </button>
            <button className="text-grayScale-500/70 transition-all">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
