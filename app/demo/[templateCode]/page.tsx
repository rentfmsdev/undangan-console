import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTemplateByCodeOrId, getTemplateCatalogItem } from "@/templates/registry";
import { DemoTemplateClient } from "./DemoTemplateClient";

async function getPublicOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? process.env.NEXT_PUBLIC_APP_DOMAIN ?? "undangan.co";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateCode: string }>;
}): Promise<Metadata> {
  const { templateCode } = await params;
  const template = getTemplateByCodeOrId(templateCode);
  if (!template) {
    return {
      title: "Demo Template Tidak Ditemukan | Undangan Studio",
      robots: { index: false, follow: false },
    };
  }

  const catalogItem = getTemplateCatalogItem(template.id) || getTemplateCatalogItem(template.code);
  const origin = await getPublicOrigin();
  const canonical = `${origin}/demo/${template.code}`;
  const rawCover = catalogItem?.covers?.[0] ?? "/thumb/khitan-1.png";
  const coverImage = rawCover.startsWith("http") ? rawCover : `${origin}${rawCover.startsWith("/") ? "" : "/"}${rawCover}`;
  const categoryLabel = catalogItem?.categoryLabel ?? template.category;

  const title = `Demo ${template.name} - Undangan Digital ${categoryLabel} | Undangan Studio`;
  const description = `Lihat preview interaktif template undangan digital "${template.name}". ${template.description}`;
  const tags = catalogItem?.tags ?? ["undangan digital", "template undangan", template.name];

  return {
    title,
    description,
    keywords: tags,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: canonical,
      title,
      description,
      siteName: "Undangan Studio",
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: `Demo ${template.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverImage],
    },
  };
}

export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { templateCode } = await params;
  const query = await searchParams;
  const template = getTemplateByCodeOrId(templateCode);
  if (!template) notFound();

  if (query.for !== undefined) redirect(`/demo/${encodeURIComponent(templateCode)}`);

  const catalogItem = getTemplateCatalogItem(template.id) || getTemplateCatalogItem(template.code);
  const defaultView = catalogItem?.defaultView ?? template.defaultView ?? "mobile";
  const queryView = query.view === "desktop" || query.view === "mobile" ? query.view : undefined;
  const initialView = queryView ?? defaultView;

  const origin = await getPublicOrigin();
  const canonical = `${origin}/demo/${template.code}`;
  const rawCover = catalogItem?.covers?.[0] ?? "/thumb/khitan-1.png";
  const coverImage = rawCover.startsWith("http") ? rawCover : `${origin}${rawCover.startsWith("/") ? "" : "/"}${rawCover}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Template Undangan ${template.name}`,
    description: template.description,
    image: coverImage,
    url: canonical,
    offers: {
      "@type": "Offer",
      price: catalogItem?.price ?? template.price ?? 35000,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DemoTemplateClient template={template} defaultView={initialView} />
    </>
  );
}
