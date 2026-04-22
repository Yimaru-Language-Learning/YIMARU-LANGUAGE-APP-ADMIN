import { GripVertical, Trash2, Plus, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { VoicePrompt } from "./VoicePrompt";

interface QuestionsStepProps {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function QuestionsStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: QuestionsStepProps) {
  const addQuestion = () => {
    const newQuestion = {
      id: `q${formData.questions.length + 1}`,
      text: "",
      type: "Speaking",
      voicePrompt: "upload_audio.mp3",
      sampleAnswer: "upload_audio.mp3",
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 px-2">
        <h2 className="text-2xl font-extrabold text-grayScale-700">
          Create Practice Questions
        </h2>
        <p className="text-grayScale-400 text-lg">
          Define the dialogue flow and interactions for this scenario.
        </p>
      </div>
      <div className="space-y-6">
        {formData.questions.map((q: any, i: number) => (
          <Card
            key={q.id}
            className="overflow-hidden border-grayScale-50 shadow-soft rounded-2xl bg-white relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-brand-500" />
            <div className="px-5 pb-7 pt-2 space-y-6">
              <div className="flex items-center justify-between border-b border-grayScale-50 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-brand-500 cursor-grab" />
                  <span className="font-bold text-grayScale-500 text-lg">
                    Question {i + 1}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-brand-500 hover:bg-brand-50 rounded-lg"
                  onClick={() => {
                    const newQuestions = formData.questions.filter(
                      (item: any) => item.id !== q.id,
                    );
                    setFormData({ ...formData, questions: newQuestions });
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-3">
                  <label className="text-[10px] font-bold text-grayScale-700 uppercase tracking-widest">
                    QUESTION PROMPT
                  </label>
                  <Input
                    value={q.text}
                    onChange={(e) => {
                      const newQuestions = [...formData.questions];
                      newQuestions[i].text = e.target.value;
                      setFormData({ ...formData, questions: newQuestions });
                    }}
                    className="h-16 rounded-xl border-grayScale-200 focus:border-brand-500 font-medium px-6 text-lg placeholder:text-grayScale-300 bg-white"
                    placeholder="e.g. How long have you been studying English?"
                  />
                </div>
                <div className="md:col-span-4 space-y-3">
                  <label className="text-[10px] font-bold text-grayScale-700 uppercase tracking-widest">
                    VOICE PROMPT
                  </label>
                  <VoicePrompt filename={q.voicePrompt} />
                </div>
              </div>
              <div className="md:w-1/3 space-y-3">
                <label className="text-[10px] font-bold text-grayScale-700 uppercase tracking-widest">
                  SAMPLE ANSWER PROMPT
                </label>
                <VoicePrompt filename={q.sampleAnswer} />
              </div>
            </div>
          </Card>
        ))}
        <div className="flex items-center gap-8 pt-4">
          <button
            onClick={addQuestion}
            className="flex items-center gap-3 text-brand-500 font-bold text-base hover:opacity-80 transition-all"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-500">
              <Plus className="h-3 w-3 stroke-[4]" />
            </div>{" "}
            Add New Question
          </button>
          <button className="flex items-center gap-3 text-brand-500 font-bold text-base hover:opacity-80 transition-all">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-500">
              <Plus className="h-3 w-3 stroke-[4]" />
            </div>{" "}
            Add Tips
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-8">
        <Button
          onClick={prevStep}
          variant="outline"
          className="h-12 w-28 rounded-xl border-grayScale-200 font-bold text-grayScale-600 shadow-sm"
        >
          Back
        </Button>
        <Button
          onClick={nextStep}
          className="h-12 rounded-xl bg-brand-500 px-8 font-bold hover:bg-brand-600 shadow-md shadow-brand-500/20"
        >
          Next: Review <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
