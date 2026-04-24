import { useState } from "react";
import { ArrowLeft, Plus, Calendar, Plane, Clock, Hand } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";

const MODULES = [
  {
    id: "m1",
    title: "Introduction Basics",
    description: "Learn basic English words, phrases, and simple sentences.",
    icon: Hand,
    status: "Published",
    gradient: "from-[#8E44AD] to-[#C39BD3]",
  },
  {
    id: "m2",
    title: "Daily Routines",
    description: "Vocabulary related to waking up, and evening activities.",
    icon: Clock,
    status: "Draft",
    gradient: "from-[#8E44AD] to-[#C39BD3]",
  },
  {
    id: "m3",
    title: "Travel Essentials",
    description:
      "Key phrases for airports, hotels, and asking for help while abroad.",
    icon: Plane,
    status: "Draft",
    gradient: "from-[#8E44AD] to-[#C39BD3]",
  },
];

import { AddModuleModal } from "./components/AddModuleModal";

export function CourseDetailPage() {
  const navigate = useNavigate();
  const { level, courseId } = useParams<{ level: string; courseId: string }>();
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);

  return (
    <div className="space-y-10 pb-20 pt-10">
      {/* Header Navigation */}
      <div className="flex items-center gap-2">
        <Link
          to={`/new-content/learn-english/${level}/courses`}
          className="flex items-center gap-2 text-sm font-medium text-grayScale-600 transition-colors hover:text-brand-500"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Levels
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="">
          <h1 className="text-2xl font-medium text-grayScale-900 tracking-tight">
            {courseId?.toUpperCase() || "A1"}
          </h1>
          <p className="text-grayScale-500 text-sm max-w-2xl font-medium">
            Learn basic English words, phrases, and simple sentences for daily
            situations.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="rounded-[6px] border-brand-500 text-brand-500 "
            onClick={() =>
              navigate(
                `/new-content/learn-english/${level}/courses/add-practice?backTo=modules&courseId=${courseId}`,
              )
            }
          >
            <Calendar className="h-4 w-4" />
            Add Practice
          </Button>
          <Button
            className="rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600"
            onClick={() => setIsAddModuleOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
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

      <AddModuleModal
        isOpen={isAddModuleOpen}
        onClose={() => setIsAddModuleOpen(false)}
      />
      {/* Gradient Divider */}

      {/* Gradient Grid */}
      <div className="flex flex-warp gap-10">
        {MODULES.map((module) => (
          <Card
            key={module.id}
            className="group overflow-hidden border w-[330px] border-grayScale-50 shadow-sm hover:shadow-lg transition-all duration-300 rounded-[16px] bg-white flex flex-col h-full"
          >
            {/* Gradient Banner */}
            <div
              className={cn(
                "h-36 w-full bg-gradient-to-b opacity-90 transition-transform duration-700",
                module.gradient,
              )}
            />

            <div className="p-2 pb-4 pt-4 flex-1 flex flex-col">
              <div className="flex gap-4 mb-8">
                {/* Icon Circle */}
                <div
                  className={`h-12 w-12 rounded-full ${module.id === "m2" ? "bg-[#F8FAFC]" : "bg-[#f3e8ff]"} flex items-center justify-center p-3 flex-shrink-0 border border-purple-100/50`}
                >
                  <module.icon
                    className={`h-6 w-6 ${module.id === "m2" ? "text-[#64748B]" : "text-brand-500"}`}
                  />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                    {module.title}
                  </h3>
                  <p className="text-grayScale-400 font-medium  text-[12px]">
                    {module.description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-auto">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-[6px] border-[#9E2891] text-[#9E2891]  transition-all text-sm"
                  onClick={() =>
                    navigate(
                      `/new-content/learn-english/${level}/courses/${courseId}/modules/${module.id}`,
                    )
                  }
                >
                  View Detail
                </Button>
                {module.status === "Published" ? (
                  <Button
                    disabled
                    className="flex-1 h-10 rounded-[6px] bg-[#D291BC] text-white  opacity-100 cursor-default border-none shadow-none text-sm"
                  >
                    Published
                  </Button>
                ) : (
                  <Button className="flex-1 h-10 rounded-[6px] bg-brand-500 text-white  shadow-md shadow-brand-500/10 text-sm">
                    Publish Practice
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
