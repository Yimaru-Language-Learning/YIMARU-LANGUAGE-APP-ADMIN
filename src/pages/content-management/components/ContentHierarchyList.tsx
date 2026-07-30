import { notifyApiError } from "../../../lib/apiErrors"
import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  BookOpen,
  Layers,
  PlayCircle,
  RotateCcw,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { toast } from "sonner";
import {
  getLearningPrograms,
  getProgramCourses,
  getTopLevelCourseModules,
  getModuleLessons,
  reorderLearningPrograms,
  reorderProgramCourses,
  reorderTopLevelCourseModules,
  reorderModuleLessons,
} from "../../../api/courses.api";

export function sortBySortOrder<T extends { sort_order?: number }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
  );
}

// --- Types ---
export type ItemType = "program" | "course" | "module" | "lesson";

export interface BaseItem {
  id: string;
  name: string;
  thumbnail?: string;
}

export interface Program extends BaseItem {}
export interface Course extends BaseItem {
  programId: string;
}
export interface Module extends BaseItem {
  courseId: string;
}
export interface Lesson extends BaseItem {
  moduleId: string;
}

// --- Components ---

interface SortableItemProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  thumbnail?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function SortableItem({
  id,
  name,
  icon,
  thumbnail,
  onEdit,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/item mb-1 flex items-center justify-between rounded border border-grayScale-200 bg-white px-2 py-1.5 transition-all duration-150 dark:bg-grayScale-50",
        isDragging && "z-50 border-dashed opacity-50 shadow-sm",
        !isDragging && "hover:border-brand-200 hover:shadow-sm",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-0.5 text-grayScale-300 transition-colors hover:text-brand-500 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-grayScale-100 bg-grayScale-50">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-grayScale-400 transition-colors group-hover/item:text-brand-500 [&>svg]:h-3.5 [&>svg]:w-3.5">
                {icon}
              </div>
            )}
          </div>

          <span className="truncate text-xs font-semibold leading-tight text-grayScale-800">
            {name}
          </span>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100">
          {onEdit ? (
            <button
              onClick={() => onEdit(id)}
              className="rounded p-1 text-grayScale-400 transition-all"
              title="Edit"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          ) : null}
          {onDelete ? (
            <button
              onClick={() => onDelete(id)}
              className="rounded p-1 text-grayScale-400 transition-all"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface DraggableListProps {
  items: BaseItem[];
  onReorder: (activeId: string, overId: string) => void;
  icon: React.ReactNode;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DraggableList({
  items,
  onReorder,
  icon,
  onEdit,
  onDelete,
}: DraggableListProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
    setActiveId(null);
  };

  const activeItem = items.find((i) => i.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              name={item.name}
              thumbnail={item.thumbnail}
              icon={icon}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className="flex cursor-grabbing items-center gap-2 rounded border border-brand-300 bg-white px-2 py-1.5 opacity-90 shadow-lg dark:bg-grayScale-50">
            <GripVertical className="h-3.5 w-3.5 text-grayScale-400" />
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-grayScale-100 bg-grayScale-50">
              {activeItem.thumbnail ? (
                <img
                  src={activeItem.thumbnail}
                  alt={activeItem.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-brand-500 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</div>
              )}
            </div>
            <span className="truncate text-xs font-semibold text-grayScale-800">
              {activeItem.name}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function HierarchySection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: SectionProps) {
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-grayScale-100 bg-white transition-all duration-200 dark:bg-grayScale-50">
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 transition-colors",
          isOpen ? "bg-grayScale-50" : "hover:bg-grayScale-25",
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded p-1.5 transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5",
              isOpen
                ? "bg-brand-300 text-white"
                : "bg-grayScale-50 text-grayScale-500",
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              isOpen ? "text-grayScale-900" : "text-grayScale-700",
            )}
          >
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-grayScale-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-grayScale-400" />
        )}
      </button>
      {isOpen ? (
        <div className="border-t border-grayScale-100 px-3 py-2">{children}</div>
      ) : null}
    </div>
  );
}

