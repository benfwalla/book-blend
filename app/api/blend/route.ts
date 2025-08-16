import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BOOKBLEND_BASE_URL || "https://book-blend-backend.vercel.app";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id1 = searchParams.get("user_id1");
    const user_id2 = searchParams.get("user_id2");

    if (!user_id1 || !user_id2) {
      return NextResponse.json({ error: "user_id1 and user_id2 are required" }, { status: 400 });
    }

    const url = new URL("/blend", BASE_URL);
    url.searchParams.set("user_id1", user_id1);
    url.searchParams.set("user_id2", user_id2);

    const upstream = await fetch(url.toString(), { cache: "no-store" });
    const text = await upstream.text();

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
