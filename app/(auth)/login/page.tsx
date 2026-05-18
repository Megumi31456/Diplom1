import Link from "next/link";
import { signInAction } from "@/app/actions/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_center,#164e63,transparent_30%),#07111f] p-6 text-white">
    <form action={signInAction} className="card w-full max-w-md">
      <h1 className="text-3xl font-black">Вход</h1>
      <p className="mt-2 text-sm text-slate-400">Войдите, чтобы открыть персональную ленту.</p>
      {params.error && <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>}
      {params.message && <p className="mt-4 rounded-2xl bg-cyan-500/10 p-3 text-sm text-cyan-200">{params.message}</p>}
      <div className="mt-6 space-y-3"><input className="input" name="email" placeholder="Email" type="email" required/><input className="input" name="password" placeholder="Пароль" type="password" required/></div>
      <button className="btn-primary mt-5 w-full">Войти</button>
      <p className="mt-5 text-center text-sm text-slate-400">Нет аккаунта? <Link href="/register" className="text-cyan-200">Регистрация</Link></p>
    </form>
  </main>;
}
