import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BOOKBLEND_BASE_URL || "https://book-blend-backend.vercel.app";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const url = new URL("/user", BASE_URL);
    url.searchParams.set("user_id", user_id);

    const upstream = await fetch(url.toString(), { cache: "no-store" });
    const text = await upstream.text();

    // Try JSON parse; if it fails, return raw text
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    } catch {
      return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") || "text/plain", "Cache-Control": "no-store" } });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Proxy error" }, { status: 500 });
  }
}
