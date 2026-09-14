export type GoogleOAuthPopupResult =
  | { success: true; returnTo: string }
  | { success: false; error: "cancelled" | "popup_blocked" | string };

const GOOGLE_OAUTH_MESSAGE = "undangan:google-oauth";

export function openGoogleOAuthPopup(returnTo: string): Promise<GoogleOAuthPopupResult> {
  const authUrl = `/api/auth/google?popup=1&returnTo=${encodeURIComponent(returnTo)}`;
  const popup = window.open(authUrl, "undangan-google-oauth", "popup=yes,width=520,height=680,left=120,top=80,resizable=yes,scrollbars=yes");
  if (!popup) return Promise.resolve({ success: false, error: "popup_blocked" });

  popup.focus();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: GoogleOAuthPopupResult) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(closedTimer);
      resolve(result);
    };
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== "object") return;
      const payload = event.data as { type?: string; success?: boolean; returnTo?: string; error?: string };
      if (payload.type !== GOOGLE_OAUTH_MESSAGE) return;
      if (payload.success && typeof payload.returnTo === "string") finish({ success: true, returnTo: payload.returnTo });
      else finish({ success: false, error: payload.error || "oauth_failed" });
    };
    const closedTimer = window.setInterval(() => {
      if (popup.closed) finish({ success: false, error: "cancelled" });
    }, 400);
    window.addEventListener("message", onMessage);
  });
}
