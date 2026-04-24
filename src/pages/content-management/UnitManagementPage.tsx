import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  MessageCircle,
  PlayCircle,
  ClipboardCheck,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import uploadIcon from "../../assets/icons/upload.png";

export function UnitManagementPage() {
  const navigate = useNavigate();
  const { programType, courseId, unitId } = useParams<{
    programType: string;
    courseId: string;
    unitId: string;
  }>();

  // Mock titles
  const unitTitles: Record<string, string> = {
    unit1: "Greetings & Introductions",
    unit2: "Speaking",
    unit3: "Reading",
  };

  const unitDisplayName =
    unitTitles[unitId || ""] || "Greetings & Introductions";

  const modules = [
    {
      id: "mod1",
      name: "Module 1: Basic Phrases",
      description: "Learn essential phrases for daily conversations.",
      videos: 3,
      practices: 3,
      gradient:
        "linear-gradient(135deg, rgba(158, 40, 145, 0.4) 0%, rgba(158, 40, 145, 0.7) 100%)",
    },
    {
      id: "mod2",
      name: "Module 1: Basic Phrases", // Matching Image 2092-1 labels
      description: "Learn essential phrases for daily conversations.",
      videos: 3,
      practices: 3,
      gradient:
        "linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(79, 70, 229, 0.7) 100%)",
    },
    {
      id: "mod3",
      name: "Module 1: Basic Phrases",
      description: "Learn essential phrases for daily conversations.",
      videos: 3,
      practices: 3,
      gradient:
        "linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0.7) 100%)",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to={`/new-content/courses/${programType}/${courseId}`}
        className="flex items-center gap-2.5 text-[15px] font-semibold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to Courses
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between">
        <h1 className="text-[28px] font-medium tracking-tight text-grayScale-900">
          {unitDisplayName}
        </h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white shadow-sm hover:bg-brand-600 transition-all flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Modules
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[600px] p-0 border-none rounded-[16px] overflow-hidden">
            <div className="bg-white">
              <DialogHeader className="px-8 py-6 border-b border-grayScale-200 flex flex-row items-center justify-between">
                <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                  Create Modules
                </DialogTitle>
                <DialogClose className="rounded-full p-1.5 hover:bg-grayScale-50 transition-colors">
                  <X className="h-5 w-5 text-grayScale-400" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </DialogHeader>

              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[15px] text-grayScale-800">
                    Module Title
                  </label>
                  <Input
                    placeholder="e.g. 1.1 Exam types"
                    className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[15px] text-grayScale-800">
                    Module Order
                  </label>
                  <Select defaultValue="1">
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[15px] text-grayScale-800">Icon</label>
                  <div className="relative group cursor-pointer">
                    <div className="flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-grayScale-400 bg-white py-8 px-10 transition-all ">
                      <div className="mb-4">
                        <img
                          src={uploadIcon}
                          alt="Upload icon"
                          className="h-10 w-10"
                        />
                      </div>
                      <p className="text-[15px]">
                        <span className="text-brand-500 font-bold hover:underline">
                          Click to upload
                        </span>{" "}
                        <span className="text-grayScale-500">
                          or drag and drop
                        </span>
                      </p>
                      <p className="mt-1.5 text-[12px] text-grayScale-400 uppercase tracking-widest">
                        JPG, PNG (MAX 1 MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-200 flex justify-end gap-3">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600">
                  Create Module
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gradient Divider */}
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

      {/* Grid of Modules */}
      <div className="flex flex-wrap gap-4 pt-4">
        {modules.map((module, index) => (
          <Card
            key={`${module.id}-${index}`}
            className="group flex w-[400px] flex-col bg-white rounded-[12px] border border-grayScale-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            {/* Gradient Header */}
            <div
              className="h-36 w-full"
              style={{ background: module.gradient }}
            />

            <div className="p-5 flex flex-col space-y-4">
              <div className="flex items-start gap-3">
                {/* Chat Icon */}
                <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-[#9E28911A] border border-[#9E289133] flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-brand-500" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-[16px] font-medium text-grayScale-900 leading-tight">
                    {module.name}
                  </h3>
                  <p className="text-[12px] text-grayScale-500 font-medium">
                    {module.description}
                  </p>
                </div>
              </div>

              {/* Stats Pills */}
              <div className="flex items-center gap-3">
                <div className="h-8 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <PlayCircle className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {module.videos} Videos
                  </span>
                </div>
                <div className="h-8 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <ClipboardCheck className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {module.practices} Practices
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full h-10 bg-brand-500 text-white rounded-[6px] font-bold flex items-center justify-center gap-2 group/btn"
                onClick={() =>
                  navigate(
                    `/new-content/courses/${programType}/${courseId}/${unitId}/${module.id}`,
                  )
                }
              >
                View Detail
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
