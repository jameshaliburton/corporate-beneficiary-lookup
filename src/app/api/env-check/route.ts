import { NextResponse } from "next/server";

export async function GET() {
  const present = {
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    FORCE_TEST_DATA: process.env.FORCE_TEST_DATA ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  };

  return NextResponse.json({
    ok: present.ANTHROPIC_API_KEY || present.DATABASE_URL ? true : false,
    present,
  });
}
