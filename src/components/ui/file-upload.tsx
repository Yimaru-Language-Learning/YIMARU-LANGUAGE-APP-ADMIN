import * as React from "react"
import { Upload } from "lucide-react"
import { cn } from "../../lib/utils"

export interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onFileSelect?: (file: File | null) => void
  accept?: string
  label?: string
  description?: string
  /** Shorter, row-oriented layout for wide forms / modals */
  variant?: "default" | "compact"
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, onFileSelect, accept, label, description, variant = "default", ...props }, ref) => {
    const [file, setFile] = React.useState<File | null>(null)
    const [dragActive, setDragActive] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const handleFile = (selectedFile: File | null) => {
      setFile(selectedFile)
      onFileSelect?.(selectedFile)
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0])
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0])
      }
    }

    const isCompact = variant === "compact"

    return (
      <div
        className={cn(
          "relative flex rounded-lg border-2 border-dashed transition-colors",
          isCompact
            ? "min-h-0 flex-col items-stretch justify-center sm:flex-row sm:items-center"
            : "flex-col items-center justify-center",
          dragActive ? "border-brand-500 bg-brand-50" : "border-grayScale-200 bg-grayScale-50",
          className,
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "flex w-full",
            isCompact
              ? "flex-col gap-3 p-4 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:text-left"
              : "flex-col items-center justify-center p-8 text-center",
          )}
        >
          <div
            className={cn(
              "grid shrink-0 place-items-center rounded-full bg-brand-100 text-brand-600",
              isCompact ? "mx-auto h-11 w-11 sm:mx-0" : "mb-4 h-16 w-16",
            )}
          >
            <Upload className={isCompact ? "h-5 w-5" : "h-8 w-8"} />
          </div>
          {file ? (
            <div className={cn("min-w-0 flex-1", !isCompact && "text-center")}>
              <p className="mb-1 text-sm font-medium text-grayScale-900 break-all">{file.name}</p>
              <p className="text-xs text-grayScale-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <div className={cn("min-w-0 flex-1 space-y-1", isCompact && "sm:pr-2")}>
                <p className="text-sm font-medium text-grayScale-900">
                  {label || "Drag & Drop Video Here"}
                </p>
                <p className="text-xs text-grayScale-500">
                  {description || "or click to browse files"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600",
                  isCompact ? "mx-auto w-full max-w-[200px] sm:mx-0 sm:w-auto" : "mt-1",
                )}
              >
                Browse Files
              </button>
            </>
          )}
        </div>
      </div>
    )
  },
)
FileUpload.displayName = "FileUpload"

