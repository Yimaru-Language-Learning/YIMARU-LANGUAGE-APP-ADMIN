import { useState } from "react";
import { ContentHierarchyList } from "./components/ContentHierarchyList";
import { ExamPrepContentHierarchyList } from "./components/ExamPrepContentHierarchyList";
import { PageBackLink } from "../../components/navigation/PageBackLink";
import { cn } from "../../lib/utils";

type ReorderTab = "learn_english" | "exam_prep";

export function ReorderContentPage() {
  const [tab, setTab] = useState<ReorderTab>("learn_english");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-6">
        <PageBackLink fallbackTo="/new-content" label="Back to Content Management" iconClassName="h-5 w-5 group-hover:-translate-x-1" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-700">
            Reorder Content
          </h1>
          <p className="max-w-2xl text-sm text-grayScale-500">
            Drag and drop items to change their display order. Changes are saved
            automatically when you drop an item.
          </p>
        </div>

        <div className="flex gap-2 rounded-lg border border-grayScale-200 bg-grayScale-50 p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab("learn_english")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              tab === "learn_english"
                ? "bg-white text-grayScale-900 shadow-sm"
                : "text-grayScale-500 hover:text-grayScale-700",
            )}
          >
            Learn English
          </button>
          <button
            type="button"
            onClick={() => setTab("exam_prep")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              tab === "exam_prep"
                ? "bg-white text-grayScale-900 shadow-sm"
                : "text-grayScale-500 hover:text-grayScale-700",
            )}
          >
            Exam prep
          </button>
        </div>
      </div>

      {tab === "learn_english" ? (
        <ContentHierarchyList />
      ) : (
        <ExamPrepContentHierarchyList />
      )}
    </div>
  );
}
