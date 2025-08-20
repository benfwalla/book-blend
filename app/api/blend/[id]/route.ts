import { NextResponse } from "next/server";
import { getBlendById } from "@/lib/database";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const blendId = params.id;
    
    if (!blendId) {
      return NextResponse.json({ error: "Blend ID is required" }, { status: 400 });
    }

    const blend = await getBlendById(blendId);
    if (!blend) {
      return NextResponse.json({ error: "Blend not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...blend.blend_data,
      _meta: {
        blend_id: blend.id,
        user1_id: blend.user1_id,
        user2_id: blend.user2_id,
        created_at: blend.created_at
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to get blend" }, { status: 500 });
  }
}
