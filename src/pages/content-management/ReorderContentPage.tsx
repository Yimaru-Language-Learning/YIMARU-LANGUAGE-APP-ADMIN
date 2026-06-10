import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ContentHierarchyList } from "./components/ContentHierarchyList";

export function ReorderContentPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-6">
        <Link
          to="/new-content"
          className="flex items-center gap-2 text-[15px] font-bold text-grayScale-600 transition-colors hover:text-brand-500 group w-fit"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          Back to Content Management
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">
            Reorder Content
          </h1>
          <p className="max-w-2xl text-sm text-grayScale-500">
            Drag and drop programs, courses, modules, and lessons to change
            their display order. Changes are saved automatically when you drop an
            item.
          </p>
        </div>
      </div>

      <ContentHierarchyList />
    </div>
  );
}
