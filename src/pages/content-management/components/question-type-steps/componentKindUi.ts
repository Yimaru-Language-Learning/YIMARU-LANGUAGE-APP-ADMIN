import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  CheckSquare,
  CircleDot,
  Clock,
  FileText,
  FileUp,
  GitBranch,
  GitCompare,
  Image as ImageIcon,
  Info,
  Link2,
  ListOrdered,
  ListTodo,
  Mic2,
  MousePointer2,
  Table as TableIcon,
  Type,
  Volume2,
} from "lucide-react"

/** Human label for API kind codes; unknown kinds fall back to title-cased code. */
const STIMULUS_LABELS: Record<string, string> = {
  QUESTION_TEXT: "Question Text",
  PREP_TIME: "Prep Time",
  INSTRUCTION: "Instruction",
  AUDIO_PROMPT: "Audio Prompt",
  AUDIO_CLIP: "Audio Clip",
  TEXT_PASSAGE: "Text Passage",
  IMAGE: "Image",
  CHART: "Chart",
  MATCHING_INPUTS: "Matching Inputs",
  SELECT_MISSING_WORDS: "Select Missing Words",
  TABLE: "Table",
  FLOW_CHART: "Flow Chart",
}

const RESPONSE_LABELS: Record<string, string> = {
  AUDIO_RESPONSE: "Audio Response",
  TEXT_INPUT: "Text Input",
  SHORT_ANSWER: "Short Answer",
  MULTIPLE_CHOICE: "Multiple Choice",
  OPTION: "Options",
  ANSWER_TIMER: "Answer Timer",
  SELECT_MISSING_WORDS: "Select Missing Words",
  PDF_UPLOAD: "PDF Upload",
  MATCHING_ANSWER: "Matching Answer",
  LABEL_SELECTION: "Label Selection",
  SEQUENCE_ORDER: "Sequence Order",
}

/** Legacy screenshot labels → map to closest API kind for display only (same code path). */
const STIMULUS_ICONS: Record<string, LucideIcon> = {
  QUESTION_TEXT: FileText,
  PREP_TIME: Clock,
  INSTRUCTION: Info,
  AUDIO_PROMPT: Volume2,
  AUDIO_CLIP: Volume2,
  TEXT_PASSAGE: FileText,
  IMAGE: ImageIcon,
  CHART: BarChart3,
  MATCHING_INPUTS: Link2,
  SELECT_MISSING_WORDS: ListTodo,
  TABLE: TableIcon,
  FLOW_CHART: GitBranch,
}

const RESPONSE_ICONS: Record<string, LucideIcon> = {
  AUDIO_RESPONSE: Mic2,
  TEXT_INPUT: Type,
  SHORT_ANSWER: ListTodo,
  MULTIPLE_CHOICE: CheckSquare,
  OPTION: CircleDot,
  ANSWER_TIMER: Clock,
  SELECT_MISSING_WORDS: ListTodo,
  PDF_UPLOAD: FileUp,
  MATCHING_ANSWER: GitCompare,
  LABEL_SELECTION: MousePointer2,
  SEQUENCE_ORDER: ListOrdered,
}

const DEFAULT_ICON = FileText

function humanizeKind(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getStimulusKindPresentation(kind: string): { label: string; Icon: LucideIcon } {
  return {
    label: STIMULUS_LABELS[kind] ?? humanizeKind(kind),
    Icon: STIMULUS_ICONS[kind] ?? DEFAULT_ICON,
  }
}

export function getResponseKindPresentation(kind: string): { label: string; Icon: LucideIcon } {
  return {
    label: RESPONSE_LABELS[kind] ?? humanizeKind(kind),
    Icon: RESPONSE_ICONS[kind] ?? DEFAULT_ICON,
  }
}
