import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  FileText,
  LayoutGrid,
  PlayCircle,
  ClipboardCheck,
  ChevronRight,
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
import uploadIcon from "../../assets/icons/upload.png";

export function CourseManagementPage() {
  const navigate = useNavigate();
  const { programType, courseId } = useParams<{
    programType: string;
    courseId: string;
  }>();

  // Mock data for display titles
  const courseTitles: Record<string, string> = {
    duolingo: "Duolingo English Test",
    ielts: "IELTS Academic",
  };

  const courseDisplayName =
    courseTitles[courseId || ""] || "Duolingo English Test";

  const units = [
    {
      id: "unit1",
      name: "Greetings & Introductions",
      description:
        "Learn basic greetings, self-introductions, and polite expressions in everyday situations.",
      modules: 3,
      videos: 9,
      practices: 9,
      gradient:
        "linear-gradient(135deg, rgba(158, 40, 145, 0.5) 0%, rgba(158, 40, 145, 0.8) 100%)",
    },
    {
      id: "unit2",
      name: "Speaking",
      description:
        "Core speaking practice and skill building for natural pronunciation and fluency.",
      modules: 3,
      videos: 9,
      practices: 9,
      gradient:
        "linear-gradient(135deg, rgba(79, 70, 229, 0.5) 0%, rgba(79, 70, 229, 0.8) 100%)",
    },
    {
      id: "unit3",
      name: "Reading",
      description:
        "Reading comprehension and vocabulary improvement through various text types.",
      modules: 3,
      videos: 9,
      practices: 9,
      gradient:
        "linear-gradient(135deg, rgba(124, 58, 237, 0.5) 0%, rgba(124, 58, 237, 0.8) 100%)",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to={`/new-content/courses/${programType}`}
        className="flex items-center gap-2.5 text-[15px] font-semibold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to Courses
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-[28px] font-medium tracking-tight text-grayScale-900">
            {courseDisplayName}
          </h1>
          <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-grayScale-500">
            Manage units and modules inside the {courseDisplayName}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white shadow-sm hover:bg-brand-600 transition-all flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[600px] p-0 border-none rounded-[16px] overflow-hidden">
              <div className="bg-white">
                <DialogHeader className="px-8 py-6 border-b border-grayScale-200 flex flex-row items-center justify-between">
                  <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                    Create Courses
                  </DialogTitle>
                </DialogHeader>

                <div className="p-8 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Unit Name
                    </label>
                    <Input
                      placeholder="e.g. Reading"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Thumbnail
                    </label>
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

                <div className="px-8 py-6 bg-grayScale-50/30 border-t border-grayScale-50 flex justify-end gap-3">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="h-11 px-8 rounded-[8px] border-grayScale-200 text-grayScale-700 font-bold"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button className="h-11 px-8 rounded-[8px] bg-brand-500 text-white font-bold hover:bg-brand-600">
                    Create Courses
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-brand-500 text-brand-500 font-bold hover:bg-brand-50 transition-all flex items-center gap-2"
            onClick={() =>
              navigate(`/new-content/courses/${programType}/attach-practice`)
            }
          >
            <FileText className="h-5 w-5" />
            Attach Practice
          </Button>
        </div>
      </div>

      {/* Horizontal Divider */}
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

      {/* Grid of Units */}
      <div className="flex flex-wrap gap-4 pt-4">
        {units.map((unit) => (
          <Card
            key={unit.id}
            className="group flex w-[400px] flex-col h-full bg-white rounded-[12px] border border-grayScale-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            {/* Gradient Header */}
            <div
              className="h-36 w-full transition-transform duration-500 "
              style={{ background: unit.gradient }}
            />

            <div className="p-4 flex flex-col flex-1 space-y-6">
              <div className="space-y-3 flex-1">
                <h3 className="text-[18px] font-medium text-grayScale-900  transition-colors">
                  {unit.name}
                </h3>
                <p className="text-[12px] text-grayScale-500 font-medium line-clamp-3">
                  {unit.description}
                </p>
              </div>

              {/* Stats Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="h-9 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <LayoutGrid className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {unit.modules} Modules
                  </span>
                </div>
                <div className="h-9 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <PlayCircle className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {unit.videos} Videos
                  </span>
                </div>
                <div className="h-9 px-3 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-600">
                  <ClipboardCheck className="h-3.5 w-3.5 text-grayScale-400" />
                  <span className="text-[12px] font-bold">
                    {unit.practices} Practices
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full h-10 bg-brand-500  text-white rounded-[6px] font-bold flex items-center justify-center gap-2 group/btn"
                onClick={() =>
                  navigate(
                    `/new-content/courses/${programType}/${courseId}/${unit.id}`,
                  )
                }
              >
                View Detail
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
