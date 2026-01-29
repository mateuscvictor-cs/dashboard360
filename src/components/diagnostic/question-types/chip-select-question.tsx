"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ChipSelectQuestionProps {
  question: string;
  subtitle?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
  className?: string;
}

export function ChipSelectQuestion({
  question,
  subtitle,
  options,
  value,
  onChange,
  required,
  allowCustom = false,
  customPlaceholder = "Adicionar outro...",
  className,
}: ChipSelectQuestionProps) {
  const [customInput, setCustomInput] = useState("");

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const addCustomOption = () => {
    if (customInput.trim() && !value.includes(customInput.trim())) {
      onChange([...value, customInput.trim()]);
      setCustomInput("");
    }
  };

  const customValues = value.filter(
    (v) => !options.some((opt) => opt.value === v)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("flex flex-col items-center justify-center min-h-[400px] w-full max-w-3xl mx-auto px-4", className)}
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
          className="flex flex-wrap justify-center gap-3"
        >
          {options.map((option, index) => {
            const isSelected = value.includes(option.value);

            return (
              <motion.button
                key={option.value}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.03 }}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm md:text-base font-medium transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected && "border-primary bg-primary/10"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {option.icon}
                <span>{option.label}</span>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </motion.span>
                )}
              </motion.button>
            );
          })}

          {customValues.map((customValue) => (
            <motion.span
              key={customValue}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-primary bg-primary/10 rounded-full text-sm md:text-base font-medium"
            >
              {customValue}
              <button
                type="button"
                onClick={() => toggleOption(customValue)}
                className="hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.span>
          ))}
        </motion.div>

        {allowCustom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-2 max-w-md mx-auto"
          >
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
              disabled={!customInput.trim()}
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
