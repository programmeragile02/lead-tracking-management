"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type LeadTargetSettingResponse = {
  leadTargetPerDay: number;
  closingTargetAmount: string;
};

// helper: format angka dengan titik ribuan (1.000.000)
function formatNumberWithDots(value: string): string {
  if (!value) return "";
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("id-ID");
}

export default function TargetLeadSettingPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [leadTargetPerDay, setLeadTargetPerDay] = useState("");
  // raw digit only, misal "1000000"
  const [closingTargetRaw, setClosingTargetRaw] = useState("");

  // load setting saat pertama kali
  useEffect(() => {
    let cancelled = false;

    async function loadSetting() {
      try {
        setLoading(true);
        const res = await fetch("/api/settings/lead-target");
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.message || "Gagal mengambil pengaturan.");
        }

        const data = json.data as LeadTargetSettingResponse;
        if (!cancelled) {
          setLeadTargetPerDay(
            data.leadTargetPerDay != null ? String(data.leadTargetPerDay) : ""
          );

          // ambil hanya bagian integer dari decimal (misal "1000000.00" → "1000000")
          const raw =
            data.closingTargetAmount != null
              ? data.closingTargetAmount.split(".")[0].replace(/\D/g, "")
              : "";

          setClosingTargetRaw(raw);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Gagal",
            description:
              err?.message || "Terjadi kesalahan saat memuat pengaturan.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSetting();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function handleSave() {
    try {
      setSaving(true);

      const res = await fetch("/api/settings/lead-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadTargetPerDay: leadTargetPerDay ? Number(leadTargetPerDay) : 0,
          // kirim raw digit ke backend, bukan yang sudah diberi titik
          closingTargetAmount: closingTargetRaw || "0",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menyimpan pengaturan.");
      }

      toast({
        title: "Berhasil",
        description:
          "Pengaturan target global berhasil disimpan. Semua sales akan menggunakan target ini sebagai acuan.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menyimpan pengaturan.",
      });
    } finally {
      setSaving(false);
    }
  }

  // handler untuk input nominal closing
  function handleClosingChange(e: React.ChangeEvent<HTMLInputElement>) {
    // buang semua karakter non-digit
    const raw = e.target.value.replace(/\D/g, "");
    setClosingTargetRaw(raw);
  }

  return (
    <DashboardLayout title="Setting Target Lead" role="manager">
      <div className="max-w-xl space-y-4">
        <div className="flex items-start gap-2">
          <div>
            <h2 className="text-2xl font-semibold">Target Lead & Closing</h2>
            <p className="text-sm text-muted-foreground">
              Pengaturan ini berlaku untuk{" "}
              <span className="font-medium">semua sales</span>. Target digunakan
              sebagai acuan monitoring performa, bukan sebagai batasan input.
              Sales tetap bisa input lead lebih atau kurang dari target.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pengaturan Target Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">
                Memuat pengaturan...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Target Lead per Hari
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Contoh: 5"
                    value={leadTargetPerDay}
                    onChange={(e) => setLeadTargetPerDay(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ini adalah jumlah lead baru per hari yang <b>diharapkan</b>{" "}
                    dari setiap sales. Pencapaian akan dihitung dari lead yang
                    diinput oleh masing-masing sales per hari. Sales tetap bisa
                    input lebih atau kurang dari angka ini.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Target Nominal Closing per Bulan (Rp)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 1.000.000"
                    // tampilkan sudah diformat (1.000.000) tapi state-nya tetap raw (1000000)
                    value={formatNumberWithDots(closingTargetRaw)}
                    onChange={handleClosingChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ketik angka saja, sistem akan otomatis menambah tanda titik
                    ribuan (misal: <b>1000000</b> → <b>1.000.000</b>).
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
