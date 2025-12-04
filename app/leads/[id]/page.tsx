// import { DashboardLayout } from "@/components/layout/dashboard-layout"
// import { LeadDetailHeader } from "@/components/leads/lead-detail-header"
// import { LeadDetailTabs } from "@/components/leads/lead-detail-tabs"

// export default function LeadDetailPage() {
//   return (
//     <DashboardLayout title="Lead Detail" role="sales" showBack>
//       <div className="space-y-6">
//         <LeadDetailHeader leadName="Budi Permana" status="hot" product="Premium Package" phone="+62 812 3456 7890" />

//         <LeadDetailTabs />
//       </div>
//     </DashboardLayout>
//   )
// }

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  MessageCircle,
  ArrowLeft,
  ArrowUpRight,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type LeadStatus = "new" | "cold" | "warm" | "hot" | "won" | "lost";

type StageCode =
  | "kontak-awal"
  | "meeting"
  | "penawaran"
  | "negosiasi"
  | "closing"
  | "pembayaran"
  | "implementasi"
  | "pendampingan"
  | "evaluasi";

type ChatFrom = "client" | "sales";

interface ChatMessage {
  id: string;
  from: ChatFrom;
  text: string;
  time: string;
  isTemplate?: boolean;
}

const dummyChats: ChatMessage[] = [
  {
    id: "1",
    from: "client",
    text: "Halo mas, boleh dijelaskan lagi soal fitur tagihan otomatisnya?",
    time: "09:15",
  },
  {
    id: "2",
    from: "sales",
    text: "Siap Pak Budi, sistem kami kirim WA otomatis sebelum jatuh tempo.",
    time: "09:17",
  },
  {
    id: "3",
    from: "client",
    text: "Kalau untuk 200 pelanggan aktif, kisaran biayanya berapa ya?",
    time: "09:20",
  },
];

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params.id;

  const [profileCompletion] = useState(72);
  const [status, setStatus] = useState<LeadStatus>("warm");
  const [stage, setStage] = useState<StageCode>("negosiasi");
  const [chatInput, setChatInput] = useState("");

  const statusLabelMap: Record<LeadStatus, string> = {
    new: "Lead Baru",
    cold: "Tidak Aktif (Cold)",
    warm: "Prospek (Warm)",
    hot: "Siap Closing (Hot)",
    won: "Berhasil (Close Won)",
    lost: "Gagal (Close Lost)",
  };

  const stageLabelMap: Record<StageCode, string> = {
    "kontak-awal": "Kontak Awal",
    meeting: "Meeting / Zoom",
    penawaran: "Penawaran",
    negosiasi: "Negosiasi Harga",
    closing: "Kesepakatan (Closing)",
    pembayaran: "Pembayaran",
    implementasi: "Implementasi",
    pendampingan: "Pendampingan",
    evaluasi: "Evaluasi & Kepuasan",
  };

  function getStatusBadgeClass(s: LeadStatus) {
    switch (s) {
      case "new":
        return "bg-slate-200 text-slate-800";
      case "cold":
        return "bg-slate-700 text-slate-50";
      case "warm":
        return "bg-amber-500 text-white";
      case "hot":
        return "bg-red-500 text-white";
      case "won":
        return "bg-emerald-500 text-white";
      case "lost":
        return "bg-rose-500 text-white";
      default:
        return "";
    }
  }

  const handleSend = () => {
    if (!chatInput.trim()) return;
    // TODO: kirim ke API WA
    console.log("Send WA:", chatInput, "to lead:", leadId);
    setChatInput("");
  };

  const handleQuickStatus = (s: LeadStatus) => {
    setStatus(s);
    // TODO: update ke API lead
  };

  return (
    <DashboardLayout title="Leads">
      <div className="flex min-h-[100vh] flex-col bg-background">
        {/* ====== APP BAR (PWA style) ====== */}
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-2">
              {/* tombol back di mobile */}
              <Button
                size="icon"
                variant="ghost"
                className="mr-1 h-8 w-8 rounded-full md:hidden"
                onClick={() => history.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-semibold leading-tight sm:text-base">
                  PT Sumber Air Sejahtera
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  PIC: Budi Santoso • Lead #{leadId}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="outline" size="sm">
                <MessageCircle className="mr-1 h-4 w-4" />
                Buka WA Web
              </Button>
              <Button size="sm">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                Tambah Aktivitas
              </Button>
            </div>
          </div>
        </header>

        {/* ====== CONTENT WRAPPER ====== */}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 pb-20 pt-3 sm:px-4 md:pb-6">
          {/* HEADER RINGKASAN (di bawah app bar, tetap muncul di desktop) */}
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                B
              </div>
              <div>
                <p className="text-sm font-semibold sm:text-base">
                  Budi Santoso
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Direktur Operasional • PT Sumber Air Sejahtera
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[11px]">
                    Instagram Ads
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    Jakarta Timur
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-64">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>Kelengkapan profil</span>
                <span>{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} />
              <div className="flex flex-wrap gap-1 text-[10px]">
                <Badge variant="secondary">✔ WA</Badge>
                <Badge variant="secondary">✔ Email</Badge>
                <Badge variant="outline">⚠ Alamat</Badge>
                <Badge variant="outline">✖ Budget</Badge>
              </div>
            </div>
          </section>

          {/* ====== GRID DESKTOP / SINGLE COLUMN MOBILE ====== */}
          <section className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
            {/* KIRI: DETAIL + TAB + CHAT */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">
                    Detail & Interaksi Lead
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-3 w-full justify-start overflow-x-auto">
                      <TabsTrigger
                        value="overview"
                        className="text-xs sm:text-sm"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="activity"
                        className="text-xs sm:text-sm"
                      >
                        Aktivitas
                      </TabsTrigger>
                      <TabsTrigger
                        value="whatsapp"
                        className="text-xs sm:text-sm"
                      >
                        WhatsApp
                      </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW */}
                    <TabsContent value="overview" className="space-y-4 text-sm">
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Informasi Kontak
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InfoRow label="Nama PIC" value="Budi Santoso" />
                          <InfoRow label="WhatsApp" value="+62 812-3456-7890" />
                          <InfoRow label="Email" value="budi@pt-sas.com" />
                          <InfoRow label="Kota" value="Jakarta Timur" />
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Perusahaan
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InfoRow
                            label="Nama"
                            value="PT Sumber Air Sejahtera"
                          />
                          <InfoRow
                            label="Bidang"
                            value="Distribusi Air & Pompa"
                          />
                          <InfoRow label="Website" value="pt-sas.com" />
                          <InfoRow label="Skala" value="50–100 karyawan" />
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Kebutuhan & Potensi
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InfoRow
                            label="Kebutuhan utama"
                            value="Otomasi penagihan & monitoring pelanggan."
                          />
                          <InfoRow
                            label="Budget estimasi"
                            value="Rp 15–25 juta / tahun"
                          />
                          <InfoRow label="Timeline" value="3–6 bulan" />
                        </div>
                      </div>
                    </TabsContent>

                    {/* AKTIVITAS */}
                    <TabsContent value="activity" className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          Riwayat aktivitas
                        </p>
                        <Button size="sm" variant="outline">
                          Tambah Aktivitas
                        </Button>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <p className="font-medium">
                            Zoom demo awal (NataBanyu)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            2 Des 2025 • 10:00 • 60 menit
                          </p>
                        </li>
                        <li>
                          <p className="font-medium">Kirim proposal</p>
                          <p className="text-xs text-muted-foreground">
                            2 Des 2025 • 14:30
                          </p>
                        </li>
                        <li>
                          <p className="font-medium">
                            Follow up WhatsApp (tanya feedback)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            3 Des 2025 • 09:10
                          </p>
                        </li>
                      </ul>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Catatan internal
                        </p>
                        <Textarea
                          rows={4}
                          placeholder="Contoh: Owner tertarik paket profesional, tapi minta simulasi ROI untuk 200 pelanggan aktif."
                        />
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline">
                            Simpan Catatan
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* WHATSAPP (MIRROR) */}
                    <TabsContent value="whatsapp" className="space-y-3 text-sm">
                      {/* Ringkasan WA */}
                      <div className="flex flex-col gap-2 rounded-md bg-muted/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-700">
                            WA
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Chat dengan Budi Santoso
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              +62 812-3456-7890 • Terakhir aktif 5 menit lalu
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                          >
                            <Phone className="mr-1 h-3 w-3" />
                            Telepon
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            Template
                          </Button>
                        </div>
                      </div>

                      {/* Quick update status dari area chat */}
                      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background/80 p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            Status:
                          </span>
                          <Badge
                            className={`rounded-full px-2 py-0.5 text-[11px] ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {statusLabelMap[status]}
                          </Badge>
                        </div>
                        <div className="hidden h-4 w-px bg-border sm:block" />
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[11px] text-muted-foreground">
                            Quick update:
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => handleQuickStatus("warm")}
                          >
                            Warm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => handleQuickStatus("hot")}
                          >
                            Hot
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => handleQuickStatus("won")}
                          >
                            Close Won
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => handleQuickStatus("lost")}
                          >
                            Close Lost
                          </Button>
                        </div>
                      </div>

                      {/* Panel chat */}
                      <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-2 sm:p-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            Tahap penjualan:{" "}
                            <span className="font-medium text-foreground">
                              {stageLabelMap[stage]}
                            </span>
                          </span>
                          <span>Log percakapan WA</span>
                        </div>
                        <div className="h-[320px] rounded-md bg-background/90 p-2 shadow-inner sm:h-[380px]">
                          <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1 text-sm">
                            {dummyChats.map((m) => {
                              const isSales = m.from === "sales";
                              return (
                                <div
                                  key={m.id}
                                  className={`flex ${
                                    isSales ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                                      isSales
                                        ? "rounded-br-sm bg-emerald-500 text-white"
                                        : "rounded-bl-sm bg-muted text-foreground"
                                    }`}
                                  >
                                    <p className="whitespace-pre-line">
                                      {m.text}
                                    </p>
                                    <div className="mt-1 flex justify-between text-[10px] opacity-70">
                                      <span>{m.time}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Input bar */}
                        <div className="mt-1 flex flex-col gap-2">
                          <Textarea
                            rows={2}
                            className="text-sm"
                            placeholder="Ketik pesan untuk lead ini..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              <span>Shortcut:</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px]"
                              >
                                Kirim proposal
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px]"
                              >
                                Follow up
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleSend}
                              disabled={!chatInput.trim()}
                            >
                              <Send className="mr-1 h-4 w-4" />
                              Kirim ke WhatsApp
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* KANAN: TAHAP / STATUS / TINDAK LANJUT (di mobile tetap tampil setelah konten kiri) */}
            <div className="space-y-4">
              {/* Tahap penjualan */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tahap Penjualan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Tahap saat ini
                      </p>
                      <p className="text-sm font-medium">
                        {stageLabelMap[stage]}
                      </p>
                    </div>
                    <Select
                      value={stage}
                      onValueChange={(v: StageCode) => setStage(v)}
                    >
                      <SelectTrigger className="w-full sm:w-[210px]">
                        <SelectValue placeholder="Pilih tahap" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kontak-awal">Kontak Awal</SelectItem>
                        <SelectItem value="meeting">Meeting / Zoom</SelectItem>
                        <SelectItem value="penawaran">Penawaran</SelectItem>
                        <SelectItem value="negosiasi">
                          Negosiasi Harga
                        </SelectItem>
                        <SelectItem value="closing">
                          Kesepakatan (Closing)
                        </SelectItem>
                        <SelectItem value="pembayaran">Pembayaran</SelectItem>
                        <SelectItem value="implementasi">
                          Implementasi
                        </SelectItem>
                        <SelectItem value="pendampingan">
                          Pendampingan
                        </SelectItem>
                        <SelectItem value="evaluasi">
                          Evaluasi & Kepuasan
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                      Perjalanan lead
                    </p>
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {Object.entries(stageLabelMap).map(
                        ([code, label], idx) => {
                          const passed =
                            Object.keys(stageLabelMap).indexOf(code) <=
                            Object.keys(stageLabelMap).indexOf(stage);
                          return (
                            <Badge
                              key={code}
                              variant={passed ? "default" : "outline"}
                              className="rounded-full px-2 py-0.5"
                            >
                              {idx + 1}. {label}
                            </Badge>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Di tahap ini sejak 2 Des 2025 • Estimasi closing{" "}
                    <span className="font-semibold text-foreground">70%</span>
                  </p>
                </CardContent>
              </Card>

              {/* Status lead */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Status saat ini
                      </p>
                      <Badge
                        className={`rounded-full px-3 py-0.5 text-xs ${getStatusBadgeClass(
                          status
                        )}`}
                      >
                        {statusLabelMap[status]}
                      </Badge>
                    </div>
                    <Select
                      value={status}
                      onValueChange={(v: LeadStatus) => setStatus(v)}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Lead Baru</SelectItem>
                        <SelectItem value="cold">Tidak Aktif (Cold)</SelectItem>
                        <SelectItem value="warm">Prospek (Warm)</SelectItem>
                        <SelectItem value="hot">Siap Closing (Hot)</SelectItem>
                        <SelectItem value="won">
                          Berhasil (Close Won)
                        </SelectItem>
                        <SelectItem value="lost">Gagal (Close Lost)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Terakhir diupdate: 3 Des 2025 oleh Andi
                  </p>
                </CardContent>
              </Card>

              {/* Tindak lanjut */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tindak Lanjut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Follow up berikutnya
                      </p>
                      <Select defaultValue="fu2">
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder="Pilih follow up" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fu1">Follow Up 1</SelectItem>
                          <SelectItem value="fu2">Follow Up 2</SelectItem>
                          <SelectItem value="fu3">Follow Up 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          Tanggal
                        </p>
                        <Input type="date" className="mt-1 h-9 text-xs" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Jam</p>
                        <Input type="time" className="mt-1 h-9 text-xs" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Channel
                      </p>
                      <Select defaultValue="wa">
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder="Pilih channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wa">WhatsApp</SelectItem>
                          <SelectItem value="call">Telepon</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="visit">Kunjungan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Next action:{" "}
                    <span className="font-medium text-foreground">
                      Follow Up 2 via WhatsApp
                    </span>{" "}
                    pada 5 Des 2025 10:00
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Simpan Tindak Lanjut</Button>
                    <Button size="sm" variant="outline">
                      Tandai Selesai
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        {/* ====== BOTTOM ACTION BAR (MOBILE PWA) ====== */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-3 py-2 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
            <div className="flex flex-col">
              <p className="text-[11px] text-muted-foreground">Status lead</p>
              <div className="flex items-center gap-2">
                <Badge
                  className={`rounded-full px-2 py-0.5 text-[11px] ${getStatusBadgeClass(
                    status
                  )}`}
                >
                  {statusLabelMap[status]}
                </Badge>
                <Select
                  value={status}
                  onValueChange={(v: LeadStatus) => setStatus(v)}
                >
                  <SelectTrigger className="h-7 w-[130px] text-[11px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Lead Baru</SelectItem>
                    <SelectItem value="cold">Tidak Aktif</SelectItem>
                    <SelectItem value="warm">Prospek (Warm)</SelectItem>
                    <SelectItem value="hot">Siap Closing</SelectItem>
                    <SelectItem value="won">Close Won</SelectItem>
                    <SelectItem value="lost">Close Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="h-9 px-3 text-xs">
              <MessageCircle className="mr-1 h-4 w-4" />
              Buka Chat WA
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xs sm:text-sm">{value}</p>
    </div>
  );
}
