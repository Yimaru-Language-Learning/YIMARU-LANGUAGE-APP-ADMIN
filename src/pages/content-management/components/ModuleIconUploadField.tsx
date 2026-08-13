import { notifyApiError } from "../../../lib/apiErrors"
import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import { uploadImageFile } from "../../../api/files.api";

const MAX_ICON_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function isAllowedImageFile(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png)$/.test(name);
}

export interface ModuleIconUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  /** Notifies parent so dialogs can block closing while an upload is in flight. */
  onUploadBusyChange?: (busy: boolean) => void;
  className?: string;
}

export function ModuleIconUploadField({
  value,
  onChange,
  disabled = false,
  onUploadBusyChange,
  className,
}: ModuleIconUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const setBusy = useCallback(
    (next: boolean) => {
      setUploading(next);
      onUploadBusyChange?.(next);
    },
    [onUploadBusyChange],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return;
      if (!isAllowedImageFile(file)) {
        toast.error("Please use a JPG or PNG image.");
        return;
      }
      if (file.size > MAX_ICON_BYTES) {
        toast.error("Image is too large", {
          description: "Maximum size is 5 MB.",
        });
        return;
      }
      setBusy(true);
      try {
        const res = await uploadImageFile(file);
        const url = res.data?.data?.url?.trim();
        if (!url) {
          throw new Error("Upload did not return a file URL");
        }
        onChange(url);
        toast.success("Icon uploaded");
      } catch (e: unknown) {
        console.error(e);
        notifyApiError(e, "Failed to upload icon");
      } finally {
        setBusy(false);
      }
    },
    [disabled, uploading, onChange, setBusy],
  );

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void processFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const zoneDisabled = disabled || uploading;
  const showSpinner = uploading;

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-[15px] font-medium text-grayScale-700 md:text-sm">
        Icon
      </label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={handleFileInputChange}
        disabled={zoneDisabled}
      />
      <button
        type="button"
        disabled={zoneDisabled}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center rounded-[6px] border-2 border-dashed border-[#9E289133] bg-white p-10 text-center transition-colors",
          "hover:border-[#9E289180] hover:bg-grayScale-50/30",
          dragActive && "border-[#9E2891] bg-[#9E289108]",
          zoneDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {showSpinner ? (
          <p className="text-sm font-medium text-grayScale-600">Uploading…</p>
        ) : (
          <>
            <CloudUpload
              className="mb-4 h-10 w-10 text-[#9E2891]"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-sm">
              <span className="font-bold text-[#9E2891]">Click to upload</span>{" "}
              <span className="text-grayScale-500">or paste a URL below</span>
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-grayScale-400">
              JPG, PNG (MAX 5 MB)
            </p>
          </>
        )}
      </button>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
        className="h-12 rounded-xl"
        disabled={disabled || uploading}
        autoComplete="off"
      />
    </div>
  );
}
