import { Rocket, Edit2, Layout } from "lucide-react";
import { Button } from "../../../../components/ui/button";

interface ReviewPublishStepProps {
  formData: any;
  prevStep: () => void;
  setIsPublished: (val: boolean) => void;
}

export function ReviewPublishStep({
  formData,
  prevStep,
  setIsPublished,
}: ReviewPublishStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 1. Video Preview Card */}
      <div className="bg-white rounded-[16px] border border-grayScale-50 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-grayScale-50 flex items-center justify-between bg-white">
          <h3 className="text-[17px] font-bold text-grayScale-900">
            Video Preview
          </h3>
          <span className="bg-[#FAF5FF] text-brand-500 text-[10px] font-bold px-3 py-1.5 rounded-[6px] tracking-wider uppercase border border-brand-100/50">
            PROCESSED
          </span>
        </div>
        <div className="p-10 flex items-center justify-center bg-[#F8FAFC]/30">
          <div className="relative w-full max-w-4xl aspect-video rounded-[12px] overflow-hidden bg-black shadow-2xl group border-4 border-white">
            {/* Mock Player Control Overlays */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 cursor-pointer hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
              </div>
            </div>

            {/* Bottom Controls Placeholder */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="h-1.5 w-full bg-white/20 rounded-full mb-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-brand-500" />
                <div className="absolute left-1/3 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-lg" />
              </div>
              <div className="flex items-center justify-between text-white/90 text-sm font-medium">
                <span>0:00 / 12:30</span>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-6 border-2 border-white/40 rounded-[2px]" />
                  <div className="h-4 w-4 border-2 border-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content Details Card */}
      <div className="bg-white rounded-[16px] border border-grayScale-50 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-grayScale-50 flex items-center justify-between bg-white">
          <h3 className="text-[17px] font-bold text-grayScale-900">
            Content Details
          </h3>
          <button
            onClick={prevStep}
            className="flex items-center gap-2 text-brand-500 font-bold text-sm hover:opacity-80 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-300 uppercase tracking-widest block">
                TITLE
              </span>
              <p className="text-[15px] font-bold text-grayScale-900">
                {formData.title || "Introduction to Past Tense"}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-300 uppercase tracking-widest block">
                ASSIGNED MODULE
              </span>
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-grayScale-400" />
                <p className="text-[14px] font-bold text-grayScale-700">
                  Grammar Basics - Level 1
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-300 uppercase tracking-widest block">
                TEACHER NAME
              </span>
              <p className="text-[15px] font-bold text-grayScale-600">
                Abebe Kebede
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-300 uppercase tracking-widest block">
                FILE SIZE
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold text-grayScale-900">
                  245 MB
                </span>
                <span className="text-[13px] text-grayScale-400 font-medium">
                  (1080p MP4)
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-grayScale-300 uppercase tracking-widest block">
              DESCRIPTION
            </span>
            <div
              className="text-[14px] text-grayScale-600 font-medium leading-relaxed max-w-4xl"
              dangerouslySetInnerHTML={{
                __html:
                  formData.description ||
                  "This video covers the fundamental rules of forming the past tense in English, focusing on regular verbs ending in -ed. Suitable for beginners. Includes examples and common pitfalls.",
              }}
            />
          </div>
        </div>

        {/* 3. Normal Footer (Inside Card) */}
        <div className="px-8 py-6 border-t border-grayScale-50 flex items-center justify-between bg-white">
          <Button
            variant="outline"
            onClick={prevStep}
            className="h-12 px-8 rounded-xl border-grayScale-200 font-bold text-grayScale-600 hover:bg-grayScale-50 transition-all shadow-sm"
          >
            Back
          </Button>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="h-12 px-8 rounded-xl border-grayScale-100 font-bold text-grayScale-600 hover:bg-grayScale-50 transition-all shadow-sm"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => setIsPublished(true)}
              className="h-12 px-10 rounded-xl bg-brand-500 font-bold text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2.5"
            >
              <Rocket className="h-4 w-4" />
              Publish Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
