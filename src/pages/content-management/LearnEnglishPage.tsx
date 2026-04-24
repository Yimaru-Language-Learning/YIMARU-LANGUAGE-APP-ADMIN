import { Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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

export function LearnEnglishPage() {
  const levels = [
    {
      id: "beginner",
      title: "Beginner",
      description:
        "Designed for learners starting from scratch. Focuses on simple grammar, and everyday communication.",
    },
    {
      id: "intermediate",
      title: "Intermediate",
      description:
        "For learners who can communicate at a basic level and want to improve fluency, accuracy, and confidence.",
    },
    {
      id: "advanced",
      title: "Advanced",
      description:
        "Targets advanced learners aiming for professional, academic, and complex conversational English.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">
            Learn English
          </h1>
          <p className="mt-1 text-sm text-grayScale-500">
            Manage learning content by level
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-[6px] bg-brand-500 px-6 font-semibold ">
              <Plus className="mr-2 h-5 w-5" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl gap-0 border-none p-0">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-bold text-grayScale-700">
                Add New Program
              </DialogTitle>
              <DialogDescription className="text-sm text-grayScale-400">
                Create a learning program to group courses by learner level
              </DialogDescription>
            </DialogHeader>
            {/* Gradient Divider */}
            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
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

            <form className="space-y-6 p-8 pt-4">
              <div className="space-y-2">
                <label className="text-[15px] text-grayScale-700">
                  Program Name
                </label>
                <Input
                  placeholder="e.g. Beginner"
                  className="h-12 rounded-xl ring-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[15px] text-grayScale-700">
                  Description
                </label>
                <Input
                  placeholder="Short description explaining who this program is for"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[15px]  text-grayScale-700">
                  Program Order
                </label>
                <Select className="h-12 rounded-xl">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[15px] text-grayScale-700">
                  Thumbnail
                </label>
                <div className="relative group cursor-pointer">
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#9E289133] bg-white p-10 transition-all ">
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
                    className="h-12 min-w-[120px] rounded-[6px] border-grayScale-200 font-semibold"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button className="h-12 min-w-[160px] rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600">
                  Create Program
                </Button>
              </div>
            </form>
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

      {/* Cards Grid */}
      <div className="flex flex-warp gap-10">
        {levels.map((level) => (
          <Card
            key={level.title}
            className="group w-[290px] overflow-hidden border-none shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Gradient Header */}
            <div
              className="h-32 w-full"
              style={{
                background:
                  "linear-gradient(135deg, #9E289180 0%, #9E2891 100%)",
              }}
            />
            <CardContent className="bg-white p-6 flex flex-col h-[280px]">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-grayScale-700">
                  {level.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-grayScale-500">
                  {level.description}
                </p>
              </div>
              <Link to={`/new-content/learn-english/${level.id}/courses`}>
                <Button className="h-11 w-full rounded-[6px] bg-brand-500 font-semibold hover:bg-brand-600">
                  View Courses
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
