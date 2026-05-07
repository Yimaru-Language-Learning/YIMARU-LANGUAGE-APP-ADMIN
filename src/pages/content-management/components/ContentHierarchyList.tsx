import React, { useState } from "react";
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
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "../../../lib/utils";

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

// --- Mock Data ---
const initialPrograms: Program[] = [
  {
    id: "p1",
    name: "Web Development Masterclass",
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop",
  },
  {
    id: "p2",
    name: "Mobile App Development",
    thumbnail:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop",
  },
  {
    id: "p3",
    name: "UI/UX Design Fundamentals",
    thumbnail:
      "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=100&h=100&fit=crop",
  },
];

const initialCourses: Course[] = [
  { id: "c1", name: "React for Beginners", programId: "p1" },
  { id: "c2", name: "Advanced Node.js", programId: "p1" },
  { id: "c3", name: "Swift UI Intro", programId: "p2" },
];

const initialModules: Module[] = [
  { id: "m1", name: "Introduction to Hooks", courseId: "c1" },
  { id: "m2", name: "State Management", courseId: "c1" },
  { id: "m3", name: "Backend Architecture", courseId: "c2" },
];

const initialLessons: Lesson[] = [
  { id: "l1", name: "What is useState?", moduleId: "m1" },
  { id: "l2", name: "useEffect deep dive", moduleId: "m1" },
  { id: "l3", name: "Redux Setup", moduleId: "m2" },
];

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
        "flex items-center justify-between px-4 py-3 border border-grayScale-200 rounded-[6px] mb-2 bg-white transition-all duration-200 group/item",
        isDragging && "opacity-50 border-dashed z-50 shadow-sm",
        !isDragging && "hover:border-brand-200 hover:shadow-sm",
      )}
    >
      <div className="flex items-center gap-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-grayScale-300 hover:text-brand-500 transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          {/* Thumbnail/Icon Container */}
          <div className="h-10 w-10 shrink-0 rounded-[4px] bg-grayScale-50 border border-grayScale-100 flex items-center justify-center overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-grayScale-400 group-hover/item:text-brand-500 transition-colors">
                {icon}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-grayScale-800 leading-tight">
              {name}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit?.(id)}
          className="p-2 text-grayScale-400 rounded-[4px] transition-all"
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete?.(id)}
          className="p-2 text-grayScale-400 rounded-[4px] transition-all"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
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

function DraggableList({
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
        <div className="flex flex-col gap-1">
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
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-brand-300 shadow-lg rounded-[6px] opacity-90 cursor-grabbing">
            <div className="flex items-center gap-4">
              <div className="p-1 ">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-[4px] bg-grayScale-50 border border-grayScale-100 flex items-center justify-center overflow-hidden">
                  {activeItem.thumbnail ? (
                    <img
                      src={activeItem.thumbnail}
                      alt={activeItem.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-brand-500">{icon}</div>
                  )}
                </div>
                <span className="text-[14px] font-bold text-grayScale-800">
                  {activeItem.name}
                </span>
              </div>
            </div>
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

function HierarchySection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: SectionProps) {
  return (
    <div className="border border-grayScale-100 rounded-xl mb-3 overflow-hidden transition-all duration-300 bg-white">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 transition-colors",
          isOpen ? "bg-grayScale-50" : "hover:bg-grayScale-25",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg transition-colors",
              isOpen
                ? "bg-brand-300 text-white"
                : "bg-grayScale-50 text-grayScale-500",
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              "text-[15px] font-bold",
              isOpen ? "text-grayScale-900" : "text-grayScale-700",
            )}
          >
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-grayScale-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-grayScale-400" />
        )}
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-[1000px] opacity-100 p-5 pt-0" : "max-h-0 opacity-0",
        )}
      >
        <div className="pt-4 border-t border-grayScale-200">{children}</div>
      </div>
    </div>
  );
}

