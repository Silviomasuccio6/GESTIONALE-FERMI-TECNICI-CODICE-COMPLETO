import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_-12px_rgba(37,99,235,0.65)] hover:bg-primary/92 hover:shadow-[0_10px_22px_-13px_rgba(37,99,235,0.7)]",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/75",
        outline:
          "border border-input bg-card text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-primary/30 hover:bg-muted/55",
        ghost: "border border-transparent bg-transparent text-foreground hover:bg-muted/60",
        destructive: "border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));
Button.displayName = "Button";
