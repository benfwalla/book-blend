import { NextResponse } from "next/server";
import { getCachedUser, cacheUser } from "@/lib/database";
import type { UserInfo } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_BOOKBLEND_BASE_URL || "https://book-blend-backend.vercel.app";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Always fetch fresh data from upstream API to get friends list
    // We cache user profile data but always get fresh friends data
    const url = new URL("/user", BASE_URL);
    
    // Check if this is a username (prefixed with 'username:') or a regular user ID
    if (user_id.startsWith('username:')) {
      const username = user_id.replace('username:', '');
      url.searchParams.set("username", username);
    } else {
      url.searchParams.set("user_id", user_id);
    }

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
      return NextResponse.json({ 
        error: `Upstream API error: ${upstream.status} ${upstream.statusText}`,
        details: errorText,
        url: url.toString()
      }, { status: 500 });
    }
    
    const text = await upstream.text();

    try {
      const json = JSON.parse(text) as UserInfo;
      
      // Cache the user data for future requests
      await cacheUser(json);
      
      return NextResponse.json(json, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    } catch {
      return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") || "text/plain", "Cache-Control": "no-store" } });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Proxy error" }, { status: 500 });
  }
}
