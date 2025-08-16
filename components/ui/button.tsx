import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2";
    const styles: Record<Variant, string> = {
      default: "bg-[#6366f1] text-white hover:bg-[#5558ee]",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      ghost: "hover:bg-gray-100",
    };
    return (
      <button ref={ref} className={cn(base, styles[variant], className)} {...props} />
    );
  }
);
Button.displayName = "Button";
