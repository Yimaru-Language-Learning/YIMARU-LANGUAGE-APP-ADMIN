import { Check, ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { cn } from "../../../../lib/utils";
import { PERSONAS } from "./constants";

interface PersonaStepProps {
  selectedPersona: string | null;
  setSelectedPersona: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function PersonaStep({
  selectedPersona,
  setSelectedPersona,
  nextStep,
  prevStep,
}: PersonaStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1 px-2">
        <h2 className="text-2xl font-extrabold text-grayScale-700">
          Select Personas
        </h2>
        <p className="text-grayScale-400 text-lg">
          Choose the characters that will participate in this practice scenario.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {PERSONAS.map((persona) => (
          <div
            key={persona.id}
            onClick={() => setSelectedPersona(persona.id)}
            className={cn(
              "group relative cursor-pointer rounded-2xl border-2 bg-white p-6 transition-all duration-300",
              selectedPersona === persona.id
                ? "border-brand-500 shadow-xl scale-105"
                : "border-grayScale-50 hover:border-brand-200",
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={persona.avatar} />
                  <AvatarFallback>
                    {persona.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {selectedPersona === persona.id && (
                  <div className="absolute -right-2 top-0 grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white shadow-xl ring-4 ring-white">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-lg font-bold transition-colors",
                  selectedPersona === persona.id
                    ? "text-brand-600"
                    : "text-grayScale-700",
                )}
              >
                {persona.name}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-8">
        <Button
          onClick={prevStep}
          variant="outline"
          className="h-12 w-28 rounded-xl border-grayScale-200 font-bold text-grayScale-600"
        >
          Back
        </Button>
        <Button
          onClick={nextStep}
          className="h-12 rounded-xl bg-brand-500 px-8 font-bold hover:bg-brand-600 shadow-md shadow-brand-500/20"
        >
          Next: Questions <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
