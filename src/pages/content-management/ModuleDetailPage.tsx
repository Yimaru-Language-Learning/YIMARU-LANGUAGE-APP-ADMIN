import { useState } from "react";
import {
  ArrowLeft,
  Video,
  Calendar,
  Mic,
  Layers,
  Edit2,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { VideoCard } from "./components/VideoCard";

const MOCK_VIDEOS = [
  {
    id: "v1",
    title: "1.1 Introduction to Formal Greetings",
    duration: "08:45",
    status: "Draft",
    thumbnailGradient: "from-[#CBD5E1] to-[#94A3B8]",
  },
  {
    id: "v2",
    title: "1.2 Understanding Email Structure",
    duration: "08:45",
    status: "Published",
    thumbnailGradient: "from-[#DBEAFE] to-[#93C5FD]",
  },
  {
    id: "v3",
    title: "1.3 Common Business Idioms",
    duration: "08:45",
    status: "Published",
    thumbnailGradient: "from-[#FEF3C7] to-[#FCD34D]",
  },
  {
    id: "v4",
    title: "1.4 Video Conference Etiquette",
    duration: "08:45",
    status: "Published",
    thumbnailGradient: "from-[#FCE7F3] to-[#F9A8D4]",
  },
];

const MOCK_PRACTICES = [
  {
    id: "p1",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
  {
    id: "p2",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
  {
    id: "p3",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
  {
    id: "p4",
    title: "Describe a Photo",
    level: "IELTS",
    variations: 12,
    status: "Draft",
  },
];

export function ModuleDetailPage() {
  const navigate = useNavigate();
  const { level, courseId, moduleId } = useParams<{
    level: string;
    courseId: string;
    moduleId: string;
  }>();
  const [activeTab, setActiveTab] = useState<"video" | "practice">("video");
  const [activeFilter, setActiveFilter] = useState("Draft");
  const [videos] = useState(MOCK_VIDEOS);
  const [practices] = useState(MOCK_PRACTICES);

  const moduleTitle =
    moduleId
      ?.split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Business English Fundamentals";

  return (
    <div className="space-y-10 pt-10 pb-20 animate-in fade-in duration-500">
      {/* Header Navigation */}
      <div className="flex items-center gap-2">
        <Link
          to={`/new-content/learn-english/${level}/courses/${courseId}`}
          className="flex items-center gap-2 text-[15px] font-medium text-grayScale-600 transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Modules
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="">
          <h1 className="text-2xl font-medium text-grayScale-900 tracking-tight">
            Module 3: {moduleTitle}
          </h1>
          <p className="text-grayScale-500 text-[14px] max-w-2xl">
            This module covers essential vocabulary and phrases used in modern
            business environments, including email etiquette and meeting
            protocols.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-[6px] border-brand-500 text-brand-500 "
            onClick={() =>
              navigate(
                `/new-content/learn-english/${level}/courses/add-practice?backTo=module&courseId=${courseId}&moduleId=${moduleId}`,
              )
            }
          >
            <Calendar className="h-4 w-4" />
            Add Practice
          </Button>
          <Button
            className="rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
            onClick={() =>
              navigate(
                `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/add-video`,
              )
            }
          >
            <div className="h-4 w-4 flex items-center justify-center">
              <span className="text-xl leading-none font-light">+</span>
            </div>
            Add Video
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-grayScale-200">
        <div className="flex gap-10">
          <button
            onClick={() => setActiveTab("video")}
            className={cn(
              "pb-4 text-[16px] font-medium transition-all relative",
              activeTab === "video"
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-t-full"
                : "text-grayScale-400 hover:text-grayScale-600",
            )}
          >
            Video
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={cn(
              "pb-4 text-[16px] font-medium transition-all relative",
              activeTab === "practice"
                ? "text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-t-full"
                : "text-grayScale-400 hover:text-grayScale-600",
            )}
          >
            Practice
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === "video" ? (
          videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  {...(video as any)}
                  onEdit={() => console.log("Edit", video.id)}
                  onPublish={() => console.log("Publish", video.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 px-4 rounded-[40px] border-2 border-dashed border-[#F1F5F9] bg-white max-w-4xl mx-auto shadow-sm">
              <div className="h-20 w-20 rounded-full bg-[#FAF5FF] flex items-center justify-center mb-6">
                <div className="h-14 w-14 rounded-full bg-[#F5EBFF] flex items-center justify-center">
                  <Video className="h-7 w-7 text-brand-500 fill-brand-500/10" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-grayScale-900 mb-3">
                No videos added to this module yet
              </h2>
              <p className="text-grayScale-400 font-medium text-[15px] text-center max-w-sm mb-10 leading-relaxed">
                Videos are a great way to engage students. Start building your
                module by adding your first video lesson now.
              </p>
              <Button
                variant="outline"
                className="h-12 px-8 rounded-xl border-brand-500 text-brand-500 font-bold hover:bg-brand-50 transition-all flex items-center gap-2"
                onClick={() =>
                  navigate(
                    `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/add-video`,
                  )
                }
              >
                <Video className="h-5 w-5" />
                Add Video
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {/* Practice Tab Filter Bar */}
            <div className="bg-white border border-grayScale-100 rounded-2xl p-4 flex items-center gap-10 shadow-sm overflow-x-auto whitespace-nowrap px-8">
              <div className="flex items-center gap-2 text-[12px] font-bold text-grayScale-300 uppercase tracking-widest mr-2">
                STATUS:
              </div>
              <div className="flex items-center gap-3">
                {["All", "Published", "Draft", "Archived"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setActiveFilter(label)}
                    className={cn(
                      "h-9 px-5 rounded-full text-[13px] font-bold transition-all",
                      activeFilter === label
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                        : "bg-[#F1F5F9] text-grayScale-500 hover:bg-grayScale-100",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {practices.map((practice) => (
                <PracticeCard key={practice.id} {...practice} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeCard({
  title,
  level,
  variations,
  status,
}: {
  title: string;
  level: string;
  variations: number;
  status: string;
}) {
  return (
    <div className="bg-white rounded-[24px] border border-grayScale-50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-grayScale-400/5 transition-all group p-6 flex flex-col h-full min-h-[340px]">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-grayScale-900 line-clamp-1">
            {title}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="bg-[#22C55E] text-white text-[11px] font-bold px-2 py-1 rounded-[4px]">
            {level}
          </span>
          <div className="flex items-center gap-1.5 text-grayScale-500">
            <Mic className="h-4 w-4" />
            <span className="text-[13px] font-bold">Speaking</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-brand-400 w-fit py-2  rounded-xl">
          <Layers className="h-4 w-4" />
          <span className="text-[14px] font-bold">{variations} Variations</span>
        </div>

        <div className="flex border-t border-grayScale-200 items-center justify-between pt-2">
          <div className="bg-grayScale-100 text-grayScale-400 text-[11px] font-bold px-3 py-1.5 rounded-[6px] tracking-wide uppercase">
            {status}
          </div>
          <div className="flex items-center gap-3">
            <button className="h-8 w-8 rounded-lg  flex items-center justify-center text-grayScale-400 hover:text-brand-500 hover:border-brand-100 transition-all">
              <Edit2 className="h-5 w-5" />
            </button>
            <button className="h-8 w-8 rounded-lg  flex items-center justify-center text-grayScale-400 hover:text-red-500 hover:border-red-100 transition-all">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button className="bg-brand-500 text-white rounded-xl h-11 text-[13px] font-bold shadow-md shadow-brand-500/10 hover:bg-brand-600 transition-all px-0">
          Publish Practice
        </Button>
        <Button
          variant="outline"
          className="border-brand-500 text-brand-500 rounded-xl h-11 text-[13px] font-bold bg-white hover:bg-brand-50 transition-all px-0"
        >
          Publish Video
        </Button>
      </div>
    </div>
  );
}
