import type {
  CreatePersonaInput,
  LmsPersona,
  UpdatePersonaInput,
} from "../../../types/persona.types"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select } from "../../../components/ui/select"
import { Textarea } from "../../../components/ui/textarea"
import { personaAvatarUrl } from "../../../lib/personaDisplay"
import { PersonaProfilePictureUploadField } from "./PersonaProfilePictureUploadField"

const PERSONA_GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "neutral", label: "Neutral" },
] as const

export type PersonaFormDraft = {
  name: string
  description: string
  profile_picture: string
  gender: string
  is_active: boolean
}

export const EMPTY_PERSONA_FORM_DRAFT: PersonaFormDraft = {
  name: "",
  description: "",
  profile_picture: "",
  gender: "",
  is_active: true,
}

export function validatePersonaDraft(draft: PersonaFormDraft): string | null {
  if (!draft.name.trim()) return "Name is required"
  return null
}

export function draftToCreatePayload(draft: PersonaFormDraft): CreatePersonaInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    profile_picture: draft.profile_picture.trim() || null,
    gender: draft.gender.trim() || null,
    is_active: draft.is_active,
  }
}

export function draftToUpdatePayload(draft: PersonaFormDraft): UpdatePersonaInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    profile_picture: draft.profile_picture.trim(),
    gender: draft.gender.trim(),
    is_active: draft.is_active,
  }
}

export function personaToDraft(persona: LmsPersona): PersonaFormDraft {
  return {
    name: persona.name,
    description: persona.description ?? "",
    profile_picture: persona.profile_picture ?? "",
    gender: persona.gender ?? "",
    is_active: persona.is_active,
  }
}

type PersonaFormProps = {
  draft: PersonaFormDraft
  onChange: (draft: PersonaFormDraft) => void
  disabled?: boolean
  previewId?: number
  onUploadBusyChange?: (busy: boolean) => void
}

export function PersonaForm({
  draft,
  onChange,
  disabled = false,
  previewId,
  onUploadBusyChange,
}: PersonaFormProps) {
  const previewUrl = personaAvatarUrl(
    draft.profile_picture.trim() || null,
    draft.name.trim() || "Persona",
    previewId,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <img
          src={previewUrl}
          alt=""
          className="h-16 w-16 rounded-full border border-grayScale-200 bg-grayScale-50 object-cover"
        />
        <p className="text-xs text-grayScale-500">
          Upload an image from your computer, paste a URL, or leave empty for a generated
          placeholder.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-grayScale-700" htmlFor="persona-name">
          Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="persona-name"
          value={draft.name}
          disabled={disabled}
          placeholder="Friendly Coach"
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-grayScale-700" htmlFor="persona-description">
          Description
        </label>
        <Textarea
          id="persona-description"
          value={draft.description}
          disabled={disabled}
          placeholder="Warm, encouraging tutor for everyday conversational practice."
          rows={4}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-grayScale-700" htmlFor="persona-profile-picture">
          Profile picture
        </label>
        <PersonaProfilePictureUploadField
          value={draft.profile_picture}
          onChange={(profile_picture) => onChange({ ...draft, profile_picture })}
          disabled={disabled}
          onUploadBusyChange={onUploadBusyChange}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-grayScale-700" htmlFor="persona-gender">
          Gender
        </label>
        <Select
          id="persona-gender"
          value={draft.gender}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, gender: e.target.value })}
        >
          <option value="">Select gender</option>
          {PERSONA_GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {draft.gender &&
          !PERSONA_GENDER_OPTIONS.some((option) => option.value === draft.gender) ? (
            <option value={draft.gender}>{draft.gender}</option>
          ) : null}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm text-grayScale-700">
        <input
          type="checkbox"
          checked={draft.is_active}
          disabled={disabled}
          className="h-4 w-4 rounded border-grayScale-300"
          onChange={(e) => onChange({ ...draft, is_active: e.target.checked })}
        />
        Active (visible in practice persona picker)
      </label>
    </div>
  )
}

type PersonaFormActionsProps = {
  saving: boolean
  onCancel: () => void
  onSave: () => void
  saveLabel?: string
}

export function PersonaFormActions({
  saving,
  onCancel,
  onSave,
  saveLabel = "Save persona",
}: PersonaFormActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="button"
        className="bg-brand-500 text-white hover:bg-brand-600"
        disabled={saving}
        onClick={onSave}
      >
        {saving ? "Saving…" : saveLabel}
      </Button>
    </div>
  )
}
