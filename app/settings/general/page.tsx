"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type GeneralSettingResponse = {
  companyName: string;
  autoNurturingEnabled: boolean;
  maxIdleHoursBeforeResume: number;
  welcomeMessageEnabled: boolean;
  welcomeMessageTemplate: string | null;
};

const DEFAULT_WELCOME_TEMPLATE =
  "Halo kak {{nama_lead}}, terima kasih sudah menghubungi {{perusahaan}}. Saya {{nama_sales}}. Ada yang bisa saya bantu terkait kebutuhan kakak?";

export default function GeneralSettingPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [autoNurturingEnabled, setAutoNurturingEnabled] = useState(true);
  const [maxIdleHoursBeforeResume, setMaxIdleHoursBeforeResume] =
    useState<string>("48");

  const [welcomeMessageEnabled, setWelcomeMessageEnabled] = useState(true);
  const [welcomeMessageTemplate, setWelcomeMessageTemplate] = useState<string>(
    DEFAULT_WELCOME_TEMPLATE
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSetting() {
      try {
        setLoading(true);
        const res = await fetch("/api/settings/general");
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.message || "Gagal mengambil pengaturan umum.");
        }

        const data = json.data as GeneralSettingResponse;

        if (!cancelled) {
          setCompanyName(data.companyName || "");
          setAutoNurturingEnabled(
            typeof data.autoNurturingEnabled === "boolean"
              ? data.autoNurturingEnabled
              : true
          );
          setMaxIdleHoursBeforeResume(
            data.maxIdleHoursBeforeResume != null
              ? String(data.maxIdleHoursBeforeResume)
              : "48"
          );
          setWelcomeMessageEnabled(
            typeof data.welcomeMessageEnabled === "boolean"
              ? data.welcomeMessageEnabled
              : true
          );
          setWelcomeMessageTemplate(
            data.welcomeMessageTemplate || DEFAULT_WELCOME_TEMPLATE
          );
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Gagal",
            description:
              err?.message || "Terjadi kesalahan saat memuat pengaturan umum.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

      const idleNumber = Number(maxIdleHoursBeforeResume);
      const idleValue =
        !Number.isNaN(idleNumber) && idleNumber > 0 ? idleNumber : 48;

      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          autoNurturingEnabled,
          maxIdleHoursBeforeResume: idleValue,
          welcomeMessageEnabled,
          welcomeMessageTemplate,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menyimpan pengaturan umum.");
      }

      toast({
        title: "Berhasil",
        description: "Pengaturan umum berhasil disimpan.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description:
          err?.message || "Terjadi kesalahan saat menyimpan pengaturan umum.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title="General Setting">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Pengaturan Umum Aplikasi</h2>
          <p className="text-sm text-muted-foreground">
            Atur identitas perusahaan, perilaku auto nurturing, dan pesan
            sambutan WhatsApp untuk lead baru.
          </p>
        </div>

        {/* Grid dua kolom di layar besar */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card Identitas Perusahaan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identitas Perusahaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col min-h-[242px]">
              {loading ? (
                <div className="text-sm text-muted-foreground">
                  Memuat pengaturan...
                </div>
              ) : (
                <>
                  <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">
                      Nama Perusahaan
                    </label>
                    <Input
                      placeholder="Misal: Agile Digital Studio"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nama ini akan digunakan di pesan WhatsApp, misalnya di
                      bagian: <br />
                      <span className="italic">
                        &quot;Halo kak …, terima kasih sudah menghubungi{" "}
                        <b>{companyName || "Perusahaan Kami"}</b>…&quot;
                      </span>
                    </p>
                  </div>

                  {/* Tombol Simpan */}
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card Pengaturan Nurturing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pengaturan Nurturing Otomatis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">
                  Memuat pengaturan...
                </div>
              ) : (
                <>
                  {/* Switch aktif/nonaktif nurturing */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Aktifkan Auto Nurturing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Jika dimatikan, sistem tidak akan mengirim pesan
                        nurturing otomatis ke semua lead, meskipun jadwalnya
                        sudah waktunya.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={autoNurturingEnabled}
                        onCheckedChange={setAutoNurturingEnabled}
                      />
                      <span className="text-sm text-muted-foreground">
                        {autoNurturingEnabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>

                  {/* Batas jam diam sales sebelum nurturing resume */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Diam Berapa Jam sebelum Nurturing Jalan Lagi?
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        className="w-32"
                        value={maxIdleHoursBeforeResume}
                        onChange={(e) =>
                          setMaxIdleHoursBeforeResume(e.target.value)
                        }
                      />
                      <span className="text-sm text-muted-foreground">jam</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contoh: diisi <b>48</b> berarti ketika sales terakhir
                      follow up / chat, nurturing akan <b>pause</b>, lalu jika
                      tidak ada aktivitas selama 48 jam, nurturing
                      akan <b>resume otomatis</b> dan mengirim step berikutnya
                    </p>
                  </div>

                  {/* Tombol Simpan */}
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card Pesan Sambutan WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pengaturan Pesan Sambutan WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">
                  Memuat pengaturan...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Kirim Pesan Sambutan Otomatis
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Jika aktif, saat ada nomor baru pertama kali mengirim
                        WhatsApp ke sales (dan otomatis dibuatkan lead), sistem
                        akan mengirim pesan sambutan ini sekali.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={welcomeMessageEnabled}
                        onCheckedChange={setWelcomeMessageEnabled}
                      />
                      <span className="text-sm text-muted-foreground">
                        {welcomeMessageEnabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Template Pesan Sambutan
                    </label>
                    <Textarea
                      rows={6}
                      value={welcomeMessageTemplate}
                      onChange={(e) =>
                        setWelcomeMessageTemplate(e.target.value)
                      }
                      placeholder={DEFAULT_WELCOME_TEMPLATE}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kamu bisa pakai placeholder:
                      <br />
                      <code className="rounded bg-muted px-1 py-0.5">
                        {"{{nama_sales}}"}
                      </code>{" "}
                      = nama sales pemilik nomor WA
                      <br />
                      <code className="rounded bg-muted px-1 py-0.5">
                        {"{{perusahaan}}"}
                      </code>{" "}
                      = nama perusahaan dari pengaturan di atas
                    </p>
                  </div>

                  {/* Tombol Simpan */}
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
