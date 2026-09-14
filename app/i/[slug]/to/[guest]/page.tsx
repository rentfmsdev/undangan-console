import type { Metadata } from "next";
import PublishedInvitationPage, {
  generateMetadata as generateInvitationMetadata,
} from "../../page";

function decodeGuestName(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).trim();
  } catch {
    return value.replace(/\+/g, " ").trim();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; guest: string }>;
}): Promise<Metadata> {
  const { slug, guest } = await params;
  return generateInvitationMetadata({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve({ for: decodeGuestName(guest) }),
  });
}

export default async function PersonalInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; guest: string }>;
}) {
  const { slug, guest } = await params;
  return (
    <PublishedInvitationPage
      params={Promise.resolve({ slug })}
      searchParams={Promise.resolve({ for: decodeGuestName(guest) })}
    />
  );
}
