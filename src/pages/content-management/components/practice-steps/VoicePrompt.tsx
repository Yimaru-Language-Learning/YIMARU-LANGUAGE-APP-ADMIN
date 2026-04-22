import { Play, X } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";

interface VoicePromptProps {
  filename: string;
  className?: string;
}

export function VoicePrompt({ filename, className }: VoicePromptProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-brand-50/5 rounded-xl border border-grayScale-50 h-20 shadow-sm",
        className,
      )}
    >
      <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-md flex-shrink-0 cursor-pointer hover:bg-brand-600 transition-colors">
        <Play className="h-5 w-5 fill-current ml-1" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-6 flex items-end gap-[2px] px-1 overflow-hidden opacity-40 mb-1">
          {[...Array(20)].map((_, idx) => (
            <div
              key={idx}
              className="w-[3px] bg-brand-500 rounded-full"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
        <p className="text-[10px] font-bold text-brand-500 truncate">
          {filename}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-grayScale-300  rounded-lg"
      >
        <X className="h-5 w-5" color="#9E2891" />
      </Button>
    </div>
  );
}
