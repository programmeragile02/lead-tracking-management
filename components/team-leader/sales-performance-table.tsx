"use client";

type SalesPerformanceRow = {
  salesId: number;
  salesName: string;
  leadTarget: number;
  leadActual: number;
  revenueTarget: number;
  revenueActual: number;
  closingCount: number;
};

interface SalesPerformanceTableProps {
  rows: SalesPerformanceRow[];
  loading?: boolean;
}

function percent(target: number, actual: number) {
  if (!target || target <= 0) return 0;
  return Math.round((actual / target) * 100);
}

function formatRupiah(value: number) {
  if (!value || value <= 0) return "Rp0";

  return value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function SalesPerformanceTable({
  rows,
  loading,
}: SalesPerformanceTableProps) {
  if (loading) {
    return (
      <div className="bg-secondary rounded-2xl shadow-sm border p-4 text-sm text-muted-foreground">
        Memuat performa sales...
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-secondary rounded-2xl shadow-sm border p-6 text-sm text-muted-foreground">
        Belum ada data sales di tim ini
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-2xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/70">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-foreground">
                Sales
              </th>
              <th className="text-left p-4 text-xs font-semibold text-foreground">
                Lead
              </th>
              <th className="text-left p-4 text-xs font-semibold text-foreground">
                Pendapatan
              </th>
              <th className="text-left p-4 text-xs font-semibold text-foreground">
                Closing
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const leadPct = percent(row.leadTarget, row.leadActual);
              const revPct = percent(row.revenueTarget, row.revenueActual);

              return (
                <tr key={row.salesId}>
                  <td className="p-4 align-top">
                    <p className="font-medium text-sm text-foreground">
                      {row.salesName}
                    </p>
                  </td>

                  {/* Lead target */}
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        {row.leadActual} / {row.leadTarget} lead
                      </p>
                      <div className="h-2 bg-muted rounded-full w-28">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(leadPct, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Revenue target */}
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        {formatRupiah(row.revenueActual)} /{" "}
                        {formatRupiah(row.revenueTarget)}
                      </p>
                      <div className="h-2 bg-muted rounded-full w-28">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(revPct, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="p-4 align-top">
                    <p className="font-medium text-sm text-muted-foreground">
                      {row.closingCount}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
