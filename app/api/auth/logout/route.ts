import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, SESSION_COOKIE_NAME } from "@/modules/auth/service";

async function performLogout(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      await deleteSession(token);
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  }

  const { searchParams } = new URL(request.url);
  const redirectTarget = searchParams.get("redirect") || searchParams.get("callbackUrl");

  // Check if request is a plain HTML form submission or explicitly wants a redirect
  const acceptHeader = request.headers.get("accept") || "";
  const isHtmlRequest = acceptHeader.includes("text/html");

  if (redirectTarget || isHtmlRequest) {
    const target = redirectTarget || "/roots";
    const redirectUrl = new URL(target, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function POST(request: Request) {
  try {
    return await performLogout(request);
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
export async function GET(request: Request) {
  try {
    return await performLogout(request);
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.redirect(new URL("/roots", request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
