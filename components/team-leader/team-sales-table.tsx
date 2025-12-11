"use client";

import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flame, MessageCircle, Phone } from "lucide-react";

type TeamSalesTableProps = {
  members: TeamMember[];
  periodLabel: string;
};

type TeamMember = {
  salesId: number;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  createdAt: string;

  leadTarget: number;
  closingTarget: number;
  leadsPeriod: number;
  leadsLifetime: number;
  closingPeriod: number;
  revenuePeriod: number;

  fuDoneToday: number;
  fuScheduledToday: number;
  fuOverdue: number;

  overdueLeadCount: number;
  hotNotClosedCount: number;
  untouchedLeadCount: number;

  waStatus: string | null;
  waPhoneNumber: string | null;
};

function percent(target: number, actual: number) {
  if (!target || target <= 0) return 0;
  return Math.round((actual / target) * 100);
}

function formatRupiah(value: number) {
  if (!value) return "Rp0";
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatDateShort(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapWaStatusLabel(status: string | null) {
  if (!status) return { label: "Belum terhubung", variant: "outline" as const };
  if (status === "CONNECTED")
    return { label: "WA Terhubung", variant: "success" as const };
  if (status === "PENDING_QR")
    return { label: "Menunggu scan QR", variant: "secondary" as const };
  if (status === "DISCONNECTED")
    return { label: "Terputus", variant: "destructive" as const };
  if (status === "ERROR")
    return { label: "Error", variant: "destructive" as const };
  return { label: status, variant: "outline" as const };
}

export function TeamSalesTable({ members, periodLabel }: TeamSalesTableProps) {
  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6 text-sm text-gray-500">
        Belum ada anggota tim yang terdaftar di bawah Anda.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/70">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-gray-600">
                Sales
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600">
                Lead (periode)
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600">
                Closing & Revenue
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600">
                Aktivitas Hari Ini
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-600">
                Lead Bermasalah
              </th>
              <th className="text-right p-4 text-xs font-semibold text-gray-600">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => {
              const leadPct = percent(m.leadTarget, m.leadsPeriod);
              const revPct = percent(m.closingTarget, m.revenuePeriod);
              const wa = mapWaStatusLabel(m.waStatus);

              return (
                <tr key={m.salesId}>
                  {/* Sales info */}
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-3">
                      {m.photo ? (
                        <Image
                          src={m.photo}
                          alt={m.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-semibold text-red-700">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-[11px] text-gray-500">{m.email}</p>
                        <p className="text-[11px] text-gray-500">
                          Bergabung: {formatDateShort(m.createdAt)}
                        </p>
                        <Badge
                          variant={wa.variant}
                          className="mt-1 text-[10px] px-2 py-0.5"
                        >
                          {wa.label}
                        </Badge>
                      </div>
                    </div>
                  </td>

                  {/* Lead periode */}
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-700">
                        {m.leadsPeriod} / {m.leadTarget} lead
                      </p>
                      <div className="h-2 bg-muted rounded-full w-28">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            leadPct >= 100 ? "bg-green-500" : "bg-red-500"
                          )}
                          style={{
                            width: `${Math.min(leadPct, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Total lifetime: {m.leadsLifetime} lead
                      </p>
                    </div>
                  </td>

                  {/* Closing & revenue */}
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-700">
                        Closing: {m.closingPeriod} deal
                      </p>
                      <p className="text-gray-700">
                        Revenue: {formatRupiah(m.revenuePeriod)}
                      </p>
                      <div className="h-2 bg-muted rounded-full w-28">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            revPct >= 100 ? "bg-green-500" : "bg-orange-500"
                          )}
                          style={{
                            width: `${Math.min(revPct, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Target monthly: {formatRupiah(m.closingTarget)}
                      </p>
                    </div>
                  </td>

                  {/* Aktivitas hari ini */}
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-700">
                        FU selesai:{" "}
                        <span className="font-semibold">{m.fuDoneToday}</span>
                      </p>
                      <p className="text-gray-700">
                        FU terjadwal hari ini:{" "}
                        <span className="font-semibold">
                          {m.fuScheduledToday}
                        </span>
                      </p>
                      <p className="text-gray-700">
                        FU terlambat:{" "}
                        <span className="font-semibold text-red-600">
                          {m.fuOverdue}
                        </span>
                      </p>
                    </div>
                  </td>

                  {/* Problem leads */}
                  <td className="p-4 align-top">
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-700">
                        Overdue:{" "}
                        <span className="font-semibold text-red-600">
                          {m.overdueLeadCount}
                        </span>
                      </p>
                      <p className="text-gray-700">
                        Hot belum closing:{" "}
                        <span className="font-semibold text-amber-600">
                          {m.hotNotClosedCount}
                        </span>
                      </p>
                      <p className="text-gray-700">
                        Belum di-FU:{" "}
                        <span className="font-semibold text-gray-700">
                          {m.untouchedLeadCount}
                        </span>
                      </p>
                    </div>
                  </td>

                  {/* Aksi */}
                  <td className="p-4 align-top text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs rounded-xl"
                        >
                          Detail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md p-0 overflow-hidden">
                        {/* Header aksesibilitas untuk screen reader */}
                        <DialogHeader className="sr-only">
                          <DialogTitle>Detail Sales — {m.name}</DialogTitle>
                        </DialogHeader>

                        {/* HEADER BERWARNA */}
                        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-4 text-white">
                          <div className="flex items-center gap-3">
                            {m.photo ? (
                              <Image
                                src={m.photo}
                                alt={m.name}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-white/70 object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <h2 className="text-sm font-semibold leading-tight">
                                {m.name}
                              </h2>
                              <p className="text-xs text-white/80 truncate">
                                {m.email}
                              </p>
                              {m.phone && (
                                <p className="text-xs text-white/80 truncate">
                                  {m.phone}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] text-white/70">
                                Bergabung
                              </p>
                              <p className="text-xs font-medium">
                                {formatDateShort(m.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {/* status WA */}
                            {(() => {
                              const wa = mapWaStatusLabel(m.waStatus);
                              return (
                                <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px]">
                                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-300" />
                                  {wa.label}
                                </span>
                              );
                            })()}
                            {m.waPhoneNumber && (
                              <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px]">
                                <Phone className="h-3 w-3 mr-1" />
                                {m.waPhoneNumber}
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px]">
                              Periode: {periodLabel}
                            </span>
                          </div>
                        </div>

                        {/* BODY */}
                        <div className="px-5 py-4 space-y-4 bg-slate-50 text-sm">
                          {/* GRID KPI RINGKAS */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Lead periode */}
                            <div className="rounded-xl bg-white shadow-sm p-3">
                              <p className="text-xs font-medium text-gray-500">
                                Lead periode
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {m.leadsPeriod}{" "}
                                <span className="text-xs text-gray-500">
                                  / {m.leadTarget}
                                </span>
                              </p>
                              <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    percent(m.leadTarget, m.leadsPeriod) >= 100
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  )}
                                  style={{
                                    width: `${Math.min(
                                      percent(m.leadTarget, m.leadsPeriod),
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-gray-400">
                                Lifetime: {m.leadsLifetime} lead
                              </p>
                            </div>

                            {/* Closing & revenue */}
                            <div className="rounded-xl bg-white shadow-sm p-3">
                              <p className="text-xs font-medium text-gray-500">
                                Closing & revenue
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {m.closingPeriod} deal
                              </p>
                              <p className="text-sm text-gray-700">
                                {formatRupiah(m.revenuePeriod)}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                Target: {formatRupiah(m.closingTarget)}
                              </p>
                            </div>

                            {/* Aktivitas hari ini */}
                            <div className="rounded-xl bg-white shadow-sm p-3">
                              <p className="text-xs font-medium text-gray-500">
                                Aktivitas hari ini
                              </p>
                              <p className="text-sm text-gray-800 flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                FU selesai:{" "}
                                <span className="font-semibold">
                                  {m.fuDoneToday}
                                </span>
                              </p>
                              <p className="text-sm text-gray-800">
                                Terjadwal:{" "}
                                <span className="font-semibold">
                                  {m.fuScheduledToday}
                                </span>
                              </p>
                              <p className="text-sm text-gray-800 flex items-center gap-1">
                                <Flame className="h-4 w-4 text-red-500" />
                                Terlambat:{" "}
                                <span className="font-semibold text-red-600">
                                  {m.fuOverdue}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* DETAIL LEAD BERMASALAH */}
                          <div className="rounded-xl bg-white shadow-sm p-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-600">
                              Lead bermasalah
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <div className="flex-1 min-w-[110px] rounded-lg bg-red-50 px-3 py-2">
                                <p className="text-xs text-red-700 font-medium">
                                  Overdue
                                </p>
                                <p className="text-sm font-semibold text-red-700">
                                  {m.overdueLeadCount}
                                </p>
                              </div>
                              <div className="flex-1 min-w-[110px] rounded-lg bg-amber-50 px-3 py-2">
                                <p className="text-xs text-amber-700 font-medium">
                                  Hot belum closing
                                </p>
                                <p className="text-sm font-semibold text-amber-700">
                                  {m.hotNotClosedCount}
                                </p>
                              </div>
                              <div className="flex-1 min-w-[110px] rounded-lg bg-slate-50 px-3 py-2">
                                <p className="text-xs text-slate-700 font-medium">
                                  Belum di-follow up
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {m.untouchedLeadCount}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
