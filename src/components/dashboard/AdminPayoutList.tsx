"use client";
import styles from "./AdminPayoutList.module.css";

type Payout = {
  id: string;
  vendor: { email: string };
  amountCents: number;
  status: "PENDING" | "PAID";
  createdAt: string | Date;
};

type Props = {
  payouts: Payout[];
};

export default function AdminPayoutList({ payouts }: Props) {
  async function markPaid(id: string) {
    await fetch("/api/admin/payouts/markPaid", {
      method: "POST",
      body: JSON.stringify({ id })
    });
    location.reload();
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Admin – Auszahlungen</h1>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Betrag</th>
            <th>Status</th>
            <th>Datum</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td>{p.vendor.email}</td>
              <td>CHF {(p.amountCents / 100).toFixed(2)}</td>
              <td>{p.status}</td>
              <td>{new Date(p.createdAt).toLocaleString()}</td>
              <td>
                {p.status === "PENDING" && (
                  <button
                    className={styles.payBtn}
                    onClick={() => markPaid(p.id)}
                  >
                    Als bezahlt markieren
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
