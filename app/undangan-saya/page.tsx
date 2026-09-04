import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/auth/service";
import { MyInvitationsDashboard } from "@/components/invitations/MyInvitationsDashboard";

export default async function MyInvitationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?returnTo=%2Fundangan-saya");
  return <MyInvitationsDashboard initialUser={user} />;
}
