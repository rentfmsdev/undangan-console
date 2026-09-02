import { notFound, redirect } from "next/navigation";
import { getTemplateByCode } from "@/templates/registry";

export default async function TemplateConsolePage({ params }: { params: Promise<{ templateCode: string }> }) {
  const { templateCode } = await params;
  const template = getTemplateByCode(templateCode);

  if (!template) notFound();

  redirect(`/editor/${template.code}`);
}
