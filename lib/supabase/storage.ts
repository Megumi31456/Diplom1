const IMAGES_BUCKET = "images";

const EXTENSIONS_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function getUploadedImage(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getImageExtension(file: File) {
  const extensionFromMime = EXTENSIONS_BY_MIME[file.type];
  if (extensionFromMime) return extensionFromMime;

  const extensionFromName = file.name.split(".").pop()?.toLowerCase();
  if (extensionFromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(extensionFromName)) {
    return extensionFromName === "jpeg" ? "jpg" : extensionFromName;
  }

  return null;
}

type UploadRules = {
  maxUploadMb: number;
  allowedFormats: string[];
};

export async function uploadImageToBucket(
  supabase: any,
  file: File,
  folder: string,
  rules: UploadRules = { maxUploadMb: 20, allowedFormats: ["jpg", "jpeg", "png", "webp", "gif"] },
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Загрузить можно только изображение: JPG, PNG, WEBP или GIF.");
  }

  const maxUploadMb = Math.max(1, Number(rules.maxUploadMb) || 20);
  if (file.size > maxUploadMb * 1024 * 1024) {
    throw new Error(`Размер изображения не должен превышать ${maxUploadMb} МБ.`);
  }

  const extension = getImageExtension(file);
  if (!extension) {
    throw new Error("Неподдерживаемый формат изображения. Используйте JPG, PNG, WEBP или GIF.");
  }

  const allowedFormats = new Set(
    rules.allowedFormats.map((item) => item.trim().toLowerCase().replace(/^\./, "")).map((item) => item === "jpeg" ? "jpg" : item),
  );
  if (!allowedFormats.has(extension)) {
    throw new Error(`Формат .${extension} запрещён настройками платформы.`);
  }

  const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
  const filePath = `${normalizedFolder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
