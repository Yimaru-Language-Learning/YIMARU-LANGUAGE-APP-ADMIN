import { MoreVertical, Edit2, Play } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

interface VideoCardProps {
  id: string;
  title: string;
  duration: string;
  status: "Draft" | "Published";
  thumbnailGradient: string;
  onEdit?: () => void;
  onPublish?: () => void;
}

export function VideoCard({
  title,
  duration,
  status,
  thumbnailGradient,
  onEdit,
  onPublish,
}: VideoCardProps) {
  return (
    <div className="group bg-white rounded-[24px] border border-grayScale-50 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Thumbnail */}
      <div
        className={cn(
          "relative h-44 w-full bg-gradient-to-br",
          thumbnailGradient,
        )}
      >
        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
          {duration}
        </div>
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          {/* Status Badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
              status === "Published"
                ? "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]"
                : "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "Published" ? "bg-[#10B981]" : "bg-[#9CA3AF]",
              )}
            />
            {status}
          </div>
          {/* Menu */}
          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-grayScale-50 transition-colors text-grayScale-400">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-[17px] font-bold text-grayScale-900 line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* Actions */}
        <div className="pt-2 space-y-3 mt-auto">
          <Button
            variant="outline"
            onClick={onEdit}
            className="w-full h-11 rounded-xl border-grayScale-100 text-grayScale-600 font-bold hover:bg-grayScale-50 transition-all flex items-center justify-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            disabled={status === "Published"}
            onClick={onPublish}
            className={cn(
              "w-full h-11 rounded-xl font-bold transition-all shadow-sm",
              status === "Published"
                ? "bg-[#E9D5E5] text-white opacity-100 cursor-default"
                : "bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/10",
            )}
          >
            {status === "Published" ? "Published" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
