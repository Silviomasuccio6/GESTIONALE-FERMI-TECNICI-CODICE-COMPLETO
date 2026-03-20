import * as React from "react";
import { cn } from "../../../lib/utils";

export const Alert = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative w-full rounded-lg border px-4 py-3 text-sm", className)} {...props} />
);
