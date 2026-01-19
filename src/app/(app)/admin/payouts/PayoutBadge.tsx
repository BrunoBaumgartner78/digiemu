import styles from "../../dashboard/payouts/Payouts.module.css";

type Status = "PENDING" | "PAID";

const STATUS_UI: Record<Status, { label: string; className: string }> = {
  PENDING: { label: "PENDING", className: styles.badgePending },
  PAID: { label: "PAID", className: styles.badgePaid },
};

export function PayoutBadge({ status }: { status: Status }) {
  const ui = STATUS_UI[status];
  return <span className={`${styles.badge} ${ui.className}`}>{ui.label}</span>;
}

export default PayoutBadge;
