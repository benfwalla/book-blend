"use client";

import { Friend } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z" />
      <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7z" />
    </svg>
  );
}

export function FriendPicker({
  friends,
  selectedId,
  onSelect,
}: {
  friends: Friend[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b px-3 py-2 text-xs font-medium text-gray-600">
        Friends
      </div>
      {friends.length === 0 ? (
        <div className="p-3 text-sm text-gray-600">
          No friends found.
          <div className="text-xs mt-1">Try entering another Goodreads user ID/URL on the right.</div>
        </div>
      ) : (
        friends.map((f) => (
          <div
            key={f.id}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2.5 transition-colors border-t first:border-t-0 cursor-pointer",
              // Scope hover highlight to devices that actually support hover to avoid iOS double-tap
              selectedId === f.id ? "bg-[#6366f1]/10" : "[@media(hover:hover)]:hover:bg-[#6366f1]/5"
            )}
            onClick={() => onSelect(f.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(f.id);
              }
            }}
          >
            {/* Subtle left accent for selected row (no layout shift) */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-0 top-0 h-full w-0.5 bg-transparent",
                selectedId === f.id && "bg-[#6366f1]"
              )}
            />
            <div
              className="flex-1 flex items-center gap-3 text-left [@media(hover:hover)]:hover:opacity-95"
              title="Select this friend"
            >
              <Avatar src={f.image_url} alt={f.name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{f.name}</div>
              </div>
              {f.book_count ? (
                <div className="ml-auto text-xs text-gray-500">Books: {f.book_count}</div>
              ) : null}
            </div>
            <a
              href={`https://www.goodreads.com/user/show/${f.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-opacity opacity-100 md:opacity-0 md:[@media(hover:hover)]:group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalIcon />
            </a>
          </div>
        ))
      )}
    </div>
  );
}
