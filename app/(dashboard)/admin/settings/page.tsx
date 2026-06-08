import { requireAdmin } from "@/lib/auth";
import { updateSettingsAction } from "@/app/actions/admin";
import { normalizeContentRules } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("platform_settings").select("value").eq("key", "content_rules").maybeSingle();
  const value = normalizeContentRules(data?.value);

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-black">Системные настройки</h1>
      <p className="mt-2 text-slate-400">Эти правила применяются к загрузке изображений, публикации работ и автоматической обработке жалоб.</p>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
      <form action={updateSettingsAction} className="card mt-8 space-y-4">
        <label className="block"><span className="text-sm text-slate-400">Максимальный размер файла, МБ</span><input className="input mt-2" type="number" name="max_upload_mb" min={1} max={500} defaultValue={value.max_upload_mb} /></label>
        <label className="block"><span className="text-sm text-slate-400">Допустимые форматы через запятую</span><input className="input mt-2" name="allowed_formats" defaultValue={value.allowed_formats.join(", ")} /></label>
        <label className="block"><span className="text-sm text-slate-400">Порог одобренных жалоб для удаления</span><input className="input mt-2" type="number" name="auto_hide_report_threshold" min={1} max={100} defaultValue={value.auto_hide_report_threshold} /></label>
        <label className="flex items-center gap-2 rounded-2xl bg-white/5 p-4 text-sm"><input type="checkbox" name="publication_premoderation" defaultChecked={value.publication_premoderation} /> Премодерация публичных публикаций</label>
        <button className="btn-primary">Сохранить настройки</button>
      </form>
    </div>
  );
}
