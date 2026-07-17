// src/components/ui/Badge.tsx
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;  // Add this
}

export function Badge({ children, variant = "default", size = "sm", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-md ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
