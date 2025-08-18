"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FriendPicker } from "@/components/friend-picker";
import { JsonView } from "@/components/json-view";
import { getBlend, getUser, type Friend, type UserInfo } from "@/lib/api";
import { userIdSchema } from "@/lib/goodreads";
import { Avatar } from "@/components/ui/avatar";
import { Toaster, type Toast } from "@/components/ui/toast";

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? "h-4 w-4"}
      aria-hidden="true"
    >
      <path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z" />
      <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7z" />
    </svg>
  );
}

export default function Page() {
  const [rawUser, setRawUser] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserInfo | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const [secondRaw, setSecondRaw] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [blendLoading, setBlendLoading] = useState(false);
  const [blendResult, setBlendResult] = useState<any | null>(null);

  // simple toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...t }]);
  }, []);
  const closeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const secondUserId = useMemo(() => {
    if (selectedFriendId) return selectedFriendId;
    if (!secondRaw) return null;
    const parsed = userIdSchema.safeParse(secondRaw);
    return parsed.success ? parsed.data : null;
  }, [selectedFriendId, secondRaw]);

  const handleFetchUser = useCallback(async () => {
    setError(null);
    setBlendResult(null);
    setUserData(null);
    setFriends([]);

    const parsed = userIdSchema.safeParse(rawUser);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid user id");
      return;
    }
    const uid = parsed.data;
    setUserId(uid);

    setLoadingUser(true);
    try {
      const data = await getUser(uid);
      setUserData(data);
      // Sort friends by book_count desc (missing/empty treated as 0)
      const sorted = (data.friends || []).slice().sort((a, b) => {
        const an = Number(a.book_count || 0);
        const bn = Number(b.book_count || 0);
        return bn - an;
      });
      setFriends(sorted);
      // persist last used primary user id and what the user actually entered (URL or ID)
      try {
        localStorage.setItem("bb_last_user_id", uid);
        localStorage.setItem("bb_last_user_display", rawUser);
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "Failed to load user");
      pushToast({ title: "Failed to load user", description: String(e?.message ?? "Unknown error"), variant: "destructive" });
    } finally {
      setLoadingUser(false);
    }
  }, [rawUser]);

  const handleBlend = useCallback(async () => {
    if (!userId || !secondUserId) return;
    setError(null);
    setBlendLoading(true);
    setBlendResult(null);
    try {
      const result = await getBlend(userId, secondUserId);
      setBlendResult(result);
      // persist both ids
      try {
        localStorage.setItem("bb_last_user_id", userId);
        localStorage.setItem("bb_last_second_user_id", secondUserId);
        // also persist display values: what user saw/entered
        localStorage.setItem("bb_last_user_display", rawUser);
        // prefer manual secondRaw; if none and a friend was selected, store friend's URL
        if (secondRaw) {
          localStorage.setItem("bb_last_second_user_display", secondRaw);
        } else if (selectedFriendId) {
          localStorage.setItem("bb_last_second_user_display", `https://www.goodreads.com/user/show/${selectedFriendId}`);
        }
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch blend");
      pushToast({ title: "Blend failed", description: String(e?.message ?? "Unknown error"), variant: "destructive" });
    } finally {
      setBlendLoading(false);
    }
  }, [userId, secondUserId]);

  // prefill from localStorage (prefer original display value user typed/pasted)
  useEffect(() => {
    try {
      const display = localStorage.getItem("bb_last_user_display");
      const legacy = localStorage.getItem("bb_last_user_id");
      const secondDisplay = localStorage.getItem("bb_last_second_user_display");
      if (display) setRawUser(display);
      else if (legacy) setRawUser(legacy);
      if (secondDisplay) setSecondRaw(secondDisplay);
    } catch {}
  }, []);

  // Paste helpers: extract URL from various clipboard flavors (covers iOS Safari)
  function extractUrlFromText(text?: string | null): string | null {
    if (!text) return null;
    const m = text.match(/\bhttps?:\/\/[^\s<>()]+/i);
    return m ? m[0] : null;
  }
  function extractUrlFromHtml(html?: string | null): string | null {
    if (!html) return null;
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const a = doc.querySelector("a[href]");
      if (a?.getAttribute("href")) return a.getAttribute("href");
      return extractUrlFromText(doc.body?.textContent ?? "");
    } catch {
      return null;
    }
  }
  function extractUrlFromUriList(list?: string | null): string | null {
    if (!list) return null;
    const line = list.split(/\r?\n/).find((l) => {
      const t = l.trim();
      return t && !t.startsWith("#");
    });
    return line ?? null;
  }
  // Fallback: try to extract a Goodreads numeric user id from arbitrary text
  function extractGoodreadsId(text?: string | null): string | null {
    if (!text) return null;
    // Prefer explicit /user/show/<id>
    const m = text.match(/\buser\/show\/(\d+)\b/i);
    if (m && m[1]) return m[1];
    // Otherwise, grab a standalone number (7-12 digits) which is typical for Goodreads IDs
    const n = text.match(/\b(\d{5,12})\b/);
    return n ? n[1] : null;
  }

  // Background wallpaper moved to layout; component removed from this page.

  // Background wallpaper is global; no per-page responsive state needed.

  return (
    <div className="relative">
      {/* Foreground content */}
      <main className="space-y-8 relative z-10">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1) Enter a Goodreads user</h2>
          <p className="text-sm text-gray-700">
            To find yours, open {" "}
            <a href="https://www.goodreads.com/" target="_blank" rel="noreferrer" className="text-[#6366f1] underline">Goodreads</a>
            {" →  "}Profile picture{" → "}Profile. Copy the URL.
          </p>
          <div className="flex gap-2 items-end">
            {/* Helper to sanitize Goodreads app share text on paste */}
            {/* When users paste e.g. "Check out my profile on Goodreads! https://www.goodreads.com/user/show/42944663" */}
            {/* we extract just the URL for a clean input. */}
            {null}
            <Input
              type="url"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="url"
              placeholder="e.g. https://www.goodreads.com/user/show/42944663-ben-wallace or 42944663"
              value={rawUser}
              onChange={(e) => setRawUser(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchUser()}
              onPaste={(e) => {
                const dt = e.clipboardData;
                let url =
                  extractUrlFromUriList(dt.getData("text/uri-list")) ||
                  extractUrlFromHtml(dt.getData("text/html")) ||
                  extractUrlFromText(dt.getData("text"));
                if (!url) {
                  const id =
                    extractGoodreadsId(dt.getData("text/html")) ||
                    extractGoodreadsId(dt.getData("text"));
                  if (id) url = `https://www.goodreads.com/user/show/${id}`;
                }
                if (url) {
                  e.preventDefault();
                  setRawUser(url);
                }
              }}
            />
            <Button onClick={handleFetchUser} disabled={loadingUser} className="shrink-0 whitespace-nowrap">Look up</Button>
          </div>
          {loadingUser && (
            <div className="pt-1"><Spinner label="Fetching user & friends..." /></div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {userData && (
            <div className="rounded-md border p-3 bg-white flex items-center gap-3">
              <Avatar src={userData.user.image_url} alt={userData.user.name} />
              <div className="flex-1">
                <div className="text-sm"><span className="font-medium">{userData.user.name}</span></div>
              </div>
              <a
                href={`https://www.goodreads.com/user/show/${userData.user.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-600 hover:text-gray-800"
                title="Open on Goodreads"
              >
                <ExternalIcon />
              </a>
            </div>
          )}
        </section>

        {userData && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2) Choose a friend <span className="text-gray-500">or</span> enter another user</h2>
            <div className="relative grid items-start gap-4 md:grid-cols-[1fr_56px_1fr]">
              {/* Absolutely centered OR pill (horizontal/vertical), sits over the spacer */}
              <div className="hidden md:block pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-full border px-2 py-0.5 text-xs text-gray-600 bg-white">OR</div>
              </div>
              {/* Left: friends list */}
              <div>
                <FriendPicker
                  friends={friends}
                  selectedId={selectedFriendId}
                  onSelect={(id) => {
                    setSelectedFriendId(id);
                    setSecondRaw("");
                  }}
                />
              </div>

              {/* Middle spacer column to reserve gap */}
              <div className="hidden md:block" />

              {/* Right: manual entry card */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center text-sm text-gray-600 md:hidden">or</div>
                <div className="rounded-md border bg-white px-3 py-2.5 flex flex-col gap-2">
                  <Input
                    type="url"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    inputMode="url"
                    placeholder="Paste a Goodreads profile URL or ID"
                    value={secondRaw}
                    onChange={(e) => {
                      setSelectedFriendId(null);
                      setSecondRaw(e.target.value);
                    }}
                    onPaste={(e) => {
                      const dt = e.clipboardData;
                      let url =
                        extractUrlFromUriList(dt.getData("text/uri-list")) ||
                        extractUrlFromHtml(dt.getData("text/html")) ||
                        extractUrlFromText(dt.getData("text"));
                      if (!url) {
                        const id =
                          extractGoodreadsId(dt.getData("text/html")) ||
                          extractGoodreadsId(dt.getData("text"));
                        if (id) url = `https://www.goodreads.com/user/show/${id}`;
                      }
                      if (url) {
                        e.preventDefault();
                        setSelectedFriendId(null);
                        setSecondRaw(url);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Global selection summary + CTA below grid */}
            <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              {/* Overlapped avatars summary */}
              <div className="group inline-flex items-center gap-3">
                <div className="relative h-9">
                  <div className="relative inline-block z-10 transition-transform group-hover:-translate-x-1">
                    <Avatar src={userData.user.image_url} alt={userData.user.name} size={36} />
                  </div>
                  <div className="relative inline-block -ml-3 z-0 transition-transform group-hover:translate-x-1">
                    {selectedFriendId ? (
                      (() => {
                        const f = friends.find((x) => x.id === selectedFriendId);
                        return <Avatar src={f?.image_url} alt={f?.name || "friend"} size={36} />;
                      })()
                    ) : secondUserId ? (
                      <Avatar src={undefined as any} alt="entered user" size={36} />
                    ) : (
                      <Avatar src={undefined as any} alt="waiting" size={36} />
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-700 truncate">
                  <span className="font-medium">{userData.user.name}</span>
                  {selectedFriendId ? (
                    (() => {
                      const f = friends.find((x) => x.id === selectedFriendId);
                      return f ? <span className="font-medium"> &middot; {f.name}</span> : null;
                    })()
                  ) : secondUserId ? (
                    <span className="font-medium"> &middot; entered user</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 md:ml-auto">
                {blendLoading && (
                  <div className="hidden md:flex items-center">
                    <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-[#6366f1]/60 border-t-transparent animate-spin" />
                    <span className="sr-only">Blending…</span>
                  </div>
                )}
                <Button onClick={handleBlend} disabled={!secondUserId || blendLoading} className="md:w-auto w-full py-3 text-base">
                  {blendLoading ? "Blending…" : "Blend"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {blendResult && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3) Result</h2>
            <JsonView data={blendResult} />
          </section>
        )}
        <Toaster toasts={toasts} onClose={closeToast} />
      </main>
    </div>
  );
}
