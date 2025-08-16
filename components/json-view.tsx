"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export function JsonView({ data }: { data: any }) {
  const [collapsed, setCollapsed] = useState(false);
  const pretty = useMemo(() => JSON.stringify(data, null, 2), [data]);
  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b p-2">
        <div className="text-sm font-medium">Response JSON</div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCollapsed((s) => !s)}>
            {collapsed ? "Expand" : "Collapse"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(pretty)}
            title="Copy"
          >
            Copy
          </Button>
        </div>
      </div>
      {!collapsed && (
        <pre className="max-h-[600px] overflow-auto p-3 text-xs leading-relaxed">
{pretty}
        </pre>
      )}
    </div>
  );
}
