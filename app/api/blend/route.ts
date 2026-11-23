import { NextResponse } from "next/server";
import { saveBlend, getLatestBlend, cacheUser } from "@/lib/database";

const BASE_URL = process.env.NEXT_PUBLIC_BOOKBLEND_BASE_URL || "https://book-blend-backend.vercel.app";

async function resolveUserId(identifier: string): Promise<string> {
  if (/^\d+$/.test(identifier)) {
    return identifier;
  }

  if (!identifier.startsWith("username:")) {
    throw new Error("Invalid Goodreads user identifier");
  }

  const username = identifier.slice("username:".length);
  const url = new URL("/user", BASE_URL);
  url.searchParams.set("username", username);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BookBlend/1.0)",
      Accept: "application/json, text/plain, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to resolve Goodreads username: ${username}`);
  }

  const data = await response.json();
  const resolvedId = String(data?.user?.id || "");
  if (!/^\d+$/.test(resolvedId)) {
    throw new Error(`Goodreads did not return a valid user ID for: ${username}`);
  }

  return resolvedId;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId1 = searchParams.get("user_id1");
    const requestedUserId2 = searchParams.get("user_id2");
    const force_new = searchParams.get("force_new") === "true";

    if (!requestedUserId1 || !requestedUserId2) {
      return NextResponse.json({ error: "user_id1 and user_id2 are required" }, { status: 400 });
    }

    let user_id1: string;
    let user_id2: string;
    try {
      [user_id1, user_id2] = await Promise.all([
        resolveUserId(requestedUserId1),
        resolveUserId(requestedUserId2),
      ]);
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || "Invalid Goodreads user identifier", user_friendly: true },
        { status: 400 },
      );
    }

    // Check for existing blend (unless force_new is true)
    if (!force_new) {
      const existingBlend = await getLatestBlend(user_id1, user_id2);
      if (existingBlend) {
        // Return existing blend with metadata
        return NextResponse.json({
          ...existingBlend.blend_data,
          _meta: {
            blend_id: existingBlend.id,
            created_at: existingBlend.created_at,
            is_cached: true
          }
        }, { headers: { "Cache-Control": "no-store" } });
      }
    }

    // Fetch new blend from upstream API
    const url = new URL("/blend", BASE_URL);
    url.searchParams.set("user_id1", user_id1);
    url.searchParams.set("user_id2", user_id2);

    const upstream = await fetch(url.toString(), { 
      cache: "no-store",
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookBlend/1.0)',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    // Debug logging for production issues
    if (!upstream.ok) {
      const errorText = await upstream.text();
      let upstreamError: any = null;
      try {
        upstreamError = JSON.parse(errorText);
      } catch {
        // Preserve the raw response below when the upstream body is not JSON.
      }

      return NextResponse.json({
        error: upstreamError?.error || `Upstream API error: ${upstream.status} ${upstream.statusText}`,
        error_type: upstreamError?.error_type || "upstream_error",
        user_friendly: Boolean(upstreamError?.user_friendly),
        ...(!upstreamError && { details: errorText }),
      }, { status: upstream.status });
    }
    
    const text = await upstream.text();

    try {
      const json = JSON.parse(text);
      
      // Save blend to database
      try {
        // Ensure both users exist in database before saving blend
        // Extract user data from the blend response
        const user1Data = json.users?.[user_id1];
        const user2Data = json.users?.[user_id2];
        
        if (user1Data && user2Data) {
          // Cache both users first
          await Promise.all([
            cacheUser({
              user: {
                id: user1Data.id,
                name: user1Data.name,
                image_url: user1Data.image_url,
                profile_url: user1Data.profile_url,
                book_count: user1Data.metrics?.total_book_count?.toString() || "0"
              },
              friends: []
            }),
            cacheUser({
              user: {
                id: user2Data.id,
                name: user2Data.name,
                image_url: user2Data.image_url,
                profile_url: user2Data.profile_url,
                book_count: user2Data.metrics?.total_book_count?.toString() || "0"
              },
              friends: []
            })
          ]);
        }
        
        const savedBlend = await saveBlend(user_id1, user_id2, json);
        
        // Return blend with metadata
        return NextResponse.json({
          ...json,
          _meta: {
            blend_id: savedBlend.id,
            created_at: savedBlend.created_at,
            is_cached: false
          }
        }, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
      } catch (dbError: any) {
        // Database save error - log the specific error for debugging
        console.error('Database save failed:', {
          error: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint,
          user1Id: user_id1,
          user2Id: user_id2
        });
        
        // Return an error response instead of silently falling back
        return NextResponse.json({ 
          error: "Failed to save blend to database", 
          details: dbError.message,
          ...(process.env.NODE_ENV === 'development' && { blend_data: json }) // Include blend data only in development
        }, { status: 500 });
      }
    } catch {
      return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") || "text/plain", "Cache-Control": "no-store" } });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Proxy error" }, { status: 500 });
  }
}
