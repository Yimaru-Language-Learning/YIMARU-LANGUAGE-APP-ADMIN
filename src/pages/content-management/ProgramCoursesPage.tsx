import { ArrowLeft, Plus, FileText } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import uploadIcon from "../../assets/icons/upload.png";

export function ProgramCoursesPage() {
  const navigate = useNavigate();
  const { level } = useParams<{ level: string }>();

  const courses = [
    {
      id: "a1",
      title: "A1",
      description:
        "Learn basic English words, phrases, and simple sentences for daily situations.",
      stats: {
        modules: 3,
        videos: 15,
        practices: 18,
      },
    },
    {
      id: "a2",
      title: "A2",
      description:
        "Build on basic skills with longer sentences, and practical conversations.",
      stats: {
        modules: 3,
        videos: 15,
        practices: 18,
      },
    },
  ];

  return (
    <div className="space-y-8 pt-10">
      {/* Navigation */}
      <Link
        to="/new-content/learn-english"
        className="flex items-center gap-2 text-sm font-medium text-grayScale-500 transition-colors hover:text-brand-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Programs
      </Link>

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-grayScale-700 capitalize">
            {level || "Program"}
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-grayScale-400">
            Designed for learners starting from scratch. Focuses on simple
            grammar, and everyday communication.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to={`/new-content/learn-english/${level}/courses/add-practice`}>
            <Button
              variant="outline"
              className="rounded-[6px] border-brand-500 text-brand-500 "
            >
              <FileText className="mr-2 h-4 w-4" />
              Add Practice
            </Button>
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600">
                <Plus className="mr-2 h-5 w-5" />
                Add Courses
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl gap-0 border-none p-0">
              <DialogHeader className="p-8 pb-4">
                <DialogTitle className="text-2xl font-bold text-grayScale-700">
                  Add New Course
                </DialogTitle>
                <DialogDescription className="text-sm text-grayScale-400">
                  Create a CEFR-aligned course inside this program.
                </DialogDescription>
              </DialogHeader>

              {/* Gradient Divider */}
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
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

              <form className="space-y-6 p-8 pt-4">
                <div className="space-y-2">
                  <label className="text-[15px] font-medium text-grayScale-700">
                    Course Name
                  </label>
                  <Input placeholder="e.g. A1" className="h-12 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-medium text-grayScale-700">
                    Description
                  </label>
                  <Input
                    placeholder="Brief overview of what learners will achieve in this course"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-medium text-grayScale-700">
                    Course Order
                  </label>
                  <Select className="h-12 rounded-xl">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[15px] font-medium text-grayScale-700">
                    Thumbnail
                  </label>
                  <div className="relative group cursor-pointer">
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#9E289133] bg-white p-10 transition-all">
                      <div className="mb-4">
                        <img
                          src={uploadIcon}
                          alt="Upload icon"
                          className="h-10 w-10"
                        />
                      </div>
                      <p className="text-sm">
                        <span className="font-bold text-[#9E2891]">
                          Click to upload
                        </span>{" "}
                        <span className="text-grayScale-500">
                          or drag and drop
                        </span>
                      </p>
                      <p className="mt-1 text-xs font-medium text-grayScale-400 uppercase tracking-wider">
                        JPG, PNG (MAX 1 MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="h-12 min-w-[120px] rounded-xl border-grayScale-200 font-semibold"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button className="h-12 min-w-[160px] rounded-xl bg-brand-500 font-semibold hover:bg-brand-600">
                    Create Course
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
      <div className="flex flex-warp gap-10 ">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="group w-[290px] overflow-hidden  border border-grayScale-100 shadow-soft transition-all duration-300 hover:shadow-lg"
          >
            {/* Gradient Header */}
            <div
              className="h-32 w-full"
              style={{
                background:
                  "linear-gradient(135deg, #9E289180 0%, #9E2891 100%)",
              }}
            />
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-grayScale-700">
                {course.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-grayScale-500 line-clamp-2">
                {course.description}
              </p>

              {/* Stats */}
              <div className="my-6 grid grid-cols-3 gap-4 border-y border-grayScale-50 py-4">
                <div className="text-center">
                  <p className="text-base font-bold text-grayScale-700">
                    {course.stats.modules}
                  </p>
                  <p className="text-[10px] font-medium text-grayScale-400 uppercase tracking-wider">
                    Modules
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-grayScale-700">
                    {course.stats.videos}
                  </p>
                  <p className="text-[10px] font-medium text-grayScale-400 uppercase tracking-wider">
                    Videos
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-grayScale-700">
                    {course.stats.practices}
                  </p>
                  <p className="text-[10px] font-medium text-grayScale-400 uppercase tracking-wider">
                    Practices
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-10 flex-1 rounded-[6px] border-brand-500 text-[13px] font-semibold text-brand-500 "
                  onClick={() =>
                    navigate(
                      `/new-content/learn-english/${level}/courses/${course.title.toLowerCase()}`,
                    )
                  }
                >
                  View Detail
                </Button>
                <Button className="h-10 flex-1 rounded-[6px] bg-brand-500 text-[13px] font-semibold ">
                  Publish Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
