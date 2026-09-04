import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/auth/service";
import { MyInvitationsDashboard } from "@/components/invitations/MyInvitationsDashboard";

export default async function MyInvitationsPage() {
  if (!await getSessionUser()) redirect("/login?returnTo=%2Fundangan-saya");
  return <MyInvitationsDashboard />;
}
