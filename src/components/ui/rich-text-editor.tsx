import { useEffect, type ReactNode } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { richTextPlainLength } from "../../lib/richText"

export interface RichTextEditorProps {
  value?: string
  onChange: (html: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
  editorClassName?: string
  disabled?: boolean
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-grayScale-600 transition-colors",
        "hover:bg-grayScale-100 hover:text-grayScale-900 disabled:cursor-not-allowed disabled:opacity-40",
        active && "border-brand-200 bg-brand-50 text-brand-700",
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write here…",
  maxLength,
  className,
  editorClassName,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML()
      if (maxLength != null && richTextPlainLength(html) > maxLength) {
        currentEditor.commands.setContent(value || "", { emitUpdate: false })
        return
      }
      onChange(html === "<p></p>" ? "" : html)
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[120px] px-4 py-3 text-sm leading-relaxed text-grayScale-800 outline-none",
          "prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
          editorClassName,
        ),
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const normalizedCurrent = current === "<p></p>" ? "" : current
    const normalizedValue = value || ""
    if (normalizedCurrent !== normalizedValue) {
      editor.commands.setContent(normalizedValue || "", { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  const plainLength = richTextPlainLength(value)
  const atLimit = maxLength != null && plainLength >= maxLength

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-grayScale-200 bg-white focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-grayScale-100 bg-grayScale-50/80 px-2 py-2">
        <ToolbarButton
          label="Bold"
          disabled={disabled || !editor}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={disabled || !editor}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          disabled={disabled || !editor}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          disabled={disabled || !editor}
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-grayScale-200" />
        <ToolbarButton
          label="Undo"
          disabled={disabled || !editor || !editor.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={disabled || !editor || !editor.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        {maxLength != null ? (
          <span
            className={cn(
              "ml-auto pr-2 text-xs font-medium",
              atLimit ? "text-amber-700" : "text-grayScale-400",
            )}
          >
            {plainLength} / {maxLength}
          </span>
        ) : null}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