export function ContentHierarchyList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    program: true,
  });

  const fetchHierarchy = useCallback(async () => {
    setLoading({ program: true });
    try {
      // 1. Fetch Programs
      const programsRes = await getLearningPrograms();
      const programData = programsRes.data?.data;
      const fetchedPrograms: Program[] = sortBySortOrder(
        programData?.programs || [],
      ).map(
        (p) => ({
          id: String(p.id),
          name: p.name,
          thumbnail: p.thumbnail || undefined,
        }),
      );
      setPrograms(fetchedPrograms);
      setLoading((prev) => ({ ...prev, program: false }));

      if (fetchedPrograms.length === 0) return;

      // 2. Fetch Courses for all programs
      setLoading((prev) => ({ ...prev, course: true }));
      const coursesPromises = fetchedPrograms.map((p) =>
        getProgramCourses(Number(p.id)),
      );
      const coursesResults = await Promise.all(coursesPromises);
      const fetchedCourses: Course[] = coursesResults.flatMap((res, idx) => {
        const courseData = res.data?.data;
        return sortBySortOrder(courseData?.courses || []).map((c) => ({
          id: String(c.id),
          name: c.name,
          thumbnail: c.thumbnail_url || c.thumbnail || undefined,
          programId: fetchedPrograms[idx].id,
        }));
      });
      setCourses(fetchedCourses);
      setLoading((prev) => ({ ...prev, course: false }));

      if (fetchedCourses.length === 0) return;

      // 3. Fetch Modules for all courses
      setLoading((prev) => ({ ...prev, module: true }));
      const modulesPromises = fetchedCourses.map((c) =>
        getTopLevelCourseModules(Number(c.id)),
      );
      const modulesResults = await Promise.all(modulesPromises);
      const fetchedModules: Module[] = modulesResults.flatMap((res, idx) => {
        const moduleData = res.data?.data;
        return sortBySortOrder(moduleData?.modules || []).map((m) => ({
          id: String(m.id),
          name: m.name,
          thumbnail: m.icon || undefined,
          courseId: fetchedCourses[idx].id,
        }));
      });
      setModules(fetchedModules);
      setLoading((prev) => ({ ...prev, module: false }));

      if (fetchedModules.length === 0) return;

      // 4. Fetch Lessons for all modules
      setLoading((prev) => ({ ...prev, lesson: true }));
      const lessonsPromises = fetchedModules.map((m) =>
        getModuleLessons(Number(m.id)),
      );
      const lessonsResults = await Promise.all(lessonsPromises);
      const fetchedLessons: Lesson[] = lessonsResults.flatMap((res, idx) => {
        const lessonData = res.data?.data;
        return sortBySortOrder(lessonData?.lessons || []).map((l) => ({
          id: String(l.id),
          name: l.title,
          thumbnail: l.thumbnail || undefined,
          moduleId: fetchedModules[idx].id,
        }));
      });
      setLessons(fetchedLessons);
    } catch (error) {
      console.error("Failed to fetch content hierarchy:", error);
    } finally {
      setLoading({});
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toOrderedIds = (items: BaseItem[]) =>
    items.map((item) => Number(item.id));

  const reorderSiblings = <T extends BaseItem>(
    siblings: T[],
    activeId: string,
    overId: string,
  ): T[] | null => {
    const oldIndex = siblings.findIndex((i) => i.id === activeId);
    const newIndex = siblings.findIndex((i) => i.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return null;
    }
    return arrayMove(siblings, oldIndex, newIndex);
  };

  const handleProgramReorder = async (activeId: string, overId: string) => {
    const reordered = reorderSiblings(programs, activeId, overId);
    if (!reordered) return;

    const previous = programs;
    setPrograms(reordered);
    try {
      await reorderLearningPrograms({ ordered_ids: toOrderedIds(reordered) });
      toast.success("Programs reordered");
    } catch (error) {
      setPrograms(previous);
      notifyApiError(error, "Failed to reorder programs");
    }
  };

  const handleCourseReorder = async (
    programId: string,
    activeId: string,
    overId: string,
  ) => {
    const siblings = courses.filter((course) => course.programId === programId);
    const reordered = reorderSiblings(siblings, activeId, overId);
    if (!reordered) return;

    const previous = courses;
    setCourses((prev) => [
      ...prev.filter((course) => course.programId !== programId),
      ...reordered,
    ]);
    try {
      await reorderProgramCourses(Number(programId), {
        ordered_ids: toOrderedIds(reordered),
      });
      toast.success("Courses reordered");
    } catch (error) {
      setCourses(previous);
      notifyApiError(error, "Failed to reorder courses");
    }
  };

  const handleModuleReorder = async (
    courseId: string,
    activeId: string,
    overId: string,
  ) => {
    const siblings = modules.filter((module) => module.courseId === courseId);
    const reordered = reorderSiblings(siblings, activeId, overId);
    if (!reordered) return;

    const previous = modules;
    setModules((prev) => [
      ...prev.filter((module) => module.courseId !== courseId),
      ...reordered,
    ]);
    try {
      await reorderTopLevelCourseModules(Number(courseId), {
        ordered_ids: toOrderedIds(reordered),
      });
      toast.success("Modules reordered");
    } catch (error) {
      setModules(previous);
      notifyApiError(error, "Failed to reorder modules");
    }
  };

  const handleLessonReorder = async (
    moduleId: string,
    activeId: string,
    overId: string,
  ) => {
    const siblings = lessons.filter((lesson) => lesson.moduleId === moduleId);
    const reordered = reorderSiblings(siblings, activeId, overId);
    if (!reordered) return;

    const previous = lessons;
    setLessons((prev) => [
      ...prev.filter((lesson) => lesson.moduleId !== moduleId),
      ...reordered,
    ]);
    try {
      await reorderModuleLessons(Number(moduleId), {
        ordered_ids: toOrderedIds(reordered),
      });
      toast.success("Lessons reordered");
    } catch (error) {
      setLessons(previous);
      notifyApiError(error, "Failed to reorder lessons");
    }
  };

  const handleEdit = (type: ItemType, id: string) => {
    console.log(`Edit ${type}: ${id}`);
  };

  const handleDelete = (type: ItemType, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;

    switch (type) {
      case "program":
        setPrograms((prev) => prev.filter((p) => p.id !== id));
        break;
      case "course":
        setCourses((prev) => prev.filter((c) => c.id !== id));
        break;
      case "module":
        setModules((prev) => prev.filter((m) => m.id !== id));
        break;
      case "lesson":
        setLessons((prev) => prev.filter((l) => l.id !== id));
        break;
    }
  };

  const handleReset = () => {
    fetchHierarchy();
  };

  return (
    <div className="mb-4 rounded-xl border border-grayScale-100 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-grayScale-900">
            Content Hierarchy
          </h3>
          <p className="text-[11px] text-grayScale-500">
            Drag items to reorder Learn English content
          </p>
        </div>
        <button
          onClick={handleReset}
          className="group flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-300 transition-colors hover:text-brand-400"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:rotate-[-45deg]" />
          Sync
        </button>
      </div>

      <div className="space-y-1.5">
        <HierarchySection
          title="Programs"
          icon={<LayoutGrid className="h-3.5 w-3.5" />}
          isOpen={openSections.program}
          onToggle={() => toggleSection("program")}
        >
          {loading.program ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            <DraggableList
              items={programs}
              onReorder={(active, over) =>
                void handleProgramReorder(active, over)
              }
              icon={<LayoutGrid className="h-3.5 w-3.5" />}
              onEdit={(id) => handleEdit("program", id)}
              onDelete={(id) => handleDelete("program", id)}
            />
          )}
        </HierarchySection>

        <HierarchySection
          title="Courses"
          icon={<BookOpen className="h-3.5 w-3.5" />}
          isOpen={openSections.course}
          onToggle={() => toggleSection("course")}
        >
          {loading.course ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            programs.map((program) => {
              const programCourses = courses.filter(
                (c) => c.programId === program.id,
              );
              if (programCourses.length === 0) return null;
              return (
                <div key={program.id} className="mb-2 last:mb-0">
                  <h4 className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                    {program.name}
                  </h4>
                  <DraggableList
                    items={programCourses}
                    onReorder={(active, over) =>
                      void handleCourseReorder(program.id, active, over)
                    }
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                    onEdit={(id) => handleEdit("course", id)}
                    onDelete={(id) => handleDelete("course", id)}
                  />
                </div>
              );
            })
          )}
        </HierarchySection>

        <HierarchySection
          title="Modules"
          icon={<Layers className="h-3.5 w-3.5" />}
          isOpen={openSections.module}
          onToggle={() => toggleSection("module")}
        >
          {loading.module ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            courses.map((course) => {
              const courseModules = modules.filter(
                (m) => m.courseId === course.id,
              );
              if (courseModules.length === 0) return null;
              return (
                <div key={course.id} className="mb-2 last:mb-0">
                  <h4 className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                    {course.name}
                  </h4>
                  <DraggableList
                    items={courseModules}
                    onReorder={(active, over) =>
                      void handleModuleReorder(course.id, active, over)
                    }
                    icon={<Layers className="h-3.5 w-3.5" />}
                    onEdit={(id) => handleEdit("module", id)}
                    onDelete={(id) => handleDelete("module", id)}
                  />
                </div>
              );
            })
          )}
        </HierarchySection>

        <HierarchySection
          title="Lessons"
          icon={<PlayCircle className="h-3.5 w-3.5" />}
          isOpen={openSections.lesson}
          onToggle={() => toggleSection("lesson")}
        >
          {loading.lesson ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            modules.map((module) => {
              const moduleLessons = lessons.filter(
                (l) => l.moduleId === module.id,
              );
              if (moduleLessons.length === 0) return null;
              return (
                <div key={module.id} className="mb-2 last:mb-0">
                  <h4 className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide text-grayScale-400">
                    {module.name}
                  </h4>
                  <DraggableList
                    items={moduleLessons}
                    onReorder={(active, over) =>
                      void handleLessonReorder(module.id, active, over)
                    }
                    icon={<PlayCircle className="h-3.5 w-3.5" />}
                    onEdit={(id) => handleEdit("lesson", id)}
                    onDelete={(id) => handleDelete("lesson", id)}
                  />
                </div>
              );
            })
          )}
        </HierarchySection>
      </div>
    </div>
  );
}
