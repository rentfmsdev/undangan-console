import { NextRequest, NextResponse } from "next/server";
import { findOrCreateGoogleUser, SESSION_COOKIE_NAME } from "@/modules/auth/service";
import {
  isValidOAuthState,
  OAUTH_COOKIE_PATH,
  OAUTH_RETURN_TO_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  sanitizeReturnTo,
} from "@/modules/auth/oauth-state";

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", { maxAge: 0, path: OAUTH_COOKIE_PATH });
  response.cookies.set(OAUTH_RETURN_TO_COOKIE_NAME, "", { maxAge: 0, path: OAUTH_COOKIE_PATH });
  return response;
}

function oauthError(request: Request, code: string) {
  return clearOAuthCookies(NextResponse.redirect(new URL(`/login?error=${code}`, request.url)));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const returnTo = sanitizeReturnTo(request.cookies.get(OAUTH_RETURN_TO_COOKIE_NAME)?.value);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/google/callback`;

  if (!code || !clientId || !clientSecret || !isValidOAuthState(state, expectedState)) {
    return oauthError(request, "invalid_oauth_state");
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
      console.error("Failed to exchange Google OAuth code:", tokenResponse.status, tokens?.error ?? "unknown_error");
      return oauthError(request, "token_exchange_failed");
    }

    // 2. Fetch user profile from Google API
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = await userinfoResponse.json();
    if (!userinfoResponse.ok || !profile.email || profile.verified_email !== true) {
      console.error("Failed to fetch Google user profile:", userinfoResponse.status);
      return oauthError(request, "userinfo_failed");
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

    return clearOAuthCookies(response);
  } catch (error) {
    console.error("Google Auth Callback Exception:", error);
    return oauthError(request, "internal_auth_error");
  }
}

// POST endpoint to handle single-action Direct/Mock Google Sign-In for instant testing
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { email, name, avatarUrl, googleId } = body;
    const returnTo = sanitizeReturnTo(body.returnTo);

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
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    console.error("Direct Google Auth Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal masuk" }, { status: 500 });
  }
}
