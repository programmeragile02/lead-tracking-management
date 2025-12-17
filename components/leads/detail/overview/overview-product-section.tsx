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
  } = props;

  return (
    <div>
      <p className="mb-2 text-sm md:text-lg font-medium text-muted-foreground">
        Informasi Produk
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
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

        <OverviewInfoItem icon={Activity} label="Status">
          {lead?.status?.name || "-"}
        </OverviewInfoItem>
      </div>
    </div>
  );
}
