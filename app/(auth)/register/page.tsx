import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";

export default async function Register({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_center,#4c1d95,transparent_30%),#07111f] p-6 text-white">
    <form action={signUpAction} className="card w-full max-w-md">
      <h1 className="text-3xl font-black">Регистрация</h1>
      <p className="mt-2 text-sm text-slate-400">Создайте профиль автора.</p>
      {params.error && <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>}
      <div className="mt-6 space-y-3"><input className="input" name="full_name" placeholder="Имя" required/><input className="input" name="email" placeholder="Email" type="email" required/><input className="input" name="password" placeholder="Пароль" type="password" minLength={6} required/></div>
      <button className="btn-primary mt-5 w-full">Создать аккаунт</button>
      <p className="mt-5 text-center text-sm text-slate-400">Уже есть аккаунт? <Link href="/login" className="text-cyan-200">Вход</Link></p>
    </form>
  </main>;
}
