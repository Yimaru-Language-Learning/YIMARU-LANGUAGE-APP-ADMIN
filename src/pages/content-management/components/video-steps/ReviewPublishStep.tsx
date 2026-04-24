import {
  Rocket,
  Edit2,
  Layout,
  Volume2,
  Settings,
  Maximize2,
} from "lucide-react";
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

            {/* Bottom Controls — Matching Image 1884 */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/40 to-transparent space-y-4">
              {/* Row 1: Seeker and Timestamps */}
              <div className="flex items-center gap-4 text-white">
                <span className="text-[13px] font-medium opacity-90">0:00</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full relative cursor-pointer overflow-hidden group/seeker">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-brand-500 rounded-full"
                    style={{ width: "40%" }}
                  />
                </div>
                <span className="text-[13px] font-medium opacity-90">
                  12:30
                </span>
              </div>

              {/* Row 2: Icons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-6">
                  <Volume2 className="h-[22px] w-[22px] opacity-90 cursor-pointer hover:opacity-100 transition-opacity" />
                  <div className="h-5 w-6 border-2 border-white rounded-[3px] flex items-center justify-center text-[9px] font-bold opacity-90 cursor-pointer hover:opacity-100 transition-opacity">
                    CC
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Settings className="h-5 w-5 opacity-90 cursor-pointer hover:opacity-100 transition-opacity" />
                  <Maximize2 className="h-5 w-5 opacity-90 cursor-pointer hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content Details Card */}
      <div className="bg-white rounded-[16px] border border-grayScale-50 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-grayScale-50 flex items-center justify-between bg-white">
          <h3 className="text-[16px] font-bold text-grayScale-900">
            Content Details
          </h3>
          <button
            onClick={prevStep}
            className="flex items-center gap-2 text-brand-500 font-bold text-sm hover:opacity-80 transition-opacity"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
                TITLE
              </span>
              <p className="text-[15px] font-medium text-grayScale-900">
                {formData.title || "Introduction to Past Tense"}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
                ASSIGNED MODULE
              </span>
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-grayScale-400" />
                <p className="text-[14px] font-medium text-grayScale-700">
                  Grammar Basics - Level 1
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
                TEACHER NAME
              </span>
              <p className="text-[15px] font-medium text-grayScale-600">
                Abebe Kebede
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
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
            <span className="text-[11px] font-bold text-grayScale-500 uppercase tracking-widest block">
              DESCRIPTION
            </span>
            <div
              className="text-[14px] text-grayScale-600  leading-relaxed max-w-4xl"
              dangerouslySetInnerHTML={{
                __html:
                  formData.description ||
                  "This video covers the fundamental rules of forming the past tense in English, focusing on regular verbs ending in -ed. Suitable for beginners. Includes examples and common pitfalls.",
              }}
            />
          </div>
        </div>

        {/* Gradient Divider */}
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-grayScale-200" />
          </div>
          <div className="relative flex justify-center">
            <div
              className="h-[0.5px] w-full opacity-20 rounded-full"
              style={{
                background: "gray",
              }}
            />
          </div>
        </div>

        {/* 3. Normal Footer (Inside Card) */}
        <div className="px-8 py-6 border-t border-grayScale-50 flex items-center justify-between bg-white">
          <Button
            variant="outline"
            onClick={prevStep}
            className="h-10 px-8 rounded-xl border-grayScale-200 font-bold text-grayScale-600 hover:bg-grayScale-50 transition-all shadow-sm"
          >
            Back
          </Button>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="h-12 px-8 rounded-[6px] border-grayScale-100 font-bold text-grayScale-600 hover:bg-grayScale-50 transition-all shadow-sm"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => setIsPublished(true)}
              className="h-10 px-10 rounded-[6px] bg-brand-500 font-bold text-white  shadow-brand-500/20 transition-all flex items-center gap-2.5"
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
