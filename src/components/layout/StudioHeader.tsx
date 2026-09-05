"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAuthDropdown, type AuthUser } from "@/components/auth/UserAuthDropdown";

type StudioHeaderProps = {
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogout?: () => void;
};

export function StudioHeader({ user, onLoginClick, onLogout }: StudioHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3" aria-label="Kembali ke beranda Undangan Studio">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl transition group-hover:scale-105">
            <Image src="/assets/fav.png" width={40} height={40} alt="" className="h-full w-full object-cover" priority />
          </div>
          <div>
            <span className="block text-base font-extrabold leading-tight text-slate-900">Undangan Studio</span>
            <span className="block text-[11px] font-semibold text-slate-500">Marketplace & Builder</span>
          </div>
        </Link>

        <UserAuthDropdown
          user={user}
          onLoginClick={onLoginClick}
          onLogout={onLogout}
          onMyInvitationsClick={() => router.push("/undangan-saya")}
        />
      </div>
    </header>
  );
}
