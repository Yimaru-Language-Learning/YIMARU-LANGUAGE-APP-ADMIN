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
        {PERSONAS.map((persona) => {
          const isSelected = selectedPersona === persona.id;
          return (
            <div
              key={persona.id}
              onClick={() => setSelectedPersona(persona.id)}
              className={cn(
                "group relative w-[260px] cursor-pointer rounded-2xl border-2 bg-white p-6 transition-all duration-300",
                isSelected
                  ? "border-brand-500"
                  : "border-grayScale-100 hover:border-brand-200",
              )}
            >
              {/* Top-right checkmark badge */}
              {isSelected && (
                <div className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-white  z-10">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              )}
              <div className="flex flex-col items-center gap-4">
                {/* Avatar with conditional purple ring */}
                <div
                  className={cn(
                    "rounded-full p-[3px] transition-all duration-300",
                    isSelected ? "bg-brand-500" : "bg-transparent",
                  )}
                >
                  <Avatar className="h-24 w-24 border-2 border-white">
                    <AvatarImage src={persona.avatar} />
                    <AvatarFallback>
                      {persona.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-lg font-bold text-grayScale-700">
                  {persona.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-8">
        <Button
          onClick={prevStep}
          variant="outline"
          className="h-10 w-20 rounded-[6px] border-grayScale-200  text-grayScale-600"
        >
          Back
        </Button>
        <Button
          onClick={nextStep}
          className="h-10 rounded-[6px] bg-brand-500 px-8  hover:bg-brand-600 shadow-md shadow-brand-500/20"
        >
          Next: Questions <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
