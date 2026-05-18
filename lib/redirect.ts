import { redirect } from "next/navigation";

export function redirectWithParams(path: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value).length > 0) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  redirect(query ? `${path}?${query}` : path);
}
