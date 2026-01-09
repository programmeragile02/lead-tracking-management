"use client";

import useSWR from "swr";
import { RoleSlug } from "@/hooks/use-current-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Option = { id: number; name: string };

export function SourceFilters({
  roleSlug,
  teamLeaderId,
  salesId,
  from,
  to,
  onChange,
}: {
  roleSlug: RoleSlug;
  teamLeaderId: string;
  salesId: string;
  from: string;
  to: string;
  onChange: (
    v: Partial<{
      teamLeaderId: string;
      salesId: string;
      from: string;
      to: string;
    }>
  ) => void;
}) {
  // MANAGER → boleh lihat TL
  const { data: tlRes } = useSWR(
    roleSlug === "manager" ? "/api/users/team-leaders" : null,
    fetcher
  );

  // TEAM LEADER & MANAGER → boleh lihat sales
  const { data: salesRes } = useSWR(
    roleSlug !== "sales"
      ? `/api/users/sales${
          roleSlug === "manager" && teamLeaderId !== "ALL"
            ? `?teamLeaderId=${teamLeaderId}`
            : ""
        }`
      : null,
    fetcher
  );

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* FROM DATE */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="from-date" className="text-xs">
          Dari tanggal
        </Label>
        <Input
          id="from-date"
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value })}
          className="w-40"
        />
      </div>

      {/* TO DATE */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="to-date" className="text-xs">
          Sampai tanggal
        </Label>
        <Input
          id="to-date"
          type="date"
          value={to}
          onChange={(e) => onChange({ to: e.target.value })}
          className="w-40"
        />
      </div>

      {/* TEAM LEADER (MANAGER ONLY) */}
      {roleSlug === "manager" && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Team Leader</Label>
          <Select
            value={teamLeaderId}
            onValueChange={(v) =>
              onChange({
                teamLeaderId: v,
                salesId: "ALL",
              })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Team Leader" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Team Leader</SelectItem>
              {tlRes?.data?.map((tl: Option) => (
                <SelectItem key={tl.id} value={String(tl.id)}>
                  {tl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* SALES (TEAM LEADER & MANAGER) */}
      {roleSlug !== "sales" && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Sales</Label>
          <Select
            value={salesId}
            onValueChange={(v) => onChange({ salesId: v })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Sales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sales</SelectItem>
              {salesRes?.data?.map((s: Option) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
