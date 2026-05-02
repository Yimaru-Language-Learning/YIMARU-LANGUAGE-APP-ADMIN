import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  ArrowRight,
  Clock,
  Info,
  Volume2,
  FileText,
  Image as ImageIcon,
  Link2,
  CheckSquare,
  Table as TableIcon,
  GitBranch,
  Type,
  ListTodo,
  FileUp,
  GitCompare,
  MousePointer2,
  Mic2,
  Hourglass,
  Check,
  GripVertical,
  MinusCircle,
  UploadCloud,
  ArrowDown,
  Trash2,
  X,
  Sliders,
  Settings2,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { cn } from "../../../../lib/utils";

interface ConfigCardProps {
  icon: any;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function ConfigCard({ icon: Icon, label, selected, onClick }: ConfigCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start justify-between p-4 h-[140px] rounded-[16px] border transition-all group relative",
        selected
          ? "border-[#9E2891] bg-white shadow-[0_4px_12px_rgba(158,40,145,0.08)] ring-1 ring-[#9E2891]"
          : "border-grayScale-300 bg-white hover:border-grayScale-200 hover:bg-grayScale-25",
      )}
    >
      <div className="w-full flex items-start justify-between">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
            selected
              ? "bg-[#9E2891] text-white"
              : "bg-[#F1F5F9] text-grayScale-600 group-hover:bg-grayScale-100",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div
          className={cn(
            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all mt-1",
            selected
              ? "border-[#9E2891] bg-white"
              : "border-grayScale-300 bg-white",
          )}
        >
          {selected && (
            <Check className="h-3.5 w-3.5 text-[#9E2891] stroke-[3]" />
          )}
        </div>
      </div>

      <span
        className={cn(
          "text-[15px] font-bold text-left leading-tight",
          selected ? "text-grayScale-800" : "text-grayScale-800",
        )}
      >
        {label}
      </span>
    </button>
  );
}

