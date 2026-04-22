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
    <div className="space-y-10 pb-20">
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
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-grayScale-900 tracking-tight">
            {courseId?.toUpperCase() || "A1"}
          </h1>
          <p className="text-grayScale-500 text-lg max-w-2xl font-medium">
            Learn basic English words, phrases, and simple sentences for daily
            situations.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-12 px-6 rounded-[6px] border-brand-500 text-brand-500 font-bold transition-all gap-2"
            onClick={() =>
              navigate(
                `/new-content/learn-english/${level}/courses/add-practice?backTo=modules&courseId=${courseId}`,
              )
            }
          >
            <Calendar className="h-5 w-5" />
            Add Practice
          </Button>
          <Button
            className="h-12 px-6 rounded-[6px] bg-brand-500 font-bold  shadow-lg shadow-brand-500/20 transition-all gap-2"
            onClick={() => setIsAddModuleOpen(true)}
          >
            <Plus className="h-5 w-5" />
            Add Module
          </Button>
        </div>
      </div>

      <AddModuleModal
        isOpen={isAddModuleOpen}
        onClose={() => setIsAddModuleOpen(false)}
      />

      {/* Gradient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MODULES.map((module) => (
          <Card
            key={module.id}
            className="group overflow-hidden border border-grayScale-50 shadow-sm hover:shadow-lg transition-all duration-300 rounded-[16px] bg-white flex flex-col h-full"
          >
            {/* Gradient Banner */}
            <div
              className={cn(
                "h-36 w-full bg-gradient-to-b opacity-90 transition-transform duration-700",
                module.gradient,
              )}
            />

            <div className="p-2 pb-4 pt-8 flex-1 flex flex-col">
              <div className="flex gap-4 mb-8">
                {/* Icon Circle */}
                <div className="h-12 w-12 rounded-full bg-[#f3e8ff] flex items-center justify-center p-3 flex-shrink-0 border border-purple-100/50">
                  <module.icon className="h-6 w-6 text-brand-500" />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">
                    {module.title}
                  </h3>
                  <p className="text-grayScale-400 font-medium leading-normal text-[14px]">
                    {module.description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-auto">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-[6px] border-[#9E2891] text-[#9E2891] font-bold  transition-all text-sm"
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
                    className="flex-1 h-12 rounded-[6px] bg-[#D291BC] text-white font-bold opacity-100 cursor-default border-none shadow-none text-sm"
                  >
                    Published
                  </Button>
                ) : (
                  <Button className="flex-1 h-12 rounded-[6px] bg-brand-500 text-white font-bold  shadow-md shadow-brand-500/10 text-sm">
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
