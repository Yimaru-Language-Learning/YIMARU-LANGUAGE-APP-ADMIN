import { Outlet } from "react-router-dom";
import { ContentHierarchyList } from "./components/ContentHierarchyList";

export function ContentManagementLayout() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-1 rounded-full bg-gradient-to-b from-brand-500 to-brand-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-900 sm:text-[1.65rem]">
              Content Management
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-grayScale-500">
              View and manage practice content for courses, modules, and lessons
            </p>
          </div>
        </div>

        <ContentHierarchyList />
      </div>

      <Outlet />
    </div>
  );
}
