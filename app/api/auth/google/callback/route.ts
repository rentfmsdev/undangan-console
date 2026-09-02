import { NextResponse } from "next/server";
import { findOrCreateGoogleUser, SESSION_COOKIE_NAME } from "@/modules/auth/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const returnTo = state ? decodeURIComponent(state) : "/";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/google/callback`;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/login?error=invalid_oauth_params`, request.url));
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) {
      console.error("Failed to exchange code for token:", tokens);
      return NextResponse.redirect(new URL(`/login?error=token_exchange_failed`, request.url));
    }

    // 2. Fetch user profile from Google API
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = await userinfoResponse.json();
    if (!userinfoResponse.ok || !profile.email) {
      console.error("Failed to fetch user profile:", profile);
      return NextResponse.redirect(new URL(`/login?error=userinfo_failed`, request.url));
    }

    // 3. Single Action: Find or Create User in DB
    const { sessionToken } = await findOrCreateGoogleUser({
      googleId: profile.id,
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      avatarUrl: profile.picture,
    });

    // 4. Set Session Cookie
    const response = NextResponse.redirect(new URL(returnTo, request.url));
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Google Auth Callback Exception:", error);
    return NextResponse.redirect(new URL(`/login?error=internal_auth_error`, request.url));
  }
}

// POST endpoint to handle single-action Direct/Mock Google Sign-In for instant testing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, avatarUrl, googleId, returnTo = "/" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });
    }

    const { user, sessionToken } = await findOrCreateGoogleUser({
      googleId: googleId || `google_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: name || email.split("@")[0],
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    });

    const response = NextResponse.json({ success: true, user, returnTo });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Direct Google Auth Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal masuk" }, { status: 500 });
  }
}
