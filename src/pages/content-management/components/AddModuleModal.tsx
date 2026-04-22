import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import uploadIcon from "../../../assets/icons/upload.png";

interface AddModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddModuleModal({ isOpen, onClose }: AddModuleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl gap-0 border-none p-0 overflow-hidden rounded-[16px] shadow-2xl">
        <DialogHeader className="p-8 pb-4 relative">
          <DialogTitle className="text-2xl font-bold text-grayScale-700">
            Add New Module
          </DialogTitle>
          <DialogDescription className="text-sm text-grayScale-400">
            Create a module to organize videos and practices.
          </DialogDescription>
          <DialogClose className="absolute right-8 top-8 flex h-10 w-10 items-center justify-center rounded-full hover:bg-grayScale-50 transition-all">
            <X className="h-6 w-6 text-grayScale-400" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        {/* Gradient Divider */}
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-grayScale-100" />
          </div>
          <div className="relative flex justify-center">
            <div
              className="h-[0.5px] w-full opacity-20"
              style={{ background: "gray" }}
            />
          </div>
        </div>

        <form className="space-y-6 p-8 pt-4">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-grayScale-700">
              Module Title
            </label>
            <Input
              placeholder="e.g. Daily Introductions"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[15px] font-medium text-grayScale-700">
              Description
            </label>
            <Input
              placeholder="Short description of this module"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[15px] font-medium text-grayScale-700">
              Module Order
            </label>
            <Select className="h-12 rounded-xl">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[15px] font-medium text-grayScale-700">
              Icon
            </label>
            <div className="relative group cursor-pointer">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#9E289133] bg-white p-10 transition-all">
                <div className="mb-4">
                  <img
                    src={uploadIcon}
                    alt="Upload icon"
                    className="h-10 w-10"
                  />
                </div>
                <p className="text-sm">
                  <span className="font-bold text-[#9E2891]">
                    Click to upload
                  </span>{" "}
                  <span className="text-grayScale-500">or drag and drop</span>
                </p>
                <p className="mt-1 text-xs font-medium text-grayScale-400 uppercase tracking-wider">
                  JPG, PNG (MAX 1 MB)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="h-12 min-w-[120px] rounded-xl border-grayScale-200 font-semibold"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-12 min-w-[160px] rounded-xl bg-brand-500 font-semibold hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20"
            >
              Create Module
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
