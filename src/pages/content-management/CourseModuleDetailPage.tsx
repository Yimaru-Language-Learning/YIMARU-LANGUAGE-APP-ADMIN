import { useState } from "react";
import { ArrowLeft, Plus, FileText, MoreVertical, Edit2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { Card } from "../../components/ui/card";

const MOCK_VIDEOS = [
  {
    id: "v1",
    title: "1.1 Introduction to Formal Greetings",
    duration: "08:45",
    status: "Draft",
    thumbnailColor: "bg-[#CBD5E1]",
  },
  {
    id: "v2",
    title: "1.2 Understanding Email Structure",
    duration: "08:45",
    status: "Published",
    thumbnailColor: "bg-[#DBEAFE]",
  },
  {
    id: "v3",
    title: "1.3 Common Business Idioms",
    duration: "08:45",
    status: "Published",
    thumbnailColor: "bg-[#FEF3C7]",
  },
  {
    id: "v4",
    title: "1.4 Video Conference Etiquette",
    duration: "08:45",
    status: "Published",
    thumbnailColor: "bg-[#FCE7F3]",
  },
];

const MOCK_PRACTICES = [
  {
    id: "p1",
    title: "1.1 Conversation Practice",
    duration: "08:45",
    status: "Published",
    thumbnailColor: "bg-[#E0F2FE]",
  },
  {
    id: "p2",
    title: "1.2 Roleplay Scenario",
    duration: "08:45",
    status: "Draft",
    thumbnailColor: "bg-[#F0FDF4]",
  },
];

export function CourseModuleDetailPage() {
  const navigate = useNavigate();
  const { programType, courseId, unitId, moduleId } = useParams<{
    programType: string;
    courseId: string;
    unitId: string;
    moduleId: string;
  }>();

  const [activeTab, setActiveTab] = useState<"video" | "practice">("video");
  const [activeFilter, setActiveFilter] = useState("All");

  const moduleTitle = "Module 1: Basic Phrases";
  const moduleDescription = "Learn essential phrases for daily conversations.";

  const content = activeTab === "video" ? MOCK_VIDEOS : MOCK_PRACTICES;
  const filteredContent = content.filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Drafts") return item.status === "Draft";
    return item.status === activeFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to={`/new-content/courses/${programType}/${courseId}/${unitId}`}
        className="flex items-center gap-2.5 text-[15px] font-bold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to Modules
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#0D1421]">
            {moduleTitle}
          </h1>
          <p className="max-w-2xl text-[16px] font-medium leading-relaxed text-grayScale-400">
            {moduleDescription}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-brand-500 text-brand-500 font-bold hover:bg-brand-50 transition-all flex items-center gap-2 shadow-sm"
            onClick={() =>
              navigate(
                `/new-content/courses/${programType}/${courseId}/unit/${unitId}/module/${moduleId}/attach-practice`,
              )
            }
          >
            <FileText className="h-5 w-5" />
            Attach Practice
          </Button>
          <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white shadow-md hover:bg-brand-600 transition-all flex items-center gap-2 text-[15px]">
            <Plus className="h-5 w-5" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-10 border-b border-grayScale-100">
        <button
          onClick={() => setActiveTab("video")}
          className={cn(
            "pb-4 text-[16px] font-bold transition-all relative px-2",
            activeTab === "video"
              ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-500"
              : "text-grayScale-400 hover:text-grayScale-600",
          )}
        >
          Video
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          className={cn(
            "pb-4 text-[16px] font-bold transition-all relative px-2",
            activeTab === "practice"
              ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-500"
              : "text-grayScale-400 hover:text-grayScale-600",
          )}
        >
          Practice
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-grayScale-100 rounded-[16px] p-4 flex items-center gap-8 shadow-sm">
        <div className="text-[12px] font-bold text-grayScale-300 uppercase tracking-widest pl-4">
          STATUS:
        </div>
        <div className="flex items-center gap-2">
          {["All", "Published", "Drafts", "Archived"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-bold transition-all",
                activeFilter === filter
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "bg-grayScale-100 text-grayScale-500 hover:bg-grayScale-200",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {filteredContent.map((item) => (
          <ContentCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}

function ContentCard({
  title,
  duration,
  status,
  thumbnailColor,
}: {
  title: string;
  duration: string;
  status: string;
  thumbnailColor: string;
}) {
  return (
    <Card className="group flex flex-col bg-white rounded-[20px] border border-grayScale-50 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-grayScale-400/5 transition-all">
      {/* Thumbnail Area */}
      <div className={cn("h-44 w-full relative", thumbnailColor)}>
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
          {duration}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 space-y-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border",
              status === "Published"
                ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]"
                : "bg-grayScale-50 text-grayScale-400 border-grayScale-100",
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "Published" ? "bg-[#16A34A]" : "bg-grayScale-300",
              )}
            />
            {status}
          </div>
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-grayScale-300 hover:text-grayScale-600 transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-[14px] font-bold text-[#0F172A] line-clamp-2 leading-snug">
          {title}
        </h3>

        <div className="pt-2 grid grid-cols-1 gap-2 mt-auto">
          <Button
            variant="outline"
            className="w-full h-10 rounded-[10px] border-grayScale-200 text-grayScale-600 font-bold flex items-center justify-center gap-2 text-xs hover:bg-grayScale-25"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            className={cn(
              "w-full h-10 rounded-[10px] font-bold text-xs shadow-sm",
              status === "Published"
                ? "bg-[#ECD5E9] text-[#9E2891] hover:bg-[#EBD0E7]"
                : "bg-brand-500 text-white hover:bg-brand-600",
            )}
          >
            {status === "Published" ? "Published" : "Publish"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
