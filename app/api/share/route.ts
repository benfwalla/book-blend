import { NextResponse } from "next/server";
import { createShareLink, getShareLink, getCachedUser } from "@/lib/database";

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

    // Create or get existing share link
    const shareLink = await createShareLink(user_id);
    
    return NextResponse.json({
      share_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user_id}`,
      user: {
        id: user.id,
        name: user.name,
        image_url: user.image_url
      },
      created_at: shareLink.created_at
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

    const shareLink = await getShareLink(user_id);
    if (!shareLink) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    const user = await getCachedUser(user_id);
    
    return NextResponse.json({
      share_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user_id}`,
      user: user ? {
        id: user.id,
        name: user.name,
        image_url: user.image_url
      } : null,
      created_at: shareLink.created_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to get share link" }, { status: 500 });
  }
}
