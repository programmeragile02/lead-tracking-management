// "use client";

// import { useMemo, useState } from "react";
// import { useParams } from "next/navigation";
// import useSWR from "swr";

// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";

// import {
//   MessageCircle,
//   ArrowLeft,
//   ArrowUpRight,
//   Phone,
//   Send,
//   Sparkles,
//   CheckCircle2,
//   Circle,
//   Clock3,
//   ChevronDown,
//   ChevronUp,
//   Loader2,
// } from "lucide-react";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { useToast } from "@/hooks/use-toast";

// type LeadStatusUi = "new" | "cold" | "warm" | "hot" | "won" | "lost";

// type StageCode =
//   | "kontak-awal"
//   | "meeting"
//   | "penawaran"
//   | "negosiasi"
//   | "closing"
//   | "pembayaran"
//   | "implementasi"
//   | "pendampingan"
//   | "evaluasi";

// type ChatFrom = "client" | "sales";

// interface ChatMessageUi {
//   id: string | number;
//   from: ChatFrom;
//   text: string;
//   time: string;
// }

// interface StageWithMeta {
//   code: StageCode;
//   label: string;
//   description?: string;
//   completedAt?: string | null;
// }

// interface LeadDetailResponse {
//   ok: boolean;
//   data?: {
//     lead: any;
//     products: { id: number; name: string }[];
//     profileCompletion: number;
//     dynamicFields: any[];
//   };
// }

// interface LeadMessagesResponse {
//   ok: boolean;
//   data?: {
//     id: number;
//     content: string;
//     direction: "INBOUND" | "OUTBOUND";
//     createdAt: string;
//   }[];
// }

// const fetcher = (url: string) => fetch(url).then((r) => r.json());

// export default function LeadDetailPage() {
//   const params = useParams<{ id: string }>();
//   const leadId = params.id;
//   const { toast } = useToast();

//   const {
//     data: detailRes,
//     isLoading: detailLoading,
//     mutate: mutateDetail,
//   } = useSWR<LeadDetailResponse>(`/api/leads/${leadId}/detail`, fetcher);

//   const {
//     data: messagesRes,
//     isLoading: messagesLoading,
//     mutate: mutateMessages,
//   } = useSWR<LeadMessagesResponse>(`/api/leads/${leadId}/messages`, fetcher, {
//     refreshInterval: 4000,
//   });

//   const lead = detailRes?.data?.lead;
//   const products = detailRes?.data?.products ?? [];
//   const profileCompletion = detailRes?.data?.profileCompletion ?? 0;

//   // local state
//   const [status, setStatus] = useState<LeadStatusUi>("warm");
//   const [followUpStep, setFollowUpStep] = useState("fu2");
//   const [followUpDate, setFollowUpDate] = useState("");
//   const [followUpTime, setFollowUpTime] = useState("");
//   const [followUpChannel, setFollowUpChannel] = useState("wa");
//   const [followUpNote, setFollowUpNote] = useState("");
//   const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

//   const [chatInput, setChatInput] = useState("");
//   const [sending, setSending] = useState(false);
//   const [updatingProduct, setUpdatingProduct] = useState(false);

//   // Tahapan: untuk sekarang masih dummy timeline
//   const [stages, setStages] = useState<StageWithMeta[]>(() => {
//     const nowIso = new Date().toISOString();
//     return [
//       {
//         code: "kontak-awal",
//         label: "Kontak Awal",
//         description: "Lead pertama kali masuk / dihubungi.",
//         completedAt: nowIso,
//       },
//       {
//         code: "meeting",
//         label: "Meeting / Zoom",
//         description: "Diskusi kebutuhan lebih detail.",
//         completedAt: null,
//       },
//       {
//         code: "penawaran",
//         label: "Penawaran",
//         description: "Proposal / penawaran harga dikirim.",
//         completedAt: null,
//       },
//       {
//         code: "negosiasi",
//         label: "Negosiasi Harga",
//         description: "Diskusi harga & skema kerja sama.",
//         completedAt: null,
//       },
//       {
//         code: "closing",
//         label: "Kesepakatan (Closing)",
//         description: "Deal disepakati, menunggu pembayaran.",
//         completedAt: null,
//       },
//       {
//         code: "pembayaran",
//         label: "Pembayaran",
//         description: "Pembayaran diterima / terkonfirmasi.",
//         completedAt: null,
//       },
//       {
//         code: "implementasi",
//         label: "Implementasi",
//         description: "Setup awal & onboarding.",
//         completedAt: null,
//       },
//       {
//         code: "pendampingan",
//         label: "Pendampingan",
//         description: "Masa pendampingan berjalan.",
//         completedAt: null,
//       },
//       {
//         code: "evaluasi",
//         label: "Evaluasi & Kepuasan",
//         description: "Cek kepuasan & peluang upsell.",
//         completedAt: null,
//       },
//     ];
//   });

//   const [timelineExpanded, setTimelineExpanded] = useState(false);

//   const currentStageIndex = useMemo(() => {
//     const idx = stages.findIndex((s) => !s.completedAt);
//     return idx === -1 ? stages.length - 1 : idx;
//   }, [stages]);

//   const currentStage = stages[currentStageIndex];
//   const currentStageCode = currentStage.code;

//   const lastCompletedStage = useMemo(() => {
//     const done = stages.filter((s) => s.completedAt);
//     if (!done.length) return null;
//     return done[done.length - 1];
//   }, [stages]);

//   const statusLabelMap: Record<LeadStatusUi, string> = {
//     new: "Lead Baru",
//     cold: "Tidak Aktif (Cold)",
//     warm: "Prospek (Warm)",
//     hot: "Siap Closing (Hot)",
//     won: "Berhasil (Close Won)",
//     lost: "Gagal (Close Lost)",
//   };

//   function getStatusBadgeClass(s: LeadStatusUi) {
//     switch (s) {
//       case "new":
//         return "bg-slate-200 text-slate-800";
//       case "cold":
//         return "bg-slate-700 text-slate-50";
//       case "warm":
//         return "bg-amber-500 text-white";
//       case "hot":
//         return "bg-red-500 text-white";
//       case "won":
//         return "bg-emerald-500 text-white";
//       case "lost":
//         return "bg-rose-500 text-white";
//       default:
//         return "";
//     }
//   }

