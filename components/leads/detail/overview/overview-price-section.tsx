"use client";

import { Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OverviewInfoItem } from "./overview-info-item";

type OverviewPriceKind = "OFFERING" | "NEGOTIATION" | "CLOSING";

export function OverviewPriceSection(props: {
  lead: any;
  overviewEditing: boolean;
  overviewPrices: Record<OverviewPriceKind, { value: string; date: string }>;
  setOverviewPrices: React.Dispatch<
    React.SetStateAction<
      Record<OverviewPriceKind, { value: string; date: string }>
    >
  >;
  formatCurrencyIDR: (value?: number | string | null) => string;
}) {
  const {
    lead,
    overviewEditing,
    overviewPrices,
    setOverviewPrices,
    formatCurrencyIDR,
  } = props;

  return (
    <div>
      <p className="mb-2 text-sm md:text-lg font-medium text-muted-foreground">
        Informasi Harga
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* ================= PENAWARAN ================= */}
        <OverviewInfoItem icon={Wallet} label="Penawaran">
          {!overviewEditing ? (
            <>
              <div>{formatCurrencyIDR(lead?.priceOffering)}</div>
              <div className="text-[11px] text-muted-foreground">
                {formatPriceDate(lead?.priceOfferingAt)}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Nominal"
                value={overviewPrices.OFFERING.value}
                onChange={(e) =>
                  setOverviewPrices((prev) => ({
                    ...prev,
                    OFFERING: {
                      ...prev.OFFERING,
                      value: formatRupiahInput(e.target.value),
                    },
                  }))
                }
              />
              <Input
                type="datetime-local"
                value={overviewPrices.OFFERING.date}
                onChange={(e) =>
                  setOverviewPrices((prev) => ({
                    ...prev,
                    OFFERING: {
                      ...prev.OFFERING,
                      date: e.target.value,
                    },
                  }))
                }
              />
            </div>
          )}
        </OverviewInfoItem>

        {/* ================= NEGOSIASI ================= */}
        <OverviewInfoItem icon={Wallet} label="Negosiasi">
          {!overviewEditing ? (
            <>
              <div>{formatCurrencyIDR(lead?.priceNegotiation)}</div>
              <div className="text-[11px] text-muted-foreground">
                {formatPriceDate(lead?.priceNegotiationAt)}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Nominal"
                value={overviewPrices.NEGOTIATION.value}
                onChange={(e) =>
                  setOverviewPrices((prev) => ({
                    ...prev,
                    NEGOTIATION: {
                      ...prev.NEGOTIATION,
                      value: formatRupiahInput(e.target.value),
                    },
                  }))
                }
              />
              <Input
                type="datetime-local"
                value={overviewPrices.NEGOTIATION.date}
                onChange={(e) =>
                  setOverviewPrices((prev) => ({
                    ...prev,
                    NEGOTIATION: {
                      ...prev.NEGOTIATION,
                      date: e.target.value,
                    },
                  }))
                }
              />
            </div>
          )}
        </OverviewInfoItem>

        {/* ================= CLOSING ================= */}
        <OverviewInfoItem icon={Wallet} label="Closing">
          {!overviewEditing ? (
            <>
              <div>{formatCurrencyIDR(lead?.priceClosing)}</div>
              <div className="text-[11px] text-muted-foreground">
                {formatPriceDate(lead?.priceClosingAt)}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Nominal"
                value={overviewPrices.CLOSING.value}
                onChange={(e) =>
                  setOverviewPrices((prev) => ({
                    ...prev,
                    CLOSING: {
                      ...prev.CLOSING,
                      value: formatRupiahInput(e.target.value),
                    },
                  }))
                }
              />
              <Input
                type="datetime-local"
                value={overviewPrices.CLOSING.date}
                onChange={(e) =>
                  setOverviewPrices((prev) => ({
                    ...prev,
                    CLOSING: {
                      ...prev.CLOSING,
                      date: e.target.value,
                    },
                  }))
                }
              />
            </div>
          )}
        </OverviewInfoItem>
      </div>
    </div>
  );
}

/* ===== helpers ===== */
function formatPriceDate(iso?: string | null) {
  if (!iso) return "—";

  const d = new Date(iso);

  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRupiahInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
