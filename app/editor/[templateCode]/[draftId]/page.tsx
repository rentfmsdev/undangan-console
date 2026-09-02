import { notFound } from "next/navigation";
import { ConsoleWorkspace } from "@/builder/editor/ConsoleWorkspace";
import { getTemplateByCode, getTemplateById, getTemplateCatalogItem } from "@/templates/registry";

export default async function DraftEditorPage({ params }: { params: Promise<{ templateCode: string; draftId: string }> }) {
  const { templateCode, draftId } = await params;
  const template = getTemplateByCode(templateCode) ?? getTemplateById(templateCode);
  if (!template) notFound();
  const templatePrice = getTemplateCatalogItem(template.code)?.price ?? template.price ?? 0;
  return <ConsoleWorkspace template={template} templatePrice={templatePrice} requestedDraftId={draftId} />;
}
