"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type GuidedTourStep = {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
};

type GuidedTourProps = {
  steps: GuidedTourStep[];
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
};

export function GuidedTour({
  steps,
  isOpen,
  onClose,
  currentStep,
  onStepChange,
  onComplete,
}: GuidedTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const step = steps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!step || typeof document === "undefined") {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    setTargetRect(el.getBoundingClientRect());
  }, [step]);

  useEffect(() => {
    if (!isOpen || !step) return;
    updateTargetRect();
    const resizeObserver = new ResizeObserver(updateTargetRect);
    const el = document.querySelector(step.targetSelector);
    if (el) resizeObserver.observe(el);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isOpen, step, updateTargetRect]);

  useEffect(() => {
    if (!isOpen || !step) return;
    const t = setTimeout(updateTargetRect, 100);
    return () => clearTimeout(t);
  }, [isOpen, currentStep, step, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleClose = () => {
    onComplete?.();
    onClose();
  };

  if (!isOpen || !mounted || typeof document === "undefined") return null;
  if (!step) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label="Tour guiado"
      aria-live="polite"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      />
      {targetRect && (
        <div
          className="absolute rounded-lg pointer-events-none transition-[top,left,width,height] duration-200 border-2 border-primary"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        />
      )}
      <div
        className="absolute z-10 w-full max-w-sm p-4 rounded-xl border bg-background shadow-lg left-1/2 -translate-x-1/2"
        style={
          targetRect
            ? { top: targetRect.bottom + 16 }
            : { top: "50%", transform: "translate(-50%, -50%)" }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-foreground">{step?.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{step?.description}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg"
            onClick={handleClose}
            aria-label="Fechar tour"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
            <Button type="button" variant="default" size="sm" onClick={handleNext} className="gap-1">
              {currentStep < steps.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              ) : (
                "Concluir"
              )}
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
