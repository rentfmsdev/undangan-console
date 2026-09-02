import { notFound, redirect } from "next/navigation";
import { getTemplateByCode } from "@/templates/registry";
import { DemoTemplateClient } from "./DemoTemplateClient";

export default async function DemoPage({ params, searchParams }: { params: Promise<{ templateCode: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { templateCode } = await params;
  const query = await searchParams;
  const template = getTemplateByCode(templateCode);
  if (!template) notFound();
  if (query.for !== undefined) redirect(`/demo/${template.code}`);

  return <DemoTemplateClient template={template} />;
}
