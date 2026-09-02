import { notFound, redirect } from "next/navigation";
import { ConsoleWorkspace } from "@/builder/editor/ConsoleWorkspace";
import { getTemplateByCode, getTemplateById, getTemplateCatalogItem } from "@/templates/registry";
import { getDraftAccess } from "@/modules/drafts/access";

export default async function DraftEditorPage({
  params,
}: {
  params: Promise<{ templateCode: string; draftId: string }>;
}) {
  const { templateCode, draftId } = await params;
  const template = getTemplateByCode(templateCode) ?? getTemplateById(templateCode);
  if (!template) notFound();

  // Server-side Access & Authorization Guard
  const access = await getDraftAccess(draftId);

  // If this draft exists and belongs to a user in database
  if (access.draft && access.draft.userId) {
    if (!access.user) {
      // Must login to access this registered draft
      redirect(`/api/auth/google?returnTo=${encodeURIComponent(`/editor/${template.code}/${draftId}`)}`);
    }

    if (!access.authorized) {
      // User is logged in but is NOT the owner or an invited collaborator
      redirect(`/?unauthorized=1`);
    }
  }

  const templatePrice = getTemplateCatalogItem(template.code)?.price ?? template.price ?? 0;
  return <ConsoleWorkspace template={template} templatePrice={templatePrice} requestedDraftId={draftId} />;
}
