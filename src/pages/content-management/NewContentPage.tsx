import { Link } from "react-router-dom";
import { Mic } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export function NewContentPage() {
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">
            Content Management
          </h1>
          <p className="mt-1 text-sm text-grayScale-500">
            Upload, organize, and manage learning content across programs and
            courses
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          <Link to="/new-content/question-types">
            <Button className="h-10 px-6 rounded-[6px] bg-brand-500 font-bold text-white shadow-sm hover:bg-brand-600 transition-all">
              Manage Question Types
            </Button>
          </Link>
          <Link to="/new-content/reorder">
            <Button
              variant="outline"
              className="h-10 px-6 rounded-[6px] border-brand-500 font-bold text-brand-500 hover:bg-brand-50 transition-all"
            >
              Reorder Content
            </Button>
          </Link>
        </div>
      </div>

      {/* Gradient Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-grayScale-100" />
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
      <div className="grid max-w-5xl gap-8 grid-cols-1 md:grid-cols-2">
        {/* Learn English Card */}
        <Card className="overflow-hidden border-none shadow-soft">
          <div className="flex h-56 items-center justify-center bg-white/50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100/30">
              <Mic className="h-10 w-10 text-brand-500" />
            </div>
          </div>
          <CardContent className="border-t border-grayScale-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-grayScale-700">
              Learn English
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-grayScale-500">
              Manage structured English learning content based on levels and
              modules.
            </p>
            <Link to="/new-content/learn-english">
              <Button className="mt-8 h-12 w-full rounded-[6px] bg-brand-500 text-base font-semibold ">
                Manage Learn English
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Courses Card */}
        <Card className="overflow-hidden border-none shadow-soft">
          <div className="flex h-56 items-center justify-center bg-white/50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100/30">
              <Mic className="h-10 w-10 text-brand-500" />
            </div>
          </div>
          <CardContent className="border-t border-grayScale-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-grayScale-700">Courses</h3>
            <p className="mt-3 text-sm leading-relaxed text-grayScale-500">
              Manage skill-based and Duolingo/IELTS courses.
            </p>
            <Link to="/new-content/courses" className="block w-full">
              <Button className="mt-8 h-12 w-full rounded-[6px] bg-brand-500 text-base font-semibold ">
                Manage Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
