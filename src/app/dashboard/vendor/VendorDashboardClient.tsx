"use client";

import VendorPayoutTable from "./VendorPayoutTable.client";
import type { VendorPayoutRow } from "./types";

type Props = {
  payouts: VendorPayoutRow[];
};

export default function VendorDashboardClient({ payouts }: Props) {
  return (
    <>
      {/* hier bleibt dein restliches Vendor Dashboard UI wie gehabt */}
      <div className="mt-8">
        <VendorPayoutTable payouts={payouts} />
      </div>
    </>
  );
}
