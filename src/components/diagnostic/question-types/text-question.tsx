"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TextQuestionProps {
  question: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function TextQuestion({
  question,
  subtitle,
  value,
  onChange,
  placeholder,
  required,
  className,
}: TextQuestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("flex flex-col items-center justify-center min-h-[300px] w-full max-w-2xl mx-auto px-4", className)}
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="text-lg md:text-xl h-14 text-center border-2 focus:border-primary transition-colors"
            autoFocus
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
