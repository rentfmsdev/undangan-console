import { NextRequest, NextResponse } from "next/server";
import {
  createOAuthState,
  OAUTH_COOKIE_PATH,
  OAUTH_RETURN_TO_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  sanitizeReturnTo,
} from "@/modules/auth/oauth-state";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/google/callback`;

  if (!clientId) {
    // If Google Client ID is not configured in env yet, redirect to login page with notice or demo auth
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", returnTo);
    loginUrl.searchParams.set("mode", "configure-env");
    return NextResponse.redirect(loginUrl);
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const state = createOAuthState();
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state,
  };

  const qs = new URLSearchParams(options);
  const response = NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: OAUTH_COOKIE_PATH,
    maxAge: 10 * 60,
  };
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, cookieOptions);
  response.cookies.set(OAUTH_RETURN_TO_COOKIE_NAME, returnTo, cookieOptions);
  return response;
}
