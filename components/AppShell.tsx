import Link from "next/link";
import { ReactNode } from "react";
import { Bell, Compass, FolderHeart, LayoutDashboard, MessageCircle, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { isAdmin, isModerator } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import styles from "@/styles/app-shell.module.css";

export function AppShell({ children, role, name, unreadNotifications = 0, unreadMessages = 0 }: { children: ReactNode; role?: string | null; name?: string | null; unreadNotifications?: number; unreadMessages?: number }) {
  const nav = [
    ["/app", "Лента", Compass, 0], ["/app/search", "Поиск", Search, 0], ["/app/collections", "Коллекции", FolderHeart, 0],
    ["/app/notifications", "Уведомления", Bell, unreadNotifications], ["/app/messages", "Сообщения", MessageCircle, unreadMessages], ["/app/profile", "Профиль", Users, 0],
  ] as const;

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link href="/app" className={styles.brand}><span className={styles.logo}><Sparkles /></span>Creatoria</Link>
      <div className={styles.nav}>
        {nav.map(([href, label, Icon, unread]) => <Link key={href} href={href} className={styles.navLink}><span className={styles.navIcon}><Icon size={18}/>{unread > 0 && <span className={styles.unreadDot} aria-label={`Непрочитанных: ${unread}`} />}</span>{label}</Link>)}
        {isModerator(role) && <Link href="/moderator" className={`${styles.navLink} ${styles.moderator}`}><ShieldCheck size={18}/>Модерация</Link>}
        {isAdmin(role) && <Link href="/admin" className={`${styles.navLink} ${styles.admin}`}><LayoutDashboard size={18}/>Админ-панель</Link>}
      </div>
      <div className={styles.account}>
        <p className={styles.accountName}>{name || "Пользователь"}</p>
        <p className={styles.role}>Роль: {role || "user"}</p>
        <form action={signOutAction} className={styles.logoutForm}><button className={styles.logout}>Выйти</button></form>
      </div>
    </aside>
    <main className={styles.main}><div className={styles.mainInner}>{children}</div></main>
  </div>;
}
