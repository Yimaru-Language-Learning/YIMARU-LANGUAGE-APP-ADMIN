import { ContentHierarchyList } from "./components/ContentHierarchyList";
import { PageBackLink } from "../../components/navigation/PageBackLink";

export function ReorderContentPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-6">
        <PageBackLink fallbackTo="/new-content" label="Back to Content Management" iconClassName="h-5 w-5 group-hover:-translate-x-1" />

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
