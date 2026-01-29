"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectQuestionProps {
  question: string;
  subtitle?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export function SelectQuestion({
  question,
  subtitle,
  options,
  value,
  onChange,
  required,
  className,
}: SelectQuestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("flex flex-col items-center justify-center min-h-[400px] w-full max-w-2xl mx-auto px-4", className)}
    >
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-foreground"
          >
            {question}
            {required && <span className="text-destructive ml-1">*</span>}
          </motion.h2>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-sm md:text-base"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid gap-3"
        >
          {options.map((option, index) => {
            const isSelected = value === option.value;
            const letter = String.fromCharCode(65 + index);

            return (
              <motion.button
                key={option.value}
                type="button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex items-center gap-4 w-full p-4 rounded-xl border-2 text-left transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected && "border-primary bg-primary/10"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border-2 text-sm font-semibold transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected ? <Check className="h-4 w-4" /> : letter}
                </span>
                <span className="text-base md:text-lg">{option.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
