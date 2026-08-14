import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Ensure this route is never statically cached and always runs on request.
export const dynamic = "force-dynamic";

/**
 * Keep-alive endpoint for the free-tier Supabase project.
 *
 * Supabase pauses free projects after ~7 days of inactivity. A Vercel Cron Job
 * (see vercel.json) hits this route on a schedule and runs a trivial query,
 * which counts as activity and prevents the project from being paused.
 *
 * If a CRON_SECRET environment variable is set, Vercel automatically sends it
 * as `Authorization: Bearer <CRON_SECRET>`, and we require it here. If it isn't
 * set, the endpoint stays open (the query is harmless and reveals nothing).
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Lightweight query: touch the database without pulling any rows.
    const { error } = await supabaseAdmin
      .from("users")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
