import { NextResponse } from "next/server";
import { saveBlend, getLatestBlend, cacheUser } from "@/lib/database";

const BASE_URL = process.env.NEXT_PUBLIC_BOOKBLEND_BASE_URL || "https://book-blend-backend.vercel.app";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id1 = searchParams.get("user_id1");
    const user_id2 = searchParams.get("user_id2");
    const force_new = searchParams.get("force_new") === "true";

    if (!user_id1 || !user_id2) {
      return NextResponse.json({ error: "user_id1 and user_id2 are required" }, { status: 400 });
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

    const upstream = await fetch(url.toString(), { cache: "no-store" });
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
        // Database save error - blend returned without metadata
        // Return blend without metadata if database save fails
        return NextResponse.json(json, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
      }
    } catch {
      return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") || "text/plain", "Cache-Control": "no-store" } });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Proxy error" }, { status: 500 });
  }
}
