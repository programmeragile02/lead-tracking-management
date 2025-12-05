"use client";

import useSWR from "swr";
import Image from "next/image";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type WaQrResponse = {
  ok: boolean;
  status: string;
  qrDataUrl: string | null;
  phoneNumber?: string | null;
};

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .catch((err) => {
      console.error("[WA QR] fetch error", err);
      return { ok: false };
    });

export default function WhatsappConnectPage() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data, isLoading, mutate } = useSWR<WaQrResponse>(
    "/api/whatsapp/qr",
    fetcher,
    {
      refreshInterval: 4000,
      revalidateOnFocus: true,
    }
  );

  const statusLabel = useMemo(() => {
    const s = data?.status;
    if (!s) return "Memeriksa...";
    if (s === "CONNECTED") return "Terhubung";
    if (s === "PENDING_QR") return "Menunggu Scan";
    if (s === "DISCONNECTED") return "Terputus";
    if (s === "ERROR") return "Error";
    return s;
  }, [data?.status]);

  const statusVariant = useMemo<
    "outline" | "default" | "secondary" | "destructive"
  >(() => {
    const s = data?.status;
    if (!s) return "secondary";
    if (s === "CONNECTED") return "default";
    if (s === "PENDING_QR") return "outline";
    if (s === "DISCONNECTED") return "secondary";
    if (s === "ERROR") return "destructive";
    return "secondary";
  }, [data?.status]);

  const isConnected = data?.status === "CONNECTED";

  async function handleManualRefresh() {
    try {
      setRefreshing(true);
      console.log("[WA UI] manual refresh");
      await mutate();
    } catch (err) {
      console.error("[WA UI] refresh error", err);
      toast({
        variant: "destructive",
        title: "Gagal memperbarui status",
        description: "Terjadi kesalahan saat mengambil status WhatsApp.",
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      console.log("[WA UI] logout clicked");
      const res = await fetch("/api/whatsapp/logout", {
        method: "POST",
      });
      const json = await res.json();
      console.log("[WA UI] logout response", json);

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "logout_failed");
      }

      toast({
        title: "Koneksi diputus",
        description: "WhatsApp kamu sudah diputus. Silakan scan ulang QR.",
      });

      await mutate(); // refresh status/QR
    } catch (err: any) {
      console.error("[WA UI] logout error", err);
      toast({
        variant: "destructive",
        title: "Gagal memutus koneksi",
        description: err?.message ?? "Terjadi kesalahan saat logout.",
      });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <DashboardLayout title="Koneksi WhatsApp" role="sales">
      <div className="mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hubungkan WhatsApp Kamu
          </h1>
        </div>

        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                <span>WhatsApp Sales</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Satu akun WhatsApp untuk satu akun sales
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={statusVariant} className="text-xs">
                {statusLabel}
              </Badge>
              {data?.phoneNumber && (
                <span className="text-xs text-muted-foreground">
                  Nomor terhubung:{" "}
                  <span className="font-medium">+{data.phoneNumber}</span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Menyiapkan koneksi WhatsApp...
                </p>
              </div>
            )}

            {!isLoading && isConnected && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <div className="space-y-1 text-center">
                  <p className="font-medium">
                    WhatsApp kamu sudah terhubung
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Kamu bisa langsung mulai chat dari halaman detail lead.
                    Semua pesan yang masuk ke nomor ini akan otomatis dimirror
                    ke sistem.
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Periksa Ulang Status
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Putuskan Koneksi
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && !isConnected && (
              <div className="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,3fr)] items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-52 h-52 rounded-xl border flex items-center justify-center overflow-hidden bg-muted",
                      !data?.qrDataUrl && "border-dashed"
                    )}
                  >
                    {data?.qrDataUrl ? (
                      <Image
                        src={data.qrDataUrl}
                        alt="QR WhatsApp"
                        width={208}
                        height={208}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center px-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Menunggu QR dari WhatsApp...
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh QR
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <p className="font-medium">Cara menghubungkan:</p>
                  <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                    <li>Buka aplikasi WhatsApp di HP kamu.</li>
                    <li>
                      Masuk ke{" "}
                      <span className="font-medium">
                        Menu ⋮ &gt; Perangkat Tertaut
                      </span>{" "}
                      (atau <span className="font-medium">Linked Devices</span>
                      ).
                    </li>
                    <li>Tap tombol untuk menautkan perangkat baru.</li>
                    <li>Scan QR code yang muncul di halaman ini.</li>
                  </ol>
                  <p className="text-xs text-muted-foreground pt-1">
                    Setelah berhasil, status di atas akan berubah menjadi{" "}
                    <span className="font-semibold">Terhubung</span>. Pastikan
                    koneksi internet perangkat stabil.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
