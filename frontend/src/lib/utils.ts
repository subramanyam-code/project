import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDate(d?: string, fmt = "MMM d, yyyy") {
  if (!d) return "—";
  try { return format(parseISO(d), fmt); } catch { return d; }
}
export function formatDateTime(d?: string) { return formatDate(d, "MMM d, yyyy h:mm a"); }
export function getInitials(f: string, l: string) { return `${f[0]}${l[0]}`.toUpperCase(); }
export function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

export const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress:  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed:    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  blocked:      "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  on_hold:      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  cancelled:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};
export const PRIORITY_COLORS: Record<string, string> = {
  low:      "bg-slate-100 text-slate-600",
  medium:   "bg-blue-100 text-blue-600",
  high:     "bg-orange-100 text-orange-600",
  critical: "bg-red-100 text-red-600",
};
export function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
