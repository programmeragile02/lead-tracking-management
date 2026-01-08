"use client";

import { Drawer } from "@/components/ui/drawer";
import useSWR from "swr";

export function CityLeadDrawer({
  city,
  open,
  onClose,
}: {
  city: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useSWR(
    city ? `/api/leads?city=${city}` : null,
    (url) => fetch(url).then((r) => r.json())
  );

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg">Lead dari kota {city}</h3>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Memuat data...</div>
        )}

        {!isLoading && data?.data?.length === 0 && (
          <div className="text-sm text-muted-foreground">Tidak ada lead</div>
        )}

        <div className="space-y-2">
          {data?.data?.map((lead: any) => (
            <div key={lead.id} className="rounded-md border p-3">
              <div className="font-medium">{lead.name}</div>
              <div className="text-sm text-muted-foreground">
                {lead.phone ?? "-"} · {lead.status?.name ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
