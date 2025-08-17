import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        // Use >=16px on mobile to prevent iOS Safari zoom on focus
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base md:text-sm placeholder:text-gray-400",
        // Softer focus: thin ring, no black outline, keep bg unchanged
        "outline-none focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40 focus:border-[#6366f1]/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
