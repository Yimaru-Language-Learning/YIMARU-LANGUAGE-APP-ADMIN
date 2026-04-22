import { useRef, useEffect } from "react";
import {
  Video,
  List,
  Link as LinkIcon,
  Lightbulb,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Select } from "../../../../components/ui/select";

interface VideoDetailStepProps {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
}

export function VideoDetailStep({
  formData,
  setFormData,
  nextStep,
}: VideoDetailStepProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Initialize editor content only once or when needed from outside
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      editorRef.current.innerHTML = formData.description || "";
    }
  }, []);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    syncState();
  };

  const syncState = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      setFormData({ ...formData, description: editorRef.current.innerHTML });
      // Reset after a short delay to allow exterior updates if any (e.g., from step change)
      setTimeout(() => {
        isInternalChange.current = false;
      }, 0);
    }
  };

  const handleInput = () => {
    syncState();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1200px] mx-auto pb-20">
      {/* Single Unified Card for Everything */}
      <div className="bg-white rounded-[24px] border border-grayScale-50 p-10 shadow-sm space-y-12">
        {/* 1. Upload Video Section */}
        <div className="space-y-6">
          <h3 className="text-[20px] font-bold text-grayScale-900 ml-1">
            Upload Video
          </h3>
          <div className="relative group cursor-pointer">
            <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC]/30 p-14 transition-all hover:border-brand-200 hover:bg-brand-50/5">
              <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <div className="h-10 w-10 rounded-full bg-[#FAF5FF] flex items-center justify-center">
                  <div className="h-6 w-6 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-brand-500/10 rounded-full blur-sm" />
                    <Video className="h-5 w-5 text-brand-500 relative" />
                  </div>
                </div>
              </div>
              <h4 className="text-[17px] font-bold text-grayScale-900 mb-2">
                Drag and drop video files here
              </h4>
              <p className="text-grayScale-400 font-medium text-[13px] mb-8">
                MP4, MOV, WebM. Max size 2GB.
              </p>

              <div className="flex items-center gap-4 w-full max-w-[200px] mb-8">
                <div className="flex-1 h-[1px] bg-grayScale-100" />
                <span className="text-[10px] font-bold text-grayScale-300 uppercase tracking-widest">
                  OR
                </span>
                <div className="flex-1 h-[1px] bg-grayScale-100" />
              </div>

              <Button
                variant="outline"
                className="h-11 px-8 rounded-xl border-grayScale-200 bg-white font-bold text-brand-500 hover:border-brand-500 hover:bg-brand-50 transition-all shadow-sm text-sm"
              >
                Browse Files
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Form & Side Panel Grid */}
        <div className="flex flex-col lg:flex-row gap-12 items-start pt-4 border-t border-grayScale-50">
          {/* Left Column: Title, Order, Description */}
          <div className="flex-1 w-full space-y-10">
            <div className="space-y-3">
              <label className="text-[14px] font-bold text-grayScale-900 ml-1">
                Video Title
              </label>
              <Input
                placeholder="e.g., Introduction to Past Tense Verbs"
                className="h-14 rounded-xl border-grayScale-100 bg-white px-6 text-[15px] text-grayScale-800 placeholder:text-grayScale-300 focus:border-brand-500 font-medium transition-all shadow-sm"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[14px] font-bold text-grayScale-900 ml-1">
                Video Order
              </label>
              <Select
                className="h-14 rounded-xl border-grayScale-100 bg-white px-6 text-[15px] text-grayScale-800 font-medium cursor-pointer focus:border-brand-500 shadow-sm"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: (e.target as any).value })
                }
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[14px] font-bold text-grayScale-900 ml-1">
                Description
              </label>
              <div className="rounded-xl border border-grayScale-100 bg-white overflow-hidden flex flex-col min-h-[380px] shadow-sm focus-within:border-brand-200 transition-all">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-[#F8FAFC]">
                  <div className="flex items-center gap-1 w-fit bg-transparent px-2 py-1 rounded-lg">
                    <button
                      onClick={() => handleCommand("bold")}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-grayScale-900 transition-all font-serif font-bold text-[17px] pb-0.5 active:bg-grayScale-50"
                    >
                      B
                    </button>
                    <button
                      onClick={() => handleCommand("italic")}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-grayScale-900 transition-all font-serif italic text-[17px] pr-0.5 active:bg-grayScale-50"
                    >
                      I
                    </button>
                    <button
                      onClick={() => handleCommand("insertUnorderedList")}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-grayScale-900 transition-all active:bg-grayScale-50"
                    >
                      <List className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        const url = prompt("Enter URL:");
                        if (url) handleCommand("createLink", url);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-grayScale-900 transition-all active:bg-grayScale-50"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="relative p-6 flex-1">
                  {(!formData.description ||
                    formData.description === "<br>" ||
                    formData.description === "" ||
                    formData.description === "<div><br></div>") && (
                    <div className="absolute top-6 left-6 text-grayScale-300 font-medium text-[15px] pointer-events-none">
                      Provide a brief summary of what the student will learn...
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="w-full h-full min-h-[300px] focus:outline-none text-[15px] text-grayScale-700 font-medium leading-relaxed prose prose-sm max-w-none"
                    // Removed dangerouslySetInnerHTML to prevent cursor jumping
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Thumbnail, Pro Tip */}
          <div className="w-full lg:w-[320px] space-y-10">
            {/* Thumbnail Section */}
            <div className="space-y-4">
              <div className="space-y-1 ml-1">
                <h3 className="text-[14px] font-bold text-grayScale-900">
                  Thumbnail
                </h3>
                <p className="text-[12px] text-grayScale-400 font-medium leading-relaxed">
                  Upload your video thumbnail. 1280×720px recommended.
                </p>
              </div>
              <div className="relative group cursor-pointer aspect-video">
                <div className="h-full w-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC]/50 p-6 transition-all group-hover:border-brand-200">
                  <div className="h-10 w-10 rounded bg-white shadow-sm flex items-center justify-center mb-3">
                    <ImageIcon className="h-5 w-5 text-grayScale-400" />
                  </div>
                  <p className="text-[13px] font-bold text-brand-500">
                    Click to upload
                  </p>
                </div>
              </div>
            </div>

            {/* Pro Tip Section */}
            <div className="bg-[#FAF5FF] rounded-xl border border-[#F3E8FF] p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-white flex items-center justify-center border border-[#F3E8FF] shadow-sm">
                  <Lightbulb className="h-4 w-4 text-brand-50" fill="#A855F7" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-brand-500" />
                  </div>
                </div>
                <h3 className="text-[14px] font-bold text-grayScale-900">
                  Pro Tip
                </h3>
              </div>
              <p className="text-[12px] text-grayScale-700 font-medium leading-relaxed">
                Short, descriptive titles work best. Include keywords like
                "Grammar" or "Vocabulary" to help students find your content.
              </p>
            </div>
          </div>
        </div>

        {/* Footer (Inside Card Container) */}
        <div className="pt-10 border-t border-grayScale-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-[14px] font-bold text-grayScale-400">
              Last saved: Just now
            </span>
          </div>
          <Button
            onClick={nextStep}
            className="h-12 px-10 rounded-xl bg-brand-500 font-bold text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 text-sm group active:scale-95"
          >
            Continue
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
