"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Toaster, type Toast } from "@/components/ui/toast";
import { getBlend, getUser, type UserInfo } from "@/lib/api";
import { userIdSchema } from "@/lib/goodreads";

interface ShareUser {
  id: string;
  name: string;
  image_url: string | null;
}

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const shareSlug = params.userId as string; // This is now a slug, not a user ID
  
  const [shareUser, setShareUser] = useState<ShareUser | null>(null);
  const [shareUserId, setShareUserId] = useState<string | null>(null);
  const [rawUser, setRawUser] = useState("");
  const [loadingShare, setLoadingShare] = useState(true);
  const [loadingBlend, setLoadingBlend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast system
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...t }]);
  }, []);
  const closeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const secondUserId = useMemo(() => {
    if (!rawUser) return null;
    const parsed = userIdSchema.safeParse(rawUser);
    return parsed.success ? parsed.data : null;
  }, [rawUser]);

  // Load share user data
  useEffect(() => {
    async function fetchShareUser() {
      try {
        setLoadingShare(true);
        setError(null);

        // First, resolve the slug to get the user ID
        const shareResponse = await fetch(`/api/share/resolve?slug=${shareSlug}`);
        if (!shareResponse.ok) {
          throw new Error("Share link not found");
        }
        
        const shareData = await shareResponse.json();
        const userId = shareData.user_id;
        setShareUserId(userId);

        // Then fetch the user data
        const userResponse = await fetch(`/api/user?user_id=${userId}`);
        if (!userResponse.ok) {
          throw new Error("Failed to load user profile");
        }

        const userData = await userResponse.json();
        setShareUser({
          id: userData.user.id,
          name: userData.user.name,
          image_url: userData.user.image_url
        });
      } catch (err: any) {
        setError(err.message || "Failed to load share link");
      } finally {
        setLoadingShare(false);
      }
    }

    if (shareSlug) {
      fetchShareUser();
    }
  }, [shareSlug]);

  const handleBlend = useCallback(async () => {
    if (!shareUserId || !secondUserId) return;
    
    setLoadingBlend(true);
    setError(null);

    try {
      // First ensure the second user exists
      await getUser(secondUserId);
      
      // Create the blend
      const blendResponse = await fetch(`/api/blend?user_id1=${shareUserId}&user_id2=${secondUserId}`);
      if (!blendResponse.ok) {
        throw new Error("Failed to create blend");
      }
      
      const blendData = await blendResponse.json();
      
      // Redirect to the blend page
      if (blendData._meta?.blend_id) {
        router.push(`/blend/${blendData._meta.blend_id}`);
      } else {
        throw new Error("Blend created but no ID returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create blend");
      pushToast({ 
        title: "Blend failed", 
        description: String(err.message || "Unknown error"), 
        variant: "destructive" 
      });
    } finally {
      setLoadingBlend(false);
    }
  }, [shareUserId, secondUserId, router, pushToast]);

  // Paste helpers (same as homepage)
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
  function extractGoodreadsId(text?: string | null): string | null {
    if (!text) return null;
    const m = text.match(/\buser\/show\/(\d+)\b/i);
    if (m && m[1]) return m[1];
    const n = text.match(/\b(\d{5,12})\b/);
    return n ? n[1] : null;
  }

  if (loadingShare) {
    return (
      <main className="flex items-center justify-center min-h-[400px]">
        <Spinner label="Loading share link..." />
      </main>
    );
  }

  if (error && !shareUser) {
    return (
      <main className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8 max-w-2xl mx-auto">
      {/* Share user profile */}
      {shareUser && (
        <section className="text-center space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar src={shareUser.image_url} alt={shareUser.name} size={80} />
            <div>
              <h1 className="text-2xl font-bold">{shareUser.name}</h1>
              <p className="text-gray-600">wants to blend books with you!</p>
            </div>
          </div>
        </section>
      )}

      {/* Input for second user */}
      <section className="space-y-4">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-center">Enter your Goodreads profile</h2>
          <p className="text-sm text-gray-700 text-center">
            To find yours, open{" "}
            <a href="https://www.goodreads.com/" target="_blank" rel="noreferrer" className="text-[#6366f1] underline">
              Goodreads
            </a>
            {" → "}Profile picture{" → "}Profile. Copy the URL.
          </p>
        </div>

        <div className="flex gap-2 items-end">
          <Input
            type="url"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            inputMode="url"
            placeholder="e.g. https://www.goodreads.com/user/show/42944663 or 42944663"
            value={rawUser}
            onChange={(e) => setRawUser(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && secondUserId && handleBlend()}
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
          <Button 
            onClick={handleBlend} 
            disabled={!secondUserId || loadingBlend} 
            className="shrink-0 whitespace-nowrap"
          >
            {loadingBlend ? "Blending..." : "Blend Books"}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center">{error}</div>
        )}
      </section>

      {/* Preview of blend participants */}
      {shareUser && secondUserId && (
        <section className="space-y-3">
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Avatar src={shareUser.image_url} alt={shareUser.name} size={36} />
              <span className="font-medium">{shareUser.name}</span>
            </div>
            <span className="text-gray-500">×</span>
            <div className="flex items-center gap-2">
              <Avatar src={undefined as any} alt="Your profile" size={36} />
              <span className="font-medium">You</span>
            </div>
          </div>
        </section>
      )}

      <Toaster toasts={toasts} onClose={closeToast} />
    </main>
  );
}
