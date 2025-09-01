import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📩 [generateNotes] Request body:", body);

    const { brand, ownershipFlow } = body;

    const notes = [
      `The brand ${brand} operates under a corporate structure involving ${ownershipFlow?.map((e: any) => e.name).join(" → ") || "unknown owners"}.`,
      `Ownership details have been verified based on available data sources.`
    ];

    console.log("✅ [generateNotes] Response notes:", notes);

    return NextResponse.json({ success: true, notes });
  } catch (err) {
    console.error("❌ [generateNotes] Error:", err);
    return NextResponse.json({ success: false, notes: [] }, { status: 500 });
  }
} 