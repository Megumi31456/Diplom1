import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const roles = ["user", "moderator", "admin"] as const;
export type Role = (typeof roles)[number];

export function isAdmin(role?: string | null) {
  return role === "admin";
}

export function isModerator(role?: string | null) {
  return role === "moderator" || role === "admin";
}
