"use client";

import { Wallet } from "lucide-react";
import { OverviewInfoItem } from "./overview-info-item";

export function OverviewPriceSection(props: {
  lead: any;
  formatCurrencyIDR: (value?: number | string | null) => string;
}) {
  const { lead, formatCurrencyIDR } = props;

  return (
    <div>
      <p className="mb-2 text-sm md:text-lg font-medium text-muted-foreground">
        Informasi Harga
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <OverviewInfoItem icon={Wallet} label="Penawaran">
          {formatCurrencyIDR(lead?.priceOffering)}
        </OverviewInfoItem>

        <OverviewInfoItem icon={Wallet} label="Negosiasi">
          {formatCurrencyIDR(lead?.priceNegotiation)}
        </OverviewInfoItem>

        <OverviewInfoItem icon={Wallet} label="Closing">
          {formatCurrencyIDR(lead?.priceClosing)}
        </OverviewInfoItem>
      </div>
    </div>
  );
}
