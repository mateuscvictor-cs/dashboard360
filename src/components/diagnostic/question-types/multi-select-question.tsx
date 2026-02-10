"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectQuestionProps {
  question: string;
  subtitle?: string;
  options?: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  maxSelections?: number;
  allowCustom?: boolean;
  customPlaceholder?: string;
  className?: string;
}

export function MultiSelectQuestion({
  question,
  subtitle,
  options = [],
  value,
  onChange,
  required,
  maxSelections,
  allowCustom = false,
  customPlaceholder = "Adicionar opção personalizada...",
  className,
}: MultiSelectQuestionProps) {
  const [customInput, setCustomInput] = useState("");

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else if (!maxSelections || value.length < maxSelections) {
      onChange([...value, optionValue]);
    }
  };

  const addCustomOption = () => {
    if (customInput.trim() && !value.includes(customInput.trim())) {
      if (!maxSelections || value.length < maxSelections) {
        onChange([...value, customInput.trim()]);
        setCustomInput("");
      }
    }
  };

  const removeCustomOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const customValues = value.filter(
    (v) => !options.some((opt) => opt.value === v)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("flex flex-col items-center justify-center min-h-0 w-full max-w-2xl mx-auto px-3 sm:px-4", className)}
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
          {maxSelections && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-xs text-muted-foreground"
            >
              Selecione até {maxSelections} opções ({value.length}/{maxSelections})
            </motion.p>
          )}
        </div>

        {options.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid gap-3"
          >
            {options.map((option, index) => {
              const isSelected = value.includes(option.value);
              const letter = String.fromCharCode(65 + index);
              const isDisabled = !isSelected && maxSelections !== undefined && value.length >= maxSelections;

              return (
                <motion.button
                  key={option.value}
                  type="button"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => !isDisabled && toggleOption(option.value)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-4 w-full p-4 rounded-xl border-2 text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isSelected && "border-primary bg-primary/10",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  whileHover={!isDisabled ? { scale: 1.01 } : undefined}
                  whileTap={!isDisabled ? { scale: 0.99 } : undefined}
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
        )}

        {allowCustom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {customValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customValues.map((customValue) => (
                  <motion.span
                    key={customValue}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary rounded-full text-sm"
                  >
                    {customValue}
                    <button
                      type="button"
                      onClick={() => removeCustomOption(customValue)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={customPlaceholder}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomOption();
                  }
                }}
              />
              <motion.button
                type="button"
                onClick={addCustomOption}
                disabled={!customInput.trim() || (maxSelections !== undefined && value.length >= maxSelections)}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
