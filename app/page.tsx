"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { FriendPicker } from "../components/friend-picker";
import { JsonView } from "../components/json-view";
import { getBlend, getUser, type Friend, type UserInfo } from "../lib/api";
import { userIdSchema } from "../lib/goodreads";
import { Avatar } from "../components/ui/avatar";
import { Toaster, type Toast } from "../components/ui/toast";
import { ArrowSquareOut, Link, Check } from "phosphor-react";

export default function Page() {
  const router = useRouter();
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
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      // persist last used primary user id, display value, and complete user data
      try {
        localStorage.setItem("bb_last_user_id", uid);
        localStorage.setItem("bb_last_user_display", rawUser);
        localStorage.setItem("bb_last_user_data", JSON.stringify(data));
      } catch {}
      
      // Generate share link using the user's slug if available
      if (data.user.slug) {
        setShareUrl(`${window.location.origin}/share/${data.user.slug}`);
      } else {
        // Fallback to user ID if no slug yet (shouldn't happen with new system)
        setShareUrl(`${window.location.origin}/share/${uid}`);
      }
    } catch (e: any) {
      // Convert technical errors to user-friendly messages
      let userFriendlyMessage = "Failed to load user";
      let toastDescription = "Please check the profile URL and try again";
      
      // Check if this is already a user-friendly error message
      if (e?.message && !e.message.includes("Failed to fetch user:") && !e.isTechnical) {
        // If the error message doesn't contain technical jargon, use it directly
        if (!e.message.match(/\b(500|404|400|401|403)\b/) && !e.message.includes("HTTP")) {
          userFriendlyMessage = e.message;
          toastDescription = "Please check the profile URL and try again.";
        }
      }
      
      // Handle specific error patterns
      if (e?.message?.includes("500")) {
        userFriendlyMessage = "User not found";
        toastDescription = "Can't find Goodreads profile. Please check the URL and try again.";
      } else if (e?.message?.includes("404")) {
        userFriendlyMessage = "User not found";
        toastDescription = "Can't find Goodreads profile. Please check the URL and try again.";
      } else if (e?.message?.includes("Failed to fetch")) {
        userFriendlyMessage = "Connection error";
        toastDescription = "Please check your internet connection and try again.";
      } else if (e?.message?.includes("timeout")) {
        userFriendlyMessage = "Request timed out";
        toastDescription = "The request took too long. Please try again.";
      }
      
      setError(userFriendlyMessage);
      pushToast({ 
        title: userFriendlyMessage, 
        description: toastDescription, 
        variant: "destructive" 
      });
    } finally {
      setLoadingUser(false);
    }
  }, [rawUser]);

  const handleBlend = useCallback(async () => {
    if (!userId || !secondUserId) return;
    setError(null);
    setBlendLoading(true);
    try {
      const result = await getBlend(userId, secondUserId);
      
      // Check if there was a database error
      if (result.error) {
        throw new Error(`Database error: ${result.error}${result.details ? ` - ${result.details}` : ''}`);
      }
      
      // Always redirect to dedicated page - create one if blend_id doesn't exist
      if (result._meta?.blend_id) {
        router.push(`/blend/${result._meta.blend_id}`);
      } else {
        // For legacy blends without blend_id, we'll need to handle this case
        // For now, show an error since all new blends should have blend_id
        throw new Error("Blend created but no ID returned. This indicates a database configuration issue. Please check the server logs.");
      }
      
      // persist primary user only (user data already saved from handleFetchUser)
      try {
        localStorage.setItem("bb_last_user_id", userId);
        localStorage.setItem("bb_last_user_display", rawUser);
      } catch {}
    } catch (e: any) {
      // Convert technical errors to user-friendly messages
      let userFriendlyMessage = "Blend failed";
      let toastDescription = "Please try again";
      
      // Check if this is already a user-friendly error message
      if (e?.message && !e.message.includes("Failed to fetch blend:") && !e.message.includes("Database error") && !e.isTechnical) {
        // If the error message doesn't contain technical jargon, use it directly
        if (!e.message.match(/\b(500|404|401|403)\b/) && !e.message.includes("HTTP")) {
          userFriendlyMessage = e.message;
          // Set specific descriptions for known error types
          if (e.message.includes("doesn't have any books")) {
            toastDescription = "Try blending with a different user who has books in their library.";
          } else {
            toastDescription = "Please try again or contact support if the issue persists.";
          }
        }
      }
      
      // Handle specific error patterns (but don't override user-friendly messages)
      if (e?.message?.includes("Database error")) {
        userFriendlyMessage = "Unable to save blend";
        toastDescription = "There was an issue saving your blend. Please try again.";
      } else if (e?.message?.includes("500") || e?.message?.includes("Server error")) {
        userFriendlyMessage = "Something went wrong";
        toastDescription = "Please try again in a moment.";
      } else if (e?.message?.includes("Failed to fetch")) {
        userFriendlyMessage = "Connection error";
        toastDescription = "Please check your internet connection and try again.";
      } else if (e?.message?.includes("timeout")) {
        userFriendlyMessage = "Request timed out";
        toastDescription = "The request took too long. Please try again.";
      }
      
      // Only show generic "Invalid request" for actual bad requests that aren't user-friendly
      if (e?.message?.includes("400") && userFriendlyMessage === "Blend failed") {
        userFriendlyMessage = "Invalid request";
        toastDescription = "Please check your input and try again.";
      }
      
      setError(userFriendlyMessage);
      pushToast({ 
        title: userFriendlyMessage, 
        description: toastDescription, 
        variant: "destructive" 
      });
    } finally {
      setBlendLoading(false);
    }
  }, [userId, secondUserId, router, rawUser, pushToast]);

  const handleCreateShareLink = useCallback(async () => {
    if (!userId) return;
    
    setShareLoading(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create share link');
      }
      
      const data = await response.json();
      setShareUrl(data.share_url);
      
      pushToast({ 
        title: "Share link created!", 
        description: "You can now copy the link", 
        variant: "default" 
      });
    } catch (err: any) {
      let toastDescription = "Please try again";
      
      if (err?.message?.includes("500")) {
        toastDescription = "Something went wrong on our end. Please try again in a moment.";
      } else if (err?.message?.includes("Failed to fetch")) {
        toastDescription = "Please check your internet connection and try again.";
      }
      
      pushToast({ 
        title: "Unable to create share link", 
        description: toastDescription, 
        variant: "destructive" 
      });
    } finally {
      setShareLoading(false);
    }
  }, [userId, pushToast]);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      pushToast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
        variant: "default",
      });
    } catch (err: any) {
      pushToast({
        title: "Failed to copy link",
        description: String(err.message || "Unknown error"),
        variant: "destructive",
      });
    }
  }, [shareUrl, pushToast]);

  // prefill from localStorage and restore cached user data
  useEffect(() => {
    try {
      const display = localStorage.getItem("bb_last_user_display");
      const savedUserId = localStorage.getItem("bb_last_user_id");
      const savedUserData = localStorage.getItem("bb_last_user_data");
      
      if (display) setRawUser(display);
      else if (savedUserId) setRawUser(savedUserId);
      
      // Restore cached user data if available
      if (savedUserId && savedUserData && !userData) {
        try {
          const parsedData = JSON.parse(savedUserData);
          setUserId(savedUserId);
          setUserData(parsedData);
          // Sort friends by book_count desc (same as in handleFetchUser)
          const sorted = (parsedData.friends || []).slice().sort((a: Friend, b: Friend) => {
            const an = Number(a.book_count || 0);
            const bn = Number(b.book_count || 0);
            return bn - an;
          });
          setFriends(sorted);
          // Generate share link using cached user's slug if available
          if (parsedData.user.slug) {
            setShareUrl(`${window.location.origin}/share/${parsedData.user.slug}`);
          } else {
            setShareUrl(`${window.location.origin}/share/${savedUserId}`);
          }
        } catch {
          // If parsing fails, ignore cached data
        }
      }
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

  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1) Enter a Goodreads user</h2>
        <p className="text-sm text-gray-700">
          To find yours, open {" "}
          <a href="https://www.goodreads.com/" target="_blank" rel="noreferrer" className="text-[#6366f1] underline">Goodreads</a>
          {" →  "}Profile picture{" → "}Profile. Copy the URL (works with both username and full profile URLs).
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
            placeholder="e.g. https://www.goodreads.com/user/show/23470"
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
        {userData && (
          <div className="space-y-3">
            <div className="rounded-md border p-3 bg-white">
              <div className="flex items-center gap-3">
                <Avatar src={userData.user.image_url} alt={userData.user.name} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{userData.user.name}</div>
                  {shareUrl && (
                    <div 
                      className="flex items-center gap-2 mt-1 cursor-pointer group"
                      onClick={handleCopyShareLink}
                    >
                      <p className="text-xs text-gray-500 truncate group-hover:text-indigo-600 transition-colors">
                        {shareUrl.replace(/^https?:\/\//, '')}
                      </p>
                      {copied ? (
                        <Check size={14} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Link size={14} className="text-gray-400 group-hover:text-gray-800 transition-colors flex-shrink-0" />
                      )}
                    </div>
                  )}
                </div>
                <a
                  href={`https://www.goodreads.com/user/show/${userData.user.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-600 hover:text-gray-800"
                  title="Open on Goodreads"
                >
                  <ArrowSquareOut size={16} />
                </a>
              </div>
            </div>
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
                  placeholder="e.g. https://www.goodreads.com/23470 or user ID"
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
                {(selectedFriendId || secondUserId) && (
                  <div className="relative inline-block -ml-3 z-0 transition-transform group-hover:translate-x-1">
                    {selectedFriendId ? (
                      (() => {
                        const f = friends.find((x) => x.id === selectedFriendId);
                        return <Avatar src={f?.image_url} alt={f?.name || "friend"} size={36} />;
                      })()
                    ) : (
                      <Avatar src={undefined as any} alt="entered user" size={36} />
                    )}
                  </div>
                )}
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
            <div className="flex flex-col gap-2 md:ml-auto">
              <div className="flex items-center gap-2 justify-end">
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
              {error && (
                <div className="text-sm text-red-600 text-right">{error}</div>
              )}
            </div>
          </div>
        </section>
      )}
      <Toaster toasts={toasts} onClose={closeToast} />
    </main>
  );
}
