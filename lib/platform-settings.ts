export type ContentRules = {
  max_upload_mb: number;
  allowed_formats: string[];
  auto_hide_report_threshold: number;
  publication_premoderation: boolean;
};

export const DEFAULT_CONTENT_RULES: ContentRules = {
  max_upload_mb: 20,
  allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "pdf", "txt"],
  auto_hide_report_threshold: 3,
  publication_premoderation: false,
};

function positiveNumber(value: unknown, fallback: number, min = 1, max = 1024) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function normalizeFormats(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_CONTENT_RULES.allowed_formats;
  const formats = value
    .map((item) => String(item).trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);
  return formats.length ? Array.from(new Set(formats)) : DEFAULT_CONTENT_RULES.allowed_formats;
}

export function normalizeContentRules(value: unknown): ContentRules {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    max_upload_mb: positiveNumber(source.max_upload_mb, DEFAULT_CONTENT_RULES.max_upload_mb, 1, 500),
    allowed_formats: normalizeFormats(source.allowed_formats),
    auto_hide_report_threshold: positiveNumber(
      source.auto_hide_report_threshold,
      DEFAULT_CONTENT_RULES.auto_hide_report_threshold,
      1,
      100,
    ),
    publication_premoderation:
      typeof source.publication_premoderation === "boolean"
        ? source.publication_premoderation
        : DEFAULT_CONTENT_RULES.publication_premoderation,
  };
}

export async function getContentRules(supabase: any): Promise<ContentRules> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "content_rules")
    .maybeSingle();

  if (error) {
    console.error("Unable to read platform content rules:", error.message);
    return DEFAULT_CONTENT_RULES;
  }

  return normalizeContentRules(data?.value);
}
