import { requireAdmin } from "@/lib/auth";
import { updateSettingsAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("platform_settings").select("value").eq("key", "content_rules").maybeSingle();
  const value = (data?.value ?? {}) as any;

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-black">Системные настройки</h1>
      <p className="mt-2 text-slate-400">Демонстрационный экран управления правилами публикаций и загрузок без изменения кода.</p>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
      <form action={updateSettingsAction} className="card mt-8 space-y-4">
        <label className="block"><span className="text-sm text-slate-400">Максимальный размер файла, МБ</span><input className="input mt-2" type="number" name="max_upload_mb" defaultValue={value.max_upload_mb ?? 20} /></label>
        <label className="block"><span className="text-sm text-slate-400">Допустимые форматы через запятую</span><input className="input mt-2" name="allowed_formats" defaultValue={(value.allowed_formats ?? ["jpg","png","gif","mp4","pdf","txt"]).join(", ")} /></label>
        <label className="block"><span className="text-sm text-slate-400">Порог жалоб для скрытия</span><input className="input mt-2" type="number" name="auto_hide_report_threshold" defaultValue={value.auto_hide_report_threshold ?? 5} /></label>
        <label className="flex items-center gap-2 rounded-2xl bg-white/5 p-4 text-sm"><input type="checkbox" name="publication_premoderation" defaultChecked={value.publication_premoderation ?? true} /> Премодерация публичных публикаций</label>
        <button className="btn-primary">Сохранить настройки</button>
      </form>
    </div>
  );
}
