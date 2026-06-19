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
  Minus,
  MousePointer2,
  Table as TableIcon,
  Type,
  Volume2,
} from "lucide-react"

import { defaultLabelForKind, humanizeKind, slotLabel } from "../../../../lib/schemaSlotLabel"

export { defaultLabelForKind, humanizeKind, slotLabel }

const STIMULUS_LABELS: Record<string, string> = {
  QUESTION_TEXT: defaultLabelForKind("QUESTION_TEXT"),
  PREP_TIME: defaultLabelForKind("PREP_TIME"),
  INSTRUCTION: defaultLabelForKind("INSTRUCTION"),
  AUDIO_PROMPT: defaultLabelForKind("AUDIO_PROMPT"),
  TEXT_PASSAGE: defaultLabelForKind("TEXT_PASSAGE"),
  IMAGE: defaultLabelForKind("IMAGE"),
  MATCHING_INPUTS: defaultLabelForKind("MATCHING_INPUTS"),
  SELECT_MISSING_WORDS: defaultLabelForKind("SELECT_MISSING_WORDS"),
  TABLE: defaultLabelForKind("TABLE"),
  PDF_ATTACHMENT: defaultLabelForKind("PDF_ATTACHMENT"),
  NO_INPUT: defaultLabelForKind("NO_INPUT"),
}

const RESPONSE_LABELS: Record<string, string> = {
  AUDIO_RESPONSE: defaultLabelForKind("AUDIO_RESPONSE"),
  TEXT_INPUT: defaultLabelForKind("TEXT_INPUT"),
  SHORT_ANSWER: defaultLabelForKind("SHORT_ANSWER"),
  MULTIPLE_CHOICE: defaultLabelForKind("MULTIPLE_CHOICE"),
  OPTION: defaultLabelForKind("OPTION"),
  ANSWER_TIMER: defaultLabelForKind("ANSWER_TIMER"),
  SELECT_MISSING_WORDS: defaultLabelForKind("SELECT_MISSING_WORDS"),
  PDF_UPLOAD: defaultLabelForKind("PDF_UPLOAD"),
  MATCHING_ANSWER: defaultLabelForKind("MATCHING_ANSWER"),
  LABEL_SELECTION: defaultLabelForKind("LABEL_SELECTION"),
  SEQUENCE_ORDER: defaultLabelForKind("SEQUENCE_ORDER"),
  NO_INPUT: defaultLabelForKind("NO_INPUT"),
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
  MATCHING_INPUTS: Link2,
  SELECT_MISSING_WORDS: ListTodo,
  TABLE: TableIcon,
  PDF_ATTACHMENT: FileUp,
  NO_INPUT: Minus,
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
  NO_INPUT: Minus,
}

const DEFAULT_ICON = FileText

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
