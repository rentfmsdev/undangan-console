export type DatePreset =
  | "all"
  | "today"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "custom";

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Checks if a given date string or Date object falls within [startDate, endDate] inclusive.
 * Handles dates in local timezone boundaries:
 * startDate starts at 00:00:00.000, endDate ends at 23:59:59.999.
 */
export function isDateInRange(
  date?: string | Date | null,
  startDate?: string | null,
  endDate?: string | null
): boolean {
  if (!startDate && !endDate) return true;
  if (!date) return false;

  const itemDate = date instanceof Date ? date : new Date(date);
  if (isNaN(itemDate.getTime())) return false;

  if (startDate) {
    const [sY, sM, sD] = startDate.split("-").map(Number);
    if (sY && sM && sD) {
      const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      if (itemDate < start) return false;
    }
  }

  if (endDate) {
    const [eY, eM, eD] = endDate.split("-").map(Number);
    if (eY && eM && eD) {
      const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      if (itemDate > end) return false;
    }
  }

  return true;
}

export function getPresetDateRange(preset: DatePreset): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  if (preset === "today") {
    const today = toISODateString(now);
    return { startDate: today, endDate: today };
  }
  if (preset === "7d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { startDate: toISODateString(start), endDate: toISODateString(now) };
  }
  if (preset === "30d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    return { startDate: toISODateString(start), endDate: toISODateString(now) };
  }
  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: toISODateString(start), endDate: toISODateString(now) };
  }
  if (preset === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: toISODateString(start), endDate: toISODateString(end) };
  }
  return { startDate: "", endDate: "" };
}

export function formatDateLabel(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(dateObj);
  } catch {
    return dateStr;
  }
}
