import * as React from "react"
import { Upload } from "lucide-react"
import { cn } from "../../lib/utils"

export interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onFileSelect?: (file: File | null) => void
  accept?: string
  label?: string
  description?: string
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, onFileSelect, accept, label, description, ...props }, ref) => {
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

    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
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
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600">
            <Upload className="h-8 w-8" />
          </div>
          {file ? (
            <>
              <p className="mb-1 text-sm font-medium text-grayScale-900">{file.name}</p>
              <p className="text-xs text-grayScale-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <p className="mb-1 text-sm font-medium text-grayScale-900">
                {label || "Drag & Drop Video Here"}
              </p>
              <p className="mb-4 text-xs text-grayScale-500">
                {description || "or click to browse files"}
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
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

