import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.GOOGLE_ONE_TAP_ENABLED !== "true") {
    return NextResponse.json(
      { enabled: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google Sign-In belum dikonfigurasi." }, { status: 503 });
  }

  return NextResponse.json(
    { enabled: true, clientId },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
