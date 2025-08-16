"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export type Toast = { id: number; title?: string; description?: string; variant?: "default" | "destructive" };

export function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);
  const isDestructive = toast.variant === "destructive";
  return (
    <div className={cn(
      "min-w-[240px] rounded-md border p-3 shadow-md bg-white",
      isDestructive ? "border-red-300" : "border-gray-200"
    )}>
      {toast.title && <div className={cn("text-sm font-medium", isDestructive ? "text-red-700" : "text-gray-900")}>{toast.title}</div>}
      {toast.description && <div className={cn("text-xs mt-1", isDestructive ? "text-red-600" : "text-gray-700")}>{toast.description}</div>}
    </div>
  );
}

export function Toaster({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}
