import { NextResponse } from "next/server";
import { getCachedUser } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Ensure user exists in cache
    const user = await getCachedUser(user_id);
    if (!user) {
      return NextResponse.json({ error: "User not found. Please look up the user first." }, { status: 404 });
    }

    // User already has a slug from cacheUser, just return the share URL
    if (!user.slug) {
      return NextResponse.json({ error: "User slug not generated" }, { status: 500 });
    }
    
    return NextResponse.json({
      share_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.slug}`,
      user: {
        id: user.id,
        name: user.name,
        image_url: user.image_url
      },
      created_at: user.created_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create share link" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const user = await getCachedUser(user_id);
    if (!user || !user.slug) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      share_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.slug}`,
      user: {
        id: user.id,
        name: user.name,
        image_url: user.image_url
      },
      created_at: user.created_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to get share link" }, { status: 500 });
  }
}