//   const chatMessages: ChatMessageUi[] = useMemo(() => {
//     if (!messagesRes?.ok || !messagesRes.data) return [];
//     return messagesRes.data.map((m) => ({
//       id: m.id,
//       from: m.direction === "OUTBOUND" ? "sales" : "client",
//       text: m.content,
//       time: formatTime(m.createdAt),
//     }));
//   }, [messagesRes]);

//   const handleSend = async () => {
//     if (!chatInput.trim()) return;
//     try {
//       setSending(true);
//       const res = await fetch(`/api/leads/${leadId}/whatsapp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: chatInput }),
//       });
//       const json = await res.json();
//       if (!res.ok || !json.ok) {
//         throw new Error(json.error || "Gagal mengirim pesan WhatsApp");
//       }
//       setChatInput("");
//       await mutateMessages();
//     } catch (err: any) {
//       console.error(err);
//       toast({
//         variant: "destructive",
//         title: "Gagal mengirim pesan",
//         description: err?.message || "Terjadi kesalahan saat kirim WA.",
//       });
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleQuickStatus = (s: LeadStatusUi) => {
//     setStatus(s);
//     // TODO: update ke API lead.status kalau sudah ada mappingnya
//   };

//   const handleStageDone = (code: StageCode) => {
//     setStages((prev) =>
//       prev.map((s) =>
//         s.code === code && !s.completedAt
//           ? { ...s, completedAt: new Date().toISOString() }
//           : s
//       )
//     );
//   };

//   const handleGoToNextStage = () => {
//     const nextIndex = currentStageIndex + 1;
//     if (nextIndex >= stages.length) return;
//     const nextStage = stages[nextIndex];
//     console.log("Pindah ke tahap berikutnya:", nextStage.code);
//   };

//   const handleSaveFollowUp = () => {
//     console.log("Follow up:", {
//       followUpStep,
//       followUpDate,
//       followUpTime,
//       followUpChannel,
//       followUpNote,
//     });
//     // TODO: kirim ke API follow up
//     setScheduleModalOpen(false);
//   };

//   async function handleChangeProduct(productId: string) {
//     if (!productId) return;
//     try {
//       setUpdatingProduct(true);
//       const res = await fetch(`/api/leads/${leadId}/product`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ productId: Number(productId) }),
//       });
//       const json = await res.json();
//       if (!res.ok || !json.ok) {
//         throw new Error(json.error || "Tidak bisa mengubah produk");
//       }
//       toast({
//         title: "Produk diperbarui",
//         description: "Produk untuk lead ini berhasil disimpan.",
//       });
//       await mutateDetail();
//     } catch (err: any) {
//       console.error(err);
//       toast({
//         variant: "destructive",
//         title: "Gagal menyimpan produk",
//         description: err?.message || "Terjadi kesalahan saat update produk.",
//       });
//     } finally {
//       setUpdatingProduct(false);
//     }
//   }

//   const displayName = lead?.name || "Lead Tanpa Nama";
//   const displayPhone = lead?.phone || "-";
//   const displaySource = lead?.source?.name || "Tanpa sumber";
//   const displayCity = lead?.address || "-";
//   const displayProductName = lead?.product?.name || "Belum dipilih";

//   return (
//     <DashboardLayout title="Detail Leads" role="sales">
//       <div className="flex min-h-screen flex-col bg-background">

//         {/* CONTENT */}
//         <main className="mx-auto flex w-full flex-1 flex-col gap-4 px-3 pb-20 pt-3 sm:px-4 md:pb-8">
//           {/* Ringkasan lead */}
//           <section className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center md:justify-between">
//             <div className="flex items-start gap-3">
//               <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-semibold">
//                 {displayName?.charAt(0) || "L"}
//               </div>
//               <div className="space-y-1">
//                 <p className="text-sm font-semibold sm:text-base">
//                   {displayName}
//                 </p>
//                 <p className="text-xs text-muted-foreground sm:text-sm">
//                   {displayProductName} • {displayCity}
//                 </p>
//                 <div className="mt-1 flex flex-wrap gap-1">
//                   <Badge variant="outline" className="text-[11px]">
//                     {displaySource}
//                   </Badge>
//                   <Badge variant="outline" className="text-[11px]">
//                     WA: {displayPhone}
//                   </Badge>
//                 </div>
//               </div>
//             </div>

//             <div className="flex w-full flex-col gap-2 md:w-72">
//               <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
//                 <span>Kelengkapan profil</span>
//                 <span>{profileCompletion}%</span>
//               </div>
//               <Progress value={profileCompletion} className="h-2" />
//               <div className="flex flex-wrap gap-1 text-[11px]">
//                 {/* indikatif saja */}
//                 <Badge variant="secondary">
//                   {lead?.phone ? "✔ WA" : "✖ WA"}
//                 </Badge>
//                 <Badge variant={lead?.address ? "secondary" : "outline"}>
//                   {lead?.address ? "✔ Alamat" : "✖ Alamat"}
//                 </Badge>
//                 <Badge variant={lead?.productId ? "secondary" : "outline"}>
//                   {lead?.productId ? "✔ Produk" : "✖ Produk"}
//                 </Badge>
//                 <Badge variant={lead?.statusId ? "secondary" : "outline"}>
//                   {lead?.statusId ? "✔ Status" : "✖ Status"}
//                 </Badge>
//               </div>
//             </div>
//           </section>

//           {/* 4 CARD ATAS: Tahap / Status / Tindak Lanjut / Produk */}
//           <section className="grid gap-3 md:grid-cols-4">
//             {/* Tahap ringkas */}
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm">Tahap Penjualan</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-xs sm:text-sm">
//                 <div className="space-y-1">
//                   <p className="text-[11px] text-muted-foreground">
//                     Tahap aktif sekarang
//                   </p>
//                   <p className="text-sm font-medium">{currentStage.label}</p>
//                   {currentStage.description && (
//                     <p className="text-[11px] text-muted-foreground">
//                       {currentStage.description}
//                     </p>
//                   )}
//                 </div>

//                 {lastCompletedStage && (
//                   <div className="space-y-0.5">
//                     <p className="text-[11px] text-muted-foreground">
//                       Tahap terakhir yang selesai
//                     </p>
//                     <p className="text-[11px]">
//                       {lastCompletedStage.label} •{" "}
//                       {formatDateTime(lastCompletedStage.completedAt!)}
//                     </p>
//                   </div>
//                 )}

//                 <p className="text-[11px] text-muted-foreground">
//                   Riwayat lengkap tahapan ada di panel kanan WhatsApp (Quick
//                   Tahapan).
//                 </p>
//               </CardContent>
//             </Card>

//             {/* Status lead */}
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm">Status Lead</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-2 text-xs sm:text-sm">
//                 <p className="text-xs text-muted-foreground">Status saat ini</p>
//                 <Badge
//                   className={`rounded-full px-3 py-0.5 text-xs ${getStatusBadgeClass(
//                     status
//                   )}`}
//                 >
//                   {statusLabelMap[status]}
//                 </Badge>
//                 <Select
//                   value={status}
//                   onValueChange={(v: LeadStatusUi) => setStatus(v)}
//                 >
//                   <SelectTrigger className="mt-1 h-9 text-xs">
//                     <SelectValue placeholder="Pilih status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="new">Lead Baru</SelectItem>
//                     <SelectItem value="cold">Tidak Aktif (Cold)</SelectItem>
//                     <SelectItem value="warm">Prospek (Warm)</SelectItem>
//                     <SelectItem value="hot">Siap Closing (Hot)</SelectItem>
//                     <SelectItem value="won">Berhasil (Close Won)</SelectItem>
//                     <SelectItem value="lost">Gagal (Close Lost)</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </CardContent>
//             </Card>

//             {/* Tindak lanjut ringkas */}
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm">Tindak Lanjut</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-xs sm:text-sm">
//                 <div className="space-y-0.5">
//                   <p className="text-xs text-muted-foreground">
//                     Step follow up terakhir
//                   </p>
//                   <p className="text-xs">
//                     {followUpStep === "fu1"
//                       ? "Follow Up 1"
//                       : followUpStep === "fu2"
//                       ? "Follow Up 2"
//                       : "Follow Up 3"}
//                   </p>
//                 </div>
//                 <p className="text-[11px] text-muted-foreground">
//                   Atur jadwal dan detail tindak lanjut cepat dari tab WhatsApp
//                   (tombol “Atur tindak lanjut”).
//                 </p>
//               </CardContent>
//             </Card>

//             {/* Produk */}
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm">Produk yang Diminati</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-2 text-xs sm:text-sm">
//                 <p className="text-xs text-muted-foreground">
//                   Pilih produk utama untuk lead ini.
//                 </p>
//                 <Select
//                   value={lead?.productId ? String(lead.productId) : ""}
//                   onValueChange={handleChangeProduct}
//                   disabled={updatingProduct || detailLoading}
//                 >
//                   <SelectTrigger className="mt-1 h-9 text-xs">
//                     <SelectValue placeholder="Pilih produk" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {products.map((p) => (
//                       <SelectItem key={p.id} value={String(p.id)}>
//                         {p.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 {updatingProduct && (
//                   <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
//                     <Loader2 className="h-3 w-3 animate-spin" />
//                     Menyimpan perubahan...
//                   </p>
//                 )}
//               </CardContent>
//             </Card>
//           </section>

//           {/* DETAIL & INTERAKSI */}
//           <section>
//             <Card className="overflow-hidden">
//               <CardHeader className="pb-0">
//                 <CardTitle className="text-base">
//                   Detail & Interaksi Lead
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="pt-3">
//                 <Tabs defaultValue="whatsapp">
//                   <TabsList className="mb-3 w-full justify-start overflow-x-auto">
//                     <TabsTrigger
//                       value="overview"
//                       className="text-xs sm:text-sm"
//                     >
//                       Overview
//                     </TabsTrigger>
//                     <TabsTrigger
//                       value="activity"
//                       className="text-xs sm:text-sm"
//                     >
//                       Aktivitas
//                     </TabsTrigger>
//                     <TabsTrigger
//                       value="whatsapp"
//                       className="text-xs sm:text-sm"
//                     >
//                       WhatsApp
//                     </TabsTrigger>
//                   </TabsList>

//                   {/* OVERVIEW */}
//                   <TabsContent value="overview" className="space-y-4 text-sm">
//                     <div>
//                       <p className="mb-1 text-xs font-medium text-muted-foreground">
//                         Informasi Kontak
//                       </p>
//                       <div className="grid gap-2 sm:grid-cols-2">
//                         <InfoRow label="Nama PIC" value={displayName} />
//                         <InfoRow label="WhatsApp" value={displayPhone} />
//                         <InfoRow label="Sumber Lead" value={displaySource} />
//                         <InfoRow label="Alamat" value={displayCity} />
//                       </div>
//                     </div>

//                     <div>
//                       <p className="mb-1 text-xs font-medium text-muted-foreground">
//                         Informasi Produk
//                       </p>
//                       <div className="grid gap-2 sm:grid-cols-2">
//                         <InfoRow label="Produk" value={displayProductName} />
//                         <InfoRow
//                           label="Status"
//                           value={lead?.status?.name || "-"}
//                         />
//                       </div>
//                     </div>
//                   </TabsContent>

//                   {/* AKTIVITAS (masih dummy) */}
//                   <TabsContent value="activity" className="space-y-3 text-sm">
//                     <div className="flex items-center justify-between">
//                       <p className="text-xs font-medium text-muted-foreground">
//                         Riwayat aktivitas
//                       </p>
//                       <Button size="sm" variant="outline">
//                         Tambah Aktivitas
//                       </Button>
//                     </div>
//                     <p className="text-xs text-muted-foreground">
//                       Fitur aktivitas detail akan dihubungkan dengan histori
//                       tindak lanjut & timeline pipeline.
//                     </p>
//                   </TabsContent>

//                   {/* WHATSAPP */}
//                   <TabsContent value="whatsapp" className="space-y-3 text-sm">
//                     {/* Info WA header */}
//                     <div className="flex flex-col gap-2 rounded-md bg-muted/60 p-3 md:flex-row md:items-center md:justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-700">
//                           WA
//                         </div>
//                         <div className="space-y-0.5">
//                           <p className="text-sm font-medium">
//                             Chat dengan {displayName}
//                           </p>
//                           <p className="text-[11px] text-muted-foreground">
//                             {displayPhone !== "-"
//                               ? displayPhone
//                               : "Nomor WA belum diisi"}{" "}
//                             • Sinkron dengan WhatsApp sales kamu
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex flex-wrap gap-2">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           className="h-8 px-2 text-xs"
//                         >
//                           <Phone className="mr-1 h-3 w-3" />
//                           Telepon
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           className="h-8 px-2 text-xs"
//                         >
//                           <Sparkles className="mr-1 h-3 w-3" />
//                           Template
//                         </Button>
//                       </div>
//                     </div>

//                     {/* QUICK ACTIONS DI ATAS CHAT */}
//                     <div className="space-y-2 rounded-md border bg-muted/40 p-2">
//                       {/* Quick Status */}
//                       <div className="flex flex-wrap items-center gap-2">
//                         <span className="text-[11px] text-muted-foreground">
//                           Status lead:
//                         </span>
//                         <Badge
//                           className={`rounded-full px-2 py-0.5 text-[11px] ${getStatusBadgeClass(
//                             status
//                           )}`}
//                         >
//                           {statusLabelMap[status]}
//                         </Badge>
//                         <div className="flex flex-wrap gap-1">
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="h-7 px-2 text-[11px]"
//                             onClick={() => handleQuickStatus("warm")}
//                           >
//                             Warm
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="h-7 px-2 text-[11px]"
//                             onClick={() => handleQuickStatus("hot")}
//                           >
//                             Hot
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="h-7 px-2 text-[11px]"
//                             onClick={() => handleQuickStatus("won")}
//                           >
//                             Close Won
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="h-7 px-2 text-[11px]"
//                             onClick={() => handleQuickStatus("lost")}
//                           >
//                             Close Lost
//                           </Button>
//                         </div>
//                       </div>

//                       {/* Quick Tindak Lanjut (buka modal) */}
//                       <div className="flex flex-wrap items-center justify-between gap-2">
//                         <div className="text-[11px] text-muted-foreground">
//                           <div>
//                             Tindak lanjut:{" "}
//                             <span className="font-medium text-foreground">
//                               {followUpStep === "fu1"
//                                 ? "Follow Up 1"
//                                 : followUpStep === "fu2"
//                                 ? "Follow Up 2"
//                                 : "Follow Up 3"}
//                             </span>
//                           </div>
//                           {followUpDate && followUpTime ? (
//                             <div>
//                               Jadwal: {followUpDate} • {followUpTime} (
//                               {followUpChannel.toUpperCase()})
//                             </div>
//                           ) : (
//                             <div>Belum ada jadwal tersimpan.</div>
//                           )}
//                         </div>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           className="h-8 px-3 text-xs"
//                           onClick={() => setScheduleModalOpen(true)}
//                         >
//                           Atur tindak lanjut
//                         </Button>
//                       </div>
//                     </div>

//                     {/* Chat + Quick Tahapan di kanan */}
//                     <div className="flex flex-col gap-3 lg:flex-row">
//                       {/* CHAT PANEL */}
//                       <div className="flex-1 space-y-2">
//                         <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
//                           <span>
//                             Tahap penjualan:{" "}
//                             <span className="font-medium text-foreground">
//                               {currentStage.label}
//                             </span>
//                           </span>
//                           <span>Log percakapan WhatsApp</span>
//                         </div>

//                         <div className="h-[320px] rounded-md border bg-background/90 p-2 shadow-inner sm:h-[380px]">
//                           <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1 text-sm">
//                             {messagesLoading && (
//                               <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
//                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                 Memuat percakapan...
//                               </div>
//                             )}
//                             {!messagesLoading && chatMessages.length === 0 && (
//                               <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
//                                 Belum ada percakapan WhatsApp untuk lead ini.
//                               </div>
//                             )}
//                             {chatMessages.map((m) => {
//                               const isSales = m.from === "sales";
//                               return (
//                                 <div
//                                   key={m.id}
//                                   className={`flex ${
//                                     isSales ? "justify-end" : "justify-start"
//                                   }`}
//                                 >
//                                   <div
//                                     className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
//                                       isSales
//                                         ? "rounded-br-sm bg-emerald-500 text-white"
//                                         : "rounded-bl-sm bg-muted text-foreground"
//                                     }`}
//                                   >
//                                     <p className="whitespace-pre-line">
//                                       {m.text}
//                                     </p>
//                                     <div className="mt-1 flex justify-between text-[10px] opacity-70">
//                                       <span>{m.time}</span>
//                                     </div>
//                                   </div>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         </div>

//                         {/* Input chat */}
//                         <div className="mt-1 flex flex-col gap-2">
//                           <Textarea
//                             rows={2}
//                             className="text-sm"
//                             placeholder="Ketik pesan untuk lead ini..."
//                             value={chatInput}
//                             onChange={(e) => setChatInput(e.target.value)}
//                           />
//                           <div className="flex flex-wrap items-center justify-between gap-2">
//                             <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
//                               <span>Shortcut:</span>
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 className="h-7 px-2 text-[11px]"
//                               >
//                                 Kirim proposal
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 className="h-7 px-2 text-[11px]"
//                               >
//                                 Follow up
//                               </Button>
//                             </div>
//                             <Button
//                               size="sm"
//                               onClick={handleSend}
//                               disabled={!chatInput.trim() || sending}
//                             >
//                               {sending ? (
//                                 <Loader2 className="mr-1 h-4 w-4 animate-spin" />
//                               ) : (
//                                 <Send className="mr-1 h-4 w-4" />
//                               )}
//                               Kirim ke WhatsApp
//                             </Button>
//                           </div>
//                         </div>
//                       </div>

//                       {/* QUICK TAHAPAN DI KANAN */}
//                       <div className="w-full space-y-3 lg:w-72">
//                         <Card>
//                           <CardHeader className="pb-2">
//                             <CardTitle className="text-sm">
//                               Quick Tahapan
//                             </CardTitle>
//                           </CardHeader>
//                           <CardContent className="space-y-2 text-xs sm:text-sm">
//                             <div className="rounded-md border bg-muted/40 p-2 space-y-1.5">
//                               <p className="text-[11px] font-medium">
//                                 Tahap aktif: {currentStage.label}
//                               </p>
//                               {currentStage.completedAt ? (
//                                 <p className="text-[11px] text-muted-foreground">
//                                   Sudah selesai pada{" "}
//                                   {formatDateTime(currentStage.completedAt)}
//                                 </p>
//                               ) : (
//                                 <p className="text-[11px] text-muted-foreground">
//                                   Belum ditandai selesai.
//                                 </p>
//                               )}
//                               <div className="mt-1 flex flex-wrap gap-2">
//                                 {!currentStage.completedAt && (
//                                   <Button
//                                     size="sm"
//                                     className="h-7 px-2 text-[11px]"
//                                     onClick={() =>
//                                       handleStageDone(currentStageCode)
//                                     }
//                                   >
//                                     <CheckCircle2 className="mr-1 h-3 w-3" />
//                                     Tandai selesai
//                                   </Button>
//                                 )}
//                                 <Button
//                                   size="sm"
//                                   variant="outline"
//                                   className="h-7 px-2 text-[11px]"
//                                   onClick={handleGoToNextStage}
//                                 >
//                                   Tahap berikutnya
//                                 </Button>
//                               </div>
//                             </div>

//                             <button
//                               type="button"
//                               className="mt-2 flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/70"
//                               onClick={() =>
//                                 setTimelineExpanded((prev) => !prev)
//                               }
//                             >
//                               <span>
//                                 {timelineExpanded
//                                   ? "Sembunyikan riwayat tahapan"
//                                   : "Lihat riwayat tahapan lengkap"}
//                               </span>
//                               {timelineExpanded ? (
//                                 <ChevronUp className="h-3 w-3" />
//                               ) : (
//                                 <ChevronDown className="h-3 w-3" />
//                               )}
//                             </button>

//                             {timelineExpanded && (
//                               <div className="mt-2 max-h-72 overflow-y-auto rounded-md border bg-background/90 p-2">
//                                 <StageTimeline
//                                   stages={stages}
//                                   onStageDone={handleStageDone}
//                                 />
//                               </div>
//                             )}
//                           </CardContent>
//                         </Card>
//                       </div>
//                     </div>

//                     {/* MODAL TINDAK LANJUT */}
//                     <Dialog
//                       open={scheduleModalOpen}
//                       onOpenChange={setScheduleModalOpen}
//                     >
//                       <DialogContent className="max-w-md">
//                         <DialogHeader>
//                           <DialogTitle>Atur tindak lanjut</DialogTitle>
//                           <DialogDescription>
//                             Tentukan step follow up, jadwal, dan channel tindak
//                             lanjut untuk lead ini.
//                           </DialogDescription>
//                         </DialogHeader>
//                         <div className="mt-3 space-y-3 text-sm">
//                           <div>
//                             <p className="text-xs text-muted-foreground">
//                               Step follow up
//                             </p>
//                             <Select
//                               value={followUpStep}
//                               onValueChange={setFollowUpStep}
//                             >
//                               <SelectTrigger className="mt-1 h-9">
//                                 <SelectValue placeholder="Pilih follow up" />
//                               </SelectTrigger>
//                               <SelectContent>
//                                 <SelectItem value="fu1">Follow Up 1</SelectItem>
//                                 <SelectItem value="fu2">Follow Up 2</SelectItem>
//                                 <SelectItem value="fu3">Follow Up 3</SelectItem>
//                               </SelectContent>
//                             </Select>
//                           </div>

//                           <div className="grid gap-3 sm:grid-cols-2">
//                             <div>
//                               <p className="text-xs text-muted-foreground">
//                                 Tanggal
//                               </p>
//                               <Input
//                                 type="date"
//                                 className="mt-1 h-9"
//                                 value={followUpDate}
//                                 onChange={(e) =>
//                                   setFollowUpDate(e.target.value)
//                                 }
//                               />
//                             </div>
//                             <div>
//                               <p className="text-xs text-muted-foreground">
//                                 Jam
//                               </p>
//                               <Input
//                                 type="time"
//                                 className="mt-1 h-9"
//                                 value={followUpTime}
//                                 onChange={(e) =>
//                                   setFollowUpTime(e.target.value)
//                                 }
//                               />
//                             </div>
//                           </div>

//                           <div>
//                             <p className="text-xs text-muted-foreground">
//                               Channel
//                             </p>
//                             <Select
//                               value={followUpChannel}
//                               onValueChange={setFollowUpChannel}
//                             >
//                               <SelectTrigger className="mt-1 h-9">
//                                 <SelectValue placeholder="Pilih channel" />
//                               </SelectTrigger>
//                               <SelectContent>
//                                 <SelectItem value="wa">WhatsApp</SelectItem>
//                                 <SelectItem value="call">Telepon</SelectItem>
//                                 <SelectItem value="zoom">Zoom</SelectItem>
//                                 <SelectItem value="visit">Kunjungan</SelectItem>
//                               </SelectContent>
//                             </Select>
//                           </div>

//                           <div>
//                             <p className="text-xs text-muted-foreground">
//                               Catatan tindak lanjut
//                             </p>
//                             <Textarea
//                               rows={3}
//                               className="mt-1"
//                               placeholder="Contoh: Follow up final sebelum kirim invoice, pastikan sudah oke dengan paket profesional."
//                               value={followUpNote}
//                               onChange={(e) => setFollowUpNote(e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <DialogFooter className="mt-4">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => setScheduleModalOpen(false)}
//                           >
//                             Batal
//                           </Button>
//                           <Button size="sm" onClick={handleSaveFollowUp}>
//                             Simpan
//                           </Button>
//                         </DialogFooter>
//                       </DialogContent>
//                     </Dialog>
//                   </TabsContent>
//                 </Tabs>
//               </CardContent>
//             </Card>
//           </section>
//         </main>
//       </div>
//     </DashboardLayout>
//   );
// }

// /* ==== helper components ==== */

// function InfoRow({ label, value }: { label: string; value: string }) {
//   return (
//     <div>
//       <p className="text-[11px] text-muted-foreground">{label}</p>
//       <p className="text-xs sm:text-sm">{value}</p>
//     </div>
//   );
// }

// function formatDateTime(iso: string) {
//   const d = new Date(iso);
//   return d.toLocaleString("id-ID", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function formatTime(iso: string) {
//   const d = new Date(iso);
//   return d.toLocaleTimeString("id-ID", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function StageTimeline({
//   stages,
//   onStageDone,
// }: {
//   stages: StageWithMeta[];
//   onStageDone?: (code: StageCode) => void;
// }) {
//   const currentIndex = useMemo(() => {
//     const idx = stages.findIndex((s) => !s.completedAt);
//     return idx === -1 ? stages.length - 1 : idx;
//   }, [stages]);

//   return (
//     <div className="space-y-3">
//       {stages.map((stage, index) => {
//         const isDone = !!stage.completedAt;
//         const isCurrent = !isDone && index === currentIndex;
//         const isFuture = !isDone && index > currentIndex;

//         return (
//           <div key={stage.code} className="flex gap-2">
//             <div className="flex flex-col items-center">
//               <div className="flex h-5 w-5 items-center justify-center rounded-full">
//                 {isDone ? (
//                   <CheckCircle2 className="h-4 w-4 text-emerald-500" />
//                 ) : isCurrent ? (
//                   <Clock3 className="h-4 w-4 text-amber-500" />
//                 ) : (
//                   <Circle className="h-3 w-3 text-muted-foreground" />
//                 )}
//               </div>
//               {index < stages.length - 1 && (
//                 <div className="mt-1 h-full w-px flex-1 bg-border" />
//               )}
//             </div>

//             <div className="pb-3 text-xs">
//               <div className="flex items-center gap-2">
//                 <p
//                   className={`font-medium ${
//                     isDone
//                       ? "text-emerald-600"
//                       : isCurrent
//                       ? "text-foreground"
//                       : "text-muted-foreground"
//                   }`}
//                 >
//                   {index + 1}. {stage.label}
//                 </p>
//                 {isCurrent && (
//                   <Badge className="h-5 px-2 text-[10px]" variant="outline">
//                     Sedang berjalan
//                   </Badge>
//                 )}
//                 {isDone && (
//                   <Badge className="h-5 px-2 text-[10px]" variant="outline">
//                     Selesai
//                   </Badge>
//                 )}
//               </div>
//               {stage.description && (
//                 <p className="text-[11px] text-muted-foreground">
//                   {stage.description}
//                 </p>
//               )}

//               {stage.completedAt ? (
//                 <p className="mt-1 text-[11px] text-muted-foreground">
//                   Selesai: {formatDateTime(stage.completedAt)}
//                 </p>
//               ) : isCurrent && onStageDone ? (
//                 <div className="mt-1">
//                   <Button
//                     size="sm"
//                     className="h-6 px-2 text-[11px]"
//                     onClick={() => onStageDone(stage.code)}
//                   >
//                     <CheckCircle2 className="mr-1 h-3 w-3" />
//                     Tandai tahap ini selesai
//                   </Button>
//                 </div>
//               ) : isFuture ? (
//                 <p className="mt-1 text-[11px] text-muted-foreground">
//                   Belum dimulai.
//                 </p>
//               ) : null}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Phone,
  Send,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock3,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";

type LeadStatusUi = "new" | "cold" | "warm" | "hot" | "won" | "lost";

type ChatFrom = "client" | "sales";

interface ChatMessageUi {
  id: string | number;
  from: ChatFrom;
  text: string;
  time: string;
}

interface StageWithMeta {
  id: number;
  code: string;
  label: string;
  order: number;
  completedAt?: string | null;
}

interface LeadDetailResponse {
  ok: boolean;
  data?: {
    lead: any;
    products: { id: number; name: string }[];
    stages: { id: number; name: string; code: string; order: number }[];
    statuses: { id: number; name: string; code: string; order: number }[];
    profileCompletion: number;
  };
}

interface LeadMessagesResponse {
  ok: boolean;
  data?: {
    id: number;
    content: string;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string;
  }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function mapDbStatusToUi(code?: string | null): LeadStatusUi {
  switch ((code || "").toUpperCase()) {
    case "NEW":
      return "new";
    case "COLD":
      return "cold";
    case "HOT":
      return "hot";
    case "CLOSE_WON":
      return "won";
    case "CLOSE_LOST":
      return "lost";
    case "WARM":
    default:
      return "warm";
  }
}

const statusLabelMap: Record<LeadStatusUi, string> = {
  new: "Baru",
  cold: "Cold",
  warm: "Warm",
  hot: "Hot",
  won: "Close Won",
  lost: "Close Lost",
};

function getStatusBadgeClass(s: LeadStatusUi) {
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

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params.id;
  const { toast } = useToast();

  const {
    data: detailRes,
    isLoading: detailLoading,
    mutate: mutateDetail,
  } = useSWR<LeadDetailResponse>(`/api/leads/${leadId}/detail`, fetcher);

  const {
    data: messagesRes,
    isLoading: messagesLoading,
    mutate: mutateMessages,
  } = useSWR<LeadMessagesResponse>(`/api/leads/${leadId}/messages`, fetcher, {
    refreshInterval: 4000,
  });

  const lead = detailRes?.data?.lead;
  const products = detailRes?.data?.products ?? [];
  const stagesFromApi = detailRes?.data?.stages ?? [];
  const statusesFromApi = detailRes?.data?.statuses ?? [];
  const profileCompletion = detailRes?.data?.profileCompletion ?? 0;

  // === local UI state ===
  const [status, setStatus] = useState<LeadStatusUi>("warm");
  const [followUpStep, setFollowUpStep] = useState("fu2");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState("wa");
  const [followUpNote, setFollowUpNote] = useState("");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [stagesState, setStagesState] = useState<StageWithMeta[] | null>(null);

  // set status awal dari DB
  useEffect(() => {
    if (lead) {
      setStatus(mapDbStatusToUi(lead.status?.code));
    }
  }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // bangun daftar tahapan dari master stage + stageId lead
  const stages: StageWithMeta[] = useMemo(() => {
    if (stagesState) return stagesState;
    if (!stagesFromApi.length) return [];

    const currentStageId: number | null = lead?.stageId ?? null;
    const sorted = [...stagesFromApi].sort(
      (a, b) => a.order - b.order || a.id - b.id
    );

    let passedCurrent = false;
    const nowIso = new Date().toISOString();

    return sorted.map((s) => {
      let completedAt: string | null = null;

      if (currentStageId) {
        if (s.id === currentStageId) {
          passedCurrent = true;
          completedAt = null; // aktif
        } else if (!passedCurrent) {
          // semua sebelum current dianggap "selesai"
          completedAt = nowIso;
        } else {
          completedAt = null;
        }
      }

      return {
        id: s.id,
        code: s.code,
        label: s.name,
        order: s.order,
        completedAt,
      };
    });
  }, [stagesFromApi, lead?.stageId, stagesState]);

  const currentStageIndex = useMemo(() => {
    const idx = stages.findIndex((s) => !s.completedAt);
    return idx === -1 ? stages.length - 1 : idx;
  }, [stages]);

  const currentStage = stages[currentStageIndex];
  const lastCompletedStage = useMemo(() => {
    const done = stages.filter((s) => s.completedAt);
    if (!done.length) return null;
    return done[done.length - 1];
  }, [stages]);

  const chatMessages: ChatMessageUi[] = useMemo(() => {
    if (!messagesRes?.ok || !messagesRes.data) return [];
    return messagesRes.data.map((m) => ({
      id: m.id,
      from: m.direction === "OUTBOUND" ? "sales" : "client",
      text: m.content,
      time: formatTime(m.createdAt),
    }));
  }, [messagesRes]);

  async function handleSend() {
    if (!chatInput.trim()) return;
    try {
      setSending(true);
      const res = await fetch(`/api/leads/${leadId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengirim pesan WhatsApp");
      }
      setChatInput("");
      await mutateMessages();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal mengirim pesan",
        description: err?.message || "Terjadi kesalahan saat kirim WA.",
      });
    } finally {
      setSending(false);
    }
  }

  function handleQuickStatus(s: LeadStatusUi) {
    setStatus(s);
    // kalau nanti mau update ke DB, di sini panggil API /api/leads/[id]/status
  }

  function handleStageDone(code: string) {
    setStagesState((prev) => {
      const base = prev ?? stages;
      return base.map((s) =>
        s.code === code && !s.completedAt
          ? { ...s, completedAt: new Date().toISOString() }
          : s
      );
    });
  }

  function handleGoToNextStage() {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex >= stages.length) return;
    const next = stages[nextIndex];
    console.log("Pindah ke tahap berikutnya:", next.code);
  }

  function handleSaveFollowUp() {
    console.log("Follow up:", {
      followUpStep,
      followUpDate,
      followUpTime,
      followUpChannel,
      followUpNote,
    });
    setScheduleModalOpen(false);
  }

  async function handleChangeProduct(productId: string) {
    if (!productId) return;
    try {
      setUpdatingProduct(true);
      const res = await fetch(`/api/leads/${leadId}/product`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: Number(productId) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Tidak bisa mengubah produk");
      }
      toast({
        title: "Produk diperbarui",
        description: "Produk untuk lead ini berhasil disimpan.",
      });
      await mutateDetail();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan produk",
        description: err?.message || "Terjadi kesalahan saat update produk.",
      });
    } finally {
      setUpdatingProduct(false);
    }
  }

  const displayName = lead?.name || "Lead Tanpa Nama";
  const displayPhone = lead?.phone || "-";
  const displaySource = lead?.source?.name || "Tanpa sumber";
  const displayCity = lead?.address || "-";
  const displayProductName = lead?.product?.name || "Belum dipilih";

  // loading sederhana
  if (detailLoading && !lead) {
    return (
      <DashboardLayout title="Detail Leads" role="sales">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Memuat detail lead...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (!detailRes?.ok || !lead) {
    return (
      <DashboardLayout title="Detail Leads" role="sales">
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Lead tidak ditemukan.
          </span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Detail Leads" role="sales">
      <div className="flex min-h-screen flex-col bg-background">
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 pb-20 pt-4 sm:px-4 md:pb-8">
          {/* RINGKASAN LEAD */}
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold">
                {displayName?.charAt(0) || "L"}
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold sm:text-lg">
                  {displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {displayProductName} • {displayCity}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[11px]">
                    {displaySource}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    WA: {displayPhone}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-72">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Kelengkapan profil</span>
                <span>{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2" />
              <div className="flex flex-wrap gap-1 text-[11px]">
                <Badge variant={lead.phone ? "secondary" : "outline"}>
                  {lead.phone ? "✔ WA" : "✖ WA"}
                </Badge>
                <Badge variant={lead.address ? "secondary" : "outline"}>
                  {lead.address ? "✔ Alamat" : "✖ Alamat"}
                </Badge>
                <Badge variant={lead.productId ? "secondary" : "outline"}>
                  {lead.productId ? "✔ Produk" : "✖ Produk"}
                </Badge>
                <Badge variant={lead.statusId ? "secondary" : "outline"}>
                  {lead.statusId ? "✔ Status" : "✖ Status"}
                </Badge>
              </div>
            </div>
          </section>

          {/* 4 CARD ATAS */}
          <section className="grid gap-3 md:grid-cols-4">
            {/* Tahap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tahap Penjualan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tahap aktif</p>
                  <p className="font-semibold">{currentStage?.label || "-"}</p>
                </div>
                {lastCompletedStage && (
                  <div className="space-y-0.5 text-xs">
                    <p className="text-muted-foreground">
                      Tahap terakhir selesai
                    </p>
                    <p>
                      {lastCompletedStage.label} •{" "}
                      {formatDateTime(lastCompletedStage.completedAt!)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status Lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">Status saat ini</p>
                <Badge
                  className={`rounded-full px-3 py-0.5 text-xs ${getStatusBadgeClass(
                    status
                  )}`}
                >
                  {statusLabelMap[status]}
                </Badge>
                <Select
                  value={status}
                  onValueChange={(v: LeadStatusUi) => setStatus(v)}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusesFromApi.map((s) => (
                      <SelectItem key={s.id} value={mapDbStatusToUi(s.code)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tindak lanjut (masih dummy) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tindak Lanjut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Step follow up terakhir
                  </p>
                  <p className="text-sm">
                    {followUpStep === "fu1"
                      ? "Follow Up 1"
                      : followUpStep === "fu2"
                      ? "Follow Up 2"
                      : "Follow Up 3"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Jadwal & catatan detail diatur dari tab WhatsApp.
                </p>
              </CardContent>
            </Card>

            {/* Produk */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Produk yang Diminati</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  Pilih produk utama lead.
                </p>
                <Select
                  value={lead?.productId ? String(lead.productId) : ""}
                  onValueChange={handleChangeProduct}
                  disabled={updatingProduct || detailLoading}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
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
                {updatingProduct && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Menyimpan perubahan...
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* DETAIL & CHAT */}
          <section>
            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  Detail & Interaksi Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <Tabs defaultValue="whatsapp">
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
                        <InfoRow label="Nama PIC" value={displayName} />
                        <InfoRow label="WhatsApp" value={displayPhone} />
                        <InfoRow label="Sumber Lead" value={displaySource} />
                        <InfoRow label="Alamat" value={displayCity} />
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Informasi Produk
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <InfoRow label="Produk" value={displayProductName} />
                        <InfoRow
                          label="Status"
                          value={lead?.status?.name || "-"}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* AKTIVITAS (placeholder) */}
                  <TabsContent value="activity" className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        Riwayat aktivitas
                      </p>
                      <Button size="sm" variant="outline">
                        Tambah Aktivitas
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nanti dihubungkan dengan histori tindak lanjut & pipeline.
                    </p>
                  </TabsContent>

                  {/* WHATSAPP */}
                  <TabsContent value="whatsapp" className="space-y-3 text-sm">
                    {/* Header WA */}
                    <div className="flex flex-col gap-2 rounded-md bg-muted/60 p-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-700">
                          WA
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            Chat dengan {displayName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {displayPhone !== "-"
                              ? displayPhone
                              : "Nomor WA belum diisi"}{" "}
                            • Sinkron dengan WhatsApp sales
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

                    {/* Quick actions di atas chat */}
                    <div className="space-y-2 rounded-md border bg-muted/40 p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          Status lead:
                        </span>
                        <Badge
                          className={`rounded-full px-2 py-0.5 text-[11px] ${getStatusBadgeClass(
                            status
                          )}`}
                        >
                          {statusLabelMap[status]}
                        </Badge>
                        <div className="flex flex-wrap gap-1">
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

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-muted-foreground">
                          <div>
                            Tindak lanjut:{" "}
                            <span className="font-medium text-foreground">
                              {followUpStep === "fu1"
                                ? "Follow Up 1"
                                : followUpStep === "fu2"
                                ? "Follow Up 2"
                                : "Follow Up 3"}
                            </span>
                          </div>
                          {followUpDate && followUpTime ? (
                            <div>
                              Jadwal: {followUpDate} • {followUpTime} (
                              {followUpChannel.toUpperCase()})
                            </div>
                          ) : (
                            <div>Belum ada jadwal tersimpan.</div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => setScheduleModalOpen(true)}
                        >
                          Atur tindak lanjut
                        </Button>
                      </div>
                    </div>

                    {/* Chat + Quick Tahapan */}
                    <div className="flex flex-col gap-3 lg:flex-row">
                      {/* Chat panel */}
                      <div className="flex-1 space-y-2">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            Tahap penjualan:{" "}
                            <span className="font-medium text-foreground">
                              {currentStage?.label || "-"}
                            </span>
                          </span>
                          <span>Log percakapan WhatsApp</span>
                        </div>

                        <div className="h-[320px] rounded-md border bg-background/90 p-2 shadow-inner sm:h-[380px]">
                          <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1 text-sm">
                            {messagesLoading && (
                              <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memuat percakapan...
                              </div>
                            )}
                            {!messagesLoading && chatMessages.length === 0 && (
                              <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                                Belum ada percakapan WhatsApp untuk lead ini.
                              </div>
                            )}
                            {chatMessages.map((m) => {
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

                        {/* Input chat */}
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
                              disabled={!chatInput.trim() || sending}
                            >
                              {sending ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-4 w-4" />
                              )}
                              Kirim ke WhatsApp
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Tahapan */}
                      <div className="w-full space-y-3 lg:w-72">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Quick Tahapan
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="space-y-1.5 rounded-md border bg-muted/40 p-2">
                              <p className="text-xs font-medium">
                                Tahap aktif: {currentStage?.label || "-"}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {currentStage && !currentStage.completedAt && (
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-[11px]"
                                    onClick={() =>
                                      handleStageDone(currentStage.code)
                                    }
                                  >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Tandai selesai
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={handleGoToNextStage}
                                >
                                  Tahap berikutnya
                                </Button>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="mt-2 flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/70"
                              onClick={() =>
                                setTimelineExpanded((prev) => !prev)
                              }
                            >
                              <span>
                                {timelineExpanded
                                  ? "Sembunyikan riwayat tahapan"
                                  : "Lihat riwayat tahapan lengkap"}
                              </span>
                              {timelineExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>

                            {timelineExpanded && (
                              <div className="mt-2 max-h-72 overflow-y-auto rounded-md border bg-background/90 p-2">
                                <StageTimeline
                                  stages={stages}
                                  onStageDone={handleStageDone}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Modal tindak lanjut */}
                    <Dialog
                      open={scheduleModalOpen}
                      onOpenChange={setScheduleModalOpen}
                    >
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Atur tindak lanjut</DialogTitle>
                          <DialogDescription>
                            Tentukan step dan jadwal follow up.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-3 space-y-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Step follow up
                            </p>
                            <Select
                              value={followUpStep}
                              onValueChange={setFollowUpStep}
                            >
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

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Tanggal
                              </p>
                              <Input
                                type="date"
                                className="mt-1 h-9"
                                value={followUpDate}
                                onChange={(e) =>
                                  setFollowUpDate(e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Jam
                              </p>
                              <Input
                                type="time"
                                className="mt-1 h-9"
                                value={followUpTime}
                                onChange={(e) =>
                                  setFollowUpTime(e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Channel
                            </p>
                            <Select
                              value={followUpChannel}
                              onValueChange={setFollowUpChannel}
                            >
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

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Catatan
                            </p>
                            <Textarea
                              rows={3}
                              className="mt-1"
                              value={followUpNote}
                              onChange={(e) => setFollowUpNote(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScheduleModalOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button size="sm" onClick={handleSaveFollowUp}>
                            Simpan
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </DashboardLayout>
  );
}

/* ==== helper ==== */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StageTimeline({
  stages,
  onStageDone,
}: {
  stages: StageWithMeta[];
  onStageDone?: (code: string) => void;
}) {
  const currentIndex = useMemo(() => {
    const idx = stages.findIndex((s) => !s.completedAt);
    return idx === -1 ? stages.length - 1 : idx;
  }, [stages]);

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const isDone = !!stage.completedAt;
        const isCurrent = !isDone && index === currentIndex;
        const isFuture = !isDone && index > currentIndex;

        return (
          <div key={stage.code} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className="flex h-5 w-5 items-center justify-center rounded-full">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : isCurrent ? (
                  <Clock3 className="h-4 w-4 text-amber-500" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              {index < stages.length - 1 && (
                <div className="mt-1 h-full w-px flex-1 bg-border" />
              )}
            </div>

            <div className="pb-3 text-xs">
              <div className="flex items-center gap-2">
                <p
                  className={`font-medium ${
                    isDone
                      ? "text-emerald-600"
                      : isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {index + 1}. {stage.label}
                </p>
                {isCurrent && (
                  <Badge className="h-5 px-2 text-[10px]" variant="outline">
                    Sedang berjalan
                  </Badge>
                )}
                {isDone && (
                  <Badge className="h-5 px-2 text-[10px]" variant="outline">
                    Selesai
                  </Badge>
                )}
              </div>

              {isFuture && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Belum dimulai.
                </p>
              )}

              {stage.completedAt && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Selesai: {formatDateTime(stage.completedAt)}
                </p>
              )}

              {!stage.completedAt && isCurrent && onStageDone && (
                <div className="mt-1">
                  <Button
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => onStageDone(stage.code)}
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Tandai tahap ini selesai
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
