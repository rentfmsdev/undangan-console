"use client";

import { useState } from "react";

type RootsAvatarProps = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  className?: string;
  fallbackClassName?: string;
  fallbackLabel?: string;
};

export function RootsAvatar({
  userId,
  name,
  avatarUrl,
  className = "h-full w-full object-cover",
  fallbackClassName = "text-slate-400",
  fallbackLabel = "U",
}: RootsAvatarProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || fallbackLabel;

  if (!avatarUrl || hasLoadError) {
    return <div className={`grid h-full w-full place-items-center font-bold text-xs ${fallbackClassName}`}>{initial}</div>;
  }

  return (
    <img
      src={`/api/roots/avatar/${encodeURIComponent(userId)}`}
      alt={name}
      className={className}
      onError={() => setHasLoadError(true)}
    />
  );
}
