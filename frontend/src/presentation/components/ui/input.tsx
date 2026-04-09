import * as React from "react";
import { cn } from "../../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-xl border border-input bg-gradient-to-b from-background to-background/85 px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_24px_-22px_rgba(15,23,42,0.45)] ring-offset-background",
      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
