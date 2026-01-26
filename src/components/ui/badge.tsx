import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline: "text-foreground border-border",
        
        success: "border-transparent bg-success text-success-foreground shadow-sm shadow-success/25",
        warning: "border-transparent bg-warning text-warning-foreground shadow-sm shadow-warning/25",
        danger: "border-transparent bg-danger text-danger-foreground shadow-sm shadow-danger/25",
        info: "border-transparent bg-info text-info-foreground shadow-sm shadow-info/25",
        
        "success-soft": "border-success/20 bg-success-light text-success",
        "warning-soft": "border-warning/20 bg-warning-light text-warning",
        "danger-soft": "border-danger/20 bg-danger-light text-danger",
        "info-soft": "border-info/20 bg-info-light text-info",
        
        critical: "border-transparent bg-health-critical text-white shadow-sm shadow-health-critical/25",
        risk: "border-transparent bg-health-risk text-white shadow-sm shadow-health-risk/25",
        attention: "border-transparent bg-health-attention text-white shadow-sm shadow-health-attention/25",
        healthy: "border-transparent bg-health-healthy text-white shadow-sm shadow-health-healthy/25",
        
        "critical-soft": "border-health-critical/20 bg-health-critical-light text-health-critical font-semibold",
        "risk-soft": "border-health-risk/20 bg-health-risk-light text-health-risk font-semibold",
        "attention-soft": "border-health-attention/20 bg-health-attention-light text-health-attention font-semibold",
        "healthy-soft": "border-health-healthy/20 bg-health-healthy-light text-health-healthy font-semibold",
        
        gradient: "border-transparent bg-gradient-brand text-white shadow-sm shadow-primary/25",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({ className, variant, size, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative mr-1.5">
          <span className={cn(
            "block h-1.5 w-1.5 rounded-full bg-current",
            pulse && "animate-pulse"
          )} />
          {pulse && (
            <span className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-current pulse-ring" />
          )}
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
