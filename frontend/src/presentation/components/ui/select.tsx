import * as React from "react";
import { cn } from "../../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholderLabel?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholderLabel, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition-[border-color,box-shadow] focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {placeholderLabel ? <option value="">{placeholderLabel}</option> : null}
      {children}
    </select>
  )
);

Select.displayName = "Select";
