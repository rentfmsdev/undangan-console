"use client";

import { useEffect, useRef } from "react";

type SignedInUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (configuration: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        context?: "signin" | "signup" | "use";
        itp_support?: boolean;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      prompt: () => void;
      cancel: () => void;
    };
  };
};

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const ONE_TAP_PROMPTED_KEY = "undangan-console:google-one-tap-prompted:v1";

function getGoogleIdentity() {
  return (window as Window & { google?: GoogleIdentityApi }).google;
}

function loadGoogleIdentity() {
  return new Promise<void>((resolve, reject) => {
    if (getGoogleIdentity()?.accounts.id) {
      resolve();
      return;
    }

    const onLoad = () => resolve();
    const onError = () => reject(new Error("Google Identity Services gagal dimuat."));
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });
}

export function GoogleOneTap({
  enabled,
  onAuthenticated,
}: {
  enabled: boolean;
  onAuthenticated: (user: SignedInUser) => void;
}) {
  const onAuthenticatedRef = useRef(onAuthenticated);
  const signingInRef = useRef(false);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  useEffect(() => {
    if (!enabled || sessionStorage.getItem(ONE_TAP_PROMPTED_KEY)) return;

    let cancelled = false;

    async function showPrompt() {
      try {
        const configResponse = await fetch("/api/auth/google/one-tap/config", { cache: "no-store" });
        if (!configResponse.ok || cancelled) return;

        const { enabled: oneTapEnabled, clientId } = (await configResponse.json()) as {
          enabled?: boolean;
          clientId?: string;
        };
        if (!oneTapEnabled || !clientId) return;

        await loadGoogleIdentity();
        const google = getGoogleIdentity();
        if (cancelled || !google?.accounts.id) return;

        // Keep the experience unobtrusive: show once per browser tab/session.
        sessionStorage.setItem(ONE_TAP_PROMPTED_KEY, "true");

        google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          itp_support: true,
          use_fedcm_for_prompt: true,
          callback: async ({ credential }) => {
            if (!credential || signingInRef.current) return;
            signingInRef.current = true;

            try {
              const response = await fetch("/api/auth/google/one-tap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
              });
              if (!response.ok) return;

              const payload = (await response.json()) as { user?: SignedInUser };
              if (payload.user) onAuthenticatedRef.current(payload.user);
            } catch {
              // The regular Google sign-in button remains available as a fallback.
            } finally {
              signingInRef.current = false;
            }
          },
        });
        google.accounts.id.prompt();
      } catch {
        // The regular Google sign-in button remains available if One Tap is unavailable.
      }
    }

    void showPrompt();
    return () => {
      cancelled = true;
      getGoogleIdentity()?.accounts.id.cancel();
    };
  }, [enabled]);

  return null;
}
