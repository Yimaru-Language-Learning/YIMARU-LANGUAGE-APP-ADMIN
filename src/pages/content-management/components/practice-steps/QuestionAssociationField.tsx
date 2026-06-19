import { Select } from "../../../../components/ui/select"
import {
  getSectionAnchorOptions,
  isQuestionSectionAnchor,
  setQuestionSectionAnchorRef,
  type QuestionAssociationRow,
} from "../../../../lib/questionAssociations"

type QuestionAssociationFieldProps = {
  question: QuestionAssociationRow
  allQuestions: QuestionAssociationRow[]
  onChange: (patch: {
    associatedQuestionId: number | null
    associatedAnchorRowId: string | null
  }) => void
}

export function QuestionAssociationField({
  question,
  allQuestions,
  onChange,
}: QuestionAssociationFieldProps) {
  const isAnchor = isQuestionSectionAnchor(question)
  const anchorOptions = getSectionAnchorOptions(allQuestions, question.id)
  const selectedValue =
    question.associatedQuestionId != null
      ? String(question.associatedQuestionId)
      : question.associatedAnchorRowId ?? ""

  return (
    <div className="space-y-2 rounded-lg border border-sky-100 bg-sky-50/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-800">
        Section grouping
      </p>
      <label className="flex items-center gap-2 text-sm text-grayScale-700">
        <input
          type="checkbox"
          checked={isAnchor}
          onChange={(e) => {
            if (e.target.checked) {
              onChange({ associatedQuestionId: null, associatedAnchorRowId: null })
              return
            }
            const firstAnchor = anchorOptions[0]
            if (!firstAnchor) return
            const anchorRow = allQuestions.find(
              (q) =>
                q.serverQuestionId === firstAnchor.serverId ||
                q.id === String(firstAnchor.value),
            )
            if (!anchorRow) return
            const next = setQuestionSectionAnchorRef(question, anchorRow)
            onChange({
              associatedQuestionId: next.associatedQuestionId ?? null,
              associatedAnchorRowId: next.associatedAnchorRowId ?? null,
            })
          }}
        />
        Starts a new section (anchor)
      </label>

      {!isAnchor ? (
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-grayScale-500">
            Section anchor
          </label>
          <Select
            value={selectedValue}
            onChange={(e) => {
              const value = e.target.value
              if (!value) {
                onChange({ associatedQuestionId: null, associatedAnchorRowId: null })
                return
              }
              const anchorRow = allQuestions.find(
                (q) => q.id === value || String(q.serverQuestionId ?? "") === value,
              )
              if (!anchorRow) return
              const next = setQuestionSectionAnchorRef(question, anchorRow)
              onChange({
                associatedQuestionId: next.associatedQuestionId ?? null,
                associatedAnchorRowId: next.associatedAnchorRowId ?? null,
              })
            }}
          >
            <option value="">Select section anchor…</option>
            {anchorOptions.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="text-[10px] text-grayScale-400">
            Learners complete earlier sections before this question unlocks.
          </p>
        </div>
      ) : (
        <p className="text-xs text-grayScale-500">
          This question opens a new section. Link follow-up questions to it using the
          section anchor dropdown.
        </p>
      )}

      {question.prerequisiteQuestionIds && question.prerequisiteQuestionIds.length > 0 ? (
        <p className="text-[10px] text-grayScale-500">
          Prerequisites (from API): {question.prerequisiteQuestionIds.join(", ")}
        </p>
      ) : null}
    </div>
  )
}