interface QuestionTypeConfigStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function QuestionTypeConfigStep({
  onNext,
  onBack,
}: QuestionTypeConfigStepProps) {
  const [expandedSection, setExpandedSection] = useState(
    "Speak About the Photo",
  );
  const [selectedInputs, setSelectedInputs] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [matchingKeys, setMatchingKeys] = useState([
    "Verbose",
    "Succinct",
    "Ambiguous",
  ]);
  const [matchingValues, setMatchingValues] = useState([
    "Using more words than needed",
    "Briefly and clearly expressed",
    "Open to more than one interpretation",
  ]);
  const [shortQuestions, setShortQuestions] = useState([
    "Verbose",
    "Succinct",
    "Ambiguous",
  ]);
  const [shortAnswers, setShortAnswers] = useState([
    "Using more words than needed",
    "Briefly and clearly expressed",
    "Open to more than one interpretation",
  ]);
  const [answerKeyItems, setAnswerKeyItems] = useState(["C", "B", "A"]);
  const [selectedLabelSet, setSelectedLabelSet] = useState(
    "True / False / Not Given",
  );
  const [correctLabelAnswer, setCorrectLabelAnswer] = useState("True");
  const [mcOptions, setMcOptions] = useState([
    { label: "A", text: "The process of photosynthesis", isCorrect: false },
    { label: "B", text: "Cellular respiration in plants", isCorrect: true },
    { label: "C", text: "Enter option text...", isCorrect: false },
  ]);
  const [selectionMode, setSelectionMode] = useState<"Single" | "Multiple">(
    "Single",
  );
  const [missingWordTags, setMissingWordTags] = useState(["Jump", "Lazy"]);
  const [distractors, setDistractors] = useState<
    Record<string, { id: number; text: string }[]>
  >({
    Jump: [
      { id: 1, text: "sleepy" },
      { id: 2, text: "runs" },
    ],
    Lazy: [
      { id: 3, text: "sleepy" },
      { id: 4, text: "runs" },
    ],
  });
  const [tableRows, setTableRows] = useState([
    {
      id: "01",
      content: "Basic introduction and greetings",
      type: "Read Only",
    },
    {
      id: "02",
      content: "Identifying main ideas in simple text",
      type: "Learner Input",
    },
    { id: "03", content: "Understanding specific details", type: "Read Only" },
    { id: "04", content: "Inference and deduction skills", type: "Read Only" },
    { id: "05", content: "Vocabulary usage in context", type: "Learner Input" },
  ]);
  const [flowchartSteps, setFlowchartSteps] = useState([
    { id: 1, content: "Enter text for step 1...", isBlank: false },
    { id: 2, content: "Process Data", isBlank: true },
    { id: 3, content: "Enter text for step 3...", isBlank: false },
    { id: 4, content: "Enter text for step 4...", isBlank: false },
    { id: 5, content: "Enter text for step 5...", isBlank: false },
  ]);

  const inputTypes = [
    { label: "Prep Time", icon: Clock },
    { label: "Instruction", icon: Info },
    { label: "Audio Clip", icon: Volume2 },
    { label: "Text Passage", icon: FileText },
    { label: "Image", icon: ImageIcon },
    { label: "Matching Inputs", icon: Link2 },
    { label: "Select Missing Words", icon: ListTodo },
    { label: "Table", icon: TableIcon },
    { label: "Flow Chart", icon: GitBranch },
  ];

  const answerTypes = [
    { label: "Audio Clip", icon: Mic2 },
    { label: "Text Input", icon: Type },
    { label: "Short Answer", icon: ListTodo },
    { label: "Multiple Choice", icon: CheckSquare },
    { label: "Answer Timer", icon: Clock },
    { label: "Select Missing Words", icon: ListTodo },
    { label: "PDF Upload", icon: FileUp },
    { label: "Matching Answer", icon: GitCompare },
    { label: "Label Selection", icon: MousePointer2 },
  ];

  const toggleSelection = (list: string[], setList: any, label: string) => {
    if (list.includes(label)) {
      setList(list.filter((item) => item !== label));
    } else {
      setList([...list, label]);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Variation Accordion */}
      <div className="space-y-8">
        <div className="p-4  bg-[#9E289114] flex items-center justify-between cursor-pointer border rounded-[8px] border-[#9E289133]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-[#9E289133] flex items-center justify-center text-[#9E2891]">
              <Hourglass className="h-5 w-5" />
            </div>
            <h3 className="text-[18px] font-bold text-grayScale-900">
              Speak About the Photo
            </h3>
          </div>
          {expandedSection === "Speak About the Photo" ? (
            <ChevronUp className="h-6 w-6 text-brand-500" />
          ) : (
            <ChevronDown className="h-6 w-6 text-brand-500" />
          )}
        </div>

        <div className="space-y-3 bg-white p-4 rounded-2xl border border-grayScale-200">
          <label className="text-[14px] font-medium text-grayScale-700">
            Version Name <span className="text-red-500">*</span>
          </label>
          <Input
            className="h-12 rounded-[6px] border-grayScale-200 bg-[#F8FAFC] font-medium placeholder:text-grayScale-500"
            placeholder="Test 1"
          />
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* SECTION A */}
          <div className="bg-white p-6 rounded-2xl border border-grayScale-200 space-y-8">
            <div className="border-b border-grayScale-200 pb-4">
              <h4 className="text-[16px] font-medium text-grayScale-900 uppercase tracking-tight">
                SECTION A: Question Input Types
              </h4>
              <p className="text-grayScale-500 text-[14px] font-medium mt-1">
                Choose how the question is presented to the learner.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {inputTypes.map((type) => (
                <ConfigCard
                  key={type.label}
                  {...type}
                  selected={selectedInputs.includes(type.label)}
                  onClick={() =>
                    toggleSelection(
                      selectedInputs,
                      setSelectedInputs,
                      type.label,
                    )
                  }
                />
              ))}
            </div>

            {/* Dynamic Inputs for Section A */}
            {selectedInputs.length > 0 && (
              <div className="space-y-6 pt-8 border-t border-grayScale-100">
                {selectedInputs.map((input) => (
                  <div
                    key={input}
                    className="animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    {input === "Prep Time" ? (
                      <div className="space-y-3">
                        <label className="text-[14px] font-medium text-grayScale-800">
                          Prep Time
                        </label>
                        <div className="relative">
                          <Input
                            className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] font-medium text-grayScale-900 pr-12 placeholder:text-grayScale-400"
                            placeholder="90"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-grayScale-400">
                            SEC
                          </span>
                        </div>
                      </div>
                    ) : input === "Instruction" ? (
                      <div className="space-y-3">
                        <label className="text-[14px] font-medium text-grayScale-800">
                          Instruction Text
                        </label>
                        <Input
                          className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] font-medium text-grayScale-900 placeholder:text-grayScale-400"
                          placeholder="e.g., Look at the image and describe what you see..."
                        />
                      </div>
                    ) : input === "Image" ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[14px] font-medium text-grayScale-800">
                            Image Upload
                          </label>
                          <p className="text-[12px] font-medium text-grayScale-500">
                            Upload your image. 1280×720px recommended.
                          </p>
                        </div>
                        <div className="h-40 rounded-xl border-2 border-dashed border-grayScale-300 bg-[#F8FAFC] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-grayScale-50 transition-all">
                          <ImageIcon className="h-8 w-8 text-grayScale-400" />
                          <span className="text-[14px] font-medium text-[#9E2891]">
                            Click to upload
                          </span>
                        </div>
                      </div>
                    ) : input === "Text Passage" ? (
                      <div className="rounded-xl border border-grayScale-200 overflow-hidden bg-white">
                        <div className="p-4 flex items-center gap-3 bg-white">
                          <div className="h-10 w-10 rounded-lg bg-[#9E289114] flex items-center justify-center text-[#9E2891]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <h4 className="text-[16px] font-bold text-[#9E2891]">
                            Text Input
                          </h4>
                        </div>
                        <div className="border-t border-dashed border-grayScale-200 mx-4" />
                        <div className="p-6 space-y-4">
                          <textarea
                            className="w-full h-48 p-4 rounded-xl border border-grayScale-100 bg-[#F8FAFC] text-grayScale-900 placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#9E2891] resize-none"
                            placeholder="Start typing your response here..."
                          />
                          <div className="flex items-center justify-between text-[13px] font-bold text-[#64748B]">
                            <span>Word Count: 0</span>
                            <span>Min: 150 words</span>
                          </div>
                        </div>
                      </div>
                    ) : input === "Matching Inputs" ? (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[12px] font-bold text-grayScale-500 uppercase tracking-wider">
                              COLUMN A (KEYS)
                            </label>
                            <span className="text-[11px] font-medium text-grayScale-400">
                              Static
                            </span>
                          </div>
                          <div className="space-y-3">
                            {matchingKeys.map((key, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3"
                              >
                                <GripVertical className="h-4 w-4 text-grayScale-300 cursor-grab" />
                                <span className="text-[14px] font-medium text-grayScale-600 min-w-4">
                                  {idx + 1}.
                                </span>
                                <Input
                                  value={key}
                                  className="h-11 rounded-[8px] border-grayScale-200 bg-white font-medium text-grayScale-800"
                                  readOnly
                                />
                                <MinusCircle className="h-5 w-5 text-grayScale-300 cursor-pointer hover:text-red-500 transition-colors" />
                              </div>
                            ))}
                          </div>
                          <button className="flex items-center gap-2 text-[14px] font-bold text-[#9E2891] hover:underline">
                            <Plus className="h-4 w-4" />
                            Add Key Item
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[12px] font-bold text-grayScale-500 uppercase tracking-wider">
                              COLUMN B (OPTIONAL)
                            </label>
                            <span className="text-[11px] font-medium text-grayScale-400">
                              Draggable
                            </span>
                          </div>
                          <div className="space-y-3">
                            {matchingValues.map((val, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3"
                              >
                                <GripVertical className="h-4 w-4 text-grayScale-300 cursor-grab" />
                                <span className="text-[14px] font-medium text-grayScale-600 min-w-4">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                <Input
                                  value={val}
                                  className="h-11 rounded-[8px] border-grayScale-200 bg-white font-medium text-grayScale-800"
                                  readOnly
                                />
                                <MinusCircle className="h-5 w-5 text-grayScale-300 cursor-pointer hover:text-red-500 transition-colors" />
                              </div>
                            ))}
                          </div>
                          <button className="flex items-center gap-2 text-[14px] font-bold text-[#9E2891] hover:underline">
                            <Plus className="h-4 w-4" />
                            Add Value Item
                          </button>
                        </div>
                      </div>
                    ) : input === "Audio Clip" ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[16px] font-medium text-grayScale-900">
                            Audio Source
                          </label>
                          <span className="text-[14px] font-medium text-[#64748B]">
                            MP3, WAV, OGG
                          </span>
                        </div>
                        <div className="h-48 rounded-2xl border-2 border-dashed border-grayScale-200 bg-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-grayScale-50 transition-all group">
                          <div className="h-14 w-14 rounded-full bg-[#9E289114] flex items-center justify-center text-[#9E2891]">
                            <UploadCloud className="h-7 w-7" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-[16px] font-bold text-grayScale-900">
                              Click to upload or drag file
                            </p>
                            <p className="text-[14px] font-medium text-grayScale-500">
                              Max size 25MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : input === "Table" ? (
                      <div className="space-y-4 overflow-hidden border border-grayScale-100 rounded-xl">
                        <div className="grid grid-cols-[60px_1fr_140px] px-6 py-3 bg-[#F8FAFC] border-b border-grayScale-100">
                          <span className="text-[12px] font-bold text-grayScale-500">
                            #
                          </span>
                          <span className="text-[12px] font-bold text-grayScale-500">
                            ROW CONTENT
                          </span>
                          <span className="text-[12px] font-bold text-grayScale-500">
                            INTERACTION
                          </span>
                        </div>
                        <div className="divide-y divide-grayScale-100">
                          {tableRows.map((row) => (
                            <div
                              key={row.id}
                              className="grid grid-cols-[60px_1fr_140px] items-center px-6 py-4 group hover:bg-grayScale-25 transition-all"
                            >
                              <span
                                className={cn(
                                  "text-[14px] font-bold",
                                  row.type === "Learner Input"
                                    ? "text-[#9E2891]"
                                    : "text-grayScale-400",
                                )}
                              >
                                {row.id}
                              </span>
                              <div className="pr-8">
                                <Input
                                  value={row.content}
                                  className={cn(
                                    "h-11 rounded-[10px] border-grayScale-200 bg-white font-medium text-[14px]",
                                    row.type === "Learner Input"
                                      ? "border-[#9E2891] ring-1 ring-[#9E28911A]"
                                      : "border-grayScale-200",
                                  )}
                                  readOnly
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  className={cn(
                                    "w-11 h-6 rounded-full transition-all relative shrink-0",
                                    row.type === "Learner Input"
                                      ? "bg-[#9E2891]"
                                      : "bg-grayScale-200",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                      row.type === "Learner Input"
                                        ? "left-6"
                                        : "left-1",
                                    )}
                                  />
                                </button>
                                <span className="text-[11px] font-bold text-grayScale-500 leading-tight w-20">
                                  {row.type === "Read Only"
                                    ? "Read\nOnly"
                                    : "Learner\nInput"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 bg-white border-t border-grayScale-50">
                          <button className="flex items-center justify-center h-8 w-8 text-[#9E2891] hover:bg-[#9E289114] rounded-full transition-all">
                            <Plus className="h-6 w-6 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    ) : input === "Flow Chart" ? (
                      <div className="space-y-6 flex flex-col items-center">
                        <div className="text-[13px] font-bold text-grayScale-400 uppercase tracking-widest">
                          Start
                        </div>
                        <ArrowDown className="h-5 w-5 text-grayScale-300" />

                        <div className="w-full space-y-6">
                          {flowchartSteps.map((step, idx) => (
                            <div
                              key={step.id}
                              className="flex flex-col items-center gap-6"
                            >
                              <div
                                className={cn(
                                  "w-full rounded-2xl border transition-all overflow-hidden bg-white",
                                  step.isBlank
                                    ? "border-[#9E2891] border-dashed shadow-[0_8px_20px_rgba(158,40,145,0.08)]"
                                    : "border-grayScale-200",
                                )}
                              >
                                <div
                                  className={cn(
                                    "px-6 py-4 flex items-center justify-between border-b",
                                    step.isBlank
                                      ? "border-[#9E28911A]"
                                      : "border-grayScale-100",
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "text-[12px] font-bold uppercase tracking-wider",
                                        step.isBlank
                                          ? "text-[#9E2891]"
                                          : "text-grayScale-500",
                                      )}
                                    >
                                      STEP {step.id} {step.isBlank && "(BLANK)"}
                                    </span>
                                    {step.isBlank && (
                                      <span className="px-2 py-0.5 rounded-full bg-[#9E2891] text-white text-[10px] font-bold tracking-tight">
                                        LEARNER INPUT
                                      </span>
                                    )}
                                  </div>
                                  <GripVertical className="h-5 w-5 text-grayScale-300 cursor-grab" />
                                </div>

                                <div
                                  className={cn(
                                    "p-6 space-y-3",
                                    step.isBlank && "bg-[#9E289108]",
                                  )}
                                >
                                  <label className="text-[13px] font-bold text-grayScale-600">
                                    {step.isBlank
                                      ? "Correct Answer"
                                      : "Step Content"}
                                  </label>
                                  <textarea
                                    className={cn(
                                      "w-full h-24 p-3 rounded-xl border font-medium text-[14px] resize-none focus:outline-none",
                                      step.isBlank
                                        ? "border-[#9E289133] bg-white text-[#9E2891] placeholder:text-[#9E28914D]"
                                        : "border-grayScale-200 bg-[#F8FAFC] text-grayScale-800",
                                    )}
                                    value={step.content}
                                    readOnly
                                  />
                                </div>

                                <div
                                  className={cn(
                                    "px-6 py-4 flex items-center justify-between bg-white border-t",
                                    step.isBlank
                                      ? "border-[#9E28911A]"
                                      : "border-grayScale-100",
                                  )}
                                >
                                  <span className="text-[12px] font-bold text-grayScale-800 uppercase tracking-tight">
                                    MARK AS BLANK
                                  </span>
                                  <button
                                    className={cn(
                                      "w-11 h-6 rounded-full transition-all relative shrink-0",
                                      step.isBlank
                                        ? "bg-[#9E2891]"
                                        : "bg-grayScale-200",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                        step.isBlank ? "left-6" : "left-1",
                                      )}
                                    />
                                  </button>
                                </div>
                              </div>

                              {idx < flowchartSteps.length - 1 && (
                                <ArrowDown className="h-5 w-5 text-grayScale-300" />
                              )}
                            </div>
                          ))}
                        </div>

                        <ArrowDown className="h-5 w-5 text-grayScale-300" />
                        <div className="text-[13px] font-bold text-grayScale-400 uppercase tracking-widest">
                          End
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="text-[14px] font-medium text-grayScale-800">
                          {input} Configuration
                        </label>
                        <Input
                          className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] font-medium text-grayScale-900 placeholder:text-grayScale-400"
                          placeholder={`Enter details for ${input}...`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B */}
          <div className="bg-white p-6 rounded-2xl border border-grayScale-200">
            <div className="space-y-8">
              <div className="border-b border-grayScale-200 pb-4">
                <h4 className="text-[16px] font-medium text-grayScale-900 uppercase tracking-tight">
                  SECTION B: Answer Types
                </h4>
                <p className="text-grayScale-500 text-[14px] font-medium mt-1">
                  How should the student answer this question?
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {answerTypes.map((type) => (
                  <ConfigCard
                    key={type.label}
                    {...type}
                    selected={selectedAnswers.includes(type.label)}
                    onClick={() =>
                      toggleSelection(
                        selectedAnswers,
                        setSelectedAnswers,
                        type.label,
                      )
                    }
                  />
                ))}
              </div>

              {/* Dynamic Inputs for Section B */}
              {selectedAnswers.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-grayScale-100">
                  {selectedAnswers.map((answer) => (
                    <div
                      key={answer}
                      className="animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                      {answer === "Multiple Choice" ? (
                        <div className="space-y-8">
                          {/* Selection Mode */}
                          <div className="space-y-3">
                            <label className="text-[14px] font-bold text-grayScale-700 uppercase tracking-tight">
                              Selection Mode
                            </label>
                            <div className="flex bg-grayScale-50 p-1 rounded-xl w-fit">
                              <button
                                onClick={() => setSelectionMode("Single")}
                                className={cn(
                                  "flex items-center gap-2 px-8 py-2 rounded-lg transition-all font-bold text-[14px]",
                                  selectionMode === "Single"
                                    ? "bg-white text-[#9E2891] shadow-sm ring-1 ring-grayScale-100"
                                    : "text-grayScale-500 hover:text-grayScale-700",
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                                    selectionMode === "Single"
                                      ? "border-[#9E2891]"
                                      : "border-grayScale-300",
                                  )}
                                >
                                  {selectionMode === "Single" && (
                                    <div className="h-2 w-2 rounded-full bg-[#9E2891]" />
                                  )}
                                </div>
                                Single
                              </button>
                              <button
                                onClick={() => setSelectionMode("Multiple")}
                                className={cn(
                                  "flex items-center gap-2 px-8 py-2 rounded-lg transition-all font-bold text-[14px]",
                                  selectionMode === "Multiple"
                                    ? "bg-white text-[#9E2891] shadow-sm ring-1 ring-grayScale-100"
                                    : "text-grayScale-500 hover:text-grayScale-700",
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-4 w-4 rounded-md border-2 flex items-center justify-center",
                                    selectionMode === "Multiple"
                                      ? "border-[#9E2891] bg-[#9E289108]"
                                      : "border-grayScale-300",
                                  )}
                                >
                                  {selectionMode === "Multiple" && (
                                    <Check className="h-3 w-3 text-[#9E2891] stroke-[3]" />
                                  )}
                                </div>
                                Multiple
                              </button>
                            </div>
                          </div>

                          {/* Options List Header */}
                          <div className="flex items-center justify-between">
                            <label className="text-[16px] font-bold text-grayScale-900 tracking-tight">
                              Options List
                            </label>
                            <span className="px-3 py-1 rounded bg-grayScale-50 text-[12px] font-medium text-grayScale-500 border border-grayScale-100">
                              Select correct answer(s)
                            </span>
                          </div>

                          {/* Question Input Block */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#9E289114] text-[#9E2891]">
                                <Type className="h-5 w-5" />
                              </div>
                              <span className="text-[16px] font-bold text-[#9E2891]">
                                Question Input
                              </span>
                            </div>
                            <div className="h-[2px] w-full bg-grayScale-100 border-dashed border-t" />
                            <textarea
                              className="w-full h-24 p-5 rounded-2xl border border-grayScale-200 bg-white font-medium text-[15px] resize-none focus:outline-none focus:ring-1 focus:ring-[#9E289133] placeholder:text-grayScale-400"
                              placeholder="Type the Multiple choice question here..."
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-4 pt-4">
                            {mcOptions.map((opt, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4 group"
                              >
                                <div
                                  className={cn(
                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                    opt.isCorrect
                                      ? "border-[#9E2891] bg-[#9E2891]"
                                      : "border-grayScale-200 bg-white",
                                  )}
                                >
                                  {opt.isCorrect && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </div>
                                <div
                                  className={cn(
                                    "flex-1 flex items-center gap-4 h-14 px-6 rounded-2xl border transition-all",
                                    opt.isCorrect
                                      ? "border-[#9E2891] bg-[#9E289105] shadow-[0_4px_12px_rgba(158,40,145,0.04)]"
                                      : "border-grayScale-200 bg-white",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "text-[14px] font-bold uppercase",
                                      opt.isCorrect
                                        ? "text-[#9E2891]"
                                        : "text-grayScale-400",
                                    )}
                                  >
                                    {opt.label}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    className={cn(
                                      "flex-1 bg-transparent font-medium text-[15px] focus:outline-none",
                                      opt.isCorrect
                                        ? "text-grayScale-900"
                                        : "text-grayScale-800 placeholder:text-grayScale-400",
                                    )}
                                    placeholder="Enter option text..."
                                    readOnly
                                  />
                                  <Trash2 className="h-5 w-5 text-grayScale-300 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-red-500 transition-all" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-6 pt-4">
                            <button className="flex-1 h-16 rounded-2xl border-2 border-dashed border-[#9E289126] bg-[#9E289105] flex items-center justify-center gap-3 text-[#9E2891] font-bold text-[15px] hover:bg-[#9E28910A] transition-all">
                              <Plus className="h-5 w-5 stroke-[3]" />
                              Add Another Option
                            </button>
                            <button className="flex-1 h-16 rounded-2xl border-2 border-dashed border-[#9E28911A] bg-white flex items-center justify-center gap-3 text-[#9E2891] font-bold text-[15px] hover:bg-grayScale-25 transition-all">
                              <Plus className="h-5 w-5 stroke-[3]" />
                              Add Another Question
                            </button>
                          </div>
                        </div>
                      ) : answer === "Select Missing Words" ? (
                        <div className="space-y-8">
                          {/* Input Words */}
                          <div className="space-y-3">
                            <label className="text-[14px] font-bold text-grayScale-700 tracking-tight">
                              Input Words{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="min-h-[64px] p-2 rounded-[6px] border border-grayScale-200 bg-[#F8FAFC] flex flex-wrap gap-2 items-center">
                              {missingWordTags.map((tag) => (
                                <div
                                  key={tag}
                                  className="h-8 pl-3 pr-3 rounded-full bg-[#9E28911A] flex border border-[#9E289133] items-center gap-3"
                                >
                                  <span className="text-[14px] font-bold text-[#9E2891]">
                                    {tag}
                                  </span>
                                  <button className="h-5 w-5 flex items-center justify-center text-[#9E2891] hover:bg-[#9E289126] rounded-full transition-all">
                                    <X className="h-3 w-3 stroke-[3]" />
                                  </button>
                                </div>
                              ))}
                              <input
                                className="flex-1 min-w-[120px] bg-transparent h-10 px-4 font-medium text-[15px] focus:outline-none placeholder:text-grayScale-400"
                                placeholder="Add a word"
                              />
                            </div>
                            <div className="flex items-start gap-2.5 text-grayScale-500">
                              <Info className="h-4 w-4 mt-0.5 shrink-0" />
                              <p className="text-[13px] font-medium leading-normal">
                                Selected words will become input fields for
                                students.
                              </p>
                            </div>
                          </div>

                          {/* Distractors Card */}
                          <div className="rounded-[6px] border border-grayScale-200 bg-[#F8FAFC] overflow-hidden">
                            <div className="px-8 py-5 border-b border-grayScale-100 flex items-center justify-between cursor-pointer group">
                              <h5 className="text-[16px] font-bold text-grayScale-900 tracking-tight">
                                Distractors (Fake Options)
                              </h5>
                              <ChevronUp className="h-5 w-5 text-grayScale-400 group-hover:text-grayScale-600 transition-all" />
                            </div>
                            <div className="px-8 pb-4">
                              <div className="grid grid-cols-2 gap-12">
                                {missingWordTags.map((word, wIdx) => (
                                  <div key={word} className="space-y-5">
                                    <h6 className="text-[15px] font-bold text-grayScale-900">
                                      Word {wIdx + 1}: {word}
                                    </h6>
                                    <div className="space-y-4">
                                      {distractors[word]?.map((dist) => (
                                        <div
                                          key={dist.id}
                                          className="flex items-center"
                                        >
                                          <Input
                                            value={dist.text}
                                            className="h-10 rounded-[6px] border-grayScale-200 bg-white font-medium text-[14px]"
                                            readOnly
                                          />
                                          <button className="h-10 w-10 shrink-0 flex items-center justify-center text-[#F43F5E]  rounded-xl hover:bg-[#F43F5E26] transition-all">
                                            <MinusCircle className="h-4 w-4 stroke-[2.5]" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    <button className="flex items-center gap-2 text-[14px] font-bold text-[#9E2891] hover:underline">
                                      <Plus className="h-4 w-4 stroke-[3]" />
                                      Add Distractor
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : answer === "Short Answer" ? (
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[12px] font-bold text-grayScale-500 uppercase tracking-wider">
                                QUESTIONS
                              </label>
                              <span className="text-[11px] font-medium text-grayScale-400">
                                Static
                              </span>
                            </div>
                            <div className="space-y-3">
                              {shortQuestions.map((q, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3"
                                >
                                  <GripVertical className="h-4 w-4 text-grayScale-300 cursor-grab" />
                                  <span className="text-[14px] font-medium text-grayScale-600 min-w-4">
                                    {idx + 1}.
                                  </span>
                                  <Input
                                    value={q}
                                    className="h-11 rounded-[8px] border-grayScale-200 bg-white font-medium text-grayScale-800"
                                    readOnly
                                  />
                                  <MinusCircle className="h-5 w-5 text-grayScale-300 cursor-pointer hover:text-red-500 transition-colors" />
                                </div>
                              ))}
                            </div>
                            <button className="flex items-center gap-2 text-[14px] font-bold text-[#9E2891] hover:underline">
                              <Plus className="h-4 w-4" />
                              Add Questions
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[12px] font-bold text-grayScale-500 uppercase tracking-wider">
                                ANSWERS
                              </label>
                              <span className="text-[11px] font-medium text-grayScale-400">
                                Draggable
                              </span>
                            </div>
                            <div className="space-y-3">
                              {shortAnswers.map((a, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3"
                                >
                                  <GripVertical className="h-4 w-4 text-grayScale-300 cursor-grab" />
                                  <span className="text-[14px] font-medium text-grayScale-600 min-w-4">
                                    {idx + 1}.
                                  </span>
                                  <Input
                                    value={a}
                                    className="h-11 rounded-[8px] border-grayScale-200 bg-white font-medium text-grayScale-800"
                                    readOnly
                                  />
                                  <MinusCircle className="h-5 w-5 text-grayScale-300 cursor-pointer hover:text-red-500 transition-colors" />
                                </div>
                              ))}
                            </div>
                            <button className="flex items-center gap-2 text-[14px] font-bold text-[#9E2891] hover:underline">
                              <Plus className="h-4 w-4" />
                              Add answers
                            </button>
                          </div>
                        </div>
                      ) : answer === "Audio Clip" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[16px] font-medium text-grayScale-900">
                              Audio Source
                            </label>
                            <span className="text-[14px] font-medium text-[#64748B]">
                              MP3, WAV, OGG
                            </span>
                          </div>
                          <div className="h-48 rounded-2xl border-2 border-dashed border-grayScale-200 bg-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-grayScale-50 transition-all group">
                            <div className="h-14 w-14 rounded-full bg-[#9E289114] flex items-center justify-center text-[#9E2891]">
                              <UploadCloud className="h-7 w-7" />
                            </div>
                            <div className="text-center space-y-1">
                              <p className="text-[16px] font-bold text-grayScale-900">
                                Click to upload or drag file
                              </p>
                              <p className="text-[14px] font-medium text-grayScale-500">
                                Max size 25MB
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : answer === "PDF Upload" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[16px] font-medium text-grayScale-900">
                              PDF Upload Output
                            </label>
                          </div>
                          <div className="h-48 rounded-2xl border-2 border-dashed border-grayScale-200 bg-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-grayScale-50 transition-all group">
                            <div className="h-14 w-14 rounded-full bg-[#9E289114] flex items-center justify-center text-[#9E2891]">
                              <UploadCloud className="h-7 w-7" />
                            </div>
                            <div className="text-center space-y-1">
                              <p className="text-[16px] font-bold text-grayScale-900">
                                Click to upload or drag file
                              </p>
                              <p className="text-[14px] font-medium text-grayScale-500">
                                Max size 25MB
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : answer === "Answer Key" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[12px] font-bold text-grayScale-500 uppercase tracking-wider">
                              MATCHING ANSWER
                            </label>
                            <span className="text-[11px] font-medium text-grayScale-400">
                              Static
                            </span>
                          </div>
                          <div className="space-y-3">
                            {answerKeyItems.map((val, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3"
                              >
                                <GripVertical className="h-4 w-4 text-grayScale-300 cursor-grab" />
                                <span className="text-[14px] font-medium text-grayScale-600 min-w-4">
                                  {idx + 1}
                                </span>
                                <Input
                                  value={val}
                                  className="h-11 w-24 rounded-[8px] border-grayScale-200 bg-white font-medium text-center text-grayScale-800"
                                  readOnly
                                />
                                <MinusCircle className="h-5 w-5 text-grayScale-300 cursor-pointer hover:text-red-500 transition-colors" />
                              </div>
                            ))}
                          </div>
                          <button className="flex items-center gap-2 text-[14px] font-bold text-[#9E2891] hover:underline">
                            <Plus className="h-4 w-4" />
                            Add Key Item
                          </button>
                        </div>
                      ) : answer === "Label Selection" ? (
                        <div className="rounded-[16px] border border-grayScale-200 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#9E289114] text-[#9E2891]">
                              <Settings2 className="h-5 w-5" />
                            </div>
                            <h5 className="text-[18px] font-bold text-grayScale-900 tracking-tight">
                              Answer Settings
                            </h5>
                          </div>

                          <div className="space-y-8">
                            <div className="space-y-3">
                              <label className="text-[15px] font-bold text-grayScale-700 tracking-tight">
                                Select Label Set
                              </label>
                              <div className="relative group">
                                <select
                                  value={selectedLabelSet}
                                  onChange={(e) =>
                                    setSelectedLabelSet(e.target.value)
                                  }
                                  className="w-full h-14 pl-6 pr-12 rounded-[12px] border border-grayScale-200 bg-white font-medium text-[16px] text-grayScale-900 appearance-none focus:outline-none focus:ring-1 focus:ring-[#9E289133] cursor-pointer"
                                >
                                  <option>True / False / Not Given</option>
                                  <option>Yes / No / Not Given</option>
                                  <option>A / B / C</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-grayScale-400 pointer-events-none group-hover:text-grayScale-600 transition-all" />
                              </div>
                              <p className="text-[14px] font-medium text-grayScale-500">
                                Choose the standard answer format required for
                                this question type.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[15px] font-bold text-grayScale-700 tracking-tight">
                                Correct Answer
                              </label>
                              <div className="flex gap-4">
                                {["True", "False", "Not Given"].map((val) => (
                                  <button
                                    key={val}
                                    onClick={() => setCorrectLabelAnswer(val)}
                                    className={cn(
                                      "h-12 px-6 rounded-[8px] font-bold text-[15px] transition-all",
                                      correctLabelAnswer === val
                                        ? "bg-[#9E2891] text-white shadow-[0_4px_12px_rgba(158,40,145,0.2)]"
                                        : "bg-[#F1F5F9] text-grayScale-700 hover:bg-grayScale-100",
                                    )}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="text-[14px] font-medium text-grayScale-800">
                            {answer} Configuration
                          </label>
                          <Input
                            className="h-12 rounded-[12px] border-grayScale-300 bg-[#F8FAFC] font-medium text-grayScale-900 placeholder:text-grayScale-400"
                            placeholder={`Enter details for ${answer}...`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Variation Button */}
        <button className="w-full py-3 rounded-xl border-[2px] border-dashed border-grayScale-300 flex items-center justify-center gap-2 text-[#9E2891] font-medium transition-all group">
          <Plus className="h-4 w-4 bg-[#9E2891] text-white rounded-full p-0.5" />
          Add Question Variation
        </button>

        {/* Collapsed Items */}
        {["Interactive Speaking", "Speaking Sample"].map((section) => (
          <div
            key={section}
            className="rounded-xl border border-grayScale-300 bg-[#EEEEEE] overflow-hidden"
          >
            <div
              className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-grayScale-100/50 transition-all group"
              onClick={() =>
                setExpandedSection(expandedSection === section ? "" : section)
              }
            >
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 flex items-center justify-center text-grayScale-900">
                  <Hourglass className="h-5 w-5 stroke-[1.5]" />
                </div>
                <h3 className="text-[18px] font-medium text-grayScale-800">
                  {section}
                </h3>
              </div>
              {expandedSection === section ? (
                <ChevronUp className="h-6 w-6 text-grayScale-900" />
              ) : (
                <ChevronDown className="h-6 w-6 text-grayScale-900" />
              )}
            </div>
            {expandedSection === section && (
              <div className="p-10 text-center text-grayScale-400 font-medium bg-white border-t border-grayScale-200">
                Variation configuration for {section}...
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Navigation */}

      <div className="px-4 py-4 border-t border-grayScale-200 flex items-center justify-between bg-[#F8FAFC]">
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
          Next: Variations
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
