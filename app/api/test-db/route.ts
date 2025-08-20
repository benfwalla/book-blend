import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Test connection by querying users table
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      userCount: count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err?.message || "Database connection failed" 
    }, { status: 500 });
  }
}
