import React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

export interface StepItem {
  id: number;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface FormStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export const FormStepper: React.FC<FormStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className
}) => {
  return (
    <div className={cn("px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step Pill Button */}
              <button
                type="button"
                onClick={() => {
                  if (onStepClick && (isCompleted || isCurrent)) {
                    onStepClick(step.id);
                  }
                }}
                disabled={isUpcoming}
                className={cn(
                  "flex items-center gap-2 group transition-all text-left",
                  isUpcoming ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                )}
              >
                {/* Step Circle / Icon */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0",
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isCurrent
                      ? "bg-purple-600 text-white ring-4 ring-purple-500/20 shadow-xs"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                  )}
                >
                  {isCompleted ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : step.icon ? (
                    <span className="scale-85">{step.icon}</span>
                  ) : (
                    step.id
                  )}
                </div>

                {/* Step Label (Hidden on small mobile screens if many steps) */}
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      "text-xs font-bold leading-tight",
                      isCurrent
                        ? "text-purple-700 dark:text-purple-300"
                        : isCompleted
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.subtitle && (
                    <p className="text-[10px] text-slate-400 font-medium">
                      {step.subtitle}
                    </p>
                  )}
                </div>
              </button>

              {/* Connecting Line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 rounded-full transition-colors",
                    step.id < currentStep
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-slate-800"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
