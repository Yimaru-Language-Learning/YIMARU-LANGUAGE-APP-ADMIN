import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { QuestionTypeCard } from "./components/QuestionTypeCard";

export function QuestionTypeLibraryPage() {
  const [activeTab, setActiveTab] = useState("All");

  const questionTypes = [
    {
      title: "Describe a Photo",
      exam: "DUOLINGO" as const,
      skill: "Speaking" as const,
      variations: 12,
      status: "Published" as const,
    },
    {
      title: "Write About the Topic",
      exam: "DUOLINGO" as const,
      skill: "Writing" as const,
      variations: 12,
      status: "Published" as const,
    },
    {
      title: "Fill in the Blanks",
      exam: "IELTS" as const,
      skill: "Writing" as const,
      variations: 12,
      status: "Published" as const,
    },
    {
      title: "Describe a Photo",
      exam: "DUOLINGO" as const,
      skill: "Speaking" as const,
      variations: 12,
      status: "Published" as const,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Navigation & Header */}
      <div className="space-y-6">
        <Link
          to="/new-content/courses"
          className="flex items-center gap-2 text-[15px] font-bold text-grayScale-600 transition-colors hover:text-brand-500 group w-fit"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          Back to Courses
        </Link>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-[32px] font-medium text-grayScale-900 tracking-tight">
              Question Type Library
            </h1>
            <p className="text-grayScale-500 text-[16px] font-medium">
              Create and manage reusable question structures for practices and
              assessments.
            </p>
          </div>
          <Link to="/new-content/question-types/create">
            <Button className="h-12 px-8 rounded-[10px] bg-[#9E2891] font-bold text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all flex items-center gap-3">
              <Plus className="h-5 w-5" />
              Create Question Type
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="p-6 border-grayScale-200 rounded-2xl bg-white space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-grayScale-600" />
            <Input
              className="h-10 pl-12 rounded-[6px] border-grayScale-200 placeholder:text-grayScale-600 bg-[#F8FAFC] transition-all text-sm"
              placeholder="Search by practice name, ID, or keywords..."
            />
          </div>
          <Select className="h-10 w-[180px] rounded-[6px] border-grayScale-200 placeholder:text-grayScale-600 text-grayScale-700 bg-[#F8FAFC] transition-all text-sm">
            <option>All Exams</option>
            <option>IELTS</option>
            <option>Duolingo</option>
          </Select>
          <Select className="h-10 w-[180px] rounded-[6px] border-grayScale-200 placeholder:text-grayScale-600 text-grayScale-700 bg-[#F8FAFC] transition-all text-sm">
            <option>All Skills</option>
            <option>Speaking</option>
            <option>Writing</option>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-grayScale-400 uppercase tracking-widest mr-2">
            STATUS:
          </span>
          {["All", "Published", "Drafts", "Archived"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-10 px-4 rounded-full text-[13px] font-medium transition-all",
                activeTab === tab
                  ? "bg-[#9E2891] text-white shadow-md shadow-brand-500/20"
                  : "bg-grayScale-100 text-grayScale-400 hover:bg-grayScale-100",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </Card>

      {/* Grid of Cards */}
      <div className="grid grid-cols-4 gap-6">
        {questionTypes.map((qt, index) => (
          <QuestionTypeCard key={index} {...qt} />
        ))}
      </div>
    </div>
  );
}
