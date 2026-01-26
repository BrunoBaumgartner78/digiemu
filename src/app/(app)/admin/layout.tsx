import styles from "./adminShell.module.css";
import AdminNav from "./AdminNav";
import { requireAdminOrRedirect } from "@/lib/guards/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminOrRedirect();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Admin Bereich</h1>
          <p className={styles.sub}>Kuratierung, Users, Orders, Payouts, Downloads.</p>
        </div>
      </div>

      <AdminNav />

      <div className={styles.content}>{children}</div>
    </div>
  );
}
