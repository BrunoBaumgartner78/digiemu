import styles from "./VendorPayoutList.module.css";

export default function VendorPayoutList({ payouts, sales }) {
  const outstanding = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + p.amountCents, 0);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Auszahlungen</h1>

      <div className={styles.statCard}>
        <h2>Ausstehend</h2>
        <p className={styles.amount}>
          CHF {(outstanding / 100).toFixed(2)}
        </p>
      </div>

      <h2 className={styles.section}>Letzte Verkäufe</h2>
      <ul className={styles.salesList}>
        {sales.map((sale) => (
          <li key={sale.id} className={styles.saleItem}>
            <span>{sale.product.title}</span>
            <span>CHF {(sale.amountCents / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <h2 className={styles.section}>Payout History</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Betrag</th>
            <th>Status</th>
            <th>Datum</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td>CHF {(p.amountCents / 100).toFixed(2)}</td>
              <td>{p.status}</td>
              <td>{new Date(p.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
