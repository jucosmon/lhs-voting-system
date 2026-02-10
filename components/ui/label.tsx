import { cn } from "@/lib/utils";
import * as React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-semibold text-slate-700", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
