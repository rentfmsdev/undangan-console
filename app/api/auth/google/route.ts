import { NextRequest, NextResponse } from "next/server";
import {
  createOAuthState,
  getAppBaseUrl,
  OAUTH_COOKIE_PATH,
  OAUTH_POPUP_COOKIE_NAME,
  OAUTH_RETURN_TO_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  sanitizeReturnTo,
} from "@/modules/auth/oauth-state";

function popupConfigurationError(baseUrl: string) {
  const message = JSON.stringify({ type: "undangan:google-oauth", success: false, error: "google_not_configured" });
  const origin = JSON.stringify(baseUrl);
  return new NextResponse(
    `<!doctype html><html lang="id"><body><script>if(window.opener&&!window.opener.closed){window.opener.postMessage(${message},${origin});window.close();}</script>Google Sign-In belum dikonfigurasi.</body></html>`,
    { headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const isPopup = searchParams.get("popup") === "1";
  const baseUrl = getAppBaseUrl(request);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`;

  if (!clientId) {
    if (isPopup) return popupConfigurationError(baseUrl);
    // If Google Client ID is not configured in env yet, redirect to login page with notice or demo auth
    const loginUrl = new URL("/login", baseUrl);
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
  response.cookies.set(OAUTH_POPUP_COOKIE_NAME, isPopup ? "1" : "", cookieOptions);
  return response;
}
