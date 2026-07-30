import { useState } from "react";
import { ContentHierarchyList } from "./components/ContentHierarchyList";
import { ExamPrepContentHierarchyList } from "./components/ExamPrepContentHierarchyList";
import { PageBackLink } from "../../components/navigation/PageBackLink";
import { cn } from "../../lib/utils";

type ReorderTab = "learn_english" | "exam_prep";

export function ReorderContentPage() {
  const [tab, setTab] = useState<ReorderTab>("learn_english");

  return (
    <div className="animate-in fade-in space-y-4 pb-10 duration-500">
      <div className="space-y-3">
        <PageBackLink
          fallbackTo="/new-content"
          label="Back to Content Management"
          iconClassName="h-4 w-4 group-hover:-translate-x-1"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-grayScale-700">
              Reorder Content
            </h1>
            <p className="max-w-2xl text-xs text-grayScale-500">
              Drag and drop to change order. Changes save automatically on drop.
            </p>
          </div>

          <div className="flex w-fit shrink-0 gap-0.5 rounded-md border border-grayScale-200 bg-grayScale-50 p-0.5">
            <button
              type="button"
              onClick={() => setTab("learn_english")}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold transition-colors",
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
                "rounded px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === "exam_prep"
                  ? "bg-white text-grayScale-900 shadow-sm"
                  : "text-grayScale-500 hover:text-grayScale-700",
              )}
            >
              Duolingo/IELTS
            </button>
          </div>
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
