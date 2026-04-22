import { Upload, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";

interface ScenarioStepProps {
  formData: any;
  setFormData: (data: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function ScenarioStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: ScenarioStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 px-2">
        <h2 className="text-2xl font-extrabold text-grayScale-700">
          Define Scenario Details
        </h2>
        <p className="text-grayScale-400 text-lg">
          Set the scene and context for this English practice session.
        </p>
      </div>
      <Card className="p-8 space-y-6 border-grayScale-50 shadow-soft rounded-2xl bg-white">
        <div className="space-y-2">
          <label className="text-sm font-bold text-grayScale-700">
            Practice Banner Image
          </label>
          <p className="text-xs text-grayScale-400">
            This image will appear as the background for the scenario.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-grayScale-100 bg-[#F8F9FA] p-12 hover:bg-grayScale-50 transition-all">
            <div className="mb-4 rounded-xl border border-grayScale-100 bg-white p-3 text-brand-500 shadow-sm">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm">
              <span className="font-bold text-grayScale-700">
                Click to upload
              </span>{" "}
              <span className="text-grayScale-500">or drag and drop</span>
            </p>
            <p className="mt-1 text-xs text-grayScale-400 uppercase tracking-wide font-bold">
              SVG, PNG, JPG (MAX 5MB)
            </p>
            <Button
              variant="outline"
              className="mt-6 h-10 rounded-xl border-grayScale-200 bg-white px-8 font-bold text-grayScale-600 shadow-sm hover:bg-grayScale-50"
            >
              Browse Files
            </Button>
          </div>
        </div>
      </Card>
      <Card className="p-8 space-y-6 border-grayScale-50 shadow-soft rounded-2xl bg-white">
        <div className="space-y-2">
          <label className="text-sm font-bold text-grayScale-700">
            Practice Title <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g., Ordering Coffee at a Cafe"
            className="h-14 rounded-xl border-grayScale-200 focus:border-brand-500 font-bold placeholder:text-grayScale-300 bg-white"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-grayScale-700">
            Scenario Description <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Textarea
              placeholder="Describe the setting..."
              className="min-h-[160px] rounded-xl resize-none p-4 border-grayScale-200 focus:border-brand-500 leading-relaxed font-bold placeholder:text-grayScale-300 bg-white"
              maxLength={1000}
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
            <div className="absolute bottom-4 right-4 text-xs font-bold text-grayScale-300">
              {formData.description.length} / 1000
            </div>
          </div>
        </div>
      </Card>
      <div className="flex items-center justify-between pt-4">
        <Button
          onClick={prevStep}
          variant="outline"
          className="h-12 w-28 rounded-xl border-grayScale-200 font-bold text-grayScale-600 shadow-sm"
        >
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!formData.title || !formData.description}
          className="h-12 rounded-xl bg-brand-500 px-8 font-bold hover:bg-brand-600 shadow-md shadow-brand-500/20"
        >
          Next: Persona <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
