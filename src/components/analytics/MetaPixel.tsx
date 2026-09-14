"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushMetaPixelEvents, trackMetaPixel } from "@/lib/meta-pixel";

export function MetaPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const pathname = usePathname();
  const isInitialPageView = useRef(true);

  useEffect(() => {
    fetch("/api/settings/public", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const configuredPixelId = typeof payload?.analytics?.metaPixelId === "string" ? payload.analytics.metaPixelId : null;
        document.documentElement.dataset.metaPixelId = configuredPixelId ?? "";
        setPixelId(configuredPixelId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isInitialPageView.current) {
      isInitialPageView.current = false;
      return;
    }

    trackMetaPixel("PageView");
  }, [pathname]);

  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" onReady={flushMetaPixelEvents}>{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}</Script>
      <noscript>
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
