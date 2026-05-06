import {
  useRef,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { List, Link as LinkIcon, Lightbulb, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import type { AddLessonFormData } from "../../AddVideoFlow";
import { LessonMediaUploadField } from "../LessonMediaUploadField";

function isDescriptionEmpty(raw: string): boolean {
  if (!raw?.trim()) return true;
  const t = raw.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  return t.length === 0;
}

interface VideoDetailStepProps {
  formData: AddLessonFormData;
  setFormData: Dispatch<SetStateAction<AddLessonFormData>>;
  onContinue: () => void;
}

export function VideoDetailStep({
  formData,
  setFormData,
  onContinue,
}: VideoDetailStepProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

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
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current!.innerHTML,
      }));
      setTimeout(() => {
        isInternalChange.current = false;
      }, 0);
    }
  };

  const handleInput = () => {
    syncState();
  };

  const handleContinue = () => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current!.innerHTML,
      }));
    }
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast.error("Add a video URL or upload a video");
      return;
    }
    if (!formData.thumbnailUrl.trim()) {
      toast.error("Add a thumbnail or upload an image");
      return;
    }
    const descHtml = editorRef.current?.innerHTML ?? formData.description;
    if (isDescriptionEmpty(descHtml)) {
      toast.error("Description is required");
      return;
    }
    onContinue();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1200px] mx-auto pb-20">
      <div className="bg-white rounded-[24px] border border-grayScale-50 p-10 shadow-sm space-y-8">
        <div className="space-y-3">
          <h3 className="text-[20px] font-bold text-grayScale-900 ml-1">
            Video
          </h3>
          <p className="text-sm text-grayScale-500 ml-1 max-w-2xl">
            Upload a file or paste a link (Vimeo, hosted file, etc.). Files are
            sent to your storage via{" "}
            <code className="rounded bg-grayScale-100 px-1 text-[11px]">
              POST /files/upload
            </code>
            .
          </p>
          <LessonMediaUploadField
            kind="video"
            value={formData.videoUrl}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, videoUrl: v }))
            }
          />
        </div>

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
              style={{ background: "gray" }}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 w-full space-y-10">
            <div className="space-y-3">
              <label className="text-[14px] font-medium text-grayScale-900 ml-1">
                Lesson title
              </label>
              <Input
                placeholder="e.g. Introduction to Past Tense"
                className="h-12 rounded-xl border-grayScale-200 bg-white px-6 text-[15px] text-grayScale-800 placeholder:text-grayScale-500 focus:border-brand-500 font-medium transition-all shadow-sm"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-3">
              <label className="text-[14px] font-medium text-grayScale-900 ml-1">
                Description
              </label>
              <div className="rounded-xl border border-grayScale-200 bg-white overflow-hidden flex flex-col min-h-[200px] shadow-sm focus-within:border-brand-200 transition-all">
                <div className="flex items-center gap-1  bg-[#F8FAFC]">
                  <div className="flex items-center gap-1 w-fit bg-transparent px-2 py-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleCommand("bold")}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-grayScale-900 transition-all font-serif font-bold text-[17px] pb-0.5 active:bg-grayScale-50"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommand("italic")}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-grayScale-900 transition-all font-serif italic text-[17px] pr-0.5 active:bg-grayScale-50"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommand("insertUnorderedList")}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-grayScale-900 transition-all active:bg-grayScale-50"
                    >
                      <List className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
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
                  {isDescriptionEmpty(formData.description) && (
                    <div className="absolute top-6 left-6 text-grayScale-300 font-medium text-[15px] pointer-events-none">
                      What will students learn in this lesson?
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="w-full min-h-[140px] focus:outline-none text-[15px] text-grayScale-700 font-medium leading-relaxed prose prose-sm max-w-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[360px] space-y-5">
            <LessonMediaUploadField
              kind="thumbnail"
              value={formData.thumbnailUrl}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, thumbnailUrl: v }))
              }
            />
            <div className="bg-brand-500/5 flex items-start gap-3 rounded-xl border border-[#F3E8FF] p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center">
                  <Lightbulb
                    className="h-4 w-4 text-brand-50"
                    fill="#A855F7"
                  />
                </div>
              </div>
              <div className="relative top-[-10px]">
                <h3 className="text-[14px] font-bold text-grayScale-900">
                  Pro tip
                </h3>
                <p className="text-[12px] text-grayScale-700 font-medium leading-relaxed">
                  Use clear titles and a thumbnail that matches the lesson. The
                  lesson is created with{" "}
                  <code className="rounded bg-white/80 px-1 text-[10px]">
                    POST /modules/:moduleId/lessons
                  </code>{" "}
                  when you publish.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-grayScale-200 flex items-center justify-end">
          <Button
            type="button"
            onClick={handleContinue}
            className="h-10 px-10 rounded-[6px] bg-brand-500 font-bold text-white transition-all flex items-center gap-2 text-sm group active:scale-95"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
