import { Link } from "react-router-dom";
import { GraduationCap, Brain } from "lucide-react";
import { PageBackLink } from "../../components/navigation/PageBackLink";

export function ProgramTypeSelectionPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageBackLink fallbackTo="/new-content" label="Back to Content Management" />
      {/* Header section */}
      <div className="space-y-1.5 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-grayScale-900">
          Courses
        </h1>
        <p className="max-w-2xl text-[15px] font-medium text-grayScale-500">
          Organize courses under skill-based learning or English Proficiency
          Exams. Select a program type to manage curriculum and modules.
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

      {/* Selection Cards Grid — equal width/height, consistent content alignment */}
      <div className="grid max-w-5xl grid-cols-1 items-stretch gap-8 pt-4 md:grid-cols-2">
        {/* Skill-Based Courses Card */}
        <Link to="/new-content/courses/skill-based" className="group h-full">
          <div className="flex h-full flex-col items-start gap-10 rounded-[6px] border border-grayScale-100 bg-white px-10 py-12 transition-all">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50/10">
              <Brain className="h-8 w-8 text-brand-500" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col space-y-3">
              <h3 className="text-[20px] font-bold text-grayScale-900">
                Skill-Based Courses
              </h3>
              <p className="flex-1 text-[15px] font-medium leading-relaxed text-grayScale-500">
                Practice-focused communication and skills training. Create
                modules for vocabulary, grammar, and real-world conversation
                scenarios.
              </p>
            </div>
          </div>
        </Link>

        {/* English Proficiency Exams Card */}
        <Link to="/new-content/courses/proficiency" className="group h-full">
          <div className="flex h-full flex-col items-start gap-10 rounded-[6px] border border-grayScale-100 bg-white px-10 py-12 transition-all">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50/10">
              <GraduationCap className="h-8 w-8 text-brand-500" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col space-y-3">
              <h3 className="text-[20px] font-bold text-grayScale-900 transition-colors">
                English Proficiency Exams
              </h3>
              <p className="flex-1 text-[15px] font-medium leading-relaxed text-grayScale-500">
                English Proficiency Exams courses. Structure content by band
                scores, sections, and mock tests.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
