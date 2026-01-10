"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type LeadListFilter = {
  source: "pie" | "bar";
  itemType: "status" | "sub_status" | "stage" | "follow_up";
  itemId: number;
  itemName: string;
  salesId?: number;
  salesName?: string;
  period?: string;
};

type LeadItem = {
  id: number;
  name: string;
  phone?: string;
  salesName?: string;
  status?: string;
  subStatus?: string;
  updatedAt: string;
};

export function LeadListModal({
  open,
  onClose,
  filter,
}: {
  open: boolean;
  onClose: () => void;
  filter: LeadListFilter | null;
}) {
  const router = useRouter();

  const query = filter
    ? `/api/reports/leads-by-filter?itemType=${filter.itemType}&itemId=${
        filter.itemId
      }${filter.salesId ? `&salesId=${filter.salesId}` : ""}${
        filter.period ? `&period=${filter.period}` : ""
      }`
    : null;

  const { data, isLoading } = useSWR<{ ok: boolean; data: LeadItem[] }>(
    open && filter ? query : null,
    fetcher
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {filter?.itemName}
          </DialogTitle>

          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {filter?.salesName && (
              <Badge variant="secondary">Sales: {filter.salesName}</Badge>
            )}
            {filter?.period && (
              <Badge variant="outline">Periode: {filter.period}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="mt-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.data?.length ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Tidak ada lead untuk filter ini
            </div>
          ) : (
            <ScrollArea className="h-[420px] pr-2">
              <ul className="space-y-1">
                {data.data.map((lead) => (
                  <li
                    key={lead.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2",
                      "hover:bg-muted"
                    )}
                  >
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {lead.phone ?? "-"}
                      </div>
                    </div>

                    <div className="text-right text-[11px]">
                      {lead.status && (
                        <div className="font-medium">{lead.status}</div>
                      )}
                      {lead.subStatus && (
                        <div className="text-muted-foreground">
                          {lead.subStatus}
                        </div>
                      )}
                      {lead.salesName && (
                        <div className="mt-1 text-muted-foreground">
                          {lead.salesName}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
