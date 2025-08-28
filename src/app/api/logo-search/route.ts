import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    console.log("📩 [logo-search] Request query:", query);

    // Return ui-avatars fallback
    const avatarLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(query || "Logo")}&background=random`;

    console.log("✅ [logo-search] Returning avatar logo:", avatarLogo);

    return NextResponse.json({ success: true, logo: avatarLogo });
  } catch (err) {
    console.error("❌ [logo-search] Error:", err);
    return NextResponse.json({ success: false, logo: "" }, { status: 500 });
  }
} 