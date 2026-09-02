import TemplatePreviewClient from "./TemplatePreviewClient";

export default async function TemplatePreviewPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const params = await searchParams;
  return <TemplatePreviewClient templateCode={params.template ?? "hjydg"} />;
}
