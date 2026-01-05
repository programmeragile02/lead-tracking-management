"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { OverviewInfoItem } from "./overview-info-item";
import { Activity, Package } from "lucide-react";

export function OverviewProductSection(props: {
  overviewEditing: boolean;
  lead: any;

  displayProductName: string;
  products: { id: number; name: string }[];

  updatingProduct: boolean;
  detailLoading: boolean;

  overviewProductId: string;
  setOverviewProductId: (v: string) => void;

  statuses: {
    id: number;
    name: string;
    subStatuses?: { id: number; name: string }[];
  }[];

  overviewStatusId: number | null;
  setOverviewStatusId: (v: number | null) => void;

  overviewSubStatusId: number | null;
  setOverviewSubStatusId: (v: number | null) => void;
}) {
  const {
    overviewEditing,
    lead,
    displayProductName,
    products,
    updatingProduct,
    detailLoading,
    overviewProductId,
    setOverviewProductId,

    statuses,
    overviewStatusId,
    setOverviewStatusId,
    overviewSubStatusId,
    setOverviewSubStatusId,
  } = props;

  const activeSubStatuses =
    statuses.find((s) => s.id === overviewStatusId)?.subStatuses ?? [];

  return (
    <div>
      <p className="mb-2 text-sm md:text-lg font-medium text-muted-foreground">
        Informasi Produk
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <OverviewInfoItem icon={Package} label="Produk">
          {overviewEditing ? (
            <Select
              value={overviewProductId}
              onValueChange={setOverviewProductId}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            displayProductName
          )}
        </OverviewInfoItem>

        {/* STATUS */}
        <OverviewInfoItem icon={Activity} label="Status">
          {overviewEditing ? (
            <Select
              value={overviewStatusId ? String(overviewStatusId) : ""}
              onValueChange={(v) => {
                const next = Number(v);
                setOverviewStatusId(next);
                setOverviewSubStatusId(null); // reset sub status
              }}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            lead?.status?.name || "-"
          )}
        </OverviewInfoItem>

        {/* SUB STATUS */}
        <OverviewInfoItem icon={Activity} label="Sub Status">
          {overviewEditing ? (
            <Select
              value={overviewSubStatusId ? String(overviewSubStatusId) : ""}
              onValueChange={(v) => setOverviewSubStatusId(Number(v))}
              disabled={!overviewStatusId}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Pilih sub status" />
              </SelectTrigger>
              <SelectContent>
                {activeSubStatuses.map((ss) => (
                  <SelectItem key={ss.id} value={String(ss.id)}>
                    {ss.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : lead?.subStatus ? (
            lead.subStatus.name
          ) : (
            "-"
          )}
        </OverviewInfoItem>
      </div>
    </div>
  );
}
