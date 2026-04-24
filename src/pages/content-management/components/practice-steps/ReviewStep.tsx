import { Edit2, GripVertical, Trash2, Rocket, Info } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { PERSONAS } from "./constants";
import { VoicePrompt } from "./VoicePrompt";

interface ReviewStepProps {
  formData: any;
  selectedPersona: string | null;
  prevStep: () => void;
  setIsPublished: (val: boolean) => void;
  isModuleContext?: boolean;
}

export function ReviewStep({
  formData,
  selectedPersona,
  prevStep,
  setIsPublished,
  isModuleContext,
}: ReviewStepProps) {
  const persona = PERSONAS.find((p) => p.id === selectedPersona);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-grayScale-900 tracking-tight">
          Review Practice Questions
        </h2>
      </div>

      {/* 1. Basic Info Card (Image 1436.1) */}
      <Card className="overflow-hidden border border-grayScale-200 rounded-2xl bg-white ">
        <div className="border-b border-grayScale-50 p-4 px-5 flex justify-between items-center bg-white">
          <h3 className="text-[17px] font-extrabold text-grayScale-900">
            Basic Information
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-500 font-bold hover:bg-brand-50 gap-2 h-9"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </div>
        {/* Gradient Divider */}
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-grayScale-100" />
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
        <div className="p-8 px-5 flex items-center justify-between ">
          <div className="flex items-center gap-6">
            <div className="h-[70px] w-[85px] rounded-xl bg-grayScale-100 overflow-hidden shadow-inner flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=200"
                alt="Banner"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-[22px] font-bold text-grayScale-900 leading-tight">
                {formData.title || "Business English 101: Communication"}
              </h4>
              <div className="flex items-center gap-6 text-[14px]">
                <span className="text-grayScale-900 ">
                  Program:{" "}
                  <span className="text-brand-500 ">{formData.program}</span>
                </span>
                <span className="text-grayScale-900 ">
                  Course:{" "}
                  <span className="text-brand-500 ">{formData.course}</span>
                </span>
                <span className="text-grayScale-900 font-bold">
                  Module:{" "}
                  <span className="text-brand-500 font-extrabold">
                    Module 101
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] text-left font-medium text-grayScale-900 ">
              Persona
            </span>
            <div className="flex items-center gap-2 bg-[#FAF5FF] py-1 pl-2.5 pr-4 rounded-full border border-brand-100/30">
              <Avatar className="h-8 w-8 border-2 border-white shadow-sm font-bold">
                <AvatarImage src={persona?.avatar} />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
              <span className="text-[14px]  text-brand-500 capitalize">
                {persona?.name || "Alex Johnson"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Tips Section (Image 1436.1) */}
      <div className="space-y-4 px-2">
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-bold text-grayScale-900 uppercase tracking-widest leading-none">
            TIPS / GUIDANCE
          </label>
          <Info className="h-4 w-4 text-brand-500" />
        </div>
        <div className="px-5 pt-2 pb-8 bg-white border border-[#E2E8F0] shadow-sm rounded-xl">
          <p className="text-[14px] text-grayScale-500 font-medium leading-relaxed">
            {formData.tips ||
              "Focus on using the present perfect continuous tense to describe an action that started in the past and continues now."}
          </p>
        </div>
      </div>

      {isModuleContext ? (
        /* 3. Split Questions & Answers Layout (Image 1413.1) */
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-[12px] border border-grayScale-50 shadow-sm overflow-hidden min-h-[600px]">
          {/* Left Column: Questions */}
          <div className="border-r border-grayScale-200 flex flex-col">
            <div className="p-4  border-b border-grayScale-50 flex items-center gap-3 bg-white">
              <h3 className="text-[16px] font-extrabold text-[#0F172A]">
                Questions
              </h3>
              <span className="h-6 w-6 rounded-full bg-grayScale-100 flex items-center justify-center text-[12px] font-extrabold text-grayScale-500">
                {formData.questions.length}
              </span>
            </div>
            <div className="p-4 space-y-14">
              {formData.questions.map((q: any, i: number) => (
                <div key={q.id} className="relative pl-12">
                  <span className="absolute left-0 top-0 text-[18px] font-bold text-grayScale-400 tracking-tighter opacity-70">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <span className="text-[11px] font-extrabold text-grayScale-600 uppercase tracking-[0.1em] block">
                        TEXT PROMPT
                      </span>
                      <p className="text-[16px] font-medium text-grayScale-600 leading-relaxed max-w-[90%]">
                        {q.text}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <span className="text-[11px] font-extrabold text-grayScale-300 uppercase tracking-[0.1em] block">
                        VOICE PROMPT
                      </span>
                      <VoicePrompt
                        filename={q.voicePrompt}
                        className="bg-[#FAF5FF]/60 border-[#F3E8FF] h-[72px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Answers */}
          <div className="flex flex-col">
            <div className="p-4 border-b border-grayScale-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <h3 className="text-[16px] font-extrabold ">Answers</h3>
                <span className="h-6 w-6 rounded-full bg-grayScale-100  flex items-center justify-center text-[12px] font-extrabold text-grayScale-500">
                  {formData.questions.length}
                </span>
              </div>
              <button className="flex items-center gap-2 text-brand-500 font-bold text-[15px] hover:opacity-80 transition-opacity">
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
            </div>
            <div className="p-4 space-y-14">
              {formData.questions.map((q: any, i: number) => (
                <div key={q.id + "_ans"} className="relative pl-12">
                  <span className="absolute left-0 top-0 text-[18px] font-bold text-grayScale-400 tracking-tighter opacity-70">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="space-y-4">
                    <span className="text-[11px] font-extrabold text-grayScale-600 uppercase tracking-[0.1em] block">
                      VOICE PROMPT
                    </span>
                    <VoicePrompt
                      filename={q.sampleAnswer}
                      className="bg-[#FAF5FF]/60 border-[#F3E8FF] h-[60px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Original Non-Module View */
        <div className="space-y-6">
          {formData.questions.map((q: any, i: number) => (
            <ReviewItem key={q.id} q={q} index={i} />
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-12">
        <Button
          onClick={prevStep}
          variant="outline"
          className="h-10 px-10 rounded-[6px] border-grayScale-200 font-bold text-grayScale-600 bg-white shadow-sm hover:bg-grayScale-50 transition-all text-sm"
        >
          Back
        </Button>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="h-10 px-8 rounded-[6px] border-grayScale-100 font-bold text-grayScale-600 bg-white shadow-sm hover:bg-grayScale-50 transition-all text-sm"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => setIsPublished(true)}
            className="h-10 px-10 rounded-[6px] bg-brand-500 font-bold hover:bg-brand-600 shadow-xl shadow-brand-500/20 gap-3 active:scale-95 transition-all text-white text-sm"
          >
            <Rocket className="h-4 w-4" />
            Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ q, index }: { q: any; index: number }) {
  return (
    <Card className="overflow-hidden border-grayScale-50 shadow-soft rounded-2xl bg-white relative">
      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-brand-500" />
      <div className="px-5 pb-7 pt-2 space-y-6">
        <div className="flex items-center justify-between border-b border-grayScale-50 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-brand-500 cursor-grab" />
            <span className="font-bold text-grayScale-500 text-base">
              Question {index + 1}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-brand-500 hover:bg-brand-50 rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-3">
            <label className="text-[10px] font-bold text-grayScale-700 uppercase tracking-widest">
              QUESTION PROMPT
            </label>
            <Input
              value={q.text}
              readOnly
              className="h-16 rounded-xl border-grayScale-200 font-medium px-6 text-base placeholder:text-grayScale-400 bg-white text-grayScale-700"
              placeholder="e.g. How long have you been studying English?"
            />
          </div>
          <div className="md:col-span-4 space-y-3">
            <label className="text-[10px] font-bold text-grayScale-700 uppercase tracking-widest">
              VOICE PROMPT
            </label>
            <VoicePrompt
              src={q.voicePrompt}
              filename={q.voicePrompt}
              onRemove={() => {}}
            />
          </div>
        </div>
        <div className="md:w-1/3 space-y-3">
          <label className="text-[10px] font-bold text-grayScale-700 uppercase tracking-widest">
            SAMPLE ANSWER PROMPT
          </label>
          <VoicePrompt
            src={q.sampleAnswer}
            filename={q.sampleAnswer}
            onRemove={() => {}}
          />
        </div>
      </div>
    </Card>
  );
}
