import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📩 [generateTagline] Request body:", body);

    const { brand, ultimateOwner, country } = body;

    const tagline = `${brand} is owned by ${ultimateOwner || "its parent company"} in ${country || "an unknown country"}.`;

    console.log("✅ [generateTagline] Response tagline:", tagline);

    return NextResponse.json({ success: true, tagline });
  } catch (err) {
    console.error("❌ [generateTagline] Error:", err);
    return NextResponse.json({ success: false, tagline: "" }, { status: 500 });
  }
} 