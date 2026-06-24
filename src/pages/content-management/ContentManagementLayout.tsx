import { Outlet } from "react-router-dom";

export function ContentManagementLayout() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-0 py-4 sm:px-4 sm:py-6 lg:px-6">
      <div className="mb-8">
        <div className="mb-8 flex items-center gap-3">
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
      </div>

      <Outlet />
    </div>
  );
}
