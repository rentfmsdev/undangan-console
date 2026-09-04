import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { findOrCreateGoogleUser, SESSION_COOKIE_NAME } from "@/modules/auth/service";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function isVerifiedEmail(value: unknown) {
  return value === true || value === "true";
}

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google Sign-In belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const { credential } = (await request.json()) as { credential?: unknown };
    if (typeof credential !== "string" || credential.length < 32 || credential.length > 8_192) {
      return NextResponse.json({ error: "Kredensial Google tidak valid." }, { status: 400 });
    }

    const { payload } = await jwtVerify(credential, googleJwks, {
      audience: clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });

    const email = typeof payload.email === "string" ? payload.email : "";
    const googleId = typeof payload.sub === "string" ? payload.sub : "";
    if (!email || !googleId || !isVerifiedEmail(payload.email_verified)) {
      return NextResponse.json({ error: "Akun Google belum terverifikasi." }, { status: 401 });
    }

    const { user, sessionToken } = await findOrCreateGoogleUser({
      googleId,
      email,
      name: typeof payload.name === "string" ? payload.name : email.split("@")[0],
      avatarUrl: typeof payload.picture === "string" ? payload.picture : undefined,
    });

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Verifikasi Google Sign-In gagal." }, { status: 401 });
  }
}
