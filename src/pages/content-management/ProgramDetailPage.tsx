import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  FileText,
  ClipboardList,
  ListChecks,
  ChevronRight,
  X,
  Upload,
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

export function ProgramDetailPage() {
  const navigate = useNavigate();
  const { programType } = useParams<{ programType: string }>();

  // Mock data for "proficiency" program type
  const programs: Record<string, any> = {
    proficiency: {
      title: "English Proficiency Exams",
      description:
        "Manage exam-based learning programs such as Duolingo and IELTS.",
      courses: [
        {
          id: "duolingo",
          name: "Duolingo English Test",
          description:
            "Adaptive exam-style practice for speaking, writing, reading, and listening.",
          coursesCount: 6,
          questionTypesCount: 13,
          logo: (
            <div className="h-14 w-14 rounded-full bg-[#FFB800] flex items-center justify-center relative overflow-hidden">
              {/* Simple Duolingo-like representation if image not available */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-[#FFB800] rounded-sm transform rotate-45" />
              </div>
            </div>
          ),
          buttonText: "Manage Detail",
        },
        {
          id: "ielts",
          name: "IELTS Academic",
          description:
            "Full preparation for IELTS speaking, writing, listening, and reading.",
          coursesCount: 4,
          questionTypesCount: 18,
          logo: (
            <div className="flex items-center gap-1">
              <span className="text-[28px] font-black tracking-tighter text-[#E11D48] ">
                IELTS
              </span>
              <span className="text-[8px] font-bold text-[#E11D48] mt-2 tracking-widest uppercase">
                ™
              </span>
            </div>
          ),
          buttonText: "View Detail",
        },
      ],
    },
    "skill-based": {
      title: "Skill-Based Courses",
      description:
        "Practice-focused communication and skills training for real-world scenarios.",
      courses: [], // To be implemented or shown if needed
    },
  };

  const currentProgram =
    programs[programType || "proficiency"] || programs.proficiency;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <Link
        to="/new-content/courses"
        className="flex items-center gap-2.5 text-[15px] font-semibold text-grayScale-600 hover:text-brand-500 transition-colors pt-4 group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back
      </Link>

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-[26px] font-medium tracking-tight text-grayScale-900">
            {currentProgram.title}
          </h1>
          <p className="max-w-2xl text-[15px] font-medium  text-grayScale-500">
            {currentProgram.description}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white transition-all flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[600px] p-0 border-none rounded-[16px] overflow-hidden">
              <div className="bg-white">
                <DialogHeader className="px-8 py-6 border-b border-grayScale-200 flex flex-row items-center justify-between">
                  <DialogTitle className="text-[20px] font-bold relative top-2 text-grayScale-900">
                    Create Course
                  </DialogTitle>
                </DialogHeader>

                <div className="p-8 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Name
                    </label>
                    <Input
                      placeholder="e.g. TOEFL, IELTS"
                      className="h-12 border-grayScale-400 rounded-[8px] px-4 placeholder:text-grayScale-400 text-[15px] focus:ring-brand-500/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[15px] text-grayScale-800">
                      Course Order
                    </label>
                    <Select defaultValue="1">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </Select>
                  </div>

                  {/* Thumbnail Field */}
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
                    Create Program
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="h-10 px-6 rounded-[6px] border-brand-500 text-brand-500 font-bold  flex items-center gap-2"
            onClick={() =>
              navigate(`/new-content/courses/${programType}/attach-practice`)
            }
          >
            <FileText className="h-5 w-5" />
            Attach Practice
          </Button>
        </div>
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

      {/* Cards Grid */}
      <div className="flex flex-wrap gap-8 mt-10">
        {currentProgram.courses.map((course: any) => (
          <Card
            key={course.id}
            className="bg-white w-[500px] rounded-[20px] border border-grayScale-100 p-6 flex flex-col items-start  shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Logo */}
            <div className="h-16 flex items-center">{course.logo}</div>

            {/* Content */}
            <div className="space-y-4 pt-2 flex-1">
              <h3 className="text-[18px] font-medium text-grayScale-900">
                {course.name}
              </h3>
              <p className="text-[14px] text-grayScale-500 font-medium">
                {course.description}
              </p>
            </div>

            {/* Badges/Stats */}
            <div className="flex items-center pt-4 gap-4">
              <div className="h-10 px-4 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-700">
                <ClipboardList className="h-3 w-3 text-grayScale-400" />
                <span className="text-[12px] ">
                  {course.coursesCount} Courses
                </span>
              </div>
              <div className="h-10 px-4 rounded-[6px] bg-grayScale-100 border border-grayScale-100 flex items-center gap-2 text-grayScale-700">
                <ListChecks className="h-3 w-3 text-grayScale-400" />
                <span className="text-[12px] ">
                  {course.questionTypesCount} Question Types
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full mt-4 h-10 bg-brand-500  text-white rounded-[8px] font-bold flex items-center justify-center gap-2 group/btn"
              onClick={() =>
                navigate(`/new-content/courses/${programType}/${course.id}`)
              }
            >
              {course.buttonText}
              <ChevronRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
