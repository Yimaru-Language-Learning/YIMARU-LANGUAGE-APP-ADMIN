import { Link } from "react-router-dom";
import { GraduationCap, Brain } from "lucide-react";

export function ProgramTypeSelectionPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="space-y-1.5 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-grayScale-900">
          Courses
        </h1>
        <p className="max-w-2xl text-[15px] font-medium  text-grayScale-500">
          Organize courses under skill-based learning or English proficiency
          exams. Select a program type to manage curriculum and modules.
        </p>
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

      {/* Selection Cards Grid */}
      <div className="flex flex-warp gap-10 pt-4">
        {/* Skill-Based Courses Card */}
        <Link to="/new-content/courses/skill-based" className="group h-full">
          <div className="bg-white rounded-[6px] w-[500px] border border-grayScale-100 px-10 py-12 h-full transition-all flex flex-col items-start gap-10">
            <div className="h-16 w-16 rounded-full bg-brand-50/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-brand-500" />
            </div>

            <div className="space-y-3 flex-1">
              <h3 className="text-[20px] font-bold text-grayScale-900">
                Skill-Based Courses
              </h3>
              <p className="text-[15px] leading-relaxed text-grayScale-500 font-medium">
                Practice-focused communication and skills training. Create
                modules for vocabulary, grammar, and real-world conversation
                scenarios.
              </p>
            </div>
          </div>
        </Link>

        {/* English Proficiency Exams Card */}
        <Link to="/new-content/courses/proficiency" className="group h-full">
          <div className="bg-white w-[500px] rounded-[6px] border border-grayScale-100 px-10 py-12 h-full transition-all flex flex-col items-start gap-10">
            <div className="h-16 w-16 rounded-full bg-brand-50/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-brand-500" />
            </div>

            <div className="space-y-3 flex-1">
              <h3 className="text-[20px] font-bold text-grayScale-900 transition-colors">
                English Proficiency Exams
              </h3>
              <p className="text-[15px] leading-relaxed text-grayScale-500 font-medium">
                Exam preparation courses such as IELTS, and Duolingo. Structure
                content by band scores, sections, and mock tests.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
