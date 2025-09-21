import { NextResponse } from "next/server";
import { getUserBySlug } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const user = await getUserBySlug(slug);
    if (!user) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    return NextResponse.json({
      user_id: user.id,
      slug: user.slug,
      created_at: user.created_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to resolve share link" }, { status: 500 });
  }
}
