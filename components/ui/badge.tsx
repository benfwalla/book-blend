import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#6366f1]/40 bg-[#6366f1]/10 px-2 py-0.5 text-xs font-medium text-[#373ab6]",
        className
      )}
    >
      {children}
    </span>
  );
}
