import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { cn } from "../../../../lib/utils";
import type { PersonaCardModel } from "../../../../lib/personaDisplay";

interface PersonaStepProps {
  personas: PersonaCardModel[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedPersona: string | null;
  setSelectedPersona: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function PersonaStep({
  personas,
  loading = false,
  error = null,
  onRetry,
  selectedPersona,
  setSelectedPersona,
  nextStep,
  prevStep,
}: PersonaStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-1 px-2">
        <h2 className="text-2xl font-extrabold text-grayScale-700">
          Select Persona
        </h2>
        <p className="text-lg text-grayScale-400">
          Choose the character that will guide this practice scenario.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          <p className="mt-4 text-sm font-medium text-grayScale-500">
            Loading personas…
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={onRetry}
            >
              Try again
            </Button>
          ) : null}
        </div>
      ) : personas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grayScale-200 bg-grayScale-50/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-grayScale-600">
            No active personas available.
          </p>
          <p className="mt-1 text-sm text-grayScale-400">
            Add personas in the admin panel, then return here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {personas.map((persona) => {
            const isSelected = selectedPersona === persona.id;
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setSelectedPersona(persona.id)}
                className={cn(
                  "group relative w-full cursor-pointer rounded-2xl border-2 bg-white p-6 text-left transition-all duration-300",
                  isSelected
                    ? "border-brand-500 shadow-md shadow-brand-100/50"
                    : "border-grayScale-100 hover:border-brand-200",
                )}
              >
                {isSelected && (
                  <div className="absolute right-2.5 top-2.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-white">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={cn(
                      "rounded-full p-[3px] transition-all duration-300",
                      isSelected ? "bg-brand-500" : "bg-transparent",
                    )}
                  >
                    <Avatar className="h-24 w-24 border-2 border-white">
                      <AvatarImage src={persona.avatar} alt={persona.name} />
                      <AvatarFallback>
                        {persona.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="block text-lg font-bold text-grayScale-700">
                      {persona.name}
                    </span>
                    {persona.description ? (
                      <span className="block text-xs leading-relaxed text-grayScale-500 line-clamp-3">
                        {persona.description}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-8">
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="h-10 w-20 rounded-[6px] border-grayScale-200 text-grayScale-600"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={nextStep}
          disabled={!selectedPersona || loading || personas.length === 0}
          className="h-10 rounded-[6px] bg-brand-500 px-8 shadow-md shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-50"
        >
          Next: Questions <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