export function ContentHierarchyList() {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    program: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reorder = <T extends BaseItem>(
    list: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    activeId: string,
    overId: string,
  ) => {
    const oldIndex = list.findIndex((i) => i.id === activeId);
    const newIndex = list.findIndex((i) => i.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      setList(arrayMove(list, oldIndex, newIndex));
    }
  };

  const handleEdit = (type: ItemType, id: string) => {
    console.log(`Edit ${type}: ${id}`);
    // Logic for opening edit modal would go here
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
    setPrograms(initialPrograms);
    setCourses(initialCourses);
    setModules(initialModules);
    setLessons(initialLessons);
  };

  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 border border-grayScale-100 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-grayScale-900">
            Content Hierarchy
          </h3>
          <p className="text-[12px] text-grayScale-500 mt-1">
            Manage the ordering and structure of your educational content
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-[13px] font-bold text-brand-300 hover:text-brand-400 transition-colors flex items-center gap-2 group"
        >
          <RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-[-45deg]" />
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        {/* Program Section */}
        <HierarchySection
          title="Programs"
          icon={<LayoutGrid className="h-5 w-5" />}
          isOpen={openSections.program}
          onToggle={() => toggleSection("program")}
        >
          <DraggableList
            items={programs}
            onReorder={(active, over) =>
              reorder(programs, setPrograms, active, over)
            }
            icon={<LayoutGrid className="h-4 w-4" />}
            onEdit={(id) => handleEdit("program", id)}
            onDelete={(id) => handleDelete("program", id)}
          />
        </HierarchySection>

        {/* Course Section */}
        <HierarchySection
          title="Courses"
          icon={<BookOpen className="h-5 w-5" />}
          isOpen={openSections.course}
          onToggle={() => toggleSection("course")}
        >
          {programs.map((program) => {
            const programCourses = courses.filter(
              (c) => c.programId === program.id,
            );
            if (programCourses.length === 0) return null;
            return (
              <div key={program.id} className="mb-4 last:mb-0">
                <h4 className="text-[12px] font-bold text-grayScale-400 uppercase tracking-wider mb-2 px-1">
                  {program.name}
                </h4>
                <DraggableList
                  items={programCourses}
                  onReorder={(active, over) =>
                    reorder(courses, setCourses, active, over)
                  }
                  icon={<BookOpen className="h-4 w-4" />}
                  onEdit={(id) => handleEdit("course", id)}
                  onDelete={(id) => handleDelete("course", id)}
                />
              </div>
            );
          })}
        </HierarchySection>

        {/* Module Section */}
        <HierarchySection
          title="Modules"
          icon={<Layers className="h-5 w-5" />}
          isOpen={openSections.module}
          onToggle={() => toggleSection("module")}
        >
          {courses.map((course) => {
            const courseModules = modules.filter(
              (m) => m.courseId === course.id,
            );
            if (courseModules.length === 0) return null;
            return (
              <div key={course.id} className="mb-4 last:mb-0">
                <h4 className="text-[12px] font-bold text-grayScale-400 uppercase tracking-wider mb-2 px-1">
                  {course.name}
                </h4>
                <DraggableList
                  items={courseModules}
                  onReorder={(active, over) =>
                    reorder(modules, setModules, active, over)
                  }
                  icon={<Layers className="h-4 w-4" />}
                  onEdit={(id) => handleEdit("module", id)}
                  onDelete={(id) => handleDelete("module", id)}
                />
              </div>
            );
          })}
        </HierarchySection>

        {/* Lesson Section */}
        <HierarchySection
          title="Lessons"
          icon={<PlayCircle className="h-5 w-5" />}
          isOpen={openSections.lesson}
          onToggle={() => toggleSection("lesson")}
        >
          {modules.map((module) => {
            const moduleLessons = lessons.filter(
              (l) => l.moduleId === module.id,
            );
            if (moduleLessons.length === 0) return null;
            return (
              <div key={module.id} className="mb-4 last:mb-0">
                <h4 className="text-[12px] font-bold text-grayScale-400 uppercase tracking-wider mb-2 px-1">
                  {module.name}
                </h4>
                <DraggableList
                  items={moduleLessons}
                  onReorder={(active, over) =>
                    reorder(lessons, setLessons, active, over)
                  }
                  icon={<PlayCircle className="h-4 w-4" />}
                  onEdit={(id) => handleEdit("lesson", id)}
                  onDelete={(id) => handleDelete("lesson", id)}
                />
              </div>
            );
          })}
        </HierarchySection>
      </div>
    </div>
  );
}
