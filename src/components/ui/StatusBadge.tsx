import type { ReactNode } from "react";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClass: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
};

export function StatusBadge({ tone = "neutral", icon, children, className = "", title }: { tone?: StatusTone; icon?: ReactNode; children: ReactNode; className?: string; title?: string }) {
  return <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${toneClass[tone]} ${className}`}>{icon}{children}</span>;
}
